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

const curriculumTrack = z.enum(['EXPERIMENTAL', 'MATHEMATICS', 'HUMANITIES'])
const catalogEntryId = z.string().regex(/^ce_[a-f0-9]{32}$/)
const canonicalNodeId = z.string().regex(/^cn_[a-f0-9]{32}$/)

export const curriculumTrackParamsSchema = z.object({
  track: curriculumTrack,
}).strict()

export const curriculumCatalogEntryParamsSchema = z.object({
  track: curriculumTrack,
  entryId: catalogEntryId,
}).strict()

export const curriculumCatalogNodeParamsSchema = z.object({
  track: curriculumTrack,
  entryId: catalogEntryId,
  nodeId: canonicalNodeId,
}).strict()

export const curriculumTrackSearchQuerySchema = z.object({
  ...pagination,
  q: z.string().trim().min(1).max(100),
}).strict()
