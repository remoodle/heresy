import { honoLogLayer } from "@loglayer/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "./context";
import { apiRouter } from "./api/router";
import { logger } from "./logger";

const app = new Hono<AppEnv>();

app.use("*", honoLogLayer({ instance: logger }));

app.use("*", cors());

app.use("/api/user/*", async (c, next) => {
  c.header("Cache-Control", "no-store");

  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const origin = c.req.header("Origin");

    if (origin !== new URL(c.env.BETTER_AUTH_URL).origin) {
      throw new HTTPException(403, { message: "Invalid request origin" });
    }
  }

  await next();
});

export const route = app.route("/", apiRouter);

app.onError((error, c) => {
  const status = error instanceof HTTPException ? error.status : 500;
  c.var.logger.withError(error).withMetadata({ status }).error("request failed");

  return c.json(
    { status, message: status === 500 ? "Something went wrong. Please try again." : error.message },
    status,
  );
});

export default app;
