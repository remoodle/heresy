import type { MoodleGrade, MoodleEvent, MoodleCourse } from "@remoodle/types";
import type { University } from "./university";
import { formatUnixtimestamp } from "../utils";
import { getTimeLeft } from "@remoodle/utils";

export class NU implements University {
  getGrades(grades: MoodleGrade[], course: MoodleCourse): string {
    const getGradeText = (grade: MoodleGrade): string => {
      let text = "";
      if (!["category", "course"].includes(grade.itemtype)) {
        text += `${grade.itemname} → <b>${grade.graderaw !== null ? grade.graderaw?.toFixed(2) : "None"}</b>\n`;

        if (grade.itemname === "Attendance") {
          text += "\n";
        }
      }

      return text;
    };

    let message: string = `${course.fullname}\n\n`;

    grades.forEach((grade) => {
      message += `${getGradeText(grade)}`;
    });

    return message;
  }

  getDeadlines(deadlines: MoodleEvent[], short: boolean = false): string {
    if (!deadlines.length) {
      return (
        "You have no upcoming deadlines" +
        (short ? " in the next 2 days" : "") +
        " 🥰"
      );
    }

    const getDeadlineText = (deadline: MoodleEvent): string => {
      let text = "";
      deadline.timestart *= 1000;
      const timeleft = deadline.timestart - Date.now();
      const isFiring = timeleft / 60 / 60 / 1000 <= 3;
      const courseName = deadline.course.shortname;

      const date = formatUnixtimestamp(deadline.timestart);
      const timeLeft = `<b>${getTimeLeft(deadline.timestart)}</b>`;
      const deadlineName = deadline.name.replace(/ is due( to be graded)?/, "");

      text += isFiring ? "🔥  " : "📅  ";
      text += `<b>${deadlineName}</b>  |  ${courseName}  |  Date → ${date}  |  Time left → ${timeLeft}\n`;

      return text;
    };

    return (
      "Upcoming deadlines:\n\n" + deadlines.map(getDeadlineText).join("\n")
    );
  }

  getUniversityName(): string {
    return "Nazarbayev University";
  }
}
