import type { MoodleCourse } from "../../../types/moodle";
import type { CourseItem } from "./types";

export interface CourseFormatOptions {
  getCourseName?: (course: MoodleCourse) => string;
}

export const formatCoursesList = (
  courses: MoodleCourse[],
  options: CourseFormatOptions = {},
): CourseItem[] => {
  const { getCourseName = (course) => course.shortname } = options;

  return courses.map((course) => ({
    id: course.id,
    name: getCourseName(course),
  }));
};
