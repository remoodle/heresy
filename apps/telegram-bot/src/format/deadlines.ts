import { m } from "../i18n/messages.js";
import { bold } from "./telegram-html";
import type { DeadlineEvent } from "@heresy/shared/moodle/deadlines";
import { formatDate, getTimeLeft } from "@heresy/shared/dates";

function getDeadlineName(summary: string): string {
  return summary.replace(/ is due( to be graded)?$/i, "").trim();
}

function getCourseLabel(event: Pick<DeadlineEvent, "courseName">): string {
  return event.courseName?.trim() || m.unknown_course();
}

function formatDeadlineItem(event: DeadlineEvent): string {
  return m.deadline_item({
    name: bold(getDeadlineName(event.summary)),
    course: getCourseLabel(event),
    date: formatDate(event.timestampMs),
    timeLeft: bold(getTimeLeft(event.timestampMs)),
  });
}

// Reminders and the deadline list share one item format so both read the same.
function buildDeadlineList(header: string, events: DeadlineEvent[]): string {
  const items = [...events].sort((a, b) => a.timestampMs - b.timestampMs).map(formatDeadlineItem);

  return [header, ...items].join("\n\n");
}

export function buildReminderMessage(events: DeadlineEvent[]): string {
  return buildDeadlineList(bold(m.reminder_header()), events);
}

export function buildDeadlinesMessage(events: DeadlineEvent[], daysLimit = 14): string {
  const nowMs = Date.now();
  const limitMs = nowMs + daysLimit * 24 * 60 * 60 * 1000;
  const upcoming = events.filter((e) => e.timestampMs > nowMs && e.timestampMs <= limitMs);
  const header = bold(m.deadlines_upcoming_header());

  if (upcoming.length === 0) {
    return `${header}\n\n${m.no_upcoming_deadlines({ days: daysLimit })}`;
  }

  return buildDeadlineList(header, upcoming);
}
