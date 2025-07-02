import { Composer, InlineKeyboard } from "grammy";
import { createCallbackData } from "callback-data";
import { requestUnwrap, getAuthHeaders } from "../../library/hc";
import { uni } from "../../adapters";
import type { Context } from "../context";

export const composer = new Composer<Context>();

const feature = composer.chatType(["private", "group", "supergroup"]);

const refreshDeadlinesCallback = createCallbackData("refresh_deadlines", {
  type: String,
});

const keyboards = {
  deadlines: new InlineKeyboard()
    .text("Back ←", "back_to_menu")
    .text("Refresh", refreshDeadlinesCallback.pack({ type: "menu" })),

  singleDeadline: new InlineKeyboard().text(
    "Refresh",
    refreshDeadlinesCallback.pack({ type: "single" }),
  ),
};

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

feature.callbackQuery(refreshDeadlinesCallback.filter(), async (ctx) => {
  const data = refreshDeadlinesCallback.unpack(ctx.callbackQuery.data);

  const { type } = data;

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
