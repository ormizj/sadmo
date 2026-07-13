# Docker

Containerization for the app: **one multi-stage [`Dockerfile`](./dockerfile.md)**
builds every environment, **layered [Compose files](./compose.md)** decide which
stage runs where, and **[`.dockerignore`](./dockerignore.md)** keeps the build
context — and the final image — small. A single logical `web` service serves the
app on http://localhost:3000.

- [`dockerfile.md`](./dockerfile.md) — the multi-stage build
  (`base` → `deps` → `dev` / `builder` → `runner`).
- [`compose.md`](./compose.md) — how the base + override + prod Compose files layer
  into one `web` service, and which stage each environment targets.
- [`dockerignore.md`](./dockerignore.md) — what's excluded from the build context,
  and why.

## Commands

Scripts follow the de-facto npm convention `docker:<task>:<env>` — task first,
environment as the trailing variant (mirrors `build:dev` / `build:prod`).

| Command | What it does |
|---|---|
| `npm run docker:up:dev` | Build + run `web` in dev in the foreground (auto-loads the override; hot reload; Ctrl+C stops). |
| `npm run docker:up:prod` | Build + run `web` in production detached (background). |
| `npm run docker:down:dev` | Stop and remove the dev stack. |
| `npm run docker:down:prod` | Stop and remove the production stack. |
| `npm run docker:logs:dev` | Follow logs of the dev stack. |
| `npm run docker:logs:prod` | Follow logs of the production stack. |
| `npm run docker:build:prod` | Build the production image without starting anything. |

App serves on http://localhost:3000. Add env vars under the `web` service's
`environment:` key in `compose.override.yaml` (dev) or `compose.prod.yaml` (prod) —
see [compose.md](./compose.md).
