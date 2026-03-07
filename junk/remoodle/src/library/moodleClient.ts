import { MoodleClient as _MoodleClient } from "moodle-api";
import type { FunctionDefinition } from "moodle-api";
import { logger } from "./logger";

export class MoodleAPIError<T extends object = object> extends Error {
  code: string;
  extra: T;

  constructor(message: string, code: string, extra?: T) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = code;
    this.extra = (extra || {}) as T;
  }
}

export class MoodleClient extends _MoodleClient {
  protected sessionKey: string;

  constructor(
    base_url: string | URL,
    sessionCookie: string,
    sessionKey: string,
  ) {
    super(base_url, sessionCookie);

    this.sessionKey = sessionKey;
  }

  public async call<F extends keyof FunctionDefinition | (string & {})>(
    func: F,
    ...params: F extends keyof FunctionDefinition
      ? Record<never, never> extends FunctionDefinition[F][0]
        ? []
        : [FunctionDefinition[F][0]]
      : [Record<string, unknown>]
  ): Promise<
    F extends keyof FunctionDefinition ? FunctionDefinition[F][1] : unknown
  > {
    const url = new URL("/lib/ajax/service.php", this.base);
    url.searchParams.append("sesskey", this.sessionKey);

    const body = JSON.stringify([
      {
        index: 0,
        methodname: func,
        args: params ? params[0] : {},
      },
    ]);
    logger.debug(`Moodle API Call: ${func} with body: ${body}`);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Cookie: "MoodleSession=" + this.token,
        "Content-Type": "application/json",
      },
      body,
    });
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const json: any = await response.json();
    const jsonFixed = json ? json[0] : {};
    if (jsonFixed.exception) {
      throw new MoodleAPIError(
        jsonFixed.message,
        jsonFixed.exception.errorcode,
      );
    }
    return jsonFixed?.data || {};
  }
}
