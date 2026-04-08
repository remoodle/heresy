import { createCallbackData } from "callback-data";

export const settingsCallback = createCallbackData("settings", {});
export const toggleThresholdCallback = createCallbackData("toggle_threshold", {
  threshold: String,
});
