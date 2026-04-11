import { eq } from "drizzle-orm";
import { Composer, InputFile, InlineKeyboard } from "grammy";
import type { Context } from "../context";
import { config } from "../../config";
import { db } from "../../db";
import { users } from "../../db/schema";
import {
  buildTodayScheduleMessage,
  buildWeeklyScheduleMessage,
  buildNextWeekScheduleMessage,
  applyScheduleFilters,
  DEFAULT_SCHEDULE_FILTERS,
  getUniqueRooms,
  getScheduleForDay,
  getScheduleForDays,
  getDayName,
  getRemainingDaysOfWeek,
  hasRemainingClassesThisWeek,
  mergeAdjacentScheduleItems,
  normalizeScheduleFilters,
  sanitizeRoomFilename,
} from "../../library/schedule";
import {
  scheduleCallback,
  scheduleViewCallback,
  menuCallback,
  roomPhotoCallback,
  closeMessageCallback,
} from "../callback-data";
import { fetchCachedGroupSchedule } from "../schedule-cache";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

type ScheduleView = "today" | "week" | "next_week";

async function fetchScheduleMessage(
  ctx: Context,
  group: string,
  excludedCourses: string[],
  scheduleFilters: typeof DEFAULT_SCHEDULE_FILTERS,
  view: ScheduleView,
): Promise<{ message: string; rooms: string[]; hasThisWeek: boolean }> {
  const items = await fetchCachedGroupSchedule(ctx, group);
  const filters = normalizeScheduleFilters(scheduleFilters);
  const filtered = applyScheduleFilters(items, filters, excludedCourses);
  const merged = filters.combineAdjacentPairs ? mergeAdjacentScheduleItems(filtered) : filtered;
  const now = new Date();
  const hasThisWeek = hasRemainingClassesThisWeek(merged, now);
  const message =
    view === "week"
      ? buildWeeklyScheduleMessage(merged, now, group)
      : view === "next_week"
        ? buildNextWeekScheduleMessage(merged, now, group)
        : buildTodayScheduleMessage(merged, now, group);
  const visibleItems =
    view === "today"
      ? getScheduleForDay(merged, getDayName(now))
      : view === "week"
        ? getScheduleForDays(merged, getRemainingDaysOfWeek(now))
        : merged;
  const rooms = getUniqueRooms(visibleItems);
  return { message, rooms, hasThisWeek };
}

function buildScheduleKeyboard(view: ScheduleView, rooms: string[], hasThisWeek: boolean) {
  const keyboard = new InlineKeyboard();

  if (view === "today") {
    if (hasThisWeek) {
      keyboard.text("This week →", scheduleViewCallback.pack({ view: "week" }));
    }
    keyboard.text("Next week →", scheduleViewCallback.pack({ view: "next_week" }));
  } else if (view === "week") {
    keyboard
      .text("← Today", scheduleViewCallback.pack({ view: "today" }))
      .text("Next week →", scheduleViewCallback.pack({ view: "next_week" }));
  } else {
    keyboard.text("← Today", scheduleViewCallback.pack({ view: "today" }));
    if (hasThisWeek) {
      keyboard.text("← This week", scheduleViewCallback.pack({ view: "week" }));
    }
  }

  if (rooms.length > 0) {
    for (let i = 0; i < rooms.length; i += 3) {
      const rowRooms = rooms.slice(i, i + 3);
      keyboard.row();
      for (const room of rowRooms) {
        keyboard.text(`📍 ${room}`, roomPhotoCallback.pack({ room }));
      }
    }
  }

  keyboard.row().text("Back ←", menuCallback.pack({}));
  return keyboard;
}

async function replyWithScheduleView(ctx: Context, view: ScheduleView) {
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

  let result: { message: string; rooms: string[]; hasThisWeek: boolean };
  try {
    result = await fetchScheduleMessage(
      ctx,
      user.group,
      user.excludedCourses,
      user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS,
      view,
    );
  } catch {
    await ctx.reply("Failed to fetch schedule. Try again later.");
    return;
  }

  await ctx.reply(result.message, {
    parse_mode: "HTML",
    reply_markup: buildScheduleKeyboard(view, result.rooms, result.hasThisWeek),
  });
}

feature.command("today", async (ctx) => {
  await replyWithScheduleView(ctx, "today");
});

feature.command("schedule", async (ctx) => {
  await replyWithScheduleView(ctx, "next_week");
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

  let result: { message: string; rooms: string[]; hasThisWeek: boolean };
  try {
    result = await fetchScheduleMessage(
      ctx,
      user.group,
      user.excludedCourses,
      user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS,
      "today",
    );
  } catch {
    await ctx.editMessageText("Failed to fetch schedule.", {
      reply_markup: buildScheduleKeyboard("today", [], false),
    });
    return;
  }

  await ctx.editMessageText(result.message, {
    parse_mode: "HTML",
    reply_markup: buildScheduleKeyboard("today", result.rooms, result.hasThisWeek),
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

  let result: { message: string; rooms: string[]; hasThisWeek: boolean };
  try {
    result = await fetchScheduleMessage(
      ctx,
      user.group,
      user.excludedCourses,
      user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS,
      view,
    );
  } catch {
    await ctx.editMessageText("Failed to fetch schedule.", {
      reply_markup: buildScheduleKeyboard(view, [], false),
    });
    return;
  }

  await ctx.editMessageText(result.message, {
    parse_mode: "HTML",
    reply_markup: buildScheduleKeyboard(view, result.rooms, result.hasThisWeek),
  });
});

feature.callbackQuery(roomPhotoCallback.filter(), async (ctx) => {
  const { room } = roomPhotoCallback.unpack(ctx.callbackQuery.data) as { room: string };
  const url = `${config.roomsCdnUrl}/${sanitizeRoomFilename(room)}.png`;

  await ctx.answerCallbackQuery();

  const closeKeyboard = new InlineKeyboard().text("✕ Close", closeMessageCallback.pack({}));

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await ctx.replyWithPhoto(new InputFile(buffer, `${sanitizeRoomFilename(room)}.png`), {
      caption: `📍 ${room}`,
      reply_markup: closeKeyboard,
    });
  } catch {
    await ctx.reply(`📍 ${room}\n\nNo photo available.`, {
      reply_markup: closeKeyboard,
    });
  }
});

feature.callbackQuery(closeMessageCallback.filter(), async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.deleteMessage();
});

export { composer as scheduleFeature };
