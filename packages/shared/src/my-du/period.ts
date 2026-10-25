import { Temporal } from "temporal-polyfill";
import { z } from "zod";

export const MY_DU_TERMS = [1, 2, 3, -1] as const;

// -1 is My DU's id for "Additional period 1".
export type MyDuTerm = (typeof MY_DU_TERMS)[number];

export type MyDuPeriod = { term: MyDuTerm; firstWeekStart: string };

// Accepts 2026-09-07 or 07.09.2026. Teaching week 1 always starts on a Monday.
export function parseFirstWeekStart(input: string) {
  const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(input.trim());

  try {
    const date = dotted
      ? Temporal.PlainDate.from(
          { year: Number(dotted[3]), month: Number(dotted[2]), day: Number(dotted[1]) },
          { overflow: "reject" },
        )
      : Temporal.PlainDate.from(input.trim(), { overflow: "reject" });

    return date.dayOfWeek === 1 ? date.toString() : null;
  } catch {
    return null;
  }
}

// The web API's version of what the bot asks step by step.
export const myDuPeriodSchema = z.object({
  term: z.literal(MY_DU_TERMS),
  firstWeekStart: z.string().transform((value, context) => {
    const monday = parseFirstWeekStart(value);

    if (!monday) {
      context.addIssue({ code: "custom", message: "Teaching week 1 must start on a Monday" });

      return z.NEVER;
    }

    return monday;
  }),
});

export const myDuConnectSchema = myDuPeriodSchema.extend({
  callbackUrl: z.string().trim().min(1).max(20_000),
});

// My DU names academic years after the calendar year they start in. Every period of a
// year starts between late August and the following summer, so August is the boundary.
export function studyYearOf(firstWeekStart: string) {
  const date = Temporal.PlainDate.from(firstWeekStart);

  return date.month >= 8 ? date.year : date.year - 1;
}
