import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { env } from "@/env";
import { getUserById, type UserDto } from "@/lib/users/data";

const COOKIE_NAME = "sadmo_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// A256GCM (dir) requires a 32-byte key; derive one from the configured secret.
const key = createHash("sha256").update(env.SESSION_SECRET).digest();

type SessionPayload = { userId: string };

export async function createSession(userId: string): Promise<void> {
  const token = await new EncryptJWT({ userId })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .encrypt(key);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, key);
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

// cache() dedupes the session lookup across a single request's render tree.
export const getCurrentUser = cache(async (): Promise<UserDto | null> => {
  const session = await readSession();
  if (!session) return null;
  return getUserById(session.userId);
});
