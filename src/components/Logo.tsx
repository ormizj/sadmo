type LogoProps = {
  /** Render only the glyph mark, without the wordmark. */
  markOnly?: boolean;
  className?: string;
};

/**
 * Brand mark for Sadmo CRM. A rounded gradient tile with a diamond glyph,
 * optionally followed by the wordmark. Reused across the guest and app shells.
 */
export default function Logo({ markOnly = false, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-blue-600/30">
        <span className="size-3.5 rotate-45 rounded-[3px] bg-white" />
      </span>
      {!markOnly && (
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          Sadmo
        </span>
      )}
    </span>
  );
}
