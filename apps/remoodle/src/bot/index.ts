import { config } from "../config";
import { logger } from "../library/logger";
import { createShortCache } from "../library/short-cache";
import { createBot } from "./bot";
import { BOT_COMMANDS } from "./commands";

const log = logger.child({ module: "bot", operation: "startup" });

async function main() {
  const shortCache = createShortCache();
  const bot = createBot(config.telegram.token, shortCache);

  await bot.api.setMyCommands(BOT_COMMANDS);
  log.info({ commandCount: BOT_COMMANDS.length }, "bot commands configured");

  await bot.start({
    onStart: (info) => {
      log.info({ username: info.username }, "bot started");
    },
  });
}

main().catch((error) => {
  log.error(
    { err: error instanceof Error ? error : new Error(String(error)) },
    "bot startup failed",
  );
});
