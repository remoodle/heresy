import { createCallbackData } from "callback-data";

export const refreshDeadlinesCallback = createCallbackData(
  "refresh_deadlines",
  { type: String },
);

export const deadlinesCallback = createCallbackData("deadlines", {});
