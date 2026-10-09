import type { Prisma, PrismaClient } from '../generated/prisma/client.js'
import type { StudyTrackingStore } from './store.js'

const lockStudentProfileSql =
  'SELECT "id" FROM "student_profiles" WHERE "id" = $1::uuid FOR UPDATE'

const executableTaskSelect = {
  id: true,
  studentProfileId: true,
  subjectId: true,
  status: true,
  subject: { select: { archivedAt: true } },
} as const

const sessionPauses = {
  pauses: { orderBy: [{ pausedAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.StudySessionInclude

export const createPrismaStudyTrackingStore = (prisma: PrismaClient): StudyTrackingStore => ({
  async findStudentProfileByUserId(userId) {
    return prisma.studentProfile.findUnique({ select: { id: true, userId: true }, where: { userId } })
  },

  async findSubjectById(studentProfileId, id) {
    return prisma.studySubject.findFirst({ select: { id: true, studentProfileId: true, archivedAt: true }, where: { id, studentProfileId } })
  },

  async findTaskById(studentProfileId, id) {
    return prisma.dailyTask.findFirst({ select: { id: true, studentProfileId: true, subjectId: true, status: true }, where: { id, studentProfileId } })
  },

  async listSessions(studentProfileId, query) {
    return prisma.studySession.findMany({
      cursor: query?.cursor ? { id: query.cursor } : undefined,
      orderBy: { startedAt: 'desc' },
      skip: query?.cursor ? 1 : undefined,
      take: query?.limit ? query.limit + 1 : undefined,
      include: sessionPauses,
      where: {
        dailyTaskId: query?.dailyTaskId,
        startedAt: query?.from || query?.to ? { gte: query.from, lte: query.to } : undefined,
        studentProfileId,
        subjectId: query?.subjectId,
      },
    })
  },

  async findActiveSession(studentProfileId) {
    return prisma.studySession.findFirst({
      include: sessionPauses,
      orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
      where: { cancelledAt: null, endedAt: null, studentProfileId },
    })
  },

  async findSessionById(studentProfileId, id) {
    return prisma.studySession.findFirst({ include: sessionPauses, where: { id, studentProfileId } })
  },

  async createSession(input) {
    return prisma.studySession.create({ data: input, include: sessionPauses })
  },

  async updateSession(studentProfileId, id, input) {
    const result = await prisma.studySession.updateMany({
      data: input,
      where: {
        cancelledAt: null,
        endedAt: { not: null },
        id,
        isTimerManaged: false,
        studentProfileId,
      },
    })
    if (result.count !== 1) return null
    return prisma.studySession.findFirst({ include: sessionPauses, where: { id, studentProfileId } })
  },

  async startTaskSession(studentProfileId, taskId, startedAt) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)

      const task = await transaction.dailyTask.findFirst({
        select: executableTaskSelect,
        where: { id: taskId, studentProfileId },
      })
      if (!task) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      if (task.status !== 'PENDING') {
        return { ok: false, reason: 'TASK_NOT_EXECUTABLE' as const }
      }
      if (task.subjectId && !task.subject) {
        return { ok: false, reason: 'SUBJECT_NOT_FOUND' as const }
      }
      if (task.subject?.archivedAt) {
        return { ok: false, reason: 'SUBJECT_ARCHIVED' as const }
      }

      const active = await transaction.studySession.findFirst({
        include: sessionPauses,
        orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
        where: { cancelledAt: null, endedAt: null, studentProfileId },
      })
      if (active) {
        if (active.dailyTaskId === task.id) {
          return { ok: true, value: active, reused: true }
        }
        return { ok: false, reason: 'ACTIVE_STUDY_SESSION_EXISTS' as const }
      }

      const session = await transaction.studySession.create({
        data: {
          cancelledAt: null,
          dailyTaskId: task.id,
          endedAt: null,
          focusRating: null,
          isTimerManaged: true,
          notes: null,
          startedAt,
          studyQualityRating: null,
          studentProfileId,
          subjectId: task.subjectId,
        },
        include: sessionPauses,
      })
      return { ok: true, value: session, reused: false }
    })
  },

  async switchTaskSession(
    studentProfileId,
    taskId,
    transitionAt,
    currentSessionAction = 'FINISH',
  ) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)

      const task = await transaction.dailyTask.findFirst({
        select: executableTaskSelect,
        where: { id: taskId, studentProfileId },
      })
      if (!task) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      if (task.status !== 'PENDING') {
        return { ok: false, reason: 'TASK_NOT_EXECUTABLE' as const }
      }
      if (task.subjectId && !task.subject) {
        return { ok: false, reason: 'SUBJECT_NOT_FOUND' as const }
      }
      if (task.subject?.archivedAt) {
        return { ok: false, reason: 'SUBJECT_ARCHIVED' as const }
      }

      const active = await transaction.studySession.findFirst({
        include: sessionPauses,
        orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
        where: { cancelledAt: null, endedAt: null, studentProfileId },
      })
      if (active?.dailyTaskId === task.id) {
        return {
          ok: true,
          value: {
            activeSession: active,
            cancelledSession: null,
            finishedSession: null,
          },
        }
      }

      let finishedSession = null
      let cancelledSession = null
      if (active) {
        if (currentSessionAction === 'FINISH' && transitionAt <= active.startedAt) {
          return { ok: false, reason: 'SESSION_TIME_INVALID' as const }
        }
        const transitioned = await transaction.studySession.updateMany({
          data: currentSessionAction === 'FINISH'
            ? { endedAt: transitionAt }
            : { cancelledAt: transitionAt },
          where: {
            cancelledAt: null,
            endedAt: null,
            id: active.id,
            ...(currentSessionAction === 'FINISH'
              ? { startedAt: { lt: transitionAt } }
              : {}),
            studentProfileId,
          },
        })
        if (transitioned.count !== 1) {
          return { ok: false, reason: 'LIVE_SESSION_CONFLICT' as const }
        }
        const previousSession = await transaction.studySession.findFirst({
          include: sessionPauses,
          where: { id: active.id, studentProfileId },
        })
        if (!previousSession) {
          return { ok: false, reason: 'LIVE_SESSION_CONFLICT' as const }
        }
        if (currentSessionAction === 'FINISH') finishedSession = previousSession
        else cancelledSession = previousSession
      }

      const nextSession = await transaction.studySession.create({
        data: {
          cancelledAt: null,
          dailyTaskId: task.id,
          endedAt: null,
          focusRating: null,
          isTimerManaged: true,
          notes: null,
          startedAt: transitionAt,
          studyQualityRating: null,
          studentProfileId,
          subjectId: task.subjectId,
        },
        include: sessionPauses,
      })
      return {
        ok: true,
        value: { activeSession: nextSession, cancelledSession, finishedSession },
      }
    })
  },

  async finishSession(studentProfileId, id, endedAt, input) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      const current = await transaction.studySession.findFirst({
        include: sessionPauses,
        where: { id, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'SESSION_NOT_FOUND' as const }
      if (current.endedAt) {
        return { ok: false, reason: 'SESSION_ALREADY_FINISHED' as const }
      }
      if (current.cancelledAt) {
        return { ok: false, reason: 'SESSION_ALREADY_CANCELLED' as const }
      }
      if (endedAt <= current.startedAt) {
        return { ok: false, reason: 'SESSION_TIME_INVALID' as const }
      }
      const updated = await transaction.studySession.updateMany({
        data: {
          endedAt,
          ...(input.focusRating === undefined ? {} : { focusRating: input.focusRating }),
          ...(input.notes === undefined ? {} : { notes: input.notes }),
          ...(input.studyQualityRating === undefined
            ? {}
            : { studyQualityRating: input.studyQualityRating }),
        },
        where: {
          cancelledAt: null,
          endedAt: null,
          id,
          startedAt: { lt: endedAt },
          studentProfileId,
        },
      })
      if (updated.count !== 1) {
        return { ok: false, reason: 'SESSION_ALREADY_FINISHED' as const }
      }
      const session = await transaction.studySession.findFirst({
        include: sessionPauses,
        where: { id, studentProfileId },
      })
      if (!session) return { ok: false, reason: 'SESSION_NOT_FOUND' as const }
      return { ok: true, value: session }
    })
  },

  async pauseSession(studentProfileId, id, pausedAt, expectedUpdatedAt) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      const current = await transaction.studySession.findFirst({
        include: sessionPauses,
        where: { id, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'SESSION_NOT_FOUND' as const }
      if (current.endedAt) {
        return { ok: false, reason: 'SESSION_ALREADY_FINISHED' as const }
      }
      if (current.cancelledAt) {
        return { ok: false, reason: 'SESSION_ALREADY_CANCELLED' as const }
      }
      if (current.pauses.some((pause) => pause.resumedAt === null)) {
        return { ok: true, value: current }
      }
      if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        return { ok: false, reason: 'SESSION_STATE_STALE' as const }
      }
      await transaction.studySessionPause.create({
        data: { pausedAt, studySessionId: id },
      })
      const session = await transaction.studySession.update({
        data: { isTimerManaged: true, updatedAt: pausedAt },
        include: sessionPauses,
        where: { id },
      })
      return { ok: true, value: session }
    })
  },

  async resumeSession(studentProfileId, id, resumedAt, expectedUpdatedAt) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      const current = await transaction.studySession.findFirst({
        include: sessionPauses,
        where: { id, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'SESSION_NOT_FOUND' as const }
      if (current.endedAt) {
        return { ok: false, reason: 'SESSION_ALREADY_FINISHED' as const }
      }
      if (current.cancelledAt) {
        return { ok: false, reason: 'SESSION_ALREADY_CANCELLED' as const }
      }
      const openPause = current.pauses.find((pause) => pause.resumedAt === null)
      if (!openPause) {
        return current.updatedAt.getTime() === expectedUpdatedAt.getTime()
          ? { ok: false, reason: 'SESSION_NOT_PAUSED' as const }
          : { ok: true, value: current }
      }
      if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        return { ok: false, reason: 'SESSION_STATE_STALE' as const }
      }
      const resumed = await transaction.studySessionPause.updateMany({
        data: { resumedAt },
        where: { id: openPause.id, resumedAt: null, studySessionId: id },
      })
      if (resumed.count !== 1) {
        return { ok: false, reason: 'SESSION_STATE_STALE' as const }
      }
      const session = await transaction.studySession.update({
        data: { isTimerManaged: true, updatedAt: resumedAt },
        include: sessionPauses,
        where: { id },
      })
      return { ok: true, value: session }
    })
  },

  async cancelSession(studentProfileId, id, cancelledAt) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      const current = await transaction.studySession.findFirst({
        include: sessionPauses,
        where: { id, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'SESSION_NOT_FOUND' as const }
      if (current.endedAt) {
        return { ok: false, reason: 'SESSION_ALREADY_FINISHED' as const }
      }
      if (current.cancelledAt) {
        return { ok: false, reason: 'SESSION_ALREADY_CANCELLED' as const }
      }
      const updated = await transaction.studySession.updateMany({
        data: { cancelledAt },
        where: { cancelledAt: null, endedAt: null, id, studentProfileId },
      })
      if (updated.count !== 1) {
        return { ok: false, reason: 'SESSION_ALREADY_CANCELLED' as const }
      }
      const session = await transaction.studySession.findFirst({
        include: sessionPauses,
        where: { id, studentProfileId },
      })
      if (!session) return { ok: false, reason: 'SESSION_NOT_FOUND' as const }
      return { ok: true, value: session }
    })
  },

  async updateSessionFeedback(studentProfileId, id, input) {
    return prisma.$transaction(async (transaction) => {
      const current = await transaction.studySession.findFirst({
        include: sessionPauses,
        where: { id, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'SESSION_NOT_FOUND' as const }
      if (current.cancelledAt) {
        return { ok: false, reason: 'SESSION_ALREADY_CANCELLED' as const }
      }
      if (!current.endedAt) {
        return { ok: false, reason: 'SESSION_NOT_FINISHED' as const }
      }
      const updated = await transaction.studySession.updateMany({
        data: input,
        where: {
          cancelledAt: null,
          endedAt: { not: null },
          id,
          studentProfileId,
        },
      })
      if (updated.count !== 1) {
        return { ok: false, reason: 'SESSION_NOT_FINISHED' as const }
      }
      const session = await transaction.studySession.findFirst({
        include: sessionPauses,
        where: { id, studentProfileId },
      })
      if (!session) return { ok: false, reason: 'SESSION_NOT_FOUND' as const }
      return { ok: true, value: session }
    })
  },

  async listGoals(studentProfileId, query) {
    return prisma.studentGoal.findMany({
      cursor: query?.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: query?.cursor ? 1 : undefined,
      take: query?.limit ? query.limit + 1 : undefined,
      where: { status: query?.status, studentProfileId, subjectId: query?.subjectId },
    })
  },

  async findGoalById(studentProfileId, id) {
    return prisma.studentGoal.findFirst({ where: { id, studentProfileId } })
  },

  async createGoal(input) {
    return prisma.studentGoal.create({ data: input })
  },

  async updateGoal(studentProfileId, id, input) {
    const result = await prisma.studentGoal.updateMany({ data: input, where: { id, studentProfileId } })
    if (result.count !== 1) return null
    return prisma.studentGoal.findFirst({ where: { id, studentProfileId } })
  },
})
