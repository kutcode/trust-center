import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

export const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(256),
  full_name: z.string().max(200).optional(),
  signup_token: z.string().max(256).optional(),
});
