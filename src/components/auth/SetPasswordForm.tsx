"use client";

import { useActionState, useState } from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";
import {
  validateSetPassword,
  type SetPasswordErrors,
} from "@/lib/validation/auth";
import { setPasswordAction } from "@/app/[locale]/(guest)/set-password/actions";

export default function SetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("SetPassword");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<SetPasswordErrors>({});
  const [state, formAction, isPending] = useActionState(
    setPasswordAction,
    null
  );

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        const next = validateSetPassword({ password, confirmPassword });
        setErrors(next);
        if (Object.keys(next).length > 0) e.preventDefault();
      }}
    >
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      )}

      <PasswordField
        id="password"
        name="password"
        label={t("password")}
        placeholder="••••••••"
        autoComplete="new-password"
        leadingIcon={<Lock className="size-4" />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label={t("confirmPassword")}
        placeholder="••••••••"
        autoComplete="new-password"
        leadingIcon={<Lock className="size-4" />}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />

      <Button type="submit" variant="primary" fullWidth disabled={isPending}>
        {isPending ? t("submitLoading") : t("submit")}
      </Button>
    </form>
  );
}
