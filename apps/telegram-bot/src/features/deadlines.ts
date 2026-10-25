import { Composer } from "grammy";
import type { Context } from "../context";
import { fetchDeadlines, findAccount } from "../server";
import { buildDeadlinesMessage } from "@heresy/shared/deadline-reminders";
import { m } from "@heresy/shared/i18n/messages";
import { deadlinesCallback } from "../callback-data";
import { buildBackToMenuKeyboard } from "../keyboards/menu";

export const composer = new Composer<Context>();

const feature = composer.chatType(["private", "group", "supergroup"]);

async function fetchDeadlinesMessage(
  telegramId: number,
  excludedCourses: string[],
  daysLimit?: number,
) {
  const events = await fetchDeadlines(telegramId);

  const filtered =
    excludedCourses.length > 0
      ? events.filter((e) => !excludedCourses.includes(e.courseName ?? ""))
      : events;

  return buildDeadlinesMessage(filtered, daysLimit);
}

feature.command(["deadlines", "d", "ds"], async (ctx) => {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    return;
  }

  const account = await findAccount(telegramId);

  if (!account) {
    await ctx.reply(m.not_registered_use_start());

    return;
  }

  if (!account.moodleConnected) {
    await ctx.reply(m.no_calendar_url_set());

    return;
  }

  await ctx.replyWithChatAction("typing");

  const command = ctx.msg?.text.match(/^\/([a-z0-9_]+)/i)?.[1]?.toLowerCase();
  const daysLimit = command === "ds" ? 2 : undefined;

  let message: string;

  try {
    message = await fetchDeadlinesMessage(telegramId, account.excludedCourses, daysLimit);
  } catch {
    await ctx.reply(m.calendar_fetch_failed());

    return;
  }

  await ctx.reply(message, { parse_mode: "HTML" });
});

feature.chatType("private").callbackQuery(deadlinesCallback.filter(), async (ctx) => {
  const account = await findAccount(ctx.from.id);

  if (!account) {
    await ctx.answerCallbackQuery(m.not_registered_short());

    return;
  }

  if (!account.moodleConnected) {
    await ctx.answerCallbackQuery({
      text: m.no_calendar_url_callback(),
      show_alert: true,
    });

    return;
  }

  await ctx.answerCallbackQuery();

  let message: string;

  try {
    message = await fetchDeadlinesMessage(ctx.from.id, account.excludedCourses);
  } catch {
    await ctx.editMessageText(m.calendar_fetch_failed_short(), {
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
