import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.string().email().nullable().optional(),
    password: z.string().min(12),
    phone: z.string().min(1).nullable().optional(),
    track: z.enum(['EXPERIMENTAL', 'MATHEMATICS', 'HUMANITIES']).optional(),
  })
  .strict()
  .refine((input) => Boolean(input.email || input.phone), {
    message: 'Email or phone is required',
  })

export const loginSchema = z
  .object({
    identifier: z.string().min(1),
    password: z.string().min(1),
  })
  .strict()

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12),
  })
  .strict()
