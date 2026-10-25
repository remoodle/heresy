import { TELEGRAM_NOTIFY_TASK, type TelegramNotification } from "@heresy/shared/telegram-bot";
import { hatchet } from "./hatchet-client";

// Runs the bot's notify task and waits for it, so callers record a notification only once sent.
export function notify(input: TelegramNotification) {
  return hatchet.run<TelegramNotification>(TELEGRAM_NOTIFY_TASK, input);
}
