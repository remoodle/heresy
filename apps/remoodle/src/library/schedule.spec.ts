import { describe, expect, test } from "vite-plus/test";
import {
  DEFAULT_SCHEDULE_FILTERS,
  buildNextWeekScheduleMessage,
  buildWeeklyScheduleMessage,
  getRemainingDaysOfWeek,
  getScheduleForDay,
  hasRemainingClassesThisWeek,
  mergeAdjacentScheduleItems,
  normalizeScheduleFilters,
} from "./schedule";

const sampleItems = [
  {
    id: "1",
    start: "Saturday 15:00",
    end: "Saturday 15:50",
    courseName: "Advanced Quality Assurance",
    location: "C1.3.362",
    isOnline: false,
    teacher: "Teacher",
    type: "practice" as const,
  },
  {
    id: "2",
    start: "Saturday 16:00",
    end: "Saturday 16:50",
    courseName: "Advanced Quality Assurance",
    location: "C1.3.362",
    isOnline: false,
    teacher: "Teacher",
    type: "practice" as const,
  },
  {
    id: "3",
    start: "Saturday 17:30",
    end: "Saturday 18:20",
    courseName: "Advanced Quality Assurance",
    location: "C1.3.362",
    isOnline: false,
    teacher: "Teacher",
    type: "practice" as const,
  },
];

const weeklyItems = [
  {
    id: "m1",
    start: "Monday 20:00",
    end: "Monday 21:50",
    courseName: "Software Development Case Study",
    location: "C1.3.370",
    isOnline: false,
    teacher: "Teacher",
    type: "lecture" as const,
  },
  {
    id: "f1",
    start: "Friday 18:00",
    end: "Friday 19:50",
    courseName: "Software Development Case Study",
    location: "C1.3.321",
    isOnline: false,
    teacher: "Teacher",
    type: "practice" as const,
  },
  {
    id: "s1",
    start: "Saturday 15:00",
    end: "Saturday 16:50",
    courseName: "Advanced Quality Assurance",
    location: "C1.3.362",
    isOnline: false,
    teacher: "Teacher",
    type: "practice" as const,
  },
];

describe("schedule merging", () => {
  test("merges back-to-back pairs with the same details", () => {
    expect(mergeAdjacentScheduleItems(sampleItems)).toStrictEqual([
      {
        ...sampleItems[0],
        end: "Saturday 16:50",
      },
      sampleItems[2],
    ]);
  });

  test("normalizes filters with merge enabled by default", () => {
    expect(DEFAULT_SCHEDULE_FILTERS.combineAdjacentPairs).toBe(true);
    expect(normalizeScheduleFilters(null).combineAdjacentPairs).toBe(true);
    expect(normalizeScheduleFilters({ combineAdjacentPairs: false }).combineAdjacentPairs).toBe(
      false,
    );
  });

  test("merged items still appear in the same day bucket", () => {
    const merged = mergeAdjacentScheduleItems(sampleItems);
    expect(getScheduleForDay(merged, "Saturday")).toHaveLength(2);
  });
});

describe("weekly schedule views", () => {
  test("only keeps days after today for this week", () => {
    expect(getRemainingDaysOfWeek(new Date("2026-04-11T10:00:00+05:00"))).toStrictEqual(["Sunday"]);
    expect(hasRemainingClassesThisWeek(weeklyItems, new Date("2026-04-11T10:00:00+05:00"))).toBe(
      false,
    );
  });

  test("this week message does not include earlier days", () => {
    const message = buildWeeklyScheduleMessage(
      weeklyItems,
      new Date("2026-04-11T10:00:00+05:00"),
      "CSE-2507M",
    );

    expect(message).toContain("<b>This week</b>");
    expect(message).toContain("No more classes this week.");
    expect(message).not.toContain("<b>Today</b>");
    expect(message).not.toContain("<b>Monday</b>");
    expect(message).not.toContain("<b>Friday</b>");
  });

  test("next week message shows the full recurring week", () => {
    const message = buildNextWeekScheduleMessage(
      weeklyItems,
      new Date("2026-04-11T10:00:00+05:00"),
      "CSE-2507M",
    );

    expect(message).toContain("<b>Next week</b>");
    expect(message).toContain("<b>Monday</b>");
    expect(message).toContain("<b>Friday</b>");
    expect(message).toContain("<b>Saturday</b>");
  });
});
