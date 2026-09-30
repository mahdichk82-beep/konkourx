import { z } from 'zod'

const pagination = {
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
}

const technicalId = z.string().min(4).max(80).regex(/^c[a-z]_[a-f0-9]{32}$/)

export const curriculumPlacementQuerySchema = z.object({
  ...pagination,
  scopeId: technicalId.optional(),
  gradePlacementId: technicalId.optional(),
}).strict()

export const curriculumPageQuerySchema = z.object(pagination).strict()

export const curriculumNodeParamsSchema = z.object({
  id: z.string().regex(/^cn_[a-f0-9]{32}$/),
}).strict()

export const curriculumSearchQuerySchema = z.object({
  ...pagination,
  q: z.string().trim().min(1).max(100),
}).strict()
