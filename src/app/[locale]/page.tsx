import { getRouteLocale, redirectTo } from "@/i18n/locale";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await getRouteLocale(params);
  return redirectTo("/login");
}
