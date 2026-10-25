import { createLogger } from "@heresy/shared/logger";
import { env } from "../config";

export const logger = createLogger("server", env.NODE_ENV);
