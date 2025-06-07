import type { MoodleCourse, MoodleEvent, MoodleGrade } from "@remoodle/types";

export interface University {
  getGrades(grades: MoodleGrade[], course: MoodleCourse): string;
  getDeadlines(deadlines: MoodleEvent[], short: boolean): string;
  getUniversityName(): string;
}
