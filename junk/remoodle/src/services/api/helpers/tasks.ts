import { FlowProducer } from "bullmq";
import { QueueName, JobName, queues } from "../../../core/queues";
import { db } from "../../../library/db";

function _getFlowProducer() {
  return new FlowProducer({
    connection: db.redisConnection,
  });
}

export const syncUserData = async (userId: string) => {
  const flowProducer = _getFlowProducer();

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

export const notifyUserAddedAccount = async (
  userId: string,
  userMoodleName: string,
) => {
  const message = `🎉 ${userMoodleName}, our account has been successfully linked to your Moodle account! You will now start receiving updates about your grades, course changes, and event reminders. Stay tuned for more updates! 📚✨`;

  await queues[QueueName.TELEGRAM].add(
    JobName.TELEGRAM_SEND_MESSAGE,
    { userId, message },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      deduplication: {
        id: `${userId}::${message}`,
      },
    },
  );
};
