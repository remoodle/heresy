import type { Middleware, SessionOptions } from "grammy";
import { session as createSession } from "grammy";
import type { Context } from "../context";
import type { SessionData } from "../context";

type Options = Pick<
  SessionOptions<SessionData, Context>,
  "getSessionKey" | "storage"
>;

export function session(options: Options): Middleware<Context> {
  return createSession({
    getSessionKey: options.getSessionKey,
    storage: options.storage,
    initial: () => ({}),
  });
}
