import { createCallbackData } from "callback-data";

export const settingsCallback = createCallbackData("settings", {});
export const accountCallback = createCallbackData("account", {});
export const notificationsCallback = createCallbackData("notifications", {});
export const deleteProfileCallback = createCallbackData("delete_profile", {});
export const deleteProfileYesCallback = createCallbackData(
  "delete_profile_yes",
  {},
);

export const changeNotificationCallback = createCallbackData(
  "change_notification",
  {
    type: String,
    value: Number,
  },
);
