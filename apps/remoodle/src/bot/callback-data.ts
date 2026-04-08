import { createCallbackData } from "callback-data";

export const menuCallback = createCallbackData("menu", {});
export const settingsCallback = createCallbackData("settings", {});
export const toggleThresholdCallback = createCallbackData("toggle_threshold", {
  threshold: String,
});
export const deadlinesCallback = createCallbackData("deadlines", {});
export const updateCalendarCallback = createCallbackData("update_calendar", {});
