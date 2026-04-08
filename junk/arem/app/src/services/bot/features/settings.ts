import { Composer, InlineKeyboard } from "grammy";
import type { NotificationSettings } from "../../../types";
import { request, getAuthHeaders, requestUnwrap } from "../helpers/hc";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import {
  changeNotificationCallback,
  settingsCallback,
  accountCallback,
  notificationsCallback,
  deleteProfileCallback,
  deleteProfileYesCallback,
  backToMenuCallback,
  deadlineThresholdsCallback,
  toggleThresholdCallback,
} from "../callback-data";
import { humanizeDuration, durationToMs } from "../../../library/utils/dates";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

const keyboards = {
  settings: new InlineKeyboard()
    .text("Notifications", notificationsCallback.pack({}))
    .text("Account", accountCallback.pack({}))
    .row()
    .text("Back ←", backToMenuCallback.pack({})),

  account: new InlineKeyboard()
    .text("⚠️ Delete Profile ⚠️", deleteProfileCallback.pack({}))
    .row()
    .text("Back ←", settingsCallback.pack({})),

  delete_profile: new InlineKeyboard()
    .text("Yes", deleteProfileYesCallback.pack({}))
    .text("Cancel", accountCallback.pack({})),
};

feature.callbackQuery(
  settingsCallback.filter(),
  logHandle("settings"),
  async (ctx) => {
    await ctx.editMessageText("Settings", { reply_markup: keyboards.settings });
  },
);

feature.callbackQuery(
  accountCallback.filter(),
  logHandle("account"),
  async (ctx) => {
    const [user, error] = await request((client) =>
      client.v2.user.check.$get({}, { headers: getAuthHeaders(ctx.from.id) }),
    );

    if (error) {
      await ctx.editMessageText("An error occurred. Try again later.", {
        reply_markup: keyboards.account,
        parse_mode: "Markdown",
      });
      return;
    }

    await ctx.editMessageText(
      `Account

Handle:  \`${user.handle}\`
Name:  \`${user.name}\`
Moodle ID:  \`${user.moodleId}\`
Token health:  \`${user.health} ${user.health > 0 ? "🟢" : "🔴"}\`
`,
      {
        reply_markup: keyboards.account,
        parse_mode: "Markdown",
      },
    );
  },
);

feature.callbackQuery(
  deleteProfileCallback.filter(),
  logHandle("delete_profile"),
  async (ctx) => {
    const user = await requestUnwrap((client) =>
      client.v2.user.check.$get({}, { headers: getAuthHeaders(ctx.from.id) }),
    );

    await ctx.editMessageText(
      `Are you sure to delete your ReMoodle profile?\nThis action is irreversible and will remove all data related to you.`,
      { reply_markup: keyboards.delete_profile },
    );
  },
);

feature.callbackQuery(
  deleteProfileYesCallback.filter(),
  logHandle("delete_profile_yes"),
  async (ctx) => {
    const [, error] = await request((client) =>
      client.v2.bye.$delete({}, { headers: getAuthHeaders(ctx.from.id) }),
    );

    if (error) {
      await ctx.deleteMessage();
      await ctx.reply("An error occurred. Try again later.");
      return;
    }

    await ctx.deleteMessage();
    await ctx.reply("Your ReMoodle profile has been deleted.");
  },
);

const NOTIFICATIONS_CONFIG = {
  gradeUpdates: {
    title: "Grades",
  },
  deadlineReminders: {
    title: "Deadlines",
  },
  courseChanges: {
    title: "Courses",
  },
} as const;

const NOTIFICATION_SETTING_STATE = {
  disabled: 0,
  enabled: 1,
  mandatory: 2,
} as const;

const AVAILABLE_THRESHOLDS = [
  "PT1H", // 1 hour
  "PT3H", // 3 hours
  "PT6H", // 6 hours
  "PT12H", // 12 hours
  "P1D", // 1 day
  "P2D", // 2 days
  "P3D", // 3 days
  "P4D", // 4 days
] as const;

type ChangeNotificationData = {
  type: string;
  value: 0 | 1 | 2;
};

const getTelegramNotificationKey = (key: string) => {
  if (key in NOTIFICATIONS_CONFIG) {
    return `${key}::telegram` as keyof NotificationSettings;
  }

  return undefined;
};

const getTelegramNotificationKeys = () => {
  return Object.keys(NOTIFICATIONS_CONFIG).map(
    (key) => `${key}::telegram` as keyof NotificationSettings,
  );
};

const boolToEmoji = (value: boolean) => (value ? "🔔" : "🔕");

const getNotificationsKeyboard = (
  notificationSettings: NotificationSettings,
) => {
  const keyboard = new InlineKeyboard();

  const telegramEnabled = getTelegramNotificationKeys().some((key) => {
    return notificationSettings[key] === NOTIFICATION_SETTING_STATE.enabled;
  });

  keyboard
    .text(
      `Telegram Notifications ${boolToEmoji(telegramEnabled)}`,
      changeNotificationCallback.pack({
        type: "telegram",
        value: telegramEnabled
          ? NOTIFICATION_SETTING_STATE.disabled
          : NOTIFICATION_SETTING_STATE.enabled,
      }),
    )
    .row();

  const notificationsPerRow = 2;
  const notificationEntries = Object.entries(NOTIFICATIONS_CONFIG);

  for (let i = 0; i < notificationEntries.length; i += notificationsPerRow) {
    const row = notificationEntries.slice(i, i + notificationsPerRow);
    const keyboardRow = keyboard.row();

    row.forEach(([key, config]) => {
      const telegramKey = getTelegramNotificationKey(key);

      if (!telegramKey) {
        return;
      }

      const isEnabled =
        notificationSettings[telegramKey] ===
        NOTIFICATION_SETTING_STATE.enabled;

      keyboardRow.text(
        `${config.title} ${boolToEmoji(isEnabled)}`,
        changeNotificationCallback.pack({
          type: key,
          value: isEnabled
            ? NOTIFICATION_SETTING_STATE.disabled
            : NOTIFICATION_SETTING_STATE.enabled,
        }),
      );
    });
  }

  keyboard
    .row()
    .text("🔔 Deadline Thresholds", deadlineThresholdsCallback.pack({}));

  keyboard.row().text("Back ←", settingsCallback.pack({}));

  return keyboard;
};

feature.callbackQuery(
  notificationsCallback.filter(),
  logHandle("notifications"),
  async (ctx) => {
    const userId = ctx.from.id;

    const settings = await requestUnwrap((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders(userId) }),
    );

    await ctx.editMessageText("Notifications", {
      reply_markup: getNotificationsKeyboard(settings.settings.notifications),
    });
  },
);

feature.callbackQuery(
  changeNotificationCallback.filter(),
  logHandle("change_notification"),
  async (ctx) => {
    const userId = ctx.from.id;

    const [account, error] = await request((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders(userId) }),
    );

    if (error) {
      await ctx.editMessageText("An error occurred. Try again later.", {
        reply_markup: new InlineKeyboard().text(
          "Back ←",
          settingsCallback.pack({}),
        ),
      });
      return;
    }

    const data = changeNotificationCallback.unpack(ctx.callbackQuery.data);

    const { type, value } = data as ChangeNotificationData;

    if (type === "telegram") {
      getTelegramNotificationKeys().forEach((key) => {
        account.settings.notifications[key] = value;
      });
    } else {
      const key = getTelegramNotificationKey(type);

      if (key) {
        account.settings.notifications[key] = value;
      } else {
        return; // Unknown notification type
      }
    }

    const [_, settingsUpdateError] = await request((client) =>
      client.v2.user.settings.$post(
        { json: { settings: account.settings } },
        { headers: getAuthHeaders(userId) },
      ),
    );

    if (settingsUpdateError) {
      await ctx.editMessageText("Could not update settings. Try again later.", {
        reply_markup: new InlineKeyboard().text(
          "Back ←",
          settingsCallback.pack({}),
        ),
      });
      return;
    }

    const [settings, settingsError] = await request((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders(userId) }),
    );

    if (settingsError) {
      return;
    }

    await ctx.editMessageText("Notifications", {
      reply_markup: getNotificationsKeyboard(settings.settings.notifications),
    });
  },
);

const getThresholdsKeyboard = (activeThresholds: string[]) => {
  const keyboard = new InlineKeyboard();

  // Create rows with 2 thresholds per row
  const thresholdsPerRow = 2;
  for (let i = 0; i < AVAILABLE_THRESHOLDS.length; i += thresholdsPerRow) {
    const row = AVAILABLE_THRESHOLDS.slice(i, i + thresholdsPerRow);
    const keyboardRow = keyboard.row();

    row.forEach((threshold) => {
      const isActive = activeThresholds.includes(threshold);
      const emoji = isActive ? "✅" : "☐";
      const label = humanizeDuration(threshold);

      keyboardRow.text(
        `${emoji} ${label}`,
        toggleThresholdCallback.pack({ threshold }),
      );
    });
  }

  keyboard.row().text("Back ←", notificationsCallback.pack({}));

  return keyboard;
};

const formatThresholdsMessage = (
  activeThresholds: string[],
  isDeadlinesEnabled: boolean,
) => {
  let message = "*Deadline Reminder Thresholds*\n\n";

  if (!isDeadlinesEnabled) {
    message +=
      "⚠️ _Deadline reminders are currently disabled._\n" +
      "_Enable them in Notifications to receive reminders._\n\n";
  }

  if (activeThresholds.length === 0) {
    message += "No thresholds configured.\n";
  } else {
    message += "Active thresholds:\n";
    activeThresholds
      .sort((a, b) => durationToMs(a) - durationToMs(b))
      .forEach((threshold) => {
        message += `• ${humanizeDuration(threshold)}\n`;
      });
  }

  message += "\nSelect thresholds to toggle them:";

  return message;
};

feature.callbackQuery(
  deadlineThresholdsCallback.filter(),
  logHandle("deadline_thresholds"),
  async (ctx) => {
    const userId = ctx.from.id;

    const settings = await requestUnwrap((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders(userId) }),
    );

    const isDeadlinesEnabled =
      settings.settings.notifications["deadlineReminders::telegram"] ===
      NOTIFICATION_SETTING_STATE.enabled;

    const message = formatThresholdsMessage(
      settings.settings.deadlineReminders.thresholds,
      isDeadlinesEnabled,
    );

    await ctx.editMessageText(message, {
      reply_markup: getThresholdsKeyboard(
        settings.settings.deadlineReminders.thresholds,
      ),
      parse_mode: "Markdown",
    });
  },
);

feature.callbackQuery(
  toggleThresholdCallback.filter(),
  logHandle("toggle_threshold"),
  async (ctx) => {
    const userId = ctx.from.id;

    const [account, error] = await request((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders(userId) }),
    );

    if (error) {
      await ctx.editMessageText("An error occurred. Try again later.", {
        reply_markup: new InlineKeyboard().text(
          "Back ←",
          notificationsCallback.pack({}),
        ),
      });
      return;
    }

    const data = toggleThresholdCallback.unpack(ctx.callbackQuery.data);
    const { threshold } = data as { threshold: string };

    const currentThresholds = account.settings.deadlineReminders.thresholds;
    const isActive = currentThresholds.includes(threshold);

    let newThresholds: string[];
    if (isActive) {
      // Remove threshold
      newThresholds = currentThresholds.filter((t) => t !== threshold);
    } else {
      // Add threshold (max 10 from config)
      if (currentThresholds.length >= 10) {
        await ctx.answerCallbackQuery({
          text: "Maximum 10 thresholds allowed",
          show_alert: true,
        });
        return;
      }
      newThresholds = [...currentThresholds, threshold];
    }

    account.settings.deadlineReminders.thresholds = newThresholds;

    const [_, settingsUpdateError] = await request((client) =>
      client.v2.user.settings.$post(
        { json: { settings: account.settings } },
        { headers: getAuthHeaders(userId) },
      ),
    );

    if (settingsUpdateError) {
      await ctx.answerCallbackQuery({
        text: "Could not update settings. Try again later.",
        show_alert: true,
      });
      return;
    }

    const [settings, settingsError] = await request((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders(userId) }),
    );

    if (settingsError) {
      return;
    }

    const isDeadlinesEnabled =
      settings.settings.notifications["deadlineReminders::telegram"] ===
      NOTIFICATION_SETTING_STATE.enabled;

    const message = formatThresholdsMessage(
      settings.settings.deadlineReminders.thresholds,
      isDeadlinesEnabled,
    );

    await ctx.editMessageText(message, {
      reply_markup: getThresholdsKeyboard(
        settings.settings.deadlineReminders.thresholds,
      ),
      parse_mode: "Markdown",
    });

    await ctx.answerCallbackQuery();
  },
);

export { composer as settingsFeature };
