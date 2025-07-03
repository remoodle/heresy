import type { ICourse, MoodleCourseClassification } from "@remoodle/types";

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
    oldCourses.map((course) => [course.data.id, course])
  );
  const newCoursesMap = new Map(
    newCourses.map((course) => [course.data.id, course])
  );

  // Check for new courses
  for (const newCourse of newCourses) {
    const oldCourse = oldCoursesMap.get(newCourse.data.id);
    
    if (!oldCourse || oldCourse.deleted) {
      changes.push({
        type: "added",
        course_id: newCourse.data.id,
        course_name: newCourse.data.fullname,
        to_classification: newCourse.classification,
      });
    } else if (oldCourse.classification !== newCourse.classification) {
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
    if (!oldCourse.deleted && !newCoursesMap.has(oldCourse.data.id)) {
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
  let message = "Course updates:\n";

  const { changes } = data;

  if (changes.length === 0) {
    return "";
  }

  for (const change of changes) {
    switch (change.type) {
      case "added":
        message += `\n✅ New course: <b>${change.course_name}</b> (${change.to_classification})\n`;
        break;
      case "deleted":
        message += `\n🗑️ Course removed: <b>${change.course_name}</b>\n`;
        break;
      case "classification_changed":
        const fromText = change.from_classification === "inprogress" ? "in progress" : change.from_classification;
        const toText = change.to_classification === "inprogress" ? "in progress" : change.to_classification;
        message += `\n📋 Course status changed: <b>${change.course_name}</b>\n  • ${fromText} → ${toText}\n`;
        break;
    }
  }

  return message;
}