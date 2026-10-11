import { z } from "zod";

export const registerBodySchema = z.object({
  email: z.string().email("Invalid email."),
  fullname: z.string().min(1, "Full name is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  phone: z.string().optional()
});

export const loginBodySchema = z.object({
  email: z.string().email("Invalid email."),
  password: z.string().min(6, "Password must be at least 6 characters.")
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh Token is required.")
});

export const sendVerifyEmailBodySchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format")
  })
});

export const verifyEmailBodySchema = z.object({
  query: z.object({
    token: z.string().min(1, "Token is required")
  })
});

export const forgotPasswordBodySchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format")
  })
});

export const resetPasswordWithTokenBodySchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters")
  })
});

export const registerSchema = { body: registerBodySchema };
export const loginSchema = { body: loginBodySchema };
export const refreshTokenSchema = { body: refreshTokenBodySchema };
export const sendVerifyEmailSchema = { body: sendVerifyEmailBodySchema }
export const verifyEmailSchema = { body: verifyEmailBodySchema }
export const forgotPasswordSchema = { body: forgotPasswordBodySchema }
export const resetPasswordWithTokenSchema = { body: resetPasswordWithTokenBodySchema }

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenBodySchema>;