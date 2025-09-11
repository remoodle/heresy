import { describe, expect, test, vi } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import type { IEvent } from "@remoodle/types";
import type { CourseDeadlineReminders } from "./deadline-reminders";
import {
  trackDeadlineReminders,
  formatDeadlineReminders,
} from "./deadline-reminders";

describe("deadlines notifications", () => {
  vi.setSystemTime(new Date("2024-09-15T12:24:00"));

  test("trackDeadlineReminders", () => {
    const events: IEvent[] = fromPartial([
      {
        data: {
          id: 515515,
          name: "Assignment 1 is due",
          timestart: 1726426740,
          course: {
            id: 4911,
            fullname: "Research Methods and Tools | Omirgaliyev Ruslan",
          },
        },
        reminders: {},
      },
      {
        data: {
          id: 515578,
          name: "practice 1 is due",
          timestart: 1726167600,
          course: {
            id: 4963,
            fullname: "Computer Networks | Akerke Auelbayeva",
          },
        },
        reminders: {},
      },
    ]);

    const diff: CourseDeadlineReminders[] = [
      {
        course_id: 4911,
        course_name: "Research Methods and Tools | Omirgaliyev Ruslan",
        reminders: [
          {
            event_id: 515515,
            event_name: "Assignment 1 is due",
            event_timestart: 1726426740,
            threshold: "12h",
          },
        ],
      },
    ];

    expect(trackDeadlineReminders(events, ["6h", "12h", "24h"])).toStrictEqual(
      diff,
    );
  });

  test("not started thresholds", () => {
    const events: IEvent[] = fromPartial([
      {
        data: {
          id: 515515,
          name: "Assignment 1 is due",
          timestart: 1726426740,
          course: {
            id: 4911,
            fullname: "Research Methods and Tools | Omirgaliyev Ruslan",
          },
        },
        reminders: {},
      },
    ]);

    const diff: CourseDeadlineReminders[] = [];

    expect(trackDeadlineReminders(events, ["6h"])).toStrictEqual(diff);
  });

  test("checked thresholds", () => {
    const events: IEvent[] = fromPartial([
      {
        data: {
          id: 515515,
          name: "Assignment 1 is due",
          course: {
            id: 4911,
            fullname: "Research Methods and Tools | Omirgaliyev Ruslan",
          },
        },
        reminders: {
          "12h": true,
        },
      },
    ]);

    const diff: CourseDeadlineReminders[] = [];

    expect(trackDeadlineReminders(events, ["12h"])).toStrictEqual(diff);
  });

  test("formatDeadlineReminders", () => {
    const diffs: CourseDeadlineReminders[] = [
      {
        course_id: 515515,
        course_name: "Research Methods and Tools | Omirgaliyev Ruslan",
        reminders: [
          {
            event_id: 1,
            event_name: "Assignment 1 is due",
            event_timestart: 1726426740,
            threshold: "12h",
          },
          {
            event_id: 2,
            event_name: "Assignment 2 is due",
            event_timestart: 1726426740,
            threshold: "12h",
          },
        ],
      },
      {
        course_id: 515515,
        course_name: "Writing | Barak Omaba",
        reminders: [
          {
            event_id: 1,
            event_name: "Assignment 1 is due",
            event_timestart: 1726426740,
            threshold: "12h",
          },
        ],
      },
    ];

    expect(formatDeadlineReminders(diffs, () => "06:35:00"))
      .toMatchInlineSnapshot(`
      "🔔 Upcoming deadlines 🔔

      🗓 Research Methods and Tools | Omirgaliyev Ruslan
        • Assignment 1 is due: <b>06:35:00</b>, Sun, Sep 15, 2024, 23:59
        • Assignment 2 is due: <b>06:35:00</b>, Sun, Sep 15, 2024, 23:59

      🗓 Writing | Barak Omaba
        • Assignment 1 is due: <b>06:35:00</b>, Sun, Sep 15, 2024, 23:59

      "
    `);
  });
});
