# Dockerfile

A single multi-stage `Dockerfile` builds every environment. Stages layer top-to-bottom
so each reuses the one before it:

- **`base`** — pins `node:${NODE_VERSION}` and sets the `/app` working directory. Every
  other stage starts `FROM base`.
- **`deps`** — installs dependencies in isolation (`npm ci` against the lockfile).
- **`dev`** — development image: dev dependencies + hot reload (`npm run dev`).
- **`builder`** — compiles the app (`npm run build`) into Next's standalone output.
- **`runner`** — the final, minimal production image: `node server.js` as a non-root user.

Which stage a Compose run stops at is decided in the Compose files, not here — see
[`compose.md`](./compose.md).

## Reading the Dockerfile

Each instruction is one step in the recipe that produces an image:

- **`FROM node:${NODE_VERSION} AS base`** — the starting point. `FROM` grabs a base image
  to build on; `AS base` **names** this stage so later stages can start `FROM base`
  instead of re-pulling from the registry.
- **`WORKDIR /app`** — sets the working directory inside the image; subsequent commands
  run there.
- **`COPY package.json package-lock.json ./` → `RUN npm ci`** — dependency manifests are
  copied **first, on their own**, so the expensive `npm ci` layer is cached and only
  re-runs when the lockfile changes — not on every source edit.
- **`COPY . .`** (builder) — copies the rest of the source in, *after* deps, to preserve
  that cache boundary.
- **`EXPOSE 3000`** — documents the port the app listens on.
- **`CMD [...]`** — the default command a container runs: `npm run dev` in `dev`,
  `node server.js` in `runner`.

## Why multi-stage: `FROM base AS deps` and friends

`FROM base AS deps` does two things: it starts **from the earlier `base` stage** (not a
fresh registry pull), and it **names this stage `deps`**. Naming stages is what lets a
later stage copy files out of an earlier one and leave the rest behind.

The payoff is a small final image. Installing and compiling a modern app pulls in heavy
tooling (TypeScript, ESLint, the whole `node_modules` build chain) that the running app
never needs. Isolating that work in `deps`/`builder` means `runner` can copy **only** the
finished output and discard everything else:

- **`deps`** does the heavy `npm ci` once, cached independently of source changes.
- **`builder`** runs `npm run build`, turning React/TypeScript source into Next's
  optimized `.next` output.
- **`runner`** copies just the standalone server + static assets and starts it — no source,
  no dev tooling, non-root (`USER node`).

This `deps → builder → runner` shape is the standard flow for containerizing a Next.js
app, and it relies on `output: "standalone"` in `next.config.ts` to produce a
self-contained `server.js`.

## Why `runner` is never explicitly targeted

Nothing "invokes" the `runner` stage, yet it is what production ships. Two reasons:

- **It is the last stage.** A plain `docker build` with no target reads the file top to
  bottom and ends at the final stage — `runner`.
- **`COPY --from=builder` makes `builder` a prerequisite.** Even when a build targets
  `runner`, its `COPY --from=builder /app/.next/standalone ./` (and the other
  `--from=builder` copies) create a **build-graph dependency**. Docker's engine sees that
  `runner` needs `builder`'s output — which needs `deps` — so it runs `deps` and `builder`
  first automatically, in the background, then keeps only the copied files. You never
  target `builder` for production; `runner` pulls it in by dependency.

You only target a stage explicitly when you want the build to **stop early** (dev) or to
**pin the finish line** (prod) — both handled in [`compose.md`](./compose.md).

## `NODE_ENV` vs deployment environment

Keep the two axes separate. `NODE_ENV` describes the **build mode** and Node only
recognises `development` / `production` / `test` — the Dockerfile sets it per stage
(`dev` → `development`, `builder`/`runner` → `production`). Never set
`NODE_ENV=staging`: a non-`production` value makes `npm install` pull devDependencies
and libraries fall back to dev behaviour. If a middle environment is ever added, name
it `compose.staging.yaml`, drive selection with a separate var (e.g. `APP_ENV=staging`),
and keep `NODE_ENV=production` for it.
