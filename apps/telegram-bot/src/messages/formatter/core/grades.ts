import type { MoodleGrade } from "@remoodle/types";
import type { GradeBlock } from "./types";

export const formatGradeItem = (grade: MoodleGrade): GradeBlock | null => {
  if (["category", "course"].includes(grade.itemtype)) {
    return null;
  }

  const value = grade.graderaw !== null ? grade.graderaw?.toFixed(2) : "None";

  return {
    type: "grade",
    content: `${grade.itemname} → ${value}`,
  };
};

export const createSeparator = (): GradeBlock => ({
  type: "separator",
  content: "",
});

export const renderBlocks = (blocks: GradeBlock[]): string => {
  return blocks
    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
    .map((block) => block.content)
    .join("\n");
};
