import { performance } from "node:perf_hooks";
import type { Middleware } from "grammy";
import type { Context } from "../context";
import { getUpdateInfo } from "../helpers/logging";

export function updateLogger(): Middleware<Context> {
  return async (ctx, next) => {
    ctx.api.config.use((previous, method, payload, signal) => {
      ctx.logger.debug({
        msg: "Bot API call",
        method,
        payload,
      });

      return previous(method, payload, signal);
    });

    ctx.logger.debug({
      msg: "Update received",
      update: getUpdateInfo(ctx),
    });

    const startTime = performance.now();
    try {
      await next();
    } finally {
      const endTime = performance.now();
      ctx.logger.debug({
        msg: "Update processed",
        elapsed: endTime - startTime,
      });
    }
  };
}
