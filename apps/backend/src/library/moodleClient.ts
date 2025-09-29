import { MoodleClient as _MoodleClient } from "moodle-api";
import type { FunctionDefinition } from "moodle-api";

export class MoodleAPIError extends Error {
    code: string;

    constructor(message: string, { code }: { code: string }) {
        super(message);

        this.code = code
    }
}

export class MoodleClient extends _MoodleClient {
  protected sessionKey: string;

  constructor(base_url: string | URL, token: string, sessionKey: string) {
    super(base_url, token);

    this.sessionKey = sessionKey;
  }

  public async call<F extends keyof FunctionDefinition | (string & {})>(
		func: F,
		...params: F extends keyof FunctionDefinition
			? Record<never, never> extends FunctionDefinition[F][0]
				? []
				: [FunctionDefinition[F][0]]
			: [Record<string, unknown>]
	): Promise<F extends keyof FunctionDefinition ? FunctionDefinition[F][1] : unknown> {
		const url = new URL("/lib/ajax/service.php", this.base);
		url.searchParams.append("sesskey", this.sessionKey);

		const body = JSON.stringify([{
      index: 0,
      methodname: func,
      args: params ? params[0] : {},
    }]);
    console.log(`Moodle API Call: ${func} with body: ${body}`);

		const response = await fetch(url.toString(), {
			method: "POST",
			headers: {
        "Cookie": "MoodleSession=" + this.token,
				"Content-Type": "application/json",
			},
			body,
		});
		if (!response.ok) {
			throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
		}

		const json: any = await response.json();
    const jsonFixed = (json ? json[0] : {});
    if (jsonFixed.exception) {
			throw new MoodleAPIError( jsonFixed.message, { code: jsonFixed.errorcode } );
		}
		return jsonFixed?.data || {};
	}
}
