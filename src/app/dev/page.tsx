import Link from "next/link";

const PAGES = [
  {
    href: "/dev/components",
    title: "Components",
    description: "Every UI primitive with all variants and states.",
  },
];

export default function DevIndexPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Dev tools
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Internal pages, available outside production only.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PAGES.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
