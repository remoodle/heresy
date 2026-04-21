import type { RepeatOptions, WorkerOptions } from "bullmq";
import { logger } from "../../library/logger";
import { JobName } from "../../core/queues";
import { config } from "../../config";

type Task = {
  name: JobName;
  repeat?: Omit<RepeatOptions, "key">;
  opts?: Partial<WorkerOptions>;
};

export type Tasks = Task[];

export const loadConfig = async () => {
  const { configPath } = config.cluster.tasks;

  logger.cluster.info(`loading config from ${configPath}`);

  const { default: configFile } = await import(configPath, {
    with: {
      type: "json",
    },
  });

  return configFile as Tasks;
};
