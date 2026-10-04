import { z } from 'zod'

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()

export const studentProfileSchema = z
  .object({
    educationLevel: optionalText(100),
    schoolName: optionalText(200),
    track: z.enum(['EXPERIMENTAL', 'MATHEMATICS', 'HUMANITIES']).nullable().optional(),
  })
  .strict()

export const counselorProfileSchema = z
  .object({
    bio: optionalText(2000),
    specialization: optionalText(200),
  })
  .strict()

export const createRelationshipSchema = z
  .object({
    studentId: z.string().uuid(),
    counselorId: z.string().uuid(),
  })
  .strict()

export const updateRelationshipSchema = z
  .object({
    status: z.enum(['ACTIVE', 'INACTIVE']),
  })
  .strict()

export const listCounselorStudentsSchema = z
  .object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict()

export const counselorStudentIdParamSchema = z
  .object({ id: z.string().uuid() })
  .strict()
