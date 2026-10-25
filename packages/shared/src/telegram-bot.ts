import type { DeadlineEvent } from "./moodle/deadlines";
import type { ScheduleItem } from "./schedule/items";

// Contracts between the server and the Telegram bot.

// `/start` payloads. The web calendar sends users to the bot for everything it cannot do itself.
export const START_PAYLOADS = { myDu: "my_du", moodle: "moodle", loginPrefix: "login_" } as const;

// The worker decides who is notified and when; the bot owns the texts, so it renders and sends
// them from this Hatchet task. The worker records a notification once the task completes.
export const TELEGRAM_NOTIFY_TASK = "telegram-notify";

// Telegram allows about 30 messages per second across all chats.
export const TELEGRAM_RATE_LIMIT_KEY = "telegram-global";

export type TelegramNotification = {
  chatId: number;
  notification:
    | { kind: "deadlines"; events: DeadlineEvent[] }
    | { kind: "classes"; minutesUntil: number; items: ScheduleItem[] }
    // Today's classes, from `toWeeklySchedule`.
    | { kind: "digest"; items: ScheduleItem[] };
};
