import { describe, expect, test } from "vitest";
import { fromPartial } from "@total-typescript/shoehorn";
import type { ICourse } from "../../../../types";
import type { CourseChanges } from "./course-changes";
import { trackCourseChanges, formatCourseChanges } from "./course-changes";

describe("courses notifications", () => {
  test("trackCourseChanges: added, deleted, classification_changed", () => {
    const oldCourses: ICourse[] = fromPartial([
      {
        data: { id: 101, fullname: "Algebra" },
        classification: "inprogress",
      },
      {
        data: { id: 102, fullname: "Physics" },
        classification: "inprogress",
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
      "✅ New courses:
      - Biology

      📋 Changed status:
      - Algebra

      🗑️ Removed courses:
      - Physics"
    `);
  });

  test("formatCourseChanges: no changes", () => {
    const data: CourseChanges = { changes: [] };
    expect(formatCourseChanges(data)).toBe("");
  });

  test("trackCourseChanges: ignores added course if classification is past", () => {
    const oldCourses: ICourse[] = fromPartial([
      {
        data: { id: 201, fullname: "Existing" },
        classification: "inprogress",
      },
    ]);

    const newCourses: ICourse[] = fromPartial([
      {
        data: { id: 201, fullname: "Existing" },
        classification: "inprogress",
      },
      {
        data: { id: 202, fullname: "Old Stuff" },
        classification: "past",
      },
    ]);

    expect(trackCourseChanges(oldCourses, newCourses)).toStrictEqual({
      changes: [],
    });
  });
});
