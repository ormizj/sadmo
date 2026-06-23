# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Framework

This is **Next.js 16.2.9 / React 19.2.4**, App Router. As `AGENTS.md` warns, this version differs from training-data Next.js. Before writing framework code, read the relevant guide under `node_modules/next/dist/docs/` — especially `01-app/02-guides/upgrading/version-16.md` and `01-app/03-api-reference/01-directives/use-cache.md`. Confirm behavior against those docs rather than from memory.

## Commands

Package manager is **npm** (`package-lock.json`).

- `npm run dev` — dev server (Turbopack is the v16 default; no `--turbopack` flag)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (ESLint 9 flat config, `eslint.config.mjs`)

**No test runner is configured** — there is no `test` script and no jest/vitest/playwright setup. If a task needs tests, flag that one must be added; don't assume tests can be run.

## Architecture

- **App Router** under `src/app/` (`layout.tsx`, `page.tsx`, `globals.css`). Path alias `@/*` → `./src/*` (`tsconfig.json`, strict mode).
- **Tailwind CSS v4** via `@tailwindcss/postcss` (`postcss.config.mjs`); global styles use `@import "tailwindcss"` in `src/app/globals.css` with CSS-var theming. There is **no `tailwind.config.*`**.
- **React Compiler is enabled** (`reactCompiler: true` in `next.config.ts`, `babel-plugin-react-compiler`) — skip manual `useMemo`/`useCallback` micro-optimizations the compiler handles.
- Config lives in `next.config.ts` (TypeScript config file).

## Next.js 16 gotchas

These trip up assumptions from older Next.js:

- `params` and `searchParams` are **Promises** — `await` them (or `use()`); pages/layouts are typically `async`.
- Request APIs are **async**: `await cookies()`, `await headers()`, `await draftMode()`.
- Caching is **opt-in** via the `'use cache'` directive (+ `cacheLife`/`cacheTag` from `next/cache`). The old route-segment exports (`dynamic`, `revalidate`, `fetchCache`) are gone — dynamic is the default.
- Middleware is renamed: **`middleware.ts` → `proxy.ts`** (Node.js runtime; Edge not supported).
- **Turbopack is the default** bundler — a custom `webpack` config will break the build (use `--webpack` only as an escape hatch).
- `next/image` defaults changed (e.g. `qualities`, `minimumCacheTTL`, local-IP handling) — check the docs before relying on old defaults.
