import type { IEvent, IReminder } from "@remoodle/types";
import { getTimeLeft } from "@remoodle/utils";

export type CourseDeadlineReminders = {
  course_id: number;
  course_name: string;
  reminders: {
    event_id: number;
    event_name: string;
    event_timestart: number;
    threshold: string;
  }[];
};

const convertThresholdToMs = (value: string): number => {
  const match = value.match(/^(\d+)([a-zA-Z]+)$/);

  if (!match) {
    throw new Error(
      `Invalid time format: ${value}. Expected format like "3h", "6h", "1d"`,
    );
  }

  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "m":
      return num * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    case "d":
      return num * 24 * 60 * 60 * 1000;
    default:
      throw new Error(
        `Unsupported time unit: ${unit}. Supported units: m, h, d`,
      );
  }
};

const convertMsToThreshold = (ms: number): string => {
  if (ms < 0) {
    throw new Error("Duration cannot be negative");
  }
  if (!Number.isInteger(ms)) {
    throw new Error("Duration must be a whole number of milliseconds");
  }

  if (ms >= 24 * 60 * 60 * 1000) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    return `${days}d`;
  }

  if (ms >= 60 * 60 * 1000) {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    return `${hours}h`;
  }

  const minutes = Math.floor(ms / (60 * 1000));
  return `${minutes}m`;
};

const getSortedThresholds = (thresholds: string[]): number[] => {
  return thresholds.map(convertThresholdToMs).sort((a, b) => a - b);
};

type EventReminder = {
  userId: string;
  eventId: string;
  triggeredAt: Date;
  threshold: string;
};

export const trackDeadlineReminders = (
  thresholds: string[],
  events: IEvent[],
  existingReminders: IReminder[],
) => {
  const reminders: EventReminder[] = [];

  const thresholdsMsAsc = getSortedThresholds(thresholds);

  const nowMs = Date.now();

  for (const event of events) {
    const dueMs = event.data.timestart * 1000;
    const remainingMs = dueMs - nowMs;

    if (!Number.isFinite(dueMs) || remainingMs <= 0) {
      continue;
    }

    const eventReminders = existingReminders.filter((reminder) => {
      return reminder.eventId === event._id;
    });

    for (const thresholdMs of thresholdsMsAsc) {
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
            threshold: convertMsToThreshold(thresholdMs),
          });
        }

        break;
      }
    }
  }

  return reminders;
};

export const getCourseDeadlineReminders = (
  events: IEvent[],
  reminders: EventReminder[],
): CourseDeadlineReminders[] => {
  const eventsById = new Map<string, IEvent>(
    events.map((event) => {
      return [event._id, event];
    }),
  );

  const courseMap = new Map<
    number,
    {
      course_id: number;
      course_name: string;
      reminders: {
        event_id: number;
        event_name: string;
        event_timestart: number;
        threshold: string;
      }[];
    }
  >();

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
      threshold: reminder.threshold,
    });
  }

  return Array.from(courseMap.values()).filter((course) => {
    return course.reminders.length > 0;
  });
};

export const formatDeadlineReminders = (
  data: CourseDeadlineReminders[],
  formatter = (timestart: number) => getTimeLeft(timestart),
): string => {
  let message = "🔔 Upcoming deadlines 🔔\n\n";

  for (const diff of data) {
    message += `🗓 ${diff.course_name}\n`;

    for (const { event_name, event_timestart } of diff.reminders) {
      const timestamp = event_timestart * 1000;

      const formattedDate = new Date(timestamp).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Almaty",
      });
      message += `  • ${event_name}: <b>${formatter(timestamp)}</b>, ${formattedDate}\n`;
    }
    message += "\n";
  }

  return message;
};
