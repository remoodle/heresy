import type { MoodleGrade } from "../../../../types";
import { formatGrade } from "../../../../library/utils";

export type GradeSubDiff = [null, null] | [number, string];
export type GradeDiff = [GradeSubDiff, GradeSubDiff];

export type GradeChange = {
  name: string;
  max: number;
  diff: GradeDiff;
};

export type CourseGradeChanges = {
  course_id: number;
  course_name: string;
  changes: GradeChange[];
};

export const trackCourseDiff = (
  oldGrades: MoodleGrade[],
  newGrades: MoodleGrade[],
): GradeChange[] => {
  const oldGradesMap = new Map(oldGrades.map((item) => [item.id, item]));

  const gradeChanges: GradeChange[] = [];

  for (const newGrade of newGrades) {
    if (!newGrade.itemname.trim()) {
      continue;
    }

    const oldGrade = oldGradesMap.get(newGrade.id);

    const previousRaw = oldGrade?.graderaw ?? null;
    const previousFormatted = oldGrade?.gradeformatted;
    const updatedRaw = newGrade.graderaw ?? null;
    const updatedFormatted = newGrade.gradeformatted;

    if (
      (previousRaw === null && updatedRaw === 0) ||
      (previousRaw === 0 && updatedRaw === null)
    ) {
      continue;
    }

    if (previousRaw === null && updatedRaw === null) {
      continue;
    }

    if (previousRaw === updatedRaw) {
      continue;
    }

    const base = {
      name: newGrade.itemname,
      max: newGrade.grademax,
    };

    if (!previousRaw && updatedRaw) {
      gradeChanges.push({
        ...base,
        diff: [
          [null, null],
          [updatedRaw, updatedFormatted],
        ],
      });
    }

    if (previousRaw && updatedRaw) {
      gradeChanges.push({
        ...base,
        diff: [
          [previousRaw, previousFormatted!],
          [updatedRaw, updatedFormatted],
        ],
      });
    }

    if (previousRaw && !updatedRaw) {
      gradeChanges.push({
        ...base,
        diff: [
          [previousRaw, previousFormatted!],
          [null, null],
        ],
      });
    }
  }

  return gradeChanges;
};

export const trackCourseGradeChanges = (
  courseId: number,
  courseName: string,
  oldGrades: MoodleGrade[],
  newGrades: MoodleGrade[],
): CourseGradeChanges => {
  return {
    course_id: courseId,
    course_name: courseName,
    changes: trackCourseDiff(oldGrades, newGrades),
  };
};

// const formatPostfix = (max: number) => {
//   return max !== 100 ? ` (out of ${max})` : "";
// };

export const formatGradeChanges = (data: CourseGradeChanges[]): string => {
  let message = "Updated grades:\n";

  for (const diff of data) {
    message += `\n📘 ${diff.course_name}:\n`;
    const gradeChanges = diff.changes;
    for (const change of gradeChanges) {
      const { name, diff } = change;
      const displayGradeRaw = name !== "Attendance";

      message += `  • ${name}: <b>${formatGrade([
        ...diff[0],
        displayGradeRaw,
      ])} → ${formatGrade([...diff[1], displayGradeRaw])}</b>\n`;
    }
  }

  return message;
};
