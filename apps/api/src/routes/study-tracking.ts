import type { FastifyInstance } from 'fastify'
import type { AuthService } from '../auth/auth-service.js'
import { requireRoles } from '../auth/rbac.js'
import { successResponse } from '../contracts/api-response.js'
import { ApiError } from '../errors/api-error.js'
import { authenticateRequest } from '../plugins/authentication.js'
import {
  cancelStudySessionSchema,
  createStudentGoalSchema,
  createStudySessionSchema,
  createTaskStudySessionSchema,
  finishStudySessionSchema,
  listStudentGoalsSchema,
  listStudySessionsSchema,
  startStudyTaskSchema,
  switchStudyTaskSchema,
  timerTransitionSchema,
  trackingIdParamSchema,
  taskSessionParamSchema,
  updateStudentGoalSchema,
  updateStudySessionFeedbackSchema,
  updateStudySessionSchema,
} from '../schemas/study-tracking.js'
import type { StudyTrackingServices } from '../study-tracking/services.js'

type StudyTrackingRouteOptions = {
  auth: AuthService
  studyTracking: StudyTrackingServices
}

const parseInput = <T>(result: { success: boolean; data?: T }): T => {
  if (!result.success || result.data === undefined) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed')
  }
  return result.data
}

const parseId = (params: unknown): string =>
  parseInput(trackingIdParamSchema.safeParse(params)).id

export const registerStudyTrackingRoutes = (
  app: FastifyInstance,
  options: StudyTrackingRouteOptions,
): void => {
  const studentOnly = {
    preHandler: [authenticateRequest(options.auth), requireRoles('STUDENT')],
  }

  app.get('/student/study-sessions', studentOnly, async (request) => {
    const { from, to, ...query } = parseInput(
      listStudySessionsSchema.safeParse(request.query),
    )

    return successResponse(
      await options.studyTracking.sessions.list(request.user!, {
        ...query,
        ...(from === undefined ? {} : { from: new Date(from) }),
        ...(to === undefined ? {} : { to: new Date(to) }),
      }),
      request.context.requestId,
    )
  })

  app.post('/student/study-sessions', studentOnly, async (request, reply) => {
    const input = parseInput(createStudySessionSchema.safeParse(request.body))
    return reply.status(201).send(
      successResponse(
        await options.studyTracking.sessions.create(request.user!, input),
        request.context.requestId,
      ),
    )
  })

  app.post('/student/daily-tasks/:taskId/sessions', studentOnly, async (request, reply) => {
    const { taskId } = parseInput(taskSessionParamSchema.safeParse(request.params))
    const input = parseInput(createTaskStudySessionSchema.safeParse(request.body))
    return reply.status(201).send(
      successResponse(
        await options.studyTracking.sessions.createForTask(request.user!, taskId, input),
        request.context.requestId,
      ),
    )
  })

  app.post('/student/tasks/:id/start', studentOnly, async (request, reply) => {
    parseInput(startStudyTaskSchema.safeParse(request.body ?? {}))
    return reply.status(201).send(
      successResponse(
        await options.studyTracking.sessions.startTask(
          request.user!,
          parseId(request.params),
        ),
        request.context.requestId,
      ),
    )
  })

  app.post('/student/tasks/:id/switch', studentOnly, async (request) => {
    const input = parseInput(switchStudyTaskSchema.safeParse(request.body ?? {}))
    return successResponse(
      await options.studyTracking.sessions.switchTask(
        request.user!,
        parseId(request.params),
        input.currentSessionAction,
      ),
      request.context.requestId,
    )
  })

  // Keep this static route before /study-sessions/:id.
  app.get('/student/study-sessions/active', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.sessions.active(request.user!),
      request.context.requestId,
    ),
  )

  app.get('/student/study-sessions/:id', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.sessions.get(
        request.user!,
        parseId(request.params),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/study-sessions/:id', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.sessions.update(
        request.user!,
        parseId(request.params),
        parseInput(updateStudySessionSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/study-sessions/:id/finish', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.sessions.finish(
        request.user!,
        parseId(request.params),
        parseInput(finishStudySessionSchema.safeParse(request.body ?? {})),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/study-sessions/:id/pause', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.sessions.pause(
        request.user!,
        parseId(request.params),
        parseInput(timerTransitionSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/study-sessions/:id/resume', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.sessions.resume(
        request.user!,
        parseId(request.params),
        parseInput(timerTransitionSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/study-sessions/:id/feedback', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.sessions.updateFeedback(
        request.user!,
        parseId(request.params),
        parseInput(updateStudySessionFeedbackSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/study-sessions/:id/cancel', studentOnly, async (request) => {
    parseInput(cancelStudySessionSchema.safeParse(request.body ?? {}))
    return successResponse(
      await options.studyTracking.sessions.cancel(
        request.user!,
        parseId(request.params),
      ),
      request.context.requestId,
    )
  })

  app.get('/student/goals', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.goals.list(
        request.user!,
        parseInput(listStudentGoalsSchema.safeParse(request.query)),
      ),
      request.context.requestId,
    ),
  )

  app.post('/student/goals', studentOnly, async (request, reply) => {
    const input = parseInput(createStudentGoalSchema.safeParse(request.body))
    return reply.status(201).send(
      successResponse(
        await options.studyTracking.goals.create(request.user!, input),
        request.context.requestId,
      ),
    )
  })

  app.get('/student/goals/:id', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.goals.get(
        request.user!,
        parseId(request.params),
      ),
      request.context.requestId,
    ),
  )

  app.patch('/student/goals/:id', studentOnly, async (request) =>
    successResponse(
      await options.studyTracking.goals.update(
        request.user!,
        parseId(request.params),
        parseInput(updateStudentGoalSchema.safeParse(request.body)),
      ),
      request.context.requestId,
    ),
  )
}
