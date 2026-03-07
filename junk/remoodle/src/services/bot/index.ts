import { config } from "../../config";
import { logger } from "../../library/logger";
import { createBot } from "./bot";

async function startPolling() {
  const bot = createBot(config.telegram.token);

  onShutdown(async () => {
    await bot.stop();
  });

  await bot.init();

  logger.bot.info({
    msg: "Bot running...",
    username: bot.botInfo.username,
  });

  bot.start();
}

startPolling();

function onShutdown(cleanUp: () => Promise<void>) {
  let isShuttingDown = false;
  const handleShutdown = async () => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    await cleanUp();
  };
  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
}
