import type {
  MoodleCourse,
  MoodleCourseClassification,
  MoodleEvent,
  MoodleGrade,
} from "./moodle";

export type ICourse = {
  _id: string;
  userId: string;
  userMoodleId: number;
  data: MoodleCourse;
  classification: MoodleCourseClassification;
  disabledAt: Date;
};

export type IGrade = {
  _id: string;
  userId: string;
  courseId: number;
  data: MoodleGrade;
};

export type IEvent = {
  _id: string;
  userId: string;
  data: MoodleEvent;
};

export type IReminder = {
  _id: string;
  userId: string;
  eventId: string;
  triggeredAt: Date;
};

export type NotificationSettings = {
  "gradeUpdates::telegram": 0 | 1 | 2;
  "deadlineReminders::telegram": 0 | 1 | 2;
  "courseChanges::telegram": 0 | 1 | 2;
};

export type UserSettings = {
  notifications: NotificationSettings;
  deadlineReminders: {
    thresholds: string[];
  };
};

export type IUserMoodleAuthCookie = {
  name: string;
  value: string;
};

export type IUser = {
  _id: string;
  name: string;
  moodleId: number;
  username: string;
  handle: string;
  /**
   * @deprecated Use `moodleSessionCookie` and `moodleSessionKey` instead.
   */
  moodleToken?: string;
  moodleAuthCookies: IUserMoodleAuthCookie[];
  moodleSessionCookie: string;
  moodleSessionKey: string;
  msAccountId?: string;
  health: number;
  email?: string;
  telegramId?: number;
  password?: string;
  settings: UserSettings;
};
