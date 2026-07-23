# Next.js

Next.js 16 conventions specific to this app — the places where the framework
differs from older Next.js and where our `src/` wiring needs explaining. The
headline v16 rename is **`middleware.ts` → [`proxy.ts`](./proxy.md)** (Node.js
runtime; Edge unsupported).

- [`proxy.md`](./proxy.md) — the proxy (the renamed middleware), what its
  `matcher` excludes, and how its one line of `next-intl` drives all locale
  routing.
- [`directives.md`](./directives.md) — the `'use client'` / `'use server'`
  directives and Server Components: where each runs, how prerender + hydration
  work, and safely using browser APIs.
- [`env.md`](./env.md) — the `src/env.ts` env-var schema, `runtimeEnv` wiring,
  and the `server` / `client` visibility split.
