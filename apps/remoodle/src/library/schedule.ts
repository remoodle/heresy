type CalendarScheduleItem = {
  id: string;
  start: string;
  end: string;
  courseName: string;
  location: string;
  isOnline: boolean;
  teacher: string;
  type: "lecture" | "practice" | null;
};

export type ScheduleFilters = {
  eventTypes: { lecture: boolean; practice: boolean; learn: boolean };
  eventFormats: { online: boolean; offline: boolean };
  combineAdjacentPairs?: boolean;
};

export const DEFAULT_SCHEDULE_FILTERS: ScheduleFilters = {
  eventTypes: { lecture: true, practice: true, learn: true },
  eventFormats: { online: true, offline: true },
  combineAdjacentPairs: true,
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK_DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()]!;
}

function extractTime(timeStr: string): string {
  const parts = timeStr.split(" ");
  return parts.length === 2 ? parts[1]! : timeStr;
}

const ROOM_CODE_PATTERN = /C1\.\d+\.\d+[A-Z]*/;

export function extractRoomCode(location: string): string | null {
  return location.match(ROOM_CODE_PATTERN)?.[0] ?? null;
}

export function sanitizeRoomFilename(room: string): string {
  return room.replace(/[/\\?%*:|"<>.\s]/g, "-");
}

const SLOT_BREAK_THRESHOLD_MINUTES = 15;

function parseScheduleTime(timeStr: string): {
  weekday: string;
  hours: number;
  minutes: number;
} {
  const parts = timeStr.split(" ");
  if (parts.length === 2) {
    const weekday = parts[0]!;
    const [hours, minutes] = parts[1]!.split(":").map(Number);
    return { weekday, hours: hours!, minutes: minutes! };
  }

  const [hours, minutes] = timeStr.split(":").map(Number);
  return { weekday: "Monday", hours: hours!, minutes: minutes! };
}

function toMinutes(time: { hours: number; minutes: number }) {
  return time.hours * 60 + time.minutes;
}

function canMergeScheduleItems(current: CalendarScheduleItem, next: CalendarScheduleItem) {
  const currentStart = parseScheduleTime(current.start);
  const currentEnd = parseScheduleTime(current.end);
  const nextStart = parseScheduleTime(next.start);

  if (currentStart.weekday !== nextStart.weekday) return false;
  if (current.courseName !== next.courseName) return false;
  if (current.teacher !== next.teacher) return false;
  if (current.type !== next.type) return false;
  if (current.location !== next.location) return false;
  if (current.isOnline !== next.isOnline) return false;

  const gap = toMinutes(nextStart) - toMinutes(currentEnd);
  return gap >= 0 && gap <= SLOT_BREAK_THRESHOLD_MINUTES;
}

export function mergeAdjacentScheduleItems(items: CalendarScheduleItem[]): CalendarScheduleItem[] {
  if (items.length < 2) return items;

  const sortedItems = [...items].sort((a, b) => {
    const aStart = parseScheduleTime(a.start);
    const bStart = parseScheduleTime(b.start);
    const aWeekdayIndex = WEEK_DAY_ORDER.indexOf(aStart.weekday);
    const bWeekdayIndex = WEEK_DAY_ORDER.indexOf(bStart.weekday);
    const weekdayDiff =
      (aWeekdayIndex === -1 ? 99 : aWeekdayIndex) - (bWeekdayIndex === -1 ? 99 : bWeekdayIndex);

    if (weekdayDiff !== 0) return weekdayDiff;
    return toMinutes(aStart) - toMinutes(bStart);
  });

  const merged: CalendarScheduleItem[] = [];

  for (const item of sortedItems) {
    const previous = merged[merged.length - 1];

    if (!previous || !canMergeScheduleItems(previous, item)) {
      merged.push({ ...item });
      continue;
    }

    previous.end = item.end;
  }

  return merged;
}

export function normalizeScheduleFilters(
  filters?: Partial<ScheduleFilters> | null,
): ScheduleFilters {
  return {
    eventTypes: {
      ...DEFAULT_SCHEDULE_FILTERS.eventTypes,
      ...filters?.eventTypes,
    },
    eventFormats: {
      ...DEFAULT_SCHEDULE_FILTERS.eventFormats,
      ...filters?.eventFormats,
    },
    combineAdjacentPairs:
      filters?.combineAdjacentPairs ?? DEFAULT_SCHEDULE_FILTERS.combineAdjacentPairs,
  };
}

function formatScheduleItem(item: CalendarScheduleItem): string {
  const start = extractTime(item.start);
  const end = extractTime(item.end);
  const typeLabel =
    item.type === "lecture" ? "Lecture" : item.type === "practice" ? "Practice" : "Class";
  const locationStr = item.isOnline ? "Online" : item.location;

  return [`<b>${start} – ${end}</b>  ${typeLabel}`, item.courseName, `📍 ${locationStr}`].join(
    "\n",
  );
}

export function getUniqueRooms(items: CalendarScheduleItem[]): string[] {
  const seen = new Set<string>();
  const rooms: string[] = [];
  for (const item of items) {
    if (!item.isOnline) {
      const code = extractRoomCode(item.location);
      if (code && !seen.has(code)) {
        seen.add(code);
        rooms.push(code);
      }
    }
  }
  return rooms;
}

export function applyScheduleFilters(
  items: CalendarScheduleItem[],
  filters: ScheduleFilters,
  excludedCourses: string[],
): CalendarScheduleItem[] {
  return items.filter((item) => {
    if (excludedCourses.includes(item.courseName)) {
      return false;
    }

    const isLearn = item.teacher.startsWith("https://learn");
    if (isLearn && !filters.eventTypes.learn) {
      return false;
    }
    if (!isLearn && item.type === "lecture" && !filters.eventTypes.lecture) {
      return false;
    }
    if (!isLearn && item.type === "practice" && !filters.eventTypes.practice) {
      return false;
    }

    if (item.isOnline && !filters.eventFormats.online) {
      return false;
    }
    if (!item.isOnline && !filters.eventFormats.offline) {
      return false;
    }

    return true;
  });
}

export function getScheduleForDay(
  items: CalendarScheduleItem[],
  dayName: string,
): CalendarScheduleItem[] {
  return items
    .filter((item) => item.start.startsWith(dayName))
    .sort((a, b) => extractTime(a.start).localeCompare(extractTime(b.start)));
}

export function buildScheduleMessage(
  items: CalendarScheduleItem[],
  date: Date,
  group: string,
): string {
  const dayName = getDayName(date);
  const dayItems = getScheduleForDay(items, dayName);

  const dateStr = date.toLocaleDateString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Almaty",
  });

  let msg = `📆 <b>Schedule — ${group}</b>\n${dateStr}\n\n`;

  if (dayItems.length === 0) {
    msg += "No classes.";
    return msg;
  }

  for (const item of dayItems) {
    msg += `${formatScheduleItem(item)}\n\n`;
  }

  return msg.trim();
}

export function buildTodayScheduleMessage(
  items: CalendarScheduleItem[],
  date: Date,
  group: string,
): string {
  const dayName = getDayName(date);
  const dayItems = getScheduleForDay(items, dayName);

  const dateStr = date.toLocaleDateString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Almaty",
  });

  let msg = `📆 <b>Schedule — ${group}</b>\n\n`;
  msg += `<b>Today</b>\n${dateStr}\n\n`;

  if (dayItems.length === 0) {
    msg += "No classes today.";
    return msg;
  }

  for (const item of dayItems) {
    msg += `${formatScheduleItem(item)}\n\n`;
  }

  return msg.trim();
}

export function buildWeeklyScheduleMessage(
  items: CalendarScheduleItem[],
  date: Date,
  group: string,
): string {
  const todayName = getDayName(date);
  const todayItems = getScheduleForDay(items, todayName);
  const orderedDays = WEEK_DAY_ORDER.filter((day) => day !== todayName);

  let msg = `📆 <b>Schedule — ${group}</b>\n\n`;

  msg += `<b>Today</b>\n`;
  if (todayItems.length === 0) {
    msg += "No classes today.\n\n";
  } else {
    for (const item of todayItems) {
      msg += `${formatScheduleItem(item)}\n\n`;
    }
  }

  msg += "<b>This week</b>\n";

  const sections: string[] = [];
  for (const dayName of orderedDays) {
    const dayItems = getScheduleForDay(items, dayName);
    if (dayItems.length === 0) {
      continue;
    }

    const lines = [`<b>${dayName}</b>`];
    for (const item of dayItems) {
      lines.push(formatScheduleItem(item));
    }

    sections.push(lines.join("\n"));
  }

  if (sections.length === 0) {
    msg += "No classes this week.";
  } else {
    msg += sections.join("\n\n");
  }

  return msg.trim();
}
