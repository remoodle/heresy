import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { sentReminders } from "../../db/schema";
import { fetchCalendarEvents } from "../../library/calendar";
import { buildReminderMessage, trackDeadlineReminders } from "../../library/deadline-reminders";
import { hatchet } from "../hatchet-client";
import { telegramSender } from "./telegram-sender";

type Input = {
  userId: number;
  telegramId: number;
  calendarUrl: string;
  thresholds: string[];
};

export const deadlineCheckUser = hatchet.task<Input>({
  name: "deadline-check-user",
  executionTimeout: "2m",
  fn: async (input, ctx) => {
    if (input.thresholds.length === 0) {
      return;
    }

    const events = await fetchCalendarEvents(input.calendarUrl);

    const existing = await db
      .select({ eventId: sentReminders.eventId, triggeredAt: sentReminders.triggeredAt })
      .from(sentReminders)
      .where(eq(sentReminders.userId, input.userId));

    const existingMapped = existing.map((row) => ({
      eventId: row.eventId,
      triggeredAt: new Date(row.triggeredAt),
    }));

    const pending = trackDeadlineReminders(input.thresholds, events, existingMapped);

    if (pending.length === 0) {
      return;
    }

    const message = buildReminderMessage(events, pending);

    await ctx.logger.info("queueing reminder delivery", {
      userId: input.userId,
      telegramId: input.telegramId,
      reminderCount: pending.length,
    });

    await telegramSender.runNoWait({
      chatId: input.telegramId,
      message,
      reminders: pending.map((reminder) => ({
        userId: input.userId,
        eventId: reminder.eventId,
        triggeredAt: reminder.triggeredAt.getTime(),
      })),
    });
  },
});
