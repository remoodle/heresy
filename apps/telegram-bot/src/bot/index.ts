import { Bot as TelegramBot } from "grammy";
import type { Context } from "./context";
import { errorHandler } from "./handlers/error";
import { sessionMiddleware } from "./middleware/session";
import { welcomeFeature, handleToken } from "./features/welcome";
import { deadlinesFeature } from "./features/deadlines";
import { coursesFeature } from "./features/courses";
import { settingsFeature } from "./features/settings";
import { menuFeature } from "./features/menu";
import { aboutFeature } from "./features/about";

export function createBot(token: string) {
  const bot = new TelegramBot<Context>(token);

  const protectedBot = bot.errorBoundary(errorHandler);

  protectedBot.use(sessionMiddleware);

  protectedBot.use(welcomeFeature);
  protectedBot.use(menuFeature);
  protectedBot.use(aboutFeature);
  protectedBot.use(deadlinesFeature);
  protectedBot.use(coursesFeature);
  protectedBot.use(settingsFeature);

  bot.use((ctx, next) => {
    if (ctx.session.auth?.step === "awaiting_token") {
      return handleToken(ctx);
    }

    return next();
  });

  return bot;
}

export type Bot = ReturnType<typeof createBot>;
