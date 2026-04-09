import { fetchGroupSchedule } from "../../library/calendar-api";
import {
  buildScheduleMessage,
  getDayName,
  applyScheduleFilters,
  DEFAULT_SCHEDULE_FILTERS,
  type ScheduleFilters,
} from "../../library/schedule";
import { sendTelegramMessage } from "../../library/telegram";
import { hatchet } from "../hatchet-client";

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
    const filters = input.scheduleFilters ?? DEFAULT_SCHEDULE_FILTERS;
    const items = applyScheduleFilters(allItems, filters, input.excludedCourses);

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

    await sendTelegramMessage(input.telegramId, message);

    await ctx.logger.info("sent schedule notification", {
      telegramId: input.telegramId,
      group: input.group,
      day: dayName,
    });
  },
});
