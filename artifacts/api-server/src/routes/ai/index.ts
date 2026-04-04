import { Router } from "express";
import { requireAuth, type AuthRequest } from "../../middleware/auth";
import { TaskModel } from "../../models/Task";
import { AiChatBody } from "@workspace/api-zod";

const router = Router();

const MOOD_SUGGESTIONS: Record<string, string> = {
  happy: "You're in a great mood! Tackle your most challenging tasks now while energy is high.",
  focused: "You're in a focused state — perfect for deep work. Block distractions and dive in.",
  tired: "Low energy detected. Try a short break, a pomodoro session, or handle easy tasks first.",
  stressed: "Take a breath. Break your work into smaller chunks and start with quick wins.",
  neutral: "Balanced state — good for both planning and execution. Pick any task and begin.",
};

const MOOD_LIST = ["happy", "focused", "tired", "stressed", "neutral"] as const;

function detectMoodFromInput(input: string): (typeof MOOD_LIST)[number] {
  const lower = input.toLowerCase();
  if (lower.includes("happy") || lower.includes("great") || lower.includes("good")) return "happy";
  if (lower.includes("focus") || lower.includes("concentrat")) return "focused";
  if (lower.includes("tired") || lower.includes("sleep") || lower.includes("exhaust")) return "tired";
  if (lower.includes("stress") || lower.includes("anxious") || lower.includes("overwhelm")) return "stressed";
  // Otherwise pick a slightly randomized based on hash
  const hash = input.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return MOOD_LIST[hash % MOOD_LIST.length]!;
}

function generateAiResponse(message: string): {
  message: string;
  action: string | null;
  actionData: Record<string, unknown> | null;
} {
  const lower = message.toLowerCase();

  // Command detection
  if (lower.includes("add task") || lower.includes("create task") || lower.includes("new task")) {
    const titleMatch = message.match(/(?:add|create|new)\s+task[:\s]+(.+)/i);
    const title = titleMatch?.[1]?.trim() || "New task";
    return {
      message: `I'll create a task called "${title}" for you right away.`,
      action: "create_task",
      actionData: { title, priority: "medium" },
    };
  }

  if (lower.includes("pomodoro") || lower.includes("focus") || lower.includes("timer")) {
    return {
      message:
        "Ready to focus? Head to the Pomodoro page to start a 25-minute deep work session. Consistent focus sessions are the key to high productivity.",
      action: "navigate",
      actionData: { path: "/pomodoro" },
    };
  }

  if (lower.includes("tasks") || lower.includes("todo") || lower.includes("to-do")) {
    return {
      message:
        "Let me show you your task board. You can filter by priority, tag, or status to find what needs attention most.",
      action: "navigate",
      actionData: { path: "/tasks" },
    };
  }

  if (lower.includes("note") || lower.includes("write")) {
    return {
      message:
        "Notes are great for capturing ideas. Head to the Notes section to create a new one — you can add tags and pin important ones.",
      action: "navigate",
      actionData: { path: "/notes" },
    };
  }

  if (lower.includes("analytics") || lower.includes("progress") || lower.includes("stats")) {
    return {
      message:
        "Your analytics dashboard shows your productivity trends, focus time, and task completion rates over the past 30 days.",
      action: "navigate",
      actionData: { path: "/analytics" },
    };
  }

  if (lower.includes("streak") || lower.includes("badge") || lower.includes("xp") || lower.includes("level")) {
    return {
      message:
        "Check your Settings page to see your XP, level, streak, and all available badges. Keep completing tasks and pomodoros to unlock more!",
      action: "navigate",
      actionData: { path: "/settings" },
    };
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return {
      message:
        "Hello! I'm SAII, your AI productivity assistant. I can help you create tasks, navigate the app, track your progress, or suggest what to work on next. What would you like to do?",
      action: null,
      actionData: null,
    };
  }

  if (lower.includes("help") || lower.includes("what can you do")) {
    return {
      message:
        "I can help you:\n• Create tasks — just say 'add task: [title]'\n• Navigate to any section — Tasks, Notes, Pomodoro, Analytics\n• Check your stats and badges\n• Suggest what to work on\n• Track your mood and energy level\n\nWhat would you like to do?",
      action: null,
      actionData: null,
    };
  }

  if (lower.includes("suggest") || lower.includes("what should i") || lower.includes("prioritize")) {
    return {
      message:
        "Based on productivity research, start with your highest-priority tasks in the morning when focus is sharpest. Use pomodoros to stay in flow, and save lighter tasks for the afternoon. Check your task summary for overdue items that need attention first.",
      action: "navigate",
      actionData: { path: "/tasks" },
    };
  }

  // Default intelligent response
  const responses = [
    "That's a great question. I'd recommend breaking this into smaller steps and tackling the most important one first. Would you like me to create some tasks for you?",
    "Productivity is about consistent small wins. Focus on one task at a time — use the Pomodoro timer to stay on track. What's your top priority right now?",
    "I'm here to help you stay organized and focused. Try starting with a quick 5-minute planning session to list your top 3 priorities for today.",
    "Great systems beat motivation every time. Make sure your tasks have clear priorities and due dates so nothing falls through the cracks.",
    "Deep work requires eliminating distractions. Consider using Focus Mode in the Pomodoro section to block out interruptions for your next session.",
  ];

  const idx = message.length % responses.length;
  return {
    message: responses[idx]!,
    action: null,
    actionData: null,
  };
}

router.post("/ai/chat", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const response = generateAiResponse(parsed.data.message);
  res.json(response);
});

router.post("/ai/mood", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  // Mock mood detection — in production this would call a vision AI model
  const moods = ["happy", "focused", "tired", "stressed", "neutral"] as const;
  const randomMood = moods[Math.floor(Math.random() * moods.length)]!;
  const confidence = 0.6 + Math.random() * 0.35;

  res.json({
    mood: randomMood,
    confidence: Math.round(confidence * 100) / 100,
    suggestion: MOOD_SUGGESTIONS[randomMood],
  });
});

router.get("/ai/suggest-tasks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  // Get user's existing tasks for context
  const pendingTasks = await TaskModel.find({
    userId: req.userId,
    status: { $in: ["todo", "in_progress"] },
  })
    .sort({ priority: -1 })
    .limit(5);

  const hasPendingHigh = pendingTasks.some(
    (t) => t.priority === "high" || t.priority === "urgent"
  );

  const suggestions = [
    {
      title: "Review and prioritize your task list",
      priority: "high",
      reason: "Regular triage keeps your backlog manageable and ensures important work stays visible.",
    },
    {
      title: "Complete a 25-minute deep work session",
      priority: "medium",
      reason: "A focused pomodoro session now will help you build momentum for the rest of the day.",
    },
    {
      title: "Write a brief daily reflection note",
      priority: "low",
      reason: "Reflection improves planning quality and helps identify patterns in your productivity.",
    },
  ];

  if (hasPendingHigh) {
    suggestions.unshift({
      title: "Address high-priority outstanding tasks",
      priority: "urgent",
      reason: `You have ${pendingTasks.filter((t) => t.priority === "high" || t.priority === "urgent").length} high-priority tasks pending. Focus here first.`,
    });
  }

  const now = new Date();
  const hour = now.getHours();
  if (hour >= 14 && hour < 17) {
    suggestions.push({
      title: "Do a mid-day review of your progress",
      priority: "medium",
      reason: "Afternoon check-ins help you course-correct and finish strong for the day.",
    });
  }

  res.json(suggestions.slice(0, 4));
});

export default router;
