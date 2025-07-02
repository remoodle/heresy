import type { Context, SessionFlavor } from "grammy";

export interface BotSession {
  auth?: {
    step: "awaiting_token";
  };
}

export type BotContext = Context & SessionFlavor<BotSession>;
