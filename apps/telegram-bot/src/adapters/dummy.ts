import type { UniversityConfig } from "./types";
import { formatGradeItem, renderBlocks } from "./formatters/grades";
import { formatDeadlinesList } from "./formatters/deadlines";
import { formatCoursesList } from "./formatters/courses";
import { formatAssignmentDetails } from "./formatters/assignments";

export const dummy: UniversityConfig = {
  name: "Dummy University",

  deadlinesDaysLimit: {
    default: 21,
    short: 2,
  },

  getCoursesMessage: (courses) => {
    return formatCoursesList(courses, {
      getCourseName: (course) => {
        return course.fullname;
      },
    });
  },

  getGradesMessage: (grades, course) => {
    const blocks = grades
      .map(formatGradeItem)
      .filter(Boolean)
      .map((block, index) => ({ ...block!, priority: index }));

    return `${course.fullname}\n\n` + renderBlocks(blocks);
  },

  getDeadlinesMessage: (deadlines, short = false) => {
    return formatDeadlinesList(deadlines, short);
  },

  getAssignmentMessage: (assignment, course, grades) => {
    return formatAssignmentDetails(assignment, course, grades);
  },
};
