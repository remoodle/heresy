import { z } from "zod";
import type { ScheduleItem } from "./items";

// The bot's per-user class filters, stored on the user row. The calendar's iCal
// subscriptions use `ScheduleFilter` from ./items instead.
const courseScheduleFiltersSchema = z.object({
  lecture: z.boolean(),
  practice: z.boolean(),
  online: z.boolean(),
  offline: z.boolean(),
});

export const scheduleFiltersSchema = z.object({
  eventTypes: z.object({ lecture: z.boolean(), practice: z.boolean(), learn: z.boolean() }),
  eventFormats: z.object({ online: z.boolean(), offline: z.boolean() }),
  courses: z.record(z.string().max(500), courseScheduleFiltersSchema).optional(),
  combineAdjacentPairs: z.boolean().optional(),
});

export type ScheduleFilters = z.infer<typeof scheduleFiltersSchema>;

export type CourseScheduleFilters = z.infer<typeof courseScheduleFiltersSchema>;

export const DEFAULT_COURSE_SCHEDULE_FILTERS: CourseScheduleFilters = {
  lecture: true,
  practice: true,
  online: true,
  offline: true,
};

export const DEFAULT_SCHEDULE_FILTERS: ScheduleFilters = {
  eventTypes: { lecture: true, practice: true, learn: true },
  eventFormats: { online: true, offline: true },
  combineAdjacentPairs: true,
};

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
    courses: filters?.courses ?? {},
    combineAdjacentPairs:
      filters?.combineAdjacentPairs ?? DEFAULT_SCHEDULE_FILTERS.combineAdjacentPairs,
  };
}

export function applyScheduleFilters<T extends ScheduleItem>(
  items: T[],
  filters: ScheduleFilters,
  excludedCourses: string[],
): T[] {
  return items.filter((item) => {
    if (excludedCourses.includes(item.courseName)) {
      return false;
    }

    const isLearn = item.teacher.startsWith("https://learn");

    if (isLearn && !filters.eventTypes.learn) {
      return false;
    }

    const course = filters.courses?.[item.courseName] ?? DEFAULT_COURSE_SCHEDULE_FILTERS;

    if (!isLearn && item.type === "lecture" && !course.lecture) {
      return false;
    }

    if (!isLearn && item.type === "practice" && !course.practice) {
      return false;
    }

    if (item.isOnline && !course.online) {
      return false;
    }

    if (!item.isOnline && !course.offline) {
      return false;
    }

    return true;
  });
}
