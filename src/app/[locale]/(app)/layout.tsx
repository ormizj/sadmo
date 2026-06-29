import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Settings,
  Search,
  Bell,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import LocaleSwitcher from "@/components/LocaleSwitcher";

const NAV = [
  { key: "dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
  { key: "contacts", icon: Users, href: "#", active: false },
  { key: "companies", icon: Building2, href: "#", active: false },
  { key: "reports", icon: BarChart3, href: "#", active: false },
  { key: "settings", icon: Settings, href: "#", active: false },
] as const;

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "AppShell" });

  return (
    <div className="flex min-h-dvh flex-1 bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ key, icon: Icon, href, active }) => (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="size-4.5" />
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-semibold text-white">
            U
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {t("user.fallbackName")}
            </p>
            <p className="truncate text-xs text-slate-500">
              {t("user.fallbackEmail")}
            </p>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400" />
            <input
              type="search"
              placeholder={t("search")}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <LocaleSwitcher />
          <button
            type="button"
            aria-label={t("notifications")}
            className="grid size-10 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell className="size-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
