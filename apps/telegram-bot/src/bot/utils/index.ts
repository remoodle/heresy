import type { NotificationSettings } from "@remoodle/types";
import { InlineKeyboard, GrammyError, BotError, HttpError } from "grammy";

const formatUnixtimestamp = (timestamp: number, showYear: boolean = false) => {
  return new Date(timestamp)
    .toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      year: showYear ? "numeric" : undefined,
      hour12: false,
      timeZone: "Asia/Almaty",
    })
    .replace("24:00", "00:00");
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

export { getNotificationsKeyboard, formatUnixtimestamp, logWithTimestamp };
