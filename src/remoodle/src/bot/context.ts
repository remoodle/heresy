import type { Context as GrammyContext, SessionFlavor } from "grammy";
import type { HydrateFlavor } from "@grammyjs/hydrate";

export type SessionData = {
  awaitingCalendarUrl?: boolean;
};

export type Context = HydrateFlavor<GrammyContext & SessionFlavor<SessionData>>;
