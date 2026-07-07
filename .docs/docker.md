# Docker

Multi-stage `Dockerfile` (`deps` → `dev` / `builder` → `runner`) driven by a single
logical **`web`** service, layered across three Compose files (Docker's documented
base + override + prod convention):

- **`compose.yaml`** — base shared by every environment (the `web` service, build
  context, port `3000`).
- **`compose.override.yaml`** — development overrides (`dev` target, source
  bind-mount, `npm run dev`). **Auto-loaded** on a bare `docker compose up`.
- **`compose.prod.yaml`** — production overrides (`runner` target, `restart` policy),
  served from Next's standalone output (`node server.js`). Loaded **explicitly** via
  `-f compose.yaml -f compose.prod.yaml`.

Relies on `output: "standalone"` in `next.config.ts`.

## Why one `web` service + layered files

A service name is a **logical role** (`web`, `db`, `worker`) — never an environment.
Environment variance lives *outside* the name, in layered files. This is Docker's
documented convention:

- The default Compose file is `compose.yaml`; `docker-compose.yml` is legacy,
  backwards-compat only. Per-environment overrides follow `compose.<env>.yaml`.
- `compose.override.yaml` is a magic filename Compose reads automatically on a bare
  `docker compose up` — it is *the* documented home for dev-only tweaks.
- Production is deployed with an explicit file stack that excludes the dev override:
  `docker compose -f compose.yaml -f compose.prod.yaml up -d`.

Sources: [Compose application model](https://docs.docker.com/compose/intro/compose-application-model/) ·
[Merge Compose files](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/) ·
[Merge rules reference](https://docs.docker.com/reference/compose-file/merge/).

## How merging works

Compose builds the final config by deep-merging the loaded files in order, later
files winning. The rules differ by YAML type — this is what makes the layering safe:

- **Scalars** (`build.target`, `command`, `restart`) → later file **replaces**.
- **Mappings** (`build`, `environment`) → **merged** key-by-key.
- **Sequences** (`ports`, `volumes`) → **appended**, never replaced.

The base holds `ports` once so both environments inherit it; dev/prod each set only
their own `target` and extras.

## File-load permutations

| Files loaded | Effective `web` | Result |
|---|---|---|
| `compose.yaml` + `compose.override.yaml` *(auto, bare `up`)* | `target: dev`, bind mounts, `npm run dev` | **Dev** ✅ |
| `compose.yaml` + `compose.prod.yaml` *(explicit `-f`)* | `target: runner`, `restart: unless-stopped` | **Prod** ✅ |
| `compose.yaml` only | no `target` (builds Dockerfile's last stage, `runner`), no restart/mounts | bare, unmanaged ⚠️ |
| all three | prod wins scalars **but** dev `volumes` still append into the prod image | ❌ don't |

The last row is the reason prod is loaded with an explicit set that omits the
override, and why bare `docker compose down`/`logs` (which auto-load the dev
override) must not be run against a prod stack. Always go through the npm scripts.

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
`environment:` key in `compose.override.yaml` (dev) or `compose.prod.yaml` (prod).

## `NODE_ENV` vs deployment environment

Keep the two axes separate. `NODE_ENV` describes the **build mode** and Node only
recognises `development` / `production` / `test` — the Dockerfile sets it per stage
(`dev` → `development`, `builder`/`runner` → `production`). Never set
`NODE_ENV=staging`: a non-`production` value makes `npm install` pull devDependencies
and libraries fall back to dev behaviour. If a middle environment is ever added, name
it `compose.staging.yaml`, drive selection with a separate var (e.g. `APP_ENV=staging`),
and keep `NODE_ENV=production` for it.
