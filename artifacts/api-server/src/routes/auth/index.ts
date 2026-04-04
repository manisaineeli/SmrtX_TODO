import { Router } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../../models/User";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import type { IUser } from "../../models/User";

const router = Router();

const ACCESS_SECRET =
  process.env["JWT_ACCESS_SECRET"] ||
  process.env["SESSION_SECRET"] ||
  "smrtx_access_secret";
const REFRESH_SECRET =
  process.env["JWT_REFRESH_SECRET"] || "smrtx_refresh_secret";

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

function formatUser(user: IUser) {
  return {
    id: (user._id as { toString(): string }).toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    theme: user.theme,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const user = await UserModel.create({ name, email, password });
  const { accessToken, refreshToken } = generateTokens(
    (user._id as { toString(): string }).toString()
  );

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    accessToken,
    user: formatUser(user),
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const user = await UserModel.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const { accessToken, refreshToken } = generateTokens(
    (user._id as { toString(): string }).toString()
  );

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,
    user: formatUser(user),
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.cookies["refreshToken"] as string | undefined;
  if (token) {
    await UserModel.findOneAndUpdate(
      { refreshToken: token },
      { refreshToken: null }
    );
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const token = req.cookies["refreshToken"] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as { userId: string };
    const user = await UserModel.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(decoded.userId);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: formatUser(user),
    });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

export default router;
