import type { Context as GrammyContext, SessionFlavor } from "grammy";
import type { HydrateFlavor } from "@grammyjs/hydrate";

export type SessionData = {
  awaitingCalendarUrl?: boolean;
  awaitingRemoodleToken?: boolean;
};

export type Context = HydrateFlavor<GrammyContext & SessionFlavor<SessionData>>;
