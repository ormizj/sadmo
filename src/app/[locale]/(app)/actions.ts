"use server";

import { redirectTo } from "@/i18n/locale";
import { destroySession } from "@/lib/auth/session";

export async function logoutAction(): Promise<void> {
  await destroySession();
  return redirectTo("/login");
}
