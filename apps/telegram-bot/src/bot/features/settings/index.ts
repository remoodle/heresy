import type { NotificationSettings } from "@remoodle/types";
import { Composer, InlineKeyboard } from "grammy";
import type { BotContext } from "../../types";
import { config } from "../../../config";
import { request, getAuthHeaders, requestUnwrap } from "../../../library/hc";
import { getMiniAppUrl } from "../../helpers/get-mini-app-url";
import { keyboards } from "../../keyboards";
import {
  NOTIFICATION_CONFIG,
  getTelegramNotificationKey,
  getTelegramNotificationKeys,
} from "./notifications";

const composer = new Composer<BotContext>();

const feature = composer.chatType("private");

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

feature.callbackQuery(/^change_notifications_(.+)_(.+)/, async (ctx) => {
  const userId = ctx.from.id;

  const [account, error] = await request((client) =>
    client.v2.user.settings.$get({}, { headers: getAuthHeaders(userId) }),
  );

  if (error) {
    await ctx.editMessageText("An error occurred. Try again later.", {
      reply_markup: new InlineKeyboard().text("Back ←", "settings"),
    });
    return;
  }

  const [, , type, value] = ctx.match[0].split("_");

  if (type === "telegram") {
    getTelegramNotificationKeys().forEach((key) => {
      account.settings.notifications[key] = value === "on" ? 1 : 0;
    });
  } else {
    const key = getTelegramNotificationKey(type);

    if (key) {
      account.settings.notifications[key] = value === "on" ? 1 : 0;
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
    { reply_markup: keyboards.deleteProfile },
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
      `Telegram Notifications ${telegramEnabled ? "🔔" : "🔕"}`,
      `change_notifications_telegram_${telegramEnabled ? "off" : "on"}`,
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
        `${notification.name} ${isEnabled ? "🔔" : "🔕"}`,
        `change_notifications_${notification.key}_${isEnabled ? "off" : "on"}`,
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
