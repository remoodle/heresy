import { logger } from "../library/logger";
import { hatchet } from "./hatchet-client";
import { deadlineCheck } from "./workflows/deadline-check";
import { deadlineCheckUser } from "./workflows/deadline-check-user";
import { telegramSender } from "./workflows/telegram-sender";

async function main() {
  logger.worker.info("Creating Hatchet worker");

  const worker = await hatchet.worker("remoodle-worker", {
    workflows: [deadlineCheck, deadlineCheckUser, telegramSender],
  });

  await worker.start();
}

main().catch((err) => logger.worker.error({ error: err }, "Failed to start worker"));
