import { Bot as TelegramBot, MemorySessionStorage } from "grammy";
import { hydrate } from "@grammyjs/hydrate";
import { pinoLogger, logger } from "../../library/logger";
import { env } from "../../config";
import type { Context, SessionData } from "./context";
import { errorHandler } from "./handlers/error";
import { session } from "./middleware/session";
import { updateLogger } from "./middleware/update-logger";
import { welcomeFeature } from "./features/welcome";
import { deadlinesFeature } from "./features/deadlines";
import { coursesFeature } from "./features/courses";
import { settingsFeature } from "./features/settings";
import { menuFeature } from "./features/menu";
import { aboutFeature } from "./features/about";

function getSessionKey(ctx: Omit<Context, "session">) {
  return ctx.chat?.id.toString();
}

export function createBot(token: string) {
  const bot = new TelegramBot<Context>(token);

  bot.use(async (ctx, next) => {
    ctx.logger = logger.bot.child({
      update_id: ctx.update.update_id,
    });

    await next();
  });

  const protectedBot = bot.errorBoundary(errorHandler);

  // Middlewares
  if (env.isDev) {
    protectedBot.use(updateLogger());
  }
  protectedBot.use(hydrate());
  protectedBot.use(
    session({
      getSessionKey,
      storage: new MemorySessionStorage<SessionData>(),
    }),
  );

  // Handlers
  protectedBot.use(welcomeFeature);
  protectedBot.use(menuFeature);
  protectedBot.use(aboutFeature);
  protectedBot.use(deadlinesFeature);
  protectedBot.use(coursesFeature);
  protectedBot.use(settingsFeature);

  bot.use((ctx, next) => {
    // if (ctx.session.auth?.step === "awaiting_token") {
    //   return handleToken(ctx);
    // }

    return next();
  });

  return bot;
}
