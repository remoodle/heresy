import type { NotificationSettings } from "@remoodle/types";

type NotificationConfig = {
  key: string;
  name: string;
};

export const NOTIFICATION_CONFIG: NotificationConfig[] = [
  {
    key: "gradeUpdates",
    name: "Grades",
  },
  {
    key: "deadlineReminders",
    name: "Deadlines",
  },
];

export const getTelegramNotificationKey = (key: string) => {
  const setting = NOTIFICATION_CONFIG.find((config) => config.key === key);

  if (!setting) {
    return undefined;
  }

  return `${setting.key}::telegram` as keyof NotificationSettings;
};

export const getTelegramNotificationKeys = () => {
  return NOTIFICATION_CONFIG.map(
    (config) => `${config.key}::telegram` as keyof NotificationSettings,
  );
};
