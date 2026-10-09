import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError } from '../src/errors/api-error.js'
import { createStudyTrackingServices, type StudyTrackingStore } from '../src/study-tracking/services.js'
import type { DomainStudent, StudentGoalRecord, StudySessionPauseRecord, StudySessionRecord } from '../src/study-tracking/types.js'

const student: DomainStudent = { id: 'student-user-1', role: 'STUDENT', status: 'ACTIVE' }
const profile = { id: 'student-profile-1', userId: student.id }
const subject = { id: 'subject-1', studentProfileId: profile.id, archivedAt: null }
const task = { id: 'task-1', studentProfileId: profile.id, subjectId: subject.id, status: 'PENDING' as const }
const secondTask = { ...task, id: 'task-2' }
const timestamp = new Date('2026-09-03T09:00:00.000Z')

const createStore = (): StudyTrackingStore & {
  sessions: StudySessionRecord[]
  pauses: StudySessionPauseRecord[]
  goals: StudentGoalRecord[]
} => {
  let liveQueue = Promise.resolve()
  const serializeLive = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = liveQueue.then(operation, operation)
    liveQueue = result.then(() => undefined, () => undefined)
    return result
  }
  const pauses: StudySessionPauseRecord[] = []
  const withPauses = (record: StudySessionRecord): StudySessionRecord => ({
    ...record,
    pauses: pauses.filter((pause) => pause.studySessionId === record.id),
  })
  const store = {
    sessions: [] as StudySessionRecord[],
    pauses,
    goals: [] as StudentGoalRecord[],
    async findStudentProfileByUserId(userId: string) { return userId === profile.userId ? profile : null },
    async findSubjectById(_profileId: string, id: string) { return id === subject.id ? subject : null },
    async findTaskById(profileId: string, id: string) {
      return profileId === profile.id && id === task.id ? task : null
    },
    async listSessions(_profileId: string, query?: { dailyTaskId?: string }) {
      return query?.dailyTaskId
        ? store.sessions.filter((session) => session.dailyTaskId === query.dailyTaskId).map(withPauses)
        : store.sessions.map(withPauses)
    },
    async findActiveSession(profileId: string) {
      const record = store.sessions.find((item) =>
        item.studentProfileId === profileId
        && item.endedAt === null
        && item.cancelledAt === null,
      )
      return record ? withPauses(record) : null
    },
    async findSessionById(profileId: string, id: string) {
      const record = store.sessions.find((item) => item.id === id && item.studentProfileId === profileId)
      return record ? withPauses(record) : null
    },
    async createSession(input: Omit<StudySessionRecord, 'id' | 'createdAt' | 'pauses' | 'updatedAt'>) {
      const record = { id: `session-${store.sessions.length + 1}`, ...input, createdAt: timestamp, updatedAt: timestamp }
      store.sessions.push(record)
      return record
    },
    async updateSession(_profileId: string, id: string, input: Partial<Pick<StudySessionRecord, 'subjectId' | 'dailyTaskId' | 'startedAt' | 'endedAt' | 'notes'>>) {
      const record = store.sessions.find((item) => item.id === id)
      if (!record) return null
      Object.assign(record, input, { updatedAt: timestamp })
      return record
    },
    async startTaskSession(profileId: string, taskId: string, startedAt: Date) {
      return serializeLive(async () => {
        const target = await store.findTaskById(profileId, taskId)
        if (!target) return { ok: false as const, reason: 'TASK_NOT_FOUND' as const }
        if (target.status !== 'PENDING') {
          return { ok: false as const, reason: 'TASK_NOT_EXECUTABLE' as const }
        }
        const active = store.sessions.find((item) =>
          item.studentProfileId === profileId && item.endedAt === null && item.cancelledAt === null,
        )
        if (active) {
          return active.dailyTaskId === taskId
            ? { ok: true as const, value: active, reused: true }
            : { ok: false as const, reason: 'ACTIVE_STUDY_SESSION_EXISTS' as const }
        }
        const value = await store.createSession({
          cancelledAt: null,
          dailyTaskId: taskId,
          endedAt: null,
          focusRating: null,
          notes: null,
          startedAt,
          isTimerManaged: true,
          studyQualityRating: null,
          studentProfileId: profileId,
          subjectId: target.subjectId,
        })
        return { ok: true as const, value, reused: false }
      })
    },
    async switchTaskSession(
      profileId: string,
      taskId: string,
      transitionAt: Date,
      currentSessionAction: 'FINISH' | 'CANCEL',
    ) {
      return serializeLive(async () => {
        const target = await store.findTaskById(profileId, taskId)
        if (!target) return { ok: false as const, reason: 'TASK_NOT_FOUND' as const }
        if (target.status !== 'PENDING') {
          return { ok: false as const, reason: 'TASK_NOT_EXECUTABLE' as const }
        }
        const active = store.sessions.find((item) =>
          item.studentProfileId === profileId && item.endedAt === null && item.cancelledAt === null,
        )
        if (active?.dailyTaskId === taskId) {
          return {
            ok: true as const,
            value: { activeSession: active, cancelledSession: null, finishedSession: null },
          }
        }
        let cancelledSession = null
        let finishedSession = null
        if (active) {
          if (currentSessionAction === 'FINISH' && transitionAt <= active.startedAt) {
            return { ok: false as const, reason: 'SESSION_TIME_INVALID' as const }
          }
          if (currentSessionAction === 'CANCEL') {
            active.cancelledAt = transitionAt
            cancelledSession = withPauses(active)
          } else {
            active.endedAt = transitionAt
            finishedSession = withPauses(active)
          }
        }
        const activeSession = await store.createSession({
          cancelledAt: null,
          dailyTaskId: taskId,
          endedAt: null,
          focusRating: null,
          notes: null,
          startedAt: transitionAt,
          isTimerManaged: true,
          studyQualityRating: null,
          studentProfileId: profileId,
          subjectId: target.subjectId,
        })
        return {
          ok: true as const,
          value: { activeSession, cancelledSession, finishedSession },
        }
      })
    },
    async finishSession(
      profileId: string,
      id: string,
      endedAt: Date,
      input: { focusRating?: number | null; notes?: string | null; studyQualityRating?: number | null },
    ) {
      return serializeLive(async () => {
        const record = store.sessions.find((item) => item.id === id && item.studentProfileId === profileId)
        if (!record) return { ok: false as const, reason: 'SESSION_NOT_FOUND' as const }
        if (record.endedAt) return { ok: false as const, reason: 'SESSION_ALREADY_FINISHED' as const }
        if (record.cancelledAt) return { ok: false as const, reason: 'SESSION_ALREADY_CANCELLED' as const }
        if (endedAt <= record.startedAt) return { ok: false as const, reason: 'SESSION_TIME_INVALID' as const }
        record.endedAt = endedAt
        if (input.focusRating !== undefined) record.focusRating = input.focusRating
        if (input.notes !== undefined) record.notes = input.notes
        if (input.studyQualityRating !== undefined) record.studyQualityRating = input.studyQualityRating
        return { ok: true as const, value: withPauses(record) }
      })
    },
    async pauseSession(profileId: string, id: string, pausedAt: Date, expectedUpdatedAt: Date) {
      return serializeLive(async () => {
        const record = store.sessions.find((item) => item.id === id && item.studentProfileId === profileId)
        if (!record) return { ok: false as const, reason: 'SESSION_NOT_FOUND' as const }
        if (record.endedAt) return { ok: false as const, reason: 'SESSION_ALREADY_FINISHED' as const }
        if (record.cancelledAt) return { ok: false as const, reason: 'SESSION_ALREADY_CANCELLED' as const }
        const openPause = pauses.find((pause) => pause.studySessionId === id && pause.resumedAt === null)
        if (openPause) return { ok: true as const, value: withPauses(record) }
        if (record.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
          return { ok: false as const, reason: 'SESSION_STATE_STALE' as const }
        }
        pauses.push({ id: `pause-${pauses.length + 1}`, pausedAt, resumedAt: null, studySessionId: id })
        record.isTimerManaged = true
        record.updatedAt = pausedAt
        return { ok: true as const, value: withPauses(record) }
      })
    },
    async resumeSession(profileId: string, id: string, resumedAt: Date, expectedUpdatedAt: Date) {
      return serializeLive(async () => {
        const record = store.sessions.find((item) => item.id === id && item.studentProfileId === profileId)
        if (!record) return { ok: false as const, reason: 'SESSION_NOT_FOUND' as const }
        if (record.endedAt) return { ok: false as const, reason: 'SESSION_ALREADY_FINISHED' as const }
        if (record.cancelledAt) return { ok: false as const, reason: 'SESSION_ALREADY_CANCELLED' as const }
        const openPause = pauses.find((pause) => pause.studySessionId === id && pause.resumedAt === null)
        if (!openPause) {
          return record.updatedAt.getTime() === expectedUpdatedAt.getTime()
            ? { ok: false as const, reason: 'SESSION_NOT_PAUSED' as const }
            : { ok: true as const, value: withPauses(record) }
        }
        if (record.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
          return { ok: false as const, reason: 'SESSION_STATE_STALE' as const }
        }
        openPause.resumedAt = resumedAt
        record.isTimerManaged = true
        record.updatedAt = resumedAt
        return { ok: true as const, value: withPauses(record) }
      })
    },
    async cancelSession(profileId: string, id: string, cancelledAt: Date) {
      return serializeLive(async () => {
        const record = store.sessions.find((item) => item.id === id && item.studentProfileId === profileId)
        if (!record) return { ok: false as const, reason: 'SESSION_NOT_FOUND' as const }
        if (record.endedAt) return { ok: false as const, reason: 'SESSION_ALREADY_FINISHED' as const }
        if (record.cancelledAt) return { ok: false as const, reason: 'SESSION_ALREADY_CANCELLED' as const }
        record.cancelledAt = cancelledAt
        return { ok: true as const, value: withPauses(record) }
      })
    },
    async updateSessionFeedback(
      profileId: string,
      id: string,
      input: { focusRating?: number | null; studyQualityRating?: number | null },
    ) {
      const record = store.sessions.find((item) => item.id === id && item.studentProfileId === profileId)
      if (!record) return { ok: false as const, reason: 'SESSION_NOT_FOUND' as const }
      if (record.cancelledAt) return { ok: false as const, reason: 'SESSION_ALREADY_CANCELLED' as const }
      if (!record.endedAt) return { ok: false as const, reason: 'SESSION_NOT_FINISHED' as const }
      Object.assign(record, input, { updatedAt: timestamp })
      return { ok: true as const, value: withPauses(record) }
    },
    async listGoals() { return store.goals },
    async findGoalById(_profileId: string, id: string) { return store.goals.find((item) => item.id === id) ?? null },
    async createGoal(input: Omit<StudentGoalRecord, 'id' | 'createdAt' | 'updatedAt'>) {
      const record = { id: `goal-${store.goals.length + 1}`, ...input, createdAt: timestamp, updatedAt: timestamp }
      store.goals.push(record)
      return record
    },
    async updateGoal(_profileId: string, id: string, input: Partial<Pick<StudentGoalRecord, 'subjectId' | 'title' | 'description' | 'targetDate' | 'status' | 'completedAt'>>) {
      const record = store.goals.find((item) => item.id === id)
      if (!record) return null
      Object.assign(record, input, { updatedAt: timestamp })
      return record
    },
  }
  return store
}

test('study sessions require ordered timestamps and calculate duration', async () => {
  const services = createStudyTrackingServices(createStore(), () => timestamp)
  const session = await services.sessions.create(student, {
    subjectId: subject.id,
    dailyTaskId: task.id,
    startedAt: '2026-09-03T08:00:00.000Z',
    endedAt: '2026-09-03T09:00:00.000Z',
    notes: 'Algebra review',
  })

  assert.equal(session.durationMinutes, 60)

  await assert.rejects(
    services.sessions.create(student, {
      subjectId: subject.id,
      dailyTaskId: null,
      startedAt: '2026-09-03T10:00:00.000Z',
      endedAt: '2026-09-03T09:00:00.000Z',
      notes: null,
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_TIME_INVALID',
  )
})

test('study sessions reject a task linked to a different subject', async () => {
  const store = createStore()
  store.findTaskById = async () => ({ ...task, subjectId: 'other-subject' })
  const services = createStudyTrackingServices(store)

  await assert.rejects(
    services.sessions.create(student, {
      subjectId: subject.id,
      dailyTaskId: task.id,
      startedAt: '2026-09-03T08:00:00.000Z',
      endedAt: '2026-09-03T09:00:00.000Z',
      notes: null,
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_SUBJECT_MISMATCH',
  )
})

test('student starts an owned pending task with server-owned session linkage and time', async () => {
  const store = createStore()
  const services = createStudyTrackingServices(store, () => timestamp)

  const session = await services.sessions.startTask(student, task.id)

  assert.equal('studentProfileId' in session, false)
  assert.equal(session.dailyTaskId, task.id)
  assert.equal(session.subjectId, subject.id)
  assert.deepEqual(session.startedAt, timestamp)
  assert.equal(session.endedAt, null)
  assert.equal(session.durationMinutes, null)
  assert.equal(store.sessions.length, 1)

  await assert.rejects(
    services.sessions.startTask(student, 'foreign-task'),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_NOT_FOUND',
  )
})

test('only pending tasks are executable and starting does not alter task lifecycle', async () => {
  const store = createStore()
  store.findTaskById = async () => ({ ...task, status: 'COMPLETED' })
  const services = createStudyTrackingServices(store, () => timestamp)

  await assert.rejects(
    services.sessions.startTask(student, task.id),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_NOT_EXECUTABLE',
  )
  assert.equal(store.sessions.length, 0)
  assert.equal((await store.findTaskById(profile.id, task.id))?.status, 'COMPLETED')
})

test('student finishes only an owned active session and duration uses server finish time', async () => {
  const store = createStore()
  store.sessions.push({
    cancelledAt: null,
    createdAt: timestamp,
    dailyTaskId: task.id,
    endedAt: null,
    id: 'active-session',
    notes: null,
    startedAt: new Date('2026-09-03T08:15:00.000Z'),
    studentProfileId: profile.id,
    subjectId: subject.id,
    updatedAt: timestamp,
  })
  const services = createStudyTrackingServices(store, () => timestamp)
  const finished = await services.sessions.finish(student, 'active-session', { notes: 'Done' })

  assert.deepEqual(finished.endedAt, timestamp)
  assert.equal(finished.durationMinutes, 45)
  assert.equal(finished.notes, 'Done')

  await assert.rejects(
    services.sessions.finish(student, 'active-session', {}),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_ALREADY_FINISHED',
  )

  store.sessions.push({
    ...store.sessions[0]!,
    endedAt: null,
    id: 'foreign-session',
    studentProfileId: 'other-profile',
  })
  await assert.rejects(
    services.sessions.finish(student, 'foreign-session', {}),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_NOT_FOUND',
  )
})

test('finishing rejects a server end time that is not after session start', async () => {
  const store = createStore()
  store.sessions.push({
    cancelledAt: null,
    createdAt: timestamp,
    dailyTaskId: task.id,
    endedAt: null,
    id: 'future-session',
    notes: null,
    startedAt: new Date('2026-09-03T10:00:00.000Z'),
    studentProfileId: profile.id,
    subjectId: subject.id,
    updatedAt: timestamp,
  })
  const services = createStudyTrackingServices(store, () => timestamp)

  await assert.rejects(
    services.sessions.finish(student, 'future-session', {}),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_TIME_INVALID',
  )
})

test('task execution derives session ownership and relationships for an owned task', async () => {
  const store = createStore()
  const services = createStudyTrackingServices(store)

  const session = await services.sessions.createForTask(student, task.id, {
    startedAt: '2026-09-03T08:00:00.000Z',
    endedAt: '2026-09-03T08:45:00.000Z',
    notes: 'Task execution',
  })

  assert.equal('studentProfileId' in session, false)
  assert.equal(session.dailyTaskId, task.id)
  assert.equal(session.subjectId, subject.id)
  assert.equal(session.durationMinutes, 45)
  assert.equal(store.sessions.length, 1)
})

test('task execution supports owned subjectless tasks and rejects inaccessible tasks', async () => {
  const store = createStore()
  store.findTaskById = async (profileId, id) => (
    profileId === profile.id && id === task.id
      ? { ...task, subjectId: null }
      : null
  )
  const services = createStudyTrackingServices(store)

  const session = await services.sessions.createForTask(student, task.id, {
    startedAt: '2026-09-03T08:00:00.000Z',
    endedAt: '2026-09-03T09:00:00.000Z',
    notes: null,
  })
  assert.equal(session.subjectId, null)

  await assert.rejects(
    services.sessions.createForTask(student, 'foreign-task', {
      startedAt: '2026-09-03T08:00:00.000Z',
      endedAt: '2026-09-03T09:00:00.000Z',
      notes: null,
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_NOT_FOUND',
  )
})

test('task-specific session reads require an owned task and preserve duration calculation', async () => {
  const store = createStore()
  store.sessions.push({
    cancelledAt: null,
    createdAt: timestamp,
    dailyTaskId: task.id,
    endedAt: new Date('2026-09-03T09:30:00.000Z'),
    id: 'session-existing',
    notes: null,
    startedAt: new Date('2026-09-03T09:00:00.000Z'),
    studentProfileId: profile.id,
    subjectId: subject.id,
    updatedAt: timestamp,
  })
  const services = createStudyTrackingServices(store)

  const result = await services.sessions.list(student, { dailyTaskId: task.id })
  assert.equal(result.items[0]?.durationMinutes, 30)

  await assert.rejects(
    services.sessions.list(student, { dailyTaskId: 'foreign-task' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_NOT_FOUND',
  )
})

test('student goals set completedAt only when completed', async () => {
  const store = createStore()
  const services = createStudyTrackingServices(store, () => timestamp)
  const goal = await services.goals.create(student, {
    subjectId: subject.id,
    title: 'Master algebra',
    description: null,
    targetDate: '2026-09-30',
  })
  assert.equal(goal.status, 'ACTIVE')
  assert.equal(goal.completedAt, null)

  const completed = await services.goals.update(student, goal.id, { status: 'COMPLETED' })
  assert.deepEqual(completed.completedAt, timestamp)
})

test('student switches A to B to A as three sequential sessions without changing tasks', async () => {
  const store = createStore()
  store.findTaskById = async (profileId, id) => {
    if (profileId !== profile.id) return null
    if (id === task.id) return task
    if (id === secondTask.id) return secondTask
    return null
  }
  const times = [
    new Date('2026-09-03T09:00:00.000Z'),
    new Date('2026-09-03T09:25:00.000Z'),
    new Date('2026-09-03T09:50:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift()!)

  const firstBiology = await services.sessions.startTask(student, task.id)
  const mathematics = await services.sessions.switchTask(student, secondTask.id)
  const secondBiology = await services.sessions.switchTask(student, task.id)

  assert.equal(mathematics.finishedSession?.id, firstBiology.id)
  assert.deepEqual(mathematics.finishedSession?.endedAt, new Date('2026-09-03T09:25:00.000Z'))
  assert.equal(mathematics.activeSession.dailyTaskId, secondTask.id)
  assert.equal(secondBiology.finishedSession?.id, mathematics.activeSession.id)
  assert.equal(secondBiology.activeSession.dailyTaskId, task.id)
  assert.notEqual(secondBiology.activeSession.id, firstBiology.id)
  assert.equal(store.sessions.length, 3)
  assert.deepEqual(store.sessions.map(({ dailyTaskId }) => dailyTaskId), [task.id, secondTask.id, task.id])
  assert.equal(task.status, 'PENDING')
  assert.equal(secondTask.status, 'PENDING')
})

test('switch starts safely when none is active and reuses an already-active target', async () => {
  const store = createStore()
  const services = createStudyTrackingServices(store, () => timestamp)

  const started = await services.sessions.switchTask(student, task.id)
  const retried = await services.sessions.switchTask(student, task.id)

  assert.equal(started.finishedSession, null)
  assert.equal(retried.finishedSession, null)
  assert.equal(retried.activeSession.id, started.activeSession.id)
  assert.equal(store.sessions.length, 1)
})

test('serialized concurrent starts retain one live session and same-task retries reuse it', async () => {
  const store = createStore()
  store.findTaskById = async (profileId, id) => {
    if (profileId !== profile.id) return null
    return id === task.id ? task : id === secondTask.id ? secondTask : null
  }
  const services = createStudyTrackingServices(store, () => timestamp)

  const sameTask = await Promise.all([
    services.sessions.startTask(student, task.id),
    services.sessions.startTask(student, task.id),
  ])
  assert.equal(sameTask[0]?.id, sameTask[1]?.id)
  assert.equal(store.sessions.filter(({ endedAt }) => endedAt === null).length, 1)

  const otherTask = await Promise.allSettled([
    services.sessions.startTask(student, secondTask.id),
    services.sessions.startTask(student, secondTask.id),
  ])
  assert.equal(otherTask.every(({ status }) => status === 'rejected'), true)
  for (const result of otherTask) {
    if (result.status === 'rejected') {
      assert.equal(result.reason instanceof ApiError, true)
      assert.equal(result.reason.code, 'ACTIVE_STUDY_SESSION_EXISTS')
    }
  }
  assert.equal(store.sessions.filter(({ endedAt }) => endedAt === null).length, 1)
})

test('serialized concurrent switch and start cannot leave duplicate live sessions', async () => {
  const store = createStore()
  const thirdTask = { ...task, id: 'task-3' }
  store.findTaskById = async (profileId, id) => {
    if (profileId !== profile.id) return null
    return [task, secondTask, thirdTask].find((candidate) => candidate.id === id) ?? null
  }
  const times = [
    new Date('2026-09-03T08:00:00.000Z'),
    new Date('2026-09-03T08:25:00.000Z'),
    new Date('2026-09-03T08:25:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift()!)
  await services.sessions.startTask(student, task.id)

  const results = await Promise.allSettled([
    services.sessions.switchTask(student, secondTask.id),
    services.sessions.startTask(student, thirdTask.id),
  ])

  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1)
  assert.equal(results.filter(({ status }) => status === 'rejected').length, 1)
  assert.equal(store.sessions.filter(({ endedAt }) => endedAt === null).length, 1)
})

test('active-session query is owner scoped and generic update cannot reopen or edit live state', async () => {
  const store = createStore()
  const times = [
    new Date('2026-09-03T08:00:00.000Z'),
    new Date('2026-09-03T08:30:00.000Z'),
    timestamp,
    new Date('2026-09-03T09:10:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift()!)
  const active = await services.sessions.startTask(student, task.id)

  assert.equal((await services.sessions.active(student))?.id, active.id)
  assert.equal(await createStudyTrackingServices(createStore()).sessions.active(student), null)
  await assert.rejects(
    services.sessions.update(student, active.id, { notes: 'client edit' }),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_ACTIVE_UPDATE_FORBIDDEN',
  )

  await services.sessions.finish(student, active.id, {})
  store.sessions.push({
    ...store.sessions[0]!,
    id: 'legacy-finished-history',
    isTimerManaged: false,
  })
  const edited = await services.sessions.update(student, 'legacy-finished-history', {
    endedAt: '2026-09-03T09:10:00.000Z',
    startedAt: '2026-09-03T08:30:00.000Z',
  })
  assert.equal(edited.durationMinutes, 40)
  assert.equal(await services.sessions.active(student), null)
})

test('cancelling an owned active session persists recovery metadata without completed effort', async () => {
  const store = createStore()
  const times = [
    new Date('2026-09-03T08:00:00.000Z'),
    new Date('2026-09-04T08:00:00.000Z'),
    new Date('2026-09-04T08:01:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift()!)
  const active = await services.sessions.startTask(student, task.id)
  const cancelled = await services.sessions.cancel(student, active.id)

  assert.equal(cancelled.cancelledAt?.toISOString(), '2026-09-04T08:00:00.000Z')
  assert.equal(cancelled.endedAt, null)
  assert.equal(cancelled.durationMinutes, null)
  assert.equal('studentProfileId' in cancelled, false)
  assert.equal(await services.sessions.active(student), null)
  assert.equal(task.status, 'PENDING')

  const restarted = await services.sessions.startTask(student, task.id)
  assert.notEqual(restarted.id, cancelled.id)
  assert.equal(restarted.cancelledAt, null)
  assert.equal(store.sessions.length, 2)
})

test('finished and cancelled sessions reject invalid lifecycle transitions and cancelled edits', async () => {
  const store = createStore()
  const times = [
    new Date('2026-09-03T08:00:00.000Z'),
    new Date('2026-09-03T09:00:00.000Z'),
    new Date('2026-09-03T10:00:00.000Z'),
    new Date('2026-09-03T11:00:00.000Z'),
    new Date('2026-09-03T12:00:00.000Z'),
    new Date('2026-09-03T13:00:00.000Z'),
    new Date('2026-09-03T14:00:00.000Z'),
    new Date('2026-09-03T15:00:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift()!)

  const first = await services.sessions.startTask(student, task.id)
  await services.sessions.finish(student, first.id, {})
  await assert.rejects(
    services.sessions.cancel(student, first.id),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_ALREADY_FINISHED',
  )

  const second = await services.sessions.startTask(student, task.id)
  await services.sessions.cancel(student, second.id)
  await assert.rejects(
    services.sessions.cancel(student, second.id),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_ALREADY_CANCELLED',
  )
  await assert.rejects(
    services.sessions.finish(student, second.id, {}),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_ALREADY_CANCELLED',
  )
  await assert.rejects(
    services.sessions.update(student, second.id, { notes: 'rewrite' }),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_CANCELLED_UPDATE_FORBIDDEN',
  )
  store.sessions.push({
    ...store.sessions[0]!,
    cancelledAt: null,
    endedAt: null,
    id: 'foreign-active-session',
    studentProfileId: 'other-profile',
  })
  await assert.rejects(
    services.sessions.cancel(student, 'foreign-active-session'),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_NOT_FOUND',
  )
})

test('CANCEL switching discards the previous interval and starts a new active task atomically', async () => {
  const store = createStore()
  store.findTaskById = async (profileId, id) => {
    if (profileId !== profile.id) return null
    return id === task.id ? task : id === secondTask.id ? secondTask : null
  }
  const times = [
    new Date('2026-09-03T20:00:00.000Z'),
    new Date('2026-09-04T08:00:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift()!)
  const first = await services.sessions.startTask(student, task.id)
  const switched = await services.sessions.switchTask(student, secondTask.id, 'CANCEL')

  assert.equal(switched.finishedSession, null)
  assert.equal(switched.cancelledSession?.id, first.id)
  assert.equal(switched.cancelledSession?.endedAt, null)
  assert.equal(switched.cancelledSession?.durationMinutes, null)
  assert.equal(switched.activeSession.dailyTaskId, secondTask.id)
  assert.equal(switched.activeSession.startedAt.toISOString(), '2026-09-04T08:00:00.000Z')
  assert.equal(store.sessions.filter((session) =>
    session.endedAt === null && session.cancelledAt === null).length, 1)
  assert.equal(task.status, 'PENDING')
  assert.equal(secondTask.status, 'PENDING')
})

test('CANCEL switch to the already-active task reuses it without fragmentation', async () => {
  const store = createStore()
  const services = createStudyTrackingServices(store, () => timestamp)
  const active = await services.sessions.startTask(student, task.id)
  const result = await services.sessions.switchTask(student, task.id, 'CANCEL')

  assert.equal(result.activeSession.id, active.id)
  assert.equal(result.cancelledSession, null)
  assert.equal(result.finishedSession, null)
  assert.equal(store.sessions.length, 1)
  assert.equal(store.sessions[0]?.cancelledAt, null)
})

test('serialized finish/cancel and subsequent retries retain an exclusive lifecycle', async () => {
  const store = createStore()
  const times = [
    new Date('2026-09-03T08:00:00.000Z'),
    new Date('2026-09-03T09:00:00.000Z'),
    new Date('2026-09-03T09:00:00.000Z'),
    new Date('2026-09-03T10:00:00.000Z'),
    new Date('2026-09-03T10:01:00.000Z'),
    new Date('2026-09-03T10:02:00.000Z'),
    new Date('2026-09-03T10:02:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift()!)
  const first = await services.sessions.startTask(student, task.id)
  const race = await Promise.allSettled([
    services.sessions.finish(student, first.id, {}),
    services.sessions.cancel(student, first.id),
  ])

  assert.equal(race.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(race.filter((result) => result.status === 'rejected').length, 1)
  const racedSession = store.sessions[0]!
  assert.equal(racedSession.endedAt !== null && racedSession.cancelledAt !== null, false)

  if (racedSession.endedAt !== null) {
    const next = await services.sessions.startTask(student, task.id)
    await services.sessions.cancel(student, next.id)
  }
  const restartRace = await Promise.all([
    services.sessions.startTask(student, task.id),
    services.sessions.startTask(student, task.id),
  ])
  assert.equal(restartRace[0]?.id, restartRace[1]?.id)
  assert.equal(store.sessions.filter((session) =>
    session.endedAt === null && session.cancelledAt === null).length, 1)
})

test('concurrent cancel with start or switch cannot leave duplicate live sessions', async () => {
  const store = createStore()
  store.findTaskById = async (profileId, id) => {
    if (profileId !== profile.id) return null
    return id === task.id ? task : id === secondTask.id ? secondTask : null
  }
  const times = [
    new Date('2026-09-03T20:00:00.000Z'),
    new Date('2026-09-04T08:00:00.000Z'),
    new Date('2026-09-04T08:00:00.000Z'),
    new Date('2026-09-04T09:00:00.000Z'),
    new Date('2026-09-04T09:01:00.000Z'),
    new Date('2026-09-04T09:01:00.000Z'),
    new Date('2026-09-04T09:02:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift()!)
  const first = await services.sessions.startTask(student, task.id)

  await Promise.all([
    services.sessions.cancel(student, first.id),
    services.sessions.startTask(student, task.id),
  ])
  let active = await services.sessions.active(student)
  assert.notEqual(active?.id, first.id)
  assert.equal(store.sessions.filter((session) =>
    session.endedAt === null && session.cancelledAt === null).length, 1)

  const results = await Promise.allSettled([
    services.sessions.cancel(student, active!.id),
    services.sessions.switchTask(student, secondTask.id, 'CANCEL'),
  ])
  assert.equal(results.some((result) => result.status === 'fulfilled'), true)
  active = await services.sessions.active(student)
  assert.equal(active?.dailyTaskId, secondTask.id)
  assert.equal(store.sessions.filter((session) =>
    session.endedAt === null && session.cancelledAt === null).length, 1)
})

test('finished sessions accept optional raw ratings without changing task state or provenance', async () => {
  const store = createStore()
  const times = [new Date('2026-09-03T08:00:00.000Z'), timestamp]
  const services = createStudyTrackingServices(store, () => times.shift()!)
  const active = await services.sessions.startTask(student, task.id)

  const finished = await services.sessions.finish(student, active.id, {
    focusRating: 4,
    notes: 'مرور فصل سوم',
    studyQualityRating: 5,
  })

  assert.equal(finished.focusRating, 4)
  assert.equal(finished.studyQualityRating, 5)
  assert.equal(finished.notes, 'مرور فصل سوم')
  assert.equal(finished.durationMinutes, 60)
  assert.equal(task.status, 'PENDING')
  assert.equal(task.studentProfileId, profile.id)
})

test('manual completed sessions support valid optional ratings and serialize absent feedback as null', async () => {
  const store = createStore()
  const services = createStudyTrackingServices(store)
  const rated = await services.sessions.createForTask(student, task.id, {
    endedAt: '2026-09-03T08:45:00.000Z',
    focusRating: 3,
    notes: null,
    startedAt: '2026-09-03T08:00:00.000Z',
    studyQualityRating: 4,
  })
  const unrated = await services.sessions.createForTask(student, task.id, {
    endedAt: '2026-09-03T09:45:00.000Z',
    notes: null,
    startedAt: '2026-09-03T09:00:00.000Z',
  })

  assert.deepEqual([rated.focusRating, rated.studyQualityRating], [3, 4])
  assert.deepEqual([unrated.focusRating, unrated.studyQualityRating], [null, null])
})

test('feedback can be added, changed, and cleared only on an owned finished session', async () => {
  const store = createStore()
  const times = [new Date('2026-09-03T08:00:00.000Z'), timestamp]
  const services = createStudyTrackingServices(store, () => times.shift()!)
  const active = await services.sessions.startTask(student, task.id)

  await assert.rejects(
    services.sessions.updateFeedback(student, active.id, { focusRating: 3 }),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_NOT_FINISHED',
  )

  const finished = await services.sessions.finish(student, active.id, {})
  const added = await services.sessions.updateFeedback(student, finished.id, { focusRating: 2 })
  const changed = await services.sessions.updateFeedback(student, finished.id, {
    focusRating: 5,
    studyQualityRating: 4,
  })
  const cleared = await services.sessions.updateFeedback(student, finished.id, {
    focusRating: null,
    studyQualityRating: null,
  })

  assert.equal(added.focusRating, 2)
  assert.deepEqual([changed.focusRating, changed.studyQualityRating], [5, 4])
  assert.deepEqual([cleared.focusRating, cleared.studyQualityRating], [null, null])

  const cancelledStore = createStore()
  const cancelledServices = createStudyTrackingServices(cancelledStore, () => timestamp)
  const cancelledActive = await cancelledServices.sessions.startTask(student, task.id)
  await cancelledServices.sessions.cancel(student, cancelledActive.id)
  await assert.rejects(
    cancelledServices.sessions.updateFeedback(student, cancelledActive.id, { focusRating: 3 }),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_ALREADY_CANCELLED',
  )
  await assert.rejects(
    services.sessions.updateFeedback(student, 'foreign-session', { focusRating: 3 }),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_NOT_FOUND',
  )
})

test('timer transitions preserve multiple pauses and finish while paused with server-owned time', async () => {
  const store = createStore()
  let clock = new Date('2026-09-03T09:00:00.000Z')
  const services = createStudyTrackingServices(store, () => clock)

  const started = await services.sessions.startTask(student, task.id)
  assert.equal(started.isTimerManaged, true)
  assert.equal(started.timerState, 'RUNNING')
  assert.equal(started.activeElapsedMs, 0)
  assert.deepEqual(started.serverNow, clock)

  clock = new Date('2026-09-03T09:20:00.000Z')
  const [paused, duplicatePause] = await Promise.all([
    services.sessions.pause(student, started.id, {
      expectedUpdatedAt: started.updatedAt.toISOString(),
    }),
    services.sessions.pause(student, started.id, {
      expectedUpdatedAt: started.updatedAt.toISOString(),
    }),
  ])
  assert.equal(paused.timerState, 'PAUSED')
  assert.deepEqual(paused.pausedAt, clock)
  assert.equal(paused.activeElapsedMs, 1_200_000)
  assert.equal(duplicatePause.timerState, 'PAUSED')
  assert.equal(store.pauses.length, 1)

  clock = new Date('2026-09-03T09:30:00.000Z')
  const resumed = await services.sessions.resume(student, started.id, {
    expectedUpdatedAt: paused.updatedAt.toISOString(),
  })
  assert.equal(resumed.timerState, 'RUNNING')
  assert.equal(resumed.pausedAt, null)
  assert.equal(resumed.activeElapsedMs, 1_200_000)

  clock = new Date('2026-09-03T09:50:00.000Z')
  const pausedAgain = await services.sessions.pause(student, started.id, {
    expectedUpdatedAt: resumed.updatedAt.toISOString(),
  })
  assert.equal(store.pauses.length, 2)

  clock = new Date('2026-09-03T10:00:00.000Z')
  const finished = await services.sessions.finish(student, started.id, {})
  assert.equal(finished.timerState, 'FINISHED')
  assert.equal(finished.activeElapsedMs, 2_400_000)
  assert.equal(finished.durationMinutes, 40)
  assert.equal(store.pauses[1]?.resumedAt, null)
  assert.equal(task.status, 'PENDING')

  await assert.rejects(
    services.sessions.resume(student, started.id, {
      expectedUpdatedAt: pausedAgain.updatedAt.toISOString(),
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_ALREADY_FINISHED',
  )
})

test('stale timer transitions cannot change a newer state and duplicate resume is safe', async () => {
  const store = createStore()
  let clock = new Date('2026-09-03T09:00:00.000Z')
  const services = createStudyTrackingServices(store, () => clock)
  const started = await services.sessions.startTask(student, task.id)

  clock = new Date('2026-09-03T09:10:00.000Z')
  const paused = await services.sessions.pause(student, started.id, {
    expectedUpdatedAt: started.updatedAt.toISOString(),
  })
  clock = new Date('2026-09-03T09:15:00.000Z')
  const resumed = await services.sessions.resume(student, started.id, {
    expectedUpdatedAt: paused.updatedAt.toISOString(),
  })
  const duplicateResume = await services.sessions.resume(student, started.id, {
    expectedUpdatedAt: paused.updatedAt.toISOString(),
  })
  assert.equal(duplicateResume.timerState, 'RUNNING')

  clock = new Date('2026-09-03T09:20:00.000Z')
  await assert.rejects(
    services.sessions.pause(student, started.id, {
      expectedUpdatedAt: started.updatedAt.toISOString(),
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'SESSION_STATE_STALE',
  )
  assert.equal((await services.sessions.active(student))?.timerState, 'RUNNING')
  assert.deepEqual((await services.sessions.active(student))?.updatedAt, resumed.updatedAt)
})

test('switching away from a paused task preserves paused accounting and starts one managed session', async () => {
  const store = createStore()
  store.findTaskById = async (profileId, id) => {
    if (profileId !== profile.id) return null
    return id === task.id ? task : id === secondTask.id ? secondTask : null
  }
  const times = [
    new Date('2026-09-03T09:00:00.000Z'),
    new Date('2026-09-03T09:20:00.000Z'),
    new Date('2026-09-03T09:45:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift()!)
  const started = await services.sessions.startTask(student, task.id)
  await services.sessions.pause(student, started.id, {
    expectedUpdatedAt: started.updatedAt.toISOString(),
  })

  const switched = await services.sessions.switchTask(student, secondTask.id)

  assert.equal(switched.finishedSession?.timerState, 'FINISHED')
  assert.equal(switched.finishedSession?.activeElapsedMs, 1_200_000)
  assert.equal(switched.finishedSession?.durationMinutes, 20)
  assert.equal(switched.activeSession.timerState, 'RUNNING')
  assert.equal(switched.activeSession.isTimerManaged, true)
  assert.equal(store.sessions.filter((session) =>
    session.endedAt === null && session.cancelledAt === null).length, 1)
  assert.equal(task.status, 'PENDING')
  assert.equal(secondTask.status, 'PENDING')
})

test('pausing a legacy active session adopts timer management while ordinary finish does not', async () => {
  const legacy: StudySessionRecord = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T08:00:00.000Z'),
    dailyTaskId: task.id,
    endedAt: null,
    focusRating: null,
    id: 'legacy-active',
    isTimerManaged: false,
    notes: null,
    startedAt: new Date('2026-09-03T08:00:00.000Z'),
    studentProfileId: profile.id,
    studyQualityRating: null,
    subjectId: subject.id,
    updatedAt: new Date('2026-09-03T08:00:00.000Z'),
  }
  const pausedStore = createStore()
  pausedStore.sessions.push({ ...legacy })
  const pausedServices = createStudyTrackingServices(pausedStore, () => timestamp)
  const paused = await pausedServices.sessions.pause(student, legacy.id, {
    expectedUpdatedAt: legacy.updatedAt.toISOString(),
  })
  assert.equal(paused.isTimerManaged, true)

  const finishedStore = createStore()
  finishedStore.sessions.push({ ...legacy, id: 'legacy-finished-directly' })
  const finishedServices = createStudyTrackingServices(finishedStore, () => timestamp)
  const finished = await finishedServices.sessions.finish(student, 'legacy-finished-directly', {})
  assert.equal(finished.isTimerManaged, false)
})

test('finished timer-managed lifecycle timestamps cannot be edited while legacy history remains editable', async () => {
  const store = createStore()
  const times = [
    new Date('2026-09-03T08:00:00.000Z'),
    new Date('2026-09-03T09:00:00.000Z'),
  ]
  const services = createStudyTrackingServices(store, () => times.shift() ?? timestamp)
  const active = await services.sessions.startTask(student, task.id)
  const finished = await services.sessions.finish(student, active.id, {})

  await assert.rejects(
    services.sessions.update(student, finished.id, {
      endedAt: '2026-09-03T09:30:00.000Z',
    }),
    (error: unknown) => error instanceof ApiError
      && error.code === 'SESSION_TIMER_MANAGED_UPDATE_FORBIDDEN',
  )

  const legacyStore = createStore()
  legacyStore.sessions.push({
    ...store.sessions[0]!,
    id: 'legacy-finished-editable',
    isTimerManaged: false,
  })
  const legacyServices = createStudyTrackingServices(legacyStore, () => timestamp)
  const edited = await legacyServices.sessions.update(student, 'legacy-finished-editable', {
    endedAt: '2026-09-03T09:30:00.000Z',
  })
  assert.deepEqual(edited.endedAt, new Date('2026-09-03T09:30:00.000Z'))
})
