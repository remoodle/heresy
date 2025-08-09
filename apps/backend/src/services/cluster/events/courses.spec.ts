import { describe, expect, test } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import type { ICourse } from "@remoodle/types";
import type { CourseChanges } from "./courses";
import { trackCourseChanges, formatCourseChanges } from "./courses";

describe("courses notifications", () => {
  test("trackCourseChanges: added, deleted, classification_changed", () => {
    const oldCourses: ICourse[] = fromPartial([
      {
        data: { id: 101, fullname: "Algebra" },
        classification: "inprogress",
        deleted: false,
      },
      {
        data: { id: 102, fullname: "Physics" },
        classification: "inprogress",
        deleted: false,
      },
      {
        data: { id: 103, fullname: "History" },
        classification: "inprogress",
        deleted: true,
      },
    ]);

    const newCourses: ICourse[] = fromPartial([
      // classification changed (inprogress -> past)
      {
        data: { id: 101, fullname: "Algebra" },
        classification: "past",
      },
      // newly added (not present before)
      {
        data: { id: 104, fullname: "Biology" },
        classification: "inprogress",
      },
      // previously marked as deleted -> considered added now
      {
        data: { id: 103, fullname: "History" },
        classification: "inprogress",
      },
    ]);

    const diff: CourseChanges = {
      changes: [
        {
          type: "classification_changed",
          course_id: 101,
          course_name: "Algebra",
          from_classification: "inprogress",
          to_classification: "past",
        },
        {
          type: "added",
          course_id: 104,
          course_name: "Biology",
          to_classification: "inprogress",
        },
        {
          type: "added",
          course_id: 103,
          course_name: "History",
          to_classification: "inprogress",
        },
        {
          type: "deleted",
          course_id: 102,
          course_name: "Physics",
          from_classification: "inprogress",
        },
      ],
    };

    expect(trackCourseChanges(oldCourses, newCourses)).toStrictEqual(diff);
  });

  test("formatCourseChanges: mixed changes", () => {
    const data: CourseChanges = {
      changes: [
        {
          type: "added",
          course_id: 1,
          course_name: "Biology",
          to_classification: "inprogress",
        },
        {
          type: "deleted",
          course_id: 2,
          course_name: "Physics",
          from_classification: "past",
        },
        {
          type: "classification_changed",
          course_id: 3,
          course_name: "Algebra",
          from_classification: "inprogress",
          to_classification: "past",
        },
      ],
    };

    expect(formatCourseChanges(data)).toMatchInlineSnapshot(`
      "Course updates:\n✅ New course: <b>Biology</b> (inprogress)\n🗑️ Course removed: <b>Physics</b>\n📋 Course status changed: <b>Algebra</b>\n  • inprogress → past"
    `);
  });

  test("formatCourseChanges: no changes", () => {
    const data: CourseChanges = { changes: [] };
    expect(formatCourseChanges(data)).toBe("");
  });
});
