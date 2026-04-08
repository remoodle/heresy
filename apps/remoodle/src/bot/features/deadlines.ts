import { Composer } from "grammy";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { fetchCalendarEvents } from "../../library/calendar";
import { buildDeadlinesMessage } from "../../library/deadline-reminders";
import type { Context } from "../context";

export const composer = new Composer<Context>();

const feature = composer.chatType(["private", "group", "supergroup"]);

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

  let events;
  try {
    events = await fetchCalendarEvents(user.calendarUrl);
  } catch {
    await ctx.reply("Failed to fetch your calendar. Check your URL with /update.");
    return;
  }

  const message = buildDeadlinesMessage(events);
  await ctx.reply(message, { parse_mode: "HTML" });
});

export { composer as deadlinesFeature };
