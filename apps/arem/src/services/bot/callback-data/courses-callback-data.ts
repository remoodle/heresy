import { createCallbackData } from "callback-data";

export const coursesListCallback = createCallbackData("courses", {});

export const inprogressCourseCallback = createCallbackData(
  "inprogress_course",
  { courseId: Number },
);

export const oldCourseCallback = createCallbackData("old_course", {
  page: Number,
});

export const pastCourseCallback = createCallbackData("past_course", {
  courseId: Number,
  page: Number,
});

export const courseAssignmentsCallback = createCallbackData(
  "course_assignments",
  { courseId: Number },
);

export const assignmentCallback = createCallbackData("assignment", {
  courseId: Number,
  assignmentId: Number,
});
