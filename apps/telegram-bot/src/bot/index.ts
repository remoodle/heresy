import { Bot as TelegramBot } from "grammy";
import type { BotContext } from "./types";
import { errorHandler } from "./handlers/error";
import { sessionMiddleware } from "./middleware/session";
import {
  welcomeFeature,
  handleToken,
  deadlinesFeature,
  coursesFeature,
  settingsFeature,
  menuFeature,
} from "./features";

export function createBot(token: string) {
  const bot = new TelegramBot<BotContext>(token);

  const protectedBot = bot.errorBoundary(errorHandler);

  protectedBot.use(sessionMiddleware);

  protectedBot.use(welcomeFeature);
  protectedBot.use(deadlinesFeature);
  protectedBot.use(coursesFeature);
  protectedBot.use(settingsFeature);
  protectedBot.use(menuFeature);

  bot.use((ctx, next) => {
    if (ctx.session.auth?.step === "awaiting_token") {
      return handleToken(ctx);
    }

    return next();
  });

  return bot;
}

export type Bot = ReturnType<typeof createBot>;
