import type { Context as DefaultContext, SessionFlavor } from "grammy";

export interface BotSession {
  auth?: {
    step: "awaiting_token";
  };
}

export type Context = DefaultContext & SessionFlavor<BotSession>;
