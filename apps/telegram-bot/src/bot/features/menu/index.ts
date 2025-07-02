import { Composer } from "grammy";
import { config } from "../../../config";
import { requestUnwrap, getAuthHeaders } from "../../../library/hc";
import { uni } from "../../../adapters";
import type { Context } from "../../context";
import { createMainKeyboard, keyboards } from "../../keyboards";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

const aboutMessage = `
Bot Adapter: \`${uni.name}\`
Bot Version:  \`${config.version}\`
Source Code: https://github\\.com/remoodle/remoodle 

💬\\ **Community Chat**: @remoodle 

🫰\\ **Help us**: <3 @donateremoodle 

💁‍♂️\\ **More**: [Docs](https://ext\\.remoodle\\.app/docs) \\| [Privacy Policy](https://ext\\.remoodle\\.app/privacy\\-policy) \\| [Creators](https://remoodle.notion.site/Creators-1e4b62ac705f8034a7dac79161fd97ed)`;

const aboutOptions = {
  parse_mode: "MarkdownV2" as const,
  reply_markup: keyboards.others,
  link_preview_options: { is_disabled: true },
};

feature.command("about", async (ctx) => {
  await ctx.reply(aboutMessage, aboutOptions);
});

feature.callbackQuery("others", async (ctx) => {
  await ctx.editMessageText(aboutMessage, aboutOptions);
});

feature.callbackQuery("settings", async (ctx) => {
  await ctx.editMessageText("Settings", { reply_markup: keyboards.settings });
});

feature.callbackQuery("back_to_menu", async (ctx) => {
  const userId = ctx.from.id;

  const user = await requestUnwrap((client) =>
    client.v2.user.check.$get({}, { headers: getAuthHeaders(userId) }),
  );

  const { text, keyboard } = await createMainKeyboard(userId, user.name);

  await ctx.editMessageText(text, { reply_markup: keyboard });
});

feature.callbackQuery("remove_message", async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch {
    await ctx.editMessageText("✅ Cleared");
  }
});

export { composer as menuFeature };
