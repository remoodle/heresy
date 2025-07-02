import { Composer, InlineKeyboard } from "grammy";
import type { BotContext } from "../../types";
import { request, requestUnwrap, getAuthHeaders } from "../../../library/hc";
import { uni } from "../../../adapters";

export const composer = new Composer<BotContext>();

const feature = composer.chatType("private");

feature.callbackQuery("courses", async (ctx) => {
  const courses = await requestUnwrap((client) =>
    client.v2.courses.$get(
      { query: { status: "inprogress" } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  const coursesKeyboard = new InlineKeyboard();
  const courseItems = uni.getCoursesMessage(courses);

  courseItems.forEach((course) => {
    coursesKeyboard.row().text(course.name, `inprogress_course_${course.id}`);
  });

  coursesKeyboard
    .row()
    .text("Back ←", "back_to_menu")
    .text("Past courses", "old_course_1");

  if (!courses.length) {
    await ctx.editMessageText("You have no courses 🥰", {
      reply_markup: coursesKeyboard,
    });
    return;
  }

  await ctx.editMessageText("Your courses:", {
    reply_markup: coursesKeyboard,
  });
});

feature.callbackQuery(/^inprogress_course_(\d+)/, async (ctx) => {
  const courseId = ctx.match[1];

  const [grades] = await request((client) =>
    client.v2.course[":courseId"].grades.$get(
      { param: { courseId } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  const [course] = await request((client) =>
    client.v2.course[":courseId"].$get(
      { param: { courseId }, query: { content: "0" } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  if (!grades || !course) {
    await ctx.editMessageText("Grades for this course are not available.", {
      reply_markup: new InlineKeyboard().text("Back ←", "courses"),
    });
    return;
  }

  const message = uni.getGradesMessage(grades, course);

  const keyboard = new InlineKeyboard()
    .text("Assignments", `course_assignments_${courseId}`)
    .row()
    .text("Back ←", "courses");

  await ctx.editMessageText(message, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });
});

feature.callbackQuery(/^old_course_(\d+)/, async (ctx) => {
  const page = parseInt(ctx.match[1]);

  const [courses] = await request((client) =>
    client.v2.courses.$get(
      { query: { status: "past" } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  if (!courses) {
    await ctx.editMessageText("Past courses are not available.", {
      reply_markup: new InlineKeyboard().text("Back ←", "courses"),
    });
    return;
  }

  if (!courses.length) {
    await ctx.editMessageText("You have no past courses 🥰", {
      reply_markup: new InlineKeyboard().text("Back", "courses"),
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
    coursesKeyboard.row().text(course.name, `past_course_${course.id}_${page}`);
  });

  coursesKeyboard.row();

  if (page > 1) {
    coursesKeyboard.text("←", `old_course_${page - 1}`);
  }

  coursesKeyboard.text("Back", "courses");

  if (page < totalPages) {
    coursesKeyboard.text("→", `old_course_${page + 1}`);
  }

  await ctx.editMessageText(`Your past courses (${page}/${totalPages}):`, {
    reply_markup: coursesKeyboard,
  });
});

feature.callbackQuery(/^past_course_(\d+)_(\d+)/, async (ctx) => {
  const courseId = ctx.match[1];
  const page = ctx.match[2];

  const [grades] = await request((client) =>
    client.v2.course[":courseId"].grades.$get(
      { param: { courseId } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  const [course] = await request((client) =>
    client.v2.course[":courseId"].$get(
      { param: { courseId }, query: { content: "0" } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  const keyboard = new InlineKeyboard().text("Back ←", `old_course_${page}`);

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
});

feature.callbackQuery(/^course_assignments_(\d+)/, async (ctx) => {
  const courseId = ctx.match[1];

  const [course] = await request((client) =>
    client.v2.course[":courseId"].$get(
      { param: { courseId }, query: { content: "0" } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  if (!course) {
    await ctx.editMessageText("Course is not available.", {
      reply_markup: new InlineKeyboard().text("Back ←", "courses"),
    });
    return;
  }

  const [assignments] = await request((client) =>
    client.v2.course[":courseId"].assignments.$get(
      { param: { courseId } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  if (!assignments) {
    await ctx.editMessageText("Assignments are not available.", {
      reply_markup: new InlineKeyboard().text(
        "Back ←",
        `inprogress_course_${courseId}`,
      ),
    });
    return;
  }

  const keyboard = new InlineKeyboard();

  assignments.forEach((assignment) => {
    keyboard
      .row()
      .text(
        assignment.name,
        `assignment_${assignment.course}_${assignment.id}`,
      );
  });

  keyboard.row().text("Back ←", `inprogress_course_${courseId}`);

  await ctx.editMessageText(`Assignments\n*${course.fullname}*`, {
    reply_markup: keyboard,
    parse_mode: "Markdown",
  });
});

feature.callbackQuery(/^assignment_(\d+)_(\d+)/, async (ctx) => {
  const courseId = ctx.match[1];
  const assignmentIdStr = ctx.match[2];

  const keyboardBack = new InlineKeyboard().text(
    "Back ←",
    `course_assignments_${courseId}`,
  );

  const [course] = await request((client) =>
    client.v2.course[":courseId"].$get(
      { param: { courseId }, query: { content: "0" } },
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
      { param: { courseId } },
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
      { param: { courseId } },
      { headers: getAuthHeaders(ctx.from.id) },
    ),
  );

  if (!assignments) {
    await ctx.editMessageText("Assignments are not available.", {
      reply_markup: keyboardBack,
    });
    return;
  }

  const assignmentId = parseInt(assignmentIdStr);
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
});

export { composer as coursesFeature };
