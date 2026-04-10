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
};

export const DEFAULT_SCHEDULE_FILTERS: ScheduleFilters = {
  eventTypes: { lecture: true, practice: true, learn: true },
  eventFormats: { online: true, offline: true },
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
