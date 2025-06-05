import type { MoodleGrade, MoodleEvent, MoodleCourse } from "@remoodle/types";
import type { University } from "./university";
import { formatUnixtimestamp } from "../utils";
import { getTimeLeft } from "@remoodle/utils";
import { getAuthHeaders, request } from "../../library/hc";
import { config } from "../../config";

export class AITU implements University {
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

    let message: string = `${course.fullname.split(" | ")[0]}\nTeacher: ${course.fullname.split(" | ")[1]}\n\n`;

    message += `${this.calculateGrades(grades)}`;

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
      const [courseName, _] = deadline.course.shortname.split(" | ");

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

  private calculateGrades(grades: MoodleGrade[]): string {
    const getGPA = (total: number): string => {
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
    };

    const getGrade = (name: string) =>
      grades.find((grade) => grade.itemname === name)?.graderaw ?? 0;

    const regFinal = getGrade("Register Final");
    const regMid = getGrade("Register Midterm");
    const regEnd = getGrade("Register Endterm");
    const regTerm = (regMid + regEnd) / 2;

    if (regFinal !== 0 && regTerm !== 0) {
      const totalGrade = getGrade("Total");

      const total =
        totalGrade === 0
          ? regFinal * 0.4 + regMid * 0.3 + regEnd * 0.3
          : getGrade("Total");
      const text = `<b>TOTAL  →  ${total.toFixed(2)}</b>\n<b>GPA  →  ${getGPA(total)}</b>\n\n`;

      if (total >= 90) {
        return `High scholarship 🎉🎉\n${text}`;
      } else if (total >= 70) {
        return `Scholarship 🎉\n${text}`;
      } else if (total >= 50) {
        return `No scholarship 😭\n${text}`;
      } else {
        return `Retake 💀\n${text}`;
      }
    } else if (regTerm !== 0 && regFinal === 0) {
      const calculateTarget = (target: number) =>
        (target - regTerm * 0.6) / 0.4;

      const high = calculateTarget(90);
      const scholarship = calculateTarget(70);
      const retake = calculateTarget(50);

      return [
        `👹 Avoid retake: <b>final > ${retake <= 50.0 ? "50.0" : retake.toFixed(1)}</b>`,
        `💚 Save scholarship: <b>final > ${scholarship <= 50 ? "50.0" : scholarship.toFixed(1)}</b>`,
        `😈 High scholarship: ${high > 100 ? `<b>unreachable(${high.toFixed(1)})` : `<b>final > ${high.toFixed(1)}`}</b>`,
        `\n`,
      ].join("\n");
    }

    return "";
  }

  getUniversityName(): string {
    return "Astana IT University";
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
}
