---
title: Docker lifecycle — dev vs prod
depicts: full up-to-serving lifecycle for both environments, shared base vs per-env divergence
commit: 307c7d9
date: 2026-07-15
kind: mermaid
---

```mermaid
flowchart TB
    subgraph DEV["DEV · npm run docker:up:dev"]
        direction TB
        DC["docker compose up --build<br/>auto-loads compose.yaml + compose.override.yaml"]
        Ddb["db · postgres:17<br/>healthcheck: pg_isready"]
        Dmig["migrate · migrator stage<br/>build: prisma generate<br/>run: migrate deploy && db seed"]
        Dweb["web · dev stage<br/>bind-mount .:/app + anon node_modules/.next<br/>runtime: prisma generate && npm run dev<br/>hot reload · :3000"]
        Dmail["mailpit · DEV ONLY<br/>email sink · :8025 / :1025"]
        DC ==> Ddb == "healthy" ==> Dmig == "completed" ==> Dweb
        DC -. "parallel" .-> Dmail
    end

    subgraph PROD["PROD · npm run docker:up:prod"]
        direction TB
        PC["docker compose -f compose.yaml -f compose.prod.yaml<br/>up -d --build · explicit files, detached"]
        Pdb["db · postgres:17<br/>healthcheck: pg_isready"]
        Pmig["migrate · migrator stage<br/>build: prisma generate<br/>run: migrate deploy && db seed"]
        Pweb["web · runner stage<br/>prebuilt .next/standalone · node server.js<br/>restart: unless-stopped · no bind mounts · :3000"]
        PC ==> Pdb == "healthy" ==> Pmig == "completed" ==> Pweb
    end

    classDef shared fill:#fef3c7,stroke:#d97706,color:#000;
    classDef devcol fill:#dcfce7,stroke:#16a34a,color:#000;
    classDef prodcol fill:#dbeafe,stroke:#2563eb,color:#000;
    class Ddb,Dmig,Pdb,Pmig shared;
    class Dweb,Dmail devcol;
    class Pweb prodcol;
```

Two environments, one shared spine. The **amber** `db` + `migrate` services come from
the base `compose.yaml` and are **identical** in both — Postgres 17 with a `pg_isready`
healthcheck (`compose.yaml:35-49`), then the one-shot `migrate` service (`migrator`
stage) that runs `prisma migrate deploy && prisma db seed` (`Dockerfile:14-19`). The
ordering is enforced by `depends_on` conditions: `migrate` waits for `db` **healthy**,
and `web` waits for `migrate` **completed_successfully** (`compose.yaml:16-20, 31-33`).

The columns diverge only at **`web`** and which files load. **Dev** (`docker compose up`)
auto-loads `compose.override.yaml`: the `dev` stage bind-mounts source + anonymous
`node_modules`/`.next` volumes, regenerates the Prisma client and runs `npm run dev` for
hot reload (`compose.override.yaml:2-12`), and adds a **dev-only `mailpit`** email sink
(`compose.override.yaml:14-19`). **Prod** (`-f compose.yaml -f compose.prod.yaml up -d`)
runs the prebuilt `runner` image (`node server.js` from `.next/standalone`) with
`restart: unless-stopped`, detached, no bind mounts and no mailpit
(`compose.prod.yaml`). See [where prisma generate runs](./2026-07-15-prisma-generate-dev-vs-prod.md)
for how the client is built in each.
