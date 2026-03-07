import { Composer, InlineKeyboard } from "grammy";
import { requestUnwrap, getAuthHeaders } from "../helpers/hc";
import { uni } from "../../../library/university";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import {
  deadlinesCallback,
  backToMenuCallback,
  displayAllDeadlinesCallback,
} from "../callback-data";

export const composer = new Composer<Context>();

const feature = composer.chatType(["private", "group", "supergroup"]);

const keyboards = {
  deadlines: new InlineKeyboard()
    .text("Back ←", backToMenuCallback.pack({}))
    .text("Display all", displayAllDeadlinesCallback.pack({ type: "menu" })),

  minifyDeadlines: new InlineKeyboard()
    .text("Back ←", backToMenuCallback.pack({}))
    .text("Minify", deadlinesCallback.pack({ type: "menu" })),

  singleDeadline: new InlineKeyboard().text(
    "Display all",
    displayAllDeadlinesCallback.pack({ type: "single" }),
  ),

  minifySingleDeadline: new InlineKeyboard().text(
    "Minify",
    deadlinesCallback.pack({ type: "single" }),
  ),
};

function isShortDeadlineCommand(text: string) {
  return text.startsWith("/ds");
}

feature.command(["deadlines", "ds"], logHandle("deadlines"), async (ctx) => {
  const isShort = isShortDeadlineCommand(ctx.message.text);

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

  await ctx.reply(text, {
    reply_parameters: {
      message_id: ctx.message.message_id,
      allow_sending_without_reply: true,
    },
    reply_markup: keyboards.singleDeadline,
    parse_mode: "HTML",
  });
});

feature.callbackQuery(
  deadlinesCallback.filter(),
  logHandle("deadlines_callback"),
  async (ctx) => {
    const data = deadlinesCallback.unpack(ctx.callbackQuery.data);

    const { type } = data;

    const isShort = isShortDeadlineCommand(
      ctx.callbackQuery.message!.reply_to_message?.text || "",
    );

    const daysLimit = isShort
      ? uni.deadlinesDaysLimit.short
      : uni.deadlinesDaysLimit.default;

    const deadlines = await requestUnwrap((client) =>
      client.v2.deadlines.$get(
        { query: { daysLimit: daysLimit.toString() } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    const text = uni.getDeadlinesMessage(deadlines);

    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup:
        type === "menu" ? keyboards.deadlines : keyboards.singleDeadline,
    });
  },
);

feature.callbackQuery(
  displayAllDeadlinesCallback.filter(),
  logHandle("display_all_deadlines"),
  async (ctx) => {
    const data = displayAllDeadlinesCallback.unpack(ctx.callbackQuery.data);

    const { type } = data;

    const deadlines = await requestUnwrap((client) =>
      client.v2.deadlines.$get(
        { query: {} },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    const text = uni.getDeadlinesMessage(deadlines);

    const keyboard =
      type === "menu"
        ? keyboards.minifyDeadlines
        : keyboards.minifySingleDeadline;

    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  },
);

export { composer as deadlinesFeature };
