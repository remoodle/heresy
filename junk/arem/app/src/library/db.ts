import { createRedis, createMongo } from "../db";
import { config } from "../config";

const redis = createRedis(config.redis.uri);
const mongo = createMongo(config.mongo.uri);

export const db = {
  ...redis,
  ...mongo,
};

export const wrapper = {
  getActiveUsers: async () => {
    const users = await db.user
      .find({ moodleId: { $exists: true }, health: { $gt: 0 } })
      .lean();

    return users.map((user) => ({ userId: user._id }));
  },
  deleteUserMoodleCourses: async (
    userId: string,
    moodleCourseIds: number[],
  ) => {
    await db.course.deleteMany({ moodleId: { $in: moodleCourseIds } });
    await db.grade.deleteMany({ userId, courseId: { $in: moodleCourseIds } });
  },
  deleteUser: async (userId: string) => {
    await db.user.deleteOne({ _id: userId });
    await db.course.deleteMany({ userId });
    await db.grade.deleteMany({ userId });
    await db.event.deleteMany({ userId });
  },
};
