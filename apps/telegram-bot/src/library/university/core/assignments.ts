import TurndownService from "turndown";
import type {
  MoodleAssignment,
  MoodleCourse,
  MoodleGrade,
} from "@remoodle/types";
import { formatDate } from "@remoodle/utils";

export type AssignmentFormatOptions = {
  maxIntroLength?: number;
  includeGrade?: boolean;
};

export const formatAssignmentDetails = (
  assignment: MoodleAssignment,
  course: MoodleCourse,
  grades?: MoodleGrade[],
  options: AssignmentFormatOptions = {},
): string => {
  const { maxIntroLength = 700, includeGrade = true } = options;

  let text = `*${assignment.name}*\n`;
  text += `*${course.fullname}*\n\n`;

  // Add dates if available
  if (assignment.duedate && assignment.allowsubmissionsfromdate) {
    text += `*Opened:* ${formatDate(assignment.allowsubmissionsfromdate * 1000)}\n`;
    text += `*Due:* ${formatDate(assignment.duedate * 1000)};\n`;
  }

  // Add grade if available and requested
  if (includeGrade && grades) {
    const grade = grades.find((g) => g.iteminstance === assignment.id);
    if (grade) {
      text += `*Grade:* ${grade.gradeformatted}%\n`;
    }
  }

  // Add intro text if available
  if (assignment.intro) {
    const turndownService = new TurndownService();
    turndownService.remove(["script", "img", "iframe"]);
    const markdownIntro = turndownService.turndown(assignment.intro);

    if (assignment.intro.length > maxIntroLength) {
      text += `\n${markdownIntro.slice(0, maxIntroLength)}...\n\n`;
    } else {
      text += `\n${markdownIntro}\n\n`;
    }
  }

  return text;
};
