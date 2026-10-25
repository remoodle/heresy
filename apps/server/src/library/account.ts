import { z } from "zod";
import { durationToMs } from "@heresy/shared/dates";
import { isValidDigestTime, normalizeDigestWeekdays } from "@heresy/shared/schedule/digest";
import { normalizeScheduleFilters, scheduleFiltersSchema } from "@heresy/shared/schedule/filters";
import { MAX_CLASS_REMINDER_MINUTES, MAX_THRESHOLDS } from "@heresy/shared/settings";
import { database } from "../db";
import type { UserWithSchedule } from "../db/repositories/users";
import { UserFacingError } from "./errors";

// What clients see of a user. The Moodle export URL works as a password, so it never leaves.
export function toAccount(user: UserWithSchedule) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    name: user.name,
    username: user.username,
    moodleConnected: !!user.moodleCalendarUrl,
    hasSchedule: user.hasSchedule,
    deadlinesEnabled: user.deadlinesEnabled,
    thresholds: user.thresholds,
    scheduleEnabled: user.scheduleEnabled,
    scheduleReminderOffset: user.scheduleReminderOffset,
    digestEnabled: user.digestEnabled,
    digestTime: user.digestTime,
    digestWeekdays: normalizeDigestWeekdays(user.digestWeekdays),
    excludedCourses: user.excludedCourses,
    scheduleFilters: normalizeScheduleFilters(user.scheduleFilters),
  };
}

export type Account = ReturnType<typeof toAccount>;

const classReminderOffsetSchema = z.iso.duration().refine((offset) => {
  const minutes = durationToMs(offset) / 60_000;

  return Number.isInteger(minutes) && minutes >= 1 && minutes <= MAX_CLASS_REMINDER_MINUTES;
});

export const accountSettingsSchema = z
  .object({
    deadlinesEnabled: z.boolean(),
    thresholds: z.array(z.iso.duration()).max(MAX_THRESHOLDS),
    scheduleEnabled: z.boolean(),
    scheduleReminderOffset: classReminderOffsetSchema,
    digestEnabled: z.boolean(),
    digestTime: z.string().refine(isValidDigestTime),
    digestWeekdays: z.array(z.int()).max(7).transform(normalizeDigestWeekdays),
    excludedCourses: z.array(z.string().max(500)).max(200),
    scheduleFilters: scheduleFiltersSchema,
  })
  .partial();

export async function updateSettings(
  user: UserWithSchedule,
  patch: z.output<typeof accountSettingsSchema>,
) {
  // Class reminders and the digest are built from the My DU schedule.
  if (!user.hasSchedule && (patch.scheduleEnabled || patch.digestEnabled)) {
    throw new UserFacingError("Connect My DU first.");
  }

  await database.users.update(user.id, patch);

  return toAccount({ ...user, ...patch });
}

export async function findAccount(userId: number) {
  const user = await database.users.findById(userId);

  return user ? toAccount(user) : null;
}
