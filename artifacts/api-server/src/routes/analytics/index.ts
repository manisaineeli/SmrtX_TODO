import { Router } from "express";
import mongoose from "mongoose";
import { TaskModel } from "../../models/Task";
import { PomodoroSessionModel } from "../../models/PomodoroSession";
import { UserModel } from "../../models/User";
import { requireAuth, type AuthRequest } from "../../middleware/auth";

const router = Router();

router.get("/analytics/dashboard", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);

  // Get 7 days of data
  const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 86400000);

  const [user, todayTasks, todaySessions, weeklyTasks, weeklySessions] = await Promise.all([
    UserModel.findById(userId),
    TaskModel.find({
      userId,
      status: "done",
      completedAt: { $gte: startOfToday, $lt: endOfToday },
    }),
    PomodoroSessionModel.find({
      userId,
      type: "work",
      completedAt: { $gte: startOfToday, $lt: endOfToday },
    }),
    TaskModel.find({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    }),
    PomodoroSessionModel.find({
      userId,
      completedAt: { $gte: sevenDaysAgo },
    }),
  ]);

  const focusMinutesToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  // Build weekly data
  const weeklyDataMap = new Map<string, { completed: number; created: number; focusMinutes: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    weeklyDataMap.set(key, { completed: 0, created: 0, focusMinutes: 0 });
  }

  for (const task of weeklyTasks) {
    const created = task.createdAt.toISOString().slice(0, 10);
    const entry = weeklyDataMap.get(created);
    if (entry) entry.created++;

    if (task.status === "done" && task.completedAt) {
      const completed = task.completedAt.toISOString().slice(0, 10);
      const entryC = weeklyDataMap.get(completed);
      if (entryC) entryC.completed++;
    }
  }

  for (const session of weeklySessions) {
    if (session.type === "work") {
      const key = session.completedAt.toISOString().slice(0, 10);
      const entry = weeklyDataMap.get(key);
      if (entry) entry.focusMinutes += session.duration;
    }
  }

  const weeklyTaskData = Array.from(weeklyDataMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));

  // Heatmap: last 90 days of task completions
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
  const heatmapTasks = await TaskModel.find({
    userId,
    status: "done",
    completedAt: { $gte: ninetyDaysAgo },
  });

  const heatmapMap = new Map<string, number>();
  for (const task of heatmapTasks) {
    if (task.completedAt) {
      const key = task.completedAt.toISOString().slice(0, 10);
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    }
  }
  const heatmapData = Array.from(heatmapMap.entries()).map(([date, count]) => ({ date, count }));

  // Priority breakdown
  const priorityGroups = await TaskModel.aggregate([
    { $match: { userId, status: { $ne: "trash" } } },
    { $group: { _id: "$priority", count: { $sum: 1 } } },
  ]);
  const tasksByPriority = priorityGroups.map((g) => ({
    priority: g._id as string,
    count: g.count as number,
  }));

  // Productivity score (0-100)
  const totalActiveTasks = await TaskModel.countDocuments({ userId, status: { $ne: "trash" } });
  const doneCount = await TaskModel.countDocuments({ userId, status: "done" });
  const productivityScore = totalActiveTasks > 0
    ? Math.round((doneCount / (totalActiveTasks + doneCount)) * 100)
    : 0;

  res.json({
    productivityScore: Math.min(productivityScore, 100),
    streak: user?.streak || 0,
    tasksCompletedToday: todayTasks.length,
    pomodorosToday: todaySessions.length,
    focusMinutesToday,
    weeklyTaskData,
    heatmapData,
    tasksByPriority,
  });
});

router.get("/analytics/productivity", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(startOfToday.getTime() - 29 * 86400000);

  const [tasks, sessions] = await Promise.all([
    TaskModel.find({ userId, createdAt: { $gte: thirtyDaysAgo } }),
    PomodoroSessionModel.find({ userId, completedAt: { $gte: thirtyDaysAgo }, type: "work" }),
  ]);

  const dataMap = new Map<string, { completed: number; created: number; focusMinutes: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 86400000);
    dataMap.set(d.toISOString().slice(0, 10), { completed: 0, created: 0, focusMinutes: 0 });
  }

  for (const task of tasks) {
    const key = task.createdAt.toISOString().slice(0, 10);
    const entry = dataMap.get(key);
    if (entry) entry.created++;
    if (task.status === "done" && task.completedAt) {
      const cKey = task.completedAt.toISOString().slice(0, 10);
      const cEntry = dataMap.get(cKey);
      if (cEntry) cEntry.completed++;
    }
  }

  for (const session of sessions) {
    const key = session.completedAt.toISOString().slice(0, 10);
    const entry = dataMap.get(key);
    if (entry) entry.focusMinutes += session.duration;
  }

  const result = Array.from(dataMap.entries()).map(([date, data]) => ({ date, ...data }));
  res.json(result);
});

export default router;
