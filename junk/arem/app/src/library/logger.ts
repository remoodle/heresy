import pino from "pino";

const pinoOptions: pino.LoggerOptions = {
  base: undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const pinoLogger = pino(pinoOptions);

export const logger = {
  ...pinoLogger,
  api: pinoLogger.child({ module: "api" }),
  cluster: pinoLogger.child({ module: "cluster" }),
  bot: pinoLogger.child({ module: "bot" }),
};

export type Logger = typeof pinoLogger;
