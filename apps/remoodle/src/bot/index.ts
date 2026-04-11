import { config } from "../config";
import { logger } from "../library/logger";
import { createShortCache } from "../library/short-cache";
import { createBot } from "./bot";
import { BOT_COMMANDS } from "./commands";

async function main() {
  const shortCache = createShortCache();
  const bot = createBot(config.telegram.token, shortCache);

  await bot.api.setMyCommands(BOT_COMMANDS);

  await bot.start({
    onStart: (info) => {
      logger.bot.info({ username: info.username }, "Bot started");
    },
  });
}

void main().catch((err) => {
  logger.bot.error({ error: err }, "Failed to start bot");
});
