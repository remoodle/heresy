import { Composer } from "grammy";
import type { RegistrationContext } from "..";
import { callbacks } from "./callback-handlers";
import { commands } from "./command-handlers";

const commandsHandler = new Composer<RegistrationContext>();

commandsHandler.command("start", commands.start);
commandsHandler.command("deadlines", commands.deadlines);
commandsHandler.command("ds", commands.deadlines);
commandsHandler.command("about", commands.about);

const callbacksHandler = new Composer();

// Menu buttons
callbacksHandler.callbackQuery("others", callbacks.menu.others);
callbacksHandler.callbackQuery("settings", callbacks.menu.settings);
callbacksHandler.callbackQuery("deadlines", callbacks.menu.deadlines);
callbacksHandler.callbackQuery("courses", callbacks.menu.courses);

// Deadlines buttons
callbacksHandler.callbackQuery(
  /^refresh_deadlines_(.+)/,
  callbacks.deadlines.refresh,
);

// Settings buttons
callbacksHandler.callbackQuery(
  "notifications",
  callbacks.settings.notifications,
);
callbacksHandler.callbackQuery(
  /^change_notifications_(.+)_(.+)/,
  callbacks.settings.changeNotifications,
);

// Delete profile (Settings)
callbacksHandler.callbackQuery(
  "delete_profile",
  callbacks.settings.deleteProfile,
);
callbacksHandler.callbackQuery(
  "delete_profile_yes",
  callbacks.settings.deleteProfileYes,
);

// Grades buttons
callbacksHandler.callbackQuery(
  /inprogress_course_\d+/,
  callbacks.course.inProgressCourse,
);

callbacksHandler.callbackQuery(/old_course_\d+/, callbacks.course.pastCourses);
callbacksHandler.callbackQuery(
  /past_course_\d+_\d+/,
  callbacks.course.pastCourse,
);

// Assignments
callbacksHandler.callbackQuery(
  /course_assignments_\d+/,
  callbacks.course.assignments.course,
);

callbacksHandler.callbackQuery(
  /assignment_\d+_\d+/,
  callbacks.course.assignments.assignment,
);

// Clear button
callbacksHandler.callbackQuery("remove_message", callbacks.other.clearMessage);

// Back buttons
callbacksHandler.callbackQuery("back_to_menu", callbacks.back.toMenu);

// Extra
callbacksHandler.callbackQuery(
  "schedule_coming_soon",
  callbacks.other.schedule,
);
callbacksHandler.callbackQuery("account", callbacks.settings.account);

export { commandsHandler, callbacksHandler };
