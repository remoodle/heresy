import { Composer } from "grammy";
import { config } from "../../config";
import { uni } from "../../adapters";
import type { Context } from "../context";
import { createBackToMenuKeyboard } from "../keyboards/menu-keyboard";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

const ABOUT_MESSAGE = `
Bot Adapter: \`${uni.name}\`
Bot Version:  \`${config.version}\`
Source Code: https://github\\.com/remoodle/remoodle 

💬\\ **Community Chat**: @remoodle 

🫰\\ **Help us**: <3 @donateremoodle 

💁‍♂️\\ **More**: [Docs](https://ext\\.remoodle\\.app/docs) \\| [Privacy Policy](https://ext\\.remoodle\\.app/privacy\\-policy) \\| [Creators](https://remoodle.notion.site/Creators-1e4b62ac705f8034a7dac79161fd97ed)
`;

const ABOUT_MESSAGE_OPTIONS = {
  parse_mode: "MarkdownV2" as const,
  reply_markup: createBackToMenuKeyboard(),
  link_preview_options: { is_disabled: true },
};

feature.command("about", async (ctx) => {
  await ctx.reply(ABOUT_MESSAGE, ABOUT_MESSAGE_OPTIONS);
});

feature.callbackQuery("about", async (ctx) => {
  await ctx.editMessageText(ABOUT_MESSAGE, ABOUT_MESSAGE_OPTIONS);
});

export { composer as aboutFeature };
