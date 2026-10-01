import type { FastifyInstance } from 'fastify'
import type { AuthService } from '../auth/auth-service.js'
import { requireRoles } from '../auth/rbac.js'
import type { CounselorTaskServices } from '../counselor-tasks/services.js'
import { successResponse } from '../contracts/api-response.js'
import { ApiError } from '../errors/api-error.js'
import { authenticateRequest } from '../plugins/authentication.js'
import {
  counselorStudentTaskParamSchema,
  counselorStudentTaskScheduleParamSchema,
  counselorStudentTopicParamSchema,
  createCounselorTaskBatchSchema,
  createCounselorTaskSchema,
  listCounselorTaskResourcesSchema,
  listCounselorTasksSchema,
  rescheduleCounselorTaskSchema,
  updateCounselorTaskSchema,
} from '../schemas/counselor-tasks.js'
import { replaceCurriculumTargetsSchema } from '../schemas/task-curriculum.js'

type CounselorTaskRouteOptions = {
  auth: AuthService
  counselorTasks: CounselorTaskServices
}

const parseInput = <T>(result: { success: boolean; data?: T }): T => {
  if (!result.success || result.data === undefined) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed')
  }
  return result.data
}

export const registerCounselorTaskRoutes = (
  app: FastifyInstance,
  options: CounselorTaskRouteOptions,
): void => {
  const counselorOnly = {
    preHandler: [authenticateRequest(options.auth), requireRoles('COUNSELOR')],
  }

  app.get(
    '/counselor/students/:studentProfileId/tasks',
    counselorOnly,
    async (request) => {
      const { studentProfileId } = parseInput(
        counselorStudentTaskParamSchema.safeParse(request.params),
      )
      const { from, to, ...query } = parseInput(
        listCounselorTasksSchema.safeParse(request.query),
      )
      return successResponse(
        await options.counselorTasks.list(request.user!, studentProfileId, {
          ...query,
          ...(from === undefined ? {} : { scheduledFrom: from }),
          ...(to === undefined ? {} : { scheduledTo: to }),
        }),
        request.context.requestId,
      )
    },
  )

  app.get(
    '/counselor/students/:studentProfileId/subjects',
    counselorOnly,
    async (request) => {
      const { studentProfileId } = parseInput(
        counselorStudentTaskParamSchema.safeParse(request.params),
      )
      const query = parseInput(listCounselorTaskResourcesSchema.safeParse(request.query))
      return successResponse(
        await options.counselorTasks.listSubjects(request.user!, studentProfileId, query),
        request.context.requestId,
      )
    },
  )

  app.get(
    '/counselor/students/:studentProfileId/subjects/:subjectId/topics',
    counselorOnly,
    async (request) => {
      const { studentProfileId, subjectId } = parseInput(
        counselorStudentTopicParamSchema.safeParse(request.params),
      )
      const query = parseInput(listCounselorTaskResourcesSchema.safeParse(request.query))
      return successResponse(
        await options.counselorTasks.listTopics(
          request.user!,
          studentProfileId,
          subjectId,
          query,
        ),
        request.context.requestId,
      )
    },
  )

  app.post(
    '/counselor/students/:studentProfileId/tasks',
    counselorOnly,
    async (request, reply) => {
      const { studentProfileId } = parseInput(
        counselorStudentTaskParamSchema.safeParse(request.params),
      )
      const input = parseInput(createCounselorTaskSchema.safeParse(request.body))
      return reply.status(201).send(
        successResponse(
          await options.counselorTasks.create(request.user!, studentProfileId, input),
          request.context.requestId,
        ),
      )
    },
  )

  app.post(
    '/counselor/students/:studentProfileId/tasks/batch',
    counselorOnly,
    async (request, reply) => {
      const { studentProfileId } = parseInput(
        counselorStudentTaskParamSchema.safeParse(request.params),
      )
      const input = parseInput(createCounselorTaskBatchSchema.safeParse(request.body))
      return reply.status(201).send(
        successResponse(
          await options.counselorTasks.createBatch(request.user!, studentProfileId, input),
          request.context.requestId,
        ),
      )
    },
  )

  app.patch(
    '/counselor/students/:studentProfileId/tasks/:taskId',
    counselorOnly,
    async (request) => {
      const { studentProfileId, taskId } = parseInput(
        counselorStudentTaskScheduleParamSchema.safeParse(request.params),
      )
      const input = parseInput(updateCounselorTaskSchema.safeParse(request.body))
      return successResponse(
        await options.counselorTasks.update(
          request.user!,
          studentProfileId,
          taskId,
          input,
        ),
        request.context.requestId,
      )
    },
  )

  app.patch(
    '/counselor/students/:studentProfileId/tasks/:taskId/schedule',
    counselorOnly,
    async (request) => {
      const { studentProfileId, taskId } = parseInput(
        counselorStudentTaskScheduleParamSchema.safeParse(request.params),
      )
      const input = parseInput(rescheduleCounselorTaskSchema.safeParse(request.body))
      return successResponse(
        await options.counselorTasks.reschedule(
          request.user!,
          studentProfileId,
          taskId,
          input,
        ),
        request.context.requestId,
      )
    },
  )

  app.patch(
    '/counselor/students/:studentProfileId/tasks/:taskId/curriculum-targets',
    counselorOnly,
    async (request) => {
      const { studentProfileId, taskId } = parseInput(
        counselorStudentTaskScheduleParamSchema.safeParse(request.params),
      )
      const input = parseInput(replaceCurriculumTargetsSchema.safeParse(request.body))
      return successResponse(
        await options.counselorTasks.replaceCurriculumTargets(
          request.user!,
          studentProfileId,
          taskId,
          input,
        ),
        request.context.requestId,
      )
    },
  )
}
