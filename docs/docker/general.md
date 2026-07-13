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

## Two naming axes — why `dev` matches but `prod` doesn't

Stage names and environment names are **different things and don't have to line
up**:

- **Dockerfile stage** = a *build role* (`base`, `deps`, `dev`, `builder`,
  `runner`). `runner`/`builder` is the canonical Next.js naming.
- **Compose file / npm-script suffix** = a *deployment environment* (`dev`, `prod`).

The `dev` **stage** sharing a token with the `dev` **environment** is a
coincidence, not a rule — which is why `prod` maps to the `runner` stage, not a
stage called `prod`. The mapping is not 1:1 either: a future `compose.staging.yaml`
would target `runner` too, since staging runs the production image.

| Axis | Dev | Prod |
|---|---|---|
| Dockerfile stage (`AS …`) — a **build role** | `dev` | `runner` |
| Compose file — a **deployment env** | `compose.override.yaml` | `compose.prod.yaml` |
| `build.target` | `dev` | `runner` |
| npm script suffix — **env** | `:dev` | `:prod` |

The uniform `dev` column and the split `prod`/`runner` column are the same fact
seen twice: only the *environment* axis uses `prod`; the *build-role* axis calls
that image `runner`.

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
