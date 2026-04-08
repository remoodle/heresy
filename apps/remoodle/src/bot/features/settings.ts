import { Composer, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { AVAILABLE_THRESHOLDS, buildThresholdsMessage } from "../../library/deadline-reminders";
import { durationToMs, humanizeDuration } from "../../library/dates";
import { settingsCallback, toggleThresholdCallback, startMenuCallback } from "../callback-data";
import { config } from "../../config";
import type { Context } from "../context";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

const REPOSITORY_URL = "https://github.com/remoodle/heresy";

function buildAboutMessage() {
  return (
    `About ReMoodle\n\n` +
    `Source code: ${REPOSITORY_URL}\n` +
    `Issues and contributions are welcome.`
  );
}

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

  keyboard.row().text("← Back to menu", startMenuCallback.pack({}));

  return keyboard;
}

feature.command("settings", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    return;
  }

  const rows = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (rows.length === 0) {
    await ctx.reply("You're not registered. Use /start first.");
    return;
  }

  const user = rows[0]!;

  await ctx.reply(buildThresholdsMessage(user.thresholds), {
    parse_mode: "HTML",
    reply_markup: buildThresholdsKeyboard(user.thresholds),
  });
});

feature.command("about", async (ctx) => {
  await ctx.reply(buildAboutMessage(), {
    reply_markup: new InlineKeyboard().url("Open repository", REPOSITORY_URL),
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

  await ctx.editMessageText(buildThresholdsMessage(user.thresholds), {
    parse_mode: "HTML",
    reply_markup: buildThresholdsKeyboard(user.thresholds),
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
  const isActive = user.thresholds.includes(threshold);

  let updated: string[];
  if (isActive) {
    updated = user.thresholds.filter((t) => t !== threshold);
  } else {
    if (user.thresholds.length >= config.reminders.maxThresholds) {
      await ctx.answerCallbackQuery({
        text: `Maximum ${config.reminders.maxThresholds} thresholds allowed.`,
        show_alert: true,
      });
      return;
    }
    updated = [...user.thresholds, threshold].sort((a, b) => durationToMs(a) - durationToMs(b));
  }

  await db.update(users).set({ thresholds: updated }).where(eq(users.telegramId, telegramId));

  await ctx.editMessageText(buildThresholdsMessage(updated), {
    parse_mode: "HTML",
    reply_markup: buildThresholdsKeyboard(updated),
  });

  await ctx.answerCallbackQuery();
});

export { composer as settingsFeature };
