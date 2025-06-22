import type { MoodleGrade, MoodleCourse, MoodleEvent } from "@remoodle/types";
import type { UniversityConfig, GradeBlock } from "./core/types";
import { formatGradeItem, createSeparator, renderBlocks } from "./core/grades";
import { formatDeadlinesList } from "./core/deadlines";

const formatCourseHeader = (course: MoodleCourse): string => {
  const [courseName, teacher] = course.fullname.split(" | ");
  return `${courseName}\nTeacher: ${teacher}\n\n`;
};

const calculateGPA = (total: number): string => {
  const gradeMap: Record<number, number> = {
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

  return gradeMap[grade]?.toFixed(2) || "0.00";
};

const calculateTotalGrades = (grades: MoodleGrade[]): GradeBlock[] => {
  const getGrade = (name: string) =>
    grades.find((grade) => grade.itemname === name)?.graderaw ?? 0;

  const regFinal = getGrade("Register Final");
  const regMid = getGrade("Register Midterm");
  const regEnd = getGrade("Register Endterm");
  const regTerm = (regMid + regEnd) / 2;

  const blocks: GradeBlock[] = [];

  if (regFinal !== 0 && regTerm !== 0) {
    const totalGrade = getGrade("Total");
    const total =
      totalGrade === 0
        ? regFinal * 0.4 + regMid * 0.3 + regEnd * 0.3
        : totalGrade;

    let statusText = "";
    if (total >= 90) statusText = "High scholarship 🎉🎉";
    else if (total >= 70) statusText = "Scholarship 🎉";
    else if (total >= 50) statusText = "No scholarship 😭";
    else statusText = "Retake 💀";

    blocks.push({
      type: "calculation",
      content: `${statusText}\nTOTAL  →  ${total.toFixed(2)}\nGPA  →  ${calculateGPA(total)}`,
      priority: 1,
    });
  } else if (regTerm !== 0 && regFinal === 0) {
    const calculateTarget = (target: number) => (target - regTerm * 0.6) / 0.4;

    const targets = [
      {
        label: "👹 Avoid retake",
        score: Math.max(50, calculateTarget(50)),
      },
      {
        label: "💚 Save scholarship",
        score: Math.max(50, calculateTarget(70)),
      },
      {
        label: "😈 High scholarship",
        score: calculateTarget(90),
        unreachable: calculateTarget(90) > 100,
      },
    ];

    const targetText = targets
      .map(
        ({ label, score, unreachable }) =>
          `${label}: ${unreachable ? `unreachable(${score.toFixed(1)})` : `final > ${score.toFixed(1)}`}`,
      )
      .join("\n");

    blocks.push({
      type: "calculation",
      content: targetText,
      priority: 1,
    });
  }

  return blocks;
};

export const aitu: UniversityConfig = {
  name: "Astana IT University",

  deadlinesDaysLimit: {
    default: 21,
    short: 2,
  },

  getGradesMessage: (grades: MoodleGrade[], course: MoodleCourse): string => {
    const blocks: GradeBlock[] = [];

    blocks.push(...calculateTotalGrades(grades));

    grades.forEach((grade) => {
      const block = formatGradeItem(grade);

      if (block) {
        if (grade.itemname === "Attendance") {
          block.priority = 10;
          blocks.push(block, createSeparator());
        } else {
          block.priority = grade.itemname.startsWith("Register") ? 5 : 15;
          blocks.push(block);
        }
      }
    });

    return formatCourseHeader(course) + renderBlocks(blocks);
  },

  getDeadlinesMessage: (
    deadlines: MoodleEvent[],
    short: false | number = false,
  ): string => {
    return formatDeadlinesList(deadlines, short, {
      getCourseName: (event) => {
        const [courseName] = event.course.shortname.split(" | ");
        return courseName;
      },
      getDeadlineName: (event) => {
        return event.name.replace(/ is due( to be graded)?/, "");
      },
      fireThresholdHours: 3,
    });
  },
};
