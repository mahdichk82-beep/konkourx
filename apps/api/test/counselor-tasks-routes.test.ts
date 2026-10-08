import assert from 'node:assert/strict'
import test from 'node:test'
import type { AuthService } from '../src/auth/auth-service.js'
import type { PublicUser } from '../src/auth/types.js'
import {
  createCounselorTaskServices,
  type CounselorTaskStore,
} from '../src/counselor-tasks/services.js'
import type {
  CounselorStudentSubject,
  CounselorStudentTopic,
  CounselorVisibleTaskView,
  CreateCounselorTaskRecordInput,
} from '../src/counselor-tasks/types.js'
import { ApiError } from '../src/errors/api-error.js'
import { buildApp } from '../src/app.js'
import type { DailyTaskRecord } from '../src/student-core/types.js'
import { canonicalCurriculumStore } from '../src/curriculum/artifact.js'
import type { ResolvedCurriculumTarget } from '../src/task-curriculum/types.js'

const ids = {
  counselorA: '10000000-0000-4000-8000-000000000001',
  counselorB: '10000000-0000-4000-8000-000000000002',
  studentUser: '20000000-0000-4000-8000-000000000001',
  studentA: '30000000-0000-4000-8000-000000000001',
  studentB: '30000000-0000-4000-8000-000000000002',
  studentUnassigned: '30000000-0000-4000-8000-000000000003',
  subjectA: '40000000-0000-4000-8000-000000000001',
  subjectB: '40000000-0000-4000-8000-000000000002',
  archivedSubject: '40000000-0000-4000-8000-000000000003',
  topicA: '50000000-0000-4000-8000-000000000001',
  topicB: '50000000-0000-4000-8000-000000000002',
  archivedTopic: '50000000-0000-4000-8000-000000000003',
} as const

const timestamp = new Date('2026-09-11T00:00:00.000Z')

const publicUser = (id: string, role: PublicUser['role']): PublicUser => ({
  id,
  email: `${id}@example.com`,
  phone: null,
  role,
  status: 'ACTIVE',
  createdAt: timestamp,
  updatedAt: timestamp,
})

const usersByToken = new Map<string, PublicUser>([
  ['counselor-a', publicUser(ids.counselorA, 'COUNSELOR')],
  ['counselor-b', publicUser(ids.counselorB, 'COUNSELOR')],
  ['student', publicUser(ids.studentUser, 'STUDENT')],
])

const createAuth = (): AuthService => ({
  authenticateAccessToken: async (token) => {
    const user = usersByToken.get(token)
    if (!user) throw new ApiError(401, 'TOKEN_INVALID', 'Access token is invalid')
    return user
  },
  changePassword: async () => undefined,
  getCurrentUser: async () => { throw new Error('not used') },
  login: async () => { throw new Error('not used') },
  logout: async () => undefined,
  logoutAll: async () => undefined,
  refresh: async () => { throw new Error('not used') },
  register: async () => { throw new Error('not used') },
})

type SubjectFixture = CounselorStudentSubject & {
  archived: boolean
  studentProfileId: string
}
type TopicFixture = CounselorStudentTopic & { archived: boolean }

const subjectFixtures: SubjectFixture[] = [
  { id: ids.subjectA, name: 'زیست‌شناسی', studentProfileId: ids.studentA, archived: false },
  { id: ids.subjectB, name: 'ریاضی', studentProfileId: ids.studentB, archived: false },
  { id: ids.archivedSubject, name: 'درس بایگانی', studentProfileId: ids.studentA, archived: true },
]
const topicFixtures: TopicFixture[] = [
  { id: ids.topicA, subjectId: ids.subjectA, title: 'ژنتیک', archived: false },
  { id: ids.topicB, subjectId: ids.subjectB, title: 'تابع', archived: false },
  { id: ids.archivedTopic, subjectId: ids.subjectA, title: 'مبحث بایگانی', archived: true },
]

const assignments = new Map<string, string[]>([
  [ids.counselorA, [ids.studentA]],
  [ids.counselorB, [ids.studentB]],
])

const createStore = (): CounselorTaskStore & {
  activeAssignments: Map<string, string[]>
  studentTracks: Map<string, 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES' | null>
  sessionMinutesByTaskId: Map<string, number[]>
  tasks: DailyTaskRecord[]
} => {
  const store = {
    activeAssignments: new Map([...assignments].map(([key, value]) => [key, [...value]])),
    studentTracks: new Map<string, 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES' | null>([
      [ids.studentA, 'EXPERIMENTAL'],
      [ids.studentB, 'HUMANITIES'],
    ]),
    sessionMinutesByTaskId: new Map<string, number[]>(),
    tasks: [] as DailyTaskRecord[],
    async findAssignedStudentTrack(counselorUserId: string, studentProfileId: string) {
      if (!(store.activeAssignments.get(counselorUserId) ?? []).includes(studentProfileId)) {
        return { ok: false as const, reason: 'STUDENT_NOT_FOUND' as const }
      }
      return { ok: true as const, value: store.studentTracks.get(studentProfileId) ?? null }
    },
    async listAssignedStudentTasks(
      counselorUserId: string,
      studentProfileId: string,
      query: { cursor?: string; limit?: number; scheduledFrom?: Date; scheduledTo?: Date },
    ) {
      if (!(store.activeAssignments.get(counselorUserId) ?? []).includes(studentProfileId)) {
        return { ok: false as const, reason: 'STUDENT_NOT_FOUND' as const }
      }
      const tasks: CounselorVisibleTaskView[] = store.tasks
        .filter((task) =>
          task.studentProfileId === studentProfileId
          && (!query.scheduledFrom || task.scheduledFor >= query.scheduledFrom)
          && (!query.scheduledTo || task.scheduledFor <= query.scheduledTo),
        )
        .map(({ createdByUserId: _createdByUserId, ...task }) => {
          const sessionMinutes = store.sessionMinutesByTaskId.get(task.id) ?? []
          return {
            ...task,
            recordedMinutes: sessionMinutes.reduce((total, minutes) => total + minutes, 0),
            studySessionCount: sessionMinutes.length,
          }
        })
      const start = query.cursor
        ? Math.max(tasks.findIndex(({ id }) => id === query.cursor) + 1, 0)
        : 0
      return {
        ok: true as const,
        value: tasks.slice(start, start + (query.limit ?? 50) + 1),
      }
    },
    async listAssignedStudentSubjects(
      counselorUserId: string,
      studentProfileId: string,
      query: { cursor?: string; limit?: number },
    ) {
      if (!(store.activeAssignments.get(counselorUserId) ?? []).includes(studentProfileId)) {
        return { ok: false as const, reason: 'STUDENT_NOT_FOUND' as const }
      }
      const subjects = subjectFixtures
        .filter((subject) => subject.studentProfileId === studentProfileId && !subject.archived)
        .map(({ id, name }) => ({ id, name }))
      const start = query.cursor
        ? Math.max(subjects.findIndex(({ id }) => id === query.cursor) + 1, 0)
        : 0
      return {
        ok: true as const,
        value: subjects.slice(start, start + (query.limit ?? 50) + 1),
      }
    },
    async listAssignedStudentTopics(
      counselorUserId: string,
      studentProfileId: string,
      subjectId: string,
      query: { cursor?: string; limit?: number },
    ) {
      if (!(store.activeAssignments.get(counselorUserId) ?? []).includes(studentProfileId)) {
        return { ok: false as const, reason: 'STUDENT_NOT_FOUND' as const }
      }
      const subject = subjectFixtures.find((candidate) =>
        candidate.id === subjectId
        && candidate.studentProfileId === studentProfileId
        && !candidate.archived,
      )
      if (!subject) return { ok: false as const, reason: 'SUBJECT_NOT_FOUND' as const }
      const topics = topicFixtures
        .filter((topic) => topic.subjectId === subjectId && !topic.archived)
        .map(({ id, title }) => ({ id, subjectId, title }))
      const start = query.cursor
        ? Math.max(topics.findIndex(({ id }) => id === query.cursor) + 1, 0)
        : 0
      return {
        ok: true as const,
        value: topics.slice(start, start + (query.limit ?? 50) + 1),
      }
    },
    async createAssignedStudentTask(
      counselorUserId: string,
      studentProfileId: string,
      input: CreateCounselorTaskRecordInput,
      curriculumTargets: ResolvedCurriculumTarget[] = [],
    ) {
      if (!(store.activeAssignments.get(counselorUserId) ?? []).includes(studentProfileId)) {
        return { ok: false as const, reason: 'STUDENT_NOT_FOUND' as const }
      }
      if (input.subjectId) {
        const subject = subjectFixtures.find((candidate) =>
          candidate.id === input.subjectId && candidate.studentProfileId === studentProfileId,
        )
        if (!subject) return { ok: false as const, reason: 'SUBJECT_NOT_FOUND' as const }
        if (subject.archived) return { ok: false as const, reason: 'SUBJECT_ARCHIVED' as const }
      }
      if (input.topicId) {
        if (!input.subjectId) {
          return { ok: false as const, reason: 'TOPIC_SUBJECT_REQUIRED' as const }
        }
        const ownedSubjectIds = new Set(
          subjectFixtures
            .filter(({ studentProfileId: owner }) => owner === studentProfileId)
            .map(({ id }) => id),
        )
        const topic = topicFixtures.find((candidate) =>
          candidate.id === input.topicId && ownedSubjectIds.has(candidate.subjectId),
        )
        if (!topic) return { ok: false as const, reason: 'TOPIC_NOT_FOUND' as const }
        if (topic.subjectId !== input.subjectId) {
          return { ok: false as const, reason: 'TOPIC_SUBJECT_MISMATCH' as const }
        }
        if (topic.archived) return { ok: false as const, reason: 'TOPIC_ARCHIVED' as const }
      }
      const record: DailyTaskRecord = {
        id: `60000000-0000-4000-8000-${String(store.tasks.length + 1).padStart(12, '0')}`,
        ...input,
        createdAt: timestamp,
        updatedAt: timestamp,
        curriculumTargets: curriculumTargets.map((target, targetIndex) => ({
          ...target,
          id: `72000000-0000-4000-8000-${String(targetIndex + 1).padStart(12, '0')}`,
          createdAt: timestamp,
          items: target.items.map((item, itemIndex) => ({
            ...item,
            id: `73000000-0000-4000-8000-${String(itemIndex + 1).padStart(12, '0')}`,
            targetId: `72000000-0000-4000-8000-${String(targetIndex + 1).padStart(12, '0')}`,
            completedAt: null,
            createdAt: timestamp,
          })),
        })),
      }
      store.tasks.push(record)
      return { ok: true as const, value: record }
    },
    async createAssignedStudentTasksBatch(
      counselorUserId: string,
      studentProfileId: string,
      inputs: CreateCounselorTaskRecordInput[],
      curriculumTargetsByTask: ResolvedCurriculumTarget[][] = [],
    ) {
      if (!(store.activeAssignments.get(counselorUserId) ?? []).includes(studentProfileId)) {
        return { ok: false as const, reason: 'STUDENT_NOT_FOUND' as const }
      }
      for (const input of inputs) {
        if (input.subjectId) {
          const subject = subjectFixtures.find((candidate) =>
            candidate.id === input.subjectId && candidate.studentProfileId === studentProfileId,
          )
          if (!subject) return { ok: false as const, reason: 'SUBJECT_NOT_FOUND' as const }
          if (subject.archived) return { ok: false as const, reason: 'SUBJECT_ARCHIVED' as const }
        }
        if (input.topicId) {
          if (!input.subjectId) {
            return { ok: false as const, reason: 'TOPIC_SUBJECT_REQUIRED' as const }
          }
          const ownedSubjectIds = new Set(
            subjectFixtures
              .filter(({ studentProfileId: owner }) => owner === studentProfileId)
              .map(({ id }) => id),
          )
          const topic = topicFixtures.find((candidate) =>
            candidate.id === input.topicId && ownedSubjectIds.has(candidate.subjectId),
          )
          if (!topic) return { ok: false as const, reason: 'TOPIC_NOT_FOUND' as const }
          if (topic.subjectId !== input.subjectId) {
            return { ok: false as const, reason: 'TOPIC_SUBJECT_MISMATCH' as const }
          }
          if (topic.archived) return { ok: false as const, reason: 'TOPIC_ARCHIVED' as const }
        }
      }
      const records = inputs.map((input, index): DailyTaskRecord => {
        const taskId = `61000000-0000-4000-8000-${String(store.tasks.length + index + 1).padStart(12, '0')}`
        return {
          id: taskId,
          ...input,
          createdAt: timestamp,
          updatedAt: timestamp,
          curriculumTargets: (curriculumTargetsByTask[index] ?? []).map((target, targetIndex) => {
            const targetId = `74000000-0000-4000-8000-${String(targetIndex + 1).padStart(12, '0')}`
            return {
              ...target,
              id: targetId,
              createdAt: timestamp,
              items: target.items.map((item, itemIndex) => ({
                ...item,
                id: `75000000-0000-4000-8000-${String(itemIndex + 1).padStart(12, '0')}`,
                targetId,
                completedAt: null,
                createdAt: timestamp,
              })),
            }
          }),
        }
      })
      store.tasks.push(...records)
      return { ok: true as const, value: records }
    },
    async rescheduleAssignedStudentTask(
      counselorUserId: string,
      studentProfileId: string,
      taskId: string,
      patch: Partial<DailyTaskRecord>,
    ) {
      if (!(store.activeAssignments.get(counselorUserId) ?? []).includes(studentProfileId)) {
        return { ok: false as const, reason: 'STUDENT_NOT_FOUND' as const }
      }
      const task = store.tasks.find((candidate) =>
        candidate.id === taskId && candidate.studentProfileId === studentProfileId,
      )
      if (!task) return { ok: false as const, reason: 'TASK_NOT_FOUND' as const }
      if (task.source !== 'COUNSELOR') {
        return { ok: false as const, reason: 'TASK_SOURCE_FORBIDDEN' as const }
      }
      if ((store.sessionMinutesByTaskId.get(taskId) ?? []).length > 0) {
        return { ok: false as const, reason: 'TASK_EXECUTED' as const }
      }
      Object.assign(task, patch)
      task.updatedAt = timestamp
      return { ok: true as const, value: task }
    },
    async replaceAssignedTaskCurriculumTargets(
      counselorUserId: string,
      studentProfileId: string,
      taskId: string,
      targets: ResolvedCurriculumTarget[],
    ) {
      if (!(store.activeAssignments.get(counselorUserId) ?? []).includes(studentProfileId)) {
        return { ok: false as const, reason: 'STUDENT_NOT_FOUND' as const }
      }
      const task = store.tasks.find((candidate) =>
        candidate.id === taskId && candidate.studentProfileId === studentProfileId,
      )
      if (!task) return { ok: false as const, reason: 'TASK_NOT_FOUND' as const }
      if (task.source !== 'COUNSELOR') return { ok: false as const, reason: 'TASK_SOURCE_FORBIDDEN' as const }
      if (task.status !== 'PENDING') return { ok: false as const, reason: 'TASK_NOT_PENDING' as const }
      if (task.curriculumTargets?.some((target) => target.items.some((item) => item.completedAt))) {
        return { ok: false as const, reason: 'CURRICULUM_EXECUTION_STARTED' as const }
      }
      task.curriculumTargets = targets.map((target, targetIndex) => ({
        ...target,
        id: `70000000-0000-4000-8000-${String(targetIndex + 1).padStart(12, '0')}`,
        createdAt: timestamp,
        items: target.items.map((item, itemIndex) => ({
          ...item,
          id: `71000000-0000-4000-8000-${String(itemIndex + 1).padStart(12, '0')}`,
          targetId: `70000000-0000-4000-8000-${String(targetIndex + 1).padStart(12, '0')}`,
          completedAt: null,
          createdAt: timestamp,
        })),
      }))
      return { ok: true as const, value: task }
    },
  }
  return store
}

const createApp = (store = createStore()) => ({
  app: buildApp({
    auth: createAuth(),
    counselorTasks: createCounselorTaskServices(store, canonicalCurriculumStore),
    environment: 'test',
    logger: false,
    prisma: { $queryRaw: async () => [{ '?column?': 1 }] },
  }),
  store,
})

const createRequest = (
  app: ReturnType<typeof createApp>['app'],
  token: string,
  studentProfileId: string,
  payload: Record<string, unknown>,
) => app.inject({
  headers: { authorization: `Bearer ${token}` },
  method: 'POST',
  payload,
  url: `/api/v1/counselor/students/${studentProfileId}/tasks`,
})

const batchCreateRequest = (
  app: ReturnType<typeof createApp>['app'],
  token: string,
  studentProfileId: string,
  payload: Record<string, unknown>,
) => app.inject({
  headers: { authorization: `Bearer ${token}` },
  method: 'POST',
  payload,
  url: `/api/v1/counselor/students/${studentProfileId}/tasks/batch`,
})

const listRequest = (
  app: ReturnType<typeof createApp>['app'],
  studentProfileId: string,
  token?: string,
  query = '',
) => app.inject({
  headers: token ? { authorization: `Bearer ${token}` } : undefined,
  method: 'GET',
  url: `/api/v1/counselor/students/${studentProfileId}/tasks${query}`,
})

const scheduleRequest = (
  app: ReturnType<typeof createApp>['app'],
  token: string,
  studentProfileId: string,
  taskId: string,
  payload: Record<string, unknown>,
) => app.inject({
  headers: { authorization: `Bearer ${token}` },
  method: 'PATCH',
  payload,
  url: `/api/v1/counselor/students/${studentProfileId}/tasks/${taskId}/schedule`,
})

const updateRequest = (
  app: ReturnType<typeof createApp>['app'],
  token: string,
  studentProfileId: string,
  taskId: string,
  payload: Record<string, unknown>,
) => app.inject({
  headers: { authorization: `Bearer ${token}` },
  method: 'PATCH',
  payload,
  url: `/api/v1/counselor/students/${studentProfileId}/tasks/${taskId}`,
})

const taskRecord = (
  id: string,
  overrides: Partial<DailyTaskRecord> = {},
): DailyTaskRecord => ({
  completedAt: null,
  createdAt: timestamp,
  createdByUserId: ids.studentUser,
  description: null,
  estimatedMinutes: null,
  id,
  plannedTestCount: 0,
  scheduledFor: new Date('2026-09-12T00:00:00.000Z'),
  skipReason: null,
  skippedAt: null,
  source: 'PERSONAL',
  status: 'PENDING',
  studentProfileId: ids.studentA,
  studyPlanId: null,
  subjectId: null,
  title: 'Task',
  topicId: null,
  updatedAt: timestamp,
  ...overrides,
})

test('assigned counselor sees personal and counselor-created tasks without creator identity', async () => {
  const { app, store } = createApp()
  const completedAt = new Date('2026-09-12T10:30:00.000Z')
  store.tasks.push(
    taskRecord('60000000-0000-4000-8000-000000000010', {
      completedAt,
      status: 'COMPLETED',
      title: 'Personal completed task',
    }),
    taskRecord('60000000-0000-4000-8000-000000000011', {
      createdByUserId: ids.counselorB,
      source: 'COUNSELOR',
      title: 'Counselor task',
    }),
    taskRecord('60000000-0000-4000-8000-000000000012', {
      studentProfileId: ids.studentB,
      title: 'Other student task',
    }),
  )
  store.sessionMinutesByTaskId.set(
    '60000000-0000-4000-8000-000000000010',
    [30, 45],
  )

  const response = await listRequest(app, ids.studentA, 'counselor-a')

  assert.equal(response.statusCode, 200)
  assert.deepEqual(
    response.json().data.items.map((task: { source: string }) => task.source),
    ['PERSONAL', 'COUNSELOR'],
  )
  assert.equal(response.json().data.items[0].completedAt, completedAt.toISOString())
  assert.equal(response.json().data.items[0].status, 'COMPLETED')
  assert.equal(response.json().data.items[0].recordedMinutes, 75)
  assert.equal(response.json().data.items[0].studySessionCount, 2)
  assert.equal(response.json().data.items[1].status, 'PENDING')
  assert.equal(
    response.json().data.items.every((task: Record<string, unknown>) => !('createdByUserId' in task)),
    true,
  )
  await app.close()
})

test('counselor cannot list tasks for unassigned or another counselor assigned students', async () => {
  const { app } = createApp()

  for (const studentProfileId of [ids.studentUnassigned, ids.studentB]) {
    const response = await listRequest(app, studentProfileId, 'counselor-a')
    assert.equal(response.statusCode, 404)
    assert.equal(response.json().error.code, 'STUDENT_NOT_FOUND')
  }
  await app.close()
})

test('student and unauthenticated callers cannot list counselor-scoped tasks', async () => {
  const { app } = createApp()
  const studentResponse = await listRequest(app, ids.studentA, 'student')
  assert.equal(studentResponse.statusCode, 403)
  assert.equal(studentResponse.json().error.code, 'ROLE_FORBIDDEN')

  const unauthenticated = await listRequest(app, ids.studentA)
  assert.equal(unauthenticated.statusCode, 401)
  assert.equal(unauthenticated.json().error.code, 'TOKEN_MISSING')
  await app.close()
})

test('assigned counselor sees only the selected student weekly task range', async () => {
  const { app, store } = createApp()
  store.tasks.push(
    taskRecord('60000000-0000-4000-8000-000000000020', {
      scheduledFor: new Date('2026-09-12T00:00:00.000Z'),
      title: 'Week start',
    }),
    taskRecord('60000000-0000-4000-8000-000000000021', {
      createdByUserId: ids.counselorA,
      scheduledFor: new Date('2026-09-18T00:00:00.000Z'),
      source: 'COUNSELOR',
      title: 'Week end',
    }),
    taskRecord('60000000-0000-4000-8000-000000000022', {
      scheduledFor: new Date('2026-09-19T00:00:00.000Z'),
      title: 'Next week',
    }),
    taskRecord('60000000-0000-4000-8000-000000000023', {
      scheduledFor: new Date('2026-09-14T00:00:00.000Z'),
      studentProfileId: ids.studentB,
      title: 'Other student',
    }),
  )

  const response = await listRequest(
    app,
    ids.studentA,
    'counselor-a',
    '?from=2026-09-12&to=2026-09-18&limit=100',
  )
  assert.equal(response.statusCode, 200)
  assert.deepEqual(
    response.json().data.items.map((task: { title: string }) => task.title),
    ['Week start', 'Week end'],
  )
  assert.equal(
    response.json().data.items.every((task: Record<string, unknown>) => !('createdByUserId' in task)),
    true,
  )

  for (const studentProfileId of [ids.studentUnassigned, ids.studentB]) {
    const denied = await listRequest(
      app,
      studentProfileId,
      'counselor-a',
      '?from=2026-09-12&to=2026-09-18',
    )
    assert.equal(denied.statusCode, 404)
    assert.equal(denied.json().error.code, 'STUDENT_NOT_FOUND')
  }

  const incompleteRange = await listRequest(
    app,
    ids.studentA,
    'counselor-a',
    '?from=2026-09-12',
  )
  assert.equal(incompleteRange.statusCode, 400)
  assert.equal(incompleteRange.json().error.code, 'VALIDATION_ERROR')

  const reversedRange = await listRequest(
    app,
    ids.studentA,
    'counselor-a',
    '?from=2026-09-18&to=2026-09-12',
  )
  assert.equal(reversedRange.statusCode, 400)
  assert.equal(reversedRange.json().error.code, 'TASK_DATE_RANGE_INVALID')
  await app.close()
})

test('assigned counselor creates a pending counselor task with server-owned provenance', async () => {
  const { app, store } = createApp()
  const response = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'مرور ژنتیک',
    description: 'فصل وراثت مرور شود',
    scheduledFor: '2026-09-12',
    estimatedMinutes: 45,
    subjectId: ids.subjectA,
    topicId: ids.topicA,
  })

  assert.equal(response.statusCode, 201)
  assert.equal(response.json().data.source, 'COUNSELOR')
  assert.equal(response.json().data.status, 'PENDING')
  assert.equal(response.json().data.completedAt, null)
  assert.equal(response.json().data.studentProfileId, ids.studentA)
  assert.equal(response.json().data.subjectId, ids.subjectA)
  assert.equal(response.json().data.topicId, ids.topicA)
  assert.equal(response.json().data.studyPlanId, null)
  assert.equal('createdByUserId' in response.json().data, false)
  assert.equal(store.tasks[0]?.createdByUserId, ids.counselorA)
  assert.equal(store.tasks[0]?.studentProfileId, ids.studentA)
  assert.equal(store.tasks[0]?.source, 'COUNSELOR')
  assert.equal(store.tasks[0]?.status, 'PENDING')
  assert.equal(store.tasks[0]?.completedAt, null)
  await app.close()
})

test('assigned counselor creates a task with an exact 15-minute schedule', async () => {
  const { app, store } = createApp()
  const entry = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')[0]!
  const root = canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id)[0]!
  const nodeId = root.itemKind === 'NODE' ? root.nodeId : root.childNodeIds[0]!
  const response = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'برنامه دقیق زیست',
    scheduledFor: '2026-10-01',
    startMinuteOfDay: 15 * 60 + 45,
    endMinuteOfDay: 17 * 60,
    curriculumTargets: [{
      referenceKind: 'NODE',
      curriculumRefId: nodeId,
      selectionMode: 'EXACT',
    }],
  })

  assert.equal(response.statusCode, 201)
  assert.equal(response.json().data.startMinuteOfDay, 945)
  assert.equal(response.json().data.endMinuteOfDay, 1020)
  assert.equal(response.json().data.miniBoxSpan, 5)
  assert.equal(response.json().data.curriculum.totalItemCount, 1)
  assert.equal(store.tasks[0]?.startMinuteOfDay, 945)
  assert.equal(store.tasks[0]?.endMinuteOfDay, 1020)
  await app.close()
})

test('task creation rejects incomplete, unaligned, reversed, and cross-midnight schedules', async () => {
  const { app, store } = createApp()
  const invalidSchedules = [
    { startMinuteOfDay: 600 },
    { startMinuteOfDay: 601, endMinuteOfDay: 660 },
    { startMinuteOfDay: 660, endMinuteOfDay: 600 },
    { startMinuteOfDay: 23 * 60 + 45, endMinuteOfDay: 15 },
  ]

  for (const schedule of invalidSchedules) {
    const response = await createRequest(app, 'counselor-a', ids.studentA, {
      title: 'برنامه نامعتبر',
      scheduledFor: '2026-10-01',
      ...schedule,
    })
    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  }
  assert.equal(store.tasks.length, 0)
  await app.close()
})

test('assigned counselor creates multiple ordinary pending tasks with server provenance', async () => {
  const { app, store } = createApp()
  const response = await batchCreateRequest(app, 'counselor-a', ids.studentA, {
    tasks: [
      {
        title: 'مطالعه زیست فصل ۳',
        description: 'مرور کامل فصل',
        scheduledFor: '2026-09-15',
        plannedMinutes: 90,
        plannedTestCount: 12,
        subjectId: ids.subjectA,
        topicId: ids.topicA,
      },
      {
        title: 'مرور آزاد',
        scheduledFor: '2026-09-16',
        plannedMinutes: 0,
        plannedTestCount: 0,
      },
    ],
  })

  assert.equal(response.statusCode, 201)
  assert.equal(response.json().data.created, 2)
  assert.equal(response.json().data.tasks.length, 2)
  assert.deepEqual(
    response.json().data.tasks.map((task: Record<string, unknown>) => ({
      completedAt: task.completedAt,
      plannedTestCount: task.plannedTestCount,
      skipReason: task.skipReason,
      skippedAt: task.skippedAt,
      source: task.source,
      status: task.status,
    })),
    [
      {
        completedAt: null,
        plannedTestCount: 12,
        skipReason: null,
        skippedAt: null,
        source: 'COUNSELOR',
        status: 'PENDING',
      },
      {
        completedAt: null,
        plannedTestCount: 0,
        skipReason: null,
        skippedAt: null,
        source: 'COUNSELOR',
        status: 'PENDING',
      },
    ],
  )
  assert.equal(
    response.json().data.tasks.every((task: Record<string, unknown>) => !('createdByUserId' in task)),
    true,
  )
  assert.equal(store.tasks.every((task) => task.createdByUserId === ids.counselorA), true)
  assert.equal(store.tasks.every((task) => task.studentProfileId === ids.studentA), true)
  assert.equal(store.tasks[0]?.estimatedMinutes, 90)
  await app.close()
})

test('batch task creation rejects non-counselors and missing authentication', async () => {
  const { app, store } = createApp()
  const payload = { tasks: [{ title: 'Blocked', scheduledFor: '2026-09-15' }] }
  const student = await batchCreateRequest(app, 'student', ids.studentA, payload)
  assert.equal(student.statusCode, 403)
  assert.equal(student.json().error.code, 'ROLE_FORBIDDEN')

  const anonymous = await app.inject({
    method: 'POST',
    payload,
    url: `/api/v1/counselor/students/${ids.studentA}/tasks/batch`,
  })
  assert.equal(anonymous.statusCode, 401)
  assert.equal(anonymous.json().error.code, 'TOKEN_MISSING')
  assert.equal(store.tasks.length, 0)
  await app.close()
})

test('batch task creation rejects unassigned students and forged server fields', async () => {
  const { app, store } = createApp()
  const unassigned = await batchCreateRequest(app, 'counselor-a', ids.studentUnassigned, {
    tasks: [{ title: 'Blocked', scheduledFor: '2026-09-15' }],
  })
  assert.equal(unassigned.statusCode, 404)
  assert.equal(unassigned.json().error.code, 'STUDENT_NOT_FOUND')

  for (const forgedField of [
    { createdByUserId: ids.studentUser },
    { source: 'PERSONAL' },
    { studentProfileId: ids.studentB },
    { status: 'COMPLETED' },
  ]) {
    const forged = await batchCreateRequest(app, 'counselor-a', ids.studentA, {
      tasks: [{
        title: 'Forged',
        scheduledFor: '2026-09-15',
        ...forgedField,
      }],
    })
    assert.equal(forged.statusCode, 400)
    assert.equal(forged.json().error.code, 'VALIDATION_ERROR')
  }
  assert.equal(store.tasks.length, 0)
  await app.close()
})

test('batch task creation rejects invalid subject and topic relationships atomically', async () => {
  const { app, store } = createApp()
  const invalidSubject = await batchCreateRequest(app, 'counselor-a', ids.studentA, {
    tasks: [
      { title: 'Valid first row', scheduledFor: '2026-09-15' },
      { title: 'Foreign subject', scheduledFor: '2026-09-16', subjectId: ids.subjectB },
    ],
  })
  assert.equal(invalidSubject.statusCode, 404)
  assert.equal(invalidSubject.json().error.code, 'SUBJECT_NOT_FOUND')
  assert.equal(store.tasks.length, 0)

  const mismatchedTopic = await batchCreateRequest(app, 'counselor-a', ids.studentA, {
    tasks: [{
      title: 'Mismatched topic',
      scheduledFor: '2026-09-15',
      subjectId: ids.subjectA,
      topicId: ids.topicB,
    }],
  })
  assert.equal(mismatchedTopic.statusCode, 404)
  assert.equal(mismatchedTopic.json().error.code, 'TOPIC_NOT_FOUND')
  assert.equal(store.tasks.length, 0)
  await app.close()
})

test('batch task schema rejects empty batches and invalid planning counts', async () => {
  const { app, store } = createApp()
  for (const { payload, errorCode } of [
    { payload: { tasks: [] }, errorCode: 'VALIDATION_ERROR' },
    {
      payload: { tasks: [{ title: 'Invalid minutes', scheduledFor: '2026-09-15', plannedMinutes: -1 }] },
      errorCode: 'VALIDATION_ERROR',
    },
    {
      payload: { tasks: [{ title: 'Invalid tests', scheduledFor: '2026-09-15', plannedTestCount: -1 }] },
      errorCode: 'VALIDATION_ERROR',
    },
    {
      payload: { tasks: [{ title: 'Invalid date', scheduledFor: '2026-02-30' }] },
      errorCode: 'TASK_DATE_INVALID',
    },
  ]) {
    const response = await batchCreateRequest(app, 'counselor-a', ids.studentA, payload)
    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, errorCode)
  }
  assert.equal(store.tasks.length, 0)
  await app.close()
})

test('assigned counselor reschedules a counselor task without changing ownership or provenance', async () => {
  const { app, store } = createApp()
  const task = taskRecord('60000000-0000-4000-8000-000000000030', {
    createdByUserId: ids.counselorA,
    source: 'COUNSELOR',
  })
  store.tasks.push(task)
  const original = {
    createdByUserId: task.createdByUserId,
    source: task.source,
    studentProfileId: task.studentProfileId,
  }

  const response = await scheduleRequest(
    app,
    'counselor-a',
    ids.studentA,
    task.id,
    { scheduledFor: '2026-09-15' },
  )
  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data.scheduledFor, '2026-09-15T00:00:00.000Z')
  assert.equal('createdByUserId' in response.json().data, false)
  assert.deepEqual(
    {
      createdByUserId: store.tasks[0]?.createdByUserId,
      source: store.tasks[0]?.source,
      studentProfileId: store.tasks[0]?.studentProfileId,
    },
    original,
  )
  await app.close()
})

test('assigned counselor updates task schedule and instructions without changing provenance', async () => {
  const { app, store } = createApp()
  const task = taskRecord('60000000-0000-4000-8000-000000000035', {
    createdByUserId: ids.counselorA,
    source: 'COUNSELOR',
  })
  store.tasks.push(task)

  const response = await updateRequest(
    app,
    'counselor-a',
    ids.studentA,
    task.id,
    {
      title: 'برنامه ویرایش‌شده',
      description: 'دستور جدید',
      scheduledFor: '2026-10-02',
      startMinuteOfDay: 480,
      endMinuteOfDay: 555,
    },
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data.title, 'برنامه ویرایش‌شده')
  assert.equal(response.json().data.description, 'دستور جدید')
  assert.equal(response.json().data.startMinuteOfDay, 480)
  assert.equal(response.json().data.endMinuteOfDay, 555)
  assert.equal(response.json().data.miniBoxSpan, 5)
  assert.equal(store.tasks[0]?.source, 'COUNSELOR')
  assert.equal(store.tasks[0]?.createdByUserId, ids.counselorA)
  await app.close()
})

test('counselor task update preserves assignment and ownership authorization', async () => {
  const { app, store } = createApp()
  const personal = taskRecord('60000000-0000-4000-8000-000000000036')
  const foreign = taskRecord('60000000-0000-4000-8000-000000000037', {
    createdByUserId: ids.counselorB,
    source: 'COUNSELOR',
    studentProfileId: ids.studentB,
  })
  store.tasks.push(personal, foreign)

  const personalResponse = await updateRequest(
    app, 'counselor-a', ids.studentA, personal.id, { title: 'غیرمجاز' },
  )
  assert.equal(personalResponse.statusCode, 403)
  assert.equal(personalResponse.json().error.code, 'TASK_UPDATE_FORBIDDEN')

  const foreignResponse = await updateRequest(
    app, 'counselor-a', ids.studentB, foreign.id, { title: 'غیرمجاز' },
  )
  assert.equal(foreignResponse.statusCode, 404)
  assert.equal(foreignResponse.json().error.code, 'STUDENT_NOT_FOUND')
  await app.close()
})

test('counselor rescheduling rejects personal, executed, foreign, and inactive-assignment tasks', async () => {
  const { app, store } = createApp()
  const personal = taskRecord('60000000-0000-4000-8000-000000000031')
  const executed = taskRecord('60000000-0000-4000-8000-000000000032', {
    createdByUserId: ids.counselorA,
    source: 'COUNSELOR',
  })
  const foreign = taskRecord('60000000-0000-4000-8000-000000000033', {
    createdByUserId: ids.counselorB,
    source: 'COUNSELOR',
    studentProfileId: ids.studentB,
  })
  store.tasks.push(personal, executed, foreign)
  store.sessionMinutesByTaskId.set(executed.id, [25])

  const personalResponse = await scheduleRequest(
    app, 'counselor-a', ids.studentA, personal.id, { scheduledFor: '2026-09-15' },
  )
  assert.equal(personalResponse.statusCode, 403)
  assert.equal(personalResponse.json().error.code, 'TASK_RESCHEDULE_FORBIDDEN')

  const executedResponse = await scheduleRequest(
    app, 'counselor-a', ids.studentA, executed.id, { scheduledFor: '2026-09-15' },
  )
  assert.equal(executedResponse.statusCode, 409)
  assert.equal(executedResponse.json().error.code, 'TASK_ALREADY_EXECUTED')

  const foreignResponse = await scheduleRequest(
    app, 'counselor-a', ids.studentB, foreign.id, { scheduledFor: '2026-09-15' },
  )
  assert.equal(foreignResponse.statusCode, 404)
  assert.equal(foreignResponse.json().error.code, 'STUDENT_NOT_FOUND')

  store.activeAssignments.set(ids.counselorA, [])
  const endedAssignment = await scheduleRequest(
    app, 'counselor-a', ids.studentA, executed.id, { scheduledFor: '2026-09-15' },
  )
  assert.equal(endedAssignment.statusCode, 404)
  assert.equal(endedAssignment.json().error.code, 'STUDENT_NOT_FOUND')
  await app.close()
})

test('counselor schedule input rejects ownership, provenance, lifecycle, and content fields', async () => {
  const { app, store } = createApp()
  const task = taskRecord('60000000-0000-4000-8000-000000000034', {
    createdByUserId: ids.counselorA,
    source: 'COUNSELOR',
  })
  store.tasks.push(task)
  const controlledFields = [
    { studentProfileId: ids.studentB },
    { owner: ids.studentUser },
    { source: 'PERSONAL' },
    { createdByUserId: ids.studentUser },
    { status: 'COMPLETED' },
    { completedAt: '2026-09-15T10:00:00.000Z' },
    { title: 'Changed content' },
  ]

  for (const field of controlledFields) {
    const response = await scheduleRequest(
      app,
      'counselor-a',
      ids.studentA,
      task.id,
      { scheduledFor: '2026-09-15', ...field },
    )
    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  }
  assert.equal(task.scheduledFor.toISOString(), '2026-09-12T00:00:00.000Z')
  await app.close()
})

test('counselor cannot create tasks for unassigned or another counselor assigned students', async () => {
  const { app, store } = createApp()

  for (const studentProfileId of [ids.studentUnassigned, ids.studentB]) {
    const response = await createRequest(app, 'counselor-a', studentProfileId, {
      title: 'کار غیرمجاز',
      scheduledFor: '2026-09-12',
    })
    assert.equal(response.statusCode, 404)
    assert.equal(response.json().error.code, 'STUDENT_NOT_FOUND')
  }
  assert.equal(store.tasks.length, 0)
  await app.close()
})

test('student and unauthenticated callers cannot use counselor task creation', async () => {
  const { app } = createApp()
  const studentResponse = await createRequest(app, 'student', ids.studentA, {
    title: 'کار غیرمجاز',
    scheduledFor: '2026-09-12',
  })
  assert.equal(studentResponse.statusCode, 403)
  assert.equal(studentResponse.json().error.code, 'ROLE_FORBIDDEN')

  const unauthenticated = await app.inject({
    method: 'POST',
    payload: { title: 'کار غیرمجاز', scheduledFor: '2026-09-12' },
    url: `/api/v1/counselor/students/${ids.studentA}/tasks`,
  })
  assert.equal(unauthenticated.statusCode, 401)
  assert.equal(unauthenticated.json().error.code, 'TOKEN_MISSING')
  await app.close()
})

test('counselor task schema rejects forged ownership, provenance, lifecycle, and plan fields', async () => {
  const { app, store } = createApp()
  const controlledFields = [
    { source: 'PERSONAL' },
    { createdByUserId: ids.studentUser },
    { studentProfileId: ids.studentB },
    { ownerId: ids.studentUser },
    { creatorId: ids.studentUser },
    { status: 'COMPLETED' },
    { completedAt: '2026-09-12T10:00:00.000Z' },
    { studyPlanId: '70000000-0000-4000-8000-000000000001' },
  ]

  for (const controlledField of controlledFields) {
    const response = await createRequest(app, 'counselor-a', ids.studentA, {
      title: 'ورودی جعل‌شده',
      scheduledFor: '2026-09-12',
      ...controlledField,
    })
    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  }
  assert.equal(store.tasks.length, 0)
  await app.close()
})

test('counselor cannot attach another student subject or topic', async () => {
  const { app, store } = createApp()
  const foreignSubject = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'درس دانش‌آموز دیگر',
    scheduledFor: '2026-09-12',
    subjectId: ids.subjectB,
  })
  assert.equal(foreignSubject.statusCode, 404)
  assert.equal(foreignSubject.json().error.code, 'SUBJECT_NOT_FOUND')

  const foreignTopic = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'مبحث دانش‌آموز دیگر',
    scheduledFor: '2026-09-12',
    subjectId: ids.subjectA,
    topicId: ids.topicB,
  })
  assert.equal(foreignTopic.statusCode, 404)
  assert.equal(foreignTopic.json().error.code, 'TOPIC_NOT_FOUND')
  assert.equal(store.tasks.length, 0)
  await app.close()
})

test('counselor cannot attach archived topics or subjects', async () => {
  const { app, store } = createApp()
  const archivedTopic = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'مبحث بایگانی',
    scheduledFor: '2026-09-12',
    subjectId: ids.subjectA,
    topicId: ids.archivedTopic,
  })
  assert.equal(archivedTopic.statusCode, 409)
  assert.equal(archivedTopic.json().error.code, 'TOPIC_ARCHIVED')

  const archivedSubject = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'درس بایگانی',
    scheduledFor: '2026-09-12',
    subjectId: ids.archivedSubject,
  })
  assert.equal(archivedSubject.statusCode, 409)
  assert.equal(archivedSubject.json().error.code, 'SUBJECT_ARCHIVED')
  assert.equal(store.tasks.length, 0)
  await app.close()
})

test('counselor resource selectors expose only active resources for assigned students', async () => {
  const { app } = createApp()
  const subjects = await app.inject({
    headers: { authorization: 'Bearer counselor-a' },
    method: 'GET',
    url: `/api/v1/counselor/students/${ids.studentA}/subjects`,
  })
  assert.equal(subjects.statusCode, 200)
  assert.deepEqual(subjects.json().data.items, [{ id: ids.subjectA, name: 'زیست‌شناسی' }])

  const topics = await app.inject({
    headers: { authorization: 'Bearer counselor-a' },
    method: 'GET',
    url: `/api/v1/counselor/students/${ids.studentA}/subjects/${ids.subjectA}/topics`,
  })
  assert.equal(topics.statusCode, 200)
  assert.deepEqual(topics.json().data.items, [{
    id: ids.topicA,
    subjectId: ids.subjectA,
    title: 'ژنتیک',
  }])

  const crossCounselor = await app.inject({
    headers: { authorization: 'Bearer counselor-a' },
    method: 'GET',
    url: `/api/v1/counselor/students/${ids.studentB}/subjects`,
  })
  assert.equal(crossCounselor.statusCode, 404)
  assert.equal(crossCounselor.json().error.code, 'STUDENT_NOT_FOUND')
  await app.close()
})

test('assigned counselor reads Curriculum execution coverage and alone may edit pending counselor targets', async () => {
  const { app, store } = createApp()
  const taskId = '60000000-0000-4000-8000-000000000091'
  store.tasks.push(taskRecord(taskId, {
    source: 'COUNSELOR',
    createdByUserId: ids.counselorA,
    curriculumTargets: [{
      id: '70000000-0000-4000-8000-000000000001',
      referenceKind: 'NODE',
      curriculumRefId: 'cn_parent',
      selectionMode: 'WHOLE',
      position: 0,
      labelSnapshot: 'parent',
      pathSnapshot: ['representation', 'parent'],
      representationIdSnapshot: 'cr_1',
      createdAt: timestamp,
      items: [
        {
          id: '71000000-0000-4000-8000-000000000001',
          targetId: '70000000-0000-4000-8000-000000000001',
          referenceKind: 'NODE',
          curriculumRefId: 'cn_child_1',
          labelSnapshot: 'child 1',
          pathSnapshot: ['representation', 'parent', 'child 1'],
          position: 0,
          completedAt: timestamp,
          createdAt: timestamp,
        },
        {
          id: '71000000-0000-4000-8000-000000000002',
          targetId: '70000000-0000-4000-8000-000000000001',
          referenceKind: 'NODE',
          curriculumRefId: 'cn_child_2',
          labelSnapshot: 'child 2',
          pathSnapshot: ['representation', 'parent', 'child 2'],
          position: 1,
          completedAt: null,
          createdAt: timestamp,
        },
      ],
    }],
  }))

  const listed = await listRequest(app, ids.studentA, 'counselor-a')
  assert.equal(listed.statusCode, 200)
  assert.equal(listed.json().data.items[0].curriculum.completedItemCount, 1)
  assert.equal(listed.json().data.items[0].curriculum.remainingItemCount, 1)

  const replaced = await app.inject({
    headers: { authorization: 'Bearer counselor-a' },
    method: 'PATCH',
    payload: { curriculumTargets: [] },
    url: `/api/v1/counselor/students/${ids.studentA}/tasks/${taskId}/curriculum-targets`,
  })
  assert.equal(replaced.statusCode, 409)
  assert.equal(replaced.json().error.code, 'TASK_CURRICULUM_EXECUTION_STARTED')

  const editableTaskId = '60000000-0000-4000-8000-000000000092'
  store.tasks.push(taskRecord(editableTaskId, {
    source: 'COUNSELOR',
    createdByUserId: ids.counselorA,
  }))
  const editable = await app.inject({
    headers: { authorization: 'Bearer counselor-a' },
    method: 'PATCH',
    payload: { curriculumTargets: [] },
    url: `/api/v1/counselor/students/${ids.studentA}/tasks/${editableTaskId}/curriculum-targets`,
  })
  assert.equal(editable.statusCode, 200)
  assert.equal(editable.json().data.curriculum.totalItemCount, 0)

  const entry = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')[0]!
  const root = canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id)[0]!
  const validNode = root.itemKind === 'NODE' ? root.nodeId : root.childNodeIds[0]!
  const v2Replacement = await app.inject({
    headers: { authorization: 'Bearer counselor-a' },
    method: 'PATCH',
    payload: {
      curriculumSelection: {
        version: 2,
        selectors: [{ rootKind: 'NODE', rootId: validNode, selector: 'SUBTREE' }],
      },
    },
    url: `/api/v1/counselor/students/${ids.studentA}/tasks/${editableTaskId}/curriculum-targets`,
  })
  assert.equal(v2Replacement.statusCode, 200)
  assert.equal(v2Replacement.json().data.curriculum.targets[0].selectionMode, 'SUBTREE')

  const foreign = await app.inject({
    headers: { authorization: 'Bearer counselor-b' },
    method: 'PATCH',
    payload: { curriculumTargets: [] },
    url: `/api/v1/counselor/students/${ids.studentA}/tasks/${taskId}/curriculum-targets`,
  })
  assert.equal(foreign.statusCode, 404)
  assert.equal(foreign.json().error.code, 'STUDENT_NOT_FOUND')
  await app.close()
})

test('counselor writes use assigned Student track and preserve one-Student batch atomicity', async () => {
  const { app, store } = createApp()
  const entry = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')[0]!
  const root = canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id)[0]!
  const validNode = root.itemKind === 'NODE' ? root.nodeId : root.childNodeIds[0]!
  const wrongNode = canonicalCurriculumStore.listTrackCatalog('HUMANITIES')
    .flatMap((item) => canonicalCurriculumStore.listCatalogRoots('HUMANITIES', item.id))
    .flatMap((item) => item.itemKind === 'NODE' ? [item.nodeId] : item.childNodeIds)
    .find((id) => !canonicalCurriculumStore.isSelectableNodeInTrack('EXPERIMENTAL', id))!
  const target = (curriculumRefId: string) => [{ referenceKind: 'NODE', curriculumRefId, selectionMode: 'EXACT' }]
  const valid = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'Study', scheduledFor: '2026-10-01', contentType: 'STUDY', curriculumTargets: target(validNode),
  })
  assert.equal(valid.statusCode, 201)
  assert.equal(valid.json().data.contentType, 'STUDY')
  const v2 = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'Recursive study',
    scheduledFor: '2026-10-01',
    contentType: 'STUDY',
    curriculumSelection: {
      version: 2,
      selectors: [{ rootKind: 'NODE', rootId: validNode, selector: 'SUBTREE' }],
    },
  })
  assert.equal(v2.statusCode, 201)
  assert.equal(v2.json().data.curriculum.targets[0].selectionMode, 'SUBTREE')
  const mixed = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'Mixed', scheduledFor: '2026-10-01', curriculumTargets: [],
    curriculumSelection: { version: 2, selectors: [] },
  })
  assert.equal(mixed.statusCode, 400)
  const wrong = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'Wrong track', scheduledFor: '2026-10-01', contentType: 'STUDY', curriculumTargets: target(wrongNode),
  })
  assert.equal(wrong.statusCode, 409)
  assert.equal(wrong.json().error.code, 'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK')
  const spoof = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'Spoof', scheduledFor: '2026-10-01', track: 'HUMANITIES', curriculumTargets: target(wrongNode),
  })
  assert.equal(spoof.statusCode, 400)
  const unassigned = await createRequest(app, 'counselor-a', ids.studentB, {
    title: 'Unassigned', scheduledFor: '2026-10-01', curriculumTargets: target(validNode),
  })
  assert.equal(unassigned.statusCode, 404)
  store.studentTracks.set(ids.studentA, null)
  const noTrack = await createRequest(app, 'counselor-a', ids.studentA, {
    title: 'No track', scheduledFor: '2026-10-01', curriculumTargets: target(validNode),
  })
  assert.equal(noTrack.statusCode, 409)
  assert.equal(noTrack.json().error.code, 'STUDENT_TRACK_NOT_SET')
  store.studentTracks.set(ids.studentA, 'EXPERIMENTAL')
  const beforeBatch = store.tasks.length
  const batch = await app.inject({
    headers: { authorization: 'Bearer counselor-a' }, method: 'POST',
    payload: { tasks: [
      { title: 'Valid', scheduledFor: '2026-10-01', contentType: 'STUDY', curriculumTargets: target(validNode) },
      { title: 'Invalid', scheduledFor: '2026-10-01', contentType: 'STUDY', curriculumTargets: target(wrongNode) },
    ] },
    url: `/api/v1/counselor/students/${ids.studentA}/tasks/batch`,
  })
  assert.equal(batch.statusCode, 409)
  assert.equal(batch.json().error.code, 'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK')
  assert.equal(store.tasks.length, beforeBatch)

  const v2Batch = await app.inject({
    headers: { authorization: 'Bearer counselor-a' }, method: 'POST',
    payload: { tasks: [
      {
        title: 'Recursive batch', scheduledFor: '2026-10-01', contentType: 'STUDY',
        curriculumSelection: {
          version: 2,
          selectors: [{ rootKind: 'NODE', rootId: validNode, selector: 'SUBTREE' }],
        },
      },
    ] },
    url: `/api/v1/counselor/students/${ids.studentA}/tasks/batch`,
  })
  assert.equal(v2Batch.statusCode, 201)
  assert.equal(v2Batch.json().data.tasks[0].curriculum.targets[0].selectionMode, 'SUBTREE')
  await app.close()
})
