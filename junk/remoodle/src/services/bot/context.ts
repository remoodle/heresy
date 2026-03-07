import type { Context as DefaultContext, SessionFlavor } from "grammy";
import type { HydrateFlavor } from "@grammyjs/hydrate";
import type { Logger } from "../../library/logger";

export interface SessionData {
  auth?: {
    step: "awaiting_cookies";
  };
}

interface ExtendedContextFlavor {
  logger: Logger;
}

export type Context = HydrateFlavor<
  DefaultContext & ExtendedContextFlavor & SessionFlavor<SessionData>
>;
