# Prisma

Database access for the app. We run **Prisma 7** against **Postgres** through the
**`pg` driver adapter** (no Rust query engine). The client is a `server-only`
singleton in `src/lib/db.ts`, the schema lives in `prisma/schema.prisma`, and all
CLI config (connection URL, seed command) lives in **`prisma.config.ts`** at the
repo root.

> **This is not the Prisma you know.** Prisma 7 moved several things that older
> guides and training data still put in `schema.prisma`. Read
> [Prisma 7 differences](#prisma-7-differences-read-this-first) before editing.

## Files

| File | Role |
|---|---|
| `prisma/schema.prisma` | Models + enums. Datasource has **only** `provider = "postgresql"` — **no `url`**. |
| `prisma.config.ts` | CLI config: datasource `url` (from `DATABASE_URL`), schema path, and the `migrations.seed` command. Loads `.env` via `process.loadEnvFile()`. |
| `src/lib/db.ts` | The `PrismaClient` singleton wired to `PrismaPg` (the `pg` adapter). Import `db` from here — never `new PrismaClient()` elsewhere. |
| `prisma/seed.ts` | Bootstraps the first `ADMIN` user from env. Run by `prisma db seed`. |
| `prisma/migrations/` | Generated SQL migrations — commit these. |

## Prisma 7 differences (read this first)

- **No `url` in `schema.prisma`.** The connection URL lives in `prisma.config.ts`
  (`datasource: { url: env("DATABASE_URL") }`). Putting `url = env(...)` back in the
  schema is a hard error (`P1012`).
- **Driver adapter, not an engine binary.** The client is constructed as
  `new PrismaClient({ adapter: new PrismaPg({ connectionString: ... }) })` using
  `@prisma/adapter-pg` + `pg`. Queries are compiled to SQL and run through `pg`, so
  there is **no query-engine binary** to ship.
- **`.env` is not auto-loaded.** Prisma 7 dropped automatic `.env` loading;
  `prisma.config.ts` calls `process.loadEnvFile()` (guarded) so CLI commands see it.
- **Seed command moved.** It's `migrations.seed` in `prisma.config.ts`
  (`"tsx prisma/seed.ts"`), **not** the old `prisma.seed` key in `package.json`.

## Commands

Wrapper scripts (preferred — they read `prisma.config.ts` automatically):

| Command | What it does |
|---|---|
| `npm run db:generate` | Generate the typed client into `node_modules/@prisma/client`. Run after changing the schema or a fresh install. |
| `npm run db:migrate` | Create + apply a dev migration from schema changes (`prisma migrate dev`). Prompts for a name; also regenerates the client and runs the seed. |
| `npm run db:deploy` | Apply already-committed migrations without generating new ones (`prisma migrate deploy`) — for CI / production. |
| `npm run db:seed` | Run `prisma/seed.ts` to upsert the bootstrap admin. Idempotent. |
| `npm run db:studio` | Open Prisma Studio (browser DB GUI) at http://localhost:5555. |

Raw CLI, when you need a flag the scripts don't expose:

| Command | What it does |
|---|---|
| `npx prisma migrate dev --name <name>` | Non-interactive migration with an explicit name. |
| `npx prisma migrate reset` | Drop, recreate, re-apply all migrations, and re-seed. **Destroys data.** |
| `npx prisma migrate status` | Show which migrations are applied vs pending. |
| `npx prisma db push` | Push the schema to the DB **without** a migration file — for throwaway prototyping only, not for shared schema changes. |
| `npx prisma validate` | Validate `schema.prisma` + `prisma.config.ts`. |
| `npx prisma format` | Format the schema file. |

## Local setup (first run)

The dev database (and a Mailpit mail sink) come from Compose — see
[docker/](../docker/general.md).

```bash
docker compose up -d db mailpit   # Postgres 17 on :5432, Mailpit UI on :8025
cp .env.example .env              # then fill in secrets
npm run db:migrate                # apply migrations to the fresh DB
npm run db:seed                   # create the first admin (from ADMIN_* env vars)
npm run dev
```

`docker compose down -v` drops the DB volume (wipes all data); omit `-v` to keep it.

## Environment variables

`DATABASE_URL` is read by both `prisma.config.ts` (CLI) and `src/lib/db.ts`
(runtime, via the validated `src/env.ts`). The `ADMIN_EMAIL` / `ADMIN_PASSWORD` /
`ADMIN_NAME` vars are consumed **only** by `prisma/seed.ts` through `process.env`,
so they are intentionally *not* in the app's runtime env schema. See `.env.example`
for the full list.

## Using the client

```ts
import { db } from "@/lib/db"; // server-only singleton

const user = await db.user.findUnique({ where: { email } });
```

`src/lib/db.ts` is `server-only`, so importing it from a Client Component fails at
build. Data access is centralised in the DAL (`src/lib/<domain>/data.ts`), which is
the only layer that touches `db` — components and Server Actions call the DAL, not
Prisma directly.

## Docker / standalone

`output: "standalone"` doesn't bundle the generated client automatically, so the
Dockerfile `builder` stage runs `npx prisma generate` before `next build`. Because
Prisma 7 has no engine binary, nothing else needs copying into the `runner` image.
Production migrations run as a separate step (`npm run db:deploy`), not at image
build time.
