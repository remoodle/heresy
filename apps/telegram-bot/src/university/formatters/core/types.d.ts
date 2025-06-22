import type { MoodleGrade, MoodleEvent, MoodleCourse } from "@remoodle/types";

export type UniversityConfig = {
  name: string;
  getGradesMessage: (grades: MoodleGrade[], course: MoodleCourse) => string;
  getDeadlinesMessage: (deadlines: MoodleEvent[], short?: boolean) => string;
};

export type GradeBlock = {
  type: "header" | "calculation" | "grade" | "separator";
  content: string;
  priority?: number;
};
