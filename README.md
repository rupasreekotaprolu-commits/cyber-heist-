# Cyber Heist — The Digital Break-In

A small, production-oriented Next.js application for a five-level college CSE event. It uses PostgreSQL and Prisma as the authoritative source for timing, progress, scoring, questions, submissions, and the central leaderboard.

## What it includes

- Four-member team registration and Team ID/access-code sign-in.
- An organizer-configured, server-authoritative event timer.
- Five sequential challenge levels worth 330 total points, seeded from the database.
- Server-side answer checking, score calculation, level unlocking, and transaction protection for concurrent team submissions.
- A public centralized leaderboard with deterministic tie-breaking.
- Protected administrator login, event controls, team/submission views, CSV export, and question create/edit/delete/publish controls.

## Local setup

1. Create a PostgreSQL database. Neon is a convenient hosted option.
2. Copy `.env.example` to `.env` and fill in the database connection string and first administrator credentials.
3. Install and initialize:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`. Sign in as the organizer at `/admin/login`, review/publish questions, then start the event from the dashboard. Teams may register only while the event is in `DRAFT` status.

## Verification commands

```bash
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm build
```

## Deploying to Vercel + Neon

1. Create a Neon PostgreSQL project and copy its pooled or direct `DATABASE_URL` (SSL enabled).
2. Push this project to a Git repository and import it into Vercel.
3. In Vercel project settings, add `DATABASE_URL`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` for Production only. Do not expose any of them with a `NEXT_PUBLIC_` prefix.
4. Vercel runs `prisma generate`, `prisma migrate deploy`, the idempotent seed, and `next build` for each production deployment. Preview deployments do not touch the database.
5. Deploy in Vercel. Confirm `/admin/login`, publish the desired questions, and start the event only when teams are ready.

## Operational notes

- The production seed creates missing event, question, and administrator records but preserves existing questions and administrator credentials on later deployments.
- Event start is intentionally one-way. Ending the event immediately closes submissions; it does not reset a completed event.
- Team access codes are shown once at registration. Record them privately before leaving the confirmation screen.
