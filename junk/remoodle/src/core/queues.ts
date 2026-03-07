import { Queue } from "bullmq";
import { getValues } from "../library/utils";
import { db } from "../library/db";
import { bullOtel } from "./telemetry";

export enum JobName {
  COOKIES_SCHEDULE_SYNC = "cookies::schedule-sync",
  COOKIES_UPDATE = "cookies::update",

  COURSES_SCHEDULE_SYNC = "courses::schedule-sync",
  COURSES_UPDATE = "courses::update",

  EVENTS_SCHEDULE_SYNC = "events::schedule-sync",
  EVENTS_UPDATE = "events::update",

  GRADES_SCHEDULE_SYNC = "grades::schedule-sync",
  GRADES_UPDATE_COURSE = "grades::update-by-course",
  GRADES_COMBINE_DIFFS = "grades::combine-diffs",

  REMINDERS_CHECK = "reminders::check",

  TELEGRAM_SEND_MESSAGE = "telegram::send-message",
}

export enum QueueName {
  COOKIES_SYNC = "cookies sync",
  COOKIES = "cookies update",

  EVENTS_SYNC = "events sync",
  EVENTS = "events update",

  COURSES_SYNC = "courses sync",
  COURSES = "courses update",

  GRADES_SYNC = "grades sync",
  GRADES_FLOW_UPDATE = "grades update",
  GRADES_FLOW_COMBINE = "grades combine",

  REMINDERS = "reminders",

  TELEGRAM = "telegram",
}

export const queueNames = getValues(QueueName);

export const queues: Record<QueueName, Queue> = queueNames.reduce(
  (acc, name) => {
    acc[name] = new Queue(name, {
      connection: db.redisConnection,
      telemetry: bullOtel,
    });
    return acc;
  },
  {} as Record<QueueName, Queue>,
);

export const queueValues = getValues(queues);

export const obliterateQueues = async () => {
  for (const queue of queueValues) {
    await queue.obliterate({ force: true });
  }
};

export const closeQueues = async () => {
  for (const queue of queueValues) {
    await queue.close();
  }
};
