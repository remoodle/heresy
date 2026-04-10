import { config } from "../config";
import { logger } from "../library/logger";
import { createBot } from "./bot";

const bot = createBot(config.telegram.token);

void bot.start({
  onStart: (info) => {
    logger.bot.info({ username: info.username }, "Bot started");
  },
});
