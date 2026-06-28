import { z } from "zod";

export const requiredString = (message: string) => z.string().min(1, message);

export const emailSchema = requiredString("Email is required.").pipe(
  z.email("Enter a valid email address.")
);
