import { getTranslations, setRequestLocale } from "next-intl/server";
import Logo from "@/components/Logo";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Login" });

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

      <LoginForm />
    </div>
  );
}
