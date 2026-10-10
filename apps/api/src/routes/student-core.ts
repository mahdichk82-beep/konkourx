import type { FastifyInstance } from 'fastify'
import { requireRoles } from '../auth/rbac.js'
import type { AuthService } from '../auth/auth-service.js'
import { successResponse } from '../contracts/api-response.js'
import { ApiError } from '../errors/api-error.js'
import type { StudentCoreServices } from '../student-core/services.js'
import { authenticateRequest } from '../plugins/authentication.js'
import {
  createPlanSchema,
  createSubjectSchema,
  createTaskSchema,
  createTopicSchema,
  listPlansSchema,
  listSubjectsSchema,
  listTasksSchema,
  listTopicsSchema,
  recordTaskProgressSchema,
  rescheduleTaskSchema,
  subjectIdParamSchema,
  updatePlanSchema,
  updateSubjectSchema,
  updateTaskSchema,
  updateTopicSchema,
  uuidParamSchema,
} from '../schemas/student-core.js'
import {
  replaceCurriculumTargetsSchema,
  taskCurriculumItemParamSchema,
  toggleCurriculumItemSchema,
} from '../schemas/task-curriculum.js'

type StudentCoreRouteOptions = {
  auth: AuthService
  studentCore: StudentCoreServices
}

const parseBody = <T>(result: { success: boolean; data?: T }): T => {
  if (!result.success || result.data === undefined) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed')
  }
  return result.data
}

const parseId = (params: unknown): string => parseBody(uuidParamSchema.safeParse(params)).id

export const registerStudentCoreRoutes = (
  app: FastifyInstance,
  options: StudentCoreRouteOptions,
): void => {
  const studentOnly = {
    preHandler: [authenticateRequest(options.auth), requireRoles('STUDENT')],
  }

  app.get('/student/subjects', studentOnly, async (request) => {
    const query = parseBody(listSubjectsSchema.safeParse(request.query))
    return successResponse(
      await options.studentCore.subjects.list(request.user!, query),
      request.context.requestId,
    )
  })

  app.post('/student/subjects', studentOnly, async (request, reply) => {
    const input = parseBody(createSubjectSchema.safeParse(request.body))
    return reply.status(201).send(
      successResponse(
        await options.studentCore.subjects.create(request.user!, input),
        request.context.requestId,
      ),
    )
  })

  app.get('/student/subjects/:id', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.subjects.get(request.user!, parseId(request.params)),
      request.context.requestId,
    ),
  )

  app.patch('/student/subjects/:id', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.subjects.update(
        request.user!,
        parseId(request.params),
        parseBody(updateSubjectSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.get('/student/subjects/:subjectId/topics', studentOnly, async (request) => {
    const { subjectId } = parseBody(subjectIdParamSchema.safeParse(request.params))
    const query = parseBody(listTopicsSchema.safeParse(request.query))
    return successResponse(
      await options.studentCore.topics.list(request.user!, subjectId, query),
      request.context.requestId,
    )
  })

  app.post('/student/subjects/:subjectId/topics', studentOnly, async (request, reply) => {
    const { subjectId } = parseBody(subjectIdParamSchema.safeParse(request.params))
    const input = parseBody(createTopicSchema.safeParse(request.body))
    return reply.status(201).send(
      successResponse(
        await options.studentCore.topics.create(request.user!, subjectId, input),
        request.context.requestId,
      ),
    )
  })

  app.get('/student/topics/:id', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.topics.get(request.user!, parseId(request.params)),
      request.context.requestId,
    ),
  )

  app.patch('/student/topics/:id', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.topics.update(
        request.user!,
        parseId(request.params),
        parseBody(updateTopicSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.get('/student/study-plans', studentOnly, async (request) => {
    const query = parseBody(listPlansSchema.safeParse(request.query))
    return successResponse(
      await options.studentCore.plans.list(request.user!, query),
      request.context.requestId,
    )
  })

  app.post('/student/study-plans', studentOnly, async (request, reply) => {
    const input = parseBody(createPlanSchema.safeParse(request.body))
    return reply.status(201).send(
      successResponse(
        await options.studentCore.plans.create(request.user!, input),
        request.context.requestId,
      ),
    )
  })

  app.get('/student/study-plans/:id', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.plans.get(request.user!, parseId(request.params)),
      request.context.requestId,
    ),
  )

  app.patch('/student/study-plans/:id', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.plans.update(
        request.user!,
        parseId(request.params),
        parseBody(updatePlanSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.get('/student/daily-tasks', studentOnly, async (request) => {
    const { date, from, to, overdueBefore, ...query } = parseBody(listTasksSchema.safeParse(request.query))
    return successResponse(
      await options.studentCore.tasks.list(request.user!, {
        ...query,
        ...(date === undefined ? {} : { scheduledFor: date }),
        ...(from === undefined ? {} : { scheduledFrom: from }),
        ...(to === undefined ? {} : { scheduledTo: to }),
        ...(overdueBefore === undefined ? {} : { overdueBefore }),
      }),
      request.context.requestId,
    )
  })

  app.post('/student/daily-tasks', studentOnly, async (request, reply) => {
    const input = parseBody(createTaskSchema.safeParse(request.body))
    return reply.status(201).send(
      successResponse(
        await options.studentCore.tasks.create(request.user!, input),
        request.context.requestId,
      ),
    )
  })

  app.get('/student/daily-tasks/:id', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.tasks.get(request.user!, parseId(request.params)),
      request.context.requestId,
    ),
  )

  app.patch('/student/daily-tasks/:id', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.tasks.update(
        request.user!,
        parseId(request.params),
        parseBody(updateTaskSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/daily-tasks/:id/schedule', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.tasks.reschedule(
        request.user!,
        parseId(request.params),
        parseBody(rescheduleTaskSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/daily-tasks/:id/progress', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.tasks.recordProgress(
        request.user!,
        parseId(request.params),
        parseBody(recordTaskProgressSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/daily-tasks/:id/curriculum-targets', studentOnly, async (request) =>
    successResponse(
      await options.studentCore.tasks.replaceCurriculumTargets(
        request.user!,
        parseId(request.params),
        parseBody(replaceCurriculumTargetsSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/daily-tasks/:id/curriculum-items/:itemId', studentOnly, async (request) => {
    const { id, itemId } = parseBody(taskCurriculumItemParamSchema.safeParse(request.params))
    return successResponse(
      await options.studentCore.tasks.toggleCurriculumItem(
        request.user!,
        id,
        itemId,
        parseBody(toggleCurriculumItemSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    )
  })
}
