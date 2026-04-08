import { Composer } from "grammy";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { fetchCalendarEvents } from "../../library/calendar";
import { buildDeadlinesMessage } from "../../library/deadline-reminders";
import { deadlinesCallback } from "../callback-data";
import { buildBackToMenuKeyboard } from "../keyboards/menu";
import type { Context } from "../context";

export const composer = new Composer<Context>();

const feature = composer.chatType(["private", "group", "supergroup"]);

async function fetchDeadlinesMessage(calendarUrl: string) {
  const events = await fetchCalendarEvents(calendarUrl);
  return buildDeadlinesMessage(events);
}

feature.command(["deadlines", "d"], async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    return;
  }

  const rows = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (rows.length === 0) {
    await ctx.reply("You're not registered. Use /start to set up your calendar URL.");
    return;
  }

  const user = rows[0]!;

  await ctx.replyWithChatAction("typing");

  let message: string;
  try {
    message = await fetchDeadlinesMessage(user.calendarUrl);
  } catch {
    await ctx.reply("Failed to fetch your calendar. Check your URL with /update.");
    return;
  }

  await ctx.reply(message, { parse_mode: "HTML" });
});

feature.chatType("private").callbackQuery(deadlinesCallback.filter(), async (ctx) => {
  const telegramId = ctx.from.id;

  const rows = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;

  await ctx.answerCallbackQuery();

  let message: string;
  try {
    message = await fetchDeadlinesMessage(user.calendarUrl);
  } catch {
    await ctx.editMessageText("Failed to fetch your calendar.", {
      reply_markup: buildBackToMenuKeyboard(),
    });
    return;
  }

  await ctx.editMessageText(message, {
    parse_mode: "HTML",
    reply_markup: buildBackToMenuKeyboard(),
  });
});

export { composer as deadlinesFeature };
