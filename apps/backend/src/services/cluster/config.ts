import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "node:fs/promises";
import type { RepeatOptions, WorkerOptions } from "bullmq";
import { logger } from "../../library/logger";
import { JobName } from "../../core/queues";
import { config } from "../../config";

type Task = {
  name: JobName;
  repeat?: Omit<RepeatOptions, "key">;
  opts?: WorkerOptions;
};

export type Tasks = Task[];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadConfig = async () => {
  const { configPath } = config.cluster.tasks;

  logger.cluster.info(`loading config from ${configPath}`);
  const configFile = await readFile(__dirname + configPath, "utf8");

  return JSON.parse(configFile) as Tasks;
};
