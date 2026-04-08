import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { load as loadHtml, type CheerioAPI } from "cheerio";
import type { FunctionDefinition } from "moodle-api";
import { z } from "zod";
import { config } from "../config";
import type { MoodleAssignment, MoodleGrade } from "../types";
import { MoodleClient, MoodleAPIError } from "./moodleClient";
import { db } from "./db";
import { logger } from "./logger";

interface Options {
  moodleUserId?: number;
  moodleAuthCookies?: MoodleAuthCookie[];
  moodleSessionCookie?: string;
  moodleSessionKey?: string;
  msAccountId?: string;
}

interface MoodleAuthCookie {
  name: string;
  value: string;
}

function validateForwardedHttpResponseStatus(status: number) {
  return status >= 200 && status < 400;
}

interface MoodleStudentInfo {
  fullname: string;
  username: string; // email
  userId: number;
}

interface MoodleAPIMultiSessionsErrorAccount {
  id: string;
  name: string;
  email: string;
}

export class MoodleAPIMultiSessionsError extends MoodleAPIError<{
  accounts: MoodleAPIMultiSessionsErrorAccount[];
}> {
  constructor(accounts: MoodleAPIMultiSessionsErrorAccount[]) {
    super("Multiple active sessions found on MSOnline page", "multisessions", {
      accounts,
    });
  }
}

const ignoreGradeNames = new Set(["Register(not to edit)"]);

interface GradeBaseData {
  name?: string;
  itemtype: string;
  itemmodule: string | null;
  idnumber?: string;
}

const gradeNamesToBaseData: Record<string, GradeBaseData> = {
  "Register Midterm": {
    itemtype: "manual",
    itemmodule: null,
    idnumber: "register_midterm",
  },
  "Register Endterm": {
    itemtype: "manual",
    itemmodule: null,
    idnumber: "register_endterm",
  },
  "Register Term": {
    itemtype: "manual",
    itemmodule: null,
    idnumber: "register_term",
  },
  "Register Final": {
    itemtype: "manual",
    itemmodule: null,
    idnumber: "register_final",
  },
  "Register(not to edit) total": {
    name: "Register Total",
    itemtype: "category",
    itemmodule: null,
    idnumber: "register",
  },
  Attendance: {
    itemtype: "mod",
    itemmodule: "attendance",
    idnumber: "register_attendance",
  },
};

const defaultGradeBaseData: GradeBaseData = {
  itemtype: "mod",
  itemmodule: "assign",
};

const msOnlineProxyFixedUrl = config.moodle.msOnlineProxyUrl
  ? new URL(config.moodle.msOnlineProxyUrl).toString()
  : null;

function _isHttpResponseRedirected(resp: AxiosResponse): boolean {
  return resp.status >= 300 && resp.status < 400 && !!resp.headers.location;
}

export class Moodle {
  protected httpClient?: AxiosInstance;
  protected moodleClient?: MoodleClient;
  protected moodleUserId?: number;
  protected moodleAuthCookies?: MoodleAuthCookie[];
  protected moodleSessionCookie?: string;
  protected moodleSessionKey?: string;
  protected msAccountId?: string;

  constructor(options: Options = {}) {
    this.moodleUserId = options.moodleUserId;
    this.moodleAuthCookies = options.moodleAuthCookies;
    this.moodleSessionCookie = options.moodleSessionCookie;
    this.moodleSessionKey = options.moodleSessionKey;
    this.msAccountId = options.msAccountId;
  }

  static zCourseType = z.enum(["inprogress", "past", "future"]);

  private _createHttpSession() {
    const jar = new CookieJar();

    const httpClient = wrapper(
      axios.create({
        jar,
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: validateForwardedHttpResponseStatus,
        headers: {
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Sec-GPC": "1",
          "Upgrade-Insecure-Requests": "1",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:135.0) Gecko/20100101 Firefox/135.0",
        },
      }),
    );

    return { httpClient, jar };
  }

  private async _proxyMSOnlineRequest(
    httpClient: AxiosInstance,
    sourceUrl: URL,
  ): Promise<AxiosResponse> {
    const cookieHeader = this.moodleAuthCookies!.map(
      (c) => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`,
    ).join("; ");

    let msOnlineUrl: URL;

    if (msOnlineProxyFixedUrl) {
      msOnlineUrl = new URL(msOnlineProxyFixedUrl);
      msOnlineUrl.pathname = sourceUrl.pathname;
      msOnlineUrl.search = sourceUrl.search;
      logger.debug(
        `Proxying MSOnline request via fixed URL: ${msOnlineUrl.toString()}`,
      );

      return await httpClient.get(msOnlineUrl.toString(), {
        headers: {
          Host: sourceUrl.host,
          Cookie: cookieHeader,
        },
      });
    }

    msOnlineUrl = sourceUrl;
    logger.debug(`Direct MSOnline request to URL: ${msOnlineUrl.toString()}`);

    return await httpClient.get(msOnlineUrl.toString(), {
      headers: {
        Cookie: cookieHeader,
      },
    });
  }

  private _parseMSOnlinePageConfigFromHtml(html: string | CheerioAPI): any {
    const $ = typeof html === "string" ? loadHtml(html) : html;

    const scriptTag = $("script").first();

    if (!scriptTag) {
      throw new Error("No (script) tag on MSOnline page");
    }

    const scriptText = $(scriptTag).text();

    if (!scriptText.includes("$Config={")) {
      throw new Error("No $Config found in MSOnline script text");
    }

    return JSON.parse(
      scriptText
        .replace("//<![CDATA[", "")
        .replace("//]]>", "")
        .replace("$Config=", "")
        .trim()
        .slice(0, -1),
    );
  }

  private _getMoodlePostDataFromRedirect(resp: AxiosResponse) {
    return Object.fromEntries(
      new URLSearchParams(resp.headers.location.split("#", 2)[1]),
    );
  }

  private async _getFormAndData(oidcUrl: string, msAccountId?: string) {
    const { httpClient } = this._createHttpSession();

    const respSrc = await httpClient.get(oidcUrl);
    if (!_isHttpResponseRedirected(respSrc)) {
      throw new Error(
        `Expected redirect from ${oidcUrl}, got ${respSrc.status}`,
      );
    }

    const redirectUrl = new URL(respSrc.headers.location, oidcUrl);
    redirectUrl.searchParams.set("response_mode", "fragment");
    redirectUrl.searchParams.set("prompt", "select_account");

    const resp = await this._proxyMSOnlineRequest(httpClient, redirectUrl);
    logger.debug(`GET ${redirectUrl.toString()} -> ${resp.status}`);

    let moodlePostData: Record<string, string>;

    if (_isHttpResponseRedirected(resp)) {
      moodlePostData = this._getMoodlePostDataFromRedirect(resp);
    } else {
      const msOnlinePageConfig = this._parseMSOnlinePageConfigFromHtml(
        loadHtml(resp.data),
      );
      logger.debug(
        `Parsed ${msOnlinePageConfig?.arrSessions?.length} MSOnline configs: ${JSON.stringify(msOnlinePageConfig?.arrSessions)}`,
      );
      const msOnlinePageSessions = (
        msOnlinePageConfig?.arrSessions || []
      ).filter((s: any) => s?.isSignedIn && s?.id);
      logger.debug(
        msOnlinePageSessions,
        `Found ${msOnlinePageSessions.length} active MSOnline sessions`,
      );

      if (!msOnlinePageSessions || msOnlinePageSessions.length === 0) {
        throw new Error("No sessions found on MSOnline page");
      }

      if (msOnlinePageSessions.length > 1 && !msAccountId) {
        throw new MoodleAPIMultiSessionsError(
          msOnlinePageSessions.map((s: any) => ({
            id: s.id,
            name: s.fullName,
            email: s.name,
          })),
        );
      }

      const msOnlinePageSession = msAccountId
        ? msOnlinePageSessions.find((s: any) => s.id === msAccountId)
        : msOnlinePageSessions[0];

      if (!msOnlinePageSession) {
        throw new Error("Provided msAccountId is invalid");
      }

      const msOnlineLoginURL = new URL(msOnlinePageConfig.urlLogin);
      msOnlineLoginURL.searchParams.set("sessionid", msOnlinePageSession.id);

      const resp2 = await this._proxyMSOnlineRequest(
        httpClient,
        msOnlineLoginURL,
      );
      if (!_isHttpResponseRedirected(resp2)) {
        throw new Error(
          `Expected redirect from ${msOnlineLoginURL}, got ${resp2.status}`,
        );
      }

      moodlePostData = this._getMoodlePostDataFromRedirect(resp2);
    }

    return { httpClient, oidcUrl, moodlePostData };
  }

  private _parseMoodlePageConfigFromHtml(html: string | CheerioAPI): any {
    const $ = typeof html === "string" ? loadHtml(html) : html;

    console.log({ html: html, html_page: $.html() });

    const scriptTag = $("script")
      .toArray()
      .find((el) => $(el).text().includes('"wwwroot"'));

    if (!scriptTag) {
      throw new Error('No (script) tag with "wwwroot" found');
    }

    const scriptText = $(scriptTag).text();

    const start = scriptText.indexOf('"wwwroot"') - 1;
    if (start < 0) {
      throw new Error('"wwwroot" not found in script text');
    }

    const end = scriptText.indexOf(";", start);
    if (end < 0) {
      throw new Error("Could not find trailing semicolon");
    }

    return JSON.parse(scriptText.slice(start, end));
  }

  async authByCookies(msAccountId?: string) {
    if (!this.moodleAuthCookies) {
      throw new Error("No auth cookies provided");
    }

    const {
      httpClient,
      oidcUrl: moodlePostUrl,
      moodlePostData,
    } = await this._getFormAndData(
      `${config.moodle.url}/auth/oidc/`,
      msAccountId,
    );

    this.httpClient = httpClient;

    logger.debug(
      `Posting to ${moodlePostUrl} with data: ${JSON.stringify(moodlePostData)}`,
    );
    const resp = await httpClient.post(
      moodlePostUrl,
      new URLSearchParams(moodlePostData),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    if (
      !(
        validateForwardedHttpResponseStatus(resp.status) &&
        resp.headers.location
      )
    ) {
      throw new Error("Unexpected response during cookie auth");
    }

    let resp2 = await httpClient.get(
      new URL(resp.headers.location, moodlePostUrl).toString(),
    );

    console.log({ resp2: resp2.headers.location });

    if (
      validateForwardedHttpResponseStatus(resp2.status) &&
      resp2.headers.location
    ) {
      resp2 = await httpClient.get(
        new URL(resp2.headers.location, moodlePostUrl).toString(),
      );
    }

    console.log({ resp2_1: resp2.headers?.location });

    const pageJsonData = this._parseMoodlePageConfigFromHtml(resp2.data);

    const userId = pageJsonData.userId as number;
    const moodleSessionKey = pageJsonData.sesskey as string;

    if (userId === 0) {
      throw new Error("Authentication failed, userId is invalid");
    }

    const setCookieHeaders = resp.headers["set-cookie"];
    if (!setCookieHeaders || !Array.isArray(setCookieHeaders)) {
      throw new Error("No set-cookie headers found");
    }

    const moodleSessionCookieRaw = setCookieHeaders
      .map((c) => c.split(";")[0])
      .find((c) => c.startsWith("MoodleSession="));

    if (!moodleSessionCookieRaw) {
      throw new Error("MoodleSession cookie not found");
    }

    const moodleSessionCookie = moodleSessionCookieRaw.split("=")[1];

    logger.debug(
      `Authenticated as userId=${userId}, sesskey=${moodleSessionKey}, MoodleSession=${moodleSessionCookie}`,
    );
    this.moodleUserId = userId;
    this.moodleSessionCookie = moodleSessionCookie;
    this.moodleSessionKey = moodleSessionKey;

    return { userId, moodleSessionCookie, moodleSessionKey };
  }

  private _getHttpClient(): AxiosInstance {
    if (!this.httpClient) {
      this.httpClient = this._createHttpSession().httpClient;
    }
    return this.httpClient;
  }

  private setMoodleCookies(httpClient: AxiosInstance) {
    if (!this.moodleSessionCookie) {
      throw new Error("No MoodleSession cookie available");
    }

    httpClient.defaults.headers.Cookie = `MoodleSession=${encodeURIComponent(
      this.moodleSessionCookie,
    )}`;
  }

  async getStudentInfo(): Promise<MoodleStudentInfo> {
    const httpClient = this._getHttpClient();
    this.setMoodleCookies(httpClient);

    const resp = await httpClient.get(`${config.moodle.url}/user/profile.php`);

    const $ = loadHtml(resp.data);
    const fullname = $("h1").first().text().trim();
    const username = decodeURIComponent(
      $("a[href^='mailto']").attr("href")!,
    ).replace(/^mailto:/i, "");

    const pageJsonData = this._parseMoodlePageConfigFromHtml($);

    const userId = pageJsonData.userId as number;

    return { fullname, username, userId };
  }

  async getGrades({
    courseId,
  }: {
    courseId: number | string;
  }): Promise<MoodleGrade[]> {
    if (!this.moodleUserId) {
      throw new Error("No Moodle user ID available, please authenticate first");
    }

    const httpClient = this._getHttpClient();
    this.setMoodleCookies(httpClient);

    const resp = await httpClient.get(
      `${config.moodle.url}/course/user.php?mode=grade&id=${courseId}&user=${this.moodleUserId}`,
    );

    const $ = loadHtml(resp.data);

    const $gradeEls = $(
      $("table.generaltable tr[data-hidden='false']")
        .toArray()
        .slice(1)
        .slice(0, -1),
    );

    const grades: MoodleGrade[] = $gradeEls
      .map((_, el) => {
        const $gradeEl = $(el);
        if ($gradeEl.hasClass("spacer")) {
          return null;
        }

        const $nameAndIdEl = $(".gradeitemheader", $gradeEl).first();
        if (!$nameAndIdEl.length) {
          return null;
        }
        const name = $nameAndIdEl.text().trim();
        if (ignoreGradeNames.has(name)) {
          return null;
        }

        const gradeId = parseInt(
          $("th.column-itemname", $gradeEl)
            .first()
            .attr("id")!
            .split("_", 3)[1],
        );
        const gradeAssignmentId =
          parseInt($nameAndIdEl.attr("href")?.split("id=", 2)?.[1] || "") ??
          undefined;

        const gradeValueFormatted = $("td.column-percentage", $gradeEl)
          .first()
          .text()
          .replace(" %", "")
          .replace("-", "")
          .trim();
        const gradeValueRaw =
          parseFloat($("td.column-grade", $gradeEl).first().text().trim()) ??
          null;
        const gradeValueRange = $("td.column-range", $gradeEl)
          .first()
          .text()
          .trim()
          .split("–", 2);
        const gradeValueMin = parseFloat(gradeValueRange[0]);
        const gradeValueMax = parseFloat(gradeValueRange[1]);

        const gradeBaseData =
          gradeNamesToBaseData[name] ?? defaultGradeBaseData;

        return {
          id: gradeId,
          itemname: gradeBaseData.name ?? name,
          itemtype: gradeBaseData.itemtype,
          itemmodule: gradeBaseData.itemmodule ?? undefined,
          iteminstance: gradeAssignmentId,
          idnumber: gradeBaseData.idnumber,
          graderaw: gradeValueRaw,
          gradeformatted: gradeValueFormatted,
          grademin: gradeValueMin,
          grademax: gradeValueMax,
          // cmid: -1,  // TODO: review usage with assignments rewriting
        };
      })
      .get();

    return grades.filter((g): g is MoodleGrade => g !== null);
  }

  async getAssignments({
    courseId,
  }: {
    courseId: number | string;
  }): Promise<MoodleAssignment[]> {
    if (!this.moodleUserId) {
      throw new Error("No Moodle user ID available, please authenticate first");
    }

    const [response, error] = await this.call("core_get_fragment", {
      component: "core_course",
      callback: "course_overview",
      contextid: 1,
      args: [
        {
          name: "courseid",
          value: `${courseId}`,
        },
        {
          name: "modname",
          value: "assign",
        },
      ],
    });

    if (error) {
      throw new Error(
        `Moodle API error: ${error.message} (code: ${error.code})`,
      );
    }

    const $ = loadHtml(response.html!);

    const assignments: MoodleAssignment[] = $(
      "table.course-overview-table tbody tr",
    )
      .map((_, el) => {
        const $assignmentEl = $(el);
        const cmId = parseInt(
          $assignmentEl.attr("data-mdl-overview-cmid") ?? "",
          10,
        );

        if (!cmId) {
          return null;
        }

        const $nameAndIdEl = $assignmentEl.find(
          'td[data-mdl-overview-item="name"]',
        );
        const assignmentId = parseInt(
          $nameAndIdEl
            .find(".fw-bold .activityname")
            .first()
            .attr("href")
            ?.split("id=", 2)?.[1] ?? "",
          10,
        );
        const name = $nameAndIdEl.attr("data-mdl-overview-value")!.trim();

        if (!assignmentId) {
          logger.debug("Skipping assignment with invalid ID");
          return null;
        }

        const dueDateTsStr = (
          $assignmentEl
            .find('td[data-mdl-overview-item="duedate"]')
            .attr("data-mdl-overview-value") || ""
        ).trim();
        const dueDateTs =
          dueDateTsStr && /^\d+$/.test(dueDateTsStr)
            ? parseInt(dueDateTsStr, 10)
            : 0;

        const gradeValueRawAttr = (
          $assignmentEl
            .find('td[data-mdl-overview-item="Grade"]')
            .attr("data-mdl-overview-value") || ""
        )
          .trim()
          .replace("-", "");
        const gradeValueRaw = parseFloat(gradeValueRawAttr) ?? null;

        return {
          id: assignmentId,
          cmid: cmId,
          course:
            typeof courseId === "number" ? courseId : parseInt(courseId, 10),
          name,
          duedate: dueDateTs,
          grade: gradeValueRaw,
        };
      })
      .get();

    return assignments.filter((a): a is MoodleAssignment => a !== null);
  }

  async call<F extends keyof FunctionDefinition | (string & {})>(
    func: F,
    ...params: F extends keyof FunctionDefinition
      ? [FunctionDefinition[F][0]] | []
      : [Record<string, unknown>]
  ): Promise<
    | [
        F extends keyof FunctionDefinition ? FunctionDefinition[F][1] : unknown,
        null,
      ]
    | [null, { message: string; code: string | null }]
  > {
    if (!this.moodleClient) {
      if (!this.moodleUserId) {
        throw new Error(
          "No Moodle user ID available, please authenticate first",
        );
      }

      if (!this.moodleSessionCookie || !this.moodleSessionKey) {
        throw new Error(
          "No Moodle client or session available, please authenticate first",
        );
      }

      this.moodleClient = new MoodleClient(
        config.moodle.url,
        this.moodleSessionCookie,
        this.moodleSessionKey,
      );
    }

    try {
      const res = await this.moodleClient.call(
        func,
        ...(params as F extends keyof FunctionDefinition
          ? Record<never, never> extends FunctionDefinition[F][0]
            ? []
            : [FunctionDefinition[F][0]]
          : [Record<string, unknown>]),
      );

      return [
        res as F extends keyof FunctionDefinition
          ? FunctionDefinition[F][1]
          : unknown,
        null,
      ];
    } catch (err: MoodleAPIError | any) {
      if (
        err instanceof MoodleAPIError &&
        err.code === "servicerequireslogin"
      ) {
        // attempting reauth using Moodle OIDC and authCookies
        // TODO: use user.health
        try {
          await this.authByCookies(this.msAccountId);
        } catch (reauthErr: any) {
          return [null, { message: (reauthErr as Error).message, code: null }];
        }

        // TODO: log reauth success and MoodleSession change

        try {
          await db.user.updateOne(
            { moodleId: this.moodleUserId },
            {
              $set: {
                moodleSessionCookie: this.moodleSessionCookie,
                moodleSessionKey: this.moodleSessionKey,
              },
            },
          );
        } catch (dbErr: any) {
          // TODO: log db update error
        }

        this.moodleClient = new MoodleClient(
          config.moodle.url,
          this.moodleSessionCookie!,
          this.moodleSessionKey!,
        );

        return await this.call(func, ...params);
      }

      return [null, { message: err.message, code: err?.code }];
    }
  }
}
