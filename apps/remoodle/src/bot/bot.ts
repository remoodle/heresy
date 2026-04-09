import { hydrate } from "@grammyjs/hydrate";
import { Bot, MemorySessionStorage, session } from "grammy";
import type { Context, SessionData } from "./context";
import { logger } from "../library/logger";
import { coursesFeature } from "./features/courses";
import { deadlinesFeature } from "./features/deadlines";
import { scheduleFeature } from "./features/schedule";
import { settingsFeature } from "./features/settings";
import { startFeature } from "./features/start";

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
  bot.use(coursesFeature);
  bot.use(scheduleFeature);

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
    err.ctx.answerCallbackQuery().catch(() => {});
  });

  return bot;
}
