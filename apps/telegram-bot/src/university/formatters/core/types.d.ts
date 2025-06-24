import type { MoodleGrade, MoodleEvent, MoodleCourse } from "@remoodle/types";

export type UniversityConfig = {
  name: string;
  deadlinesDaysLimit: {
    default: number;
    short: number;
  };
  getGradesMessage: (grades: MoodleGrade[], course: MoodleCourse) => string;
  getDeadlinesMessage: (
    deadlines: MoodleEvent[],
    short?: false | number,
  ) => string;
  getCoursesMessage: (courses: MoodleCourse[]) => CourseItem[];
};

export type GradeBlock = {
  type: "header" | "calculation" | "grade" | "separator";
  content: string;
  priority?: number;
};

export type CourseItem = {
  id: number;
  name: string;
};
