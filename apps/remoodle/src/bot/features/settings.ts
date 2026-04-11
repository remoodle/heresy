import { eq } from "drizzle-orm";
import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "../context";
import { config } from "../../config";
import { db } from "../../db";
import { calendarEvents, sentReminders, users } from "../../db/schema";
import { durationToMs, humanizeDuration } from "../../library/dates";
import { AVAILABLE_THRESHOLDS, buildThresholdsMessage } from "../../library/deadline-reminders";
import { normalizeScheduleFilters, type ScheduleFilters } from "../../library/schedule";
import {
  settingsCallback,
  deadlinesSettingsCallback,
  scheduleSettingsCallback,
  toggleThresholdCallback,
  toggleDeadlinesCallback,
  toggleScheduleCallback,
  toggleScheduleTypeCallback,
  toggleScheduleFormatCallback,
  toggleScheduleMergeCallback,
  updateCalendarCallback,
  connectCalendarCallback,
  menuCallback,
  accountCallback,
  deleteAccountCallback,
  confirmDeleteAccountCallback,
  coursesCallback,
} from "../callback-data";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

// ─── Settings root ───────────────────────────────────────────────────────────

function buildSettingsKeyboard() {
  return new InlineKeyboard()
    .text("📋 Deadlines", deadlinesSettingsCallback.pack({}))
    .text("📆 Schedule", scheduleSettingsCallback.pack({}))
    .row()
    .text("📚 Courses", coursesCallback.pack({}))
    .text("👤 Account", accountCallback.pack({}))
    .row()
    .text("Back ←", menuCallback.pack({}));
}

function buildSettingsMessage() {
  return "<b>⚙️ Settings</b>\n\nChoose a category to configure:";
}

function buildAccountKeyboard() {
  return new InlineKeyboard()
    .text("🗑 Delete account", deleteAccountCallback.pack({}))
    .row()
    .text("Back ←", settingsCallback.pack({}));
}

function buildDeleteAccountKeyboard() {
  return new InlineKeyboard()
    .text("✅ Yes, delete", confirmDeleteAccountCallback.pack({ confirmed: "yes" }))
    .text("Cancel", confirmDeleteAccountCallback.pack({ confirmed: "no" }));
}

function buildDeleteAccountMessage() {
  return (
    "<b>⚠️ Delete account</b>\n\n" +
    "This will permanently remove your account, saved calendar events, and reminder history.\n\n" +
    "Are you sure?"
  );
}

function buildAccountMessage(user: {
  id: number;
  telegramId: number;
  calendarUrl: string;
  calendarAccountLinked: boolean;
  group: string | null;
}): string {
  let msg = "<b>👤 Account</b>\n\n";
  msg += `User ID: <code>${user.id}</code>\n`;
  msg += `Telegram ID: <code>${user.telegramId}</code>\n\n`;
  msg += `Moodle calendar: ${user.calendarUrl ? "✅ connected" : "not set"}\n`;
  msg += `Calendar account: ${user.calendarAccountLinked ? "✅ connected" : "not set"}\n`;
  msg += `Group: ${user.group ? `<b>${user.group}</b>` : "not set"}`;
  return msg;
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

feature.callbackQuery(accountCallback.filter(), async (ctx) => {
  const rows = await db
    .select({
      id: users.id,
      telegramId: users.telegramId,
      calendarUrl: users.calendarUrl,
      calendarAccountLinked: users.calendarAccountLinked,
      group: users.group,
    })
    .from(users)
    .where(eq(users.telegramId, ctx.from.id))
    .limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  await ctx.editMessageText(buildAccountMessage(rows[0]!), {
    parse_mode: "HTML",
    reply_markup: buildAccountKeyboard(),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(deleteAccountCallback.filter(), async (ctx) => {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.telegramId, ctx.from.id))
    .limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  await ctx.editMessageText(buildDeleteAccountMessage(), {
    parse_mode: "HTML",
    reply_markup: buildDeleteAccountKeyboard(),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(confirmDeleteAccountCallback.filter(), async (ctx) => {
  const { confirmed } = confirmDeleteAccountCallback.unpack(ctx.callbackQuery.data) as {
    confirmed: "yes" | "no";
  };

  if (confirmed === "no") {
    const rows = await db
      .select({
        id: users.id,
        telegramId: users.telegramId,
        calendarUrl: users.calendarUrl,
        calendarAccountLinked: users.calendarAccountLinked,
        group: users.group,
      })
      .from(users)
      .where(eq(users.telegramId, ctx.from.id))
      .limit(1);

    if (rows.length === 0) {
      await ctx.answerCallbackQuery("Not registered.");
      return;
    }

    await ctx.editMessageText(buildAccountMessage(rows[0]!), {
      parse_mode: "HTML",
      reply_markup: buildAccountKeyboard(),
    });
    await ctx.answerCallbackQuery();
    return;
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.telegramId, ctx.from.id))
    .limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const userId = rows[0]!.id;

  await db.delete(sentReminders).where(eq(sentReminders.userId, userId));
  await db.delete(calendarEvents).where(eq(calendarEvents.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  ctx.session.awaitingCalendarUrl = false;
  ctx.session.awaitingRemoodleToken = false;

  await ctx.editMessageText("✅ Account deleted. Send /start to set up ReMoodle again.");
  await ctx.answerCallbackQuery({ text: "Account deleted." });
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
    .text("Update Calendar URL", updateCalendarCallback.pack({ from: "deadlines_settings" }))
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

  keyboard
    .row()
    .text(
      `${filters.combineAdjacentPairs ? "✅" : "☐"} Combine adjacent pairs`,
      toggleScheduleMergeCallback.pack({}),
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

function buildScheduleSettingsMessage(
  scheduleEnabled: boolean,
  group: string | null,
  filters: ScheduleFilters,
): string {
  let msg = "<b>📆 Schedule Settings</b>\n\n";
  msg += group ? `Group: <b>${group}</b>\n` : "Group: not set\n";
  msg += `Merge adjacent pairs: ${filters.combineAdjacentPairs ? "✅ On" : "☐ Off"}\n`;
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
  const filters = normalizeScheduleFilters(user.scheduleFilters);
  await ctx.editMessageText(
    buildScheduleSettingsMessage(user.scheduleEnabled, user.group, filters),
    {
      parse_mode: "HTML",
      reply_markup: buildScheduleSettingsKeyboard(user.scheduleEnabled, !!user.group, filters),
    },
  );
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

  const filters = normalizeScheduleFilters(user.scheduleFilters);
  await ctx.editMessageText(buildScheduleSettingsMessage(updated, user.group, filters), {
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
  const filters = normalizeScheduleFilters(user.scheduleFilters);
  filters.eventTypes = {
    ...filters.eventTypes,
    [key]: !filters.eventTypes[key as keyof typeof filters.eventTypes],
  };

  await db.update(users).set({ scheduleFilters: filters }).where(eq(users.telegramId, ctx.from.id));

  await ctx.editMessageText(
    buildScheduleSettingsMessage(user.scheduleEnabled, user.group, filters),
    {
      parse_mode: "HTML",
      reply_markup: buildScheduleSettingsKeyboard(user.scheduleEnabled, !!user.group, filters),
    },
  );
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
  const filters = normalizeScheduleFilters(user.scheduleFilters);
  filters.eventFormats = {
    ...filters.eventFormats,
    [key]: !filters.eventFormats[key as keyof typeof filters.eventFormats],
  };

  await db.update(users).set({ scheduleFilters: filters }).where(eq(users.telegramId, ctx.from.id));

  await ctx.editMessageText(
    buildScheduleSettingsMessage(user.scheduleEnabled, user.group, filters),
    {
      parse_mode: "HTML",
      reply_markup: buildScheduleSettingsKeyboard(user.scheduleEnabled, !!user.group, filters),
    },
  );
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleScheduleMergeCallback.filter(), async (ctx) => {
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }
  const user = rows[0]!;
  const filters = normalizeScheduleFilters(user.scheduleFilters);
  filters.combineAdjacentPairs = !filters.combineAdjacentPairs;

  await db.update(users).set({ scheduleFilters: filters }).where(eq(users.telegramId, ctx.from.id));

  await ctx.editMessageText(
    buildScheduleSettingsMessage(user.scheduleEnabled, user.group, filters),
    {
      parse_mode: "HTML",
      reply_markup: buildScheduleSettingsKeyboard(user.scheduleEnabled, !!user.group, filters),
    },
  );
  await ctx.answerCallbackQuery();
});

export { composer as settingsFeature };
