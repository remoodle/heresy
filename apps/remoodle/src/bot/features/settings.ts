import { Composer, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { AVAILABLE_THRESHOLDS, buildThresholdsMessage } from "../../library/deadline-reminders";
import { durationToMs, humanizeDuration } from "../../library/dates";
import { settingsCallback, toggleThresholdCallback } from "../callback-data";
import { config } from "../../config";
import type { Context } from "../context";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

function buildThresholdsKeyboard(activeThresholds: string[]) {
  const keyboard = new InlineKeyboard();

  for (let i = 0; i < AVAILABLE_THRESHOLDS.length; i += 2) {
    const row = AVAILABLE_THRESHOLDS.slice(i, i + 2);
    const keyboardRow = keyboard.row();

    for (const threshold of row) {
      const isActive = activeThresholds.includes(threshold);
      keyboardRow.text(
        `${isActive ? "✅" : "☐"} ${humanizeDuration(threshold)}`,
        toggleThresholdCallback.pack({ threshold }),
      );
    }
  }

  return keyboard;
}

feature.command("settings", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const rows = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (rows.length === 0) {
    await ctx.reply("You're not registered. Use /start first.");
    return;
  }

  const user = rows[0]!;
  const thresholds: string[] = JSON.parse(user.thresholds);

  await ctx.reply(buildThresholdsMessage(thresholds), {
    parse_mode: "HTML",
    reply_markup: buildThresholdsKeyboard(thresholds),
  });
});

feature.callbackQuery(settingsCallback.filter(), async (ctx) => {
  const telegramId = ctx.from.id;

  const rows = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;
  const thresholds: string[] = JSON.parse(user.thresholds);

  await ctx.editMessageText(buildThresholdsMessage(thresholds), {
    parse_mode: "HTML",
    reply_markup: buildThresholdsKeyboard(thresholds),
  });

  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleThresholdCallback.filter(), async (ctx) => {
  const telegramId = ctx.from.id;
  const { threshold } = toggleThresholdCallback.unpack(ctx.callbackQuery.data) as {
    threshold: string;
  };

  const rows = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;
  const thresholds: string[] = JSON.parse(user.thresholds);
  const isActive = thresholds.includes(threshold);

  let updated: string[];
  if (isActive) {
    updated = thresholds.filter((t) => t !== threshold);
  } else {
    if (thresholds.length >= config.reminders.maxThresholds) {
      await ctx.answerCallbackQuery({
        text: `Maximum ${config.reminders.maxThresholds} thresholds allowed.`,
        show_alert: true,
      });
      return;
    }
    updated = [...thresholds, threshold].sort((a, b) => durationToMs(a) - durationToMs(b));
  }

  await db
    .update(users)
    .set({ thresholds: JSON.stringify(updated) })
    .where(eq(users.telegramId, telegramId));

  await ctx.editMessageText(buildThresholdsMessage(updated), {
    parse_mode: "HTML",
    reply_markup: buildThresholdsKeyboard(updated),
  });

  await ctx.answerCallbackQuery();
});

export { composer as settingsFeature };
