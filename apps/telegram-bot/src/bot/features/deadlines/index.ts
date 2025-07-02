import { Composer } from "grammy";
import { requestUnwrap, getAuthHeaders } from "../../../library/hc";
import { uni } from "../../../adapters";
import type { Context } from "../../context";
import { keyboards } from "../../keyboards";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command(["deadlines", "ds"], async (ctx) => {
  const isShort = ctx.message.text.startsWith("/ds");

  const daysLimit = isShort
    ? uni.deadlinesDaysLimit.short
    : uni.deadlinesDaysLimit.default;

  const data = await requestUnwrap((client) =>
    client.v2.deadlines.$get(
      { query: { daysLimit: daysLimit.toString() } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  const text = uni.getDeadlinesMessage(data, isShort ? daysLimit : false);

  const keyboard = isShort ? undefined : keyboards.singleDeadline;

  await ctx.reply(text, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });
});

feature.callbackQuery("deadlines", async (ctx) => {
  const deadlines = await requestUnwrap((client) =>
    client.v2.deadlines.$get(
      { query: {} },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  const text = uni.getDeadlinesMessage(deadlines);

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboards.deadlines,
  });
});

feature.callbackQuery(/^refresh_deadlines_(.+)/, async (ctx) => {
  const type = ctx.match[1];

  const deadlines = await requestUnwrap((client) =>
    client.v2.deadlines.$get(
      { query: {} },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  const text = uni.getDeadlinesMessage(deadlines);

  const keyboard =
    type === "menu" ? keyboards.deadlines : keyboards.singleDeadline;

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

export { composer as deadlinesFeature };
