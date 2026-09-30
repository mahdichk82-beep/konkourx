import { buildApp } from './app.js'
import { createPrismaAssessmentAttemptStore } from './assessment-attempts/prisma-store.js'
import { createAssessmentAttemptServices } from './assessment-attempts/services.js'
import { createAuthService } from './auth/auth-service.js'
import { createPrismaAuthStore } from './auth/prisma-auth-store.js'
import { createPrismaCounselorTaskStore } from './counselor-tasks/prisma-store.js'
import { createCounselorTaskServices } from './counselor-tasks/services.js'
import { createDomainService } from './domain/domain-service.js'
import { createPrismaDomainStore } from './domain/prisma-domain-store.js'
import { createPrismaStudentCoreStore } from './student-core/prisma-store.js'
import { createStudentCoreServices } from './student-core/services.js'
import { createPrismaStudyTrackingStore } from './study-tracking/prisma-store.js'
import { createStudyTrackingServices } from './study-tracking/services.js'
import { env } from './config/env.js'
import { closeResources } from './lib/lifecycle.js'
import { prisma } from './lib/prisma.js'
import { operationalErrorFields } from './lib/operational-logging.js'

const app = buildApp({
  assessmentAttempts: createAssessmentAttemptServices(
    createPrismaAssessmentAttemptStore(prisma),
  ),
  auth: createAuthService({
    config: {
      accessToken: {
        audience: env.ACCESS_TOKEN_AUDIENCE,
        issuer: env.ACCESS_TOKEN_ISSUER,
        secret: env.ACCESS_TOKEN_SECRET,
        ttlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
      },
      refreshTokenTtlSeconds: env.REFRESH_TOKEN_TTL_SECONDS,
    },
    store: createPrismaAuthStore(prisma),
  }),
  counselorTasks: createCounselorTaskServices(createPrismaCounselorTaskStore(prisma)),
  domain: createDomainService(createPrismaDomainStore(prisma)),
  studentCore: createStudentCoreServices(createPrismaStudentCoreStore(prisma)),
  studyTracking: createStudyTrackingServices(createPrismaStudyTrackingStore(prisma)),
  cookieDomain: env.COOKIE_DOMAIN,
  cookieSecure: env.NODE_ENV === 'production',
  corsOrigins: env.CORS_ORIGINS,
  environment: env.NODE_ENV,
  logger: true,
  prisma,
  refreshTokenTtlSeconds: env.REFRESH_TOKEN_TTL_SECONDS,
  trustProxy: env.TRUST_PROXY,
})

let shutdownPromise: Promise<void> | undefined

const shutdown = (signal: NodeJS.Signals): Promise<void> => {
  shutdownPromise ??= (async () => {
    app.log.info({ signal }, 'Shutting down API')

    try {
      await closeResources(app, prisma)
    } catch (error) {
      app.log.error(
        operationalErrorFields(error),
        'Failed to close API resources',
      )
      process.exitCode = 1
    }
  })()

  return shutdownPromise
}

process.once('SIGINT', () => {
  void shutdown('SIGINT')
})

process.once('SIGTERM', () => {
  void shutdown('SIGTERM')
})

const start = async (): Promise<void> => {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    })
  } catch (error) {
    app.log.error(operationalErrorFields(error), 'Failed to start API')

    try {
      await closeResources(app, prisma)
    } catch (closeError) {
      app.log.error(
        operationalErrorFields(closeError),
        'Failed to close API resources after startup failure',
      )
    }

    process.exitCode = 1
  }
}

void start()
