import { createLogger } from "@heresy/shared/logger";
import { env } from "./config";

export const logger = createLogger("telegram-bot", env.NODE_ENV);
