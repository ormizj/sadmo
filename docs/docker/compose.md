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

## Named volumes: declaration vs. mount

A named volume shows up **twice**, and the two entries say different things — the
same split as declaring a variable vs. using it. Nothing is duplicated.

- **Declaration** — an entry under the **top-level** `volumes:` (aligned with
  `services:`, not indented under a service). This *defines* the volume: its
  identity, lifecycle, and any driver/options. The **YAML key is the logical
  name**; an empty value (just `key:`) means "all defaults". Declared once per
  volume, even if several services mount it.
- **Mount** — an entry in a **service's** `volumes:` list, written
  `SOURCE:TARGET`. This *attaches* a volume into one container. `SOURCE` is the
  logical name (matching a top-level key); `TARGET` is the absolute path inside
  the container where it appears.

```yaml
# compose.yaml
services:
  db:
    volumes:
      - pgdata:/var/lib/postgresql/data   # mount: use "pgdata" at this path
volumes:
  pgdata:                                  # declaration: "pgdata" exists
```

Key points:

- **Matched by name, not order.** `db`'s mount finds its volume by looking up the
  key `pgdata` in the top-level block — reordering the declarations changes
  nothing. The *name* carries no meaning to Docker; `next_cache:/app/.next`
  (in `compose.override.yaml`) mounts at `.next` because the **target path** says
  so, not because the volume is called `next_cache`. Renaming it to `banana`
  everywhere would behave identically; the readable name is purely for humans.
- **Docker scopes the name with the project.** The real volume Docker creates is
  `<project>_<key>` — `pgdata` → `sadmo_pgdata`, `next_cache` → `sadmo_next_cache`.
  The project name defaults to the directory name (`sadmo`) and can be overridden
  with `COMPOSE_PROJECT_NAME` or `docker compose -p`. The `sadmo_` prefix never
  appears in the files; Docker adds it at runtime, and it keeps these volumes from
  colliding with same-named volumes in other Compose projects. A `name:` field on
  the declaration opts out of this scoping (the name is then used as-is).
- **A mount with no matching declaration is an error.** Compose requires every
  named volume a service mounts to be declared up top; referencing an undeclared
  one is rejected as an undefined-volume config error. The top-level block is the
  allow-list of volumes services may name.
- **Bind mounts need no declaration.** `.:/app` (dev) is also `SOURCE:TARGET`, but
  its source is a **host path** (`.`, the project dir) rather than a name, so it's
  a *bind mount*. Docker manages no identity for it — there's nothing to declare —
  which is why only *named* volumes appear in the top-level block.

### Two different `volumes:` keys — don't confuse the merge behavior

The [merge rules](#how-merging-works) above list `volumes` under **sequences
(appended)** — that means the **service-level** mount *list*. The **top-level**
`volumes:` is a **mapping** and merges **key-by-key** instead. So across files:

- Base `compose.yaml` declares `pgdata` (mounted by `db`).
- `compose.override.yaml` declares `node_modules` and `next_cache` (mounted by
  the dev `web`).
- The merged top-level map is `{ pgdata, node_modules, next_cache }` — the
  override's keys are added to the base's, not replacing them.

Sources: [Top-level `volumes`](https://docs.docker.com/reference/compose-file/volumes/) ·
[Service `volumes` short syntax](https://docs.docker.com/reference/compose-file/services/) ·
[Merge rules reference](https://docs.docker.com/reference/compose-file/merge/).

## `target`: which stage each environment stops at

`build.target` tells Compose to **stop the build at a named [Dockerfile stage](./dockerfile.md)**
instead of running the file to its end. This is how one Dockerfile serves both
environments:

- **Dev** (`compose.override.yaml`) → `target: dev`. Stops at the `dev` stage, which keeps
  dev dependencies and runs `npm run dev`. The bind-mount (`.:/app`) plus
  `WATCHPACK_POLLING=true` give hot reload against your local source.
- **Prod** (`compose.prod.yaml`) → `target: runner`. Builds through to the final,
  minimal `runner` image (`node server.js`).

Stage names (`dev`, `runner`) and environment names (`dev`, `prod`) are separate
axes that don't have to line up — see
[Two naming axes](./general.md#two-naming-axes--why-dev-matches-but-prod-doesnt).

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
as prerequisites. See [Why `builder` is never explicitly targeted](./dockerfile.md#why-builder-is-never-explicitly-targeted).

## File-load permutations

| Files loaded | Effective `web` | Result |
|---|---|---|
| `compose.yaml` + `compose.override.yaml` *(auto, bare `up`)* | `target: dev`, bind mounts, `npm run dev` | **Dev** ✅ |
| `compose.yaml` + `compose.prod.yaml` *(explicit `-f`)* | `target: runner`, `restart: unless-stopped` | **Prod** ✅ |
| `compose.yaml` only | no `target` (builds Dockerfile's last stage, `runner`), no restart/mounts | bare, unmanaged ⚠️ |
| all three | prod wins scalars **but** dev `volumes` still append into the prod image | ❌ don't |

The last row is the reason prod is loaded with an explicit set that omits the
override, and why bare `docker compose down`/`logs` (which auto-load the dev
override) must not be run against a prod stack. Always go through the
[npm scripts](./general.md#commands).
