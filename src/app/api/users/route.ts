import { NextResponse } from "next/server";
import { Prisma, type Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { validateCreateUser } from "@/lib/validation/user";
import { createInvitedUser } from "@/lib/users/data";
import { sendInviteEmail } from "@/lib/email/invites";

export async function POST(request: Request) {
  // TODO: rate-limit this endpoint before it reaches the DB / mailer.
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (current.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;
  const input = {
    email: typeof data.email === "string" ? data.email : "",
    name: typeof data.name === "string" ? data.name : "",
    role: typeof data.role === "string" ? data.role : "USER",
  };

  const fields = validateCreateUser(input);
  if (Object.keys(fields).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", fields },
      { status: 422 }
    );
  }

  try {
    const { user, rawToken } = await createInvitedUser({
      email: input.email,
      name: input.name,
      role: input.role as Role,
    });
    await sendInviteEmail(user.email, rawToken);
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 409 }
      );
    }
    console.error("[api/users] create failed", e);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
