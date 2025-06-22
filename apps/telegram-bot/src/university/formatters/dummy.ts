import type { UniversityConfig } from "./core/types";
import { formatGradeItem, renderBlocks } from "./core/grades";
import { formatDeadlinesList } from "./core/deadlines";

export const dummy: UniversityConfig = {
  name: "Dummy University",

  deadlinesDaysLimit: {
    default: 21,
    short: 2,
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
};
