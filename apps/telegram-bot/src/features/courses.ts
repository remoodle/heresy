import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "../context";
import { fetchSchedule, findAccount, updateAccount } from "../server";
import { m } from "@heresy/shared/i18n/messages";
import { bold } from "@heresy/shared/telegram-html";
import { settingLabel, shownHidden } from "../keyboards/labels";
import {
  courseScheduleCallback,
  coursesCallback,
  settingsCallback,
  toggleCourseCallback,
  toggleCourseScheduleFilterCallback,
} from "../callback-data";
import {
  DEFAULT_COURSE_SCHEDULE_FILTERS,
  type CourseScheduleFilters,
} from "@heresy/shared/schedule/filters";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

async function getUserCourses(telegramId: number): Promise<string[]> {
  const items = await fetchSchedule(telegramId);
  const names = items.map((i) => i.courseName).filter(Boolean);

  return Array.from(new Set(names)).sort();
}

// Course names are long, so each course gets a full-width row that opens its own screen.
function buildCoursesKeyboard(courses: string[], excluded: string[]) {
  const keyboard = new InlineKeyboard();

  courses.forEach((course, i) => {
    keyboard
      .row()
      .text(
        excluded.includes(course) ? m.courses_hidden_item({ course }) : course,
        courseScheduleCallback.pack({ idx: String(i) }),
      );
  });

  keyboard.row().text(m.ui_back(), settingsCallback.pack({}));

  return keyboard;
}

function buildCourseKeyboard(
  index: number,
  shown: boolean,
  filters: CourseScheduleFilters,
): InlineKeyboard {
  const idx = String(index);

  const filterButton = (label: string, key: keyof CourseScheduleFilters) =>
    [
      settingLabel(label, shownHidden(filters[key])),
      toggleCourseScheduleFilterCallback.pack({ idx, key }),
    ] as const;

  return new InlineKeyboard()
    .text(settingLabel(m.course_toggle(), shownHidden(shown)), toggleCourseCallback.pack({ idx }))
    .row()
    .text(...filterButton(m.course_lectures(), "lecture"))
    .text(...filterButton(m.course_practices(), "practice"))
    .row()
    .text(...filterButton(m.course_online(), "online"))
    .text(...filterButton(m.course_in_person(), "offline"))
    .row()
    .text(m.ui_back(), coursesCallback.pack({}));
}

function buildCourseMessage(course: string) {
  return `${bold(course)}\n\n${m.course_body()}`;
}

async function getCourseContext(ctx: Context) {
  if (!ctx.from) return null;
  const account = await findAccount(ctx.from.id);

  if (!account?.hasSchedule) return null;
  const courses = await getUserCourses(ctx.from.id);

  return { account, courses };
}

function withCoursesHeader(body: string) {
  return `${bold(m.courses_header())}\n\n${body}`;
}

function buildCoursesMessage(courses: string[], excluded: string[]): string {
  if (courses.length === 0) {
    return withCoursesHeader(m.courses_empty());
  }

  const active = courses.length - excluded.filter((e) => courses.includes(e)).length;

  return withCoursesHeader(m.courses_body({ active, total: courses.length }));
}

feature.command("courses", async (ctx) => {
  if (!ctx.from?.id) {
    return;
  }

  const account = await findAccount(ctx.from.id);

  if (!account) {
    await ctx.reply(m.not_registered());

    return;
  }

  if (!account.hasSchedule) {
    await ctx.reply(withCoursesHeader(m.courses_no_group()), {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text(m.ui_back(), settingsCallback.pack({})),
    });

    return;
  }

  let courses: string[];

  try {
    courses = await getUserCourses(ctx.from.id);
  } catch {
    await ctx.reply(withCoursesHeader(m.courses_fetch_failed()), {
      parse_mode: "HTML",
    });

    return;
  }

  await ctx.reply(buildCoursesMessage(courses, account.excludedCourses), {
    parse_mode: "HTML",
    reply_markup: buildCoursesKeyboard(courses, account.excludedCourses),
  });
});

feature.callbackQuery(coursesCallback.filter(), async (ctx) => {
  const account = await findAccount(ctx.from.id);

  if (!account) {
    await ctx.answerCallbackQuery(m.not_registered_short());

    return;
  }

  if (!account.hasSchedule) {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(withCoursesHeader(m.courses_no_group()), {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text(m.ui_back(), settingsCallback.pack({})),
    });

    return;
  }

  let courses: string[];

  try {
    courses = await getUserCourses(ctx.from.id);
  } catch {
    await ctx.answerCallbackQuery(m.schedule_fetch_failed_short());

    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(buildCoursesMessage(courses, account.excludedCourses), {
    parse_mode: "HTML",
    reply_markup: buildCoursesKeyboard(courses, account.excludedCourses),
  });
});

feature.callbackQuery(toggleCourseCallback.filter(), async (ctx) => {
  const { idx } = toggleCourseCallback.unpack(ctx.callbackQuery.data);

  const account = await findAccount(ctx.from.id);

  if (!account) {
    await ctx.answerCallbackQuery(m.not_registered_short());

    return;
  }

  if (!account.hasSchedule) {
    await ctx.answerCallbackQuery(m.error_no_group_linked());

    return;
  }

  let courses: string[];

  try {
    courses = await getUserCourses(ctx.from.id);
  } catch {
    await ctx.answerCallbackQuery(m.schedule_fetch_failed_short());

    return;
  }

  const course = courses[Number(idx)];

  if (!course) {
    await ctx.answerCallbackQuery(m.error_course_not_found());

    return;
  }

  const isExcluded = account.excludedCourses.includes(course);

  const excludedCourses = isExcluded
    ? account.excludedCourses.filter((c) => c !== course)
    : [...account.excludedCourses, course];

  const updated = await updateAccount(ctx.from.id, { excludedCourses });

  await ctx.editMessageText(buildCourseMessage(course), {
    parse_mode: "HTML",
    reply_markup: buildCourseKeyboard(
      Number(idx),
      !updated.excludedCourses.includes(course),
      updated.scheduleFilters.courses?.[course] ?? DEFAULT_COURSE_SCHEDULE_FILTERS,
    ),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(courseScheduleCallback.filter(), async (ctx) => {
  const { idx } = courseScheduleCallback.unpack(ctx.callbackQuery.data);
  const context = await getCourseContext(ctx);
  const index = Number(idx);
  const course = context?.courses[index];

  if (!context || !course) {
    await ctx.answerCallbackQuery(m.error_course_not_found());

    return;
  }

  const { excludedCourses, scheduleFilters } = context.account;
  await ctx.editMessageText(buildCourseMessage(course), {
    parse_mode: "HTML",
    reply_markup: buildCourseKeyboard(
      index,
      !excludedCourses.includes(course),
      scheduleFilters.courses?.[course] ?? DEFAULT_COURSE_SCHEDULE_FILTERS,
    ),
  });
  await ctx.answerCallbackQuery();
});

feature.callbackQuery(toggleCourseScheduleFilterCallback.filter(), async (ctx) => {
  const { idx, key } = toggleCourseScheduleFilterCallback.unpack(ctx.callbackQuery.data);

  const context = await getCourseContext(ctx);
  const index = Number(idx);
  const course = context?.courses[index];

  if (
    !context ||
    !course ||
    (key !== "lecture" && key !== "practice" && key !== "online" && key !== "offline")
  ) {
    await ctx.answerCallbackQuery(m.error_course_not_found());

    return;
  }

  const filters = context.account.scheduleFilters;
  const courseFilters = filters.courses?.[course] ?? DEFAULT_COURSE_SCHEDULE_FILTERS;
  const updated = { ...courseFilters, [key]: !courseFilters[key] };

  await updateAccount(ctx.from.id, {
    scheduleFilters: { ...filters, courses: { ...filters.courses, [course]: updated } },
  });

  await ctx.editMessageReplyMarkup({
    reply_markup: buildCourseKeyboard(
      index,
      !context.account.excludedCourses.includes(course),
      updated,
    ),
  });
  await ctx.answerCallbackQuery();
});

export { composer as coursesFeature };
