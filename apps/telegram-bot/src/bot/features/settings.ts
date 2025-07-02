import type { NotificationSettings } from "@remoodle/types";
import { Composer, InlineKeyboard } from "grammy";
import { createCallbackData } from "callback-data";
import { config } from "../../config";
import { request, getAuthHeaders, requestUnwrap } from "../../library/hc";
import type { Context } from "../context";
import { getMiniAppUrl } from "../helpers/get-mini-app-url";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

const changeNotificationCallback = createCallbackData("change_notification", {
  type: String,
  value: Boolean,
});

const keyboards = {
  settings: new InlineKeyboard()
    .text("Notifications", "notifications")
    .text("Account", "account")
    .row()
    .text("Back ←", "back_to_menu"),

  account: new InlineKeyboard()
    .text("⚠️ Delete Profile ⚠️", "delete_profile")
    .row()
    .text("Back ←", "settings"),

  delete_profile: new InlineKeyboard()
    .text("Yes", "delete_profile_yes")
    .text("Cancel", "account"),
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

feature.callbackQuery("settings", async (ctx) => {
  await ctx.editMessageText("Settings", { reply_markup: keyboards.settings });
});

feature.callbackQuery("account", async (ctx) => {
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
});

async function getNotificationsURL(userId: number) {
  const url = await getMiniAppUrl(
    userId,
    config.frontend.url,
    "/account/notifications",
  );

  return url;
}

feature.callbackQuery("notifications", async (ctx) => {
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
});

feature.callbackQuery(changeNotificationCallback.filter(), async (ctx) => {
  const userId = ctx.from.id;

  const data = changeNotificationCallback.unpack(ctx.callbackQuery.data);

  const [account, error] = await request((client) =>
    client.v2.user.settings.$get({}, { headers: getAuthHeaders(userId) }),
  );

  if (error) {
    await ctx.editMessageText("An error occurred. Try again later.", {
      reply_markup: new InlineKeyboard().text("Back ←", "settings"),
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
      reply_markup: new InlineKeyboard().text("Back ←", "settings"),
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
});

feature.callbackQuery("delete_profile", async (ctx) => {
  const user = await requestUnwrap((client) =>
    client.v2.user.check.$get({}, { headers: getAuthHeaders(ctx.from.id) }),
  );

  console.log(user);

  await ctx.editMessageText(
    `Are you sure to delete your ReMoodle profile?\nThis action is irreversible and will remove all data related to you.`,
    { reply_markup: keyboards.delete_profile },
  );
});

feature.callbackQuery("delete_profile_yes", async (ctx) => {
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
});

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

  keyboard.row().text("Back ←", "settings");

  return keyboard;
};

export { composer as settingsFeature };
