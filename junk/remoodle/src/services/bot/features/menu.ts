import { Composer } from "grammy";
import { requestUnwrap, getAuthHeaders } from "../helpers/hc";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { createMenuKeyboard } from "../keyboards/menu-keyboard";
import { backToMenuCallback } from "../callback-data";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.callbackQuery(
  backToMenuCallback.filter(),
  logHandle("back_to_menu"),
  async (ctx) => {
    const userId = ctx.from.id;

    const user = await requestUnwrap((client) =>
      client.v2.user.check.$get({}, { headers: getAuthHeaders(userId) }),
    );

    const { text, keyboard } = await createMenuKeyboard(userId, user.name);

    await ctx.editMessageText(text, { reply_markup: keyboard });
  },
);

feature.callbackQuery(
  "remove_message",
  logHandle("remove_message"),
  async (ctx) => {
    try {
      await ctx.deleteMessage();
    } catch {
      await ctx.editMessageText("✅ Cleared");
    }
  },
);

export { composer as menuFeature };
