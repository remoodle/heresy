import pino from "pino";

const base = pino({
  base: undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    error: (err) => ({
      type: err?.constructor?.name,
      message: err?.message,
      description: err?.description,
      stack: err?.stack,
    }),
  },
});

export const logger = {
  bot: base.child({ module: "bot" }),
  worker: base.child({ module: "worker" }),
};
