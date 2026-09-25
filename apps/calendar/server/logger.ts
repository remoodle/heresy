import { pino } from "pino";
import { LogLayer } from "loglayer";
import { PinoTransport } from "@loglayer/transport-pino";

export const logger = new LogLayer({
  transport: new PinoTransport({
    logger: pino({
      base: { service: "calendar-api" },
      level: "trace",
    }),
  }),
});
