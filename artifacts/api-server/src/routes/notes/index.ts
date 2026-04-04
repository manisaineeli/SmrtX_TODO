import { Router } from "express";
import mongoose from "mongoose";
import { NoteModel } from "../../models/Note";
import { UserModel } from "../../models/User";
import { requireAuth, type AuthRequest } from "../../middleware/auth";
import { CreateNoteBody, UpdateNoteBody, GetNotesQueryParams } from "@workspace/api-zod";

const router = Router();

function formatNote(note: {
  _id: { toString(): string };
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  color: string | null;
  userId: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: note._id.toString(),
    title: note.title,
    content: note.content,
    tags: note.tags,
    pinned: note.pinned,
    color: note.color,
    userId: note.userId.toString(),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

router.get("/notes", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = GetNotesQueryParams.safeParse(req.query);
  const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(req.userId) };

  if (parsed.success) {
    const { search, tag, pinned } = parsed.data;
    if (search) {
      query["$or"] = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }
    if (tag) query["tags"] = tag;
    if (pinned !== undefined) query["pinned"] = pinned === "true";
  }

  const notes = await NoteModel.find(query).sort({ pinned: -1, updatedAt: -1 });
  res.json(notes.map(formatNote));
});

router.post("/notes", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const note = await NoteModel.create({ ...parsed.data, userId: req.userId });

  // Award badge for first note
  const user = await UserModel.findById(req.userId);
  if (user && !user.badges.includes("note_1")) {
    user.badges.push("note_1");
    user.xp += 10;
    await user.save();
  }

  res.status(201).json(formatNote(note));
});

router.get("/notes/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const note = await NoteModel.findOne({ _id: id, userId: req.userId });

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(formatNote(note));
});

router.patch("/notes/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const note = await NoteModel.findOneAndUpdate(
    { _id: id, userId: req.userId },
    parsed.data,
    { new: true }
  );

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(formatNote(note));
});

router.delete("/notes/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const note = await NoteModel.findOneAndDelete({ _id: id, userId: req.userId });

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/notes/:id/pin", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const note = await NoteModel.findOne({ _id: id, userId: req.userId });

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  note.pinned = !note.pinned;
  await note.save();

  res.json(formatNote(note));
});

export default router;
