import { db } from "../../db/index";
import { users } from "../../db/schema";
import { hatchet } from "../hatchet-client";
import { deadlineCheckUser } from "./deadline-check-user";

type Input = Record<string, never>;

type Output = {
  "check-deadlines": {
    dispatched: number;
  };
};

export const deadlineCheck = hatchet.workflow<Input, Output>({
  name: "deadline-check",
  onCrons: ["*/10 * * * *"],
});

deadlineCheck.task({
  name: "check-deadlines",
  executionTimeout: "1m",
  fn: async (_, ctx) => {
    const allUsers = await db.select().from(users);

    ctx.logger.info("spawning deadline checks", { count: allUsers.length });

    const childTasks = allUsers.map((user) => ({
      workflow: deadlineCheckUser.name,
      input: {
        userId: user.id,
        telegramId: user.telegramId,
        calendarUrl: user.calendarUrl,
        thresholds: user.thresholds,
      },
    }));

    await ctx.bulkRunNoWaitChildren(childTasks);

    return {
      dispatched: allUsers.length,
    };
  },
});
