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
  reminders: Reminder[];
};

// One message at a time per chat, extras queue up (GROUP_ROUND_ROBIN = fair queuing across chats)
export const telegramSender = hatchet.task<Input>({
  name: "telegram-send-message",
  concurrency: {
    expression: "string(input.chatId)",
    maxRuns: 1,
    limitStrategy: ConcurrencyLimitStrategy.GROUP_ROUND_ROBIN,
  },
  fn: async (input) => {
    await sendTelegramMessage(input.chatId, input.message);

    await db
      .insert(sentReminders)
      .values(input.reminders.map((r) => ({ ...r, triggeredAt: new Date(r.triggeredAt) })))
      .onConflictDoNothing();
  },
});
