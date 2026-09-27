import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { createDb } from "../../db";
import type { AppEnv } from "../../context";
import { requireInternalToken, requireSession } from "../middleware/auth";
import { jsonBody } from "../validator";
import { findConnection } from "../../lib/my-du/repository";
import { connectMyDuSchema } from "../../lib/my-du/schemas";
import {
  completeLogin,
  disconnect,
  readSchedule,
  startLogin,
  syncDue,
  syncSchedule,
} from "../../lib/my-du/service";

export const userSchedule = new Hono<AppEnv>().use(requireSession).get("/", async (c) => {
  const row = await findConnection(createDb(c.env.DB), c.var.user.id);

  if (row && syncDue(row)) c.executionCtx.waitUntil(syncSchedule(c.env, c.var.user.id));
  const schedule = await readSchedule(c.env, c.var.user.id);

  return c.json(schedule);
});

export const userMyDu = new Hono<AppEnv>()
  .use(requireSession)
  .post("/start", async (c) => {
    const login = await startLogin(c.env, c.var.user.id);

    return c.json(login);
  })
  .post(
    "/connect",
    bodyLimit({
      maxSize: 24_000,
      onError: () => {
        throw new HTTPException(413, { message: "Connection link is too long" });
      },
    }),
    jsonBody(
      connectMyDuSchema,
      "Check the connection link, academic year, period, and Monday of teaching week 1.",
    ),
    async (c) => {
      const schedule = await completeLogin(c.env, c.var.user.id, c.req.valid("json"));

      return c.json(schedule);
    },
  )
  .post("/sync", async (c) => {
    const row = await findConnection(createDb(c.env.DB), c.var.user.id);

    if (!row?.credentials) throw new HTTPException(400, { message: "Connect My DU first." });

    if (!row.lastAttemptAt || row.lastAttemptAt < Date.now() - 60_000) {
      await syncSchedule(c.env, c.var.user.id);
    }

    const schedule = await readSchedule(c.env, c.var.user.id);

    return c.json(schedule);
  })
  .delete("/", async (c) => {
    await disconnect(c.env, c.var.user.id);

    return c.json({ ok: true });
  });

export const internalSchedule = new Hono<AppEnv>()
  .use(requireInternalToken)
  .get("/:userId", async (c) => {
    const schedule = await readSchedule(c.env, c.req.param("userId"));

    return c.json(schedule.events);
  });
