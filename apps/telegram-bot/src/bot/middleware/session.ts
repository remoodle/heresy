import { session } from "grammy";
import type { BotSession } from "../types";

export const sessionMiddleware = session({
  initial: (): BotSession => ({}),
  storage: undefined, // Use default memory storage
});
