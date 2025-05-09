/* eslint-disable no-unused-vars */
import type { MoodleCourse, MoodleEvent, MoodleGrade } from "@remoodle/types";

export interface University {
  getGrades(grades: MoodleGrade[], course: MoodleCourse): string;
  getDeadlines(deadlines: MoodleEvent[], short: boolean): string;
  getGPA(total: number): string;
  getMiniAppUrl(userId: number, host: string, route: string): Promise<string>;
  getUniversityName(): string;
}
