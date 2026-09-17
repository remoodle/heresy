import { type LogExtra, Logger, type LogLevel } from "@hatchet-dev/typescript-sdk/util/logger";
import { logger } from "../library/logger";

export class PinoHatchetLogger extends Logger {
  private readonly log;

  constructor(context: string, logLevel: LogLevel = "INFO") {
    super();
    this.log = logger.child(
      { module: "worker", operation: "hatchet", context },
      { level: logLevel === "OFF" ? "silent" : logLevel.toLowerCase() },
    );
  }

  override debug(message: string, extra?: LogExtra) {
    this.log.debug(extra, message);
  }

  override info(message: string, extra?: LogExtra) {
    this.log.info(extra, message);
  }

  override green(message: string, extra?: LogExtra) {
    this.log.info(extra, message);
  }

  override warn(message: string, error?: Error, extra?: LogExtra) {
    this.log.warn({ ...extra, err: error }, message);
  }

  override error(message: string, error?: Error, extra?: LogExtra) {
    this.log.error({ ...extra, err: error }, message);
  }

  override util(key: string, message: string, extra?: LogExtra) {
    this.log.debug({ ...extra, utilKey: key }, message);
  }
}

export const createHatchetLogger = (context: string, logLevel?: LogLevel) =>
  new PinoHatchetLogger(context, logLevel);
