import { createCallbackData } from "callback-data";

export const displayAllDeadlinesCallback = createCallbackData(
  "display_all_deadlines",
  { type: String },
);

export const deadlinesCallback = createCallbackData("deadlines", {
  type: String,
});
