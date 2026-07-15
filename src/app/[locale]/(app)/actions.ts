"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { destroySession } from "@/lib/auth/session";

export async function logoutAction(): Promise<void> {
  await destroySession();
  const locale = await getLocale();
  redirect({ href: "/login", locale });
}
