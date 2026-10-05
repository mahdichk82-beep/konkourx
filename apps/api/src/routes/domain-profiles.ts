import type { FastifyInstance } from 'fastify'
import type { AuthService } from '../auth/auth-service.js'
import { successResponse } from '../contracts/api-response.js'
import type { DomainService } from '../domain/domain-service.js'
import { authenticateRequest } from '../plugins/authentication.js'
import { requireRoles } from '../auth/rbac.js'
import {
  counselorProfileSchema,
  personProfileSchema,
  studentProfileSchema,
} from '../schemas/domain.js'
import { ApiError } from '../errors/api-error.js'

type DomainProfileRouteOptions = {
  auth: AuthService
  domain: DomainService
}

const parseBody = <T>(result: { success: boolean; data?: T }): T => {
  if (!result.success || result.data === undefined) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed')
  }
  return result.data
}

export const registerDomainProfileRoutes = (
  app: FastifyInstance,
  options: DomainProfileRouteOptions,
): void => {
  app.get(
    '/me/person-profile',
    { preHandler: authenticateRequest(options.auth) },
    async (request) =>
      successResponse(
        await options.domain.getPersonProfile(request.user!),
        request.context.requestId,
      ),
  )

  app.patch(
    '/me/person-profile',
    { preHandler: authenticateRequest(options.auth) },
    async (request) =>
      successResponse(
        await options.domain.upsertPersonProfile(
          request.user!,
          parseBody(personProfileSchema.safeParse(request.body)),
        ),
        request.context.requestId,
      ),
  )

  app.get(
    '/me/student-profile',
    { preHandler: [authenticateRequest(options.auth), requireRoles('STUDENT', 'ADMIN')] },
    async (request) =>
      successResponse(
        await options.domain.getStudentProfile(request.user!),
        request.context.requestId,
      ),
  )

  app.patch(
    '/me/student-profile',
    { preHandler: [authenticateRequest(options.auth), requireRoles('STUDENT', 'ADMIN')] },
    async (request) =>
      successResponse(
        await options.domain.upsertStudentProfile(
          request.user!,
          parseBody(studentProfileSchema.safeParse(request.body)),
        ),
        request.context.requestId,
      ),
  )

  app.get(
    '/me/counselor-profile',
    { preHandler: [authenticateRequest(options.auth), requireRoles('COUNSELOR', 'ADMIN')] },
    async (request) =>
      successResponse(
        await options.domain.getCounselorProfile(request.user!),
        request.context.requestId,
      ),
  )

  app.patch(
    '/me/counselor-profile',
    { preHandler: [authenticateRequest(options.auth), requireRoles('COUNSELOR', 'ADMIN')] },
    async (request) =>
      successResponse(
        await options.domain.upsertCounselorProfile(
          request.user!,
          parseBody(counselorProfileSchema.safeParse(request.body)),
        ),
        request.context.requestId,
      ),
  )
}
