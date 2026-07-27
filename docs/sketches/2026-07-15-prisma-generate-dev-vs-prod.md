---
title: Where `prisma generate` runs — dev vs prod
depicts: prisma client generation timing across Dockerfile stages & compose files
commit: 307c7d9
date: 2026-07-15
kind: mermaid
---

```mermaid
flowchart TB
    subgraph dev["DEV — generated at container RUNTIME"]
        direction TB
        D1["compose.override.yaml:6<br/>command: sh -c<br/>'npx prisma generate && npm run dev'"]
        D2["deps stage installs node_modules<br/>(Dockerfile:6-9) — NO generate"]
        D3["anonymous volume /app/node_modules<br/>(compose.override.yaml:9)<br/>shadows the image's node_modules"]
        D4(["client regenerated on every boot<br/>then npm run dev"])
        D2 -. "image ships without a client" .-> D3
        D3 == "so it must run at start" ==> D1
        D1 ==> D4
    end

    subgraph prod["PROD — generated at IMAGE BUILD, baked in"]
        direction TB
        P1["builder stage<br/>Dockerfile:36 npx prisma generate"]
        P2["npm run build → .next/standalone<br/>(client traced in)"]
        P3(["runner image<br/>Dockerfile:40-53<br/>node server.js — no volumes, immutable"])
        M1["migrator stage<br/>Dockerfile:18 npx prisma generate"]
        M2(["migrate deploy && db seed<br/>(seed imports @prisma/client)"])
        P1 ==> P2 ==> P3
        M1 ==> M2
    end

    classDef runtime fill:#fef3c7,stroke:#d97706,color:#000;
    classDef build fill:#dbeafe,stroke:#2563eb,color:#000;
    class D1,D4 runtime;
    class P1,P2,P3,M1,M2 build;
```

Same command, run at a different time. **Dev** regenerates the Prisma client on every
container start (`compose.override.yaml:6`) because the `deps` stage never generates it
(`Dockerfile:6-9`) and the anonymous `node_modules` volume (`compose.override.yaml:9`)
shadows the image's copy — so there's nothing baked in to reuse. **Prod** generates at
**image build time**: the `builder` stage runs it before `npm run build`
(`Dockerfile:36`) and the client is traced into `.next/standalone`, then copied into the
immutable `runner` image (`Dockerfile:48`) — no volumes, nothing to redo at startup.
There's a third site: the one-shot `migrator` stage also generates
(`Dockerfile:18`), because the DB seed script imports `@prisma/client`.
