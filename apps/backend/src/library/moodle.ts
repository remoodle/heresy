// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MoodleClient, MoodleAPIError } from "./moodleClient";
import type { FunctionDefinition } from "moodle-api";
import { z } from "zod";
import { config } from "../config";
import axios, { type AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { load as loadHtml, type CheerioAPI } from "cheerio";
import { db } from "./db";

interface Options {
  moodleUserId?: number,
  moodleAuthCookies?: MoodleAuthCookie[];
  moodleSessionCookie?: string;
  moodleSessionKey?: string;
}

interface MoodleAuthCookie {  // TODO: move to shared types
  name: string;
  value: string;
}

function validateForwardedHttpResponseStatus(status: number) {
  return status >= 200 && status < 400;
}

interface MoodleStudentInfo {
  fullname: string,
  username: string,  // email
  userId: number,
}

export class Moodle {
  protected httpClient?: AxiosInstance;
  protected moodleClient?: MoodleClient;
  protected moodleUserId?: number;
  protected moodleAuthCookies?: MoodleAuthCookie[];
  protected moodleSessionCookie?: string;
  protected moodleSessionKey?: string;

  constructor(options: Options = {}) {
    this.moodleUserId = options.moodleUserId;
    this.moodleAuthCookies = options.moodleAuthCookies;
    this.moodleSessionCookie = options.moodleSessionCookie;
    this.moodleSessionKey = options.moodleSessionKey;
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
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:135.0) Gecko/20100101 Firefox/135.0",
        },
      })
    );

    return { httpClient, jar };
  }

  private async _getFormAndData(url: string) {
    const { httpClient } = this._createHttpSession();

    const respSrc = await httpClient.get(url);
    if (!(respSrc.status >= 300 && respSrc.status < 400 && respSrc.headers.location)) {
      throw new Error(`Expected redirect from ${url}, got ${respSrc.status}`);
    }

    const redirectUrl = new URL(respSrc.headers.location, respSrc.config.url ?? url).toString();
    console.log(`Redirect from ${url} to ${redirectUrl}`);

    httpClient.defaults.headers.Cookie = this.moodleAuthCookies!.map(c => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`).join("; ");

    const resp = await httpClient.get(redirectUrl);
    console.log(`GET ${url} -> ${resp.status}: ${resp.data}`);

    const $ = loadHtml(resp.data);
    const $form = $("form").first();
    if ($form.length === 0) {
      throw new Error("No (form) found on page");
    }

    const actionAttr = $form.attr("action") ?? "";
    const baseUrl = resp.config.url ?? url;
    const moodlePostUrl = new URL(actionAttr || ".", baseUrl).toString();

    const moodlePostData: Record<string, string> = {};

    $form.find("input[name]").each((_: any , el: any) => {
      const name = $(el).attr("name")!;
      const value = $(el).attr("value") ?? "";
      const type = ($(el).attr("type") || "").toLowerCase();
      const checked = $(el).is(":checked");
      if (type === "checkbox" || type === "radio") {
        if (checked) {
          moodlePostData[name] = value;
        }
      } else {
        moodlePostData[name] = value;
      }
    });

    $form.find("select[name]").each((_: any, el: any) => {
      const name = $(el).attr("name")!;
      const $options = $(el).find("option");
      const $selected = $options.filter("[selected]").first();
      moodlePostData[name] = $selected.length
        ? ($selected.attr("value") ?? "")
        : ($options.first().attr("value") ?? "");
    });

    $form.find("textarea[name]").each((_: any, el: any) => {
      const name = $(el).attr("name")!;
      moodlePostData[name] = $(el).text() ?? "";
    });

    return { httpClient, moodlePostUrl, moodlePostData };
  }

  private _parseMoodlePageConfigFromHtml(html: string | CheerioAPI): any {
    const $ = (typeof html === "string") ? loadHtml(html) : html;

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

    const jsonData: any = JSON.parse(scriptText.slice(start, end));
    console.log(`Extracted JSON data: ${JSON.stringify(jsonData)}`);

    return jsonData;
  }

  async authByCookies() {
    if (!this.moodleAuthCookies) {
      throw new Error("No auth cookies provided");
    }

    const { httpClient, moodlePostUrl, moodlePostData } = await this._getFormAndData(`${config.moodle.url}/auth/oidc/`);

    this.httpClient = httpClient;

    console.log(`Posting to ${moodlePostUrl} with data: ${JSON.stringify(moodlePostData)}`);
    const resp = await httpClient.post(moodlePostUrl, new URLSearchParams(moodlePostData), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      maxRedirects: 0,
      validateStatus: validateForwardedHttpResponseStatus,
    });

    if (!(validateForwardedHttpResponseStatus(resp.status) && resp.headers.location)) {
      throw new Error("Unexpected response during cookie auth");
    }

    const resp2 = await httpClient.get(
      new URL(resp.headers.location, moodlePostUrl).toString(),
      { maxRedirects: 0 },
    );

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
      .map(c => c.split(";")[0])
      .find(c => c.startsWith("MoodleSession="));

    if (!moodleSessionCookieRaw) {
      throw new Error("MoodleSession cookie not found");
    }

    const moodleSessionCookie = moodleSessionCookieRaw.split("=")[1];

    console.log(`Authenticated as userId=${userId}, sesskey=${moodleSessionKey}, MoodleSession=${moodleSessionCookie}`);
    this.moodleUserId = userId;
    this.moodleSessionCookie = moodleSessionCookie;
    this.moodleSessionKey = moodleSessionKey;

    return { userId, moodleSessionCookie, moodleSessionKey };
  }

  private setMoodleCookies(httpClient: AxiosInstance) {
    if (!this.moodleSessionCookie) {
      throw new Error("No MoodleSession cookie available");
    }

    httpClient.defaults.headers.Cookie = `MoodleSession=${encodeURIComponent(this.moodleSessionCookie)}`;
  }

  async getStudentInfo(): Promise<MoodleStudentInfo> {
    if (!this.httpClient) {
      this.httpClient = this._createHttpSession().httpClient;
    }
    const httpClient = this.httpClient;

    this.setMoodleCookies(httpClient);

    const resp = await httpClient.get(`${config.moodle.url}/user/profile.php`);

    const $ = loadHtml(resp.data);
    const fullname = $("h1").first().text().trim();
    const username = decodeURIComponent($("a[href^='mailto']").attr("href")!)
      .replace(/^mailto:/i, "");

    const pageJsonData = this._parseMoodlePageConfigFromHtml($);

    const userId = pageJsonData.userId as number;

    return { fullname, username, userId, };
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
    | [null, { message: string, code: string | null }]
  > {
    if (!this.moodleClient) {
      if (!this.moodleUserId) {
        throw new Error("No Moodle user ID available, please authenticate first");
      }

      if (!this.moodleSessionCookie || !this.moodleSessionKey) {
        throw new Error("No Moodle client or session available, please authenticate first");
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
      if (err?.code === "servicerequireslogin") {
        // attempting reauth using Moodle OIDC and authCookies
        try {
          await this.authByCookies();
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
