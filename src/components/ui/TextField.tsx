import type { InputHTMLAttributes, ReactNode } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Icon rendered inside the field on the leading edge. */
  leadingIcon?: ReactNode;
  /** Interactive slot on the trailing edge (e.g. a password toggle). */
  trailing?: ReactNode;
  error?: string;
};

/**
 * Labeled text input with optional leading icon, trailing slot, and inline
 * error. Reusable across forms in the CRM.
 */
export default function TextField({
  label,
  leadingIcon,
  trailing,
  error,
  id,
  className,
  ...props
}: TextFieldProps) {
  const describedBy = error && id ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-slate-400">
            {leadingIcon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-xl border bg-white/80 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 ${
            leadingIcon ? "pl-11" : "pl-3.5"
          } ${trailing ? "pr-11" : "pr-3.5"} ${
            error ? "border-red-400 focus:border-red-500 focus:ring-red-500/40" : "border-slate-200"
          } ${className ?? ""}`}
          {...props}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-0 grid w-11 place-items-center">
            {trailing}
          </span>
        )}
      </div>
      {error && (
        <p id={describedBy} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
