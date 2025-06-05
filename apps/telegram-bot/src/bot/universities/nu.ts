import type { MoodleGrade, MoodleEvent, MoodleCourse } from "@remoodle/types";
import type { University } from "./university";
import { getAuthHeaders, request } from "../../library/hc";
import { formatUnixtimestamp } from "../utils";
import { getTimeLeft } from "@remoodle/utils";
import { config } from "../../config";

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

  getGPA(total: number): string {
    const grades: { [key: number]: number } = {
      100: 4.0,
      95: 4.0,
      90: 3.67,
      85: 3.33,
      80: 3.0,
      75: 2.67,
      70: 2.33,
      65: 2.0,
      60: 1.67,
      55: 1.33,
      50: 1.0,
    };

    const grade = Math.floor(total / 5) * 5;
    return grades[grade] ? grades[grade].toFixed(2) : "0.00";
  }

  getMiniAppUrl = async (
    userId: number,
    host: string,
    route: string = "",
  ): Promise<URL> => {
    const [loginResponse, err] = await request((client) => {
      return client.v2.auth.login.$post(
        {
          json: {},
        },
        {
          headers: getAuthHeaders(userId),
        },
      );
    });

    const webUrl = new URL(host + route);

    if (err) {
      return webUrl;
    }

    const b64 = btoa(JSON.stringify(loginResponse));

    webUrl.searchParams.set("usr", b64);
    webUrl.searchParams.set("api_url", config.backend.url);

    return webUrl;
  };

  getUniversityName(): string {
    return "Nazarbayev University";
  }
}
