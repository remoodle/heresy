import type { MoodleGrade } from "@remoodle/types";

export type GradeDiff = [null, number] | [number, number] | [number, null];

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

    const previous = oldGrade?.graderaw ?? null;
    const updated = newGrade.graderaw ?? null;

    if (
      (previous === null && updated === 0) ||
      (previous === 0 && updated === null)
    ) {
      continue;
    }

    if (previous === null && updated === null) {
      continue;
    }

    if (previous === updated) {
      continue;
    }

    const base = {
      name: newGrade.itemname,
      max: newGrade.grademax,
    };

    if (!previous && updated) {
      gradeChanges.push({
        ...base,
        diff: [null, updated],
      });
    }

    if (previous && updated) {
      gradeChanges.push({
        ...base,
        diff: [previous, updated],
      });
    }

    if (previous && !updated) {
      gradeChanges.push({
        ...base,
        diff: [previous, null],
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

const formatGrade = (num: number | null) => {
  if (num === null) {
    return "N/A";
  }
  return num.toFixed(2).replace(/\.0+$/, "");
};

const formatPostfix = (max: number) => {
  return max !== 100 ? ` (out of ${max})` : "";
};

export const formatGradeChanges = (data: CourseGradeChanges[]): string => {
  let message = "Updated grades:\n";

  for (const diff of data) {
    message += `\n📘 ${diff.course_name}:\n`;
    const gradeChanges = diff.changes;
    for (const change of gradeChanges) {
      const { name, diff, max } = change;
      message += `  • ${name}: <b>${formatGrade(diff[0])} → ${formatGrade(diff[1])}</b>${formatPostfix(max)}\n`;
    }
  }

  return message;
};
