import { GrammyError, BotError, HttpError } from "grammy";
import { getAuthHeaders, request } from "../../library/hc";

const getMiniAppUrl = async (
  userId: number,
  host: string,
  route: string = "",
): Promise<string> => {
  const [loginResponse, err] = await request((client) => {
    return client.v2.auth.login.$post(
      {
        json: {},
      },
      {
        headers: getAuthHeaders(userId),
      },
    );
  });

  if (err) {
    return host + route;
  }

  const b64 = btoa(JSON.stringify(loginResponse));
  const url = host + route + "?usr=" + b64;

  return url;
};

function logWithTimestamp(
  message: string,
  error: BotError | HttpError | GrammyError | Error,
) {
  console.error(`[${new Date().toISOString()}] ${message}`, error);
}

export { logWithTimestamp, getMiniAppUrl };
