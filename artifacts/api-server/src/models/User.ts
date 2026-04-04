import mongoose, { Schema, type Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: string | null;
  theme: "light" | "dark" | "system";
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  tasksCompleted: number;
  pomodorosCompleted: number;
  badges: string[];
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: null },
    theme: { type: String, enum: ["light", "dark", "system"], default: "dark" },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    tasksCompleted: { type: Number, default: 0 },
    pomodorosCompleted: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods["comparePassword"] = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<IUser>("User", UserSchema);
