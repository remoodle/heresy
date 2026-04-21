import TurndownService from "turndown";
import type {
  MoodleAssignment,
  MoodleCourse,
  MoodleGrade,
} from "../../../types/moodle";
import { formatDate, formatGrade } from "../../utils";

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
  // const { maxIntroLength = 700 } = options;  // deprecated due to web-scarping issues
  const { includeGrade = true } = options;

  let text = `*${assignment.name}*\n`;
  text += `*${course.fullname}*\n\n`;

  // Add dates if available
  // if (assignment.allowsubmissionsfromdate) {  // deprecated due to web-scarping issues
  //   text += `*Opened:* ${formatDate(assignment.allowsubmissionsfromdate * 1000)}\n`;
  // }
  if (assignment.duedate) {
    text += `*Due:* ${formatDate(assignment.duedate * 1000)};\n`;
  }

  // Add grade if available and requested
  if (includeGrade && grades) {
    const grade = grades.find((g) => g.iteminstance === assignment.id);
    if (grade) {
      text += `*Grade:* ${formatGrade(grade)}\n`;
    }
  }

  // Add intro text if available
  // deprecated due to web-scarping issues
  // if (assignment.intro) {
  //   const turndownService = new TurndownService();
  //   turndownService.remove(["script", "img", "iframe"]);
  //   const markdownIntro = turndownService.turndown(assignment.intro);
  //
  //   if (assignment.intro.length > maxIntroLength) {
  //     text += `\n${markdownIntro.slice(0, maxIntroLength)}...\n\n`;
  //   } else {
  //     text += `\n${markdownIntro}\n\n`;
  //   }
  // }

  return text;
};
