import { Composer, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { AVAILABLE_THRESHOLDS, buildThresholdsMessage } from "../../library/deadline-reminders";
import { durationToMs, humanizeDuration } from "../../library/dates";
import {
  settingsCallback,
  deadlinesSettingsCallback,
  scheduleSettingsCallback,
  toggleThresholdCallback,
  toggleDeadlinesCallback,
  toggleScheduleCallback,
  toggleScheduleTypeCallback,
  toggleScheduleFormatCallback,
  updateCalendarCallback,
  connectCalendarCallback,
  menuCallback,
} from "../callback-data";
import { DEFAULT_SCHEDULE_FILTERS, type ScheduleFilters } from "../../library/schedule";
import { config } from "../../config";
import type { Context } from "../context";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

// ─── Settings root ───────────────────────────────────────────────────────────

function buildSettingsKeyboard() {
  return new InlineKeyboard()
    .text("📋 Deadlines", deadlinesSettingsCallback.pack({}))
    .text("📆 Schedule", scheduleSettingsCallback.pack({}))
    .row()
    .text("Back ←", menuCallback.pack({}));
}

function buildSettingsMessage() {
  return "<b>⚙️ Settings</b>\n\nChoose a category to configure:";
}

feature.command("settings", async (ctx) => {
  if (!ctx.from?.id) {
    return;
  }
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.reply("You're not registered. Use /start first.");
    return;
  }
  await ctx.reply(buildSettingsMessage(), {
    parse_mode: "HTML",
    reply_markup: buildSettingsKeyboard(),
  });
});

feature.callbackQuery(settingsCallback.filter(), async (ctx) => {
  await ctx.editMessageText(buildSettingsMessage(), {
    parse_mode: "HTML",
    reply_markup: buildSettingsKeyboard(),
  });
  await ctx.answerCallbackQuery();
});

// ─── Deadlines settings ───────────────────────────────────────────────────────

function buildDeadlinesKeyboard(activeThresholds: string[], deadlinesEnabled: boolean) {
  const keyboard = new InlineKeyboard();

  keyboard
    .row()
    .text(
      `Notifications: ${deadlinesEnabled ? "✅ On" : "🔕 Off"}`,
      toggleDeadlinesCallback.pack({}),
    );

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

  keyboard
    .row()
    .text("Update Calendar URL", updateCalendarCallback.pack({}))
    .row()
    .text("Back ←", settingsCallback.pack({}));

  return keyboard;
}

function buildDeadlinesMessage(thresholds: string[], deadlinesEnabled: boolean): string {
  let msg = "<b>📋 Deadlines Settings</b>\n\n";
  msg += buildThresholdsMessage(thresholds);
  if (!deadlinesEnabled) {
    msg += "\n\n⚠️ Notifications are currently disabled.";
  }
  return msg;
}

feature.callbackQuery(deadlinesSettingsCallback.filter(), async (ctx) => {
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }
  const user = rows[0]!;
  await ctx.editMessageText(buildDeadlinesMessage(user.thresholds, user.deadlinesEnabled), {
    parse_mode: "HTML",
    reply_markup: buildDeadlinesKeyboard(user.thresholds, user.deadlinesEnabled),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleDeadlinesCallback.filter(), async (ctx) => {
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }
  const user = rows[0]!;
  const updated = !user.deadlinesEnabled;
  await db
    .update(users)
    .set({ deadlinesEnabled: updated })
    .where(eq(users.telegramId, ctx.from.id));
  await ctx.editMessageText(buildDeadlinesMessage(user.thresholds, updated), {
    parse_mode: "HTML",
    reply_markup: buildDeadlinesKeyboard(user.thresholds, updated),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleThresholdCallback.filter(), async (ctx) => {
  const { threshold } = toggleThresholdCallback.unpack(ctx.callbackQuery.data) as {
    threshold: string;
  };

  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
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

  await db.update(users).set({ thresholds: updated }).where(eq(users.telegramId, ctx.from.id));

  await ctx.editMessageText(buildDeadlinesMessage(updated, user.deadlinesEnabled), {
    parse_mode: "HTML",
    reply_markup: buildDeadlinesKeyboard(updated, user.deadlinesEnabled),
  });
  await ctx.answerCallbackQuery();
});

// ─── Schedule settings ────────────────────────────────────────────────────────

function buildScheduleSettingsKeyboard(
  scheduleEnabled: boolean,
  hasGroup: boolean,
  filters: ScheduleFilters,
) {
  const keyboard = new InlineKeyboard();

  keyboard
    .row()
    .text(
      `Notifications: ${scheduleEnabled ? "✅ On" : "🔕 Off"}`,
      toggleScheduleCallback.pack({}),
    );

  const { eventTypes, eventFormats } = filters;

  keyboard
    .row()
    .text(
      `${eventTypes.lecture ? "✅" : "☐"} Lecture`,
      toggleScheduleTypeCallback.pack({ key: "lecture" }),
    )
    .text(
      `${eventTypes.practice ? "✅" : "☐"} Practice`,
      toggleScheduleTypeCallback.pack({ key: "practice" }),
    );

  keyboard
    .row()
    .text(
      `${eventTypes.learn ? "✅" : "☐"} Learn`,
      toggleScheduleTypeCallback.pack({ key: "learn" }),
    );

  keyboard
    .row()
    .text(
      `${eventFormats.online ? "✅" : "☐"} Online`,
      toggleScheduleFormatCallback.pack({ key: "online" }),
    )
    .text(
      `${eventFormats.offline ? "✅" : "☐"} Offline`,
      toggleScheduleFormatCallback.pack({ key: "offline" }),
    );

  if (!hasGroup) {
    keyboard
      .row()
      .text(
        "🔗 Connect Calendar account",
        connectCalendarCallback.pack({ from: "schedule_settings" }),
      );
  }

  keyboard.row().text("Back ←", settingsCallback.pack({}));

  return keyboard;
}

function buildScheduleSettingsMessage(scheduleEnabled: boolean, group: string | null): string {
  let msg = "<b>📆 Schedule Settings</b>\n\n";
  msg += group
    ? `Group: <b>${group}</b>\n`
    : "Group: not set\n";
  msg += "\nConfigure event types, formats, and notifications.";
  if (!group) {
    msg +=
      "\n\n<i>Schedule integration requires a saved primary group in Calendar. Save it in calendar.remoodle.app/account, then reconnect your Calendar account here.</i>";
  }
  return msg;
}

feature.callbackQuery(scheduleSettingsCallback.filter(), async (ctx) => {
  ctx.session.awaitingRemoodleToken = false;
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }
  const user = rows[0]!;
  const filters = user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS;
  await ctx.editMessageText(buildScheduleSettingsMessage(user.scheduleEnabled, user.group), {
    parse_mode: "HTML",
    reply_markup: buildScheduleSettingsKeyboard(user.scheduleEnabled, !!user.group, filters),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleScheduleCallback.filter(), async (ctx) => {
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }
  const user = rows[0]!;

  if (!user.group && !user.scheduleEnabled) {
    await ctx.answerCallbackQuery({
      text: "Connect your Calendar account first to enable schedule notifications.",
      show_alert: true,
    });
    return;
  }

  const updated = !user.scheduleEnabled;
  await db.update(users).set({ scheduleEnabled: updated }).where(eq(users.telegramId, ctx.from.id));

  const filters = user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS;
  await ctx.editMessageText(buildScheduleSettingsMessage(updated, user.group), {
    parse_mode: "HTML",
    reply_markup: buildScheduleSettingsKeyboard(updated, !!user.group, filters),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleScheduleTypeCallback.filter(), async (ctx) => {
  const { key } = toggleScheduleTypeCallback.unpack(ctx.callbackQuery.data) as { key: string };
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }
  const user = rows[0]!;
  const filters = { ...(user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS) };
  filters.eventTypes = {
    ...filters.eventTypes,
    [key]: !filters.eventTypes[key as keyof typeof filters.eventTypes],
  };

  await db.update(users).set({ scheduleFilters: filters }).where(eq(users.telegramId, ctx.from.id));

  await ctx.editMessageText(buildScheduleSettingsMessage(user.scheduleEnabled, user.group), {
    parse_mode: "HTML",
    reply_markup: buildScheduleSettingsKeyboard(user.scheduleEnabled, !!user.group, filters),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleScheduleFormatCallback.filter(), async (ctx) => {
  const { key } = toggleScheduleFormatCallback.unpack(ctx.callbackQuery.data) as { key: string };
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }
  const user = rows[0]!;
  const filters = { ...(user.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS) };
  filters.eventFormats = {
    ...filters.eventFormats,
    [key]: !filters.eventFormats[key as keyof typeof filters.eventFormats],
  };

  await db.update(users).set({ scheduleFilters: filters }).where(eq(users.telegramId, ctx.from.id));

  await ctx.editMessageText(buildScheduleSettingsMessage(user.scheduleEnabled, user.group), {
    parse_mode: "HTML",
    reply_markup: buildScheduleSettingsKeyboard(user.scheduleEnabled, !!user.group, filters),
  });
  await ctx.answerCallbackQuery();
});

export { composer as settingsFeature };
