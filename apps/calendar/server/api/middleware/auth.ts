import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { createAuth } from "../../lib/auth";
import type { AppEnv } from "../../context";

export type AppContext = Context<AppEnv>;

export async function requireSession(c: AppContext) {
  const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.var.logger.withContext({ auth: { authenticated: false } });
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  c.var.logger.withContext({ auth: { authenticated: true, mechanism: "session" } });

  return session;
}

export function requireInternalToken(c: AppContext) {
  if (c.req.header("X-Internal-Token") !== c.env.INTERNAL_TOKEN) {
    c.var.logger.withContext({ auth: { authenticated: false, mechanism: "internal-token" } });
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  c.var.logger.withContext({ auth: { authenticated: true, mechanism: "internal-token" } });
}
