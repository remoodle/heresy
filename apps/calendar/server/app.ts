import { honoLogLayer } from "@loglayer/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "./context";
import { apiRouter } from "./api/router";
import { logger } from "./logger";

const app = new Hono<AppEnv>()
  .use(honoLogLayer({ instance: logger }))
  .use(cors())
  .route("/api", apiRouter)
  .onError((error, c) => {
    const status = error instanceof HTTPException ? error.status : 500;
    c.var.logger.withError(error).withMetadata({ status }).error("request failed");

    return c.json(
      {
        status,
        message: status === 500 ? "Something went wrong. Please try again." : error.message,
      },
      status,
    );
  });

export type AppType = typeof app;

export default app;
