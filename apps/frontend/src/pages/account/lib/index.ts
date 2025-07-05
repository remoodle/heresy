export const NOTIFICATIONS_CONFIG = {
  gradeUpdates: {
    title: "📘 Updated grades",
  },
  deadlineReminders: {
    title: "🔔 Upcoming deadlines",
  },
} as const;

export const NOTIFICATION_SETTING_STATE = {
  disabled: 0,
  enabled: 1,
  mandatory: 2,
} as const;

export type SettingState =
  (typeof NOTIFICATION_SETTING_STATE)[keyof typeof NOTIFICATION_SETTING_STATE];

export const TRANSPORT_TYPES = ["telegram"] as const;
