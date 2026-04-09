import { eq } from "drizzle-orm";
import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "../context";
import { config } from "../../config";
import { db } from "../../db";
import { users } from "../../db/schema";
import { validateRemoodleConnectToken } from "../../library/calendar-api";
import { durationToMs, humanizeDuration } from "../../library/dates";
import { calendarFetchUser } from "../../worker/workflows/calendar-fetch-user";
import {
  menuCallback,
  updateCalendarCallback,
  connectCalendarCallback,
  setupCallback,
  scheduleSettingsCallback,
  deadlinesSettingsCallback,
} from "../callback-data";
import { buildMenuKeyboard } from "../keyboards/menu";

const CALENDAR_APP_URL = `${config.calendarApi.url || "https://calendar.remoodle.app"}/account`;

function buildMenuMessage(user: {
  thresholds: string[];
  group: string | null;
  calendarUrl: string;
  calendarAccountLinked: boolean;
}): string {
  const formatted =
    user.thresholds.length === 0
      ? "none"
      : [...user.thresholds]
          .sort((a, b) => durationToMs(a) - durationToMs(b))
          .map(humanizeDuration)
          .join(", ");

  const parts: string[] = ["👋 You're registered with ReMoodle."];

  if (user.calendarUrl) {
    parts.push("📅 Moodle calendar: connected");
  }

  if (user.calendarAccountLinked && user.group) {
    parts.push(`📆 Schedule group: ${user.group}`);
  } else if (user.calendarAccountLinked) {
    parts.push("⚠️ Schedule: save a primary group in Calendar and reconnect");
  }

  parts.push(`🔔 Thresholds: ${formatted}`);

  return parts.join("\n");
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

const CALENDAR_URL_PROMPT = `Send your Moodle calendar URL:\n\n<a href="https://docs.remoodle.app/guide/moodle-calendar-url">Where to get it?</a>`;

function buildConnectCalendarKeyboard(from: "setup" | "schedule_settings") {
  return new InlineKeyboard().text(
    "Back ←",
    from === "schedule_settings" ? scheduleSettingsCallback.pack({}) : setupCallback.pack({}),
  );
}

function buildConnectCalendarMessage() {
  return `Go to <a href="${CALENDAR_APP_URL}">calendar.remoodle.app/account</a>\n\n→ Open <b>Account</b>\n→ Click <b>Generate code</b>\n→ Paste the 6-character code here:`;
}

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("start", async (ctx) => {
  const telegramId = ctx.from.id;

  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (existing.length > 0) {
    const user = existing[0]!;
    await ctx.reply(buildMenuMessage(user), { reply_markup: buildMenuKeyboard() });
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
  await ctx.editMessageText(buildMenuMessage(user), {
    reply_markup: buildMenuKeyboard(),
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

    await ctx.reply(`✅ Calendar URL saved!\n\n${buildMenuMessage(user!)}`, {
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
      : "⚠️ No saved primary group found in Calendar. Save it in calendar.remoodle.app/account, then reconnect here to enable /schedule.";

    await ctx.reply(`✅ Calendar account connected!\n\n${groupMsg}\n\n${buildMenuMessage(user!)}`, {
      parse_mode: "HTML",
      reply_markup: buildMenuKeyboard(),
    });
    return;
  }

  return next();
});

export { composer as startFeature };
