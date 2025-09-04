import { FlowProducer } from "bullmq";
import { QueueName, JobName, queues } from "../../../core/queues";
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
    ],
  });

  await queues[QueueName.EVENTS].add(
    JobName.EVENTS_UPDATE,
    { userId },
    { lifo: true },
  );
};
