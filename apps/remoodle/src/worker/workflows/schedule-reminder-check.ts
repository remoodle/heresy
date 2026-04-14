import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { hatchet } from "../hatchet-client";
import { scheduleReminderCheckUser } from "./schedule-reminder-check-user";

type Input = Record<string, never>;

type Output = {
  "check-schedule-reminders": {
    dispatched: number;
  };
};

export const scheduleReminderCheck = hatchet.workflow<Input, Output>({
  name: "schedule-reminder-check",
  onCrons: ["*/10 * * * *"],
});

scheduleReminderCheck.task({
  name: "check-schedule-reminders",
  executionTimeout: "1m",
  fn: async (_, ctx) => {
    const eligibleUsers = await db
      .select({
        id: users.id,
        telegramId: users.telegramId,
        group: users.group,
        excludedCourses: users.excludedCourses,
        scheduleFilters: users.scheduleFilters,
        scheduleReminderOffset: users.scheduleReminderOffset,
      })
      .from(users)
      .where(and(eq(users.scheduleEnabled, true), isNotNull(users.group)));

    if (eligibleUsers.length === 0) {
      await ctx.logger.info("no users with schedule notifications enabled");
      return { dispatched: 0 };
    }

    const childTasks = eligibleUsers.map((user) => ({
      workflow: scheduleReminderCheckUser.name,
      input: {
        userId: user.id,
        telegramId: user.telegramId,
        group: user.group!,
        excludedCourses: user.excludedCourses,
        scheduleFilters: user.scheduleFilters,
        scheduleReminderOffset: user.scheduleReminderOffset,
      },
      options: {
        key: String(user.telegramId),
      },
    }));

    await ctx.logger.info("dispatching schedule reminder checks", {
      childCount: childTasks.length,
    });

    await ctx.bulkRunNoWaitChildren(childTasks);

    return { dispatched: childTasks.length };
  },
});
