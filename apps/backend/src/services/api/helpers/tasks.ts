import { FlowProducer } from "bullmq";
import { QueueName, JobName } from "../../../core/queues";
import { db } from "../../../library/db";

export const syncUserData = async (userId: string) => {
  const flowProducer = new FlowProducer({
    connection: db.redisConnection,
  });

  await flowProducer.add({
    name: JobName.GRADES_SCHEDULE_SYNC,
    queueName: QueueName.GRADES_SYNC,
    data: {
      userId,
      trackDiff: false,
      classification: null,
    },
    opts: { lifo: true },
    children: [
      {
        name: JobName.COURSES_UPDATE,
        queueName: QueueName.COURSES,
        data: { userId, trackDiff: false },
        opts: { lifo: true },
      },
      {
        name: JobName.EVENTS_UPDATE,
        queueName: QueueName.EVENTS,
        data: { userId },
        opts: { lifo: true },
      },
    ],
  });
};
