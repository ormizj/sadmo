"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { validateLogin } from "@/lib/validation/auth";
import { getUserByEmailWithSecret } from "@/lib/users/data";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const t = await getTranslations("Login");
  // Generic message for every failure mode → no account enumeration.
  const invalid: LoginState = { error: t("errors.invalidCredentials") };

  if (Object.keys(validateLogin({ email, password })).length > 0) {
    return invalid;
  }

  const user = await getUserByEmailWithSecret(email);
  if (!user?.hashedPassword) return invalid;

  const ok = await verifyPassword(user.hashedPassword, password);
  if (!ok) return invalid;

  await createSession(user.id);
  const locale = await getLocale();
  return redirect({ href: "/dashboard", locale });
}
