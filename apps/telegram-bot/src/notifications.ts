import { Api } from "grammy";
import {
  TELEGRAM_NOTIFY_TASK,
  TELEGRAM_RATE_LIMIT_KEY,
  type TelegramNotification,
} from "@heresy/shared/telegram-bot";
import { config } from "./config";
import { renderNotification } from "./format/notification";
import { hatchet } from "./hatchet-client";

const api = new Api(config.telegram.token);

// The server's worker runs this through a stub for every reminder and digest it decides to send.
export const telegramNotify = hatchet.task<TelegramNotification>({
  name: TELEGRAM_NOTIFY_TASK,
  rateLimits: [{ staticKey: TELEGRAM_RATE_LIMIT_KEY, units: 1 }],
  fn: async (input, ctx) => {
    const { text, keyboard } = renderNotification(input.notification);

    await api.sendMessage(input.chatId, text, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: keyboard,
    });

    await ctx.logger.info("sent notification", {
      chatId: input.chatId,
      kind: input.notification.kind,
    });
  },
});
