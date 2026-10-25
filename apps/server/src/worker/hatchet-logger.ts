import { type LogExtra, Logger, type LogLevel } from "@hatchet-dev/typescript-sdk/util/logger";
import type { LogLevelType } from "loglayer";
import { logger } from "../library/logger";

export class PinoHatchetLogger extends Logger {
  private readonly log;

  constructor(context: string, logLevel: LogLevel = "INFO") {
    super();
    this.log = logger.child().withContext({ module: "worker", operation: "hatchet", context });

    if (logLevel === "OFF") {
      this.log.disableLogging();
    } else {
      let level: LogLevelType;

      switch (logLevel) {
        case "DEBUG":
          level = "debug";
          break;
        case "INFO":
          level = "info";
          break;
        case "WARN":
          level = "warn";
          break;
        case "ERROR":
          level = "error";
          break;
      }

      this.log.setLevel(level);
    }
  }

  override debug(message: string, extra?: LogExtra) {
    this.log.withMetadata(extra ?? {}).debug(message);
  }

  override info(message: string, extra?: LogExtra) {
    this.log.withMetadata(extra ?? {}).info(message);
  }

  override green(message: string, extra?: LogExtra) {
    this.log.withMetadata(extra ?? {}).info(message);
  }

  override warn(message: string, error?: Error, extra?: LogExtra) {
    this.log
      .withMetadata(extra ?? {})
      .withError(error)
      .warn(message);
  }

  override error(message: string, error?: Error, extra?: LogExtra) {
    this.log
      .withMetadata(extra ?? {})
      .withError(error)
      .error(message);
  }

  override util(key: string, message: string, extra?: LogExtra) {
    this.log.withMetadata({ ...extra, utilKey: key }).debug(message);
  }
}

export const createHatchetLogger = (context: string, logLevel?: LogLevel) =>
  new PinoHatchetLogger(context, logLevel);
