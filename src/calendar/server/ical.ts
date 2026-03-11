import type { ScheduleData } from "./types.d";

type ScheduleItem = ScheduleData[string][number];

// Day of week mapping: "Monday" -> 0, "Tuesday" -> 1, etc.
// schedule items have start like "Monday 09:00"
const WEEKDAY_MAP: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 0,
};

const RRULE_DAY: Record<string, string> = {
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR",
  Saturday: "SA",
  Sunday: "SU",
};

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    "00Z"
  );
}

function getNextWeekday(targetDay: number, fromDate: Date): Date {
  const result = new Date(fromDate);
  const currentDay = result.getUTCDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;
  result.setUTCDate(result.getUTCDate() + diff);
  return result;
}

function parseScheduleTime(timeStr: string): {
  weekday: string;
  hours: number;
  minutes: number;
} {
  // Format: "Monday 09:00" or "09:00" (if only time part)
  const parts = timeStr.split(" ");
  if (parts.length === 2) {
    const weekday = parts[0]!;
    const [h, m] = parts[1]!.split(":").map(Number);
    return { weekday, hours: h!, minutes: m! };
  }
  // Fallback: just time, assume Monday
  const [h, m] = timeStr.split(":").map(Number);
  return { weekday: "Monday", hours: h!, minutes: m! };
}

export function generateIcal(
  items: ScheduleItem[],
  now: Date = new Date(),
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Remoodle Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Schedule",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const item of items) {
    const startParsed = parseScheduleTime(item.start);
    const endParsed = parseScheduleTime(item.end);

    const weekdayNum = WEEKDAY_MAP[startParsed.weekday] ?? 1;
    const rruleDay = RRULE_DAY[startParsed.weekday] ?? "MO";

    const firstDay = getNextWeekday(weekdayNum, now);

    const dtstart = new Date(firstDay);
    dtstart.setUTCHours(startParsed.hours, startParsed.minutes, 0, 0);

    const dtend = new Date(firstDay);
    dtend.setUTCHours(endParsed.hours, endParsed.minutes, 0, 0);
    // If end time parsed as same weekday but is before start (shouldn't happen), add 50min fallback
    if (dtend <= dtstart) {
      dtend.setUTCMinutes(dtend.getUTCMinutes() + 50);
    }

    const summary = item.courseName;
    const location = item.isOnline ? "Online" : item.location;
    const description = [
      item.teacher ? `Teacher: ${item.teacher}` : "",
      item.type ? `Type: ${item.type}` : "",
    ]
      .filter(Boolean)
      .join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@calendar`,
      `DTSTART:${formatDate(dtstart)}`,
      `DTEND:${formatDate(dtend)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${rruleDay}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      `DTSTAMP:${formatDate(now)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
