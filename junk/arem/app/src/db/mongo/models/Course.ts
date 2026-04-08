import { Schema, model } from "mongoose";
import { v7 as uuidv7 } from "uuid";
import type { ICourse } from "../../../types";

const course = new Schema<ICourse>(
  {
    _id: { type: String, default: uuidv7 },
    userId: { type: String, required: true, ref: "User" },
    userMoodleId: { type: Number, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    classification: { type: String, required: true },
    disabledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

course.index({ userId: 1 });

export default model("Course", course);
