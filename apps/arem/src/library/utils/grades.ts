import type { MoodleGrade } from "../../types/moodle";

export const formatGrade = (
  grade: [null, null, boolean] | [number, string, boolean] | MoodleGrade,
) => {
  const gradeValue: [null, null, boolean] | [number, string, boolean] =
    Array.isArray(grade)
      ? grade
      : [
          grade.graderaw!,
          grade.gradeformatted,
          grade.itemname !== "Attendance",
        ];

  const gradeFormatted =
    gradeValue[0] !== null ? gradeValue[1].replace(/\.0+$/, "") + "%" : "N/A";
  const gradeRaw =
    gradeValue[2] && gradeValue[0] && gradeValue[1] !== "100.00"
      ? gradeValue[0].toFixed(2).replace(/\.0+$/, "")
      : null;

  return `${gradeFormatted}${gradeRaw ? ` (${gradeRaw})` : ""}`;
};
