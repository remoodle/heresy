import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { sentReminders, users } from "../../db/schema";
import { fetchCalendarEvents } from "../../library/calendar";
import { buildReminderMessage, trackDeadlineReminders } from "../../library/deadline-reminders";
import { hatchet } from "../hatchet-client";
import { telegramSender } from "./telegram-sender";

type Input = Record<string, never>;

type Output = {
  "check-deadlines": {
    processed: number;
    dispatched: number;
    failed: number;
  };
};

export const deadlineCheck = hatchet.workflow<Input, Output>({
  name: "deadline-check",
  onCrons: ["*/10 * * * *"],
});

deadlineCheck.task({
  name: "check-deadlines",
  executionTimeout: "5m",
  fn: async (_, ctx) => {
    ctx.logger.info("starting deadline check");

    const allUsers = await db.select().from(users);
    ctx.logger.info(`processing ${allUsers.length} users`);

    let dispatched = 0;
    let failed = 0;

    for (const user of allUsers) {
      try {
        const events = await fetchCalendarEvents(user.calendarUrl);
        const thresholds: string[] = JSON.parse(user.thresholds);

        if (thresholds.length === 0) continue;

        const existing = await db
          .select({ eventId: sentReminders.eventId, triggeredAt: sentReminders.triggeredAt })
          .from(sentReminders)
          .where(eq(sentReminders.userId, user.id));

        const existingMapped = existing.map((row) => ({
          eventId: row.eventId,
          triggeredAt: new Date(row.triggeredAt),
        }));

        const pending = trackDeadlineReminders(thresholds, events, existingMapped);

        if (pending.length === 0) continue;

        const message = buildReminderMessage(events, pending);

        await telegramSender.runNoWait({ chatId: user.telegramId, message });

        await db
          .insert(sentReminders)
          .values(
            pending.map((reminder) => ({
              userId: user.id,
              eventId: reminder.eventId,
              triggeredAt: reminder.triggeredAt,
            })),
          )
          .onConflictDoNothing();

        dispatched++;
        ctx.logger.info(`dispatched reminder for user ${user.telegramId}`);
      } catch (err) {
        ctx.logger.error(`failed to process user ${user.id}: ${err}`);
        failed++;
      }
    }

    ctx.logger.info(`deadline check complete — dispatched: ${dispatched}, failed: ${failed}`);
    return { processed: allUsers.length, dispatched, failed };
  },
});
