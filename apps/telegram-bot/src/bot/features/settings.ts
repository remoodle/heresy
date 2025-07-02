import type { NotificationSettings } from "@remoodle/types";
import { Composer, InlineKeyboard } from "grammy";
import { config } from "../../config";
import { request, getAuthHeaders, requestUnwrap } from "../../library/hc";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { getMiniAppUrl } from "../helpers/get-mini-app-url";
import {
  changeNotificationCallback,
  settingsCallback,
  accountCallback,
  notificationsCallback,
  deleteProfileCallback,
  deleteProfileYesCallback,
  backToMenuCallback,
} from "../callback-data";

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

type NotificationConfig = {
  key: string;
  name: string;
};

export const NOTIFICATION_CONFIG: NotificationConfig[] = [
  {
    key: "gradeUpdates",
    name: "Grades",
  },
  {
    key: "deadlineReminders",
    name: "Deadlines",
  },
];

export const getTelegramNotificationKey = (key: string) => {
  const setting = NOTIFICATION_CONFIG.find((config) => config.key === key);

  if (!setting) {
    return undefined;
  }

  return `${setting.key}::telegram` as keyof NotificationSettings;
};

export const getTelegramNotificationKeys = () => {
  return NOTIFICATION_CONFIG.map(
    (config) => `${config.key}::telegram` as keyof NotificationSettings,
  );
};

const boolToInt = (value: boolean) => (value ? 1 : 0);

const boolToEmoji = (value: boolean) => (value ? "🔔" : "🔕");

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

async function getNotificationsURL(userId: number) {
  const url = await getMiniAppUrl(
    userId,
    config.frontend.url,
    "/account/notifications",
  );

  return url;
}

feature.callbackQuery(
  notificationsCallback.filter(),
  logHandle("notifications"),
  async (ctx) => {
    const userId = ctx.from.id;

    const settings = await requestUnwrap((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders(userId) }),
    );

    const url = await getNotificationsURL(userId);

    await ctx.editMessageText("Notifications", {
      reply_markup: getNotificationsKeyboard(
        settings.settings.notifications,
        url,
      ),
    });
  },
);

feature.callbackQuery(
  changeNotificationCallback.filter(),
  logHandle("change_notification"),
  async (ctx) => {
    const userId = ctx.from.id;

    const data = changeNotificationCallback.unpack(ctx.callbackQuery.data);

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

    const { type, value } = data;

    if (type === "telegram") {
      getTelegramNotificationKeys().forEach((key) => {
        account.settings.notifications[key] = boolToInt(value);
      });
    } else {
      const key = getTelegramNotificationKey(type);

      if (key) {
        account.settings.notifications[key] = boolToInt(value);
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

    const url = await getNotificationsURL(userId);

    await ctx.editMessageText("Notifications", {
      reply_markup: getNotificationsKeyboard(
        settings.settings.notifications,
        url,
      ),
    });
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

export const getNotificationsKeyboard = (
  notificationSettings: NotificationSettings,
  websiteUrl: string | false = false,
) => {
  const keyboard = new InlineKeyboard();

  const telegramEnabled = getTelegramNotificationKeys().some((key) => {
    return notificationSettings[key] === 1;
  });

  keyboard
    .text(
      `Telegram Notifications ${boolToEmoji(telegramEnabled)}`,
      changeNotificationCallback.pack({
        type: "telegram",
        value: !telegramEnabled,
      }),
    )
    .row();

  const notificationsPerRow = 2;

  for (let i = 0; i < NOTIFICATION_CONFIG.length; i += notificationsPerRow) {
    const row = NOTIFICATION_CONFIG.slice(i, i + notificationsPerRow);
    const keyboardRow = keyboard.row();

    row.forEach((notification) => {
      const key = getTelegramNotificationKey(notification.key);

      if (!key) {
        return;
      }

      const isEnabled = notificationSettings[key] === 1;

      keyboardRow.text(
        `${notification.name} ${boolToEmoji(isEnabled)}`,
        changeNotificationCallback.pack({
          type: notification.key,
          value: !isEnabled,
        }),
      );
    });
  }

  if (websiteUrl) {
    keyboard.row().webApp("Advanced settings", websiteUrl);
  }

  keyboard.row().text("Back ←", settingsCallback.pack({}));

  return keyboard;
};

export { composer as settingsFeature };
