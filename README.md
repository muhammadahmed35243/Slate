# Slate: AI Front Desk

CS-301 L Full Stack Web Development Lab, Air University, Fall 2026.

| Part | Tech | Folder |
|---|---|---|
| Frontend | Next.js (App Router, JavaScript, Tailwind) | `client/` |
| Backend API | Node + Express | `server/` |
| Database / Auth / Storage | Supabase (Postgres + RLS) | `supabase/` |

## Setup

```bash
npm install                 # installs client + server (npm workspaces)
```

1. Copy `server/.env.example` to `server/.env` and fill in the Supabase URL, the publishable key and the **secret** key. The secret key is server-only and must never be committed.
2. Copy `client/.env.example` to `client/.env.local` and fill in the Supabase URL and the **publishable** key.
3. In the Supabase dashboard, open the SQL Editor and run the migrations in order: `supabase/migrations/001_schema.sql`, `001b_grants.sql`, `002_rls.sql`, `003_triggers.sql`, `004_storage.sql`, then `supabase/seed.sql`.

## Run

```bash
npm run dev                 # API on :5000, web on :3000
npm run db:check -w server  # verify Supabase keys + schema
npm test                    # server tests
```

Health check: `GET http://localhost:5000/api/health`

## Team workflow
- Branch per Jira ticket: `feat/KAN-<n>-<topic>`.
- Commit messages start with the key, e.g. `KAN-12: add leads state machine`.
- Push daily, open a PR into `main`, and get 1 review before merging.
