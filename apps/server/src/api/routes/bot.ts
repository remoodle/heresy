import { Hono } from "hono";
import { z } from "zod";
import { findAccount } from "../../library/account";
import {
  approveTelegramLogin,
  telegramProfileSchema,
  upsertTelegramUser,
} from "../../library/auth";
import type { AppEnv } from "../context";
import { privateResponse, requireBot } from "../middleware/auth";
import { jsonBody } from "../validator";

// Only the bot can vouch for a Telegram profile, so only it creates accounts and approves logins.
export const bot = new Hono<AppEnv>()
  .use(privateResponse, requireBot)
  .put("/users", jsonBody(telegramProfileSchema, "Invalid Telegram profile."), async (c) => {
    const { id } = await upsertTelegramUser(c.req.valid("json"));

    // Read back because the upsert cannot return `hasSchedule`; the row was just written.
    return c.json((await findAccount(id))!, 200);
  })
  .post(
    "/login",
    jsonBody(
      z.object({ code: z.string().min(1).max(64), profile: telegramProfileSchema }),
      "Invalid sign-in request.",
    ),
    async (c) => {
      const { code, profile } = c.req.valid("json");

      return c.json({ approved: await approveTelegramLogin(code, profile) }, 200);
    },
  );
