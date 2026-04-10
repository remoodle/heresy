import { createCallbackData } from "callback-data";

export const menuCallback = createCallbackData("menu", {});
export const setupCallback = createCallbackData("setup", {});
export const settingsCallback = createCallbackData("settings", {});
export const deadlinesSettingsCallback = createCallbackData("deadlines_settings", {});
export const scheduleSettingsCallback = createCallbackData("schedule_settings", {});
export const toggleThresholdCallback = createCallbackData("toggle_threshold", {
  threshold: String,
});
export const toggleDeadlinesCallback = createCallbackData("toggle_deadlines", {});
export const toggleScheduleCallback = createCallbackData("toggle_schedule", {});
export const deadlinesCallback = createCallbackData("deadlines", {});
export const scheduleCallback = createCallbackData("schedule", {});
export const scheduleViewCallback = createCallbackData("schedule_view", { view: String });
export const updateCalendarCallback = createCallbackData("update_calendar", { from: String });
export const connectCalendarCallback = createCallbackData("connect_calendar", { from: String });
export const coursesCallback = createCallbackData("courses", {});
export const toggleCourseCallback = createCallbackData("toggle_course", { idx: String });
export const toggleScheduleTypeCallback = createCallbackData("toggle_sched_type", { key: String });
export const toggleScheduleFormatCallback = createCallbackData("toggle_sched_fmt", { key: String });
export const accountCallback = createCallbackData("account", {});
export const deleteAccountCallback = createCallbackData("delete_account", {});
export const confirmDeleteAccountCallback = createCallbackData("confirm_delete_account", {
  confirmed: String,
});
export const roomPhotoCallback = createCallbackData("room_photo", { room: String });
export const closeMessageCallback = createCallbackData("close_msg", {});
