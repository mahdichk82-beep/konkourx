import { z } from 'zod'
import { curriculumTargetsSchema } from './task-curriculum.js'
import {
  defaultTaskScheduleFields,
  optionalTaskScheduleFields,
  refineTaskSchedule,
} from './task-scheduling.js'

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
const pagination = {
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}

export const counselorStudentTaskParamSchema = z.object({
  studentProfileId: z.string().uuid(),
}).strict()

export const counselorStudentTaskScheduleParamSchema = z.object({
  studentProfileId: z.string().uuid(),
  taskId: z.string().uuid(),
}).strict()

export const counselorStudentTopicParamSchema = z.object({
  studentProfileId: z.string().uuid(),
  subjectId: z.string().uuid(),
}).strict()

export const listCounselorTaskResourcesSchema = z.object(pagination).strict()

export const listCounselorTasksSchema = z.object({
  ...pagination,
  from: dateOnly.optional(),
  to: dateOnly.optional(),
}).strict().refine(
  (value) => (value.from === undefined) === (value.to === undefined),
  'Both range dates are required',
)

export const createCounselorTaskSchema = z.object({
  contentType: z.enum(['STUDY', 'GENERAL']).optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  scheduledFor: dateOnly,
  ...defaultTaskScheduleFields,
  estimatedMinutes: z.number().int().min(1).max(1440).nullable().optional().default(null),
  subjectId: z.string().uuid().nullable().optional().default(null),
  topicId: z.string().uuid().nullable().optional().default(null),
  curriculumTargets: curriculumTargetsSchema,
}).strict().superRefine(refineTaskSchedule)

const createCounselorTaskBatchItemSchema = z.object({
  contentType: z.enum(['STUDY', 'GENERAL']).optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional().default(null),
  scheduledFor: dateOnly,
  ...defaultTaskScheduleFields,
  plannedMinutes: z.number().int().min(0).max(1440).optional().default(0),
  plannedTestCount: z.number().int().min(0).optional().default(0),
  subjectId: z.string().uuid().nullable().optional().default(null),
  topicId: z.string().uuid().nullable().optional().default(null),
  curriculumTargets: curriculumTargetsSchema,
}).strict().superRefine(refineTaskSchedule)

export const createCounselorTaskBatchSchema = z.object({
  tasks: z.array(createCounselorTaskBatchItemSchema).min(1).max(50),
}).strict()

export const rescheduleCounselorTaskSchema = z.object({
  scheduledFor: dateOnly.optional(),
  ...optionalTaskScheduleFields,
}).strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one scheduling field is required')
  .superRefine(refineTaskSchedule)

export const updateCounselorTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  estimatedMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  scheduledFor: dateOnly.optional(),
  ...optionalTaskScheduleFields,
}).strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
  .superRefine(refineTaskSchedule)
