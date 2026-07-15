import { z } from "zod";
import { emailSchema, passwordSchema, requiredString } from "./common";

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

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: requiredString("Please confirm your password."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SetPasswordErrors = {
  password?: string;
  confirmPassword?: string;
};

export function validateSetPassword(input: {
  password: string;
  confirmPassword: string;
}): SetPasswordErrors {
  const result = setPasswordSchema.safeParse(input);
  if (result.success) return {};

  const { fieldErrors } = z.flattenError(result.error);
  return {
    password: fieldErrors.password?.[0],
    confirmPassword: fieldErrors.confirmPassword?.[0],
  };
}
