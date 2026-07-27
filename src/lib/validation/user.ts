import { z } from "zod";
import { emailSchema, requiredString } from "./common";

export const roleSchema = z.enum(["ADMIN", "USER"]);

export const createUserSchema = z.object({
  email: emailSchema,
  name: requiredString("Name is required."),
  role: roleSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type CreateUserErrors = { email?: string; name?: string; role?: string };

export function validateCreateUser(input: {
  email: string;
  name: string;
  role: string;
}): CreateUserErrors {
  const result = createUserSchema.safeParse(input);
  if (result.success) return {};

  const { fieldErrors } = z.flattenError(result.error);
  return {
    email: fieldErrors.email?.[0],
    name: fieldErrors.name?.[0],
    role: fieldErrors.role?.[0],
  };
}
