import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { DeadlineEvent } from "@heresy/shared/moodle/deadlines";
import { buildReminderMessage } from "./deadlines";

beforeEach(() => {
  vi.stubEnv("TZ", "UTC");
  vi.setSystemTime(new Date("2026-04-08T12:00:00Z"));
});

describe("deadline reminders", () => {
  test("formats reminder messages in due order", () => {
    const events: DeadlineEvent[] = [
      {
        uid: "event-1",
        summary: "Assignment 1 is due",
        timestampMs: Date.parse("2026-04-08T23:00:00Z"),
        courseName: "Research Methods and Tools",
      },
      {
        uid: "event-2",
        summary: "Assignment 2 is due",
        timestampMs: Date.parse("2026-04-09T01:00:00Z"),
        courseName: "Research Methods and Tools",
      },
      {
        uid: "event-3",
        summary: "Case Study Presentation is due",
        timestampMs: Date.parse("2026-04-08T13:30:00Z"),
        courseName: "Software Development Case Study",
      },
    ];

    expect(buildReminderMessage(events)).toMatchInlineSnapshot(`
      "<b>🔔 Deadline reminder</b>

      <b>Case Study Presentation</b>
      Software Development Case Study
      Wed, Apr 8, 13:30 · <b>1 hour, 30 min</b> left

      <b>Assignment 1</b>
      Research Methods and Tools
      Wed, Apr 8, 23:00 · <b>11 hours</b> left

      <b>Assignment 2</b>
      Research Methods and Tools
      Thu, Apr 9, 01:00 · <b>13 hours</b> left"
    `);
  });
});
