import { Composer } from "grammy";
import { db } from "../../../library/db";
import { request, getAuthHeaders } from "../../../library/hc";
import type { BotContext } from "../../types";
import { createMainKeyboard, keyboards } from "../../keyboards";

export const composer = new Composer<BotContext>();

const feature = composer.chatType("private");

feature.command("start", async (ctx) => {
  const userId = ctx.from.id;

  const [user, error] = await request((client) =>
    client.v2.user.check.$get({}, { headers: getAuthHeaders(userId) }),
  );

  if (error && error.status !== 403) {
    await ctx.reply("An error occurred. Try again later.");
    return;
  }

  const token = ctx.message.text.split(" ")[1];

  if (token) {
    await handleRegistration(ctx, userId, token);
    return;
  }

  if (user) {
    if (user.health < 0 && token) {
      await handleRegistration(ctx, userId, token);
      return;
    }

    await showMainMenu(ctx, user.name, userId);
    return;
  }

  if (token === "connect") {
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

  await ctx.reply(
    "🌟 Welcome to ReMoodle!\n\n" +
      "Please send your Moodle token to connect your account.",
    { reply_markup: keyboards.findToken },
  );

  ctx.session.auth = { step: "awaiting_token" };
});

export async function handleToken(ctx: BotContext) {
  if (!ctx.message || !ctx.message.text || !ctx.from) {
    return;
  }

  const token = ctx.message.text.trim();

  await handleRegistration(ctx, ctx.from.id, token);
}

async function handleRegistration(
  ctx: BotContext,
  userId: number,
  token: string,
) {
  const [data, error] = await request((client) =>
    client.v2.auth.token.$post(
      { json: { moodleToken: token } },
      { headers: getAuthHeaders(userId) },
    ),
  );

  if (error) {
    ctx.session.auth = {
      step: "awaiting_token",
    };

    await ctx.reply(`❌ Invalid token\n\n` + `Error: ${error.message}`, {
      reply_markup: keyboards.findToken,
    });
    return;
  }

  ctx.session.auth = undefined;

  await ctx.reply("✅ Registration successful!");

  await showMainMenu(ctx, data.user.name, userId);
}

async function showMainMenu(ctx: BotContext, userName: string, userId: number) {
  const { text, keyboard } = await createMainKeyboard(userId, userName);

  return ctx.reply(text, { reply_markup: keyboard });
}

export { composer as welcomeFeature };
