import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { config } from "../../config";
import { database } from "../../db";
import { findSessionUser } from "../../library/auth";
import { secretsMatch } from "../../library/crypto";
import type { AppEnv, UserEnv } from "../context";

// Two kinds of clients call the API server-to-server, never browsers, so no route needs CSRF
// defence. The calendar's server forwards the session token from its own httpOnly cookie:
//   Authorization: Bearer <session token>
// The Telegram bot acts for whoever sent the update, so it names that user next to its secret:
//   Authorization: Bot <BOT_API_SECRET>
//   X-Telegram-Id: <telegram user id>
export function readSessionToken(c: Context) {
  const header = c.req.header("Authorization");

  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
}

function isBot(c: Context) {
  const header = c.req.header("Authorization");

  return (
    !!header?.startsWith("Bot ") && secretsMatch(header.slice("Bot ".length), config.api.botSecret)
  );
}

function readTelegramId(c: Context) {
  const telegramId = Number(c.req.header("X-Telegram-Id"));

  if (!Number.isSafeInteger(telegramId) || telegramId <= 0) {
    throw new HTTPException(400, { message: "Missing Telegram user." });
  }

  return telegramId;
}

// Personal data must never be cached between users by a proxy.
export const privateResponse = createMiddleware<AppEnv>(async (c, next) => {
  c.header("Cache-Control", "no-store");
  await next();
});

export const requireBot = createMiddleware<AppEnv>(async (c, next) => {
  if (!isBot(c)) throw new HTTPException(401, { message: "Unknown client." });

  await next();
});

// The bot gets 404 for Telegram users without an account, so it can offer setup instead.
export const requireUser = createMiddleware<UserEnv>(async (c, next) => {
  if (isBot(c)) {
    const user = await database.users.findByTelegramId(readTelegramId(c));

    if (!user) throw new HTTPException(404, { message: "Set up Remoodle in the bot first." });

    c.set("user", user);
  } else {
    const token = readSessionToken(c);
    const session = token ? await findSessionUser(token) : undefined;
    const user = session ? await database.users.findById(session.id) : undefined;

    if (!user) throw new HTTPException(401, { message: "Sign in to continue." });

    c.set("user", user);
  }

  c.var.logger.withContext({ userId: c.var.user.id });
  await next();
});
