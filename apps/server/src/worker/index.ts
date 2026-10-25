import { logger } from "../library/logger";
import { hatchet } from "./hatchet-client";
import { calendarFetchUser } from "./workflows/calendar-fetch-user";
import { deadlineCheck } from "./workflows/deadline-check";
import { deadlineCheckUser } from "./workflows/deadline-check-user";
import { deadlineNotifyUser } from "./workflows/deadline-notify-user";
import { digestUser } from "./workflows/digest-user";
import { myDuSync, myDuSyncUser } from "./workflows/my-du-sync";
import { scheduleReminderCheck } from "./workflows/schedule-reminder-check";
import { scheduleReminderCheckUser } from "./workflows/schedule-reminder-check-user";

const log = logger.child().withContext({ module: "worker", operation: "startup" });

async function main() {
  log.info("creating Hatchet worker");

  const worker = await hatchet.worker("remoodle-worker", {
    workflows: [
      deadlineCheck,
      calendarFetchUser,
      deadlineCheckUser,
      deadlineNotifyUser,
      scheduleReminderCheck,
      digestUser,
      myDuSync,
      myDuSyncUser,
      scheduleReminderCheckUser,
    ],
  });

  log.withMetadata({ worker: "remoodle-worker" }).info("Hatchet worker started");
  await worker.start();
}

main().catch((error) => {
  log
    .withError(error instanceof Error ? error : new Error(String(error)))
    .error("worker startup failed");
});
