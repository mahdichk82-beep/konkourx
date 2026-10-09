import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from '../src/app.js'
import type { AuthService } from '../src/auth/auth-service.js'
import type { PublicUser } from '../src/auth/types.js'
import { createStudyTrackingServices, type StudyTrackingStore } from '../src/study-tracking/services.js'

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
  role: 'COUNSELOR',
}

const subjectId = '00000000-0000-4000-8000-000000000001'
const taskId = '00000000-0000-4000-8000-000000000002'
const foreignTaskId = '00000000-0000-4000-8000-000000000003'

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

const store: StudyTrackingStore = {
  findStudentProfileByUserId: async () => ({ id: 'student-profile-1', userId: user.id }),
  findSubjectById: async () => ({ id: subjectId, studentProfileId: 'student-profile-1', archivedAt: null }),
  findTaskById: async (_profileId, id) => id === taskId
    ? { id: taskId, studentProfileId: 'student-profile-1', subjectId, status: 'PENDING' }
    : null,
  listSessions: async () => [],
  findActiveSession: async () => null,
  findSessionById: async () => null,
  createSession: async (input) => ({ id: '00000000-0000-4000-8000-000000000010', ...input, createdAt: new Date('2026-09-03T09:00:00.000Z'), updatedAt: new Date('2026-09-03T09:00:00.000Z') }),
  updateSession: async () => null,
  startTaskSession: async (profileId, id, startedAt) => id === taskId
    ? {
        ok: true,
        reused: false,
        value: {
          cancelledAt: null,
          createdAt: startedAt,
          dailyTaskId: taskId,
          endedAt: null,
          focusRating: null,
          id: '00000000-0000-4000-8000-000000000010',
          notes: null,
          startedAt,
          studyQualityRating: null,
          studentProfileId: profileId,
          subjectId,
          updatedAt: startedAt,
        },
      }
    : { ok: false, reason: 'TASK_NOT_FOUND' },
  switchTaskSession: async (profileId, id, transitionAt) => id === taskId
    ? {
        ok: true,
        value: {
          activeSession: {
            cancelledAt: null,
            createdAt: transitionAt,
            dailyTaskId: taskId,
            endedAt: null,
            focusRating: null,
            id: '00000000-0000-4000-8000-000000000011',
            notes: null,
            startedAt: transitionAt,
            studyQualityRating: null,
            studentProfileId: profileId,
            subjectId,
            updatedAt: transitionAt,
          },
          cancelledSession: null,
          finishedSession: null,
        },
      }
    : { ok: false, reason: 'TASK_NOT_FOUND' },
  finishSession: async () => ({ ok: false, reason: 'SESSION_NOT_FOUND' }),
  pauseSession: async () => ({ ok: false, reason: 'SESSION_NOT_FOUND' }),
  resumeSession: async () => ({ ok: false, reason: 'SESSION_NOT_FOUND' }),
  cancelSession: async () => ({ ok: false, reason: 'SESSION_NOT_FOUND' }),
  updateSessionFeedback: async () => ({ ok: false, reason: 'SESSION_NOT_FOUND' }),
  listGoals: async () => [],
  findGoalById: async () => null,
  createGoal: async (input) => ({ id: '00000000-0000-4000-8000-000000000020', ...input, createdAt: new Date('2026-09-03T09:00:00.000Z'), updatedAt: new Date('2026-09-03T09:00:00.000Z') }),
  updateGoal: async () => null,
}

const createApp = (
  authenticatedUser: PublicUser = user,
  trackingStore: StudyTrackingStore = store,
) => buildApp({
  auth: { ...auth, authenticateAccessToken: async () => authenticatedUser },
  environment: 'test',
  logger: false,
  prisma: { $queryRaw: async () => [{ '?column?': 1 }] },
  studyTracking: createStudyTrackingServices(trackingStore, () => new Date('2026-09-03T09:00:00.000Z')),
})

test('study session route uses the standard v1 contract', async () => {
  const app = createApp()
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token', 'x-request-id': 'tracking-route-test' },
    method: 'POST',
    payload: {
      subjectId: '00000000-0000-4000-8000-000000000001',
      startedAt: '2026-09-03T08:00:00.000Z',
      endedAt: '2026-09-03T09:00:00.000Z',
    },
    url: '/api/v1/student/study-sessions',
  })
  assert.equal(response.statusCode, 201)
  assert.equal(response.headers['x-request-id'], 'tracking-route-test')
  assert.equal(response.json().success, true)
  assert.equal(response.json().data.durationMinutes, 60)
  await app.close()
})

test('manual session creation cannot manufacture an open live session', async () => {
  const app = createApp()
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {
      subjectId,
      startedAt: '2026-09-03T08:00:00.000Z',
      endedAt: null,
    },
    url: '/api/v1/student/study-sessions',
  })
  assert.equal(response.statusCode, 400)
  assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  await app.close()
})

test('study tracking routes reject unauthenticated requests', async () => {
  const app = createApp()
  const response = await app.inject({ method: 'GET', url: '/api/v1/student/goals' })
  assert.equal(response.statusCode, 401)
  assert.equal(response.json().error.code, 'TOKEN_MISSING')
  await app.close()
})

test('student creates a session for an owned task through the nested execution route', async () => {
  const app = createApp()
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {
      startedAt: '2026-09-03T08:00:00.000Z',
      endedAt: '2026-09-03T09:00:00.000Z',
      notes: 'Execution feedback',
    },
    url: `/api/v1/student/daily-tasks/${taskId}/sessions`,
  })

  assert.equal(response.statusCode, 201)
  assert.equal('studentProfileId' in response.json().data, false)
  assert.equal(response.json().data.dailyTaskId, taskId)
  assert.equal(response.json().data.subjectId, subjectId)
  assert.equal(response.json().data.durationMinutes, 60)
  await app.close()
})

test('student starts an owned task with a server-owned active session', async () => {
  const app = createApp()
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {},
    url: `/api/v1/student/tasks/${taskId}/start`,
  })

  assert.equal(response.statusCode, 201)
  assert.equal('studentProfileId' in response.json().data, false)
  assert.equal(response.json().data.dailyTaskId, taskId)
  assert.equal(response.json().data.startedAt, '2026-09-03T09:00:00.000Z')
  assert.equal(response.json().data.endedAt, null)
  assert.equal(response.json().data.durationMinutes, null)
  await app.close()
})

test('student finishes an owned active session through the finish route', async () => {
  const activeSession = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T08:00:00.000Z'),
    dailyTaskId: taskId,
    endedAt: null,
    id: '00000000-0000-4000-8000-000000000010',
    notes: null,
    startedAt: new Date('2026-09-03T08:15:00.000Z'),
    studentProfileId: 'student-profile-1',
    subjectId,
    updatedAt: new Date('2026-09-03T08:00:00.000Z'),
  }
  const app = createApp(user, {
    ...store,
    finishSession: async (profileId, id, endedAt, input) => {
      if (profileId !== activeSession.studentProfileId || id !== activeSession.id) {
        return { ok: false, reason: 'SESSION_NOT_FOUND' as const }
      }
      return { ok: true, value: { ...activeSession, endedAt, notes: input.notes ?? null } }
    },
  })
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { notes: 'Finished' },
    url: `/api/v1/student/study-sessions/${activeSession.id}/finish`,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data.durationMinutes, 45)
  assert.equal(response.json().data.notes, 'Finished')
  await app.close()
})

test('active-session route is static, owner derived, and returns a safe session or null', async () => {
  const activeSession = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T08:00:00.000Z'),
    dailyTaskId: taskId,
    endedAt: null,
    id: '00000000-0000-4000-8000-000000000012',
    notes: null,
    startedAt: new Date('2026-09-03T08:00:00.000Z'),
    studentProfileId: 'student-profile-1',
    subjectId,
    updatedAt: new Date('2026-09-03T08:00:00.000Z'),
  }
  const activeApp = createApp(user, {
    ...store,
    findActiveSession: async (profileId) =>
      profileId === activeSession.studentProfileId ? activeSession : null,
  })
  const activeResponse = await activeApp.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/study-sessions/active',
  })
  assert.equal(activeResponse.statusCode, 200)
  assert.equal(activeResponse.json().data.id, activeSession.id)
  assert.equal('studentProfileId' in activeResponse.json().data, false)
  await activeApp.close()

  const emptyApp = createApp()
  const emptyResponse = await emptyApp.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'GET',
    url: '/api/v1/student/study-sessions/active',
  })
  assert.equal(emptyResponse.statusCode, 200)
  assert.equal(emptyResponse.json().data, null)
  await emptyApp.close()
})

test('switch route returns finished and active sessions without changing task lifecycle', async () => {
  const previous = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T08:00:00.000Z'),
    dailyTaskId: '00000000-0000-4000-8000-000000000099',
    endedAt: new Date('2026-09-03T09:00:00.000Z'),
    id: '00000000-0000-4000-8000-000000000013',
    notes: null,
    startedAt: new Date('2026-09-03T08:00:00.000Z'),
    studentProfileId: 'student-profile-1',
    subjectId,
    updatedAt: new Date('2026-09-03T09:00:00.000Z'),
  }
  const next = {
    ...previous,
    dailyTaskId: taskId,
    endedAt: null,
    id: '00000000-0000-4000-8000-000000000014',
    startedAt: new Date('2026-09-03T09:00:00.000Z'),
  }
  const app = createApp(user, {
    ...store,
    switchTaskSession: async () => ({
      ok: true,
      value: { activeSession: next, cancelledSession: null, finishedSession: previous },
    }),
  })
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {},
    url: `/api/v1/student/tasks/${taskId}/switch`,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data.finishedSession.id, previous.id)
  assert.equal(response.json().data.activeSession.id, next.id)
  assert.equal(response.json().data.activeSession.endedAt, null)
  assert.equal('studentProfileId' in response.json().data.activeSession, false)

  const forged = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: { startedAt: '2026-09-03T09:00:00.000Z' },
    url: `/api/v1/student/tasks/${taskId}/switch`,
  })
  assert.equal(forged.statusCode, 400)
  assert.equal(forged.json().error.code, 'VALIDATION_ERROR')
  await app.close()
})

test('raw start reports an active-session conflict and generic update cannot edit a live session', async () => {
  const activeSession = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T08:00:00.000Z'),
    dailyTaskId: foreignTaskId,
    endedAt: null,
    id: '00000000-0000-4000-8000-000000000015',
    notes: null,
    startedAt: new Date('2026-09-03T08:00:00.000Z'),
    studentProfileId: 'student-profile-1',
    subjectId,
    updatedAt: new Date('2026-09-03T08:00:00.000Z'),
  }
  const app = createApp(user, {
    ...store,
    findSessionById: async () => activeSession,
    startTaskSession: async () => ({
      ok: false,
      reason: 'ACTIVE_STUDY_SESSION_EXISTS',
    }),
  })
  const startResponse = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {},
    url: `/api/v1/student/tasks/${taskId}/start`,
  })
  assert.equal(startResponse.statusCode, 409)
  assert.equal(startResponse.json().error.code, 'ACTIVE_STUDY_SESSION_EXISTS')

  const updateResponse = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { endedAt: '2026-09-03T09:00:00.000Z' },
    url: `/api/v1/student/study-sessions/${activeSession.id}`,
  })
  assert.equal(updateResponse.statusCode, 409)
  assert.equal(updateResponse.json().error.code, 'SESSION_ACTIVE_UPDATE_FORBIDDEN')
  await app.close()
})

test('cancel route is owner scoped, strict, server timed, and returns safe recovery metadata', async () => {
  const activeSession = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T08:00:00.000Z'),
    dailyTaskId: taskId,
    endedAt: null,
    id: '00000000-0000-4000-8000-000000000016',
    notes: null,
    startedAt: new Date('2026-09-03T08:00:00.000Z'),
    studentProfileId: 'student-profile-1',
    subjectId,
    updatedAt: new Date('2026-09-03T08:00:00.000Z'),
  }
  let receivedCancellationTime: Date | null = null
  const app = createApp(user, {
    ...store,
    cancelSession: async (profileId, id, cancelledAt) => {
      assert.equal(profileId, 'student-profile-1')
      assert.equal(id, activeSession.id)
      receivedCancellationTime = cancelledAt
      return { ok: true, value: { ...activeSession, cancelledAt } }
    },
  })
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: {},
    url: `/api/v1/student/study-sessions/${activeSession.id}/cancel`,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(receivedCancellationTime?.toISOString(), '2026-09-03T09:00:00.000Z')
  assert.equal(response.json().data.cancelledAt, '2026-09-03T09:00:00.000Z')
  assert.equal(response.json().data.endedAt, null)
  assert.equal(response.json().data.durationMinutes, null)
  assert.equal('studentProfileId' in response.json().data, false)

  const forged = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { cancelledAt: '2026-09-03T08:30:00.000Z' },
    url: `/api/v1/student/study-sessions/${activeSession.id}/cancel`,
  })
  assert.equal(forged.statusCode, 400)
  assert.equal(forged.json().error.code, 'VALIDATION_ERROR')
  await app.close()

  const counselorApp = createApp(counselor)
  const forbidden = await counselorApp.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: {},
    url: `/api/v1/student/study-sessions/${activeSession.id}/cancel`,
  })
  assert.equal(forbidden.statusCode, 403)
  await counselorApp.close()

  const anonymousApp = createApp()
  const anonymous = await anonymousApp.inject({
    method: 'PATCH',
    payload: {},
    url: `/api/v1/student/study-sessions/${activeSession.id}/cancel`,
  })
  assert.equal(anonymous.statusCode, 401)
  await anonymousApp.close()
})

test('switch accepts controlled CANCEL action and rejects invalid actions or fields', async () => {
  const transitionAt = new Date('2026-09-03T09:00:00.000Z')
  const previous = {
    cancelledAt: transitionAt,
    createdAt: new Date('2026-09-03T08:00:00.000Z'),
    dailyTaskId: foreignTaskId,
    endedAt: null,
    id: '00000000-0000-4000-8000-000000000017',
    notes: null,
    startedAt: new Date('2026-09-03T08:00:00.000Z'),
    studentProfileId: 'student-profile-1',
    subjectId,
    updatedAt: transitionAt,
  }
  const next = {
    ...previous,
    cancelledAt: null,
    dailyTaskId: taskId,
    id: '00000000-0000-4000-8000-000000000018',
    startedAt: transitionAt,
  }
  let receivedAction: string | undefined
  const app = createApp(user, {
    ...store,
    switchTaskSession: async (_profileId, _taskId, _time, action) => {
      receivedAction = action
      return {
        ok: true,
        value: { activeSession: next, cancelledSession: previous, finishedSession: null },
      }
    },
  })
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: { currentSessionAction: 'CANCEL' },
    url: `/api/v1/student/tasks/${taskId}/switch`,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(receivedAction, 'CANCEL')
  assert.equal(response.json().data.finishedSession, null)
  assert.equal(response.json().data.cancelledSession.id, previous.id)
  assert.equal(response.json().data.cancelledSession.durationMinutes, null)

  for (const payload of [
    { currentSessionAction: 'PAUSE' },
    { currentSessionAction: 'FINISH', cancelledAt: transitionAt.toISOString() },
  ]) {
    const invalid = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'POST',
      payload,
      url: `/api/v1/student/tasks/${taskId}/switch`,
    })
    assert.equal(invalid.statusCode, 400)
    assert.equal(invalid.json().error.code, 'VALIDATION_ERROR')
  }
  await app.close()
})

test('task execution route hides foreign tasks and rejects forged ownership', async () => {
  const app = createApp()
  const foreignStart = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {},
    url: `/api/v1/student/tasks/${foreignTaskId}/start`,
  })
  assert.equal(foreignStart.statusCode, 404)
  assert.equal(foreignStart.json().error.code, 'TASK_NOT_FOUND')

  const forgedStart = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: { studentProfileId: '00000000-0000-4000-8000-000000000099' },
    url: `/api/v1/student/tasks/${taskId}/start`,
  })
  assert.equal(forgedStart.statusCode, 400)
  assert.equal(forgedStart.json().error.code, 'VALIDATION_ERROR')

  const foreignTask = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {
      startedAt: '2026-09-03T08:00:00.000Z',
      endedAt: '2026-09-03T09:00:00.000Z',
    },
    url: `/api/v1/student/daily-tasks/${foreignTaskId}/sessions`,
  })
  assert.equal(foreignTask.statusCode, 404)
  assert.equal(foreignTask.json().error.code, 'TASK_NOT_FOUND')

  const forgedOwner = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {
      studentProfileId: '00000000-0000-4000-8000-000000000099',
      dailyTaskId: foreignTaskId,
      subjectId,
      startedAt: '2026-09-03T08:00:00.000Z',
      endedAt: '2026-09-03T09:00:00.000Z',
    },
    url: `/api/v1/student/daily-tasks/${taskId}/sessions`,
  })
  assert.equal(forgedOwner.statusCode, 400)
  assert.equal(forgedOwner.json().error.code, 'VALIDATION_ERROR')
  await app.close()
})

test('counselor and anonymous callers cannot create student task sessions', async () => {
  const counselorApp = createApp(counselor)
  const counselorStart = await counselorApp.inject({
    headers: { authorization: 'Bearer counselor-token' },
    method: 'POST',
    payload: {},
    url: `/api/v1/student/tasks/${taskId}/start`,
  })
  assert.equal(counselorStart.statusCode, 403)
  assert.equal(counselorStart.json().error.code, 'ROLE_FORBIDDEN')

  const counselorResponse = await counselorApp.inject({
    headers: { authorization: 'Bearer counselor-token' },
    method: 'POST',
    payload: {
      startedAt: '2026-09-03T08:00:00.000Z',
      endedAt: '2026-09-03T09:00:00.000Z',
    },
    url: `/api/v1/student/daily-tasks/${taskId}/sessions`,
  })
  assert.equal(counselorResponse.statusCode, 403)
  assert.equal(counselorResponse.json().error.code, 'ROLE_FORBIDDEN')
  await counselorApp.close()

  const studentApp = createApp()
  const anonymousResponse = await studentApp.inject({
    method: 'POST',
    payload: {
      startedAt: '2026-09-03T08:00:00.000Z',
      endedAt: '2026-09-03T09:00:00.000Z',
    },
    url: `/api/v1/student/daily-tasks/${taskId}/sessions`,
  })
  assert.equal(anonymousResponse.statusCode, 401)
  assert.equal(anonymousResponse.json().error.code, 'TOKEN_MISSING')
  await studentApp.close()
})

test('finish accepts optional validated ratings and keeps lifecycle timestamps server-owned', async () => {
  const active = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T08:00:00.000Z'),
    dailyTaskId: taskId,
    endedAt: null,
    focusRating: null,
    id: '00000000-0000-4000-8000-000000000030',
    notes: null,
    startedAt: new Date('2026-09-03T08:00:00.000Z'),
    studentProfileId: 'student-profile-1',
    studyQualityRating: null,
    subjectId,
    updatedAt: new Date('2026-09-03T08:00:00.000Z'),
  }
  let receivedInput: unknown
  const app = createApp(user, {
    ...store,
    finishSession: async (_profileId, _id, endedAt, input) => {
      receivedInput = input
      return { ok: true, value: { ...active, ...input, endedAt } }
    },
  })
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { focusRating: 1, studyQualityRating: 5 },
    url: `/api/v1/student/study-sessions/${active.id}/finish`,
  })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(receivedInput, { focusRating: 1, studyQualityRating: 5 })
  assert.equal(response.json().data.focusRating, 1)
  assert.equal(response.json().data.studyQualityRating, 5)
  assert.equal(response.json().data.endedAt, '2026-09-03T09:00:00.000Z')
  assert.equal('studentProfileId' in response.json().data, false)

  for (const rating of [0, 6, -1, 1.5, '4', true, {}, []]) {
    const invalid = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'PATCH',
      payload: { focusRating: rating },
      url: `/api/v1/student/study-sessions/${active.id}/finish`,
    })
    assert.equal(invalid.statusCode, 400)
    assert.equal(invalid.json().error.code, 'VALIDATION_ERROR')
  }
  const unknown = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { focusRating: 4, endedAt: '2026-09-03T08:30:00.000Z' },
    url: `/api/v1/student/study-sessions/${active.id}/finish`,
  })
  assert.equal(unknown.statusCode, 400)
  await app.close()
})

test('manual completed creation accepts ratings while open or invalid feedback remains impossible', async () => {
  const app = createApp()
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: {
      endedAt: '2026-09-03T08:45:00.000Z',
      focusRating: 3,
      startedAt: '2026-09-03T08:00:00.000Z',
      studyQualityRating: 4,
    },
    url: `/api/v1/student/daily-tasks/${taskId}/sessions`,
  })
  assert.equal(response.statusCode, 201)
  assert.equal(response.json().data.focusRating, 3)
  assert.equal(response.json().data.studyQualityRating, 4)

  const active = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'POST',
    payload: { endedAt: null, focusRating: 3, startedAt: '2026-09-03T08:00:00.000Z' },
    url: `/api/v1/student/daily-tasks/${taskId}/sessions`,
  })
  assert.equal(active.statusCode, 400)

  const generic = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { focusRating: 3 },
    url: '/api/v1/student/study-sessions/00000000-0000-4000-8000-000000000030',
  })
  assert.equal(generic.statusCode, 400)
  assert.equal(generic.json().error.code, 'VALIDATION_ERROR')
  await app.close()
})

test('focused feedback route is strict, owner scoped, clearable, and finished-only', async () => {
  const finished = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T08:00:00.000Z'),
    dailyTaskId: taskId,
    endedAt: new Date('2026-09-03T09:00:00.000Z'),
    focusRating: null,
    id: '00000000-0000-4000-8000-000000000031',
    notes: null,
    startedAt: new Date('2026-09-03T08:00:00.000Z'),
    studentProfileId: 'student-profile-1',
    studyQualityRating: null,
    subjectId,
    updatedAt: new Date('2026-09-03T09:00:00.000Z'),
  }
  let received: unknown
  const app = createApp(user, {
    ...store,
    updateSessionFeedback: async (profileId, id, input) => {
      assert.equal(profileId, finished.studentProfileId)
      assert.equal(id, finished.id)
      received = input
      return { ok: true, value: { ...finished, ...input } }
    },
  })
  const response = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { focusRating: 4, studyQualityRating: null },
    url: `/api/v1/student/study-sessions/${finished.id}/feedback`,
  })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(received, { focusRating: 4, studyQualityRating: null })
  assert.equal(response.json().data.focusRating, 4)
  assert.equal(response.json().data.studyQualityRating, null)
  assert.equal('studentProfileId' in response.json().data, false)

  for (const payload of [{}, { notes: 'forged' }, { focusRating: 5, cancelledAt: null }]) {
    const invalid = await app.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'PATCH',
      payload,
      url: `/api/v1/student/study-sessions/${finished.id}/feedback`,
    })
    assert.equal(invalid.statusCode, 400)
  }
  await app.close()

  for (const [reason, code] of [
    ['SESSION_NOT_FINISHED', 'SESSION_NOT_FINISHED'],
    ['SESSION_ALREADY_CANCELLED', 'SESSION_ALREADY_CANCELLED'],
    ['SESSION_NOT_FOUND', 'SESSION_NOT_FOUND'],
  ] as const) {
    const stateApp = createApp(user, {
      ...store,
      updateSessionFeedback: async () => ({ ok: false, reason }),
    })
    const stateResponse = await stateApp.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'PATCH',
      payload: { focusRating: 3 },
      url: `/api/v1/student/study-sessions/${finished.id}/feedback`,
    })
    assert.equal(stateResponse.json().error.code, code)
    await stateApp.close()
  }

  const counselorApp = createApp(counselor)
  const forbidden = await counselorApp.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { focusRating: 3 },
    url: `/api/v1/student/study-sessions/${finished.id}/feedback`,
  })
  assert.equal(forbidden.statusCode, 403)
  await counselorApp.close()

  const anonymousApp = createApp()
  const anonymous = await anonymousApp.inject({
    method: 'PATCH',
    payload: { focusRating: 3 },
    url: `/api/v1/student/study-sessions/${finished.id}/feedback`,
  })
  assert.equal(anonymous.statusCode, 401)
  await anonymousApp.close()
})

test('pause and resume routes are owner scoped, server timed, and return canonical timer state', async () => {
  const startedAt = new Date('2026-09-03T08:00:00.000Z')
  const updatedAt = new Date('2026-09-03T08:00:00.000Z')
  const serverNow = new Date('2026-09-03T09:00:00.000Z')
  const base = {
    cancelledAt: null,
    createdAt: startedAt,
    dailyTaskId: taskId,
    endedAt: null,
    focusRating: null,
    id: '00000000-0000-4000-8000-000000000040',
    isTimerManaged: true,
    notes: null,
    startedAt,
    studentProfileId: 'student-profile-1',
    studyQualityRating: null,
    subjectId,
    updatedAt,
  }
  const received: Array<{ action: string; expectedUpdatedAt: Date; transitionAt: Date }> = []
  const app = createApp(user, {
    ...store,
    pauseSession: async (profileId, id, transitionAt, expected) => {
      assert.equal(profileId, base.studentProfileId)
      assert.equal(id, base.id)
      received.push({ action: 'pause', expectedUpdatedAt: expected, transitionAt })
      return {
        ok: true,
        value: {
          ...base,
          pauses: [{ id: 'pause-1', pausedAt: transitionAt, resumedAt: null, studySessionId: base.id }],
          updatedAt: transitionAt,
        },
      }
    },
    resumeSession: async (_profileId, _id, transitionAt, expected) => {
      received.push({ action: 'resume', expectedUpdatedAt: expected, transitionAt })
      return {
        ok: true,
        value: {
          ...base,
          pauses: [{ id: 'pause-1', pausedAt: serverNow, resumedAt: transitionAt, studySessionId: base.id }],
          updatedAt: transitionAt,
        },
      }
    },
  })

  const pause = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { expectedUpdatedAt: updatedAt.toISOString() },
    url: `/api/v1/student/study-sessions/${base.id}/pause`,
  })
  assert.equal(pause.statusCode, 200)
  assert.equal(pause.json().data.timerState, 'PAUSED')
  assert.equal(pause.json().data.serverNow, serverNow.toISOString())
  assert.equal(pause.json().data.activeElapsedMs, 3_600_000)
  assert.equal(pause.json().data.pausedAt, serverNow.toISOString())

  const resume = await app.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { expectedUpdatedAt: serverNow.toISOString() },
    url: `/api/v1/student/study-sessions/${base.id}/resume`,
  })
  assert.equal(resume.statusCode, 200)
  assert.equal(resume.json().data.timerState, 'RUNNING')
  assert.equal(resume.json().data.pausedAt, null)
  assert.deepEqual(received, [
    { action: 'pause', expectedUpdatedAt: updatedAt, transitionAt: serverNow },
    { action: 'resume', expectedUpdatedAt: serverNow, transitionAt: serverNow },
  ])
  await app.close()
})

test('timer transition routes reject stale, forged, unauthenticated, and non-Student requests', async () => {
  const sessionId = '00000000-0000-4000-8000-000000000041'
  const staleApp = createApp(user, {
    ...store,
    pauseSession: async () => ({ ok: false, reason: 'SESSION_STATE_STALE' }),
  })
  const stale = await staleApp.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { expectedUpdatedAt: '2026-09-03T08:00:00.000Z' },
    url: `/api/v1/student/study-sessions/${sessionId}/pause`,
  })
  assert.equal(stale.statusCode, 409)
  assert.equal(stale.json().error.code, 'SESSION_STATE_STALE')

  for (const payload of [{}, { expectedUpdatedAt: 'invalid' }, {
    expectedUpdatedAt: '2026-09-03T08:00:00.000Z',
    pausedAt: '2026-09-03T08:30:00.000Z',
  }]) {
    const invalid = await staleApp.inject({
      headers: { authorization: 'Bearer access-token' },
      method: 'PATCH',
      payload,
      url: `/api/v1/student/study-sessions/${sessionId}/pause`,
    })
    assert.equal(invalid.statusCode, 400)
    assert.equal(invalid.json().error.code, 'VALIDATION_ERROR')
  }
  await staleApp.close()

  const counselorApp = createApp(counselor)
  const forbidden = await counselorApp.inject({
    headers: { authorization: 'Bearer access-token' },
    method: 'PATCH',
    payload: { expectedUpdatedAt: '2026-09-03T08:00:00.000Z' },
    url: `/api/v1/student/study-sessions/${sessionId}/resume`,
  })
  assert.equal(forbidden.statusCode, 403)
  await counselorApp.close()

  const anonymousApp = createApp()
  const anonymous = await anonymousApp.inject({
    method: 'PATCH',
    payload: { expectedUpdatedAt: '2026-09-03T08:00:00.000Z' },
    url: `/api/v1/student/study-sessions/${sessionId}/resume`,
  })
  assert.equal(anonymous.statusCode, 401)
  await anonymousApp.close()
})
