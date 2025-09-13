import { describe, expect, test, vi } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import type { IEvent, IReminder } from "@remoodle/types";
import type { CourseDeadlineReminders } from "./deadline-reminders";
import {
  trackDeadlineReminders,
  formatDeadlineReminders,
  getCourseDeadlineReminders,
} from "./deadline-reminders";

describe("deadlines notifications", () => {
  vi.setSystemTime(new Date("2024-09-15T12:24:00"));

  test("trackDeadlineReminders", () => {
    const events: IEvent[] = fromPartial([
      {
        _id: "event-1",
        userId: "user-1",
        data: {
          id: 515515,
          name: "Assignment 1 is due",
          timestart: 1726426740,
          course: {
            id: 4911,
            fullname: "Research Methods and Tools | Omirgaliyev Ruslan",
          },
        },
      },
      {
        _id: "event-2",
        userId: "user-1",
        data: {
          id: 515578,
          name: "practice 1 is due",
          timestart: 1726167600,
          course: {
            id: 4963,
            fullname: "Computer Networks | Akerke Auelbayeva",
          },
        },
      },
    ]);

    const expected: CourseDeadlineReminders[] = [
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

    const reminders = trackDeadlineReminders(["6h", "12h", "24h"], events, []);
    const diffs = getCourseDeadlineReminders(events, reminders);

    expect(diffs).toStrictEqual(expected);
  });

  test("not started thresholds", () => {
    const events: IEvent[] = fromPartial([
      {
        _id: "event-1",
        userId: "user-1",
        data: {
          id: 515515,
          name: "Assignment 1 is due",
          timestart: 1726426740,
          course: {
            id: 4911,
            fullname: "Research Methods and Tools | Omirgaliyev Ruslan",
          },
        },
      },
    ]);

    const reminders = trackDeadlineReminders(["6h"], events, []);
    const diffs = getCourseDeadlineReminders(events, reminders);

    expect(diffs).toStrictEqual([]);
  });

  test("checked thresholds", () => {
    const events: IEvent[] = fromPartial([
      {
        _id: "event-1",
        userId: "user-1",
        data: {
          id: 515515,
          name: "Assignment 1 is due",
          timestart: 1726426740,
          course: {
            id: 4911,
            fullname: "Research Methods and Tools | Omirgaliyev Ruslan",
          },
        },
      },
    ]);

    const existingReminders: IReminder[] = fromPartial([
      {
        _id: "r-1",
        userId: "user-1",
        eventId: "event-1",
        triggeredAt: new Date(),
      },
    ]);

    const reminders = trackDeadlineReminders(
      ["12h"],
      events,
      existingReminders,
    );
    const diffs = getCourseDeadlineReminders(events, reminders);

    expect(diffs).toStrictEqual([]);
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
