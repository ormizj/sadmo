import { z } from "zod";

export const requiredString = (message: string) => z.string().min(1, message);

export const emailSchema = requiredString("Email is required.").pipe(
  z.email("Enter a valid email address.")
);

export const passwordSchema = requiredString("Password is required.").pipe(
  z.string().min(8, "Password must be at least 8 characters.")
);
