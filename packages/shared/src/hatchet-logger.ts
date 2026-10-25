import { type LogExtra, Logger, type LogLevel } from "@hatchet-dev/typescript-sdk/util/logger";
import type { ILogLayer, LogLevelType } from "loglayer";

class LogLayerHatchetLogger extends Logger {
  private readonly log;

  constructor(base: ILogLayer, context: string, logLevel: LogLevel = "INFO") {
    super();
    this.log = base.child().withContext({ module: "worker", operation: "hatchet", context });

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

// Routes Hatchet's own logs through the app logger.
export function hatchetLogger(base: ILogLayer) {
  return (context: string, logLevel?: LogLevel) =>
    new LogLayerHatchetLogger(base, context, logLevel);
}
