import { z } from "zod";
import { emailSchema, requiredString } from "./common";

export const loginSchema = z.object({
  email: emailSchema,
  password: requiredString("Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type LoginErrors = { email?: string; password?: string };

export function validateLogin(input: {
  email: string;
  password: string;
}): LoginErrors {
  const result = loginSchema.safeParse(input);
  if (result.success) return {};

  const { fieldErrors } = z.flattenError(result.error);
  return {
    email: fieldErrors.email?.[0],
    password: fieldErrors.password?.[0],
  };
}
