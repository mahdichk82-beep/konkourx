import type { PrismaClient } from '../generated/prisma/client.js'
import { calculateStudySessionActiveElapsedMs } from '../study-tracking/duration.js'
import type { CounselorTaskStore } from './store.js'
import { assertStudentTrackAtWrite } from '../task-domain/validation.js'

const lockStudentProfileSql =
  'SELECT "id" FROM "student_profiles" WHERE "id" = $1::uuid FOR UPDATE'

const assignedStudentWhere = (counselorUserId: string, studentProfileId: string) => ({
  id: studentProfileId,
  user: {
    studentRelationships: {
      some: { counselorId: counselorUserId, status: 'ACTIVE' as const },
    },
  },
})

export const createPrismaCounselorTaskStore = (
  prisma: PrismaClient,
): CounselorTaskStore => ({
  async findAssignedStudentTrack(counselorUserId, studentProfileId) {
    const student = await prisma.studentProfile.findFirst({
      select: { track: true },
      where: assignedStudentWhere(counselorUserId, studentProfileId),
    })
    return student ? { ok: true, value: student.track } : { ok: false, reason: 'STUDENT_NOT_FOUND' }
  },
  async listAssignedStudentTasks(counselorUserId, studentProfileId, query) {
    return prisma.$transaction(async (transaction) => {
      const student = await transaction.studentProfile.findFirst({
        select: { id: true },
        where: assignedStudentWhere(counselorUserId, studentProfileId),
      })
      if (!student) return { ok: false, reason: 'STUDENT_NOT_FOUND' as const }

      const tasks = await transaction.dailyTask.findMany({
        cursor: query.cursor ? { id: query.cursor } : undefined,
        orderBy: [{ scheduledFor: 'desc' }, { createdAt: 'desc' }],
        select: {
          completedAt: true,
          partialAt: true,
          createdAt: true,
          description: true,
          contentType: true,
          endMinuteOfDay: true,
          estimatedMinutes: true,
          id: true,
          plannedTestCount: true,
          assessmentAttempts: {
            select: { id: true },
            take: 1,
            where: { invalidatedAt: null },
          },
          scheduledFor: true,
          skipReason: true,
          skippedAt: true,
          source: true,
          startMinuteOfDay: true,
          status: true,
          studySessions: {
            select: {
              cancelledAt: true,
              endedAt: true,
              pauses: { select: { pausedAt: true, resumedAt: true } },
              startedAt: true,
            },
          },
          studentProfileId: true,
          studyPlanId: true,
          subjectId: true,
          title: true,
          topicId: true,
          updatedAt: true,
          curriculumTargets: {
            orderBy: { position: 'asc' },
            include: { items: { orderBy: { position: 'asc' } } },
          },
        },
        skip: query.cursor ? 1 : undefined,
        take: (query.limit ?? 50) + 1,
        where: {
          ...(query.scheduledFrom && query.scheduledTo
            ? { scheduledFor: { gte: query.scheduledFrom, lte: query.scheduledTo } }
            : {}),
          studentProfileId,
        },
      })
      return {
        ok: true,
        value: tasks.map(({ assessmentAttempts, studySessions, ...task }) => {
          const completedSessions = studySessions.filter(
            (session) => session.cancelledAt === null && session.endedAt !== null,
          )
          return {
            ...task,
            completedStudySessionCount: completedSessions.length,
            hasActiveStudySession: studySessions.some(
              (session) => session.cancelledAt === null && session.endedAt === null,
            ),
            hasValidAssessmentAttempt: assessmentAttempts.length > 0,
            recordedMinutes: completedSessions.reduce(
              (total, session) => total + Math.round(
                calculateStudySessionActiveElapsedMs(session, session.endedAt!) / 60_000,
              ),
              0,
            ),
            studySessionCount: studySessions.length,
          }
        }),
      }
    })
  },

  async listAssignedStudentSubjects(counselorUserId, studentProfileId, query) {
    return prisma.$transaction(async (transaction) => {
      const student = await transaction.studentProfile.findFirst({
        select: { id: true },
        where: assignedStudentWhere(counselorUserId, studentProfileId),
      })
      if (!student) return { ok: false, reason: 'STUDENT_NOT_FOUND' as const }

      const subjects = await transaction.studySubject.findMany({
        cursor: query.cursor ? { id: query.cursor } : undefined,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true },
        skip: query.cursor ? 1 : undefined,
        take: (query.limit ?? 50) + 1,
        where: { archivedAt: null, studentProfileId },
      })
      return { ok: true, value: subjects }
    })
  },

  async listAssignedStudentTopics(
    counselorUserId,
    studentProfileId,
    subjectId,
    query,
  ) {
    return prisma.$transaction(async (transaction) => {
      const student = await transaction.studentProfile.findFirst({
        select: { id: true },
        where: assignedStudentWhere(counselorUserId, studentProfileId),
      })
      if (!student) return { ok: false, reason: 'STUDENT_NOT_FOUND' as const }

      const subject = await transaction.studySubject.findFirst({
        select: { id: true },
        where: { archivedAt: null, id: subjectId, studentProfileId },
      })
      if (!subject) return { ok: false, reason: 'SUBJECT_NOT_FOUND' as const }

      const topics = await transaction.topic.findMany({
        cursor: query.cursor ? { id: query.cursor } : undefined,
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        select: { id: true, subjectId: true, title: true },
        skip: query.cursor ? 1 : undefined,
        take: (query.limit ?? 50) + 1,
        where: { archivedAt: null, subjectId },
      })
      return { ok: true, value: topics }
    })
  },

  async createAssignedStudentTask(counselorUserId, studentProfileId, input, curriculumTargets = [], expectedTrack) {
    return prisma.$transaction(async (transaction) => {
      const student = await transaction.studentProfile.findFirst({
        select: { id: true },
        where: assignedStudentWhere(counselorUserId, studentProfileId),
      })
      if (!student) return { ok: false, reason: 'STUDENT_NOT_FOUND' as const }
      if (curriculumTargets.length > 0) {
        await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
        const profile = await transaction.studentProfile.findUnique({
          select: { track: true }, where: { id: studentProfileId },
        })
        assertStudentTrackAtWrite(profile?.track, expectedTrack)
      }

      if (input.subjectId) {
        const subject = await transaction.studySubject.findFirst({
          where: { id: input.subjectId, studentProfileId },
        })
        if (!subject) return { ok: false, reason: 'SUBJECT_NOT_FOUND' as const }
        if (subject.archivedAt) {
          return { ok: false, reason: 'SUBJECT_ARCHIVED' as const }
        }
      }

      if (input.topicId) {
        if (!input.subjectId) {
          return { ok: false, reason: 'TOPIC_SUBJECT_REQUIRED' as const }
        }
        const topic = await transaction.topic.findFirst({
          where: { id: input.topicId, subject: { studentProfileId } },
        })
        if (!topic) return { ok: false, reason: 'TOPIC_NOT_FOUND' as const }
        if (topic.subjectId !== input.subjectId) {
          return { ok: false, reason: 'TOPIC_SUBJECT_MISMATCH' as const }
        }
        if (topic.archivedAt) {
          return { ok: false, reason: 'TOPIC_ARCHIVED' as const }
        }
      }

      const task = await transaction.dailyTask.create({ data: input })
      for (const target of curriculumTargets) {
        await transaction.dailyTaskCurriculumTarget.create({ data: {
          curriculumRefId: target.curriculumRefId,
          dailyTaskId: task.id,
          labelSnapshot: target.labelSnapshot,
          pathSnapshot: target.pathSnapshot,
          position: target.position,
          referenceKind: target.referenceKind,
          representationIdSnapshot: target.representationIdSnapshot,
          selectionMode: target.selectionMode,
          items: { create: target.items.map((item) => ({
            curriculumRefId: item.curriculumRefId,
            dailyTaskId: task.id,
            labelSnapshot: item.labelSnapshot,
            pathSnapshot: item.pathSnapshot,
            position: item.position,
            referenceKind: item.referenceKind,
          })) },
        } })
      }
      const value = curriculumTargets.length === 0
        ? { ...task, curriculumTargets: [] }
        : await transaction.dailyTask.findUniqueOrThrow({
            include: { curriculumTargets: { orderBy: { position: 'asc' }, include: { items: { orderBy: { position: 'asc' } } } } },
            where: { id: task.id },
          })
      return { ok: true, value }
    })
  },

  async createAssignedStudentTasksBatch(counselorUserId, studentProfileId, inputs, curriculumTargetsByTask = [], expectedTrack) {
    return prisma.$transaction(async (transaction) => {
      const counselor = await transaction.counselorProfile.findUnique({
        select: { id: true },
        where: { userId: counselorUserId },
      })
      if (!counselor) {
        return { ok: false, reason: 'COUNSELOR_PROFILE_NOT_FOUND' as const }
      }

      const student = await transaction.studentProfile.findFirst({
        select: { id: true },
        where: assignedStudentWhere(counselorUserId, studentProfileId),
      })
      if (!student) return { ok: false, reason: 'STUDENT_NOT_FOUND' as const }
      if (curriculumTargetsByTask.some((targets) => targets.length > 0)) {
        await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
        const profile = await transaction.studentProfile.findUnique({
          select: { track: true }, where: { id: studentProfileId },
        })
        assertStudentTrackAtWrite(profile?.track, expectedTrack)
      }

      for (const input of inputs) {
        if (input.subjectId) {
          const subject = await transaction.studySubject.findFirst({
            where: { id: input.subjectId, studentProfileId },
          })
          if (!subject) return { ok: false, reason: 'SUBJECT_NOT_FOUND' as const }
          if (subject.archivedAt) {
            return { ok: false, reason: 'SUBJECT_ARCHIVED' as const }
          }
        }

        if (input.topicId) {
          if (!input.subjectId) {
            return { ok: false, reason: 'TOPIC_SUBJECT_REQUIRED' as const }
          }
          const topic = await transaction.topic.findFirst({
            where: { id: input.topicId, subject: { studentProfileId } },
          })
          if (!topic) return { ok: false, reason: 'TOPIC_NOT_FOUND' as const }
          if (topic.subjectId !== input.subjectId) {
            return { ok: false, reason: 'TOPIC_SUBJECT_MISMATCH' as const }
          }
          if (topic.archivedAt) {
            return { ok: false, reason: 'TOPIC_ARCHIVED' as const }
          }
        }
      }

      if (curriculumTargetsByTask.every((targets) => targets.length === 0)) {
        const tasks = await transaction.dailyTask.createManyAndReturn({ data: inputs })
        return { ok: true, value: tasks.map((task) => ({ ...task, curriculumTargets: [] })) }
      }

      const tasks = []
      for (const [inputIndex, input] of inputs.entries()) {
        const task = await transaction.dailyTask.create({ data: input })
        for (const target of curriculumTargetsByTask[inputIndex] ?? []) {
          await transaction.dailyTaskCurriculumTarget.create({ data: {
            curriculumRefId: target.curriculumRefId,
            dailyTaskId: task.id,
            labelSnapshot: target.labelSnapshot,
            pathSnapshot: target.pathSnapshot,
            position: target.position,
            referenceKind: target.referenceKind,
            representationIdSnapshot: target.representationIdSnapshot,
            selectionMode: target.selectionMode,
            items: { create: target.items.map((item) => ({
              curriculumRefId: item.curriculumRefId,
              dailyTaskId: task.id,
              labelSnapshot: item.labelSnapshot,
              pathSnapshot: item.pathSnapshot,
              position: item.position,
              referenceKind: item.referenceKind,
            })) },
          } })
        }
        tasks.push(await transaction.dailyTask.findUniqueOrThrow({
          include: { curriculumTargets: { orderBy: { position: 'asc' }, include: { items: { orderBy: { position: 'asc' } } } } },
          where: { id: task.id },
        }))
      }
      return { ok: true, value: tasks }
    })
  },

  async rescheduleAssignedStudentTask(
    counselorUserId,
    studentProfileId,
    taskId,
    patch,
  ) {
    return prisma.$transaction(async (transaction) => {
      const student = await transaction.studentProfile.findFirst({
        select: { id: true },
        where: assignedStudentWhere(counselorUserId, studentProfileId),
      })
      if (!student) return { ok: false, reason: 'STUDENT_NOT_FOUND' as const }

      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)

      const current = await transaction.dailyTask.findFirst({
        where: { id: taskId, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      if (current.source !== 'COUNSELOR') {
        return { ok: false, reason: 'TASK_SOURCE_FORBIDDEN' as const }
      }

      const updated = await transaction.dailyTask.updateMany({
        data: patch,
        where: {
          id: taskId,
          source: 'COUNSELOR',
          studentProfileId,
          assessmentAttempts: { none: { invalidatedAt: null } },
          curriculumItems: { none: { completedAt: { not: null } } },
          studySessions: { none: { cancelledAt: null } },
        },
      })
      if (updated.count !== 1) {
        return { ok: false, reason: 'TASK_EXECUTED' as const }
      }

      const task = await transaction.dailyTask.findFirst({
        include: { curriculumTargets: { orderBy: { position: 'asc' }, include: { items: { orderBy: { position: 'asc' } } } } },
        where: { id: taskId, studentProfileId },
      })
      if (!task) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      return { ok: true, value: task }
    })
  },

  async replaceAssignedTaskCurriculumTargets(counselorUserId, studentProfileId, taskId, targets, expectedTrack) {
    return prisma.$transaction(async (transaction) => {
      const student = await transaction.studentProfile.findFirst({
        select: { id: true },
        where: assignedStudentWhere(counselorUserId, studentProfileId),
      })
      if (!student) return { ok: false, reason: 'STUDENT_NOT_FOUND' as const }
      await transaction.$queryRawUnsafe(lockStudentProfileSql, studentProfileId)
      if (targets.length > 0) {
        const profile = await transaction.studentProfile.findUnique({
          select: { track: true }, where: { id: studentProfileId },
        })
        assertStudentTrackAtWrite(profile?.track, expectedTrack)
      }
      const current = await transaction.dailyTask.findFirst({
        include: { curriculumItems: { select: { completedAt: true } } },
        where: { id: taskId, studentProfileId },
      })
      if (!current) return { ok: false, reason: 'TASK_NOT_FOUND' as const }
      if (current.source !== 'COUNSELOR') return { ok: false, reason: 'TASK_SOURCE_FORBIDDEN' as const }
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
      await transaction.dailyTaskCurriculumTarget.deleteMany({ where: { dailyTaskId: taskId } })
      for (const target of targets) {
        await transaction.dailyTaskCurriculumTarget.create({ data: {
          curriculumRefId: target.curriculumRefId,
          dailyTaskId: taskId,
          labelSnapshot: target.labelSnapshot,
          pathSnapshot: target.pathSnapshot,
          position: target.position,
          referenceKind: target.referenceKind,
          representationIdSnapshot: target.representationIdSnapshot,
          selectionMode: target.selectionMode,
          items: { create: target.items.map((item) => ({
            curriculumRefId: item.curriculumRefId,
            dailyTaskId: taskId,
            labelSnapshot: item.labelSnapshot,
            pathSnapshot: item.pathSnapshot,
            position: item.position,
            referenceKind: item.referenceKind,
          })) },
        } })
      }
      const value = await transaction.dailyTask.findUniqueOrThrow({
        include: { curriculumTargets: { orderBy: { position: 'asc' }, include: { items: { orderBy: { position: 'asc' } } } } },
        where: { id: taskId },
      })
      return { ok: true, value }
    })
  },
})
