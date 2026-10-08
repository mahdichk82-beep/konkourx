import { z } from 'zod'

export const curriculumTargetSchema = z.object({
  referenceKind: z.enum(['NODE', 'PLACEMENT']),
  curriculumRefId: z.string().trim().min(1).max(100),
  selectionMode: z.enum(['EXACT', 'WHOLE']),
}).strict()

export const curriculumTargetListSchema = z.array(curriculumTargetSchema).max(50)

export const curriculumTargetsSchema = curriculumTargetListSchema.optional()

const nodeSelectorV2Schema = z.object({
  rootKind: z.literal('NODE'),
  rootId: z.string().trim().min(1).max(100),
  selector: z.enum(['EXACT', 'SUBTREE']),
}).strict()

const navigationGroupSelectorV2Schema = z.object({
  rootKind: z.literal('NAVIGATION_GROUP'),
  rootId: z.string().trim().min(1).max(100),
  selector: z.literal('SUBTREE'),
}).strict()

export const curriculumSelectionV2Schema = z.object({
  version: z.literal(2),
  selectors: z.array(z.discriminatedUnion('rootKind', [
    nodeSelectorV2Schema,
    navigationGroupSelectorV2Schema,
  ])).max(50),
}).strict()

export const curriculumWriteContractShape = {
  curriculumTargets: curriculumTargetsSchema,
  curriculumSelection: curriculumSelectionV2Schema.optional(),
}

export const refineCurriculumWriteContract = (
  value: { curriculumTargets?: unknown; curriculumSelection?: unknown },
  context: z.RefinementCtx,
): void => {
  if (value.curriculumTargets !== undefined && value.curriculumSelection !== undefined) {
    context.addIssue({
      code: 'custom',
      message: 'Curriculum v1 and v2 write contracts are mutually exclusive',
      path: ['curriculumSelection'],
    })
  }
}

export const replaceCurriculumTargetsSchema = z.object({
  ...curriculumWriteContractShape,
}).strict().superRefine((value, context) => {
  refineCurriculumWriteContract(value, context)
  if (value.curriculumTargets === undefined && value.curriculumSelection === undefined) {
    context.addIssue({ code: 'custom', message: 'A Curriculum write contract is required' })
  }
})

export const toggleCurriculumItemSchema = z.object({ completed: z.boolean() }).strict()

export const taskCurriculumItemParamSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
}).strict()

