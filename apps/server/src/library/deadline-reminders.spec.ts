import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { DeadlineEvent } from "@heresy/shared/moodle/deadlines";
import { trackDeadlineReminders } from "./deadline-reminders";

beforeEach(() => {
  vi.stubEnv("TZ", "UTC");
  vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));
});

describe("deadline reminders", () => {
  test("tracks reminders once the next threshold is reached", () => {
    const events: DeadlineEvent[] = [
      {
        uid: "event-1",
        summary: "Assignment 1 is due",
        timestampMs: Date.parse("2026-04-08T23:00:00Z"),
        courseName: "Research Methods and Tools",
      },
      {
        uid: "event-2",
        summary: "Practice 1 is due",
        timestampMs: Date.parse("2026-04-13T00:00:00Z"),
        courseName: "Computer Networks",
      },
    ];

    const reminders = trackDeadlineReminders(["PT6H", "PT12H", "P1D"], events, []);

    expect(reminders).toStrictEqual([
      {
        eventId: "event-1",
        triggeredAt: new Date("2026-04-08T12:00:00.000Z"),
      },
    ]);
  });

  test("does not create reminders before any threshold starts", () => {
    const events: DeadlineEvent[] = [
      {
        uid: "event-1",
        summary: "Assignment 1 is due",
        timestampMs: Date.parse("2026-04-09T00:01:00Z"),
        courseName: "Research Methods and Tools",
      },
    ];

    const reminders = trackDeadlineReminders(["PT12H"], events, []);

    expect(reminders).toStrictEqual([]);
  });

  test("does not recreate reminders already sent for the active threshold window", () => {
    const events: DeadlineEvent[] = [
      {
        uid: "event-1",
        summary: "Assignment 1 is due",
        timestampMs: Date.parse("2026-04-08T23:00:00Z"),
        courseName: "Research Methods and Tools",
      },
    ];

    const reminders = trackDeadlineReminders(["PT12H"], events, [
      {
        eventId: "event-1",
        triggeredAt: new Date("2026-04-08T11:30:00Z"),
      },
    ]);

    expect(reminders).toStrictEqual([]);
  });
});
