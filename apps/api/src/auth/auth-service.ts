import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error.js'
import {
  signAccessToken,
  verifyAccessToken,
  type AccessTokenInput,
} from './access-token.js'
import { hashPassword, verifyPassword } from './password.js'
import { generateRefreshToken, hashRefreshToken } from './refresh-token.js'
import type { AuthStore, AuthUserRecord, CreateSessionInput } from './store.js'
import type { CurriculumTrackId } from '../curriculum/types.js'
import type {
  AuthRequestMeta,
  AuthResult,
  AuthServiceConfig,
  PublicUser,
} from './types.js'

export type AuthService = {
  register(
    input: {
      email: string | null
      phone: string | null
      password: string
      track?: CurriculumTrackId
    },
    meta: AuthRequestMeta,
  ): Promise<AuthResult>
  login(identifier: string, password: string, meta: AuthRequestMeta): Promise<AuthResult>
  refresh(refreshToken: string, meta: AuthRequestMeta): Promise<AuthResult>
  logout(refreshToken: string | undefined): Promise<void>
  logoutAll(userId: string): Promise<void>
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void>
  getCurrentUser(userId: string): Promise<PublicUser>
  authenticateAccessToken(token: string): Promise<PublicUser>
}

type AuthServiceOptions = {
  config: AuthServiceConfig
  now?: () => Date
  store: AuthStore
}

const dummyPasswordHash = hashPassword('konkourx-invalid-login-password')

const normalizeEmail = (email: string | null): string | null =>
  email === null ? null : email.trim().toLowerCase()

const normalizePhone = (phone: string | null): string | null =>
  phone === null ? null : phone.trim()

const publicUser = (user: AuthUserRecord): PublicUser => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002'

export const createAuthService = ({
  config,
  now = () => new Date(),
  store,
}: AuthServiceOptions): AuthService => {
  const issueSession = async (
    user: AuthUserRecord,
    meta: AuthRequestMeta,
    familyId = randomUUID(),
  ): Promise<AuthResult> => {
    const currentTime = now()
    const refreshToken = generateRefreshToken()
    const session: CreateSessionInput = {
      expiresAt: new Date(
        currentTime.getTime() + config.refreshTokenTtlSeconds * 1000,
      ),
      familyId,
      ipAddress: meta.ipAddress,
      tokenHash: refreshToken.hash,
      userAgent: meta.userAgent,
      userId: user.id,
    }

    await store.createSession(session)

    return {
      accessToken: await signAccessToken(
        { role: user.role, userId: user.id },
        config.accessToken,
        currentTime,
      ),
      expiresIn: config.accessToken.ttlSeconds,
      refreshToken: refreshToken.token,
      user: publicUser(user),
    }
  }

  const invalidCredentials = (): never => {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials')
  }

  const getCurrentUser = async (userId: string): Promise<PublicUser> => {
    const user = await store.findUserById(userId)

    if (!user) {
      throw new ApiError(401, 'TOKEN_INVALID', 'Access token is invalid')
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Account is inactive')
    }

    return publicUser(user)
  }

  return {
    async register(input, meta) {
      const email = normalizeEmail(input.email)
      const phone = normalizePhone(input.phone)

      if (!email && !phone) {
        throw new ApiError(400, 'AUTH_INPUT_INVALID', 'Email or phone is required')
      }

      const passwordHash = await hashPassword(input.password)
      let user: AuthUserRecord

      try {
        user = await store.createStudentUser({
          email,
          passwordHash,
          phone,
          track: input.track,
        })
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ApiError(409, 'AUTH_CONFLICT', 'Account already exists')
        }
        throw error
      }

      return issueSession(user, meta)
    },

    async login(identifier, password, meta) {
      const normalizedIdentifier = identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : identifier.trim()
      const user = await store.findUserByIdentifier(normalizedIdentifier)

      if (!user) {
        await verifyPassword(password, await dummyPasswordHash)
        return invalidCredentials()
      }

      const validPassword = await verifyPassword(password, user.passwordHash)

      if (!validPassword || user.status !== 'ACTIVE') {
        return invalidCredentials()
      }

      return issueSession(user, meta)
    },

    async refresh(refreshToken, meta) {
      const currentTime = now()
      const current = await store.findSessionByTokenHash(
        hashRefreshToken(refreshToken),
      )

      if (!current) {
        throw new ApiError(401, 'SESSION_INVALID', 'Refresh session is invalid')
      }

      if (current.revokedAt) {
        await store.revokeSessionFamily(current.familyId, currentTime)
        throw new ApiError(401, 'SESSION_REUSED', 'Refresh session was reused')
      }

      if (current.expiresAt <= currentTime) {
        await store.revokeSession(current.id, currentTime)
        throw new ApiError(401, 'SESSION_INVALID', 'Refresh session is invalid')
      }

      const user = await store.findUserById(current.userId)

      if (!user || user.status !== 'ACTIVE') {
        throw new ApiError(401, 'SESSION_INVALID', 'Refresh session is invalid')
      }

      const replacement = generateRefreshToken()
      const replacementInput: CreateSessionInput = {
        expiresAt: new Date(
          currentTime.getTime() + config.refreshTokenTtlSeconds * 1000,
        ),
        familyId: current.familyId,
        ipAddress: meta.ipAddress,
        tokenHash: replacement.hash,
        userAgent: meta.userAgent,
        userId: user.id,
      }

      const rotatedSession = await store.rotateSession({
        now: currentTime,
        replacement: replacementInput,
        sessionId: current.id,
      })

      if (!rotatedSession) {
        await store.revokeSessionFamily(current.familyId, currentTime)
        throw new ApiError(401, 'SESSION_REUSED', 'Refresh session was reused')
      }

      return {
        accessToken: await signAccessToken(
          { role: user.role, userId: user.id },
          config.accessToken,
          currentTime,
        ),
        expiresIn: config.accessToken.ttlSeconds,
        refreshToken: replacement.token,
        user: publicUser(user),
      }
    },

    async logout(refreshToken) {
      if (!refreshToken) return

      const session = await store.findSessionByTokenHash(
        hashRefreshToken(refreshToken),
      )

      if (session && !session.revokedAt) {
        await store.revokeSession(session.id, now())
      }
    },

    async logoutAll(userId) {
      await getCurrentUser(userId)
      await store.revokeAllUserSessions(userId, now())
    },

    async changePassword(userId, currentPassword, newPassword) {
      const user = await store.findUserById(userId)

      if (!user || user.status !== 'ACTIVE') {
        throw new ApiError(401, 'TOKEN_INVALID', 'Access token is invalid')
      }

      if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        throw new ApiError(
          400,
          'CURRENT_PASSWORD_INVALID',
          'Current password is incorrect',
        )
      }

      await store.changePasswordAndRevokeSessions({
        now: now(),
        passwordHash: await hashPassword(newPassword),
        userId,
      })
    },

    getCurrentUser,

    async authenticateAccessToken(token) {
      const claims: AccessTokenInput | null = await verifyAccessToken(
        token,
        config.accessToken,
        now(),
      )

      if (!claims) {
        throw new ApiError(401, 'TOKEN_INVALID', 'Access token is invalid')
      }

      return getCurrentUser(claims.userId)
    },
  }
}
