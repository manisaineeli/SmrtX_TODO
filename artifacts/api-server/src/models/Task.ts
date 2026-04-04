import mongoose, { Schema, type Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "trash";
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
  dueDate: Date | null;
  completedAt: Date | null;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done", "trash"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: { type: [String], default: [] },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });

export const TaskModel = mongoose.model<ITask>("Task", TaskSchema);
