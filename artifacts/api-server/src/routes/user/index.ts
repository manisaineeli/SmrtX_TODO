import { Router } from "express";
import { UserModel } from "../../models/User";
import { requireAuth, type AuthRequest } from "../../middleware/auth";
import { UpdateProfileBody } from "@workspace/api-zod";

const router = Router();

const ALL_BADGES = [
  {
    id: "first_task",
    name: "First Steps",
    description: "Complete your first task",
    icon: "CheckCircle",
  },
  {
    id: "task_10",
    name: "Task Machine",
    description: "Complete 10 tasks",
    icon: "Zap",
  },
  {
    id: "task_50",
    name: "Productivity Pro",
    description: "Complete 50 tasks",
    icon: "Trophy",
  },
  {
    id: "streak_3",
    name: "On Fire",
    description: "Maintain a 3-day streak",
    icon: "Flame",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "Star",
  },
  {
    id: "pomodoro_1",
    name: "Focused",
    description: "Complete your first pomodoro",
    icon: "Timer",
  },
  {
    id: "pomodoro_10",
    name: "Deep Worker",
    description: "Complete 10 pomodoro sessions",
    icon: "Brain",
  },
  {
    id: "note_1",
    name: "Note Taker",
    description: "Create your first note",
    icon: "FileText",
  },
  {
    id: "level_5",
    name: "Rising Star",
    description: "Reach level 5",
    icon: "Award",
  },
  {
    id: "level_10",
    name: "Master",
    description: "Reach level 10",
    icon: "Crown",
  },
];

router.get("/user/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = await UserModel.findById(req.userId).select("-password -refreshToken");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: (user._id as { toString(): string }).toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    theme: user.theme,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/user/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await UserModel.findByIdAndUpdate(req.userId, parsed.data, {
    new: true,
    select: "-password -refreshToken",
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: (user._id as { toString(): string }).toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    theme: user.theme,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/user/stats", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const badges = ALL_BADGES.map((badge) => ({
    ...badge,
    unlocked: user.badges.includes(badge.id),
    unlockedAt: user.badges.includes(badge.id) ? new Date().toISOString() : null,
  }));

  res.json({
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    longestStreak: user.longestStreak,
    badges,
    tasksCompleted: user.tasksCompleted,
    pomodorosCompleted: user.pomodorosCompleted,
  });
});

export default router;
