import { Composer, InlineKeyboard } from "grammy";
import { db } from "../../../library/db";
import { request, getAuthHeaders } from "../helpers/hc";
import type { Context } from "../context";
import { createMenuKeyboard } from "../keyboards/menu-keyboard";
import { logHandle } from "../helpers/logging";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

const keyboards = {
  findCookies: new InlineKeyboard().url(
    "How to find your cookies",
    "https://ext.remoodle.app/find-cookies",
  ),
};

feature.command("start", logHandle("start"), async (ctx) => {
  const userId = ctx.from.id;

  const [user, error] = await request((client) =>
    client.v2.user.check.$get({}, { headers: getAuthHeaders(userId) }),
  );

  if (error && error.status !== 403) {
    await ctx.reply("An error occurred. Try again later.");
    return;
  }

  const startParam = ctx.message.text.split(" ")[1];

  if (startParam === "connect") {
    const { token: connectionToken, expiryDate } =
      await db.telegramToken.set(userId);

    await ctx.reply(
      `🔗 Your connection token: \`${connectionToken}\`\n\n` +
        `Enter this token in the web app to link your Telegram account.\n` +
        `⏰ Expires: ${expiryDate.toLocaleString()}`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // if (token) {
  //   await handleRegistration(ctx, userId, token);
  //   return;
  // }

  if (user) {
    // if (user.health < 0 && token) {
    //   await handleRegistration(ctx, userId, token);
    //   return;
    // }

    await showMainMenu(ctx, user.name, userId);
    return;
  }

  await ctx.reply(
    "🌟 Welcome to ReMoodle!\n\n" +
      "Please send your cookies from web extension to connect your account and then connect your Telegram account with oauth or OTP.",
    { reply_markup: keyboards.findCookies },
  );

  ctx.session.auth = { step: "awaiting_cookies" };
});

// export async function handleToken(ctx: Context) {
//   if (!ctx.message || !ctx.message.text || !ctx.from) {
//     return;
//   }
//
//   ctx.logger.info({ msg: "Handle token input" });
//
//   const token = ctx.message.text.trim();
//
//   await handleRegistration(ctx, ctx.from.id, token);
// }

// async function handleRegistration(ctx: Context, userId: number, token: string) {
//   const [data, error] = await request((client) =>
//     client.v2.auth.token.$post(
//       { json: { moodleToken: token } },
//       { headers: getAuthHeaders(userId) },
//     ),
//   );
//
//   if (error) {
//     ctx.session.auth = {
//       step: "awaiting_token",
//     };
//
//     await ctx.reply(`❌ Invalid token\n\n` + `Error: ${error.message}`, {
//       reply_markup: keyboards.findToken,
//     });
//     return;
//   }
//
//   ctx.session.auth = undefined;
//
//   await ctx.reply("✅ Registration successful!");
//
//   await showMainMenu(ctx, data.user.name, userId);
// }

async function showMainMenu(ctx: Context, userName: string, userId: number) {
  const { text, keyboard } = await createMenuKeyboard(userId, userName);

  return ctx.reply(text, { reply_markup: keyboard });
}

export { composer as welcomeFeature };
