import type { UniversityConfig } from "./core/types";
import { formatGradeItem, renderBlocks } from "./core/grades";
import { formatDeadlinesList } from "./core/deadlines";
import { formatCoursesList } from "./core/courses";
import { formatAssignmentDetails } from "./core/assignments";

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
