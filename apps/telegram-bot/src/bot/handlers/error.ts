import { HTTPException } from "@remoodle/utils";
import type { ErrorHandler } from "grammy";
import type { Context } from "../context";

export const errorHandler: ErrorHandler<Context> = async (error) => {
  const { ctx } = error;

  if (error.error instanceof HTTPException) {
    if (error.error.status === 403) {
      await ctx.reply(
        "🔐 You are not connected to ReMoodle. Send /start to connect.",
      );
      return;
    } else {
      await ctx.reply("❌ An error occurred. Try again later.");
    }
  }

  console.error(error.error);
};
