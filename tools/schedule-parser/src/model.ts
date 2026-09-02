export type GroupScheduleItem = {
  id: string;
  start: string;
  end: string;
  courseName: string;
  location: string;
  isOnline: boolean;
  teacher: string;
  type: string | null;
};

type DuTime = {
  id: unknown;
  start: unknown;
  finish: unknown;
};

type DuDays = {
  days: unknown[];
  daysname: unknown[];
  time: DuTime[];
};

type DuLesson = {
  classtime_day: unknown;
  classtime_time: unknown;
  days: unknown;
  subject: unknown;
  room: unknown;
  tutor: unknown;
  lesson_type: unknown;
};

export function formatLesson(value: unknown): GroupScheduleItem | undefined {
  if (!isRecord(value)) return undefined;

  const lesson = value as DuLesson;
  const days = parseDays(lesson.days);
  if (!days) return undefined;

  const dayIndex = days.days.findIndex((day) => day === lesson.classtime_day);
  const weekDay = days.daysname[dayIndex];
  const time = days.time.find(
    (candidate) => candidate.id === lesson.classtime_time,
  );

  if (typeof weekDay !== "string" || !time) return undefined;
  if (typeof time.start !== "string" || typeof time.finish !== "string")
    return undefined;

  const room = stringValue(lesson.room);

  return {
    id: crypto.randomUUID(),
    start: `${weekDay} ${time.start}`,
    end: `${weekDay} ${time.finish}`,
    courseName: stringValue(lesson.subject),
    location: room,
    isOnline: room === "online",
    teacher: stringValue(lesson.tutor),
    type: typeof lesson.lesson_type === "string" ? lesson.lesson_type : null,
  };
}

function parseDays(value: unknown): DuDays | undefined {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!isRecord(parsed)) return undefined;
    if (!Array.isArray(parsed.days) || !Array.isArray(parsed.daysname))
      return undefined;
    if (!Array.isArray(parsed.time)) return undefined;

    return parsed as DuDays;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
