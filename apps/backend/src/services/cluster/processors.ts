import { FlowProducer } from "bullmq";
import type { FlowChildJob, FlowJob, Job } from "bullmq";
import { Telegram, getValues, partition, objectEntries } from "@remoodle/utils";
import { config } from "../../config";
import { db } from "../../library/db";
import { logger } from "../../library/logger";
import { getActiveUsers } from "../../core/wrapper";
import {
  type CourseGradeChanges,
  formatGradeChanges,
  trackCourseGradeChanges,
} from "../../core/events/grades";
import {
  formatDeadlineReminders,
  trackDeadlineReminders,
} from "../../core/events/deadlines";
import { syncEvents, syncCourses, syncCourseGrades } from "../../core/sync";
import { queues, QueueName, JobName } from "../../core/queues";

export type Processor = {
  /*
   * Could become JobName | JobName[] in future to support Named Processors
   * https://docs.bullmq.io/patterns/named-processor
   * https://docs.nestjs.com/techniques/queues
   */
  jobName: JobName;
  process(job: Job): Promise<any>;
};

export const processors: Record<QueueName, Processor> = {
  [QueueName.EVENTS_SYNC]: {
    jobName: JobName.SCHEDULE_EVENTS,
    process: async () => {
      const users = await getActiveUsers();

      logger.cluster.info(`Updating events for ${users.length} users`);

      const jobs = users.map((payload) => ({
        name: JobName.UPDATE_EVENTS,
        data: { userId: payload.userId },
        opts: {
          deduplication: {
            id: payload.userId,
          },
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      }));

      const bulk = await queues[QueueName.EVENTS].addBulk(jobs);

      return bulk.length;
    },
  },
  [QueueName.EVENTS]: {
    jobName: JobName.UPDATE_EVENTS,
    process: async (job) => {
      const { userId } = job.data;

      logger.cluster.info(`Updating events for ${userId}`);

      await syncEvents(userId);

      logger.cluster.info(`Scheduling reminders for ${userId}`);

      const reminderJob = await queues[QueueName.REMINDERS].add(
        QueueName.REMINDERS,
        { userId },
      );

      return reminderJob;
    },
  },
  [QueueName.COURSES_SYNC]: {
    jobName: JobName.SCHEDULE_COURSES,
    process: async () => {
      const users = await getActiveUsers();

      logger.cluster.info(`Updating courses for ${users.length} users`);

      const jobs = users.map((payload) => ({
        name: JobName.UPDATE_COURSES,
        data: { userId: payload.userId },
        opts: {
          deduplication: {
            id: payload.userId,
          },
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      }));

      const bulk = await queues[QueueName.COURSES].addBulk(jobs);

      return bulk.length;
    },
  },
  [QueueName.COURSES]: {
    jobName: JobName.UPDATE_COURSES,
    process: async (job) => {
      const { userId } = job.data;

      logger.cluster.info(`Updating courses for ${userId}`);

      await syncCourses(userId);
    },
  },
  [QueueName.GRADES_SYNC]: {
    jobName: JobName.SCHEDULE_GRADES,
    process: async (job) => {
      const users = await getActiveUsers();

      const { classification = "inprogress", trackDiff = true } = job.data;

      logger.cluster.info(
        `Updating ${classification} grades for ${users.length} users, trackDiff: ${trackDiff}`,
      );

      const courses = await db.course
        .find({
          deleted: false,
          notingroup: { $ne: true },
          userId: {
            $in: users.filter((u) => u.health > 0).map((u) => u.userId),
          },
          ...(classification && { classification }),
        })
        .lean();

      const grouppedCourses = partition(courses, (course) => course.userId);

      const flow = new FlowProducer({
        connection: db.redisConnection,
      });

      const flows: FlowJob[] = Object.entries(grouppedCourses)
        .map(([userId, courses]) => {
          if (!courses) {
            return;
          }

          const courseIds = courses.map((course) => course.data.id);

          const children: FlowChildJob[] = courses.map((course) => {
            const data = {
              userId,
              courseId: course.data.id,
              courseName: course.data.fullname,
              trackDiff,
            };

            return {
              name: JobName.UPDATE_COURSE_GRADES,
              data,
              queueName: QueueName.GRADES_FLOW_UPDATE,
              opts: {
                attempts: 4,
                backoff: {
                  type: "exponential",
                  delay: 2000,
                },
                deduplication: {
                  id: `${userId}::${course.data.id}`,
                },
                ignoreDependencyOnFailure: true,
              },
            };
          });

          return {
            name: JobName.COMBINE_GRADES,
            queueName: QueueName.GRADES_FLOW_COMBINE,
            data: {
              userId,
              courseIds,
            },
            children,
            opts: {
              deduplication: {
                id: `${userId}::${courseIds.join("-")}`,
              },
            },
          };
        })
        .filter(Boolean);

      const trees = await flow.addBulk(flows);

      return trees.length;
    },
  },
  [QueueName.GRADES_FLOW]: {
    jobName: JobName.UPDATE_GRADES,
    process: async (job) => {
      const { userId, classification, trackDiff } = job.data;

      const { lifo } = job.opts;

      logger.cluster.info(`Updating grades for ${userId}`);

      const courses = await db.course
        .find({
          userId,
          deleted: false,
          notingroup: { $ne: true },
          ...(classification && { classification }),
        })
        .lean();

      if (!courses.length) {
        return;
      }

      const courseIds = courses.map((course) => course.data.id);

      const flow = new FlowProducer({
        connection: db.redisConnection,
      });

      const children: FlowChildJob[] = courses.map((course) => {
        const data = {
          userId,
          courseId: course.data.id,
          courseName: course.data.fullname,
          trackDiff,
        };

        return {
          name: JobName.UPDATE_COURSE_GRADES,
          queueName: QueueName.GRADES_FLOW_UPDATE,
          data,
          opts: {
            lifo,
            attempts: 4,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
            deduplication: {
              id: `${userId}::${course.data.id}`,
            },
            ignoreDependencyOnFailure: true,
          },
        };
      });

      const tree = await flow.add({
        name: JobName.COMBINE_GRADES,
        queueName: QueueName.GRADES_FLOW_COMBINE,
        data: {
          userId,
          courseIds,
        },
        children,
        opts: {
          lifo,
          deduplication: {
            id: `${userId}::${courseIds.join("-")}`,
          },
        },
      });

      return tree.children?.length;
    },
  },
  [QueueName.GRADES_FLOW_UPDATE]: {
    jobName: JobName.UPDATE_COURSE_GRADES,
    process: async (job) => {
      const { userId, courseId, courseName, trackDiff } = job.data;

      const result = await syncCourseGrades(userId, courseId, trackDiff);

      if (!result) {
        return null;
      }

      return trackCourseGradeChanges(
        courseId,
        courseName,
        result.currentGradesData,
        result.updatedGradesData,
      );
    },
  },
  [QueueName.GRADES_FLOW_COMBINE]: {
    jobName: JobName.COMBINE_GRADES,
    process: async (job) => {
      const { userId, courseIds } = job.data;

      logger.cluster.info(
        `Combining grades for ${userId}, courses ${courseIds}`,
      );

      const childrenValues = await job.getChildrenValues<
        CourseGradeChanges | undefined
      >();

      const gradeChanges: CourseGradeChanges[] = getValues(childrenValues)
        .filter(Boolean)
        .filter((course) => !!course?.changes.length)
        .map((value) => value) as CourseGradeChanges[];

      if (!gradeChanges.length) {
        return "no grade changes";
      }

      const user = await db.user.findOne({ _id: userId });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      if (
        user.telegramId &&
        user.settings.notifications["gradeUpdates::telegram"] !== 0
      ) {
        const message = formatGradeChanges(gradeChanges);

        const job = await queues[QueueName.TELEGRAM].add(
          QueueName.TELEGRAM,
          {
            userId,
            message,
          },
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

        return job.data;
      }

      return gradeChanges;
    },
  },
  [QueueName.REMINDERS]: {
    jobName: JobName.CHECK_REMINDERS,
    process: async (job) => {
      const { userId } = job.data;

      logger.cluster.info(`Checking reminders for ${userId}`);

      const user = await db.user.findOne({ _id: userId });

      if (!user) {
        throw new Error(`User ${user} not found `);
      }

      const rawEvents = await db.event.find({ userId });

      const events = rawEvents.sort(
        (a, b) => a.data.timestart - b.data.timestart,
      );

      if (!events.length) {
        return "no events";
      }

      const deadlineReminders = trackDeadlineReminders(
        events,
        user.settings.deadlineReminders.thresholds,
      );

      if (!deadlineReminders.length) {
        return "no deadline reminders";
      }

      const reminders = deadlineReminders.flatMap(
        (deadlineReminder) => deadlineReminder.reminders,
      );

      for (const { event_id, threshold } of reminders) {
        const event = events.find(({ data }) => data.id === event_id);

        if (!event) {
          continue;
        }

        const updatedReminders = { ...(event.reminders || {}) };

        updatedReminders[threshold] = true;

        await db.event.findOneAndUpdate(
          { userId, "data.id": event.data.id },
          { $set: { reminders: updatedReminders } },
          { upsert: true },
        );
      }

      if (!deadlineReminders.length) {
        return "no deadline reminders";
      }

      if (
        user.telegramId &&
        user.settings.notifications["deadlineReminders::telegram"] !== 0
      ) {
        const message = formatDeadlineReminders(deadlineReminders);

        const job = await queues[QueueName.TELEGRAM].add(
          QueueName.TELEGRAM,
          {
            userId,
            message,
          },
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

        return job.data;
      }

      return deadlineReminders;
    },
  },
  [QueueName.TELEGRAM]: {
    jobName: JobName.SEND_TELEGRAM_MESSAGE,
    process: async (job) => {
      const { userId, message } = job.data;

      logger.cluster.info(`Sending telegram message for ${userId}`);

      const user = await db.user.findOne({ _id: userId });

      if (!user) {
        throw new Error(`User ${user} not found `);
      }

      if (!user.telegramId) {
        throw new Error(`User ${userId} has no telegramId`);
      }

      const telegram = new Telegram(config.telegram.token, user.telegramId);

      const response = await telegram.notify(message, {
        parseMode: "HTML",
        replyMarkup: [
          [
            {
              text: "Clear",
              callback_data: "remove_message",
            },
          ],
        ],
      });

      if (response.ok) {
        logger.cluster.info(
          message,
          `Sent notification to ${user.name} (${user.moodleId})`,
        );
      } else {
        logger.cluster.error(
          {
            status: response.status,
            statusText: response.statusText,
          },
          `Failed to send notification to ${user.name} (${user.moodleId})`,
        );
      }
    },
  },
};

export const findJobQueueProcessor = (jobName: JobName) => {
  const data = objectEntries(processors).find(
    ([, processor]) => processor.jobName === jobName,
  );

  if (!data) {
    throw new Error(`Processor for ${jobName} not found`);
  }

  return data;
};
