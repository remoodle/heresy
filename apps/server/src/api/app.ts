import { honoLogLayer } from "@loglayer/hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { UserFacingError } from "../library/errors";
import { logger } from "../library/logger";
import type { AppEnv } from "./context";
import { account } from "./routes/account";
import { auth } from "./routes/auth";
import { bot } from "./routes/bot";
import { icalFeed, icalToken } from "./routes/ical";
import { moodle } from "./routes/moodle";
import { myDu } from "./routes/my-du";

// Clients: the web calendar's server and the Telegram bot, both server-to-server (see
// middleware/auth). The worker shares this app's services and database directly.
const app = new Hono<AppEnv>()
  .use(honoLogLayer({ instance: logger.child().withContext({ module: "api" }) }))
  .get("/health", (c) => c.json({ ok: true }, 200));

const routes = app
  .route("/api/auth", auth)
  .route("/api/bot", bot)
  .route("/api/account", account)
  .route("/api/my-du", myDu)
  .route("/api/moodle", moodle)
  .route("/api/ical-token", icalToken)
  .route("/api/ical", icalFeed);

app.onError((error, c) => {
  const status =
    error instanceof HTTPException ? error.status : error instanceof UserFacingError ? 400 : 500;

  if (status >= 500) {
    c.var.logger.withError(error).withMetadata({ status }).error("request failed");
  } else {
    c.var.logger.withMetadata({ status, message: error.message }).warn("request rejected");
  }

  return c.json(
    { message: status >= 500 ? "Something went wrong. Please try again." : error.message },
    status,
  );
});

export type AppType = typeof routes;

export default app;
