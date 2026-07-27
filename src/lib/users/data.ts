import "server-only";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth/token";

export type UserDto = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function toDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function getUserById(id: string): Promise<UserDto | null> {
  const user = await db.user.findUnique({ where: { id } });
  return user ? toDto(user) : null;
}

// Internal: includes the password hash for login verification only.
// Never expose the raw row to a client.
export function getUserByEmailWithSecret(email: string): Promise<User | null> {
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function createInvitedUser(input: {
  email: string;
  name: string;
  role: Role;
}): Promise<{ user: UserDto; rawToken: string }> {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const user = await db.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      role: input.role,
      inviteTokens: { create: { tokenHash, expiresAt } },
    },
  });

  return { user: toDto(user), rawToken };
}

export type InviteStatus = { valid: true; email: string } | { valid: false };

export async function getInviteStatus(rawToken: string): Promise<InviteStatus> {
  const invite = await db.inviteToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { valid: false };
  }
  return { valid: true, email: invite.user.email };
}

// Sets the password and burns the token atomically. Returns null if the token
// is unknown, already used, or expired (authorization by token possession).
export async function consumeInviteToken(
  rawToken: string,
  hashedPassword: string
): Promise<UserDto | null> {
  const tokenHash = hashToken(rawToken);
  return db.$transaction(async (tx) => {
    const invite = await tx.inviteToken.findUnique({ where: { tokenHash } });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return null;
    }
    const user = await tx.user.update({
      where: { id: invite.userId },
      data: { hashedPassword },
    });
    await tx.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });
    return toDto(user);
  });
}
