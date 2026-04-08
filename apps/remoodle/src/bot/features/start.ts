import { Composer } from "grammy";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { config } from "../../config";
import { durationToMs, humanizeDuration } from "../../library/dates";
import { calendarFetchUser } from "../../worker/workflows/calendar-fetch-user";
import { menuCallback, updateCalendarCallback } from "../callback-data";
import { buildMenuKeyboard } from "../keyboards/menu";
import type { Context } from "../context";

function buildMenuMessage(thresholds: string[]): string {
  const formatted =
    thresholds.length === 0
      ? "none"
      : [...thresholds]
          .sort((a, b) => durationToMs(a) - durationToMs(b))
          .map(humanizeDuration)
          .join(", ");

  return `👋 You're already registered.\n\n📅 Calendar URL is set.\n🔔 Thresholds: ${formatted}`;
}

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("start", async (ctx) => {
  const telegramId = ctx.from.id;

  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (existing.length > 0) {
    const user = existing[0]!;
    await ctx.reply(buildMenuMessage(user.thresholds), { reply_markup: buildMenuKeyboard() });
    return;
  }

  ctx.session.awaitingCalendarUrl = true;
  await ctx.reply(
    `👋 Welcome to ReMoodle!\n\nPlease send your Moodle calendar URL.\n\nYou can find it at:\nLMS → Calendar → Export → Copy URL`,
  );
});

feature.command("update", async (ctx) => {
  ctx.session.awaitingCalendarUrl = true;
  await ctx.reply("Send your new Moodle calendar URL:");
});

feature.callbackQuery(menuCallback.filter(), async (ctx) => {
  const telegramId = ctx.from.id;
  const rows = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;
  await ctx.editMessageText(buildMenuMessage(user.thresholds), {
    reply_markup: buildMenuKeyboard(),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(updateCalendarCallback.filter(), async (ctx) => {
  ctx.session.awaitingCalendarUrl = true;
  await ctx.editMessageText("Send your new Moodle calendar URL:");
  await ctx.answerCallbackQuery();
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

  await ctx.reply(`✅ Calendar URL saved!\n\n${buildMenuMessage(user!.thresholds)}`, {
    reply_markup: buildMenuKeyboard(),
  });
});

export { composer as startFeature };
