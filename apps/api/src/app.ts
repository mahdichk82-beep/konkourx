import Fastify, { LogController, type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import type { AssessmentAttemptServices } from './assessment-attempts/services.js'
import type { AuthService } from './auth/auth-service.js'
import type { CounselorTaskServices } from './counselor-tasks/services.js'
import type { DomainService } from './domain/domain-service.js'
import type { StudentCoreServices } from './student-core/services.js'
import type { StudyTrackingServices } from './study-tracking/services.js'
import { generateRequestId, registerRequestContext } from './plugins/request-context.js'
import { registerSecurityHeaders } from './plugins/security.js'
import { registerCors } from './plugins/cors.js'
import {
  registerAuthRateLimit,
  type AuthRateLimitOptions,
} from './plugins/auth-rate-limit.js'
import { registerErrorHandling } from './errors/error-handler.js'
import { registerHealthRoutes, type HealthDatabase } from './routes/health.js'
import { registerV1Routes } from './routes/v1.js'
import type { TrustProxyConfig } from './config/runtime.js'

export type BuildAppOptions = {
  assessmentAttempts?: AssessmentAttemptServices
  auth?: AuthService
  authRateLimit?: AuthRateLimitOptions | false
  counselorTasks?: CounselorTaskServices
  domain?: DomainService
  studentCore?: StudentCoreServices
  studyTracking?: StudyTrackingServices
  cookieDomain?: string
  cookieSecure?: boolean
  corsOrigins?: readonly string[]
  environment: string
  logger?: boolean
  prisma: HealthDatabase
  refreshTokenTtlSeconds?: number
  trustProxy?: TrustProxyConfig
}

export const buildApp = ({
  environment,
  assessmentAttempts,
  auth,
  authRateLimit,
  counselorTasks,
  domain,
  studentCore,
  studyTracking,
  cookieDomain,
  cookieSecure = false,
  corsOrigins = [],
  logger = true,
  prisma,
  refreshTokenTtlSeconds = 2_592_000,
  trustProxy = false,
}: BuildAppOptions): FastifyInstance => {
  const app = Fastify({
    genReqId: generateRequestId,
    logController: new LogController({ disableRequestLogging: true }),
    logger: logger
      ? {
          redact: {
            censor: '[REDACTED]',
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
              'password',
              '*.password',
              'currentPassword',
              '*.currentPassword',
              'newPassword',
              '*.newPassword',
              'passwordConfirmation',
              '*.passwordConfirmation',
              'accessToken',
              '*.accessToken',
              'refreshToken',
              '*.refreshToken',
              'token',
              '*.token',
              'secret',
              '*.secret',
              'DATABASE_URL',
              '*.DATABASE_URL',
            ],
          },
        }
      : false,
    requestIdHeader: false,
    trustProxy,
  })

  registerErrorHandling(app)
  registerRequestContext(app)
  registerSecurityHeaders(app)
  registerCors(app, corsOrigins)
  app.register(cookie)
  if (auth && authRateLimit !== false) {
    registerAuthRateLimit(app, authRateLimit)
  }

  const routeOptions = {
    assessmentAttempts,
    auth,
    counselorTasks,
    domain,
    studentCore,
    studyTracking,
    cookieDomain,
    cookieSecure,
    environment,
    prisma,
    refreshTokenTtlSeconds,
  }

  app.register(registerV1Routes, {
    ...routeOptions,
    prefix: '/api/v1',
  })

  registerHealthRoutes(app, routeOptions)

  return app
}
