import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type {
  IUser,
  MoodleAssignment,
  MoodleCourse,
  MoodleEvent,
  MoodleGrade,
} from "../../../types";

import { config } from "../../../config";
import { db, wrapper } from "../../../library/db";
import { Moodle, MoodleAPIMultiSessionsError } from "../../../library/moodle";
import { logger } from "../../../library/logger";
import {
  hashPassword,
  verifyPassword,
  verifyTelegramData,
} from "../helpers/crypto";
import { zValidator } from "../helpers/zv";
import { issueTokens } from "../helpers/jwt";
import { createAlert } from "../helpers/alerts";
import { increaseUserCounter, decreaseUserCounter } from "../helpers/metrics";
import { syncUserData, notifyUserAddedAccount } from "../helpers/tasks";
import { defaultRules, rateLimiter } from "../middleware/ratelimit";
import { JSONHTTPException } from "../middleware/error";
import { authMiddleware } from "../middleware/auth";
import { errorHandler } from "../middleware/error";

const authRoutes = new Hono<{
  Variables: {
    telegramId?: number;
  };
}>()
  .use("*", authMiddleware(["Telegram"], false))
  .post(
    "/cookies",
    rateLimiter({
      ...defaultRules,
      windowMs: 1 * 60 * 60 * 1000, // 1 hour
      limit: 100,
    }),
    zValidator(
      "json",
      z.object({
        moodleAuthCookies: z
          .array(
            z.object({
              name: z.string(),
              value: z.string(),
            }),
          )
          .min(1)
          .refine(
            (arr) => {
              const names = arr.map((c) => c.name.trim().toLowerCase());
              return new Set(names).size === names.length;
            },
            { message: "Duplicate cookie names are not allowed" },
          ),
        telegramOtp: z.string(),
        msAccountId: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const { moodleAuthCookies, telegramOtp, msAccountId } =
        ctx.req.valid("json");

      const telegramId = await db.telegramToken.get(telegramOtp);

      if (!telegramId) {
        throw new HTTPException(400, { message: "Invalid or expired token" });
      }

      const moodleClient = new Moodle({ moodleAuthCookies });
      let moodleUserId: number,
        moodleSessionCookie: string,
        moodleSessionKey: string;

      try {
        ({
          userId: moodleUserId,
          moodleSessionCookie,
          moodleSessionKey,
        } = await moodleClient.authByCookies(msAccountId));
      } catch (error: MoodleAPIMultiSessionsError | any) {
        if (error instanceof MoodleAPIMultiSessionsError) {
          throw new JSONHTTPException(409, error.message, error.extra);
        }

        throw error;
      }

      await db.telegramToken.remove(telegramOtp);

      const student = await moodleClient.getStudentInfo();

      const currentUser = await db.user.findOne({ telegramId });

      const currentStudentUser = await db.user.findOne({ moodleUserId });

      let syncedUserId: string | undefined;
      let shouldSync: boolean = false;

      if (currentUser || currentStudentUser) {
        const userId = currentUser?._id ?? currentStudentUser?._id;

        await db.user.updateOne(
          { _id: userId },
          {
            $set: {
              name: student.fullname,
              username: student.username,
              moodleId: student.userId,
              moodleAuthCookies,
              moodleSessionCookie,
              moodleSessionKey,
              msAccountId,
              telegramId,
              health: 7,
            },
          },
        );

        if (currentUser && !currentStudentUser) {
          logger.api.info({
            msg: "student account changed",
            userId,
            currentUser,
            currentStudentUser,
          });

          await db.course.updateMany(
            { moodleId: currentUser.moodleId },
            { $set: { classification: "past" } },
          );

          shouldSync = true;
        }

        syncedUserId = userId;
      }

      if (!currentStudentUser && !currentUser) {
        try {
          const user = (await db.user.create({
            name: student.fullname,
            username: student.username,
            moodleId: student.userId,
            moodleAuthCookies,
            moodleSessionCookie,
            moodleSessionKey,
            msAccountId,
            ...(telegramId && { telegramId }),
          })) as IUser;

          const { _id: userId } = user;

          syncedUserId = userId;
          shouldSync = true;

          try {
            increaseUserCounter();

            await createAlert({
              event: "user.sync",
              data: { userId, telegramId, student },
            });
          } catch (error: any) {
            logger.api.error(error);
          }
        } catch (error: any) {
          throw new HTTPException(500, {
            message: "Failed to create user" + error,
          });
        }
      }

      if (shouldSync && syncedUserId) {
        await notifyUserAddedAccount(syncedUserId, student.fullname);

        try {
          await syncUserData(syncedUserId);
        } catch (error: any) {
          throw new HTTPException(500, {
            message: "Failed to sync data: " + error.message,
          });
        }
      }

      const user: IUser | null = await db.user.findOne({
        _id: syncedUserId,
      });

      if (!user) {
        throw new HTTPException(404, {
          message: "User not found",
        });
      }

      try {
        const { accessToken, refreshToken } = issueTokens(
          user._id,
          user.moodleId,
        );

        // TODO: Sanitize this properly
        user.password = "***";
        user.moodleAuthCookies = [];
        user.moodleSessionCookie = "***";
        user.moodleSessionKey = "***";

        // TODO: send user message about successful login

        return ctx.json({ user, accessToken, refreshToken });
      } catch (error: any) {
        throw new HTTPException(500, {
          message: error.message,
        });
      }
    },
  )
  .post(
    "/login",
    zValidator(
      "json",
      z.object({
        identifier: z.string().optional(),
        password: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const { identifier, password } = ctx.req.valid("json");

      const telegramId = ctx.get("telegramId");

      let user: IUser | null = null;

      if (telegramId) {
        user = await db.user.findOne({ telegramId });

        if (!user) {
          throw new HTTPException(401, { message: "User not found" });
        }
      } else {
        if (!password || !identifier) {
          throw new HTTPException(500, { message: "Arguments missing" });
        }

        user = await db.user.findOne({
          $or: [{ username: identifier }, { handle: identifier }],
        });

        if (!user) {
          throw new HTTPException(401, {
            message: "No user found with this username or handle",
          });
        }

        if (!user.password) {
          throw new HTTPException(401, {
            message: "Cannot login with this email",
          });
        }

        if (!verifyPassword(password, user.password)) {
          throw new HTTPException(401, { message: "Invalid credentials" });
        }
      }

      try {
        const { accessToken, refreshToken } = issueTokens(
          user._id.toString(),
          user.moodleId,
        );

        // TODO: Sanitize this properly
        user.password = "***";
        user.moodleAuthCookies = [];
        user.moodleSessionCookie = "***";
        user.moodleSessionKey = "***";

        return ctx.json({ user, accessToken, refreshToken });
      } catch (error: any) {
        throw new HTTPException(500, {
          message: error.message,
        });
      }
    },
  )
  .post(
    "/oauth/telegram/callback",
    zValidator(
      "json",
      z.object({
        id: z.number(),
        first_name: z.string(),
        last_name: z.string().optional(),
        username: z.string().optional(),
        photo_url: z.string().optional(),
        auth_date: z.number(),
        hash: z.string(),
      }),
    ),
    async (ctx) => {
      const telegramData = ctx.req.valid("json");

      if (!verifyTelegramData(telegramData)) {
        throw new HTTPException(400, {
          message: "Invalid Telegram data",
        });
      }

      const user: IUser | null = await db.user.findOne({
        telegramId: telegramData.id,
      });

      if (!user) {
        throw new HTTPException(401, {
          message: "User not found. Please register first.",
        });
      }

      const { accessToken, refreshToken } = issueTokens(
        user._id.toString(),
        user.moodleId,
      );

      // TODO: Sanitize this properly
      user.password = "***";
      user.moodleAuthCookies = [];
      user.moodleSessionCookie = "***";
      user.moodleSessionKey = "***";

      return ctx.json({ user, accessToken, refreshToken });
    },
  );

const userRoutes = new Hono<{
  Variables: {
    userId: string;
    telegramId: number;
  };
}>()
  .use("*", authMiddleware())
  .use("*", rateLimiter(defaultRules))
  .get(
    "/deadlines",
    zValidator(
      "query",
      z.object({
        courseId: z.string().optional(),
        daysLimit: z.string().optional(),
      }),
    ),
    async (ctx) => {
      const userId = ctx.get("userId");

      const { courseId, daysLimit } = ctx.req.valid("query");

      const events = await db.event
        .find({
          userId,
          ...(courseId && { "course.id": courseId }),
          "data.timestart": {
            $gt: Date.now() / 1000,
            ...(daysLimit && {
              $lte: Date.now() / 1000 + parseInt(daysLimit) * 24 * 60 * 60,
            }),
          },
        })
        .lean();

      if (!events.length) {
        const user = await db.user.findById(userId);

        if (!user) {
          throw new HTTPException(404, {
            message: "User not found",
          });
        }

        const client = new Moodle({
          moodleUserId: user.moodleId,
          moodleAuthCookies: user.moodleAuthCookies,
          moodleSessionCookie: user.moodleSessionCookie,
          moodleSessionKey: user.moodleSessionKey,
          msAccountId: user.msAccountId,
        });

        const [response, error] = await client.call(
          "core_calendar_get_action_events_by_timesort",
          {
            timesortfrom: Math.floor(Date.now() / 1000 / 86400) * 86400,
            ...(daysLimit && {
              timesortto: parseInt(daysLimit) * 86400,
            }),
          },
        );

        if (error) {
          throw new HTTPException(500, { message: error.message });
        }

        return ctx.json(response.events as MoodleEvent[]);
      }

      const sortedEvents = events.sort(
        (a, b) => a.data.timestart - b.data.timestart,
      );

      return ctx.json(sortedEvents.map((event) => event.data));
    },
  )
  .get(
    "/courses",
    zValidator(
      "query",
      z.object({
        status: Moodle.zCourseType.optional(),
      }),
    ),
    async (ctx) => {
      const { status } = ctx.req.valid("query");

      const userId = ctx.get("userId");

      const courses = await db.course.find({
        userId,
        ...(status && { classification: status }),
      });
      logger.api.debug(
        `User ${userId} has ${courses.length} courses in DB with status ${status}`,
      );

      if (!courses.length) {
        const user = await db.user.findById(userId);

        if (!user) {
          throw new HTTPException(404, {
            message: "User not found",
          });
        }

        const client = new Moodle({
          moodleUserId: user.moodleId,
          moodleAuthCookies: user.moodleAuthCookies,
          moodleSessionCookie: user.moodleSessionCookie,
          moodleSessionKey: user.moodleSessionKey,
          msAccountId: user.msAccountId,
        });

        const [response, error] = await client.call(
          "core_course_get_enrolled_courses_by_timeline_classification",
          { classification: status ?? "all" }, // NOTE: select specific classification from https://github.com/moodle/moodle/blob/a828ba12c1796bb6f22a705ad61202be5b26fab2/public/course/externallib.php#L4019-L4040
        );

        if (error) {
          throw new HTTPException(500, { message: error.message });
        }

        return ctx.json(response.courses as MoodleCourse[]);
      }

      return ctx.json(
        courses.map((course) => {
          return course.data;
        }),
      );
    },
  )
  .get(
    "/courses/overall",
    zValidator(
      "query",
      z.object({
        status: Moodle.zCourseType.optional(),
      }),
    ),
    async (ctx) => {
      const { status } = ctx.req.valid("query");

      const userId = ctx.get("userId");

      // TODO: MOVE TO WRAPPER
      const courses = await db.course.find({
        userId,
        ...(status && { classification: status }),
      });

      const grades = await db.grade.find({
        userId,
        courseId: { $in: courses.map((course) => course.data.id) },
      });

      return ctx.json(
        courses.map((course) => ({
          ...course.data,
          grades: grades
            .filter((grade) => grade.courseId === course.data.id)
            .map((grade) => grade.data),
        })),
      );
    },
  )
  .get(
    "/course/:courseId",
    zValidator(
      "query",
      z.object({
        content: z.string().optional().default("0"),
      }),
    ),
    async (ctx) => {
      const courseId = ctx.req.param("courseId");

      const { content } = ctx.req.valid("query");

      const userId = ctx.get("userId");

      const course = await db.course.findOne({
        userId,
        "data.id": parseInt(courseId),
      });

      if (!course) {
        throw new HTTPException(404, {
          message: "Course not found",
        });
      }

      if (content === "1") {
        const user = await db.user.findById(userId);

        if (!user) {
          throw new HTTPException(404, {
            message: "User not found",
          });
        }

        const client = new Moodle({
          moodleUserId: user.moodleId,
          moodleAuthCookies: user.moodleAuthCookies,
          moodleSessionCookie: user.moodleSessionCookie,
          moodleSessionKey: user.moodleSessionKey,
          msAccountId: user.msAccountId,
        });
        const [data, error] = await client.call("core_course_get_contents", {
          courseid: parseInt(courseId),
        });

        if (error) {
          throw error;
        }

        return ctx.json({
          ...course.data,
          content: data,
        });
      }

      return ctx.json(course.data);
    },
  )
  .get("/course/:courseId/assignments", async (ctx) => {
    const courseId = ctx.req.param("courseId");
    const userId = ctx.get("userId");

    const user = await db.user.findById(userId);

    if (!user) {
      throw new HTTPException(404, {
        message: "User not found",
      });
    }

    const client = new Moodle({
      moodleUserId: user.moodleId,
      moodleAuthCookies: user.moodleAuthCookies,
      moodleSessionCookie: user.moodleSessionCookie,
      moodleSessionKey: user.moodleSessionKey,
      msAccountId: user.msAccountId,
    });

    let response: MoodleAssignment[];

    try {
      response = await client.getAssignments({ courseId });
    } catch (error: any) {
      throw new HTTPException(500, { message: error.message });
    }

    return ctx.json(response);
  })
  .get("/course/:courseId/grades", async (ctx) => {
    const courseId = ctx.req.param("courseId");

    const userId = ctx.get("userId");

    const grades = await db.grade.find({
      userId,
      courseId: parseInt(courseId),
    });

    if (!grades.length) {
      const user = await db.user.findById(userId);

      if (!user) {
        throw new HTTPException(404, {
          message: "User not found",
        });
      }

      const client = new Moodle({
        moodleUserId: user.moodleId,
        moodleAuthCookies: user.moodleAuthCookies,
        moodleSessionCookie: user.moodleSessionCookie,
        moodleSessionKey: user.moodleSessionKey,
        msAccountId: user.msAccountId,
      });

      let response: MoodleGrade[];

      try {
        response = await client.getGrades({ courseId });
      } catch (error: any) {
        throw new HTTPException(500, { message: error.message });
      }

      return ctx.json(response);
    }

    return ctx.json(grades.map((grade) => grade.data));
  })
  .get("/user/settings", async (ctx) => {
    const userId = ctx.get("userId");

    const user = await db.user.findOne({ _id: userId });

    if (!user) {
      throw new HTTPException(401, {
        message: "User not found",
      });
    }

    return ctx.json({
      moodleId: user.moodleId,
      name: user.name,
      handle: user.handle,
      hasPassword: !!user.password,
      telegramId: user.telegramId,
      settings: user.settings,
    });
  })
  .post(
    "/user/settings",
    zValidator(
      "json",
      z.object({
        handle: z
          .string()
          .min(3)
          .max(32)
          .regex(
            /^[a-zA-Z0-9_.-]+$/,
            "Username can only contain letters, numbers, dots, underscores, and hyphens",
          )
          .optional(),
        password: z.string().optional(),
        settings: z
          .object({
            notifications: z.object({
              "deadlineReminders::telegram": z.number(),
              "gradeUpdates::telegram": z.number(),
              "courseChanges::telegram": z.number(),
            }),
            deadlineReminders: z.object({
              thresholds: z.array(
                z
                  .string()
                  .regex(
                    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/i,
                    "Thresholds must be ISO 8601 durations (e.g., PT6H, P1D, PT30M)",
                  ),
              ),
            }),
          })
          .optional(),
      }),
    ),
    async (ctx) => {
      const userId = ctx.get("userId");

      const { handle, password, settings } = ctx.req.valid("json");

      try {
        const user = await db.user.findOne({ _id: userId });

        if (!user) {
          throw new HTTPException(401, {
            message: "User not found",
          });
        }

        if (handle) {
          await db.user.updateOne(
            { _id: userId },
            {
              $set: {
                handle,
              },
            },
          );
        }

        if (password) {
          await db.user.updateOne(
            { _id: userId },
            {
              $set: {
                password: hashPassword(password),
              },
            },
          );
        }

        if (settings) {
          if (
            settings.deadlineReminders.thresholds.length >
            config.notifications.maxDeadlineThresholds
          ) {
            throw new HTTPException(400, {
              message: "Too many thresholds",
            });
          }

          await db.user.updateOne(
            { _id: userId },
            {
              $set: {
                settings,
              },
            },
          );
        }

        return ctx.json({ ok: true });
      } catch (error: any) {
        throw new HTTPException(500, {
          message: error.message,
        });
      }
    },
  )
  .delete("/bye", async (ctx) => {
    const userId = ctx.get("userId");

    const user = await db.user.findOne({ _id: userId });

    if (!user) {
      throw new HTTPException(401, {
        message: "User not found",
      });
    }

    try {
      await wrapper.deleteUser(userId);
    } catch (error) {
      throw new HTTPException(500, {
        message: `Failed to delete user from the database ${error}`,
      });
    }

    decreaseUserCounter();

    return ctx.json({ ok: true });
  })
  .post(
    "/otp/verify",
    zValidator(
      "json",
      z.object({
        otp: z.string(),
      }),
    ),
    async (ctx) => {
      const userId = ctx.get("userId");

      const { otp } = ctx.req.valid("json");

      try {
        const telegramId = await db.telegramToken.get(otp);

        if (!telegramId) {
          throw new HTTPException(400, { message: "Invalid or expired token" });
        }

        const user = await db.user.findById(userId);

        if (!user) {
          throw new HTTPException(401, { message: "User not found" });
        }

        user.telegramId = parseInt(telegramId);
        await user.save();

        await db.telegramToken.remove(otp);

        return ctx.json({ telegramId });
      } catch (error: any) {
        throw new HTTPException(500, { message: error.message });
      }
    },
  )
  .get("/user/check", async (ctx) => {
    const userId = ctx.get("userId");

    if (!userId) {
      throw new HTTPException(400, {
        message: "no userId",
      });
    }

    const user: IUser | null = await db.user.findOne({ _id: userId });

    if (!user) {
      throw new HTTPException(401, {
        message: "User not found",
      });
    }

    return ctx.json(user);
  });

export const v2 = new Hono()
  .route("/auth", authRoutes)
  .route("/", userRoutes)
  .onError(errorHandler);
