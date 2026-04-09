import { ConcurrencyLimitStrategy } from "@hatchet-dev/typescript-sdk";
import { db } from "../../db/index";
import { sentReminders } from "../../db/schema";
import { sendTelegramMessage } from "../../library/telegram";
import { hatchet } from "../hatchet-client";

type Reminder = {
  userId: number;
  eventId: string;
  triggeredAt: number;
};

type Input = {
  chatId: number;
  message: string;
  reminders?: Reminder[];
};

// One message at a time per chat, extras queue up (GROUP_ROUND_ROBIN = fair queuing across chats)
export const telegramSender = hatchet.task<Input>({
  name: "telegram-send-message",
  concurrency: {
    expression: "string(input.chatId)",
    maxRuns: 1,
    limitStrategy: ConcurrencyLimitStrategy.GROUP_ROUND_ROBIN,
  },
  fn: async (input, ctx) => {
    await sendTelegramMessage(input.chatId, input.message);

    if (input.reminders && input.reminders.length > 0) {
      await db
        .insert(sentReminders)
        .values(
          input.reminders.map((reminder) => ({
            ...reminder,
            triggeredAt: new Date(reminder.triggeredAt),
          })),
        )
        .onConflictDoNothing();
    }

    await ctx.logger.info("sent telegram reminder", {
      chatId: input.chatId,
      reminderCount: input.reminders?.length,
    });
  },
});
