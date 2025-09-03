import { db } from "../library/db";

export const deleteUser = async (userId: string) => {
  await db.user.deleteOne({ _id: userId });
  await db.course.deleteMany({ userId });
  await db.grade.deleteMany({ userId });
  await db.event.deleteMany({ userId });
};

export const getActiveUsers = async () => {
  const users = await db.user
    .find({ moodleId: { $exists: true }, health: { $gt: 0 } })
    .lean();

  return users.map((user) => ({ userId: user._id }));
};

export const deleteUserMoodleCourses = async (
  userId: string,
  moodleCourseIds: number[],
) => {
  await db.course.deleteMany({ moodleId: { $in: moodleCourseIds } });

  await db.grade.deleteMany({
    userId,
    courseId: { $in: moodleCourseIds },
  });
};
