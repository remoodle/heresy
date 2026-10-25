// Limits the bot's settings screens show and the API enforces.

export const DEFAULT_THRESHOLDS = ["P1D", "PT3H"];

export const MAX_THRESHOLDS = 10;

export const MAX_CLASS_REMINDER_MINUTES = 240;

export const AVAILABLE_THRESHOLDS = [
  "PT30M",
  "PT1H",
  "PT3H",
  "PT6H",
  "PT12H",
  "P1D",
  "P2D",
  "P1W",
] as const;
