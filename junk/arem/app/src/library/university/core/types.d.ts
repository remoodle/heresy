import type {
  MoodleGrade,
  MoodleEvent,
  MoodleCourse,
  MoodleAssignment,
} from "../../../types";

export type UniversityConfig = {
  name: string;
  additionalInfo?: string;
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
  getAssignmentMessage: (
    assignment: MoodleAssignment,
    course: MoodleCourse,
    grades?: MoodleGrade[],
  ) => string;
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
