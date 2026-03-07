import type { ICourse, MoodleCourseClassification } from "../../../../types";
import { partition } from "../../../../library/utils";

export type CourseChangeType = "added" | "deleted" | "classification_changed";

export type CourseChange = {
  type: CourseChangeType;
  course_id: number;
  course_name: string;
  from_classification?: MoodleCourseClassification;
  to_classification?: MoodleCourseClassification;
};

export type CourseChanges = {
  changes: CourseChange[];
};

export function trackCourseChanges(
  oldCourses: ICourse[],
  newCourses: ICourse[],
): CourseChanges {
  const changes: CourseChange[] = [];

  const oldCoursesMap = new Map(
    oldCourses.map((course) => [course.data.id, course]),
  );
  const newCoursesMap = new Map(
    newCourses.map((course) => [course.data.id, course]),
  );

  // Check for new courses
  for (const newCourse of newCourses) {
    const oldCourse = oldCoursesMap.get(newCourse.data.id);

    // Brand new course
    if (!oldCourse) {
      if (newCourse.classification !== "past") {
        changes.push({
          type: "added",
          course_id: newCourse.data.id,
          course_name: newCourse.data.fullname,
          to_classification: newCourse.classification,
        });
      }
      continue;
    }

    if (oldCourse.classification !== newCourse.classification) {
      // Check for classification changes (e.g., inprogress -> past)
      changes.push({
        type: "classification_changed",
        course_id: newCourse.data.id,
        course_name: newCourse.data.fullname,
        from_classification: oldCourse.classification,
        to_classification: newCourse.classification,
      });
    }
  }

  // Check for deleted courses
  for (const oldCourse of oldCourses) {
    if (!newCoursesMap.has(oldCourse.data.id)) {
      changes.push({
        type: "deleted",
        course_id: oldCourse.data.id,
        course_name: oldCourse.data.fullname,
        from_classification: oldCourse.classification,
      });
    }
  }

  return { changes };
}

export function formatCourseChanges(data: CourseChanges): string {
  const { changes } = data;

  if (changes.length === 0) {
    return "";
  }

  const grouped = partition(changes, (c) => c.type);

  const sectionsConfig: Array<{
    key: CourseChangeType;
    title: string;
    icon: string;
  }> = [
    { key: "added", title: "New courses", icon: "✅" },
    { key: "classification_changed", title: "Changed status", icon: "📋" },
    { key: "deleted", title: "Removed courses", icon: "🗑️" },
  ];

  const sections: string[] = [];

  for (const { key, title, icon } of sectionsConfig) {
    const items = (grouped[key] ?? []).map((c) => c.course_name);
    if (items.length > 0) {
      if (sections.length > 0) {
        sections.push("");
      }
      sections.push(`${icon} ${title}:`);
      sections.push(...items.map((name) => `- ${name}`));
    }
  }

  return sections.join("\n");
}
