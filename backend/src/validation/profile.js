import { z } from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const requestEmailSchema = z.object({
  newEmail: z.string().trim().email({ message: "Invalid email" }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email" }),
});
