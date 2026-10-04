import type { AuthRole } from './access-token.js'
import type { AuthStatus } from './types.js'
import type { CurriculumTrackId } from '../curriculum/types.js'

export type AuthUserRecord = {
  id: string
  email: string | null
  phone: string | null
  passwordHash: string
  role: AuthRole
  status: AuthStatus
  createdAt: Date
  updatedAt: Date
}

export type AuthSessionRecord = {
  id: string
  userId: string
  tokenHash: string
  familyId: string
  expiresAt: Date
  revokedAt: Date | null
  lastUsedAt: Date | null
  userAgent: string | null
  ipAddress: string | null
  createdAt: Date
}

export type CreateSessionInput = {
  userId: string
  tokenHash: string
  familyId: string
  expiresAt: Date
  userAgent: string | null
  ipAddress: string | null
}

export interface AuthStore {
  findUserByIdentifier(identifier: string): Promise<AuthUserRecord | null>
  findUserById(id: string): Promise<AuthUserRecord | null>
  createStudentUser(input: {
    email: string | null
    phone: string | null
    passwordHash: string
    track?: CurriculumTrackId
  }): Promise<AuthUserRecord>
  createSession(input: CreateSessionInput): Promise<AuthSessionRecord>
  findSessionByTokenHash(tokenHash: string): Promise<AuthSessionRecord | null>
  rotateSession(input: {
    sessionId: string
    now: Date
    replacement: CreateSessionInput
  }): Promise<AuthSessionRecord | null>
  revokeSession(sessionId: string, now: Date): Promise<void>
  revokeSessionFamily(familyId: string, now: Date): Promise<void>
  revokeAllUserSessions(userId: string, now: Date): Promise<void>
  changePasswordAndRevokeSessions(input: {
    userId: string
    passwordHash: string
    now: Date
  }): Promise<void>
}
