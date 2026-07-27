import "server-only";
import { notFound } from "next/navigation";
import {
  hasLocale,
  type Locale,
  type Messages,
  type NamespaceKeys,
  type NestedKeyOf,
} from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "./navigation";
import { routing } from "./routing";

// Next types route params as `string`; `hasLocale` is a type guard that narrows
// to the `Locale` union (no cast) and lets us 404 on anything that isn't valid.
export async function getRouteLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return locale;
}

// Validate the route locale, register it for the request, and return a
// namespace-scoped translator in one call. The generic mirrors next-intl's own
// `getTranslations`, so `t` stays typed to the chosen namespace.
export async function getRouteTranslations<
  NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never,
>(params: Promise<{ locale: string }>, namespace?: NestedKey) {
  const locale = await getRouteLocale(params);
  setRequestLocale(locale);
  return getTranslations({ locale, namespace });
}

type RedirectHref = Parameters<typeof redirect>[0]["href"];

// next-intl's `redirect` requires an explicit locale (unlike `Link`, which
// infers it), so read the ambient request locale instead of threading it
// through every call site. Must be awaited or returned — it never resolves.
export async function redirectTo(href: RedirectHref) {
  return redirect({ href, locale: await getLocale() });
}
