import "server-only";
import { randomBytes, createHash } from "node:crypto";

// URL-safe random token that travels only in the emailed invite link.
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

// Stored server-side so a DB leak doesn't expose usable invite links.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
