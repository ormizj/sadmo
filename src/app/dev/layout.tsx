import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Evaluate the gate per-request so production returns a real 404 status,
  // rather than a statically prerendered not-found page served with 200.
  await connection();
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-dvh flex-1 bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dev"
            className="text-sm font-semibold tracking-tight text-slate-900"
          >
            Sadmo · Dev
          </Link>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            non-production only
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
