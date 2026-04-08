import pino from "pino";

const base = pino({
  base: undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const logger = {
  bot: base.child({ module: "bot" }),
  worker: base.child({ module: "worker" }),
};
