import { Schema, model } from "mongoose";
import { v7 as uuidv7 } from "uuid";
import type { IReminder } from "../../../types";

const reminder = new Schema<IReminder>(
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, ref: "User" },
    eventId: { type: String, required: true, ref: "Event" },
    triggeredAt: { type: Date, required: true },
  },
  { timestamps: true },
);

reminder.index({ userId: 1 });
reminder.index({ triggeredAt: 1 });
reminder.index({ eventId: 1 });

export default model("Reminder", reminder);
