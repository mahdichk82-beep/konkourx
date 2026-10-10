import type { PrismaClient } from '../generated/prisma/client.js'
import type { StudentCoreStore } from './store.js'
import { assertStudentTrackAtWrite } from '../task-domain/validation.js'
import type {
  DailyTaskStatus,
  StudyPlanStatus,
} from './types.js'

const lockStudentProfileSql =
  'SELECT "id" FROM "student_profiles" WHERE "id" = $1::uuid FOR UPDATE'

const curriculumInclude = {
  curriculumTargets: {
    orderBy: { position: 'asc' as const },
    include: { items: { orderBy: { position: 'asc' as const } } },
  },
}

export const createPrismaStudentCoreStore = (prisma: PrismaClient): StudentCoreStore => ({
  async findStudentProfileByUserId(userId) {
    return prisma.studentProfile.findUnique({
      select: { id: true, userId: true, track: true },
      where: { userId },
    })
  },

  async listSubjects(studentProfileId, query) {
    return prisma.studySubject.findMany({
      cursor: query?.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: query?.cursor ? 1 : undefined,
      take: query?.limit ? query.limit + 1 : undefined,
      where: { studentProfileId },
    })
  },

  async findSubjectById(studentProfileId, id) {
    return prisma.studySubject.findFirst({ where: { id, studentProfileId } })
  },

  async createSubject(input) {
    return prisma.studySubject.create({ data: input })
  },

  async updateSubject(studentProfileId, id, input) {
    const result = await prisma.studySubject.updateMany({
      data: input,
      where: { id, studentProfileId },
    })
    if (result.count !== 1) return null
    return prisma.studySubject.findFirst({ where: { id, studentProfileId } })
  },

  async listTopics(studentProfileId, subjectId, query) {
    return prisma.topic.findMany({
      cursor: query?.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: query?.cursor ? 1 : undefined,
      take: query?.limit ? query.limit + 1 : undefined,
      where: { subjectId, subject: { studentProfileId } },
    })
  },

  async findTopicById(studentProfileId, id) {
    return prisma.topic.findFirst({
      where: { id, subject: { studentProfileId } },
    })
  },

  async createTopic(input) {
    return prisma.topic.create({ data: input })
  },

  async updateTopic(studentProfileId, id, input) {
    const result = await prisma.topic.updateMany({
      data: input,
      where: { id, subject: { studentProfileId } },
    })
    if (result.count !== 1) return null
    return prisma.topic.findFirst({
      where: { id, subject: { studentProfileId } },
    })
  },

  async listPlans(studentProfileId, query) {
    return prisma.studyPlan.findMany({
      cursor: query?.cursor ? { id: query.cursor } : undefined,
      orderBy: { startsOn: 'desc' },
      skip: query?.cursor ? 1 : undefined,
      take: query?.limit ? query.limit + 1 : undefined,
      where: { studentProfileId, status: query?.status },
    })
  },

  async findPlanById(studentProfileId, id) {
    return prisma.studyPlan.findFirst({ where: { id, studentProfileId } })
  },

  async createPlan(input) {
    return prisma.studyPlan.create({ data: input })
  },

  async updatePlan(studentProfileId, id, input) {
    const result = await prisma.studyPlan.updateMany({
      data: input,
      where: { id, studentProfileId },
    })
    if (result.count !== 1) return null
    return prisma.studyPlan.findFirst({ where: { id, studentProfileId } })
  },

  async listTasks(studentProfileId, query) {
    const baseWhere = {
      scheduledFor: query?.scheduledBefore
        ? { lt: query.scheduledBefore }
        : query?.scheduledFor ?? (
            query?.scheduledFrom || query?.scheduledTo
              ? { gte: query.scheduledFrom, lte: query.scheduledTo }
              : undefined
          ),
      status: query?.scheduledBefore ? 'PENDING' as const : query?.status,
      studentProfileId,
      studyPlanId: query?.studyPlanId,
      subjectId: query?.subjectId,
    }
    const overdueBoundary = query?.overdueCursor
      ? {
          OR: [
            { scheduledFor: { lt: query.overdueCursor.scheduledFor } },
            {
              createdAt: { lt: query.overdueCursor.createdAt },
              scheduledFor: query.overdueCursor.scheduledFor,
            },
            {
              createdAt: query.overdueCursor.createdAt,
              id: { lt: query.overdueCursor.id },
              scheduledFor: query.overdueCursor.scheduledFor,
            },
          ],
        }
      : undefined
    return prisma.dailyTask.findMany({
      include: curriculumInclude,
      cursor: !query?.scheduledBefore && query?.cursor ? { id: query.cursor } : undefined,
      orderBy: query?.scheduledBefore
        ? [{ scheduledFor: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
        : [{ scheduledFor: 'desc' }, { createdAt: 'desc' }],
      skip: !query?.scheduledBefore && query?.cursor ? 1 : undefined,
      take: query?.limit ? query.limit + 1 : undefined,
      where: overdueBoundary ? { AND: [baseWhere, overdueBoundary] } : baseWhere,
    })
  },

  async findTaskById(studentProfileId, id) {
    return prisma.dailyTask.findFirst({ include: curriculumInclude, where: { id, studentProfileId } })
  },

  async createTask(input, curriculumTargets = [], expectedTrack) {
    return prisma.$transaction(async (transaction) => {
      if (curriculumTargets.length > 0) {
        await transaction.$queryRawUnsafe(lockStudentProfileSql, input.studentProfileId)
        const profile = await transaction.studentProfile.findUnique({
          select: { track: true }, where: { id: input.studentProfileId },
        })
        assertStudentTrackAtWrite(profile?.track, expectedTrack)
      }
      const task = await transaction.dailyTask.create({ data: input })
      for (const target of curriculumTargets) {
        await transaction.dailyTaskCurriculumTarget.create({
          data: {
            curriculumRefId: target.curriculumRefId,
            dailyTaskId: task.id,
            labelSnapshot: target.labelSnapshot,
            pathSnapshot: target.pathSnapshot,
            position: target.position,
            referenceKind: target.referenceKind,
            representationIdSnapshot: target.representationIdSnapshot,
            selectionMode: target.selectionMode,
            items: {
              create: target.items.map((item) => ({
                curriculumRefId: item.curriculumRefId,
                dailyTaskId: task.id,
                labelSnapshot: item.labelSnapshot,
                pathSnapshot: item.pathSnapshot,
                position: item.position,
                referenceKind: item.referenceKind,
              })),
            },
          },
        })
      }
      return transaction.dailyTask.findUniqueOrThrow({ include: curriculumInclude, where: { id: task.id } })
    })
  },

  async updateTask(studentProfileId, id, input) {
    const result = await prisma.dailyTask.updateMany({
      data: input,
      where: { id, studentProfileId },
    })
    if (result.count !== 1) return null
    return prisma.dailyTask.findFirst({ include: curriculumInclude, where: { id, studentProfileId } })
  },

  async updateTerminalTask(studentProfileId, id, input) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      const current = await transaction.dailyTask.findFirst({
        select: { id: true },
        where: { id, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'TASK_NOT_FOUND' as const }

      const updated = await transaction.dailyTask.updateMany({
        data: input,
        where: {
          id,
          studentProfileId,
          studySessions: { none: { cancelledAt: null, endedAt: null } },
        },
      })
      if (updated.count !== 1) {
        return { ok: false, reason: 'ACTIVE_STUDY_SESSION_EXISTS' as const }
      }
      const task = await transaction.dailyTask.findFirst({
        include: curriculumInclude,
        where: { id, studentProfileId },
      })
      if (!task) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      return { ok: true, value: task }
    })
  },

  async updateTaskProgress(studentProfileId, id, input) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      const current = await transaction.dailyTask.findFirst({
        select: { contentType: true, id: true, status: true },
        where: { id, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      if (current.contentType !== 'STUDY') {
        return { ok: false, reason: 'TASK_PROGRESS_NOT_APPLICABLE' as const }
      }
      if (current.status !== 'PENDING') {
        return { ok: false, reason: 'TASK_TERMINAL' as const }
      }

      const updated = await transaction.dailyTask.updateMany({
        data: { actualSolvedTestCount: input.actualSolvedTestCount },
        where: {
          contentType: 'STUDY',
          id,
          status: 'PENDING',
          studentProfileId,
          updatedAt: input.expectedUpdatedAt,
        },
      })
      if (updated.count !== 1) {
        const latest = await transaction.dailyTask.findFirst({
          select: { contentType: true, id: true, status: true },
          where: { id, studentProfileId },
        })
        if (!latest) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
        if (latest.contentType !== 'STUDY') {
          return { ok: false, reason: 'TASK_PROGRESS_NOT_APPLICABLE' as const }
        }
        if (latest.status !== 'PENDING') {
          return { ok: false, reason: 'TASK_TERMINAL' as const }
        }
        return { ok: false, reason: 'TASK_PROGRESS_STALE' as const }
      }
      const value = await transaction.dailyTask.findFirst({
        include: curriculumInclude,
        where: { id, studentProfileId },
      })
      if (!value) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      return { ok: true, value }
    })
  },

  async reschedulePersonalTask(studentProfileId, id, schedule) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      const current = await transaction.dailyTask.findFirst({
        where: { id, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      if (current.source !== 'PERSONAL') {
        return { ok: false, reason: 'TASK_SOURCE_FORBIDDEN' as const }
      }

      const updated = await transaction.dailyTask.updateMany({
        data: schedule,
        where: {
          id,
          source: 'PERSONAL',
          studentProfileId,
          curriculumItems: { none: { completedAt: { not: null } } },
          assessmentAttempts: { none: { invalidatedAt: null } },
          studySessions: { none: { cancelledAt: null } },
        },
      })
      if (updated.count !== 1) {
        return { ok: false, reason: 'TASK_EXECUTED' as const }
      }

      const task = await transaction.dailyTask.findFirst({
        include: curriculumInclude,
        where: { id, studentProfileId },
      })
      if (!task) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      return { ok: true, value: task }
    })
  },

  async replacePersonalTaskCurriculumTargets(studentProfileId, id, targets, expectedTrack) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      if (targets.length > 0) {
        const profile = await transaction.studentProfile.findUnique({
          select: { track: true }, where: { id: studentProfileId },
        })
        assertStudentTrackAtWrite(profile?.track, expectedTrack)
      }
      const current = await transaction.dailyTask.findFirst({
        include: { curriculumItems: { select: { completedAt: true } } },
        where: { id, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      if (current.source !== 'PERSONAL') return { ok: false, reason: 'TASK_SOURCE_FORBIDDEN' as const }
      if (current.status !== 'PENDING') return { ok: false, reason: 'TASK_NOT_PENDING' as const }
      if (current.contentType === 'GENERAL' && targets.length > 0) {
        return { ok: false, reason: 'TASK_GENERAL_TARGET_FORBIDDEN' as const }
      }
      if (current.contentType === 'STUDY' && targets.length === 0) {
        return { ok: false, reason: 'TASK_STUDY_TARGET_REQUIRED' as const }
      }
      if (current.curriculumItems.some((item) => item.completedAt !== null)) {
        return { ok: false, reason: 'CURRICULUM_EXECUTION_STARTED' as const }
      }
      await transaction.dailyTaskCurriculumTarget.deleteMany({ where: { dailyTaskId: id } })
      for (const target of targets) {
        await transaction.dailyTaskCurriculumTarget.create({
          data: {
            curriculumRefId: target.curriculumRefId,
            dailyTaskId: id,
            labelSnapshot: target.labelSnapshot,
            pathSnapshot: target.pathSnapshot,
            position: target.position,
            referenceKind: target.referenceKind,
            representationIdSnapshot: target.representationIdSnapshot,
            selectionMode: target.selectionMode,
            items: { create: target.items.map((item) => ({
              curriculumRefId: item.curriculumRefId,
              dailyTaskId: id,
              labelSnapshot: item.labelSnapshot,
              pathSnapshot: item.pathSnapshot,
              position: item.position,
              referenceKind: item.referenceKind,
            })) },
          },
        })
      }
      const task = await transaction.dailyTask.findUniqueOrThrow({ include: curriculumInclude, where: { id } })
      return { ok: true, value: task }
    })
  },

  async toggleTaskCurriculumItem(studentProfileId, taskId, itemId, completedAt) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      const task = await transaction.dailyTask.findFirst({ select: { id: true, status: true }, where: { id: taskId, studentProfileId } })
      if (!task) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      if (task.status !== 'PENDING') return { ok: false, reason: 'TASK_NOT_PENDING' as const }
      const updated = await transaction.dailyTaskCurriculumItem.updateMany({
        data: { completedAt },
        where: { dailyTaskId: taskId, id: itemId },
      })
      if (updated.count !== 1) return { ok: false, reason: 'CURRICULUM_ITEM_NOT_FOUND' as const }
      const value = await transaction.dailyTask.findUniqueOrThrow({ include: curriculumInclude, where: { id: taskId } })
      return { ok: true, value }
    })
  },
})

export type { DailyTaskStatus, StudyPlanStatus }
