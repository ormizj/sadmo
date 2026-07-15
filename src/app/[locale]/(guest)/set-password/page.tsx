import { getTranslations, setRequestLocale } from "next-intl/server";
import Logo from "@/components/Logo";
import { getInviteStatus } from "@/lib/users/data";
import SetPasswordForm from "@/components/auth/SetPasswordForm";

export default async function SetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token } = await searchParams;
  const t = await getTranslations({ locale, namespace: "SetPassword" });

  const status = token
    ? await getInviteStatus(token)
    : ({ valid: false } as const);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 p-8 shadow-xl shadow-indigo-300/30 ring-1 ring-slate-900/5 backdrop-blur-xl sm:p-10">
      <div className="mb-8 space-y-4">
        <Logo />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
      </div>

      {status.valid && token ? (
        <SetPasswordForm token={token} />
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          {t("invalid")}
        </p>
      )}
    </div>
  );
}
