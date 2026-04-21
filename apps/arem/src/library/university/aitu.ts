import type {
  MoodleGrade,
  MoodleCourse,
  MoodleEvent,
  MoodleAssignment,
} from "../../types";
import type { UniversityConfig, GradeBlock, CourseItem } from "./core/types";
import { formatGradeItem, renderBlocks } from "./core/grades";
import { formatDeadlinesList } from "./core/deadlines";
import { formatCoursesList } from "./core/courses";
import { formatAssignmentDetails } from "./core/assignments";

export function parseCourseFullname(fullname: string) {
  const lastPipeIndex = fullname.lastIndexOf("|");

  if (lastPipeIndex === -1) {
    return {
      courseName: fullname.trim(),
      teacher: null,
    };
  }

  return {
    courseName: fullname.substring(0, lastPipeIndex).trim(),
    teacher: fullname.substring(lastPipeIndex + 1).trim(),
  };
}

const formatCourseHeader = (course: MoodleCourse): string => {
  const { courseName, teacher } = parseCourseFullname(course.fullname);

  return `${courseName}\nTeacher: ${teacher}\n\n`;
};

const TOTAL_TO_GPA_THRESHOLDS = [
  { min: 95, gpa: 4.0 },
  { min: 90, gpa: 3.67 },
  { min: 85, gpa: 3.33 },
  { min: 80, gpa: 3.0 },
  { min: 75, gpa: 2.67 },
  { min: 70, gpa: 2.33 },
  { min: 65, gpa: 2.0 },
  { min: 60, gpa: 1.67 },
  { min: 55, gpa: 1.33 },
  { min: 50, gpa: 1.0 },
];

const calculateGPA = (total: number) => {
  const threshold = TOTAL_TO_GPA_THRESHOLDS.find((t) => total >= t.min);

  return threshold ? threshold.gpa : undefined;
};

const calculateTotalGrades = (grades: MoodleGrade[]): GradeBlock[] => {
  const blocks: GradeBlock[] = [];

  const getGrade = (name: string) =>
    grades.find((grade) => grade.itemname === name);

  const getGradeByIdNumber = (idnumber: string) =>
    grades.find((grade) => grade?.idnumber === idnumber);

  const total = getGradeByIdNumber("register");

  const regMid = getGrade("Register Midterm");
  const regEnd = getGrade("Register Endterm");

  if (total?.graderaw && total.graderaw !== 0) {
    const statusText =
      total.graderaw >= 90
        ? "High scholarship 🎉🎉"
        : total.graderaw >= 70
          ? "Scholarship 🎉"
          : total.graderaw >= 50
            ? "No scholarship 😭"
            : "Retake 💀";

    const gpa = calculateGPA(total.graderaw);

    blocks.push({
      type: "calculation",
      content: `${statusText}\nTOTAL  →  ${total.gradeformatted}\nGPA  →  ${
        gpa ?? "N/A"
      }`,
      priority: 1,
    });
  } else if (
    regMid?.graderaw &&
    regMid.graderaw !== 0 &&
    regEnd?.graderaw &&
    regEnd.graderaw !== 0
  ) {
    const regTerm = (regMid.graderaw + regEnd.graderaw) / 2;

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
          `${label}: ${
            unreachable
              ? `unreachable(${score.toFixed(1)})`
              : `final > ${score.toFixed(1)}`
          }`,
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

const DOCS = "https://ext.remoodle.app/docs";
const PRIVACY_POLICY = "https://ext.remoodle.app/privacy-policy";
const CREATORS = "https://ext.remoodle.app/creators";

const additionalInfo = `💬 <b>Community Chat:</b> @remoodle

🫰 <b>Help us:</b> &lt;3 @donateremoodle

💁‍♂️ <b>More:</b> <a href="${DOCS}">Docs</a> | <a href="${PRIVACY_POLICY}">Privacy Policy</a> | <a href="${CREATORS}">Creators</a>
`;

export const aitu: UniversityConfig = {
  name: "Astana IT University",

  additionalInfo,

  deadlinesDaysLimit: {
    default: 10,
    short: 2,
  },

  getCoursesMessage: (courses: MoodleCourse[]): CourseItem[] => {
    return formatCoursesList(courses, {
      getCourseName: (course) => {
        const { courseName } = parseCourseFullname(course.shortname);

        return `${courseName}`;
      },
    });
  },

  getGradesMessage: (grades: MoodleGrade[], course: MoodleCourse): string => {
    const blocks: GradeBlock[] = [];

    const calculationBlocks = calculateTotalGrades(grades);
    blocks.push(...calculationBlocks);

    if (calculationBlocks.length > 0) {
      blocks.push({
        type: "separator",
        content: "",
        priority: 2,
      });
    }

    grades.forEach((grade) => {
      const block = formatGradeItem(grade);

      if (block) {
        if (grade.itemname === "Attendance") {
          block.priority = 10;
          blocks.push(block);
        } else if (grade.itemname.startsWith("Register")) {
          block.priority = 5;
          blocks.push(block);
        } else {
          block.priority = 15;
          blocks.push(block);
        }
      }
    });

    const hasRegisterOrAttendance = grades.some(
      (grade) =>
        grade.itemname === "Attendance" ||
        grade.itemname.startsWith("Register"),
    );

    if (hasRegisterOrAttendance) {
      blocks.push({
        type: "separator",
        content: "",
        priority: 11,
      });
    }

    return formatCourseHeader(course) + renderBlocks(blocks);
  },

  getDeadlinesMessage: (
    deadlines: MoodleEvent[],
    short: false | number = false,
  ): string => {
    return formatDeadlinesList(deadlines, short, {
      getCourseName: (event) => {
        const { courseName } = parseCourseFullname(event.course.shortname);

        return courseName;
      },
      getDeadlineName: (event) => {
        return event.name.replace(/ is due( to be graded)?/, "");
      },
      fireThresholdHours: 3,
    });
  },

  getAssignmentMessage: (
    assignment: MoodleAssignment,
    course: MoodleCourse,
    grades?: MoodleGrade[],
  ): string => {
    return formatAssignmentDetails(assignment, course, grades);
  },
};
