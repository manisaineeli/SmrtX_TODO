import { Router } from "express";
import mongoose from "mongoose";
import { TaskModel } from "../../models/Task";
import { UserModel } from "../../models/User";
import { requireAuth, type AuthRequest } from "../../middleware/auth";
import {
  CreateTaskBody,
  UpdateTaskBody,
  GetTasksQueryParams,
} from "@workspace/api-zod";

const router = Router();

function formatTask(task: {
  _id: { toString(): string };
  title: string;
  description: string | null;
  status: string;
  priority: string;
  tags: string[];
  dueDate: Date | null;
  completedAt: Date | null;
  userId: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    tags: task.tags,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    userId: task.userId.toString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

async function awardXP(userId: string, amount: number) {
  const user = await UserModel.findById(userId);
  if (!user) return;
  user.xp += amount;
  user.level = Math.floor(user.xp / 100) + 1;

  // Check badge unlocks
  if (user.tasksCompleted >= 1 && !user.badges.includes("first_task")) {
    user.badges.push("first_task");
  }
  if (user.tasksCompleted >= 10 && !user.badges.includes("task_10")) {
    user.badges.push("task_10");
  }
  if (user.tasksCompleted >= 50 && !user.badges.includes("task_50")) {
    user.badges.push("task_50");
  }
  if (user.level >= 5 && !user.badges.includes("level_5")) {
    user.badges.push("level_5");
  }
  if (user.level >= 10 && !user.badges.includes("level_10")) {
    user.badges.push("level_10");
  }

  await user.save();
}

router.get("/tasks/summary", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const now = new Date();

  const [total, todo, inProgress, done, overdue, highPriority] = await Promise.all([
    TaskModel.countDocuments({ userId, status: { $ne: "trash" } }),
    TaskModel.countDocuments({ userId, status: "todo" }),
    TaskModel.countDocuments({ userId, status: "in_progress" }),
    TaskModel.countDocuments({ userId, status: "done" }),
    TaskModel.countDocuments({
      userId,
      status: { $in: ["todo", "in_progress"] },
      dueDate: { $lt: now },
    }),
    TaskModel.countDocuments({
      userId,
      status: { $ne: "trash" },
      priority: { $in: ["high", "urgent"] },
    }),
  ]);

  res.json({ total, todo, inProgress, done, overdue, highPriority });
});

router.get("/tasks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = GetTasksQueryParams.safeParse(req.query);
  const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(req.userId) };

  if (parsed.success) {
    const { status, priority, tag, search } = parsed.data;
    if (status) query["status"] = status;
    else query["status"] = { $ne: "trash" };
    if (priority) query["priority"] = priority;
    if (tag) query["tags"] = tag;
    if (search) {
      query["$or"] = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
  } else {
    query["status"] = { $ne: "trash" };
  }

  const tasks = await TaskModel.find(query).sort({ createdAt: -1 }).limit(200);
  res.json(tasks.map(formatTask));
});

router.post("/tasks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const task = await TaskModel.create({
    ...parsed.data,
    userId: req.userId,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
  });

  res.status(201).json(formatTask(task));
});

router.get("/tasks/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const task = await TaskModel.findOne({ _id: id, userId: req.userId });

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(task));
});

router.patch("/tasks/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await TaskModel.findOne({ _id: id, userId: req.userId });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.dueDate) {
    updateData["dueDate"] = new Date(parsed.data.dueDate);
  }

  // Track completion
  if (parsed.data.status === "done" && existing.status !== "done") {
    updateData["completedAt"] = new Date();
    await UserModel.findByIdAndUpdate(req.userId, { $inc: { tasksCompleted: 1 } });
    await awardXP(req.userId!, 20);
  }

  const task = await TaskModel.findByIdAndUpdate(id, updateData, { new: true });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(task));
});

router.delete("/tasks/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const task = await TaskModel.findOneAndDelete({ _id: id, userId: req.userId });

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/tasks/:id/trash", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const task = await TaskModel.findOneAndUpdate(
    { _id: id, userId: req.userId },
    { status: "trash" },
    { new: true }
  );

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(task));
});

router.patch("/tasks/:id/restore", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const task = await TaskModel.findOneAndUpdate(
    { _id: id, userId: req.userId, status: "trash" },
    { status: "todo" },
    { new: true }
  );

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(task));
});

export default router;
