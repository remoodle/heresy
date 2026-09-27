import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createAuth } from "../../lib/auth";
import type { AppEnv } from "../../context";

type User = ReturnType<typeof createAuth>["$Infer"]["Session"]["user"];

export const requireSession = createMiddleware<AppEnv & { Variables: { user: User } }>(
  async (c, next) => {
    const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.var.logger.withContext({ auth: { authenticated: false } });
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    c.var.logger.withContext({ auth: { authenticated: true, mechanism: "session" } });
    c.set("user", session.user);
    await next();
  },
);

export const requireInternalToken = createMiddleware<AppEnv>(async (c, next) => {
  if (c.req.header("X-Internal-Token") !== c.env.INTERNAL_TOKEN) {
    c.var.logger.withContext({ auth: { authenticated: false, mechanism: "internal-token" } });
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  c.var.logger.withContext({ auth: { authenticated: true, mechanism: "internal-token" } });
  await next();
});

// Browser session routes: never cache, and reject cross-site writes before cookies are trusted.
export const userRequest = createMiddleware<AppEnv>(async (c, next) => {
  c.header("Cache-Control", "no-store");

  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const origin = c.req.header("Origin");

    if (origin !== new URL(c.env.BETTER_AUTH_URL).origin) {
      throw new HTTPException(403, { message: "Invalid request origin" });
    }
  }

  await next();
});
