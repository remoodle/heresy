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
  const [amount, unit] = value.split(" ");
  const num = parseInt(amount, 10);

  switch (unit.toLowerCase()) {
    case "minute":
    case "minutes":
      return num * 60 * 1000;
    case "hour":
    case "hours":
      return num * 60 * 60 * 1000;
    case "day":
    case "days":
      return num * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
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
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  if (ms >= 60 * 60 * 1000) {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  const minutes = Math.floor(ms / (60 * 1000));
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
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
  formatter = (timestart: number) => getTimeLeft(timestart * 1000),
): string => {
  let message = "🔔 Upcoming deadlines 🔔\n\n";

  for (const diff of data) {
    message += `🗓 ${diff.course_name}\n`;

    for (const { event_name, event_timestart } of diff.reminders) {
      const formattedDate = new Date(event_timestart).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Almaty",
      });
      message += `  • ${event_name}: <b>${formatter(event_timestart)}</b>, ${formattedDate}\n`;
    }
    message += "\n";
  }

  return message;
};
