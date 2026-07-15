"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { validateSetPassword } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { consumeInviteToken } from "@/lib/users/data";
import { createSession } from "@/lib/auth/session";

export type SetPasswordState = { error: string } | null;

export async function setPasswordAction(
  _prev: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const t = await getTranslations("SetPassword");

  if (!token) return { error: t("errors.invalidToken") };

  if (Object.keys(validateSetPassword({ password, confirmPassword })).length > 0) {
    return { error: t("errors.invalidInput") };
  }

  const hashed = await hashPassword(password);
  const user = await consumeInviteToken(token, hashed);
  // Null → token unknown, already used, or expired.
  if (!user) return { error: t("errors.invalidToken") };

  await createSession(user.id);
  const locale = await getLocale();
  return redirect({ href: "/dashboard", locale });
}
