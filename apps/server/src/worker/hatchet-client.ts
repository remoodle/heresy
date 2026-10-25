import { HatchetClient } from "@hatchet-dev/typescript-sdk";
import { hatchetLogger } from "@heresy/shared/hatchet-logger";
import { config } from "../config";
import { logger } from "../library/logger";

export const hatchet = HatchetClient.init({
  token: config.hatchet.token,
  log_level: "INFO",
  logger: hatchetLogger(logger),
});
