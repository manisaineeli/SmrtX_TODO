import mongoose, { Schema, type Document } from "mongoose";

export interface INote extends Document {
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  color: string | null;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
    color: { type: String, default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

NoteSchema.index({ userId: 1, pinned: -1 });

export const NoteModel = mongoose.model<INote>("Note", NoteSchema);
