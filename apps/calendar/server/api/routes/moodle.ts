import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "../../db";
import { moodleConnections } from "../../db/schema";
import { fetchMoodleFeed, validateMoodleUrl } from "../../lib/moodle/feed";
import type { AppEnv } from "../../context";
import { requireInternalToken, requireSession } from "../middleware/auth";
import { jsonBody } from "../validator";
import { connectMoodle, readMoodle } from "../../lib/moodle";

const connectBody = jsonBody(z.object({ url: z.string() }), "Moodle calendar URL is required.");

const connectError = "Could not open this Moodle calendar. Generate a new calendar URL in Moodle.";

export const userMoodle = new Hono<AppEnv>()
  .use(requireSession)
  .get("/", async (c) => {
    const moodle = await readMoodle(c.env, c.var.user.id);

    return c.json(moodle);
  })
  .post("/", connectBody, async (c) => {
    const body = c.req.valid("json");
    let url: string;

    try {
      url = validateMoodleUrl(body.url);
    } catch (error) {
      throw new HTTPException(400, {
        message: "Use the calendar export URL from AITU Moodle.",
        cause: error,
      });
    }

    try {
      const moodle = await connectMoodle(c.env, c.var.user.id, url);

      return c.json(moodle);
    } catch (error) {
      throw new HTTPException(400, { message: connectError, cause: error });
    }
  })
  .delete("/", async (c) => {
    await createDb(c.env.DB)
      .delete(moodleConnections)
      .where(eq(moodleConnections.userId, c.var.user.id));

    return c.json({ ok: true });
  });

export const internalMoodle = new Hono<AppEnv>()
  .use(requireInternalToken)
  .get("/:userId", async (c) => {
    c.header("Cache-Control", "private, no-store");
    const moodle = await readMoodle(c.env, c.req.param("userId"));

    return c.json(moodle);
  })
  .post("/feed", connectBody, async (c) => {
    const body = c.req.valid("json");
    const url = validateMoodleUrl(body.url);
    const events = await fetchMoodleFeed(url);

    return c.json({ events, fetchedAt: Date.now() });
  })
  .post("/:userId", connectBody, async (c) => {
    const body = c.req.valid("json");

    try {
      const moodle = await connectMoodle(c.env, c.req.param("userId"), body.url);

      return c.json(moodle);
    } catch (error) {
      throw new HTTPException(400, { message: connectError, cause: error });
    }
  });
