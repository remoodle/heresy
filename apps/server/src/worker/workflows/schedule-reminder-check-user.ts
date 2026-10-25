import { database } from "../../db";
import { durationToMs } from "@heresy/shared/dates";
import {
  applyScheduleFilters,
  normalizeScheduleFilters,
  DEFAULT_SCHEDULE_FILTERS,
  type ScheduleFilters,
} from "@heresy/shared/schedule/filters";
import { mergeAdjacentScheduleItems } from "@heresy/shared/schedule/week";
import { hatchet } from "../hatchet-client";
import { notify } from "../notify";

type Input = {
  userId: number;
  telegramId: number;
  excludedCourses: string[];
  scheduleFilters: ScheduleFilters | null;
  scheduleReminderOffset: string;
};

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

function scheduleItemStartToMs(start: string): number | null {
  const value = Date.parse(start.replace(" ", "T") + "+05:00");

  return Number.isFinite(value) ? value : null;
}

function almatyDateStr(utcMs: number): string {
  const d = new Date(utcMs + ALMATY_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

export const scheduleReminderCheckUser = hatchet.task<Input>({
  name: "schedule-reminder-check-user",
  executionTimeout: "2m",
  fn: async (input, ctx) => {
    const offsetMs = durationToMs(input.scheduleReminderOffset);
    const now = new Date();
    const nowMs = now.getTime();
    const windowEndMs = nowMs + offsetMs;

    const allItems = await database.myDu.findSchedule(input.userId);
    const filters = normalizeScheduleFilters(input.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS);
    const filteredItems = applyScheduleFilters(allItems, filters, input.excludedCourses);

    const items = filters.combineAdjacentPairs
      ? mergeAdjacentScheduleItems(filteredItems)
      : filteredItems;

    // Find classes starting within the offset window
    const upcoming = items.flatMap((item) => {
      const startMs = scheduleItemStartToMs(item.start);

      if (startMs === null) return [];

      if (startMs <= nowMs || startMs > windowEndMs) return [];
      const dateStr = almatyDateStr(startMs);
      const eventId = `sched:${item.id}:${dateStr}`;

      return [{ item, startMs, eventId, minsUntil: Math.round((startMs - nowMs) / 60000) }];
    });

    if (upcoming.length === 0) {
      return;
    }

    // Check which ones we already sent
    const existingIds = new Set(
      (await database.sentNotifications.listByUserId(input.userId))
        .filter((r) => r.eventId.startsWith("sched:"))
        .map((r) => r.eventId),
    );

    const toSend = upcoming.filter((u) => !existingIds.has(u.eventId));

    if (toSend.length === 0) {
      return;
    }

    await notify({
      chatId: input.telegramId,
      notification: {
        kind: "classes",
        minutesUntil: toSend[0]!.minsUntil,
        items: toSend.map((u) => u.item),
      },
    });

    await database.sentNotifications.record(
      input.userId,
      toSend.map((u) => ({ eventId: u.eventId, triggeredAt: new Date() })),
    );

    await ctx.logger.info("sent schedule reminders", {
      telegramId: input.telegramId,
      count: toSend.length,
    });
  },
});
