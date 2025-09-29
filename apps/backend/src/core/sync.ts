import type {
  IUser,
  MoodleCourse,
  MoodleCourseClassification,
} from "@remoodle/types";
import { Moodle } from "../library/moodle";
import { db, wrapper } from "../library/db";

const handleTokenError = async (error: { message: string }, user: IUser) => {
  if (error.message.includes("Invalid token")) {
    await db.user.updateOne(
      { _id: user._id },
      { $set: { health: user.health - 1 } },
    );
  }
};

const COURSE_ERRORS = ["error/notingroup", "Course or activity not accessible"];

const handleCourseError = async (
  error: { message: string },
  user: IUser,
  moodleCourseId: number,
) => {
  if (
    COURSE_ERRORS.some((courseError) => courseError.includes(error.message))
  ) {
    await db.course.updateOne(
      { userId: user._id, "data.id": moodleCourseId },
      { $set: { disabledAt: new Date() } },
    );
  }
};

export const syncEvents = async (userId: string) => {
  const user = await db.user.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const client = new Moodle({
    moodleUserId: user.moodleId,
    moodleAuthCookies: user.moodleAuthCookies,
    moodleSessionCookie: user.moodleSessionCookie,
    moodleSessionKey: user.moodleSessionKey,
  });

  const [response, error] = await client.call(
    "core_calendar_get_action_events_by_timesort",
    {
      timesortfrom: Math.floor(Date.now() / 1000 / 86400) * 86400,
    },
  );

  if (error) {
    await handleTokenError(error, user);
    throw new Error(`Failed to get events: ${error.message}`);
  }

  const filteredEvents = response.events.filter(
    (event) => event.component !== "mod_attendance",
  );

  for (const event of filteredEvents) {
    await db.event.findOneAndUpdate(
      { userId, "data.id": event.id },
      {
        $set: {
          data: event,
        },
      },
      { upsert: true },
    );
  }

  await db.event.deleteMany({
    userId,
    "data.id": { $nin: filteredEvents.map((event) => event.id) },
  });
};

// TODO: Add disabled courses reactivation policy, e.g., try to reset disabledAt after a week or so
export const syncCourses = async (
  userId: string,
  classification: MoodleCourseClassification[] = ["inprogress", "past"],
  trackDiff = false,
) => {
  const user = await db.user.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const userMoodleId = user.moodleId;

  const client = new Moodle({
    moodleUserId: user.moodleId,
    moodleAuthCookies: user.moodleAuthCookies,
    moodleSessionCookie: user.moodleSessionCookie,
    moodleSessionKey: user.moodleSessionKey,
  });

  // Get existing courses before sync for change tracking
  const existingCourses = trackDiff
    ? await db.course.find({ userId, userMoodleId }).lean()
    : [];

  const courses: {
    data: MoodleCourse;
    classification: MoodleCourseClassification;
  }[] = [];

  for (const variant of classification) {
    const [response, error] = await client.call(
      "core_course_get_enrolled_courses_by_timeline_classification",
      { classification: variant },
    );

    if (error) {
      await handleTokenError(error, user);
      throw new Error(`Failed to get ${variant} courses: ${error.message}`);
    }

    courses.push(
      ...response.courses.map((course) => ({
        data: course,
        classification: variant,
      })),
    );
  }

  for (const course of courses) {
    await db.course.findOneAndUpdate(
      { userId, userMoodleId, "data.id": course.data.id },
      {
        userId,
        userMoodleId,
        data: course.data,
        classification: course.classification,
      },
      { upsert: true },
    );
  }

  // find courses to delete (not present in the latest sync)
  const coursesToDelete = await db.course
    .find(
      {
        userId,
        userMoodleId,
        "data.id": { $nin: courses.map((course) => course.data.id) },
      },
      { _id: 1, "data.id": 1 },
    )
    .lean();

  const moodleCourseIdsToDelete = coursesToDelete.map((c) => c.data.id);

  await wrapper.deleteUserMoodleCourses(userId, moodleCourseIdsToDelete);

  if (trackDiff && existingCourses.length > 0) {
    // Get updated courses after sync
    const updatedCourses = await db.course
      .find({ userId, userMoodleId })
      .lean();

    return {
      existingCourses,
      updatedCourses,
    };
  }
};

export const syncCourseGrades = async (
  userId: string,
  courseId: number,
  trackDiff: boolean,
) => {
  const user = await db.user.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const client = new Moodle({
    moodleUserId: user.moodleId,
    moodleAuthCookies: user.moodleAuthCookies,
    moodleSessionCookie: user.moodleSessionCookie,
    moodleSessionKey: user.moodleSessionKey,
  });

  const [response, error] = await client.call(
    "gradereport_user_get_grade_items",
    {
      userid: user.moodleId,
      courseid: courseId,
    },
  );

  if (error) {
    await handleTokenError(error, user);
    await handleCourseError(error, user, courseId);
    throw new Error(`Failed to get grades for ${courseId}: ${error.message}`);
  }

  const normalizedGrades = response.usergrades[0].gradeitems.filter(
    (grade) => grade.itemtype !== "course",
  );

  const currentGrades = await db.grade.find({
    userId,
    courseId,
    "data.id": {
      $in: normalizedGrades.map((grade) => grade.id),
    },
  });

  for (const grade of normalizedGrades) {
    await db.grade.findOneAndUpdate(
      { userId, "data.id": grade.id },
      {
        userId,
        courseId,
        data: grade,
      },
      { upsert: true },
    );
  }

  if (!currentGrades.length || !trackDiff) {
    return;
  }

  const updatedGrades = await db.grade.find({
    userId,
    courseId,
    "data.id": {
      $in: response.usergrades[0].gradeitems.map((grade) => grade.id),
    },
  });

  return {
    currentGradesData: currentGrades.map((grade) => grade.data),
    updatedGradesData: updatedGrades.map((grade) => grade.data),
  };
};
