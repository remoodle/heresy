import { Hono } from "hono";
import { createAuth } from "../lib/auth";
import type { AppEnv } from "../context";
import { userRequest } from "./middleware/auth";
import { icalFeed, userIcalToken } from "./routes/ical";
import { internalMoodle, userMoodle } from "./routes/moodle";
import { internalSchedule, userMyDu, userSchedule } from "./routes/my-du";
import { internalRemoodle, userRemoodleToken } from "./routes/remoodle";

// Each resource module owns its auth middleware; /user is the browser session API and
// /internal is called by the remoodle bot with the shared internal token.
export const apiRouter = new Hono<AppEnv>()
  .use("/user/*", userRequest)
  .route("/user/moodle", userMoodle)
  .route("/user/my-du", userMyDu)
  .route("/user/schedule", userSchedule)
  .route("/user/ical-token", userIcalToken)
  .route("/user/remoodle-token", userRemoodleToken)
  .route("/internal/moodle", internalMoodle)
  .route("/internal/schedule", internalSchedule)
  .route("/internal/remoodle", internalRemoodle)
  .route("/ical", icalFeed)
  .on(["GET", "POST"], "/auth/*", (c) => createAuth(c.env).handler(c.req.raw));
