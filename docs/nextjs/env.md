# Environment variables

App-runtime env vars live in a single validated module:
[`src/env.ts`](../../src/env.ts). It uses **[`@t3-oss/env-nextjs`](https://env.t3.gg)**
to run each var through a **Zod** schema at boot, so misconfigured environments
fail fast — the server refuses to start rather than serving requests with an
`undefined` secret. Everywhere else in the app reads its config via
`import { env } from "@/env"`; **`process.env.X` is never read directly** outside
the schema.

> **This does not replace `.env` loading.** Next.js still loads `.env` /
> `.env.local` at dev/build time; the schema in `src/env.ts` only reads from the
> `process.env` values Next.js has already populated. See the
> [Next.js env-vars guide](https://nextjs.org/docs/app/guides/environment-variables).

## The moving parts

| File | Role |
|---|---|
| [`src/env.ts`](../../src/env.ts) | Zod schema + `runtimeEnv` wiring. The single source of truth for app-runtime env; import `env` from here. Marked `import "server-only"`. |
| [`.env.example`](../../.env.example) | Canonical list of every var the app expects, with inline hints. Copy to `.env` for local dev. Gitignored — see [`docker/dockerignore.md`](../docker/dockerignore.md). |
| `.env` (local, gitignored) | Real values in local dev. Loaded automatically by Next.js at dev/build time. |
| [`prisma.config.ts`](../../prisma.config.ts) | Reads `DATABASE_URL` directly for the Prisma CLI (`migrate`, `seed`, …) — runs before Next.js boots, so it can't go through `src/env.ts`. |
| [`prisma/seed.ts`](../../prisma/seed.ts) | Reads `ADMIN_*` directly via `process.env`. Deliberately outside the app schema — see [Vars outside the app schema](#vars-outside-the-app-schema). |
| [`compose.yaml`](../../compose.yaml) | In Docker, vars reach the container via the `environment:` key on each service. `.env*` is never baked into the image — see [`docker/dockerignore.md`](../docker/dockerignore.md). |

## The three blocks in `src/env.ts`

`createEnv` takes three objects. The first two are **schemas** (declaration +
validation); the third is **wiring** (where each value comes from).

| Block | Role | One-liner |
|---|---|---|
| `server` | Zod schema for **server-only** vars. Declaration + validation. | shape check + "hide from browser" |
| `client` | Zod schema for **browser-exposed** vars (`NEXT_PUBLIC_`-prefixed). Declaration + validation. | shape check + "publish to browser" |
| `runtimeEnv` | Plain object mapping each key to a literal `process.env.X`. The **source** that both schemas validate against. | a manifest of `process.env.X` reads |

The flow at import time:

```
runtimeEnv  ──▶  Zod validates against server + client  ──▶  typed `env` object
                                    │
                                    └── on failure: throw at import → server refuses to boot
```

So `server`/`client` answer *"which vars exist, what shape must they have, and
who can see them?"*, while `runtimeEnv` answers *"where do the values come
from?"* — always `process.env.X` written out literally.

## Why `runtimeEnv` is spelled out

At first glance `runtimeEnv` looks redundant — every entry is just
`KEY: process.env.KEY`. It exists because of how Next.js compiles env-var reads:

- Next.js **statically replaces** literal `process.env.FOO` expressions at build
  time — but only when the *literal string* `process.env.FOO` appears in source.
- A dynamic expression like `process.env[key]` can't be statically inlined and
  would be `undefined` on the client (and unpredictable on the server).
- So the library can't loop over the schema keys internally; it needs you to
  write out each `process.env.X` **as a source-code literal** somewhere. That
  somewhere is `runtimeEnv`.

```ts
// src/env.ts (shape only)
export const env = createEnv({
  server: { DATABASE_URL: z.url() /* … */ },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL, // ← literal — bundler inlines this
    // …
  },
});
```

## `server` vs. `client` — visibility and validation

The `env` object behaves **asymmetrically** across the server/client boundary:

| From | Reads `server` vars | Reads `client` vars |
|---|---|---|
| Server Component / Server Function / DAL | ✅ | ✅ |
| Client Component (browser) | ❌ throws a deliberate error | ✅ |

- **Server vars** are hidden from the browser. Accessing `env.SESSION_SECRET`
  from a `'use client'` module throws — the leak guard is deliberate.
- **Client vars** are readable **from both sides**. They *must* start with
  `NEXT_PUBLIC_` (the library's default `clientPrefix` for `env-nextjs`); mixing
  the prefix and the block is a boot error either way.

| Do | Don't |
|---|---|
| `server: { API_KEY: z.string() }` | `server: { NEXT_PUBLIC_API_KEY: z.string() }` — server block rejects the prefix. |
| `client: { NEXT_PUBLIC_APP_URL: z.url() }` | `client: { APP_URL: z.url() }` — client block requires the prefix. |

Env-var stripping is the second guard: any non-`NEXT_PUBLIC_` `process.env.X`
that survives into a client bundle is replaced with `""` at build time — see
[`directives.md` § Keep secrets server-only](./directives.md#keep-secrets-server-only-with-server-only).

> **`client` vars are public.** They're baked into the JavaScript shipped to
> browsers — anyone can view-source them. Don't put anything sensitive under
> `client` just because it's also readable server-side.

## Fail-fast on boot

Validation runs the moment `src/env.ts` is imported. Anything wrong stops the
process immediately:

- Missing key in `runtimeEnv` → `undefined` reaches Zod → validation error →
  `createEnv` re-throws with an `❌ Invalid environment variables` message.
- Wrong shape (e.g. `SMTP_PORT` unset when the schema wants
  `z.coerce.number().int().positive()`) → same path.
- Key present in `runtimeEnv` but missing from both schemas — or vice versa —
  → library flags the mismatch at boot.

Because `src/env.ts` is imported by every module that touches secrets or
external services — [`src/lib/db.ts`](../../src/lib/db.ts),
[`src/lib/auth/session.ts`](../../src/lib/auth/session.ts),
[`src/lib/email/mailer.ts`](../../src/lib/email/mailer.ts),
[`src/lib/email/invites.ts`](../../src/lib/email/invites.ts) — the failure
cascades and the server never serves a request. This is intentional: a hard
boot error is strictly better than an `env.EMAIL_FROM === undefined` sneaking
into a request-time code path.

> **A key must appear in all three places** to work end-to-end — `.env.example`
> (documentation), the schema (`server` or `client`), and `runtimeEnv`
> (wiring). Missing any one is a boot error or a leak.

## `import "server-only"`

Line 1 of `src/env.ts` is `import "server-only"`. If the file is ever pulled
into a client module graph — an accidental `import { env } from "@/env"` in a
`'use client'` module, or transitively via a shared component — the **build
fails**. That backstop guarantees no server var can leak, even if a `client`
var ever gets added alongside them. See
[`directives.md` § Keep secrets server-only](./directives.md#keep-secrets-server-only-with-server-only).

## Vars outside the app schema

Not every env var in this repo goes through `src/env.ts`. The rule is: **the
app schema is the app's runtime contract**. Vars consumed only by CLI tooling
(seed scripts, Prisma CLI) stay out of it deliberately.

| Var | Read by | Why not in `src/env.ts` |
|---|---|---|
| `DATABASE_URL` | `src/env.ts` (app) **and** `prisma.config.ts` (CLI) | It *is* in the app schema — but Prisma's CLI runs before Next.js boots, so it also reads `DATABASE_URL` directly via `process.loadEnvFile()`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | [`prisma/seed.ts`](../../prisma/seed.ts) only | Consumed by the one-shot seed script via `process.env`. Never used at request time, so adding them to the app's runtime contract would just require them in prod for no reason. |

See [`prisma/general.md` § Environment variables](../prisma/general.md#environment-variables)
for the Prisma-side view of the same split.

## Adding a variable

1. Add it to [`.env.example`](../../.env.example) with a short comment describing what it's for.
2. Add a Zod entry under `server` in [`src/env.ts`](../../src/env.ts) — or under `client` if the browser needs it (must be `NEXT_PUBLIC_`-prefixed).
3. Add the wiring line under `runtimeEnv`: `KEY: process.env.KEY`.
4. If running in Docker, add it to the appropriate service's `environment:` block in [`compose.yaml`](../../compose.yaml).
5. Restart the dev server — the schema is read once at boot; changes to `src/env.ts` don't hot-reload.
6. Read it via `import { env } from "@/env"`. Never `process.env.KEY` directly in app code.

> **Never read `process.env.X` directly in app code.** It bypasses the schema,
> loses the type, and — for anything not `NEXT_PUBLIC_`-prefixed reached from
> the client — gets silently replaced with `""`, turning a config problem into
> a runtime request failure with no error trail.
