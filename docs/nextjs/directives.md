# Directives & rendering

Where code runs in the App Router is decided by **directives** at the top of a
file. Three cases matter: **Server Components** (the default — no directive),
**Client Components** (`'use client'`), and **Server Functions** (`'use server'`).
The first two are the **rendering modes** for components; the third is different in
kind — `'use server'` doesn't render anything, it exposes a callable server-side
function. They split across the **server/client boundary**: a Server Component never
ships to the browser, a Client Component runs on *both* sides, and a Server Function
is server-only code you can call *from* the client.

> **This is not the "everything renders on the client" model.** In the App Router
> the server is the default and the boundary is opt-in. Read the browser-API
> section before reaching for `ssr: false` — it does **not** work everywhere.

## The three at a glance

The first two rows are the component **rendering modes**; the `Server Function` row
is not a rendering mode — it's a callable function, so "Runs on" means where its
body executes and "ships component JS" is trivially no (it isn't a component).

| What | Directive | Runs on | Ships component JS? | Reach for it when |
|---|---|---|---|---|
| **Server Component** | none (default) | server by default* | no* | fetching data, using secrets, keeping the bundle small |
| **Client Component** | `'use client'` | server (prerender) **then** client (hydrate) | yes | state, effects, event handlers, browser APIs |
| **Server Function** | `'use server'` | server (function body) | n/a — not a component | mutations, form submits, secure operations |

> \* **"No directive" is a default, not a wall.** A file with no directive is
> *shared*: it renders on the server by default, but if it's **imported into a
> `'use client'` module graph** it's compiled into the client bundle and runs on the
> client too. So "no directive" does **not** mean "server only" — see
> [No directive = shared](#no-directive--shared) below.

## `"use server"` (Server Functions)

Marks server-only logic that a Client Component can call directly — no hand-written
API route. Next.js compiles each one into a callable reference and handles the
network round-trip.

**Placement — two forms:**

```ts
// 1. Top of a file: every export becomes a Server Function.
"use server";

export async function createPost(formData: FormData) { /* ... */ }
```

```ts
// 2. First statement inside an async function body (e.g. in a Server Component).
export default function Page() {
  async function updatePost(formData: FormData) {
    "use server";
    // ...
  }
  return <form action={updatePost}>{/* ... */}</form>;
}
```

To call one from a Client Component it must live in a dedicated file using the
top-of-file form.

**Constraints of the top-of-file form:**

- **Every export must be an `async function`.** The directive turns exports into
  callable server references, so exporting a plain constant or a sync function is a
  build error.
- **The directive alone does nothing.** A file containing only `"use server"` with
  no exports declares zero Server Functions — its *visible* result is the same as an
  empty file (nothing is exposed), but it's not the same thing: it's a tagged
  server-reference module with no references. The meaning diverges the moment you add
  an export — with the directive that export becomes a public endpoint; without it,
  the same `export async function` is just an ordinary server-side module export the
  client cannot call. So a lone directive is pointless; it only earns its place once
  something is exported.

> **The generated reference is a public POST endpoint.** Once a Server Function is
> exported **and referenced somewhere in your app**, Next.js assigns it a secure,
> non-deterministic action ID and it becomes reachable via a direct POST request —
> not only through your UI. (A Server Function that is referenced *nowhere* is
> dead-code-eliminated, so it gets no ID and no endpoint — but don't lean on that as
> a security boundary.) So treat **every** Server Function as a public endpoint:
> validate input, read auth from cookies/headers, and check authorization before
> doing the work. Return only the data the UI needs — return values are serialized to
> the client, so never hand back raw database records.

## `"use client"` (Client Components)

Put `'use client'` at the **very top of the file, before any imports**. It marks
the **boundary** between server and client code — you only add it to the
entry-point of a client subtree, not to every file the subtree imports.

A Client Component runs in **two phases** on first load:

1. **Server (prerender)** — rendered to static HTML so the page paints fast and is
   crawlable for SEO. No event listeners are attached yet.
2. **Client (hydrate)** — the JavaScript downloads and *hydrates* the HTML,
   attaching listeners and wiring up state to make it interactive.

(Nuance: on later *client-side* navigations there's no server round-trip, so the
component renders on the client only.)

Use a Client Component for `useState`, `useEffect` and other lifecycle hooks,
event handlers like `onClick`, and anything that touches browser APIs.

**Props crossing the boundary must be serializable.** When a Server Component
renders a Client Component, the props are serialized to be sent over the wire, so
they must be serializable types — you can't pass a function, a class instance, or
other non-serializable value from the server into a Client Component. (The exception
is a Server Function, which *is* passable as a prop — it's sent as a reference, not
serialized data.)

## Server Components (default)

Layouts and pages are Server Components unless marked otherwise. They run **only on
the server**, render into React's RSC payload, and are **never hydrated** — so they
ship no component JavaScript and **reduce** the bundle sent to the browser (the JS
of the Server Component itself doesn't go over the wire at all).

Use them to fetch data close to the source and to touch backend resources — API
keys, tokens, and other secrets stay on the server and are never exposed to the
client.

### No directive = shared

A directive-less component is **not permanently a Server Component** — it renders
wherever it's used. `'use client'` marks a **boundary**, and *"all of a
`'use client'` file's imports and the components it directly renders are included in
the client bundle"* — so a shared component pulled into that module graph is
compiled to the client with it, no directive of its own needed.

`Logo.tsx` in this repo is exactly this. It has no directive, yet:

| Where it's imported | That consumer's directive | Where `Logo` runs |
|---|---|---|
| `(guest)/login/page.tsx` | none (Server Component) | **server** — no JS shipped |
| `(app)/layout.tsx` | none | **server** |
| `app/dev/components/page.tsx` | `'use client'` | **client** — bundled & shipped |

Same file, two runtime homes, decided by the import site — not a contradiction.

Two caveats:

- **It's the import graph, not "used on a client page."** A directive-less
  component **passed as `children` or a prop** to a Client Component is *not* in that
  client's module graph: it still renders on the server and is handed over as
  finished output. Only components a `'use client'` file **imports** cross into the
  client bundle.
- **Only truly shareable components can be pulled client-side.** `Logo` is safe
  because it's pure presentational markup — no `async`, no secrets, no `server-only`.
  A directive-less component that uses server-only features can't be imported into a
  client subtree; do that and the build fails.

### Keep secrets server-only with `server-only`

Because a directive-less module is *shared*, a file that reads a secret can be
imported into a Client Component **by accident** — nothing about the missing
directive stops it. Two things guard against a leak:

1. **Env var stripping (partial, silent).** Only `NEXT_PUBLIC_`-prefixed env vars
   are included in the client bundle; any other `process.env.X` reachable from the
   client is **replaced with an empty string**. So the secret *value* never ships —
   but the code doesn't error, it just silently misbehaves (an `API_KEY` becomes
   `""` and the request fails). A backstop, not a real guard.
2. **`import "server-only"` (the real guard).** Add it to the top of any module that
   touches secrets, the database, or other server-only resources. If that module is
   ever pulled into a client module graph, the **build fails** — turning a silent
   runtime leak into a hard, unmissable error.

```ts
import "server-only"; // build error if this file reaches the client bundle

export async function getData() {
  const res = await fetch("https://example.com/data", {
    headers: { authorization: process.env.API_KEY! },
  });
  return res.json();
}
```

In this repo every secret-touching module carries the marker — `src/env.ts`,
`src/lib/db.ts`, and everything under `src/lib/auth/`, `src/lib/email/`,
`src/lib/users/`. See `.claude/rules/ARCHITECTURE.md` (the data-access layer is
`server-only`, re-checks authorization, and returns DTOs).

## Browser APIs (`window`, `document`)

Because Client Components are **prerendered on the server**, code that reaches for a
browser-only global at module/render time runs where there is no `window` — a
`ReferenceError`. Three ways to handle it:

| Fix | How | When |
|---|---|---|
| **`useEffect`** | Move the browser code into an effect. | Default choice — effects don't run during SSR, so the server skips them entirely. |
| **`typeof window` guard** | `if (typeof window !== "undefined") { /* browser only */ }` | A quick inline check when a hook doesn't fit. |
| **Disable prerender** | `next/dynamic` with `{ ssr: false }` | A third-party component that touches `window` on import and can't be changed. |

```ts
"use client"; // required — ssr:false only works inside a Client Component
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("./chart"), { ssr: false });
```

> **`ssr: false` is not a universal escape hatch.** It is **rejected inside a
> Server Component** — Next.js throws *"`ssr: false` is not allowed with
> `next/dynamic` in Server Components. Please move it into a Client Component."*
> Only reach for it from within a `'use client'` file; everywhere else, prefer the
> `useEffect` or `typeof window` guards above.
