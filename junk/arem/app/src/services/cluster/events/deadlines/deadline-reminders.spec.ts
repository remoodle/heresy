import { beforeEach, describe, expect, test, vi } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import type { IEvent, IReminder } from "../../../../types";
import type { CourseDeadlineReminders } from "./deadline-reminders";
import {
  trackDeadlineReminders,
  formatCourseDeadlineReminders,
  getCourseDeadlineReminders,
} from "./deadline-reminders";

beforeEach(() => {
  vi.stubEnv("TZ", "Asia/Almaty");

  // Sun Sep 15 2024 12:00:00 GMT+0500 (GMT+05:00)
  vi.setSystemTime(new Date("2024-09-15T12:00:00"));
});

describe("deadlines notifications", () => {
  test("trackDeadlineReminders", () => {
    const events: IEvent[] = fromPartial([
      {
        _id: "event-1",
        userId: "user-1",
        data: {
          id: 515515,
          name: "Assignment 1 is due",
          timestart: 1726423200, // Sun Sep 15 2024 23:00:00 GMT+0500 (GMT+05:00)
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
          timestart: 1726167600, // Fri Sep 13 2024 00:00:00 GMT+0500 (GMT+05:00)
          course: {
            id: 4963,
            fullname: "Computer Networks | Akerke Auelbayeva",
          },
        },
      },
    ]);

    const reminders = trackDeadlineReminders(
      ["PT6H", "PT12H", "P1D"],
      events,
      [],
    );

    const expected: CourseDeadlineReminders[] = [
      {
        course_id: 4911,
        course_name: "Research Methods and Tools | Omirgaliyev Ruslan",
        reminders: [
          {
            event_id: 515515,
            event_name: "Assignment 1 is due",
            event_timestart: 1726423200,
            remaining: "PT11H",
          },
        ],
      },
    ];

    const diffs = getCourseDeadlineReminders(events, reminders);

    expect(diffs).toStrictEqual(expected);
  });

  test("trackDeadlineReminders with lower thresholds", () => {
    const events: IEvent[] = fromPartial([
      {
        _id: "event-1",
        userId: "user-1",
        data: {
          id: 515515,
          name: "Assignment 1 is due",
          timestart: 1726387200, // Sun Sep 15 2024 13:00:00 GMT+0500 (GMT+05:00)
          course: {
            id: 4911,
            fullname: "Research Methods and Tools | Omirgaliyev Ruslan",
          },
        },
      },
    ]);

    const reminders = trackDeadlineReminders(["PT1H"], events, []);

    const expected: CourseDeadlineReminders[] = [
      {
        course_id: 4911,
        course_name: "Research Methods and Tools | Omirgaliyev Ruslan",
        reminders: [
          {
            event_id: 515515,
            event_name: "Assignment 1 is due",
            event_timestart: 1726387200,
            remaining: "PT1H",
          },
        ],
      },
    ];

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

    const reminders = trackDeadlineReminders(["PT6H"], events, []);

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
      ["PT12H"],
      events,
      existingReminders,
    );

    const diffs = getCourseDeadlineReminders(events, reminders);

    expect(diffs).toStrictEqual([]);
  });

  test("formatCourseDeadlineReminders", () => {
    const diffs: CourseDeadlineReminders[] = [
      {
        course_id: 515515,
        course_name: "Research Methods and Tools | Omirgaliyev Ruslan",
        reminders: [
          {
            event_id: 1,
            event_name: "Assignment 1 is due",
            event_timestart: 1726423200, // Sun Sep 15 2024 23:00:00 GMT+0500 (GMT+05:00)
            remaining: "PT11H",
          },
          {
            event_id: 2,
            event_name: "Assignment 2 is due",
            event_timestart: 1726423200, // Sun Sep 15 2024 23:00:00 GMT+0500 (GMT+05:00)
            remaining: "PT11H",
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
            event_timestart: 1726423200, // Sun Sep 15 2024 23:00:00 GMT+0500 (GMT+05:00)
            remaining: "PT11H",
          },
        ],
      },
    ];

    expect(formatCourseDeadlineReminders(diffs)).toMatchInlineSnapshot(`
      "🔔 Upcoming deadlines 🔔

      🗓 Research Methods and Tools | Omirgaliyev Ruslan
        • Assignment 1 is due: <b>11:00:00</b>, Sun, Sep 15, 2024, 23:00
        • Assignment 2 is due: <b>11:00:00</b>, Sun, Sep 15, 2024, 23:00

      🗓 Writing | Barak Omaba
        • Assignment 1 is due: <b>11:00:00</b>, Sun, Sep 15, 2024, 23:00

      "
    `);
  });
});
