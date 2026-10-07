import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError } from '../src/errors/api-error.js'
import { canonicalCurriculumStore } from '../src/curriculum/artifact.js'
import { createStudentCoreServices, type StudentCoreStore } from '../src/student-core/services.js'
import type { DailyTaskRecord } from '../src/student-core/types.js'

const now = new Date('2026-09-30T12:00:00.000Z')
const actor = { id: 'user-1', role: 'STUDENT' as const, status: 'ACTIVE' as const }

const record = (completed: number, total: number, status: DailyTaskRecord['status'] = 'PENDING'): DailyTaskRecord => ({
  id: 'task-1',
  studentProfileId: 'profile-1',
  createdByUserId: 'user-1',
  source: 'PERSONAL',
  studyPlanId: null,
  subjectId: null,
  topicId: null,
  title: 'Curriculum task',
  description: null,
  scheduledFor: new Date('2026-09-30T00:00:00.000Z'),
  estimatedMinutes: 75,
  plannedTestCount: 0,
  status,
  completedAt: null,
  partialAt: status === 'PARTIAL' ? now : null,
  skipReason: null,
  skippedAt: null,
  createdAt: now,
  updatedAt: now,
  curriculumTargets: [{
    id: 'target-1',
    referenceKind: 'NODE',
    curriculumRefId: 'node-parent',
    selectionMode: 'WHOLE',
    position: 0,
    labelSnapshot: 'parent',
    pathSnapshot: ['representation', 'parent'],
    representationIdSnapshot: 'representation-1',
    createdAt: now,
    items: Array.from({ length: total }, (_, index) => ({
      id: `item-${index + 1}`,
      targetId: 'target-1',
      referenceKind: 'NODE' as const,
      curriculumRefId: `node-${index + 1}`,
      labelSnapshot: `item ${index + 1}`,
      pathSnapshot: ['representation', 'parent', `item ${index + 1}`],
      position: index,
      completedAt: index < completed ? now : null,
      createdAt: now,
    })),
  }],
})

const serviceFor = (task: DailyTaskRecord) => {
  let terminalInput: unknown
  const store = {
    findStudentProfileByUserId: async () => ({ id: 'profile-1', userId: 'user-1' }),
    findTaskById: async (profileId: string, id: string) => profileId === 'profile-1' && id === task.id ? task : null,
    updateTask: async () => task,
    updateTerminalTask: async (_profileId: string, _id: string, input: unknown) => {
      terminalInput = input
      return { ok: true as const, value: { ...task, ...(input as object) } }
    },
  } as unknown as StudentCoreStore
  return { services: createStudentCoreServices(store, () => now), terminalInput: () => terminalInput }
}

test('Curriculum task outcomes enforce 0/N, X/N, and N/N lifecycle rules', async () => {
  await assert.rejects(
    serviceFor(record(0, 2)).services.tasks.update(actor, 'task-1', { status: 'PARTIAL' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_OUTCOME_INVALID',
  )
  await assert.rejects(
    serviceFor(record(1, 2)).services.tasks.update(actor, 'task-1', { status: 'COMPLETED' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_OUTCOME_INVALID',
  )
  await assert.rejects(
    serviceFor(record(1, 2)).services.tasks.update(actor, 'task-1', { status: 'SKIPPED' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_OUTCOME_INVALID',
  )

  const partial = serviceFor(record(1, 2))
  const partialView = await partial.services.tasks.update(actor, 'task-1', { status: 'PARTIAL' })
  assert.equal(partialView.status, 'PARTIAL')
  assert.equal(partialView.partialAt?.toISOString(), now.toISOString())
  assert.deepEqual(partial.terminalInput(), {
    status: 'PARTIAL',
    completedAt: null,
    partialAt: now,
    skipReason: null,
    skippedAt: null,
  })

  assert.equal((await serviceFor(record(0, 2)).services.tasks.update(actor, 'task-1', { status: 'SKIPPED' })).status, 'SKIPPED')
  assert.equal((await serviceFor(record(2, 2)).services.tasks.update(actor, 'task-1', { status: 'COMPLETED' })).status, 'COMPLETED')
})

test('PARTIAL is terminal and freeform tasks cannot be closed as PARTIAL', async () => {
  await assert.rejects(
    serviceFor(record(1, 2, 'PARTIAL')).services.tasks.update(actor, 'task-1', { status: 'PENDING' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_TERMINAL',
  )
  const freeform = { ...record(0, 0), curriculumTargets: [] }
  await assert.rejects(
    serviceFor(freeform).services.tasks.update(actor, 'task-1', { status: 'PARTIAL' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_OUTCOME_INVALID',
  )
})

test('student item toggles remain owner-scoped and terminal tasks reject execution edits', async () => {
  const calls: unknown[] = []
  const task = record(0, 2)
  const store = {
    findStudentProfileByUserId: async () => ({ id: 'profile-1', userId: 'user-1' }),
    toggleTaskCurriculumItem: async (...args: unknown[]) => {
      calls.push(args)
      return { ok: true as const, value: task }
    },
  } as unknown as StudentCoreStore
  const services = createStudentCoreServices(store, () => now)
  await services.tasks.toggleCurriculumItem(actor, 'task-1', 'item-1', { completed: true })
  assert.deepEqual(calls, [['profile-1', 'task-1', 'item-1', now]])

  const denied = {
    ...store,
    toggleTaskCurriculumItem: async () => ({ ok: false as const, reason: 'TASK_NOT_FOUND' as const }),
  } as unknown as StudentCoreStore
  await assert.rejects(
    createStudentCoreServices(denied).tasks.toggleCurriculumItem(actor, 'foreign-task', 'item-1', { completed: true }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_NOT_FOUND',
  )
})

test('student personal tasks persist multiple validated Curriculum targets while freeform tasks stay unlinked', async () => {
  const nodes = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')
    .flatMap((entry) => canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id))
    .flatMap((root) => root.itemKind === 'NODE' ? [root.nodeId] : root.childNodeIds)
  if (nodes.length < 2) throw new Error('Canonical Curriculum fixtures are required')
  const capturedTargets: unknown[] = []
  const createdTasks: DailyTaskRecord[] = []
  const store = {
    findStudentProfileByUserId: async () => ({ id: 'profile-1', userId: 'user-1', track: 'EXPERIMENTAL' as const }),
    createTask: async (input: Omit<DailyTaskRecord, 'id' | 'createdAt' | 'updatedAt' | 'curriculumTargets'>, targets = []) => {
      capturedTargets.push(targets)
      const task: DailyTaskRecord = {
        ...input,
        id: `task-${createdTasks.length + 1}`,
        createdAt: now,
        updatedAt: now,
        curriculumTargets: targets.map((target, targetIndex) => ({
          ...target,
          id: `target-${targetIndex + 1}`,
          createdAt: now,
          items: target.items.map((item, itemIndex) => ({
            ...item,
            id: `item-${targetIndex + 1}-${itemIndex + 1}`,
            targetId: `target-${targetIndex + 1}`,
            completedAt: null,
            createdAt: now,
          })),
        })),
      }
      createdTasks.push(task)
      return task
    },
  } as unknown as StudentCoreStore
  const services = createStudentCoreServices(store, () => now, canonicalCurriculumStore)

  const curriculumTask = await services.tasks.create(actor, {
    studyPlanId: null,
    subjectId: null,
    topicId: null,
    title: 'Personal Curriculum task',
    scheduledFor: '2026-09-30',
    estimatedMinutes: 75,
    status: 'PENDING',
    curriculumTargets: [
      { referenceKind: 'NODE', curriculumRefId: nodes[0]!, selectionMode: 'EXACT' },
      { referenceKind: 'NODE', curriculumRefId: nodes[1]!, selectionMode: 'EXACT' },
    ],
  })
  assert.equal(curriculumTask.source, 'PERSONAL')
  assert.equal(curriculumTask.curriculum.targets.length, 2)
  assert.equal(curriculumTask.curriculum.totalItemCount, 2)

  const freeform = await services.tasks.create(actor, {
    studyPlanId: null,
    subjectId: null,
    topicId: null,
    title: 'Gym appointment',
    scheduledFor: '2026-09-30',
    estimatedMinutes: 60,
    status: 'COMPLETED',
    curriculumTargets: [],
  })
  assert.equal(freeform.status, 'COMPLETED')
  assert.equal(freeform.curriculum.totalItemCount, 0)
  assert.deepEqual(capturedTargets.map((targets) => (targets as unknown[]).length), [2, 0])
})

test('student target replacement reports execution and terminal immutability without rewriting snapshots', async () => {
  const cases = [
    ['CURRICULUM_EXECUTION_STARTED', 'TASK_CURRICULUM_EXECUTION_STARTED'],
    ['TASK_NOT_PENDING', 'TASK_TERMINAL'],
  ] as const
  for (const [reason, errorCode] of cases) {
    const store = {
      findStudentProfileByUserId: async () => ({ id: 'profile-1', userId: 'user-1' }),
      findTaskById: async () => record(0, 0),
      replacePersonalTaskCurriculumTargets: async () => ({ ok: false as const, reason }),
    } as unknown as StudentCoreStore
    await assert.rejects(
      createStudentCoreServices(store, () => now, canonicalCurriculumStore)
        .tasks.replaceCurriculumTargets(actor, 'task-1', { curriculumTargets: [] }),
      (error: unknown) => error instanceof ApiError && error.code === errorCode,
    )
  }
})

test('historical WHOLE and PLACEMENT snapshots remain readable without a current track', async () => {
  const historical = record(0, 2)
  historical.contentType = null
  historical.curriculumTargets!.push({
    id: 'historical-placement', referenceKind: 'PLACEMENT', curriculumRefId: 'old-placement',
    selectionMode: 'EXACT', position: 1, labelSnapshot: 'Original placement',
    pathSnapshot: ['Original scope', 'Original grade', 'Original placement'],
    representationIdSnapshot: null, createdAt: now, items: [],
  })
  const store = {
    findStudentProfileByUserId: async () => ({ id: 'profile-1', userId: 'user-1', track: null }),
    findTaskById: async () => historical,
  } as unknown as StudentCoreStore
  const view = await createStudentCoreServices(store).tasks.get(actor, historical.id)
  assert.equal(view.contentType, null)
  assert.deepEqual(view.curriculum.targets.map((target) => target.selectionMode), ['WHOLE', 'EXACT'])
  assert.deepEqual(view.curriculum.targets[1]?.pathSnapshot, ['Original scope', 'Original grade', 'Original placement'])
})

test('replacement validates the entire proposed set before touching stored historical targets', async () => {
  const historical = record(0, 2)
  historical.contentType = null
  let writes = 0
  const store = {
    findStudentProfileByUserId: async () => ({ id: 'profile-1', userId: 'user-1', track: 'EXPERIMENTAL' as const }),
    findTaskById: async () => historical,
    replacePersonalTaskCurriculumTargets: async () => { writes++; return { ok: true as const, value: historical } },
  } as unknown as StudentCoreStore
  const service = createStudentCoreServices(store, () => now, canonicalCurriculumStore)
  const entry = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')[0]!
  const root = canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id)[0]!
  const nodeId = root.itemKind === 'NODE' ? root.nodeId : root.childNodeIds[0]!
  const valid = { referenceKind: 'NODE' as const, curriculumRefId: nodeId, selectionMode: 'EXACT' as const }
  await assert.rejects(
    service.tasks.replaceCurriculumTargets(actor, historical.id, { curriculumTargets: [valid, { ...valid, curriculumRefId: 'unknown' }] }),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK',
  )
  assert.equal(writes, 0)
  assert.equal(historical.curriculumTargets?.[0]?.selectionMode, 'WHOLE')
  await service.tasks.replaceCurriculumTargets(actor, historical.id, { curriculumTargets: [valid] })
  assert.equal(writes, 1)
  historical.contentType = 'GENERAL'
  await assert.rejects(
    service.tasks.replaceCurriculumTargets(actor, historical.id, { curriculumTargets: [valid] }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_GENERAL_TARGET_FORBIDDEN',
  )
  historical.contentType = 'STUDY'
  await assert.rejects(
    service.tasks.replaceCurriculumTargets(actor, historical.id, { curriculumTargets: [] }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_STUDY_TARGET_REQUIRED',
  )
  assert.equal(writes, 1)
})
