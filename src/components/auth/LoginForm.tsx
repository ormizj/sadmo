"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import TextField from "@/components/ui/TextField";
import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";
import GoogleIcon from "@/components/icons/GoogleIcon";
import { validateLogin, type LoginErrors } from "@/lib/validation/auth";
import { loginAction } from "@/app/[locale]/(guest)/login/actions";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        // Same rule as the server action; gates the round-trip for instant UX.
        const next = validateLogin({ email, password });
        setErrors(next);
        if (Object.keys(next).length > 0) e.preventDefault();
      }}
    >
      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      )}

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
            name="remember"
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

      <Button type="submit" variant="primary" fullWidth disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
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
    </form>
  );
}
