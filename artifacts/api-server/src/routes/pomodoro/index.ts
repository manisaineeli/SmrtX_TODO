import { Router } from "express";
import { PomodoroSessionModel } from "../../models/PomodoroSession";
import { UserModel } from "../../models/User";
import { requireAuth, type AuthRequest } from "../../middleware/auth";
import { CreatePomodoroSessionBody } from "@workspace/api-zod";

const router = Router();

function formatSession(session: {
  _id: { toString(): string };
  duration: number;
  type: string;
  taskId: { toString(): string } | null;
  userId: { toString(): string };
  completedAt: Date;
}) {
  return {
    id: session._id.toString(),
    duration: session.duration,
    type: session.type,
    taskId: session.taskId ? session.taskId.toString() : null,
    userId: session.userId.toString(),
    completedAt: session.completedAt.toISOString(),
  };
}

router.get("/pomodoro/sessions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const sessions = await PomodoroSessionModel.find({ userId: req.userId })
    .sort({ completedAt: -1 })
    .limit(50);

  res.json(sessions.map(formatSession));
});

router.post("/pomodoro/sessions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreatePomodoroSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const session = await PomodoroSessionModel.create({
    ...parsed.data,
    userId: req.userId,
    taskId: parsed.data.taskId || null,
    completedAt: new Date(),
  });

  // Update user stats and award XP for work sessions
  if (parsed.data.type === "work") {
    const user = await UserModel.findById(req.userId);
    if (user) {
      user.pomodorosCompleted += 1;
      user.xp += 15;
      user.level = Math.floor(user.xp / 100) + 1;

      if (!user.badges.includes("pomodoro_1")) {
        user.badges.push("pomodoro_1");
      }
      if (user.pomodorosCompleted >= 10 && !user.badges.includes("pomodoro_10")) {
        user.badges.push("pomodoro_10");
      }

      await user.save();
    }
  }

  res.status(201).json(formatSession(session));
});

export default router;
