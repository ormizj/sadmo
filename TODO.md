# TODO — Sadmo CRM

Roadmap for the Next.js 16 / React 19 app. Recommended libraries are **suggestions**, not locked decisions — see "Decisions to confirm" at the bottom.

**Status:** `[ ]` not started · `[~]` partial · `[x]` done

---

## 1. Implement i18n

- [ ] Choose library — recommended **next-intl** (App Router-native, plays well with v16 async `params` / RSC). Alternative: `i18next`.
- [ ] Decide locale routing strategy: path prefix (`/en`, `/fr`) vs cookie/header-based.
- [ ] Add `messages/<locale>.json` translation files + a default locale and fallback.
- [ ] Wire the locale provider into the `(app)` and `(guest)` layouts.
- [ ] Add formatting helpers (dates/numbers/currency) and extract existing hardcoded strings.

## 2. Component dev page

- [ ] Add a lightweight in-app route (e.g. `/dev/components`) gated to non-production.
- [ ] Render each `src/components/ui` component (`Button`, `TextField`, `Logo`) with all variants/states.
- [ ] Keep it as the single place to eyeball components; note **Storybook** as the heavier alternative if true isolation is needed later.

## 3. Designs → font + dark/light mode enforcement

> Already in place: Geist Sans/Mono via `next/font/google` in `src/app/layout.tsx`; CSS-var theming in `src/app/globals.css` with `@media (prefers-color-scheme: dark)`. Missing: runtime toggle, class-based dark strategy.

- [ ] Review the designs and confirm the font scale/weights match.
- [ ] Switch dark mode to a `class`-based strategy and add a **next-themes** provider for a runtime toggle (currently OS-preference only).
- [ ] Build a theme toggle UI control.
- [ ] Ensure all design tokens (`--background`, `--foreground`, brand vars) are defined for both light and dark.

## 4. .env and env handler

- [ ] Add `.env.example` and confirm `.env*` is gitignored.
- [ ] Add typed, validated env handling — recommended **@t3-oss/env-nextjs + zod** (server/client separation).
- [ ] Define the schema in `src/env.ts` (or `src/lib/env.ts`) and import it at a boundary so the build fails on missing/invalid vars.
- [ ] Document all required keys.

## 5. Database connection (Prisma)

- [ ] Install and `prisma init` (recommended ORM — "relatively official").
- [ ] Point the datasource at an env var (ties to #4).
- [ ] Define `schema.prisma` with initial models.
- [ ] Add a singleton `PrismaClient` in `src/lib/db.ts` guarded against dev hot-reload re-instantiation.
- [ ] Establish the migration workflow (`prisma migrate dev`).

## 6. Redis support

- [ ] Choose a client — **ioredis** for a self-hosted Redis, or **@upstash/redis** if serverless/Vercel.
- [ ] Add a singleton client in `src/lib/redis.ts`, env-driven, with the same dev hot-reload guard as #5.
- [ ] Decide intended uses (cache / sessions / rate-limiting) and add the env keys.

## 7. Optimize Claude instructions

- [ ] Keep the Next.js 16 gotchas in `CLAUDE.md` / `AGENTS.md` current.
- [ ] Document the new `src/lib/` conventions (db & redis singletons, env import boundary).
- [ ] Add conventions for i18n messages, theming tokens, and the component dev page so future agent work follows established patterns.

---

## Decisions to confirm

| Item | Recommended | Alternatives |
|------|-------------|--------------|
| i18n | next-intl | i18next |
| Theme toggle | next-themes (class strategy) | hand-rolled provider |
| Env validation | @t3-oss/env-nextjs + zod | zod only / valibot |
| ORM | Prisma | Drizzle |
| Redis client | ioredis | @upstash/redis |

Suggested dependency order: **#4 (env) → #5 (db) & #6 (redis) → #1 (i18n) / #3 (theming) → #2 (dev page) → #7 (docs)**, since db/redis/i18n all consume validated env, and the dev page benefits from finalized components.
