import { sendTelegramMessage } from "../../library/telegram";
import { hatchet } from "../hatchet-client";

type Input = {
  chatId: number;
  message: string;
};

export const TELEGRAM_RATE_LIMIT_KEY = "telegram-global";

export const telegramSendMessage = hatchet.task<Input>({
  name: "telegram-send-message",
  rateLimits: [{ staticKey: TELEGRAM_RATE_LIMIT_KEY, units: 1 }],
  fn: async (input, ctx) => {
    await sendTelegramMessage(input.chatId, input.message);

    await ctx.logger.info("sent telegram message", { chatId: input.chatId });
  },
});
