import { eq } from "drizzle-orm";
import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "../context";
import { config } from "../../config";
import { db } from "../../db";
import { calendarEvents, sentNotifications, users } from "../../db/schema";
import { durationToMs, humanizeDuration } from "../../library/dates";
import { AVAILABLE_THRESHOLDS, buildThresholdsMessage } from "../../library/deadline-reminders";
import { normalizeScheduleFilters, type ScheduleFilters } from "../../library/schedule";
import { m } from "../../library/i18n/messages.js";
import { bold, code, italic } from "../../library/telegram-html";
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
  setScheduleReminderCallback,
} from "../callback-data";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

function checkboxLabel(enabled: boolean, label: string) {
  return `${enabled ? "✅" : "☐"} ${label}`;
}

function notificationsLabel(enabled: boolean) {
  return m.ui_notifications({ status: enabled ? m.ui_status_on() : m.ui_status_muted_off() });
}

// ─── Settings root ───────────────────────────────────────────────────────────

function buildSettingsKeyboard() {
  return new InlineKeyboard()
    .text(m.menu_button_deadlines(), deadlinesSettingsCallback.pack({}))
    .text(m.menu_button_schedule(), scheduleSettingsCallback.pack({}))
    .row()
    .text(m.settings_button_courses(), coursesCallback.pack({}))
    .text(m.account_header(), accountCallback.pack({}))
    .row()
    .text(m.ui_back(), menuCallback.pack({}));
}

function buildAccountKeyboard() {
  return new InlineKeyboard()
    .text(m.account_button_delete(), deleteAccountCallback.pack({}))
    .row()
    .text(m.ui_back(), settingsCallback.pack({}));
}

function buildDeleteAccountKeyboard() {
  return new InlineKeyboard()
    .text(
      m.account_button_confirm_delete(),
      confirmDeleteAccountCallback.pack({ confirmed: "yes" }),
    )
    .text(m.ui_cancel(), confirmDeleteAccountCallback.pack({ confirmed: "no" }));
}

function buildAccountMessage(user: {
  id: number;
  telegramId: number;
  calendarUrl: string;
  calendarAccountLinked: boolean;
  group: string | null;
}): string {
  return [
    bold(m.account_header()),
    "",
    m.account_user_id({ id: code(user.id) }),
    m.account_telegram_id({ telegramId: code(user.telegramId) }),
    "",
    user.group ? m.account_group({ group: bold(user.group) }) : m.account_no_group(),
    "",
    user.calendarUrl ? m.account_moodle_calendar_set() : m.account_moodle_calendar_unset(),
    user.calendarAccountLinked
      ? m.account_calendar_account_linked()
      : m.account_calendar_account_unlinked(),
  ].join("\n");
}

feature.command("settings", async (ctx) => {
  if (!ctx.from?.id) {
    return;
  }
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.reply(m.not_registered());
    return;
  }
  await ctx.reply(m.settings_header(), {
    parse_mode: "HTML",
    reply_markup: buildSettingsKeyboard(),
  });
});

feature.callbackQuery(settingsCallback.filter(), async (ctx) => {
  await ctx.editMessageText(m.settings_header(), {
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
    await ctx.answerCallbackQuery(m.not_registered_short());
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
    await ctx.answerCallbackQuery(m.not_registered_short());
    return;
  }

  await ctx.editMessageText(
    [bold(m.delete_account_header()), "", m.delete_account_body()].join("\n"),
    {
      parse_mode: "HTML",
      reply_markup: buildDeleteAccountKeyboard(),
    },
  );
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
      await ctx.answerCallbackQuery(m.not_registered_short());
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
    await ctx.answerCallbackQuery(m.not_registered_short());
    return;
  }

  const userId = rows[0]!.id;

  await db.delete(sentNotifications).where(eq(sentNotifications.userId, userId));
  await db.delete(calendarEvents).where(eq(calendarEvents.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  ctx.session.awaitingCalendarUrl = false;
  ctx.session.awaitingRemoodleToken = false;

  await ctx.editMessageText(m.account_deleted());
  await ctx.answerCallbackQuery({ text: m.account_deleted() });
});

// ─── Deadlines settings ───────────────────────────────────────────────────────

function buildDeadlinesKeyboard(activeThresholds: string[], deadlinesEnabled: boolean) {
  const keyboard = new InlineKeyboard();

  keyboard.row().text(notificationsLabel(deadlinesEnabled), toggleDeadlinesCallback.pack({}));

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
    .text(
      m.settings_button_update_calendar_url(),
      updateCalendarCallback.pack({ from: "deadlines_settings" }),
    )
    .row()
    .text(m.ui_back(), settingsCallback.pack({}));

  return keyboard;
}

function buildDeadlinesMessage(thresholds: string[], deadlinesEnabled: boolean): string {
  const parts = [bold(m.deadlines_settings_header()), "", buildThresholdsMessage(thresholds)];
  if (!deadlinesEnabled) {
    parts.push("", m.deadlines_disabled_warning());
  }
  return parts.join("\n");
}

feature.callbackQuery(deadlinesSettingsCallback.filter(), async (ctx) => {
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery(m.not_registered_short());
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
    await ctx.answerCallbackQuery(m.not_registered_short());
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
    await ctx.answerCallbackQuery(m.not_registered_short());
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
        text: m.max_thresholds({ max: config.reminders.maxThresholds }),
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
  reminderOffset: string,
) {
  const keyboard = new InlineKeyboard();

  keyboard.row().text(notificationsLabel(scheduleEnabled), toggleScheduleCallback.pack({}));

  const { eventTypes, eventFormats } = filters;

  keyboard
    .row()
    .text(
      checkboxLabel(eventTypes.lecture, m.class_type_lecture()),
      toggleScheduleTypeCallback.pack({ key: "lecture" }),
    )
    .text(
      checkboxLabel(eventTypes.practice, m.class_type_practice()),
      toggleScheduleTypeCallback.pack({ key: "practice" }),
    );

  keyboard
    .row()
    .text(
      checkboxLabel(eventTypes.learn, m.ui_learn()),
      toggleScheduleTypeCallback.pack({ key: "learn" }),
    );

  keyboard
    .row()
    .text(
      checkboxLabel(eventFormats.online, m.location_online()),
      toggleScheduleFormatCallback.pack({ key: "online" }),
    )
    .text(
      checkboxLabel(eventFormats.offline, m.ui_offline()),
      toggleScheduleFormatCallback.pack({ key: "offline" }),
    );

  keyboard
    .row()
    .text(
      checkboxLabel(!!filters.combineAdjacentPairs, m.ui_combine_adjacent_pairs()),
      toggleScheduleMergeCallback.pack({}),
    );

  keyboard.row().text(
    m.schedule_button_remind_before({
      minutes: Math.round(durationToMs(reminderOffset) / 60000),
    }),
    setScheduleReminderCallback.pack({}),
  );

  if (!hasGroup) {
    keyboard
      .row()
      .text(
        m.setup_button_connect_calendar_account(),
        connectCalendarCallback.pack({ from: "schedule_settings" }),
      );
  }

  keyboard.row().text(m.ui_back(), settingsCallback.pack({}));

  return keyboard;
}

function buildScheduleSettingsMessage(
  scheduleEnabled: boolean,
  group: string | null,
  filters: ScheduleFilters,
): string {
  const lines = [
    bold(m.schedule_settings_header()),
    "",
    group ? m.schedule_group({ group: bold(group) }) : m.schedule_no_group(),
    m.schedule_merge_label({
      status: filters.combineAdjacentPairs ? m.ui_status_on() : m.ui_status_off(),
    }),
    "",
    m.schedule_configure_hint(),
  ];
  if (!group) {
    lines.push("", italic(m.schedule_no_group_hint({ host: config.calendar.host })));
  }
  return lines.join("\n");
}

feature.callbackQuery(scheduleSettingsCallback.filter(), async (ctx) => {
  ctx.session.awaitingRemoodleToken = false;
  ctx.session.awaitingScheduleReminderMinutes = false;
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery(m.not_registered_short());
    return;
  }
  const user = rows[0]!;
  const filters = normalizeScheduleFilters(user.scheduleFilters);
  await ctx.editMessageText(
    buildScheduleSettingsMessage(user.scheduleEnabled, user.group, filters),
    {
      parse_mode: "HTML",
      reply_markup: buildScheduleSettingsKeyboard(
        user.scheduleEnabled,
        !!user.group,
        filters,
        user.scheduleReminderOffset,
      ),
    },
  );
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleScheduleCallback.filter(), async (ctx) => {
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery(m.not_registered_short());
    return;
  }
  const user = rows[0]!;

  if (!user.group && !user.scheduleEnabled) {
    await ctx.answerCallbackQuery({
      text: m.no_group_for_schedule(),
      show_alert: true,
    });
    return;
  }

  const updated = !user.scheduleEnabled;
  await db.update(users).set({ scheduleEnabled: updated }).where(eq(users.telegramId, ctx.from.id));

  const filters = normalizeScheduleFilters(user.scheduleFilters);
  await ctx.editMessageText(buildScheduleSettingsMessage(updated, user.group, filters), {
    parse_mode: "HTML",
    reply_markup: buildScheduleSettingsKeyboard(
      updated,
      !!user.group,
      filters,
      user.scheduleReminderOffset,
    ),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleScheduleTypeCallback.filter(), async (ctx) => {
  const { key } = toggleScheduleTypeCallback.unpack(ctx.callbackQuery.data) as { key: string };
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery(m.not_registered_short());
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
      reply_markup: buildScheduleSettingsKeyboard(
        user.scheduleEnabled,
        !!user.group,
        filters,
        user.scheduleReminderOffset,
      ),
    },
  );
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleScheduleFormatCallback.filter(), async (ctx) => {
  const { key } = toggleScheduleFormatCallback.unpack(ctx.callbackQuery.data) as { key: string };
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery(m.not_registered_short());
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
      reply_markup: buildScheduleSettingsKeyboard(
        user.scheduleEnabled,
        !!user.group,
        filters,
        user.scheduleReminderOffset,
      ),
    },
  );
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleScheduleMergeCallback.filter(), async (ctx) => {
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery(m.not_registered_short());
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
      reply_markup: buildScheduleSettingsKeyboard(
        user.scheduleEnabled,
        !!user.group,
        filters,
        user.scheduleReminderOffset,
      ),
    },
  );
  await ctx.answerCallbackQuery();
});

// ─── Schedule reminder offset ─────────────────────────────────────────────────

feature.on("message:text", async (ctx, next) => {
  if (!ctx.session.awaitingScheduleReminderMinutes) {
    return next();
  }

  const raw = ctx.message.text.trim();
  const mins = parseInt(raw, 10);

  if (!Number.isInteger(mins) || mins < 1 || mins > 240) {
    await ctx.reply(m.reminder_minutes_invalid());
    return;
  }

  const offset = `PT${mins}M`;
  ctx.session.awaitingScheduleReminderMinutes = false;

  await db
    .update(users)
    .set({ scheduleReminderOffset: offset })
    .where(eq(users.telegramId, ctx.from.id));

  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    return;
  }
  const user = rows[0]!;
  const filters = normalizeScheduleFilters(user.scheduleFilters);

  await ctx.reply(
    `${m.schedule_reminder_saved({ minutes: bold(`${mins} minutes`) })}\n\n${buildScheduleSettingsMessage(user.scheduleEnabled, user.group, filters)}`,
    {
      parse_mode: "HTML",
      reply_markup: buildScheduleSettingsKeyboard(
        user.scheduleEnabled,
        !!user.group,
        filters,
        offset,
      ),
    },
  );
});

feature.callbackQuery(setScheduleReminderCallback.filter(), async (ctx) => {
  ctx.session.awaitingScheduleReminderMinutes = true;
  const rows = await db
    .select({ scheduleReminderOffset: users.scheduleReminderOffset })
    .from(users)
    .where(eq(users.telegramId, ctx.from.id))
    .limit(1);

  if (rows.length === 0) {
    await ctx.answerCallbackQuery(m.not_registered_short());
    return;
  }

  const current = rows[0]!.scheduleReminderOffset;
  const currentMins = Math.round(durationToMs(current) / 60000);
  const reminderMsg = [
    bold(m.schedule_reminder_settings_header()),
    "",
    m.schedule_reminder_settings_body({ minutes: bold(`${currentMins} minutes`) }),
  ].join("\n");

  try {
    await ctx.editMessageText(reminderMsg, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text(m.ui_cancel(), scheduleSettingsCallback.pack({})),
    });
  } catch {
    await ctx.reply(reminderMsg, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text(m.ui_cancel(), scheduleSettingsCallback.pack({})),
    });
  }
  await ctx.answerCallbackQuery();
});

export { composer as settingsFeature };
