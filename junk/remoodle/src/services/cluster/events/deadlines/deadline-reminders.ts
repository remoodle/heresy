import type { IEvent, IReminder } from "../../../../types";
import {
  getTimeLeft,
  durationToMs,
  toISO8601Duration,
  formatDate,
} from "../../../../library/utils";

export const trackDeadlineReminders = (
  thresholds: string[],
  events: IEvent[],
  existingReminders: IReminder[],
) => {
  const reminders: {
    userId: string;
    eventId: string;
    triggeredAt: Date;
  }[] = [];

  const nowMs = Date.now();

  const thresholdsMs = [...thresholds.map(durationToMs)].sort((a, b) => a - b);

  for (const event of events) {
    const dueMs = event.data.timestart * 1000;
    const remainingMs = dueMs - nowMs;

    if (!Number.isFinite(dueMs) || remainingMs <= 0) {
      continue;
    }

    const eventReminders = existingReminders.filter((reminder) => {
      return reminder.eventId === event._id;
    });

    for (const thresholdMs of thresholdsMs) {
      if (thresholdMs >= remainingMs) {
        const thresholdDateMs = dueMs - thresholdMs;

        const hasReminderAfterThreshold = eventReminders.some((reminder) => {
          return reminder.triggeredAt.getTime() >= thresholdDateMs;
        });

        if (!hasReminderAfterThreshold) {
          reminders.push({
            userId: event.userId,
            eventId: event._id,
            triggeredAt: new Date(),
          });
        }

        break;
      }
    }
  }

  return reminders;
};

export type CourseDeadlineReminders = {
  course_id: number;
  course_name: string;
  reminders: {
    event_id: number;
    event_name: string;
    event_timestart: number;
    remaining: string;
  }[];
};

export const getCourseDeadlineReminders = (
  events: IEvent[],
  reminders: Pick<IReminder, "eventId" | "triggeredAt">[],
): CourseDeadlineReminders[] => {
  const eventsById = new Map<string, IEvent>(
    events.map((event) => {
      return [event._id, event];
    }),
  );

  const courseMap = new Map<number, CourseDeadlineReminders>();

  for (const reminder of reminders) {
    const event = eventsById.get(reminder.eventId);

    if (!event) {
      continue;
    }

    const courseId = event.data.course.id;
    const courseName = event.data.course.fullname;

    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        course_id: courseId,
        course_name: courseName,
        reminders: [],
      });
    }

    courseMap.get(courseId)!.reminders.push({
      event_id: event.data.id,
      event_name: event.data.name,
      event_timestart: event.data.timestart,
      remaining: toISO8601Duration(
        event.data.timestart * 1000 - reminder.triggeredAt.getTime(),
      ),
    });
  }

  const courseDeadlineReminders = Array.from(courseMap.values());

  return courseDeadlineReminders.filter((course) => !!course.reminders.length);
};

export const formatCourseDeadlineReminders = (
  data: CourseDeadlineReminders[],
): string => {
  let message = "🔔 Upcoming deadlines 🔔\n\n";

  for (const diff of data) {
    message += `🗓 ${diff.course_name}\n`;

    for (const { event_name, event_timestart } of diff.reminders) {
      const timestamp = event_timestart * 1000;

      message += `  • ${event_name}: <b>${getTimeLeft(
        timestamp,
      )}</b>, ${formatDate(timestamp)}\n`;
    }
    message += "\n";
  }

  return message;
};
