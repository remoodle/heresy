import { Composer } from "grammy";
import { config } from "../../../config";
import { uni } from "../../../library/university";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { createBackToMenuKeyboard } from "../keyboards/menu-keyboard";
import { aboutCallback } from "../callback-data";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

const REPO = "https://github.com/remoodle/heresy";

const ABOUT_MESSAGE = `
<b>Bot Adapter:</b> ${uni.name}
<b>Bot Version:</b> ${config.version}
<b>Source Code:</b> <a href="${REPO}">${REPO}</a>

${uni.additionalInfo ? `${uni.additionalInfo}\n` : ""}
`;

const ABOUT_MESSAGE_OPTIONS = {
  parse_mode: "HTML" as const,
  reply_markup: createBackToMenuKeyboard(),
  link_preview_options: { is_disabled: true },
};

feature.command("about", logHandle("about"), async (ctx) => {
  await ctx.reply(ABOUT_MESSAGE, ABOUT_MESSAGE_OPTIONS);
});

feature.callbackQuery(
  aboutCallback.filter(),
  logHandle("about_callback"),
  async (ctx) => {
    await ctx.editMessageText(ABOUT_MESSAGE, ABOUT_MESSAGE_OPTIONS);
  },
);

export { composer as aboutFeature };
