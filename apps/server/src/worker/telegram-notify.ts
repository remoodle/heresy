import { TELEGRAM_NOTIFY_TASK, type TelegramNotification } from "@heresy/shared/telegram-bot";
import { hatchet } from "./hatchet-client";

// Stub of the bot's notify task: same name and input, no function, so the worker can run it
// without importing bot code. Callers await `run`, so they record a notification only once sent.
export const telegramNotify = hatchet.workflow<TelegramNotification>({
  name: TELEGRAM_NOTIFY_TASK,
});
