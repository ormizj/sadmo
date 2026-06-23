import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  fullWidth?: boolean;
};

const base =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-600/25 hover:from-indigo-600 hover:to-blue-700",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
} as const;

/** Shared button primitive for the CRM. */
export default function Button({
  variant = "primary",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
      {...props}
    />
  );
}
