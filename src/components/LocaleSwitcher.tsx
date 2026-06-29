"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(nextLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("label")}</span>
      <Globe
        className="pointer-events-none absolute left-2 size-4 text-slate-500"
        aria-hidden
      />
      <select
        aria-label={t("label")}
        value={locale}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
      >
        {routing.locales.map((cur) => (
          <option key={cur} value={cur}>
            {t(`locales.${cur}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
