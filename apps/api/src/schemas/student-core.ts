import { z } from 'zod'
import {
  curriculumWriteContractShape,
  refineCurriculumWriteContract,
} from './task-curriculum.js'
import {
  defaultTaskScheduleFields,
  optionalTaskScheduleFields,
  refineTaskSchedule,
} from './task-scheduling.js'

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
const pagination = {
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}
const taskSkipReason = z.enum(['NO_TIME', 'TOO_DIFFICULT', 'FORGOT', 'OTHER'])

export const listSubjectsSchema = z.object(pagination).strict()
export const createSubjectSchema = z.object({ name: z.string().trim().min(1).max(200) }).strict()
export const updateSubjectSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  archived: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required')

export const listTopicsSchema = z.object(pagination).strict()
export const createTopicSchema = z.object({ title: z.string().trim().min(1).max(200) }).strict()
export const updateTopicSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  archived: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required')

export const listPlansSchema = z.object({ ...pagination, status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional() }).strict()
export const createPlanSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: optionalText(2000),
  startsOn: dateOnly,
  endsOn: dateOnly.nullable().optional().default(null),
}).strict()
export const updatePlanSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: optionalText(2000),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  startsOn: dateOnly.optional(),
  endsOn: dateOnly.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required')

export const listTasksSchema = z.object({
  ...pagination,
  cursor: z.string().min(1).max(512).optional(),
  date: dateOnly.optional(),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  overdueBefore: dateOnly.optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'PARTIAL', 'SKIPPED']).optional(),
  studyPlanId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
}).strict()
  .refine((value) => !value.date || (!value.from && !value.to), 'Date cannot be combined with a range')
  .refine((value) => (value.from === undefined) === (value.to === undefined), 'Both range dates are required')
  .refine(
    (value) => !value.overdueBefore || (!value.date && !value.from && !value.to),
    'Overdue date cannot be combined with another date filter',
  )
  .refine(
    (value) => !value.overdueBefore || value.status === undefined || value.status === 'PENDING',
    'Overdue tasks must be pending',
  )
  .refine(
    (value) => !value.cursor
      || (value.overdueBefore
        ? /^overdue\.[A-Za-z0-9_-]+$/.test(value.cursor)
        : z.string().uuid().safeParse(value.cursor).success),
    'Task cursor is invalid',
  )
export const createTaskSchema = z.object({
  contentType: z.enum(['STUDY', 'GENERAL']).optional(),
  studyPlanId: z.string().uuid().nullable().optional().default(null),
  subjectId: z.string().uuid().nullable().optional().default(null),
  topicId: z.string().uuid().nullable().optional().default(null),
  title: z.string().trim().min(1).max(200),
  description: optionalText(2000),
  scheduledFor: dateOnly,
  ...defaultTaskScheduleFields,
  estimatedMinutes: z.number().int().min(1).max(1440).nullable().optional().default(null),
  status: z.enum(['PENDING', 'COMPLETED', 'PARTIAL', 'SKIPPED']).optional().default('PENDING'),
  skipReason: taskSkipReason.nullable().optional().default(null),
  ...curriculumWriteContractShape,
}).strict().superRefine((value, context) => {
  refineCurriculumWriteContract(value, context)
  refineTaskSchedule(value, context)
  if (value.skipReason !== null && value.status !== 'SKIPPED') {
    context.addIssue({
      code: 'custom',
      message: 'Skip reason requires SKIPPED status',
      path: ['skipReason'],
    })
  }
})
export const updateTaskSchema = z.object({
  studyPlanId: z.string().uuid().nullable().optional(),
  subjectId: z.string().uuid().nullable().optional(),
  topicId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: optionalText(2000),
  estimatedMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'PARTIAL', 'SKIPPED']).optional(),
  skipReason: taskSkipReason.nullable().optional(),
}).strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
  .superRefine((value, context) => {
    if (value.skipReason !== undefined && value.status !== 'SKIPPED') {
      context.addIssue({
        code: 'custom',
        message: 'Skip reason requires SKIPPED status',
        path: ['skipReason'],
      })
    }
  })
export const rescheduleTaskSchema = z.object({
  scheduledFor: dateOnly.optional(),
  ...optionalTaskScheduleFields,
}).strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one scheduling field is required')
  .superRefine(refineTaskSchedule)

export const recordTaskProgressSchema = z.object({
  actualSolvedTestCount: z.number().int().min(0).max(2_147_483_647),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
}).strict()

export const uuidParamSchema = z.object({ id: z.string().uuid() }).strict()
export const subjectIdParamSchema = z.object({ subjectId: z.string().uuid() }).strict()
