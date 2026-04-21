import type { MiddlewareHandler } from "hono";
import { pinoHttp } from "pino-http";

export const loggerMiddleware: MiddlewareHandler = async (ctx, next) => {
  ctx.env.incoming.id = ctx.var.requestId;

  await new Promise<void>((resolve) =>
    pinoHttp()(ctx.env.incoming, ctx.env.outgoing, () => resolve()),
  );

  ctx.set("logger", ctx.env.incoming.log);

  return next();
};
