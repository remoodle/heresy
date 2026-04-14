import type { ScheduleData } from "./types.d";
import { generateScheduleIcal, mergeAdjacentScheduleItems } from "../shared/ical";

type ScheduleItem = ScheduleData[string][number];

export function generateIcal(
  items: ScheduleItem[],
  now: Date = new Date(),
  options?: {
    combineAdjacentPairs?: boolean;
    rangeStart?: Date;
    rangeEnd?: Date;
  },
): string {
  const sourceItems = options?.combineAdjacentPairs ? mergeAdjacentScheduleItems(items) : items;

  return generateScheduleIcal(sourceItems, now, {
    eventTimeFormat: "local",
    rangeStart: options?.rangeStart,
    rangeEnd: options?.rangeEnd,
  });
}
