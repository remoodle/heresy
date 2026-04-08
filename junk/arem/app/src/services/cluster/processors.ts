import { FlowProducer } from "bullmq";
import type { FlowChildJob, FlowJob, Job } from "bullmq";
import {
  Telegram,
  getValues,
  partition,
  objectEntries,
} from "../../library/utils";
import { config } from "../../config";
import { db, wrapper } from "../../library/db";
import { logger } from "../../library/logger";
import {
  syncCookies,
  syncEvents,
  syncCourses,
  syncCourseGrades,
} from "../../core/sync";
import { bullOtel } from "../../core/telemetry";
import { queues, QueueName, JobName } from "../../core/queues";
import {
  formatGradeChanges,
  trackCourseGradeChanges,
} from "./events/grades/grade-changes";
import {
  formatCourseDeadlineReminders,
  trackDeadlineReminders,
  getCourseDeadlineReminders,
} from "./events/deadlines/deadline-reminders";
import {
  formatCourseChanges,
  trackCourseChanges,
} from "./events/courses/course-changes";

export type Processor = {
  // TODO: Consider using JobName | JobName[] to support Named Processors
  // https://docs.bullmq.io/patterns/named-processor
  // https://docs.nestjs.com/techniques/queues
  jobName: JobName;
  process(job: Job): Promise<any>;
};

const flowProducer = new FlowProducer({
  connection: db.redisConnection,
  telemetry: bullOtel,
});

export const processors: Record<QueueName, Processor> = {
  [QueueName.COOKIES_SYNC]: {
    jobName: JobName.COOKIES_SCHEDULE_SYNC,
    process: async (job) => {
      const { userId } = job.data;

      const users = userId ? [{ userId }] : await wrapper.getActiveUsers();

      logger.cluster.info(
        { userId },
        `scheduling users cookies sync for ${users.length} users`,
      );

      const jobs = users.map((payload) => ({
        name: JobName.COOKIES_UPDATE,
        data: { userId: payload.userId },
        opts: {
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          deduplication: {
            id: payload.userId,
          },
        },
      }));

      const bulk = await queues[QueueName.COOKIES].addBulk(jobs);

      return bulk.length;
    },
  },
  [QueueName.COOKIES]: {
    jobName: JobName.COOKIES_UPDATE,
    process: async (job) => {
      const { userId } = job.data;

      logger.cluster.info({ userId }, `syncing users cookies`);

      await syncCookies(userId);
    },
  },
  [QueueName.EVENTS_SYNC]: {
    jobName: JobName.EVENTS_SCHEDULE_SYNC,
    process: async (job) => {
      const { userId } = job.data;

      const users = userId ? [{ userId }] : await wrapper.getActiveUsers();

      logger.cluster.info(
        { userId },
        `scheduling events sync for ${users.length} users`,
      );

      const flows = users.map((user) => ({
        queueName: QueueName.REMINDERS,
        name: JobName.REMINDERS_CHECK,
        data: { userId: user.userId },
        children: [
          {
            queueName: QueueName.EVENTS,
            name: JobName.EVENTS_UPDATE,
            data: { userId: user.userId },
            opts: {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 1000,
              },
              deduplication: {
                id: user.userId,
              },
              ignoreDependencyOnFailure: true,
            },
          },
        ],
        opts: {
          deduplication: {
            id: user.userId,
          },
        },
      }));

      const trees = await flowProducer.addBulk(flows);

      return trees.length;
    },
  },
  [QueueName.EVENTS]: {
    jobName: JobName.EVENTS_UPDATE,
    process: async (job) => {
      const { userId } = job.data;

      logger.cluster.info({ userId }, `syncing events`);

      await syncEvents(userId);
    },
  },
  [QueueName.COURSES_SYNC]: {
    jobName: JobName.COURSES_SCHEDULE_SYNC,
    process: async (job) => {
      const { userId } = job.data;

      const users = userId ? [{ userId }] : await wrapper.getActiveUsers();

      logger.cluster.info(
        { userId },
        `scheduling courses sync for ${users.length} users`,
      );

      const jobs = users.map((payload) => ({
        name: JobName.COURSES_UPDATE,
        data: { userId: payload.userId },
        opts: {
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          deduplication: {
            id: payload.userId,
          },
        },
      }));

      const bulk = await queues[QueueName.COURSES].addBulk(jobs);

      return bulk.length;
    },
  },
  [QueueName.COURSES]: {
    jobName: JobName.COURSES_UPDATE,
    process: async (job) => {
      const { userId, trackDiff = true } = job.data;

      logger.cluster.info({ userId }, `syncing courses`);

      const result = await syncCourses(
        userId,
        ["inprogress", "past"],
        trackDiff,
      );

      if (!result) {
        return "no course changes to track";
      }

      const { existingCourses, updatedCourses } = result;

      const courseChanges = trackCourseChanges(existingCourses, updatedCourses);

      if (!courseChanges.changes.length) {
        return "no course changes detected";
      }

      const user = await db.user.findOne({ _id: userId });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      if (
        user.telegramId &&
        user.settings.notifications["courseChanges::telegram"] !== 0
      ) {
        const message = formatCourseChanges(courseChanges);

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
      }

      return courseChanges;
    },
  },
  [QueueName.GRADES_SYNC]: {
    jobName: JobName.GRADES_SCHEDULE_SYNC,
    process: async (job) => {
      const {
        userId,
        classification = "inprogress",
        trackDiff = true,
      } = job.data;

      const { lifo } = job.opts;

      const users = userId ? [{ userId }] : await wrapper.getActiveUsers();

      logger.cluster.info(
        { userId, classification, trackDiff },
        `scheduling grades sync for ${users.length} users`,
      );

      const courses = await db.course
        .find({
          $or: [{ disabledAt: { $exists: false } }, { disabledAt: null }],
          userId: { $in: users.map((user) => user.userId) },
          ...(classification && { classification }),
        })
        .lean();

      const grouppedCourses = partition(courses, (course) => course.userId);

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
              queueName: QueueName.GRADES_FLOW_UPDATE,
              name: JobName.GRADES_UPDATE_COURSE,
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

          return {
            queueName: QueueName.GRADES_FLOW_COMBINE,
            name: JobName.GRADES_COMBINE_DIFFS,
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
          };
        })
        .filter(Boolean);

      const trees = await flowProducer.addBulk(flows);

      return trees.length;
    },
  },
  [QueueName.GRADES_FLOW_UPDATE]: {
    jobName: JobName.GRADES_UPDATE_COURSE,
    process: async (job) => {
      const { userId, courseId, courseName, trackDiff } = job.data;

      logger.cluster.info(
        { userId, courseId, trackDiff },
        `syncing course grades`,
      );

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
    jobName: JobName.GRADES_COMBINE_DIFFS,
    process: async (job) => {
      const { userId, courseIds } = job.data;

      logger.cluster.info({ userId, courseIds }, `combining grades`);

      const childrenValues = await job.getChildrenValues<Awaited<
        ReturnType<typeof trackCourseGradeChanges>
      > | null>();

      const gradeChanges = getValues(childrenValues)
        .filter(Boolean)
        .filter((course) => !!course.changes.length);

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
      }

      return gradeChanges;
    },
  },
  [QueueName.REMINDERS]: {
    jobName: JobName.REMINDERS_CHECK,
    process: async (job) => {
      const { userId } = job.data;

      logger.cluster.info({ userId }, `checking reminders`);

      const user = await db.user.findOne({ _id: userId });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const events = await db.event
        .find({ userId })
        .sort({ "data.timestart": 1 });

      if (!events.length) {
        return "no events";
      }

      const existingReminders = await db.reminder.find({ userId });

      const reminders = trackDeadlineReminders(
        user.settings.deadlineReminders.thresholds,
        events,
        existingReminders,
      );

      if (!reminders.length) {
        return "no deadline reminders";
      }

      if (
        user.telegramId &&
        user.settings.notifications["deadlineReminders::telegram"] !== 0
      ) {
        const newReminders = await db.reminder.insertMany(reminders);

        const deadlineReminders = getCourseDeadlineReminders(
          events,
          newReminders,
        );

        const message = formatCourseDeadlineReminders(deadlineReminders);

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
      }

      return reminders;
    },
  },
  [QueueName.TELEGRAM]: {
    jobName: JobName.TELEGRAM_SEND_MESSAGE,
    process: async (job) => {
      const { userId, message } = job.data;

      logger.cluster.info({ userId }, `sending telegram message`);

      const user = await db.user.findOne({ _id: userId });

      if (!user) {
        throw new Error(`User ${userId} not found`);
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
          {
            userId,
            name: user.name,
            message,
          },
          `sent telegram message`,
        );
      } else {
        logger.cluster.error(
          {
            userId,
            name: user.name,
            message,
            status: response.status,
            statusText: response.statusText,
          },
          `failed to send notification`,
        );
      }
    },
  },
};

export const getQueueProcessor = (jobName: JobName) => {
  const data = objectEntries(processors).find(([, processor]) => {
    return processor.jobName === jobName;
  });

  if (!data) {
    throw new Error(`Processor for ${jobName} not found`);
  }

  return data;
};
