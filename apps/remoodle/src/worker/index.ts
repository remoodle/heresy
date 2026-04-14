import { RateLimitDuration } from "@hatchet-dev/typescript-sdk";
import { logger } from "../library/logger";
import { hatchet } from "./hatchet-client";
import { calendarFetchUser } from "./workflows/calendar-fetch-user";
import { deadlineCheck } from "./workflows/deadline-check";
import { deadlineCheckUser } from "./workflows/deadline-check-user";
import { deadlineNotifyUser } from "./workflows/deadline-notify-user";
import { scheduleCheck } from "./workflows/schedule-check";
import { scheduleCheckUser } from "./workflows/schedule-check-user";
import { scheduleReminderCheck } from "./workflows/schedule-reminder-check";
import { scheduleReminderCheckUser } from "./workflows/schedule-reminder-check-user";
import { TELEGRAM_RATE_LIMIT_KEY, telegramSendMessage } from "./workflows/telegram-send-message";

async function main() {
  logger.worker.info("Creating Hatchet worker");

  await hatchet.ratelimits.upsert({
    key: TELEGRAM_RATE_LIMIT_KEY,
    limit: 30,
    duration: RateLimitDuration.SECOND,
  });

  const worker = await hatchet.worker("remoodle-worker", {
    workflows: [
      deadlineCheck,
      calendarFetchUser,
      deadlineCheckUser,
      deadlineNotifyUser,
      scheduleCheck,
      scheduleCheckUser,
      scheduleReminderCheck,
      scheduleReminderCheckUser,
      telegramSendMessage,
    ],
  });

  await worker.start();
}

main().catch((err) => logger.worker.error({ error: err }, "Failed to start worker"));
