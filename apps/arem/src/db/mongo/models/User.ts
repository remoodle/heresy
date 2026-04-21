import { Schema, model } from "mongoose";
import { v7 as uuidv7 } from "uuid";
import type {
  IUserMoodleAuthCookie,
  IUser,
  NotificationSettings,
} from "../../../types";

export const DEFAULT_THRESHOLDS = ["PT3H", "PT6H", "P1D"];

const notificationSettingsSchema = new Schema<NotificationSettings>(
  {
    "deadlineReminders::telegram": {
      type: Number,
      default: 0,
      enum: [0, 1, 2],
    },
    "gradeUpdates::telegram": {
      type: Number,
      default: 1,
      enum: [0, 1, 2],
    },
    "courseChanges::telegram": {
      type: Number,
      default: 1,
      enum: [0, 1, 2],
    },
  },
  { _id: false },
);

const deadlineRemindersSchema = new Schema(
  {
    thresholds: {
      type: [String],
      default: DEFAULT_THRESHOLDS,
      required: true,
    },
  },
  { _id: false },
);

const UserMoodleAuthCookieSchema = new Schema<IUserMoodleAuthCookie>({
  name: { type: String, required: true },
  value: { type: String, required: true },
});

const userSchema = new Schema<IUser>(
  {
    _id: { type: String, default: uuidv7 },
    name: { type: String, required: true },
    username: { type: String, required: true },
    handle: {
      type: String,
      required: true,
      unique: true,
      default() {
        return this._id;
      },
    },
    moodleId: { type: Number, required: true, unique: true },
    /**
     * @deprecated Use `moodleSessionCookie` and `moodleSessionKey` instead.
     */
    moodleToken: { type: String },
    moodleAuthCookies: [UserMoodleAuthCookieSchema],
    moodleSessionCookie: { type: String, required: true },
    moodleSessionKey: { type: String, required: true },
    health: { type: Number, default: 7 },
    telegramId: { type: Number },
    password: { type: String },
    settings: {
      notifications: {
        type: notificationSettingsSchema,
        default: {},
        required: true,
      },
      deadlineReminders: {
        type: deadlineRemindersSchema,
        default: {},
        required: true,
      },
    },
  },
  { timestamps: true },
);

userSchema.index(
  { telegramId: 1 },
  { unique: true, partialFilterExpression: { telegramId: { $exists: true } } },
);

export default model("User", userSchema);
