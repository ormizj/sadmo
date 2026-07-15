import "server-only";
import { env } from "@/env";
import { sendMail } from "./mailer";

export async function sendInviteEmail(
  to: string,
  rawToken: string
): Promise<void> {
  const link = `${env.APP_URL}/set-password?token=${encodeURIComponent(rawToken)}`;
  await sendMail({
    to,
    subject: "You've been invited to Sadmo",
    html: `
      <p>You've been invited to Sadmo.</p>
      <p>Click the link below to set your password and activate your account:</p>
      <p><a href="${link}">Set your password</a></p>
      <p>This link expires in 7 days.</p>
    `,
  });
}
