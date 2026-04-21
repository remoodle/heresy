import { Composer, InlineKeyboard } from "grammy";
import { request, requestUnwrap, getAuthHeaders } from "../helpers/hc";
import { uni } from "../../../library/university";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import {
  inprogressCourseCallback,
  oldCourseCallback,
  pastCourseCallback,
  courseAssignmentsCallback,
  assignmentCallback,
  coursesListCallback,
  backToMenuCallback,
} from "../callback-data";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.callbackQuery(
  coursesListCallback.filter(),
  logHandle("courses_list"),
  async (ctx) => {
    const courses = await requestUnwrap((client) =>
      client.v2.courses.$get(
        { query: { status: "inprogress" } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    const coursesKeyboard = new InlineKeyboard();
    const courseItems = uni.getCoursesMessage(courses);

    courseItems.forEach((course) => {
      coursesKeyboard
        .row()
        .text(
          course.name,
          inprogressCourseCallback.pack({ courseId: course.id }),
        );
    });

    coursesKeyboard
      .row()
      .text("Back ←", backToMenuCallback.pack({}))
      .text("Past courses", oldCourseCallback.pack({ page: 1 }));

    if (!courses.length) {
      await ctx.editMessageText("You have no courses 🥰", {
        reply_markup: coursesKeyboard,
      });
      return;
    }

    await ctx.editMessageText("Your courses:", {
      reply_markup: coursesKeyboard,
    });
  },
);

feature.callbackQuery(
  inprogressCourseCallback.filter(),
  logHandle("inprogress_course"),
  async (ctx) => {
    const data = inprogressCourseCallback.unpack(ctx.callbackQuery.data);

    const { courseId } = data;

    const [grades] = await request((client) =>
      client.v2.course[":courseId"].grades.$get(
        { param: { courseId: courseId.toString() } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    const [course] = await request((client) =>
      client.v2.course[":courseId"].$get(
        { param: { courseId: courseId.toString() }, query: { content: "0" } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    if (!grades || !course) {
      await ctx.editMessageText("Grades for this course are not available.", {
        reply_markup: new InlineKeyboard().text(
          "Back ←",
          coursesListCallback.pack({}),
        ),
      });
      return;
    }

    const message = uni.getGradesMessage(grades, course);

    const keyboard = new InlineKeyboard()
      .text("Assignments", courseAssignmentsCallback.pack({ courseId }))
      .row()
      .text("Back ←", coursesListCallback.pack({}));

    await ctx.editMessageText(message, {
      reply_markup: keyboard,
      parse_mode: "HTML",
    });
  },
);

feature.callbackQuery(
  oldCourseCallback.filter(),
  logHandle("old_courses"),
  async (ctx) => {
    const data = oldCourseCallback.unpack(ctx.callbackQuery.data);

    const { page } = data;

    const [courses] = await request((client) =>
      client.v2.courses.$get(
        { query: { status: "past" } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    if (!courses) {
      await ctx.editMessageText("Past courses are not available.", {
        reply_markup: new InlineKeyboard().text(
          "Back ←",
          coursesListCallback.pack({}),
        ),
      });
      return;
    }

    if (!courses.length) {
      await ctx.editMessageText("You have no past courses 🥰", {
        reply_markup: new InlineKeyboard().text(
          "Back",
          coursesListCallback.pack({}),
        ),
      });
      return;
    }

    const courseItems = uni.getCoursesMessage(courses);

    const totalPages = Math.ceil(courseItems.length / 10);
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    const slicedCourses = courseItems.slice(startIndex, endIndex);

    const coursesKeyboard = new InlineKeyboard();

    slicedCourses.forEach((course) => {
      coursesKeyboard
        .row()
        .text(
          course.name,
          pastCourseCallback.pack({ courseId: course.id, page }),
        );
    });

    coursesKeyboard.row();

    if (page > 1) {
      coursesKeyboard.text("←", oldCourseCallback.pack({ page: page - 1 }));
    }

    coursesKeyboard.text("Back", coursesListCallback.pack({}));

    if (page < totalPages) {
      coursesKeyboard.text("→", oldCourseCallback.pack({ page: page + 1 }));
    }

    await ctx.editMessageText(`Your past courses (${page}/${totalPages}):`, {
      reply_markup: coursesKeyboard,
    });
  },
);

feature.callbackQuery(
  pastCourseCallback.filter(),
  logHandle("past_course"),
  async (ctx) => {
    const data = pastCourseCallback.unpack(ctx.callbackQuery.data);

    const { courseId, page } = data;

    const [grades] = await request((client) =>
      client.v2.course[":courseId"].grades.$get(
        { param: { courseId: courseId.toString() } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    const [course] = await request((client) =>
      client.v2.course[":courseId"].$get(
        { param: { courseId: courseId.toString() }, query: { content: "0" } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    const keyboard = new InlineKeyboard().text(
      "Back ←",
      oldCourseCallback.pack({ page }),
    );

    if (!grades || !course) {
      await ctx.editMessageText("Grades for this course are not available.", {
        reply_markup: keyboard,
      });
      return;
    }

    const message = uni.getGradesMessage(grades, course);

    await ctx.editMessageText(message, {
      reply_markup: keyboard,
      parse_mode: "HTML",
    });
  },
);

feature.callbackQuery(
  courseAssignmentsCallback.filter(),
  logHandle("course_assignments"),
  async (ctx) => {
    const data = courseAssignmentsCallback.unpack(ctx.callbackQuery.data);

    const { courseId } = data;

    const [course] = await request((client) =>
      client.v2.course[":courseId"].$get(
        { param: { courseId: courseId.toString() }, query: { content: "0" } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    if (!course) {
      await ctx.editMessageText("Course is not available.", {
        reply_markup: new InlineKeyboard().text(
          "Back ←",
          coursesListCallback.pack({}),
        ),
      });
      return;
    }

    const [assignments] = await request((client) =>
      client.v2.course[":courseId"].assignments.$get(
        { param: { courseId: courseId.toString() } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    if (!assignments) {
      await ctx.editMessageText("Assignments are not available.", {
        reply_markup: new InlineKeyboard().text(
          "Back ←",
          inprogressCourseCallback.pack({ courseId }),
        ),
      });
      return;
    }

    const keyboard = new InlineKeyboard();

    assignments.forEach((assignment) => {
      keyboard.row().text(
        assignment.name,
        assignmentCallback.pack({
          courseId: assignment.course,
          assignmentId: assignment.id,
        }),
      );
    });

    keyboard.row().text("Back ←", inprogressCourseCallback.pack({ courseId }));

    await ctx.editMessageText(`Assignments\n*${course.fullname}*`, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  },
);

feature.callbackQuery(
  assignmentCallback.filter(),
  logHandle("assignment"),
  async (ctx) => {
    const data = assignmentCallback.unpack(ctx.callbackQuery.data);

    const { courseId, assignmentId } = data;

    const keyboardBack = new InlineKeyboard().text(
      "Back ←",
      courseAssignmentsCallback.pack({ courseId }),
    );

    const [course] = await request((client) =>
      client.v2.course[":courseId"].$get(
        { param: { courseId: courseId.toString() }, query: { content: "0" } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    if (!course) {
      await ctx.editMessageText("Course is not available.", {
        reply_markup: keyboardBack,
      });
      return;
    }

    const [grades] = await request((client) =>
      client.v2.course[":courseId"].grades.$get(
        { param: { courseId: courseId.toString() } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    if (!grades) {
      await ctx.editMessageText("Grades are not available.", {
        reply_markup: keyboardBack,
      });
      return;
    }

    const [assignments] = await request((client) =>
      client.v2.course[":courseId"].assignments.$get(
        { param: { courseId: courseId.toString() } },
        { headers: getAuthHeaders(ctx.from.id) },
      ),
    );

    if (!assignments) {
      await ctx.editMessageText("Assignments are not available.", {
        reply_markup: keyboardBack,
      });
      return;
    }

    const assignment = assignments.find((a) => a.id === assignmentId);

    if (!assignment) {
      await ctx.editMessageText("Assignment is not available.", {
        reply_markup: keyboardBack,
      });
      return;
    }

    const text = uni.getAssignmentMessage(assignment, course, grades);

    await ctx.editMessageText(text, {
      reply_markup: keyboardBack,
      parse_mode: "Markdown",
    });
  },
);

export { composer as coursesFeature };
