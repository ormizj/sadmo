# Directives & rendering

Where code runs in the App Router is decided by **directives** at the top of a
file. Three modes matter: **Server Components** (the default — no directive),
**Client Components** (`'use client'`), and **Server Functions** (`'use server'`).
They split across the **server/client boundary**: a Server Component never ships to
the browser, a Client Component runs on *both* sides, and a Server Function is
server-only code you can call *from* the client.

> **This is not the "everything renders on the client" model.** In the App Router
> the server is the default and the boundary is opt-in. Read the browser-API
> section before reaching for `ssr: false` — it does **not** work everywhere.

## The three rendering modes

| Mode | Directive | Runs on | Ships component JS? | Reach for it when |
|---|---|---|---|---|
| **Server Component** | none (default) | server only | no | fetching data, using secrets, keeping the bundle small |
| **Client Component** | `'use client'` | server (prerender) **then** client (hydrate) | yes | state, effects, event handlers, browser APIs |
| **Server Function** | `'use server'` | server only | no | mutations, form submits, secure operations |

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

> **The generated reference is a public POST endpoint.** Once created and exported,
> a Server Function is reachable via a direct POST request — not only through your
> UI, and even if no component imports it (unused ones are dead-code-eliminated and
> never get an endpoint). So inside **every** Server Function: validate input, read
> auth from cookies/headers, and check authorization before doing the work. Return
> only the data the UI needs — return values are serialized to the client, so never
> hand back raw database records.

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

## Server Components (default)

Layouts and pages are Server Components unless marked otherwise. They run **only on
the server**, render into React's RSC payload, and are **never hydrated** — so they
ship no component JavaScript and **reduce** the bundle sent to the browser (the JS
of the Server Component itself doesn't go over the wire at all).

Use them to fetch data close to the source and to touch backend resources — API
keys, tokens, and other secrets stay on the server and are never exposed to the
client.

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
