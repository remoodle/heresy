import { describe, expect, test } from "vitest";
import type { CourseGradeChanges } from "./grade-changes";
import { formatGradeChanges } from "./grade-changes";

describe("grades notifications", () => {
  test("formatGradeChanges: single", () => {
    const diffs: CourseGradeChanges[] = [
      {
        course_id: 1234,
        course_name: "Introduction to SRE | Meirmanova Aigul",
        changes: [
          {
            name: "Final exam documentation submission",
            max: 100,
            diff: [null, 100],
          },
        ],
      },
    ];

    expect(formatGradeChanges(diffs)).toMatchInlineSnapshot(`
      "Updated grades:

      📘 Introduction to SRE | Meirmanova Aigul:
        • Final exam documentation submission: <b>N/A → 100</b>
      "
    `);
  });

  test("formatGradeChanges: multiple courses and grades", () => {
    const diffs: CourseGradeChanges[] = [
      {
        course_id: 1,
        course_name: "Course 1",
        changes: [
          {
            name: "Midterm",
            max: 100,
            diff: [null, 100],
          },
        ],
      },
      {
        course_id: 2,
        course_name: "Course 2",
        changes: [
          {
            name: "Midterm",
            max: 100,
            diff: [null, 92.85714],
          },
          {
            name: "Endterm",
            max: 50,
            diff: [null, 23],
          },
        ],
      },
    ];

    expect(formatGradeChanges(diffs)).toMatchInlineSnapshot(`
      "Updated grades:
      
      📘 Course 1:
        • Midterm: <b>N/A → 100</b>

      📘 Course 2:
        • Midterm: <b>N/A → 92.86</b>
        • Endterm: <b>N/A → 23</b> (out of 50)
      "
    `);
  });
});
