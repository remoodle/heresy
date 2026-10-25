import { RateLimitDuration } from "@hatchet-dev/typescript-sdk";
import { TELEGRAM_RATE_LIMIT_KEY } from "@heresy/shared/telegram-bot";
import { config } from "./config";
import { logger } from "./logger";
import { createBot } from "./bot";
import { BOT_COMMANDS } from "./commands";
import { hatchet } from "./hatchet-client";
import { telegramNotify } from "./notifications";

const log = logger.child().withContext({ module: "bot", operation: "startup" });

// One process answers updates and sends the worker's notifications, both through the same token.
async function main() {
  const bot = createBot(config.telegram.token);

  await bot.api.setMyCommands(BOT_COMMANDS);
  log.withMetadata({ commandCount: BOT_COMMANDS.length }).info("bot commands configured");

  await hatchet.ratelimits.upsert({
    key: TELEGRAM_RATE_LIMIT_KEY,
    limit: 30,
    duration: RateLimitDuration.SECOND,
  });

  const worker = await hatchet.worker("telegram-bot", { workflows: [telegramNotify] });

  await Promise.all([
    worker.start(),
    bot.start({
      onStart: (info) => {
        log.withMetadata({ username: info.username }).info("bot started");
      },
    }),
  ]);
}

main().catch((error) => {
  log
    .withError(error instanceof Error ? error : new Error(String(error)))
    .error("bot startup failed");
  // Without either half the process is useless, so let the supervisor restart it.
  process.exit(1);
});
