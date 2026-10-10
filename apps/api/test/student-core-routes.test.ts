import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from '../src/app.js'
import type { AuthService } from '../src/auth/auth-service.js'
import type { PublicUser } from '../src/auth/types.js'
import { createStudentCoreServices, type StudentCoreStore } from '../src/student-core/services.js'
import type { DailyTaskRecord, StudySubjectRecord } from '../src/student-core/types.js'
import { canonicalCurriculumStore } from '../src/curriculum/artifact.js'

const user: PublicUser = {
  id: 'student-user-1',
  email: 'student@example.com',
  phone: null,
  role: 'STUDENT',
  status: 'ACTIVE',
  createdAt: new Date('2026-09-03T00:00:00.000Z'),
  updatedAt: new Date('2026-09-03T00:00:00.000Z'),
}

const counselor: PublicUser = {
  ...user,
  id: 'counselor-user-1',
  email: 'counselor@example.com',
  role: 'COUNSELOR',
}

const auth: AuthService = {
  authenticateAccessToken: async () => user,
  changePassword: async () => undefined,
  getCurrentUser: async () => user,
  login: async () => { throw new Error('not used') },
  logout: async () => undefined,
  logoutAll: async () => undefined,
  refresh: async () => { throw new Error('not used') },
  register: async () => { throw new Error('not used') },
}

const store: StudentCoreStore = {
  findStudentProfileByUserId: async () => ({ id: 'student-profile-1', userId: user.id, track: 'EXPERIMENTAL' }),
  listSubjects: async () => [],
  findSubjectById: async () => null,
  createSubject: async (input) => ({ id: 'subject-1', ...input, archivedAt: null, createdAt: new Date('2026-09-03T00:00:00.000Z'), updatedAt: new Date('2026-09-03T00:00:00.000Z') }),
  updateSubject: async () => null,
  listTopics: async () => [],
  findTopicById: async () => null,
  createTopic: async (input) => ({ id: 'topic-1', ...input, archivedAt: null, createdAt: new Date('2026-09-03T00:00:00.000Z'), updatedAt: new Date('2026-09-03T00:00:00.000Z') }),
  updateTopic: async () => null,
  listPlans: async () => [],
  findPlanById: async () => null,
  createPlan: async (input) => ({ id: 'plan-1', ...input, createdAt: new Date('2026-09-03T00:00:00.000Z'), updatedAt: new Date('2026-09-03T00:00:00.000Z') }),
  updatePlan: async () => null,
  listTasks: async () => [],
  findTaskById: async () => null,
  createTask: async (input) => ({ id: 'task-1', ...input, createdAt: new Date('2026-09-03T00:00:00.000Z'), updatedAt: new Date('2026-09-03T00:00:00.000Z') }),
  updateTask: async () => null,
  updateTerminalTask: async () => ({ ok: false, reason: 'TASK_NOT_FOUND' }),
  updateTaskProgress: async () => ({ ok: false, reason: 'TASK_NOT_FOUND' }),
  reschedulePersonalTask: async () => ({ ok: false, reason: 'TASK_NOT_FOUND' }),
}

const createApp = (
  studentCoreStore: StudentCoreStore = store,
  authService: AuthService = auth,
) => buildApp({
  auth: authService,
  environment: 'test',
  logger: false,
  prisma: { $queryRaw: async () => [{ '?column?': 1 }] },
  studentCore: createStudentCoreServices(studentCoreStore, undefined, canonicalCurriculumStore),
})

test('student subject route returns the standard v1 response contract', async () => {
  const app = createApp()
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token', 'x-request-id': 'student-core-route' },
    method: 'POST',
    payload: { name: 'Mathematics' },
    url: '/api/v1/student/subjects',
  })

  assert.equal(response.statusCode, 201)
  assert.equal(response.headers['x-request-id'], 'student-core-route')
  assert.equal(response.json().success, true)
  assert.equal(response.json().data.name, 'Mathematics')
  await app.close()
})

test('student core routes reject unauthenticated requests', async () => {
  const app = createApp()
  const subjectResponse = await app.inject({ method: 'GET', url: '/api/v1/student/subjects' })
  const taskResponse = await app.inject({ method: 'GET', url: '/api/v1/student/daily-tasks' })
  assert.equal(subjectResponse.statusCode, 401)
  assert.equal(subjectResponse.json().error.code, 'TOKEN_MISSING')
  assert.equal(taskResponse.statusCode, 401)
  assert.equal(taskResponse.json().error.code, 'TOKEN_MISSING')
  await app.close()
})

test('student task routes reject counselor users', async () => {
  const counselorAuth: AuthService = {
    ...auth,
    authenticateAccessToken: async () => counselor,
  }
  const app = createApp(store, counselorAuth)
  const response = await app.inject({
    headers: { authorization: 'Bearer counselor-access-token' },
    method: 'GET',
    url: '/api/v1/student/daily-tasks',
  })

  assert.equal(response.statusCode, 403)
  assert.equal(response.json().error.code, 'ROLE_FORBIDDEN')
  const lifecycleResponse = await app.inject({
    headers: { authorization: 'Bearer counselor-access-token' },
    method: 'PATCH',
    payload: { status: 'SKIPPED', skipReason: 'NO_TIME' },
    url: '/api/v1/student/daily-tasks/00000000-0000-4000-8000-000000000497',
  })
  assert.equal(lifecycleResponse.statusCode, 403)
  assert.equal(lifecycleResponse.json().error.code, 'ROLE_FORBIDDEN')
  await app.close()
})

test('student task lifecycle accepts skip reasons and rejects client-controlled metadata', async () => {
  const taskId = '00000000-0000-4000-8000-000000000496'
  const task: DailyTaskRecord = {
    completedAt: null,
    createdAt: new Date('2026-09-03T00:00:00.000Z'),
    createdByUserId: user.id,
    description: null,
    estimatedMinutes: 30,
    id: taskId,
    scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
    skipReason: null,
    skippedAt: null,
    source: 'PERSONAL',
    status: 'PENDING',
    studentProfileId: 'student-profile-1',
    studyPlanId: null,
    subjectId: null,
    title: 'Lifecycle task',
    topicId: null,
    updatedAt: new Date('2026-09-03T00:00:00.000Z'),
  }
  let updateCalls = 0
  const lifecycleStore: StudentCoreStore = {
    ...store,
    findTaskById: async (profileId, id) =>
      profileId === task.studentProfileId && id === task.id ? task : null,
    async updateTask(profileId, id, input) {
      updateCalls += 1
      if (profileId !== task.studentProfileId || id !== task.id) return null
      Object.assign(task, input)
      return task
    },
    async updateTerminalTask(profileId, id, input) {
      updateCalls += 1
      if (profileId !== task.studentProfileId || id !== task.id) {
        return { ok: false as const, reason: 'TASK_NOT_FOUND' as const }
      }
      Object.assign(task, input)
      return { ok: true as const, value: task }
    },
  }
  const app = createApp(lifecycleStore)

  const skipped = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { status: 'SKIPPED', skipReason: 'FORGOT' },
    url: `/api/v1/student/daily-tasks/${taskId}`,
  })
  assert.equal(skipped.statusCode, 200)
  assert.equal(skipped.json().data.status, 'SKIPPED')
  assert.equal(skipped.json().data.skipReason, 'FORGOT')
  assert.equal(typeof skipped.json().data.skippedAt, 'string')
  assert.equal(skipped.json().data.completedAt, null)
  assert.equal('createdByUserId' in skipped.json().data, false)
  assert.equal(task.studentProfileId, 'student-profile-1')
  assert.equal(task.createdByUserId, user.id)
  assert.equal(task.source, 'PERSONAL')

  const invalidPayloads = [
    { status: 'PENDING', skipReason: 'NO_TIME' },
    { status: 'COMPLETED', skipReason: 'OTHER' },
    { status: 'SKIPPED', skipReason: 'UNKNOWN' },
    { status: 'SKIPPED', skippedAt: '2026-09-05T10:00:00.000Z' },
    { status: 'SKIPPED', completedAt: '2026-09-05T10:00:00.000Z' },
  ]
  for (const payload of invalidPayloads) {
    const invalid = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'PATCH',
      payload,
      url: `/api/v1/student/daily-tasks/${taskId}`,
    })
    assert.equal(invalid.statusCode, 400)
    assert.equal(invalid.json().error.code, 'VALIDATION_ERROR')
  }
  assert.equal(updateCalls, 1)
  await app.close()
})

test('active execution conflict is returned safely for terminal task lifecycle requests', async () => {
  const taskId = '00000000-0000-4000-8000-000000000498'
  const activeStore: StudentCoreStore = {
    ...store,
    findTaskById: async () => ({
      completedAt: null,
      createdAt: new Date('2026-09-03T00:00:00.000Z'),
      createdByUserId: user.id,
      description: null,
      estimatedMinutes: 30,
      id: taskId,
      plannedTestCount: 0,
      scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
      skipReason: null,
      skippedAt: null,
      source: 'PERSONAL',
      status: 'PENDING',
      studentProfileId: 'student-profile-1',
      studyPlanId: null,
      subjectId: null,
      title: 'Active task',
      topicId: null,
      updatedAt: new Date('2026-09-03T00:00:00.000Z'),
    }),
    updateTerminalTask: async () => ({
      ok: false,
      reason: 'ACTIVE_STUDY_SESSION_EXISTS',
    }),
  }
  const app = createApp(activeStore)

  for (const payload of [
    { status: 'COMPLETED' },
    { status: 'SKIPPED', skipReason: 'NO_TIME' },
  ]) {
    const response = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'PATCH',
      payload,
      url: `/api/v1/student/daily-tasks/${taskId}`,
    })
    assert.equal(response.statusCode, 409)
    assert.equal(response.json().error.code, 'TASK_ACTIVE_SESSION_EXISTS')
  }
  await app.close()
})

test('student task route accepts an owned topic that belongs to the selected subject', async () => {
  const subjectId = '00000000-0000-4000-8000-000000000401'
  const topicId = '00000000-0000-4000-8000-000000000402'
  const topicTaskStore: StudentCoreStore = {
    ...store,
    findSubjectById: async (profileId, id) => profileId === 'student-profile-1' && id === subjectId
      ? {
          id: subjectId,
          studentProfileId: profileId,
          name: 'Biology',
          normalizedName: 'biology',
          archivedAt: null,
          createdAt: new Date('2026-09-03T00:00:00.000Z'),
          updatedAt: new Date('2026-09-03T00:00:00.000Z'),
        }
      : null,
    findTopicById: async (profileId, id) => profileId === 'student-profile-1' && id === topicId
      ? {
          id: topicId,
          subjectId,
          title: 'Genetics',
          normalizedTitle: 'genetics',
          archivedAt: null,
          createdAt: new Date('2026-09-03T00:00:00.000Z'),
          updatedAt: new Date('2026-09-03T00:00:00.000Z'),
        }
      : null,
  }
  const app = createApp(topicTaskStore)
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {
      title: 'Review genetics',
      scheduledFor: '2026-09-03',
      subjectId,
      topicId,
    },
    url: '/api/v1/student/daily-tasks',
  })

  assert.equal(response.statusCode, 201)
  assert.equal(response.json().data.subjectId, subjectId)
  assert.equal(response.json().data.topicId, topicId)
  assert.equal(response.json().data.source, 'PERSONAL')
  assert.equal(response.json().data.startMinuteOfDay, null)
  assert.equal(response.json().data.endMinuteOfDay, null)
  assert.equal(response.json().data.miniBoxSpan, null)
  assert.equal('createdByUserId' in response.json().data, false)
  await app.close()
})

test('student task routes reject client-controlled provenance and ownership fields', async () => {
  const app = createApp()
  const controlledFields = [
    { source: 'COUNSELOR' },
    { createdByUserId: '00000000-0000-4000-8000-000000000499' },
    { studentProfileId: '00000000-0000-4000-8000-000000000498' },
  ]

  for (const field of controlledFields) {
    const response = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'POST',
      payload: {
        title: 'Forged task',
        scheduledFor: '2026-09-03',
        ...field,
      },
      url: '/api/v1/student/daily-tasks',
    })
    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  }

  for (const field of controlledFields) {
    const response = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'PATCH',
      payload: field,
      url: '/api/v1/student/daily-tasks/00000000-0000-4000-8000-000000000497',
    })
    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  }

  await app.close()
})

test('student task schedule route accepts exact time while preserving creator-safe data', async () => {
  const taskId = '00000000-0000-4000-8000-000000000497'
  const task: DailyTaskRecord = {
    id: taskId,
    studentProfileId: 'student-profile-1',
    createdByUserId: user.id,
    source: 'PERSONAL',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
    title: 'Move me',
    description: null,
    scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
    estimatedMinutes: 30,
    status: 'PENDING',
    completedAt: null,
    skipReason: null,
    skippedAt: null,
    createdAt: new Date('2026-09-03T00:00:00.000Z'),
    updatedAt: new Date('2026-09-03T00:00:00.000Z'),
  }
  let calls = 0
  const scheduleStore: StudentCoreStore = {
    ...store,
    async reschedulePersonalTask(profileId, id, schedule) {
      calls += 1
      assert.equal(profileId, 'student-profile-1')
      assert.equal(id, taskId)
      Object.assign(task, schedule)
      return { ok: true, value: task }
    },
  }
  const app = createApp(scheduleStore)
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: {
      scheduledFor: '2026-09-04',
      startMinuteOfDay: 945,
      endMinuteOfDay: 1020,
    },
    url: `/api/v1/student/daily-tasks/${taskId}/schedule`,
  })
  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data.scheduledFor, '2026-09-04T00:00:00.000Z')
  assert.equal(response.json().data.startMinuteOfDay, 945)
  assert.equal(response.json().data.endMinuteOfDay, 1020)
  assert.equal(response.json().data.miniBoxSpan, 5)
  assert.equal('createdByUserId' in response.json().data, false)

  const controlledFields = [
    { studentProfileId: '00000000-0000-4000-8000-000000000498' },
    { owner: user.id },
    { source: 'PERSONAL' },
    { createdByUserId: user.id },
    { status: 'COMPLETED' },
    { completedAt: '2026-09-05T10:00:00.000Z' },
    { title: 'Changed content' },
  ]
  for (const field of controlledFields) {
    const forged = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'PATCH',
      payload: { scheduledFor: '2026-09-05', ...field },
      url: `/api/v1/student/daily-tasks/${taskId}/schedule`,
    })
    assert.equal(forged.statusCode, 400)
    assert.equal(forged.json().error.code, 'VALIDATION_ERROR')
  }
  assert.equal(calls, 1)

  const genericUpdate = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { scheduledFor: '2026-09-05' },
    url: `/api/v1/student/daily-tasks/${taskId}`,
  })
  assert.equal(genericUpdate.statusCode, 400)
  assert.equal(genericUpdate.json().error.code, 'VALIDATION_ERROR')
  await app.close()
})

test('student topic route creates a topic under an owned subject', async () => {
  const subjectId = '00000000-0000-4000-8000-000000000301'
  const subject: StudySubjectRecord = {
    id: subjectId,
    studentProfileId: 'student-profile-1',
    name: 'Mathematics',
    normalizedName: 'mathematics',
    archivedAt: null,
    createdAt: new Date('2026-09-03T00:00:00.000Z'),
    updatedAt: new Date('2026-09-03T00:00:00.000Z'),
  }
  const topicStore: StudentCoreStore = {
    ...store,
    findSubjectById: async (profileId, id) =>
      profileId === subject.studentProfileId && id === subject.id ? subject : null,
  }
  const app = createApp(topicStore)
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: { title: 'Functions' },
    url: `/api/v1/student/subjects/${subjectId}/topics`,
  })

  assert.equal(response.statusCode, 201)
  assert.equal(response.json().data.title, 'Functions')
  assert.equal(response.json().data.subjectId, subjectId)
  await app.close()
})

test('student topic routes reject empty titles and counselor users', async () => {
  const subjectId = '00000000-0000-4000-8000-000000000301'
  const app = createApp()
  const emptyTitle = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: { title: '   ' },
    url: `/api/v1/student/subjects/${subjectId}/topics`,
  })
  assert.equal(emptyTitle.statusCode, 400)
  assert.equal(emptyTitle.json().error.code, 'VALIDATION_ERROR')
  await app.close()

  const counselorApp = createApp(store, {
    ...auth,
    authenticateAccessToken: async () => counselor,
  })
  const counselorResponse = await counselorApp.inject({
    headers: { authorization: 'Bearer counselor-access-token' },
    method: 'GET',
    url: `/api/v1/student/subjects/${subjectId}/topics`,
  })
  assert.equal(counselorResponse.statusCode, 403)
  assert.equal(counselorResponse.json().error.code, 'ROLE_FORBIDDEN')
  await counselorApp.close()
})

test('daily task date query is mapped to the scheduled date filter', async () => {
  const timestamp = new Date('2026-09-03T00:00:00.000Z')
  const tasks: DailyTaskRecord[] = [
    {
      id: '00000000-0000-4000-8000-000000000101',
      studentProfileId: 'student-profile-1',
      createdByUserId: user.id,
      source: 'PERSONAL',
      studyPlanId: null,
      subjectId: null,
      topicId: null,
      title: 'September third task',
      description: null,
      scheduledFor: timestamp,
      estimatedMinutes: 30,
      status: 'PENDING',
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: '00000000-0000-4000-8000-000000000102',
      studentProfileId: 'student-profile-1',
      createdByUserId: user.id,
      source: 'PERSONAL',
      studyPlanId: null,
      subjectId: null,
      topicId: null,
      title: 'September fourth task',
      description: null,
      scheduledFor: new Date('2026-09-04T00:00:00.000Z'),
      estimatedMinutes: 30,
      status: 'PENDING',
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
  const receivedQueries: Array<Parameters<StudentCoreStore['listTasks']>[1]> = []
  const filteringStore: StudentCoreStore = {
    ...store,
    async listTasks(_profileId, query) {
      receivedQueries.push(query)
      return query?.scheduledFor
        ? tasks.filter((task) => task.scheduledFor.getTime() === query.scheduledFor?.getTime())
        : tasks
    },
  }
  const app = createApp(filteringStore)

  const unfiltered = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/daily-tasks',
  })
  const matching = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/daily-tasks?date=2026-09-03',
  })
  const unrelated = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/daily-tasks?date=2026-09-05',
  })

  assert.equal(unfiltered.statusCode, 200)
  assert.equal(unfiltered.json().data.items.length, 2)
  assert.equal(unfiltered.json().data.items[0].source, 'PERSONAL')
  assert.equal('createdByUserId' in unfiltered.json().data.items[0], false)
  assert.equal(receivedQueries[0]?.scheduledFor, undefined)
  assert.equal(matching.json().data.items.length, 1)
  assert.equal(matching.json().data.items[0].id, tasks[0]?.id)
  assert.equal(receivedQueries[1]?.scheduledFor?.toISOString(), '2026-09-03T00:00:00.000Z')
  assert.equal('date' in (receivedQueries[1] ?? {}), false)
  assert.equal(unrelated.json().data.items.length, 0)

  await app.close()
})

test('student task list includes counselor-created tasks without exposing creator identity', async () => {
  const counselorTask: DailyTaskRecord = {
    id: '00000000-0000-4000-8000-000000000103',
    studentProfileId: 'student-profile-1',
    createdByUserId: counselor.id,
    source: 'COUNSELOR',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
    title: 'Counselor assignment',
    description: null,
    scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
    estimatedMinutes: 30,
    status: 'PENDING',
    completedAt: null,
    createdAt: new Date('2026-09-03T00:00:00.000Z'),
    updatedAt: new Date('2026-09-03T00:00:00.000Z'),
  }
  const counselorTaskStore: StudentCoreStore = {
    ...store,
    listTasks: async () => [counselorTask],
  }
  const app = createApp(counselorTaskStore)
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/daily-tasks?date=2026-09-03',
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data.items[0].id, counselorTask.id)
  assert.equal(response.json().data.items[0].source, 'COUNSELOR')
  assert.equal('createdByUserId' in response.json().data.items[0], false)
  await app.close()
})

test('student weekly task range is date-bounded, owner-scoped, and creator-safe', async () => {
  const timestamp = new Date('2026-09-12T00:00:00.000Z')
  const weeklyTasks: DailyTaskRecord[] = [
    {
      id: '00000000-0000-4000-8000-000000000110',
      studentProfileId: 'student-profile-1',
      createdByUserId: user.id,
      source: 'PERSONAL',
      studyPlanId: null,
      subjectId: null,
      topicId: null,
      title: 'First weekly task',
      description: null,
      scheduledFor: new Date('2026-09-12T00:00:00.000Z'),
      estimatedMinutes: 30,
      status: 'PENDING',
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: '00000000-0000-4000-8000-000000000111',
      studentProfileId: 'student-profile-1',
      createdByUserId: counselor.id,
      source: 'COUNSELOR',
      studyPlanId: null,
      subjectId: null,
      topicId: null,
      title: 'Last weekly task',
      description: null,
      scheduledFor: new Date('2026-09-18T00:00:00.000Z'),
      estimatedMinutes: 45,
      status: 'COMPLETED',
      completedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: '00000000-0000-4000-8000-000000000112',
      studentProfileId: 'student-profile-1',
      createdByUserId: user.id,
      source: 'PERSONAL',
      studyPlanId: null,
      subjectId: null,
      topicId: null,
      title: 'Next week task',
      description: null,
      scheduledFor: new Date('2026-09-19T00:00:00.000Z'),
      estimatedMinutes: null,
      status: 'PENDING',
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: '00000000-0000-4000-8000-000000000113',
      studentProfileId: 'student-profile-2',
      createdByUserId: 'other-student-user',
      source: 'PERSONAL',
      studyPlanId: null,
      subjectId: null,
      topicId: null,
      title: 'Foreign weekly task',
      description: null,
      scheduledFor: new Date('2026-09-14T00:00:00.000Z'),
      estimatedMinutes: null,
      status: 'PENDING',
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
  const received: Array<{
    profileId: string
    query: Parameters<StudentCoreStore['listTasks']>[1]
  }> = []
  const weeklyStore: StudentCoreStore = {
    ...store,
    async listTasks(profileId, query) {
      received.push({ profileId, query })
      return weeklyTasks.filter((task) =>
        task.studentProfileId === profileId
        && task.scheduledFor >= query!.scheduledFrom!
        && task.scheduledFor <= query!.scheduledTo!,
      )
    },
  }
  const app = createApp(weeklyStore)
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/daily-tasks?from=2026-09-12&to=2026-09-18&limit=100',
  })

  assert.equal(response.statusCode, 200)
  assert.equal(received[0]?.profileId, 'student-profile-1')
  assert.equal(received[0]?.query?.scheduledFrom?.toISOString(), '2026-09-12T00:00:00.000Z')
  assert.equal(received[0]?.query?.scheduledTo?.toISOString(), '2026-09-18T00:00:00.000Z')
  assert.deepEqual(
    response.json().data.items.map((task: { id: string }) => task.id),
    weeklyTasks.slice(0, 2).map((task) => task.id),
  )
  assert.equal(
    response.json().data.items.every((task: Record<string, unknown>) => !('createdByUserId' in task)),
    true,
  )

  const incompleteRange = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/daily-tasks?from=2026-09-12',
  })
  assert.equal(incompleteRange.statusCode, 400)
  assert.equal(incompleteRange.json().error.code, 'VALIDATION_ERROR')

  const reversedRange = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/daily-tasks?from=2026-09-18&to=2026-09-12',
  })
  assert.equal(reversedRange.statusCode, 400)
  assert.equal(reversedRange.json().error.code, 'TASK_DATE_RANGE_INVALID')
  await app.close()
})

test('daily task filters retain authenticated profile scope', async () => {
  const received: Array<{
    profileId: string
    query: Parameters<StudentCoreStore['listTasks']>[1]
  }> = []
  const filteringStore: StudentCoreStore = {
    ...store,
    async listTasks(profileId, query) {
      received.push({ profileId, query })
      return []
    },
  }
  const app = createApp(filteringStore)
  const subjectId = '00000000-0000-4000-8000-000000000201'
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: `/api/v1/student/daily-tasks?date=2026-09-03&status=PENDING&subjectId=${subjectId}&limit=20`,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(received.length, 1)
  assert.equal(received[0]?.profileId, 'student-profile-1')
  assert.deepEqual(received[0]?.query, {
    limit: 20,
    scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
    status: 'PENDING',
    subjectId,
  })
  await app.close()
})

test('overdue task route maps a bounded exclusive date query and rejects ambiguous filters', async () => {
  const received: Array<Parameters<StudentCoreStore['listTasks']>[1]> = []
  const overdueStore: StudentCoreStore = {
    ...store,
    async listTasks(_profileId, query) {
      received.push(query)
      return []
    },
  }
  const app = createApp(overdueStore)
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/daily-tasks?overdueBefore=2026-09-04&limit=20',
  })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(received, [{
    limit: 20,
    scheduledBefore: new Date('2026-09-04T00:00:00.000Z'),
    status: 'PENDING',
  }])

  const overdueCursorBoundary = {
    createdAt: '2026-09-02T09:30:00.000Z',
    id: '00000000-0000-4000-8000-000000000123',
    scheduledFor: '2026-09-02T00:00:00.000Z',
  }
  const overdueCursor = `overdue.${Buffer.from(JSON.stringify(overdueCursorBoundary)).toString('base64url')}`
  const nextPage = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: `/api/v1/student/daily-tasks?overdueBefore=2026-09-04&limit=20&cursor=${encodeURIComponent(overdueCursor)}`,
  })
  assert.equal(nextPage.statusCode, 200)
  assert.deepEqual(received[1], {
    limit: 20,
    overdueCursor: {
      createdAt: new Date(overdueCursorBoundary.createdAt),
      id: overdueCursorBoundary.id,
      scheduledFor: new Date(overdueCursorBoundary.scheduledFor),
    },
    scheduledBefore: new Date('2026-09-04T00:00:00.000Z'),
    status: 'PENDING',
  })

  for (const query of [
    'overdueBefore=2026-09-04&date=2026-09-03',
    'overdueBefore=2026-09-04&from=2026-09-01&to=2026-09-03',
    'overdueBefore=2026-09-04&status=COMPLETED',
  ]) {
    const invalid = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'GET',
      url: `/api/v1/student/daily-tasks?${query}`,
    })
    assert.equal(invalid.statusCode, 400)
    assert.equal(invalid.json().error.code, 'VALIDATION_ERROR')
  }
  assert.equal(received.length, 2)
  await app.close()
})

test('student toggles owned Curriculum execution items and receives coverage counts', async () => {
  const taskId = '00000000-0000-4000-8000-000000000401'
  const itemId = '00000000-0000-4000-8000-000000000402'
  let ownerScope: unknown[] = []
  const task: DailyTaskRecord = {
    id: taskId,
    studentProfileId: 'student-profile-1',
    createdByUserId: user.id,
    source: 'COUNSELOR',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
    title: 'Assigned Curriculum task',
    description: null,
    scheduledFor: new Date('2026-09-30T00:00:00.000Z'),
    estimatedMinutes: 75,
    plannedTestCount: 0,
    status: 'PENDING',
    completedAt: null,
    partialAt: null,
    skipReason: null,
    skippedAt: null,
    createdAt: new Date('2026-09-30T00:00:00.000Z'),
    updatedAt: new Date('2026-09-30T00:00:00.000Z'),
    curriculumTargets: [{
      id: '00000000-0000-4000-8000-000000000403',
      referenceKind: 'NODE',
      curriculumRefId: 'cn_parent',
      selectionMode: 'WHOLE',
      position: 0,
      labelSnapshot: 'parent',
      pathSnapshot: ['representation', 'parent'],
      representationIdSnapshot: 'cr_1',
      createdAt: new Date('2026-09-30T00:00:00.000Z'),
      items: [{
        id: itemId,
        targetId: '00000000-0000-4000-8000-000000000403',
        referenceKind: 'NODE',
        curriculumRefId: 'cn_child',
        labelSnapshot: 'child',
        pathSnapshot: ['representation', 'parent', 'child'],
        position: 0,
        completedAt: new Date('2026-09-30T12:00:00.000Z'),
        createdAt: new Date('2026-09-30T00:00:00.000Z'),
      }],
    }],
  }
  const taskStore: StudentCoreStore = {
    ...store,
    toggleTaskCurriculumItem: async (...args) => {
      ownerScope = args
      return { ok: true, value: task }
    },
  }
  const app = createApp(taskStore)
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { completed: true },
    url: `/api/v1/student/daily-tasks/${taskId}/curriculum-items/${itemId}`,
  })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(ownerScope.slice(0, 3), ['student-profile-1', taskId, itemId])
  assert.equal(response.json().data.curriculum.completedItemCount, 1)
  assert.equal(response.json().data.curriculum.totalItemCount, 1)
  assert.equal(response.json().data.curriculum.remainingItemCount, 0)
  assert.equal('createdByUserId' in response.json().data, false)
  await app.close()
})

test('Curriculum execution and target operations hide foreign tasks and protect counselor planning', async () => {
  const hiddenStore: StudentCoreStore = {
    ...store,
    findTaskById: async () => ({
      id: '00000000-0000-4000-8000-000000000411',
      studentProfileId: 'student-profile-1',
      createdByUserId: counselor.id,
      source: 'COUNSELOR',
      contentType: null,
      studyPlanId: null,
      subjectId: null,
      topicId: null,
      title: 'Assigned task',
      description: null,
      scheduledFor: new Date('2026-09-30T00:00:00.000Z'),
      estimatedMinutes: null,
      plannedTestCount: 0,
      status: 'PENDING',
      completedAt: null,
      skipReason: null,
      skippedAt: null,
      createdAt: new Date('2026-09-30T00:00:00.000Z'),
      updatedAt: new Date('2026-09-30T00:00:00.000Z'),
    }),
    toggleTaskCurriculumItem: async () => ({ ok: false, reason: 'TASK_NOT_FOUND' }),
    replacePersonalTaskCurriculumTargets: async () => ({ ok: false, reason: 'TASK_SOURCE_FORBIDDEN' }),
  }
  const app = createApp(hiddenStore)
  const foreign = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { completed: true },
    url: '/api/v1/student/daily-tasks/00000000-0000-4000-8000-000000000411/curriculum-items/00000000-0000-4000-8000-000000000412',
  })
  assert.equal(foreign.statusCode, 404)
  assert.equal(foreign.json().error.code, 'TASK_NOT_FOUND')

  const counselorTargets = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { curriculumTargets: [] },
    url: '/api/v1/student/daily-tasks/00000000-0000-4000-8000-000000000411/curriculum-targets',
  })
  assert.equal(counselorTargets.statusCode, 403)
  assert.equal(counselorTargets.json().error.code, 'TASK_UPDATE_FORBIDDEN')
  await app.close()
})

test('student task creates persist nullable content type and enforce own-track writes', async () => {
  const entry = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')[0]!
  const root = canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id)[0]!
  const validNode = root.itemKind === 'NODE' ? root.nodeId : root.childNodeIds[0]!
  const wrongNode = canonicalCurriculumStore.listTrackCatalog('HUMANITIES')
    .flatMap((item) => canonicalCurriculumStore.listCatalogRoots('HUMANITIES', item.id))
    .flatMap((item) => item.itemKind === 'NODE' ? [item.nodeId] : item.childNodeIds)
    .find((id) => !canonicalCurriculumStore.isSelectableNodeInTrack('EXPERIMENTAL', id))!
  const saved: DailyTaskRecord[] = []
  const capturedSelections: unknown[] = []
  const taskStore: StudentCoreStore = {
    ...store,
    createTask: async (input, targets = []) => {
      capturedSelections.push(targets)
      const result = { ...input, id: `task-${saved.length + 1}`, createdAt: user.createdAt, updatedAt: user.updatedAt }
      saved.push(result)
      return result
    },
  }
  const app = createApp(taskStore)
  const create = (payload: Record<string, unknown>) => app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: { title: 'Task', scheduledFor: '2026-10-01', ...payload },
    url: '/api/v1/student/daily-tasks',
  })
  const legacy = await create({})
  assert.equal(legacy.statusCode, 201)
  assert.equal(legacy.json().data.contentType, null)
  const general = await create({ contentType: 'GENERAL' })
  assert.equal(general.statusCode, 201)
  assert.equal(general.json().data.contentType, 'GENERAL')
  const study = await create({ contentType: 'STUDY', curriculumTargets: [{ referenceKind: 'NODE', curriculumRefId: validNode, selectionMode: 'EXACT' }] })
  assert.equal(study.statusCode, 201)
  assert.equal(study.json().data.contentType, 'STUDY')
  const v2Study = await create({
    contentType: 'STUDY',
    curriculumSelection: {
      version: 2,
      selectors: [{ rootKind: 'NODE', rootId: validNode, selector: 'SUBTREE' }],
    },
  })
  assert.equal(v2Study.statusCode, 201)
  assert.equal((capturedSelections.at(-1) as Array<{ selectionMode: string }>)[0]?.selectionMode, 'SUBTREE')
  const mixed = await create({
    curriculumTargets: [],
    curriculumSelection: { version: 2, selectors: [] },
  })
  assert.equal(mixed.statusCode, 400)
  const invalidV2 = await create({
    curriculumSelection: {
      version: 2,
      selectors: [{ rootKind: 'NODE', rootId: validNode, selector: 'WHOLE' }],
    },
  })
  assert.equal(invalidV2.statusCode, 400)
  assert.deepEqual(saved.map((item) => item.contentType), [null, 'GENERAL', 'STUDY', 'STUDY'])
  assert.equal(saved.every((item) => item.subjectId === null && item.topicId === null), true)
  const bad = await create({ contentType: 'STUDY', curriculumTargets: [{ referenceKind: 'NODE', curriculumRefId: wrongNode, selectionMode: 'EXACT' }] })
  assert.equal(bad.statusCode, 409)
  assert.equal(bad.json().error.code, 'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK')
  const spoof = await create({ contentType: 'STUDY', track: 'HUMANITIES', curriculumTargets: [{ referenceKind: 'NODE', curriculumRefId: wrongNode, selectionMode: 'EXACT' }] })
  assert.equal(spoof.statusCode, 400)
  const conversion = await app.inject({
    headers: { authorization: 'Bearer access-token' }, method: 'PATCH',
    payload: { contentType: 'GENERAL' }, url: '/api/v1/student/daily-tasks/00000000-0000-4000-8000-000000000410',
  })
  assert.equal(conversion.statusCode, 400)
  assert.equal(saved.length, 4)
  await app.close()

  const noTrackApp = createApp({
    ...taskStore,
    findStudentProfileByUserId: async () => ({ id: 'student-profile-1', userId: user.id, track: null }),
  })
  const noTrack = await noTrackApp.inject({
    headers: { authorization: 'Bearer access-token' }, method: 'POST',
    payload: { title: 'No track', scheduledFor: '2026-10-01', curriculumTargets: [{ referenceKind: 'NODE', curriculumRefId: validNode, selectionMode: 'EXACT' }] },
    url: '/api/v1/student/daily-tasks',
  })
  assert.equal(noTrack.statusCode, 409)
  assert.equal(noTrack.json().error.code, 'STUDENT_TRACK_NOT_SET')
  assert.equal(saved.length, 4)
  await noTrackApp.close()
})

test('student progress route accepts one cumulative total with an optimistic concurrency token', async () => {
  const taskId = '00000000-0000-4000-8000-000000000455'
  const expectedUpdatedAt = new Date('2026-09-03T08:00:00.000Z')
  const task: DailyTaskRecord = {
    actualSolvedTestCount: 3,
    completedAt: null,
    contentType: 'STUDY',
    createdAt: expectedUpdatedAt,
    createdByUserId: 'counselor-user-1',
    description: null,
    estimatedMinutes: 30,
    id: taskId,
    plannedTestCount: 20,
    scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
    skipReason: null,
    skippedAt: null,
    source: 'COUNSELOR',
    status: 'PENDING',
    studentProfileId: 'student-profile-1',
    studyPlanId: null,
    subjectId: null,
    title: 'Practice',
    topicId: null,
    updatedAt: expectedUpdatedAt,
  }
  const writes: unknown[] = []
  const progressStore = {
    ...store,
    findTaskById: async () => task,
    async updateTaskProgress(profileId: string, id: string, input: unknown) {
      writes.push({ profileId, id, input })
      task.actualSolvedTestCount = 12
      task.updatedAt = new Date('2026-09-03T08:01:00.000Z')
      return { ok: true as const, value: task }
    },
  } as StudentCoreStore
  const app = createApp(progressStore)

  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: {
      actualSolvedTestCount: 12,
      expectedUpdatedAt: expectedUpdatedAt.toISOString(),
    },
    url: `/api/v1/student/daily-tasks/${taskId}/progress`,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data.actualSolvedTestCount, 12)
  assert.deepEqual(writes, [{
    id: taskId,
    input: { actualSolvedTestCount: 12, expectedUpdatedAt },
    profileId: 'student-profile-1',
  }])

  for (const payload of [
    { actualSolvedTestCount: -1, expectedUpdatedAt: expectedUpdatedAt.toISOString() },
    { actualSolvedTestCount: 1.5, expectedUpdatedAt: expectedUpdatedAt.toISOString() },
    { actualSolvedTestCount: 2_147_483_648, expectedUpdatedAt: expectedUpdatedAt.toISOString() },
    { actualSolvedTestCount: 5 },
    { actualSolvedTestCount: 5, expectedUpdatedAt: expectedUpdatedAt.toISOString(), title: 'forged' },
  ]) {
    const invalid = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'PATCH',
      payload,
      url: `/api/v1/student/daily-tasks/${taskId}/progress`,
    })
    assert.equal(invalid.statusCode, 400)
    assert.equal(invalid.json().error.code, 'VALIDATION_ERROR')
  }
  assert.equal(writes.length, 1)
  await app.close()
})
