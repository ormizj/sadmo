import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "next-intl";
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
