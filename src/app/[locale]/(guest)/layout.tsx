import LocaleSwitcher from "@/components/LocaleSwitcher";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-10">
      {/* Soft glow blobs behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-indigo-300/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 size-[28rem] rounded-full bg-sky-200/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 size-72 -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl"
      />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LocaleSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
