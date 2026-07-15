import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import CreateUserForm from "@/components/admin/CreateUserForm";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();

  const t = await getTranslations({ locale, namespace: "AdminUsers" });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CreateUserForm />
      </div>
    </div>
  );
}
