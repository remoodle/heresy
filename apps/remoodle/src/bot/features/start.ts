import { Composer } from "grammy";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { config } from "../../config";
import { durationToMs, humanizeDuration } from "../../library/dates";
import { calendarFetchUser } from "../../worker/workflows/calendar-fetch-user";
import { startMenuCallback } from "../callback-data";
import type { Context } from "../context";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

function formatThresholds(thresholds: string[]): string {
  if (thresholds.length === 0) {
    return "none";
  }

  return [...thresholds]
    .sort((a, b) => durationToMs(a) - durationToMs(b))
    .map(humanizeDuration)
    .join(", ");
}

function buildMenuMessage(thresholds: string[]): string {
  return (
    `👋 You're already registered.\n\n` +
    `📅 Calendar URL is set.\n` +
    `🔔 Thresholds: ${formatThresholds(thresholds)}\n\n` +
    `Commands:\n` +
    `/deadlines — show upcoming deadlines\n` +
    `/settings — configure reminder thresholds\n` +
    `/about — project links and info\n` +
    `/update — update your calendar URL`
  );
}

feature.command("start", async (ctx) => {
  const telegramId = ctx.from.id;

  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (existing.length > 0) {
    const user = existing[0]!;
    await ctx.reply(buildMenuMessage(user.thresholds));
    return;
  }

  ctx.session.awaitingCalendarUrl = true;
  await ctx.reply(
    `👋 Welcome to ReMoodle!\n\n` +
      `Please send your Moodle calendar URL.\n\n` +
      `You can find it at:\n` +
      `LMS → Calendar → Export → Copy URL`,
  );
});

feature.command("update", async (ctx) => {
  ctx.session.awaitingCalendarUrl = true;
  await ctx.reply("Send your new Moodle calendar URL:");
});

feature.on("message:text", async (ctx, next) => {
  if (!ctx.session.awaitingCalendarUrl) {
    return next();
  }

  const url = ctx.message.text.trim();

  if (!url.startsWith("http")) {
    await ctx.reply("That doesn't look like a URL. Please send a valid calendar URL:");
    return;
  }

  const telegramId = ctx.from.id;

  await db
    .insert(users)
    .values({
      telegramId,
      calendarUrl: url,
      thresholds: config.reminders.defaultThresholds,
    })
    .onConflictDoUpdate({
      target: users.telegramId,
      set: { calendarUrl: url },
    });

  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  ctx.session.awaitingCalendarUrl = false;

  await calendarFetchUser.run({
    userId: user!.id,
    telegramId,
    calendarUrl: url,
    thresholds: user!.thresholds,
  });

  await ctx.reply(
    `✅ Calendar URL saved!\n\n` +
      `Commands:\n` +
      `/deadlines — show upcoming deadlines\n` +
      `/settings — configure reminder thresholds\n` +
      `/about — project links and info`,
  );
});

feature.callbackQuery(startMenuCallback.filter(), async (ctx) => {
  const telegramId = ctx.from.id;
  const rows = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;
  await ctx.editMessageText(buildMenuMessage(user.thresholds));

  await ctx.answerCallbackQuery();
});

export { composer as startFeature };
