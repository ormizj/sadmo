# proxy.ts

`src/proxy.ts` is Next.js 16's **proxy** — the file formerly called
`middleware.ts` (renamed in v16; runs on the Node.js runtime, Edge is
unsupported). It runs **before routing** on every matched request. In this app
its entire job is `next-intl` locale routing, expressed in one line:

```ts
export default createMiddleware(routing);
```

That statement doesn't *look* like it touches locales — but `createMiddleware`
**is** the locale router. It reads its behavior from
[`src/i18n/routing.ts`](../../src/i18n/routing.ts), and it's what puts the locale
into the URL in the first place.

## The matcher

```ts
export const config = {
  matcher: "/((?!api|_next|_vercel|dev|.*\\..*).*)",
};
```

The matcher decides **which paths the proxy runs on**. It's a single
negative-lookahead (`(?!…)`) — an exclusion list: run on every path *except* ones
that begin with, or look like, these:

| Excluded | Skips | Why |
|---|---|---|
| `api` | `/api/*` route handlers | Integration endpoints, not pages — no locale routing needed. |
| `_next` | `/_next/*` | Next.js internals: JS/CSS chunks, image optimization, HMR. |
| `_vercel` | `/_vercel/*` | Vercel platform internals (insights, etc.). |
| `dev` | `/dev/*` | The app's dev-only routes (`src/app/dev/`). |
| `.*\..*` | any path containing a **dot** | Static files with an extension — `favicon.ico`, `logo.png`, `sitemap.xml`. `\.` is a literal dot. |

Net effect: the proxy fires only on **real page navigations**, never on assets,
API routes, or framework internals — the standard performance pattern (you don't
want middleware executing on every asset request).

**Caveat:** `.*\..*` also skips any *page* route whose path contains a dot (e.g.
`/v1.2/docs`). Rare, but worth remembering before adding such a route.

## What it actually does

`createMiddleware(routing)` negotiates a locale and routes the request to the
right URL. Its behavior comes entirely from
[`src/i18n/routing.ts`](../../src/i18n/routing.ts):

```ts
locales: ["en", "fr", "es"],
defaultLocale: "en",
localePrefix: "as-needed",
```

`localePrefix: "as-needed"` is the part that makes the proxy easy to overlook:

- Default locale (`en`) → **no prefix**. `/dashboard` stays `/dashboard`.
- Non-default (`fr`, `es`) → **prefixed**. `/fr/dashboard`, `/es/dashboard`.

So browsing in English shows clean, prefix-less URLs and *feels* like nothing is
happening — but the proxy is running on every one. Two concrete behaviors:

- **Redirect** — a French browser hits bare `/` → the proxy redirects to `/fr`.
- **Rewrite** — an English user hits `/dashboard` → the proxy internally rewrites
  it onto the `[locale]` segment as `en`, so
  [`src/app/[locale]/layout.tsx`](../../src/app/[locale]/layout.tsx) receives
  `params.locale = "en"`, while the browser URL stays `/dashboard`.

Locale is negotiated in order: the **`NEXT_LOCALE` cookie** → the
**`Accept-Language`** header → `defaultLocale`. The proxy also *sets* that cookie
so the choice sticks across visits.

## Proxy vs. layout — the division of labor

A layout runs **after** routing has already resolved, so it can only ever consume
a locale that's already decided. Negotiation and redirect/rewrite therefore have
no home except the proxy. The pieces form a pipeline, not redundancy:

| Concern | Where | What it does |
|---|---|---|
| **Negotiate** locale (cookie/header/default) and redirect/rewrite to the right URL | **`src/proxy.ts`** | `createMiddleware(routing)` |
| **Consume** the resolved locale: guard, load provider, set `<html lang>` | [`src/app/[locale]/layout.tsx`](../../src/app/[locale]/layout.tsx) | `hasLocale` → `notFound()`, `setRequestLocale`, `NextIntlClientProvider` |
| **Resolve messages** per request | [`src/i18n/request.ts`](../../src/i18n/request.ts) | `getRequestConfig` → `messages/<locale>.json` |
| **Locale-aware navigation** (`Link`/`useRouter` that keep the prefix) | [`src/i18n/navigation.ts`](../../src/i18n/navigation.ts) | `createNavigation(routing)` |

The proxy decides *which* locale URL you're on; the layout renders *given* that
decision.

## Not built into Next.js

Locale routing here is **`next-intl`**, not a Next.js feature. The old Pages
Router had built-in i18n (an `i18n` block in `next.config`); the **App Router
dropped it**. What Next.js provides now is only the generic primitives — the proxy
runtime, the `[locale]` dynamic segment, and `redirect`/`rewrite`. `next-intl`
supplies the locale logic built on top of them.

That's why `proxy.ts` **imports `createMiddleware`** rather than flipping a config
flag: in the App Router there is no flag to flip.
