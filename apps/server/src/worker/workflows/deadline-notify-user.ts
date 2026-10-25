import type { DeadlineEvent } from "@heresy/shared/moodle/deadlines";
import { database } from "../../db";
import { hatchet } from "../hatchet-client";
import { telegramNotify } from "../telegram-notify";

type Reminder = {
  eventId: string;
  triggeredAt: number;
};

type Input = {
  chatId: number;
  userId: number;
  events: DeadlineEvent[];
  reminders: Reminder[];
};

export const deadlineNotifyUser = hatchet.task<Input>({
  name: "deadline-notify-user",
  executionTimeout: "2m",
  fn: async (input, ctx) => {
    await telegramNotify.run({
      chatId: input.chatId,
      notification: { kind: "deadlines", events: input.events },
    });

    await database.sentNotifications.record(
      input.userId,
      input.reminders.map((reminder) => ({
        eventId: reminder.eventId,
        triggeredAt: new Date(reminder.triggeredAt),
      })),
    );

    await ctx.logger.info("notified user of deadlines", {
      chatId: input.chatId,
      reminderCount: input.reminders.length,
    });
  },
});
