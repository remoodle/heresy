import { all } from "better-all";
import { eq } from "drizzle-orm";
import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "../context";
import { config } from "../../config";
import { db } from "../../db";
import { users } from "../../db/schema";
import { fetchCalendarEvents } from "../../library/calendar";
import { validateRemoodleConnectToken } from "../../library/calendar-api";
import {
  applyScheduleFilters,
  buildClassBreakdown,
  getDayName,
  getScheduleForDay,
  mergeAdjacentScheduleItems,
  normalizeScheduleFilters,
} from "../../library/schedule";
import { calendarFetchUser } from "../../worker/workflows/calendar-fetch-user";
import {
  aboutCallback,
  menuCallback,
  updateCalendarCallback,
  connectCalendarCallback,
  setupCallback,
  scheduleSettingsCallback,
  deadlinesSettingsCallback,
} from "../callback-data";
import { buildMenuKeyboard } from "../keyboards/menu";
import { fetchCachedGroupSchedule } from "../schedule-cache";

type MenuUser = {
  group: string | null;
  calendarUrl: string;
  calendarAccountLinked: boolean;
  excludedCourses: string[];
  scheduleFilters?: {
    eventTypes: { lecture: boolean; practice: boolean; learn: boolean };
    eventFormats: { online: boolean; offline: boolean };
    combineAdjacentPairs?: boolean;
  } | null;
};

async function buildMenuMessage(ctx: Context, user: MenuUser): Promise<string> {
  const parts: string[] = ["👋 ReMoodle is ready"];

  const summary = await buildMenuSummary(ctx, user);
  if (summary) {
    parts.push(summary);
  } else if (user.calendarAccountLinked && !user.group) {
    parts.push("⚠️ Save a primary group in Calendar, then reconnect.");
  } else if (!user.calendarUrl) {
    parts.push("⚠️ Add your Moodle calendar URL in Settings to enable deadlines.");
  }

  return parts.join("\n\n");
}

async function buildMenuSummary(ctx: Context, user: MenuUser): Promise<string | null> {
  const { deadlinesCount, todayClasses } = await all({
    async deadlinesCount() {
      return getTodayDeadlinesCount(user);
    },
    async todayClasses() {
      return getTodayClasses(ctx, user);
    },
  });

  const hasBoth = deadlinesCount !== null && todayClasses !== null;
  const deadlineOnly = deadlinesCount !== null && todayClasses === null;
  const classesOnly = todayClasses !== null && deadlinesCount === null;

  if (hasBoth) {
    const deadlinePart =
      deadlinesCount === 0
        ? "no deadlines"
        : `${deadlinesCount} deadline${deadlinesCount === 1 ? "" : "s"}`;
    const classPart = todayClasses.length === 0 ? "no classes" : buildClassBreakdown(todayClasses);
    const freeDay = deadlinesCount === 0 && todayClasses.length === 0;
    return `${freeDay ? "🌴 " : ""}You have ${deadlinePart} and ${classPart} for today`;
  }

  if (deadlineOnly) {
    if (deadlinesCount === 0) return "🌴 No deadlines for today";
    return `You have ${deadlinesCount} deadline${deadlinesCount === 1 ? "" : "s"} for today`;
  }

  if (classesOnly) {
    if (todayClasses.length === 0) return "🌴 No classes for today";
    return `You have ${buildClassBreakdown(todayClasses)} for today`;
  }

  return null;
}

function getAlmatyDateKey(value: number | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

async function getTodayDeadlinesCount(user: Pick<MenuUser, "calendarUrl" | "excludedCourses">) {
  if (!user.calendarUrl) {
    return null;
  }

  try {
    const todayKey = getAlmatyDateKey(Date.now());
    const events = await fetchCalendarEvents(user.calendarUrl);
    return events.filter(
      (event) =>
        event.timestampMs > Date.now() &&
        getAlmatyDateKey(event.timestampMs) === todayKey &&
        !user.excludedCourses.includes(event.courseName ?? ""),
    ).length;
  } catch {
    return null;
  }
}

async function getTodayClasses(
  ctx: Context,
  user: Pick<MenuUser, "group" | "excludedCourses" | "scheduleFilters">,
) {
  if (!user.group) {
    return null;
  }

  try {
    const items = await fetchCachedGroupSchedule(ctx, user.group);
    const filters = normalizeScheduleFilters(user.scheduleFilters);
    const filtered = applyScheduleFilters(items, filters, user.excludedCourses);
    const merged = filters.combineAdjacentPairs ? mergeAdjacentScheduleItems(filtered) : filtered;
    return getScheduleForDay(merged, getDayName(new Date()));
  } catch {
    return null;
  }
}

function buildAboutMessage() {
  return [
    "<b>About ReMoodle</b>",
    "",
    "ReMoodle helps AITU students keep up with deadlines and schedule",
    "",
    `Calendar: <a href="${config.calendar.url}/">${config.calendar.host}</a>`,
    `Map: <a href="${config.aitumap.url}/">${config.aitumap.host}</a>`,
    `Docs: <a href="${config.docs.url}/">${config.docs.host}</a>`,
    'GitHub: <a href="https://github.com/remoodle/heresy">github.com/remoodle/heresy</a>',
  ].join("\n");
}

function buildSetupKeyboard() {
  return new InlineKeyboard()
    .text("📅 Add Moodle calendar URL", updateCalendarCallback.pack({ from: "setup" }))
    .row()
    .text("🔗 Connect Calendar account", connectCalendarCallback.pack({ from: "setup" }));
}

function buildSetupMessage() {
  return `👋 Welcome to ReMoodle!\n\nHow would you like to set up?\n\n📅 <b>Moodle calendar URL</b> — track assignment deadlines\n🔗 <b>Calendar account</b> — view your class schedule`;
}

function buildUpdateCalendarKeyboard(from: "setup" | "deadlines_settings") {
  return new InlineKeyboard().text(
    "Back ←",
    from === "deadlines_settings" ? deadlinesSettingsCallback.pack({}) : setupCallback.pack({}),
  );
}

const CALENDAR_URL_PROMPT = `Send your Moodle calendar URL:\n\n<a href="${config.docs.moodleCalendarGuideUrl}">Where to get it?</a>`;

function buildConnectCalendarKeyboard(from: "setup" | "schedule_settings") {
  return new InlineKeyboard().text(
    "Back ←",
    from === "schedule_settings" ? scheduleSettingsCallback.pack({}) : setupCallback.pack({}),
  );
}

function buildConnectCalendarMessage() {
  return `Go to <a href="${config.calendar.accountUrl}">${config.calendar.host}/account</a>\n\n→ Open <b>Account</b>\n→ Click <b>Generate code</b>\n→ Paste the 6-character code here:`;
}

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("start", async (ctx) => {
  const telegramId = ctx.from.id;

  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (existing.length > 0) {
    const user = existing[0]!;
    await ctx.reply(await buildMenuMessage(ctx, user), {
      reply_markup: buildMenuKeyboard(),
    });
    return;
  }

  await ctx.reply(buildSetupMessage(), {
    parse_mode: "HTML",
    reply_markup: buildSetupKeyboard(),
  });
});

feature.command("update", async (ctx) => {
  ctx.session.awaitingCalendarUrl = true;
  await ctx.reply(CALENDAR_URL_PROMPT, { parse_mode: "HTML" });
});

feature.callbackQuery(menuCallback.filter(), async (ctx) => {
  ctx.session.awaitingRemoodleToken = false;
  ctx.session.awaitingCalendarUrl = false;
  const telegramId = ctx.from.id;
  const rows = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;
  await ctx.editMessageText(await buildMenuMessage(ctx, user), {
    reply_markup: buildMenuKeyboard(),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(aboutCallback.filter(), async (ctx) => {
  await ctx.editMessageText(buildAboutMessage(), {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard().text("Back ←", menuCallback.pack({})),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(setupCallback.filter(), async (ctx) => {
  ctx.session.awaitingRemoodleToken = false;
  ctx.session.awaitingCalendarUrl = false;
  await ctx.editMessageText(buildSetupMessage(), {
    parse_mode: "HTML",
    reply_markup: buildSetupKeyboard(),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(updateCalendarCallback.filter(), async (ctx) => {
  const { from } = updateCalendarCallback.unpack(ctx.callbackQuery.data) as {
    from: "setup" | "deadlines_settings";
  };
  ctx.session.awaitingCalendarUrl = true;
  ctx.session.awaitingRemoodleToken = false;
  const keyboard = buildUpdateCalendarKeyboard(from);
  try {
    await ctx.editMessageText(CALENDAR_URL_PROMPT, { parse_mode: "HTML", reply_markup: keyboard });
  } catch {
    await ctx.reply(CALENDAR_URL_PROMPT, { parse_mode: "HTML", reply_markup: keyboard });
  }
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(connectCalendarCallback.filter(), async (ctx) => {
  const { from } = connectCalendarCallback.unpack(ctx.callbackQuery.data) as {
    from: "setup" | "schedule_settings";
  };
  ctx.session.awaitingRemoodleToken = true;
  ctx.session.awaitingCalendarUrl = false;
  try {
    await ctx.editMessageText(buildConnectCalendarMessage(), {
      parse_mode: "HTML",
      reply_markup: buildConnectCalendarKeyboard(from),
    });
  } catch {
    await ctx.reply(buildConnectCalendarMessage(), {
      parse_mode: "HTML",
      reply_markup: buildConnectCalendarKeyboard(from),
    });
  }
  await ctx.answerCallbackQuery();
});

feature.on("message:text", async (ctx, next) => {
  if (ctx.session.awaitingCalendarUrl) {
    const url = ctx.message.text.trim();

    if (!url.startsWith("http")) {
      await ctx.reply("That doesn't look like a URL. Please send a valid Moodle calendar URL:");
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

    await ctx.reply(`✅ Calendar URL saved!\n\n${await buildMenuMessage(ctx, user!)}`, {
      reply_markup: buildMenuKeyboard(),
    });
    return;
  }

  const rawText = ctx.message.text.trim();
  const isRemoodleCode = /^RE_[A-Z0-9]{6}$/i.test(rawText);

  if (ctx.session.awaitingRemoodleToken || isRemoodleCode) {
    const code = rawText.toUpperCase();
    const telegramId = ctx.from.id;

    if (!config.calendarApi.url) {
      await ctx.reply("Calendar integration is not configured. Contact the admin.");
      ctx.session.awaitingRemoodleToken = false;
      return;
    }

    let connectResult: { userId: string; email: string; group: string | null };
    try {
      connectResult = await validateRemoodleConnectToken(code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await ctx.reply(`❌ ${msg}\n\nTry generating a new code in the Calendar app.`);
      return;
    }

    await db
      .insert(users)
      .values({
        telegramId,
        calendarUrl: "",
        group: connectResult.group ?? undefined,
        calendarAccountLinked: true,
        thresholds: config.reminders.defaultThresholds,
      })
      .onConflictDoUpdate({
        target: users.telegramId,
        set: {
          group: connectResult.group ?? undefined,
          calendarAccountLinked: true,
        },
      });

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

    ctx.session.awaitingRemoodleToken = false;

    const groupMsg = connectResult.group
      ? `📆 Your group: <b>${connectResult.group}</b>`
      : `⚠️ No saved primary group found in Calendar. Save it in ${config.calendar.host}/account, then reconnect here to enable /schedule.`;

    await ctx.reply(
      `✅ Calendar account connected!\n\n${groupMsg}\n\n${await buildMenuMessage(ctx, user!)}`,
      {
        parse_mode: "HTML",
        reply_markup: buildMenuKeyboard(),
      },
    );
    return;
  }

  return next();
});

export { composer as startFeature };
