import { logger } from "../library/logger";
import { hatchet } from "./hatchet-client";
import { deadlineCheck } from "./workflows/deadline-check";
import { telegramSender } from "./workflows/telegram-sender";

async function main() {
  const worker = await hatchet.worker("remoodle-worker", {
    workflows: [deadlineCheck, telegramSender],
  });

  await worker.start();
}

main().catch((err) => logger.worker.error({ error: err }, "Failed to start worker"));
