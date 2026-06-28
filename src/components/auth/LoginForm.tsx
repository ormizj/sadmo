"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import TextField from "@/components/ui/TextField";
import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";
import GoogleIcon from "@/components/icons/GoogleIcon";
import { validateLogin, type LoginErrors } from "@/lib/validation/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = validateLogin({ email, password });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Stub: no backend yet. Auth wiring comes later.
    setSubmitting(true);
    console.log("[login] submit (stub)", { email, remember });
    setTimeout(() => setSubmitting(false), 600);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="you@company.com"
        autoComplete="email"
        leadingIcon={<Mail className="size-4" />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <PasswordField
        id="password"
        name="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        leadingIcon={<Lock className="size-4" />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex cursor-pointer items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Remember me
        </label>
        <Link
          href="/forgot-password"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OR
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button type="button" variant="outline" fullWidth>
        <GoogleIcon className="size-4" />
        Continue with Google
      </Button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
          Sign up
        </Link>
      </p>
    </form>
  );
}
