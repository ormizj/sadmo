export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          This is a placeholder for the authenticated CRM shell.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Contacts", "Open deals", "Tasks due"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              —
            </p>
          </div>
        ))}
      </div>

      <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white/60 p-16 text-center">
        <p className="text-sm font-medium text-slate-500">Coming soon</p>
      </div>
    </div>
  );
}
