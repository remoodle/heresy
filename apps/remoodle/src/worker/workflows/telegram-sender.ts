import { ConcurrencyLimitStrategy } from "@hatchet-dev/typescript-sdk";
import { sendTelegramMessage } from "../../library/telegram";
import { hatchet } from "../hatchet-client";

type Input = {
  chatId: number;
  message: string;
};

// One message at a time per chat, extras queue up (GROUP_ROUND_ROBIN = fair queuing across chats)
export const telegramSender = hatchet.task<Input>({
  name: "telegram-send-message",
  concurrency: {
    expression: "input.chatId",
    maxRuns: 1,
    limitStrategy: ConcurrencyLimitStrategy.GROUP_ROUND_ROBIN,
  },
  fn: async (input) => {
    await sendTelegramMessage(input.chatId, input.message);
  },
});
