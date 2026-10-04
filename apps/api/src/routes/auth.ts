import type { FastifyInstance, FastifyReply } from 'fastify'
import { successResponse } from '../contracts/api-response.js'
import { ApiError } from '../errors/api-error.js'
import type { AuthService } from '../auth/auth-service.js'
import type { AuthRequestMeta } from '../auth/types.js'
import { authenticateRequest } from '../plugins/authentication.js'
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from '../schemas/auth.js'

export const refreshCookieName = 'refresh_token'

type AuthRouteOptions = {
  auth: AuthService
  cookieDomain?: string
  cookieSecure: boolean
  refreshTokenTtlSeconds: number
}

const refreshCookiePath = '/api/v1/auth'

const refreshCookieAttributes = (options: AuthRouteOptions) => ({
  ...(options.cookieDomain ? { domain: options.cookieDomain } : {}),
  httpOnly: true,
  path: refreshCookiePath,
  sameSite: 'lax' as const,
  secure: options.cookieSecure,
})

const requestMeta = (request: {
  headers: { 'user-agent'?: string | string[] | undefined }
  ip: string
}): AuthRequestMeta => ({
  ipAddress: request.ip,
  userAgent:
    typeof request.headers['user-agent'] === 'string'
      ? request.headers['user-agent']
      : null,
})

const setRefreshCookie = (
  reply: FastifyReply,
  token: string,
  options: AuthRouteOptions,
) => {
  reply.setCookie(refreshCookieName, token, {
    ...refreshCookieAttributes(options),
    maxAge: options.refreshTokenTtlSeconds,
  })
}

const parseBody = <T>(result: { success: boolean; data?: T }): T => {
  if (!result.success || !result.data) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed')
  }

  return result.data
}

export const registerAuthRoutes = (
  app: FastifyInstance,
  options: AuthRouteOptions,
): void => {
  app.post('/auth/register', async (request, reply) => {
    const input = parseBody(registerSchema.safeParse(request.body))
    const result = await options.auth.register(
      {
        email: input.email ?? null,
        password: input.password,
        phone: input.phone ?? null,
        track: input.track,
      },
      requestMeta(request),
    )

    setRefreshCookie(reply, result.refreshToken, options)

    return reply.status(201).send(
      successResponse(
        {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          user: result.user,
        },
        request.context.requestId,
      ),
    )
  })

  app.post('/auth/login', async (request, reply) => {
    const input = parseBody(loginSchema.safeParse(request.body))
    const result = await options.auth.login(
      input.identifier,
      input.password,
      requestMeta(request),
    )

    setRefreshCookie(reply, result.refreshToken, options)

    return successResponse(
      {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      },
      request.context.requestId,
    )
  })

  app.post('/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies[refreshCookieName]

    if (!refreshToken) {
      throw new ApiError(401, 'SESSION_INVALID', 'Refresh session is invalid')
    }

    const result = await options.auth.refresh(refreshToken, requestMeta(request))
    setRefreshCookie(reply, result.refreshToken, options)

    return successResponse(
      {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      },
      request.context.requestId,
    )
  })

  app.post('/auth/logout', async (request, reply) => {
    await options.auth.logout(request.cookies[refreshCookieName])
    reply.clearCookie(refreshCookieName, refreshCookieAttributes(options))

    return successResponse(
      { loggedOut: true },
      request.context.requestId,
    )
  })

  app.post(
    '/auth/logout-all',
    { preHandler: authenticateRequest(options.auth) },
    async (request, reply) => {
      await options.auth.logoutAll(request.user!.id)
      reply.clearCookie(refreshCookieName, refreshCookieAttributes(options))

      return successResponse(
        { loggedOut: true },
        request.context.requestId,
      )
    },
  )

  app.post(
    '/auth/change-password',
    { preHandler: authenticateRequest(options.auth) },
    async (request, reply) => {
      const input = parseBody(changePasswordSchema.safeParse(request.body))
      await options.auth.changePassword(
        request.user!.id,
        input.currentPassword,
        input.newPassword,
      )
      reply.clearCookie(refreshCookieName, refreshCookieAttributes(options))

      return successResponse(
        { passwordChanged: true, reauthenticationRequired: true },
        request.context.requestId,
      )
    },
  )

  app.get(
    '/auth/me',
    { preHandler: authenticateRequest(options.auth) },
    async (request) =>
      successResponse(request.user, request.context.requestId),
  )
}
