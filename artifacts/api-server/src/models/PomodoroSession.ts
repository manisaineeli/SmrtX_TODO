import mongoose, { Schema, type Document } from "mongoose";

export interface IPomodoroSession extends Document {
  duration: number;
  type: "work" | "short_break" | "long_break";
  taskId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId;
  completedAt: Date;
}

const PomodoroSessionSchema = new Schema<IPomodoroSession>(
  {
    duration: { type: Number, required: true },
    type: {
      type: String,
      enum: ["work", "short_break", "long_break"],
      required: true,
    },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    completedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

PomodoroSessionSchema.index({ userId: 1, completedAt: -1 });

export const PomodoroSessionModel = mongoose.model<IPomodoroSession>(
  "PomodoroSession",
  PomodoroSessionSchema
);
