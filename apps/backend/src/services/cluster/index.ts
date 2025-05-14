import type { WorkerOptions } from "bullmq";
import { Worker } from "bullmq";
import { queues, obliterateQueues, closeQueues } from "../../core/queues";
import { config } from "../../config";
import { logger } from "../../library/logger";
import { db } from "../../library/db";
import { findJobQueueProcessor } from "./processors";
import { loadConfig, type Tasks } from "./config";

const upsertSchedulers = async (tasks: Tasks) => {
  const repeatableTasks = tasks.filter((task) => task.repeat);

  for (const task of repeatableTasks) {
    const [queueName, _] = findJobQueueProcessor(task.name);

    const queue = queues[queueName];

    await queue.upsertJobScheduler(task.name, task.repeat!, {
      opts: {
        backoff: 3,
        attempts: 6,
        removeOnFail: false,
      },
    });
  }
};

const workers: Worker[] = [];

const defaultWorkerOptions: WorkerOptions = {
  connection: db.redisConnection,
  removeOnComplete: { age: 3600 }, // keep up to 1 day
  removeOnFail: { age: 3600 * 3 }, // keep up to 3 hours
};

const spawnWorkers = async (tasks: Tasks) => {
  for (const task of tasks) {
    const [queueName, { process }] = findJobQueueProcessor(task.name);

    const worker = new Worker(queueName, process, {
      ...defaultWorkerOptions,
      ...task.opts,
    });

    workers.push(worker);
  }
};

const run = async () => {
  logger.cluster.info("starting cluster...");

  const tasks = await loadConfig();

  if (config.cluster.scheduler.enabled && config.cluster.queues.prune) {
    logger.cluster.info("obliterating queues...");
    await obliterateQueues();
  }

  if (config.cluster.scheduler.enabled) {
    logger.cluster.info("upserting schedulers...");
    await upsertSchedulers(tasks);
  }

  logger.cluster.info("spawning workers...");
  await spawnWorkers(tasks);
};

run().catch((e) => {
  logger.cluster.error(e);
  process.exit(1);
});

export const closeWorkers = async () => {
  for (const worker of workers) {
    await worker.close();
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.cluster.info(`received ${signal}, closing server...`);
  await closeQueues();
  await closeWorkers();
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
