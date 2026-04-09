import type { HydrateFlavor } from "@grammyjs/hydrate";
import type { Context as GrammyContext, SessionFlavor } from "grammy";

export type SessionData = {
  awaitingCalendarUrl?: boolean;
  awaitingRemoodleToken?: boolean;
};

export type Context = HydrateFlavor<GrammyContext & SessionFlavor<SessionData>>;
