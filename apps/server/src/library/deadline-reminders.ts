import { durationToMs } from "@heresy/shared/dates";
import type { DeadlineEvent } from "@heresy/shared/moodle/deadlines";

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
  events: DeadlineEvent[],
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
