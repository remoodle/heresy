import { eq } from "drizzle-orm";
import { Composer, InlineKeyboard } from "grammy";
import type { Context } from "../context";
import { db } from "../../db";
import { users } from "../../db/schema";
import { fetchGroupSchedule } from "../../library/calendar-api";
import { coursesCallback, toggleCourseCallback, settingsCallback } from "../callback-data";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

async function getGroupCourses(group: string): Promise<string[]> {
  const items = await fetchGroupSchedule(group);
  const names = items.map((i) => i.courseName).filter(Boolean);
  return Array.from(new Set(names)).sort();
}

function buildCoursesKeyboard(courses: string[], excluded: string[]) {
  const keyboard = new InlineKeyboard();

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]!;
    const isExcluded = excluded.includes(course);
    keyboard
      .row()
      .text(`${isExcluded ? "❌" : "✅"} ${course}`, toggleCourseCallback.pack({ idx: String(i) }));
  }

  keyboard.row().text("Back ←", settingsCallback.pack({}));
  return keyboard;
}

function buildCoursesMessage(courses: string[], excluded: string[]): string {
  if (courses.length === 0) {
    return "📋 <b>Courses</b>\n\nNo courses found for your group.";
  }
  const active = courses.length - excluded.filter((e) => courses.includes(e)).length;
  return (
    `📋 <b>Courses</b>\n\n` +
    `Toggle courses to hide them from deadlines, schedule, and notifications.\n\n` +
    `${active} of ${courses.length} active`
  );
}

feature.command("courses", async (ctx) => {
  if (!ctx.from?.id) {
    return;
  }

  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.reply("You're not registered. Use /start first.");
    return;
  }

  const user = rows[0]!;

  if (!user.group) {
    await ctx.reply(
      "📋 <b>Courses</b>\n\nConnect your Calendar account first.\n\nGo to /settings → Schedule → Connect Calendar account.",
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("Back ←", settingsCallback.pack({})),
      },
    );
    return;
  }

  let courses: string[];
  try {
    courses = await getGroupCourses(user.group);
  } catch {
    await ctx.reply("📋 <b>Courses</b>\n\nFailed to fetch schedule. Try again later.", {
      parse_mode: "HTML",
    });
    return;
  }

  await ctx.reply(buildCoursesMessage(courses, user.excludedCourses), {
    parse_mode: "HTML",
    reply_markup: buildCoursesKeyboard(courses, user.excludedCourses),
  });
});

feature.callbackQuery(coursesCallback.filter(), async (ctx) => {
  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;

  if (!user.group) {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "📋 <b>Courses</b>\n\nConnect your Calendar account first.\n\nGo to Settings → Schedule → Connect Calendar account.",
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("Back ←", settingsCallback.pack({})),
      },
    );
    return;
  }

  let courses: string[];
  try {
    courses = await getGroupCourses(user.group);
  } catch {
    await ctx.answerCallbackQuery("Failed to fetch schedule.");
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(buildCoursesMessage(courses, user.excludedCourses), {
    parse_mode: "HTML",
    reply_markup: buildCoursesKeyboard(courses, user.excludedCourses),
  });
});

feature.callbackQuery(toggleCourseCallback.filter(), async (ctx) => {
  const { idx } = toggleCourseCallback.unpack(ctx.callbackQuery.data) as { idx: string };

  const rows = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).limit(1);
  if (rows.length === 0) {
    await ctx.answerCallbackQuery("Not registered.");
    return;
  }

  const user = rows[0]!;

  if (!user.group) {
    await ctx.answerCallbackQuery("No group linked.");
    return;
  }

  let courses: string[];
  try {
    courses = await getGroupCourses(user.group);
  } catch {
    await ctx.answerCallbackQuery("Failed to fetch schedule.");
    return;
  }

  const course = courses[Number(idx)];
  if (!course) {
    await ctx.answerCallbackQuery("Course not found.");
    return;
  }

  const isExcluded = user.excludedCourses.includes(course);
  const updated = isExcluded
    ? user.excludedCourses.filter((c) => c !== course)
    : [...user.excludedCourses, course];

  await db.update(users).set({ excludedCourses: updated }).where(eq(users.telegramId, ctx.from.id));

  await ctx.editMessageText(buildCoursesMessage(courses, updated), {
    parse_mode: "HTML",
    reply_markup: buildCoursesKeyboard(courses, updated),
  });
  await ctx.answerCallbackQuery();
});

export { composer as coursesFeature };
