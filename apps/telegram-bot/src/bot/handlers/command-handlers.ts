import { Context } from "grammy";
import { db } from "../../library/db";
import { request, getAuthHeaders } from "../../library/hc";
import keyboards from "./keyboards";
import type { RegistrationContext } from "..";
import { config } from "../../config";
import { uni } from "../universities";
import { getMiniAppUrl } from "../utils";

async function start(ctx: RegistrationContext) {
  if (!ctx.message || !ctx.message.text || !ctx.from || !ctx.chat) {
    return;
  }

  const userId = ctx.from.id;

  if (ctx.chat.type !== "private") {
    await ctx.reply("This method is not allowed in groups!");
    return;
  }

  const [user, error] = await request((client) =>
    client.v2.user.check.$get(
      {},
      {
        headers: getAuthHeaders(userId),
      },
    ),
  );

  const token = ctx.message.text.split(" ")[1];

  if (user && !error) {
    if (user.health < 0 && token) {
      await handleRegistration(ctx, userId, token);
      return;
    }

    const url = await getMiniAppUrl(userId, config.frontend.url);

    const keyboard = keyboards.main.clone().webApp("Website", url);

    await ctx.reply(`${user.name}`, {
      reply_markup: keyboard,
    });

    return;
  }

  if (token && token === "connect") {
    const { token, expiryDate } = await db.telegramToken.set(userId);
    return await ctx.reply(
      `Your connection token is: ${token}\n\nPlease enter this token in the app to connect your Telegram account. This token will expire on ${expiryDate.toLocaleString()}`,
    );
  }

  if (token) {
    return await handleRegistration(ctx, userId, token);
  }

  await ctx.reply(
    `Welcome to ReMoodle! ✨\nPlease send me your Moodle token to connect your Telegram account.`,
    { reply_markup: keyboards.find_token },
  );

  ctx.session.step = "awaiting_token";
}

async function handleToken(ctx: RegistrationContext) {
  if (!ctx.message || !ctx.message.text || !ctx.from) {
    return;
  }

  const userId = ctx.from.id;

  // Only proceed if we are awaiting the token
  if (ctx.session.step === "awaiting_token") {
    const token = ctx.message.text.trim();

    // Call the API to register the token
    await handleRegistration(ctx, userId, token);
  }
}

async function handleRegistration(
  ctx: RegistrationContext,
  userId: number,
  token: string,
) {
  const [data, error] = await request((client) =>
    client.v2.auth.token.$post(
      {
        json: {
          moodleToken: token,
        },
      },
      {
        headers: getAuthHeaders(userId),
      },
    ),
  );
  if (error) {
    // If the token is invalid, ask for the token again
    await ctx.reply("Your token is invalid. Please try again.");
    return;
  }

  // Registration successful, greet the user
  await ctx.reply(`You have registered successfully!`);

  const url = await getMiniAppUrl(userId, config.frontend.url);
  const keyboard = keyboards.main.clone().webApp("Website", url);

  await ctx.reply(`${data.user.name}`, {
    reply_markup: keyboard,
  });

  ctx.session.step = null;
}

async function deadlines(ctx: Context) {
  if (!ctx.message || !ctx.message.text || !ctx.from || !ctx.chat) {
    return;
  }

  if (ctx.chat.type === "group") {
    return await ctx.reply(
      "You are not connected to ReMoodle. Ask me in private chat.",
    );
  }

  const userId = ctx.from?.id;

  const short = ctx.message.text.startsWith("/ds");

  const daysLimit = short ? "2" : "21";

  const [data, error] = await request((client) =>
    client.v2.deadlines.$get(
      {
        query: {
          daysLimit,
        },
      },
      {
        headers: getAuthHeaders(userId),
      },
    ),
  );

  if (error && error.status === 401 && ctx.chat.type === "private") {
    return await ctx.reply(
      "You are not connected to ReMoodle. Send /start to connect.",
    );
  } else if (error) {
    await ctx.reply("An error occurred. Try again later.");
    return;
  }

  const text = uni.getDeadlines(data, short);

  if (ctx.chat.type === "private") {
    await ctx.reply(text, {
      reply_markup: short ? undefined : keyboards.single_deadline,
      parse_mode: "HTML",
    });
  } else {
    await ctx.reply(text, { parse_mode: "HTML" });
  }
}

async function about(ctx: Context) {
  await ctx.reply(
    "Here is some important information:\n\n" +
      "💬\\ **Community Chat**: @remoodle \n\n" +
      "⭐\\ **Give us a Star**: https://github\\.com/remoodle/remoodle \n\n" +
      "🫰\\ **Donate**: ReMoodle is absolutely free and we depend on your support to keep it running\\! Help us <3 @donateremoodle \n\n" +
      "💁‍♂️\\ **More**: [Docs](https://ext\\.remoodle\\.app/docs) \\| [Privacy Policy](https://ext\\.remoodle\\.app/privacy\\-policy) \\| [Creators](https://remoodle.notion.site/Creators-1e4b62ac705f8034a7dac79161fd97ed)",
    {
      parse_mode: "MarkdownV2",
      reply_markup: keyboards.others,
      link_preview_options: {
        is_disabled: true,
      },
    },
  );
}

const commands = {
  start: start,
  deadlines: deadlines,
  about: about,
};

export { commands, handleToken };
