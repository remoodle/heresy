import { config } from "./config";
import { createBot } from "./bot";

async function startPolling() {
  const bot = createBot(config.bot.token);

  onShutdown(async () => {
    await bot.stop();
  });

  console.log("Bot is running");

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
