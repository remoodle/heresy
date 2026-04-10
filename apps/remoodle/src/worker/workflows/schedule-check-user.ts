import { fetchGroupSchedule } from "../../library/calendar-api";
import {
  buildScheduleMessage,
  getDayName,
  applyScheduleFilters,
  DEFAULT_SCHEDULE_FILTERS,
  mergeAdjacentScheduleItems,
  normalizeScheduleFilters,
  type ScheduleFilters,
} from "../../library/schedule";
import { hatchet } from "../hatchet-client";
import { telegramSendMessage } from "./telegram-send-message";

type Input = {
  telegramId: number;
  group: string;
  excludedCourses: string[];
  scheduleFilters: ScheduleFilters | null;
};

export const scheduleCheckUser = hatchet.task<Input>({
  name: "schedule-check-user",
  executionTimeout: "2m",
  fn: async (input, ctx) => {
    const allItems = await fetchGroupSchedule(input.group);
    const filters = normalizeScheduleFilters(input.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS);
    const filteredItems = applyScheduleFilters(allItems, filters, input.excludedCourses);
    const items = filters.combineAdjacentPairs
      ? mergeAdjacentScheduleItems(filteredItems)
      : filteredItems;

    // Send tomorrow's schedule (this workflow runs at 8pm)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayName = getDayName(tomorrow);
    const tomorrowItems = items.filter((item) => item.start.startsWith(dayName));

    if (tomorrowItems.length === 0) {
      await ctx.logger.info("no classes tomorrow, skipping notification", {
        telegramId: input.telegramId,
        group: input.group,
        day: dayName,
      });
      return;
    }

    const message = buildScheduleMessage(items, tomorrow, input.group);

    await telegramSendMessage.run({ chatId: input.telegramId, message });

    await ctx.logger.info("sent schedule notification", {
      telegramId: input.telegramId,
      group: input.group,
      day: dayName,
    });
  },
});
