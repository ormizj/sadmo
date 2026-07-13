# Compose

A single logical **`web`** service is layered across three Compose files (Docker's
documented base + override + prod convention). Each file sets which
[Dockerfile stage](./dockerfile.md) the build targets and its environment-specific extras:

- **`compose.yaml`** — base shared by every environment (the `web` service, build
  context, port `3000`).
- **`compose.override.yaml`** — development overrides (`target: dev`, source bind-mount,
  `npm run dev`). **Auto-loaded** on a bare `docker compose up`.
- **`compose.prod.yaml`** — production overrides (`target: runner`, `restart` policy),
  served from Next's standalone output (`node server.js`). Loaded **explicitly** via
  `-f compose.yaml -f compose.prod.yaml`.

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

## `target`: which stage each environment stops at

`build.target` tells Compose to **stop the build at a named [Dockerfile stage](./dockerfile.md)**
instead of running the file to its end. This is how one Dockerfile serves both
environments:

- **Dev** (`compose.override.yaml`) → `target: dev`. Stops at the `dev` stage, which keeps
  dev dependencies and runs `npm run dev`. The bind-mount (`.:/app`) plus
  `WATCHPACK_POLLING=true` give hot reload against your local source.
- **Prod** (`compose.prod.yaml`) → `target: runner`. Builds through to the final,
  minimal `runner` image (`node server.js`).

### Two naming axes — why `dev` matches but `prod` doesn't

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

### Why prod sets `target: runner` explicitly

`runner` is already the last stage, so a build with no target would end there anyway —
yet naming it explicitly is deliberate:

- **Future-proofing.** If someone later appends a stage *below* `runner` (say a `test`
  stage for CI), an unset target would silently run to the new bottom stage and ship the
  wrong image. Pinning `target: runner` guarantees production always gets the intended
  stage, no matter what is added.
- **Explicitness.** The dev override already names its target (`dev`); naming `runner` in
  prod keeps both files symmetric and leaves zero ambiguity for the next reader.

### Who runs `builder`, then?

Neither Compose file targets `builder` — but production still runs it. In **dev**, Compose
stops at `dev`. In **prod**, Compose targets `runner`, and because `runner` copies from it
(`COPY --from=builder …`), Docker's build engine runs `builder` (and `deps`) automatically
as prerequisites. See [Why `runner` is never explicitly targeted](./dockerfile.md#why-runner-is-never-explicitly-targeted).

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
