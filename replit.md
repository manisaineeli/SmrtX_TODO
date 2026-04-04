# SmrtX_TODO – AI Powered Productivity Operating System

## Overview

Full-stack SaaS productivity app built on a pnpm monorepo. Features task management, notes, Pomodoro timer, analytics, AI assistant, and gamification.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + Recharts + wouter
- **Backend**: Express 5 + MongoDB (Mongoose) + JWT (access + refresh tokens)
- **API contracts**: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- **Auth**: JWT stored in localStorage, injected via custom-fetch setAuthTokenGetter

## Architecture

```
artifacts/
  smrtx-todo/     # React + Vite frontend (port dynamic)
  api-server/     # Express 5 backend (port 8080, path /api)
  mockup-sandbox/ # Design sandbox

lib/
  api-spec/       # OpenAPI spec source of truth
  api-client-react/ # Generated React Query hooks
  api-zod/        # Generated Zod validation schemas
  db/             # Drizzle ORM (not used — MongoDB via Mongoose instead)
```

## Key Routes

### Frontend
- `/login` — sign in
- `/register` — sign up
- `/dashboard` — productivity hub with analytics
- `/tasks` — task CRUD with filters
- `/notes` — notes with pinning
- `/pomodoro` — focus timer + history
- `/analytics` — charts & stats
- `/ai` — SAII assistant + mood detection
- `/settings` — profile, badges, XP

### Backend API (all under `/api/`)
- `POST /api/auth/register` / `/api/auth/login` / `/api/auth/logout` / `/api/auth/refresh`
- `GET/PATCH /api/user/profile` + `GET /api/user/stats`
- `GET/POST /api/tasks` + `GET/PATCH/DELETE /api/tasks/:id` + trash/restore
- `GET /api/tasks/summary`
- `GET/POST /api/notes` + `GET/PATCH/DELETE /api/notes/:id` + pin
- `GET/POST /api/pomodoro/sessions`
- `GET /api/analytics/dashboard` + `/api/analytics/productivity`
- `POST /api/ai/chat` + `POST /api/ai/mood` + `GET /api/ai/suggest-tasks`

## Environment Variables

- `MONGODB_URI` — MongoDB Atlas connection string (secret)
- `SESSION_SECRET` — used as JWT access token secret fallback
- `JWT_ACCESS_SECRET` — JWT access token secret (optional, falls back to SESSION_SECRET)
- `JWT_REFRESH_SECRET` — JWT refresh token secret (optional)

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks + Zod schemas
- `pnpm --filter @workspace/api-server run build` — build the API server
- `pnpm run typecheck` — full typecheck across all packages

## Gamification

- XP awarded: +20 per task completed, +15 per pomodoro, +10 per first note
- Level = floor(xp / 100) + 1
- 10 badges: first_task, task_10, task_50, streak_3, streak_7, pomodoro_1, pomodoro_10, note_1, level_5, level_10

## Models (MongoDB/Mongoose)

- `User` — auth, profile, XP/level/streak/badges
- `Task` — title/desc/status/priority/tags/dueDate/userId
- `Note` — title/content/tags/pinned/color/userId
- `PomodoroSession` — duration/type/taskId/userId/completedAt
