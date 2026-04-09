import { Composer, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { fetchGroupSchedule } from "../../library/calendar-api";
import {
  buildTodayScheduleMessage,
  buildWeeklyScheduleMessage,
  applyScheduleFilters,
  DEFAULT_SCHEDULE_FILTERS,
} from "../../library/schedule";
import { scheduleCallback, scheduleViewCallback, menuCallback } from "../callback-data";
import type { Context } from "../context";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

type ScheduleView = "today" | "week";

async function fetchScheduleMessage(
  group: string,
  excludedCourses: string[],
  scheduleFilters: typeof DEFAULT_SCHEDULE_FILTERS,
  view: ScheduleView,
): Promise<string> {
  const items = await fetchGroupSchedule(group);
  const filtered = applyScheduleFilters(items, scheduleFilters, excludedCourses);
  return view === "week"
    ? buildWeeklyScheduleMessage(filtered, new Date(), group)
    : buildTodayScheduleMessage(filtered, new Date(), group);
}

function buildScheduleKeyboard(view: ScheduleView) {
  const keyboard = new InlineKeyboard();

  if (view === "today") {
    keyboard.text("This week →", scheduleViewCallback.pack({ view: "week" }));
  } else {
    keyboard.text("← Today", scheduleViewCallback.pack({ view: "today" }));
  }

  keyboard.row().text("Back ←", menuCallback.pack({}));
  return keyboard;
}

feature.command("schedule", async (ctx) => {
  if (!ctx.from?.id) {
    return;
  }

  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.reply("You're not registered. Use /start first.");
    return;
  }

  const user = rows[0]!;

  if (!user.group) {
    await ctx.reply(
      "No group linked. Connect your Calendar account via /settings → Schedule → Connect Calendar account.",
    );
    return;
  }

  await ctx.replyWithChatAction("typing");

  let message: string;
  try {
    message = await fetchScheduleMessage(
      user.group,
      user.excludedCourses,
      user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS,
      "today",
    );
  } catch {
    await ctx.reply("Failed to fetch schedule. Try again later.");
    return;
  }

  await ctx.reply(message, {
    parse_mode: "HTML",
    reply_markup: buildScheduleKeyboard("today"),
  });
});

feature.callbackQuery(scheduleCallback.filter(), async (ctx) => {
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;

  if (!user.group) {
    await ctx.answerCallbackQuery({
      text: "No group linked. Go to Settings → Schedule to connect.",
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery();

  let message: string;
  try {
    message = await fetchScheduleMessage(
      user.group,
      user.excludedCourses,
      user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS,
      "today",
    );
  } catch {
    await ctx.editMessageText("Failed to fetch schedule.", {
      reply_markup: buildScheduleKeyboard("today"),
    });
    return;
  }

  await ctx.editMessageText(message, {
    parse_mode: "HTML",
    reply_markup: buildScheduleKeyboard("today"),
  });
});

feature.callbackQuery(scheduleViewCallback.filter(), async (ctx) => {
  const { view } = scheduleViewCallback.unpack(ctx.callbackQuery.data) as { view: ScheduleView };

  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;

  if (!user.group) {
    await ctx.answerCallbackQuery({
      text: "No group linked. Go to Settings → Schedule to connect.",
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery();

  let message: string;
  try {
    message = await fetchScheduleMessage(
      user.group,
      user.excludedCourses,
      user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS,
      view,
    );
  } catch {
    await ctx.editMessageText("Failed to fetch schedule.", {
      reply_markup: buildScheduleKeyboard(view),
    });
    return;
  }

  await ctx.editMessageText(message, {
    parse_mode: "HTML",
    reply_markup: buildScheduleKeyboard(view),
  });
});

export { composer as scheduleFeature };
