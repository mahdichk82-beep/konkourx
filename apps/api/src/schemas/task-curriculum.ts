import { z } from 'zod'

export const curriculumTargetSchema = z.object({
  referenceKind: z.enum(['NODE', 'PLACEMENT']),
  curriculumRefId: z.string().trim().min(1).max(100),
  selectionMode: z.enum(['EXACT', 'WHOLE']),
}).strict()

const curriculumTargetListSchema = z.array(curriculumTargetSchema).max(50)

export const curriculumTargetsSchema = curriculumTargetListSchema.default([])

export const replaceCurriculumTargetsSchema = z.object({
  curriculumTargets: curriculumTargetListSchema,
}).strict()

export const toggleCurriculumItemSchema = z.object({ completed: z.boolean() }).strict()

export const taskCurriculumItemParamSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
}).strict()

