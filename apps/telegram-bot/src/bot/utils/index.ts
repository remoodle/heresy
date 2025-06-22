import type { NotificationSettings } from "@remoodle/types";
import { InlineKeyboard, GrammyError, BotError, HttpError } from "grammy";
import { getAuthHeaders, request } from "../../library/hc";

const getMiniAppUrl = async (
  userId: number,
  host: string,
  route: string = "",
): Promise<string> => {
  const [loginResponse, err] = await request((client) => {
    return client.v2.auth.login.$post(
      {
        json: {},
      },
      {
        headers: getAuthHeaders(userId),
      },
    );
  });

  if (err) {
    return host + route;
  }

  const b64 = btoa(JSON.stringify(loginResponse));
  const url = host + route + "?usr=" + b64;

  return url;
};

const getNotificationsKeyboard = (
  notificationSettings: NotificationSettings,
  websiteUrl: string | false = false,
) => {
  const keyboard = new InlineKeyboard();

  const enabled =
    notificationSettings["deadlineReminders::telegram"] === 1 ||
    notificationSettings["gradeUpdates::telegram"] === 1;

  keyboard
    .text(
      `Telegram Notifications ${enabled ? "🔔" : "🔕"}`,
      `change_notifications_telegram_${enabled ? "off" : "on"}`,
    )
    .row()
    .text(
      `Grades ${notificationSettings["gradeUpdates::telegram"] === 1 ? "🔔" : "🔕"}`,
      `change_notifications_grades_${notificationSettings["gradeUpdates::telegram"] === 1 ? "off" : "on"}`,
    )
    .text(
      `Deadlines ${notificationSettings["deadlineReminders::telegram"] === 1 ? "🔔" : "🔕"}`,
      `change_notifications_deadlines_${notificationSettings["deadlineReminders::telegram"] === 1 ? "off" : "on"}`,
    );

  if (websiteUrl) {
    keyboard.row().webApp("Advanced settings", websiteUrl);
  }

  keyboard.row().text("Back ←", "settings");

  return keyboard;
};

function logWithTimestamp(
  message: string,
  error: BotError | HttpError | GrammyError | Error,
) {
  console.error(`[${new Date().toISOString()}] ${message}`, error);
}

export { getNotificationsKeyboard, logWithTimestamp, getMiniAppUrl };
