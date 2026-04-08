import type { CalendarEvent } from "./calendar";
import { durationToMs, getTimeLeft, formatDate, humanizeDuration } from "./dates";

export type PendingReminder = {
  eventId: string;
  triggeredAt: Date;
};

export type ExistingReminder = {
  eventId: string;
  triggeredAt: Date;
};

export function trackDeadlineReminders(
  thresholds: string[],
  events: CalendarEvent[],
  existing: ExistingReminder[],
): PendingReminder[] {
  const pending: PendingReminder[] = [];
  const nowMs = Date.now();
  const thresholdsMs = thresholds.map(durationToMs).sort((a, b) => a - b);

  for (const event of events) {
    const dueMs = event.timestampMs;
    const remainingMs = dueMs - nowMs;

    if (!Number.isFinite(dueMs) || remainingMs <= 0) {
      continue;
    }

    const eventReminders = existing.filter((r) => r.eventId === event.uid);

    for (const thresholdMs of thresholdsMs) {
      if (thresholdMs >= remainingMs) {
        const thresholdDateMs = dueMs - thresholdMs;
        const alreadySent = eventReminders.some((r) => r.triggeredAt.getTime() >= thresholdDateMs);

        if (!alreadySent) {
          pending.push({ eventId: event.uid, triggeredAt: new Date() });
        }

        break;
      }
    }
  }

  return pending;
}

export type DeadlineGroup = {
  reminders: {
    summary: string;
    timestampMs: number;
    remaining: string;
  }[];
};

export function getDeadlineName(summary: string): string {
  return summary.replace(/ is due( to be graded)?$/i, "").trim();
}

function getCourseLabel(event: Pick<CalendarEvent, "courseName">): string {
  return event.courseName?.trim() || "Unknown course";
}

function getDeadlineIcon(timestampMs: number, fireThresholdHours = 3): string {
  const hoursLeft = (timestampMs - Date.now()) / (60 * 60 * 1000);
  return hoursLeft <= fireThresholdHours ? "🔥" : "📅";
}

export function buildReminderMessage(
  events: CalendarEvent[],
  reminders: PendingReminder[],
): string {
  const eventMap = new Map(events.map((e) => [e.uid, e]));
  type ReminderItem = {
    uid: string;
    summary: string;
    timestampMs: number;
  };

  const remindersByCourse = new Map<string, ReminderItem[]>();

  for (const reminder of reminders) {
    const event = eventMap.get(reminder.eventId);
    if (!event) {
      continue;
    }

    const courseLabel = getCourseLabel(event);
    const items = remindersByCourse.get(courseLabel) ?? [];
    items.push({
      uid: event.uid,
      summary: event.summary,
      timestampMs: event.timestampMs,
    });
    remindersByCourse.set(courseLabel, items);
  }

  let message = "🔔 Upcoming deadlines 🔔\n\n";

  for (const [courseLabel, courseReminders] of Array.from(remindersByCourse.entries())) {
    message += `🗓 ${courseLabel}\n`;

    for (const event of courseReminders.sort(
      (a: ReminderItem, b: ReminderItem) => a.timestampMs - b.timestampMs,
    )) {
      message += `  • ${getDeadlineName(event.summary)}: <b>${getTimeLeft(
        event.timestampMs,
      )}</b>, ${formatDate(event.timestampMs)}\n`;
    }

    message += "\n";
  }

  return message.trim();
}

export function buildDeadlinesMessage(events: CalendarEvent[], daysLimit = 14): string {
  const nowMs = Date.now();
  const limitMs = nowMs + daysLimit * 24 * 60 * 60 * 1000;

  const upcoming = events
    .filter((e) => e.timestampMs > nowMs && e.timestampMs <= limitMs)
    .sort((a, b) => a.timestampMs - b.timestampMs);

  if (upcoming.length === 0) {
    return `No upcoming deadlines in the next ${daysLimit} days.`;
  }

  let message = "Upcoming deadlines:\n\n";

  for (const event of upcoming) {
    message += `${getDeadlineIcon(event.timestampMs)}  <b>${getDeadlineName(
      event.summary,
    )}</b>  |  ${getCourseLabel(event)}  |  Date → ${formatDate(
      event.timestampMs,
    )}  |  Time left → <b>${getTimeLeft(event.timestampMs)}</b>\n\n`;
  }

  return message.trim();
}

export const AVAILABLE_THRESHOLDS = [
  "PT30M",
  "PT1H",
  "PT3H",
  "PT6H",
  "PT12H",
  "P1D",
  "P2D",
  "P1W",
] as const;

export function buildThresholdsMessage(thresholds: string[]): string {
  let msg = "<b>Deadline reminder thresholds</b>\n\n";

  if (thresholds.length === 0) {
    msg += "No thresholds configured — you won't receive reminders.\n\n";
  } else {
    msg += "Active:\n";
    [...thresholds]
      .sort((a, b) => durationToMs(a) - durationToMs(b))
      .forEach((t) => {
        msg += `  • ${humanizeDuration(t)}\n`;
      });
    msg += "\n";
  }

  msg += "Toggle thresholds below:";
  return msg;
}
