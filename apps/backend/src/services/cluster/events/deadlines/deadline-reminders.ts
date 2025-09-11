import type { IEvent } from "@remoodle/types";
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

const convertThresholds = (thresholds: string[]): number[] => {
  return thresholds.map(convertThresholdToMs).sort((a, b) => a - b);
};

export const calculateRemainingThreshold = (
  dueDate: number,
  thresholds: string[],
): string | null => {
  const thresholdsMs = convertThresholds(thresholds);

  const now = Date.now();
  const remainingMs = dueDate - now;

  if (remainingMs <= 0) {
    return null;
  }

  for (let i = 0; i < thresholdsMs.length; i++) {
    if (remainingMs <= thresholdsMs[i]) {
      return convertMsToThreshold(thresholdsMs[i]);
    }
  }

  return null;
};

export const trackDeadlineReminders = (
  events: IEvent[],
  thresholds: string[],
): CourseDeadlineReminders[] => {
  const deadlineReminders: CourseDeadlineReminders[] = [];

  for (const { data: event, reminders } of events) {
    const { id, name, timestart, course } = event;

    const dueDate = timestart * 1000; // Convert to milliseconds

    const threshold = calculateRemainingThreshold(dueDate, thresholds);

    if (!threshold) {
      continue;
    }

    if (reminders && reminders[threshold]) {
      continue;
    }

    const existingCourseReminder = deadlineReminders.find(
      (item) => item.course_id === course.id,
    );

    if (!existingCourseReminder) {
      deadlineReminders.push({
        course_id: course.id,
        course_name: course.fullname,
        reminders: [
          {
            event_id: id,
            event_name: name,
            event_timestart: timestart,
            threshold,
          },
        ],
      });
    } else {
      existingCourseReminder.reminders.push({
        event_id: id,
        event_name: name,
        event_timestart: timestart,
        threshold,
      });
    }
  }

  return deadlineReminders;
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
