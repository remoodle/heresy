import { Bot, MemorySessionStorage, session } from "grammy";
import { hydrate } from "@grammyjs/hydrate";
import type { Context, SessionData } from "./context";
import { startFeature } from "./features/start";
import { deadlinesFeature } from "./features/deadlines";
import { settingsFeature } from "./features/settings";
import { logger } from "../library/logger";

export function createBot(token: string) {
  const bot = new Bot<Context>(token);

  bot.use(
    session({
      initial: (): SessionData => ({}),
      storage: new MemorySessionStorage<SessionData>(),
      getSessionKey: (ctx) => ctx.chat?.id.toString(),
    }),
  );

  bot.use(hydrate());

  bot.use(startFeature);
  bot.use(deadlinesFeature);
  bot.use(settingsFeature);

  bot.callbackQuery("remove_message", async (ctx) => {
    try {
      await ctx.deleteMessage();
    } catch {
      await ctx.editMessageText("✅ Cleared");
    }
    await ctx.answerCallbackQuery();
  });

  bot.catch((err) => {
    logger.bot.error({ error: err.error, update: err.ctx.update }, "Unhandled bot error");
  });

  return bot;
}
