import { describe, expect, test } from "vite-plus/test";
import {
  DEFAULT_SCHEDULE_FILTERS,
  getScheduleForDay,
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
