import { z } from "zod";

/**
 * Safe post-auth redirect helpers.
 * Never trust an arbitrary absolute URL from a query parameter.
 */
export function getSafeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) {
    return fallback;
  }

  const value = raw.trim();

  // Relative same-origin path only
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return fallback;
  }

  // Block protocol-relative and encoded tricks
  if (value.toLowerCase().includes("%2f%2f") || value.includes("\\")) {
    return fallback;
  }

  return value;
}

export const strongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128)
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    email: z.string().trim().email("Enter a valid email address"),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  otp: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "Enter the verification code from your email"),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailFormSchema>;
