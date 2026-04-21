import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { config } from "../../config";
import { logger } from "../../library/logger";
import { applyPrometheus } from "./middleware/prometheus";
import { applyBullBoard } from "./middleware/bull-board";
import { versionHandler } from "./middleware/version";
import { loggerMiddleware } from "./middleware/logger";
import { v2 } from "./router/v2";

const api = new Hono();

api.use(requestId());
api.use("*", loggerMiddleware);
api.use("*", prettyJSON());
api.use("*", versionHandler);
api.use("*", cors());

api.get("/health", async (ctx) => {
  return ctx.json({ status: "ok" });
});

applyPrometheus(api);

applyBullBoard(api);

const routes = api.route("/v2", v2);

const run = () => {
  logger.api.info(
    `starting server on http://${config.http.host}:${config.http.port}`,
  );

  serve({
    hostname: config.http.host,
    port: config.http.port,
    fetch: api.fetch,
  });
};

run();

export type AppType = typeof routes;
