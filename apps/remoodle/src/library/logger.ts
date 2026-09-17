import pino from "pino";
import { env } from "../config";

export const logger = pino({
  base: {
    service: "remoodle",
    environment: env.NODE_ENV,
  },
});
