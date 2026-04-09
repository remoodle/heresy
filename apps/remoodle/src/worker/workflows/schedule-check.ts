import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { hatchet } from "../hatchet-client";
import { scheduleCheckUser } from "./schedule-check-user";

type Input = Record<string, never>;

type Output = {
  "check-schedules": {
    dispatched: number;
  };
};

export const scheduleCheck = hatchet.workflow<Input, Output>({
  name: "schedule-check",
  onCrons: ["0 20 * * *"],
});

scheduleCheck.task({
  name: "check-schedules",
  executionTimeout: "1m",
  fn: async (_, ctx) => {
    const eligibleUsers = await db
      .select({
        telegramId: users.telegramId,
        group: users.group,
        excludedCourses: users.excludedCourses,
        scheduleFilters: users.scheduleFilters,
      })
      .from(users)
      .where(and(eq(users.scheduleEnabled, true), isNotNull(users.group)));

    if (eligibleUsers.length === 0) {
      await ctx.logger.info("no users with schedule notifications enabled");
      return { dispatched: 0 };
    }

    const childTasks = eligibleUsers.map((user) => ({
      workflow: scheduleCheckUser.name,
      input: {
        telegramId: user.telegramId,
        group: user.group!,
        excludedCourses: user.excludedCourses,
        scheduleFilters: user.scheduleFilters,
      },
      options: {
        key: String(user.telegramId),
      },
    }));

    await ctx.logger.info("dispatching schedule checks", {
      childCount: childTasks.length,
    });

    await ctx.bulkRunNoWaitChildren(childTasks);

    return { dispatched: childTasks.length };
  },
});
