import type { PrismaClient } from '../generated/prisma/client.js'
import type {
  AuthSessionRecord,
  AuthStore,
  AuthUserRecord,
  CreateSessionInput,
} from './store.js'

const userFields = {
  id: true,
  email: true,
  phone: true,
  passwordHash: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

const toUserRecord = (user: {
  id: string
  email: string | null
  phone: string | null
  passwordHash: string
  role: string
  status: string
  createdAt: Date
  updatedAt: Date
}): AuthUserRecord => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  passwordHash: user.passwordHash,
  role: user.role as AuthUserRecord['role'],
  status: user.status as AuthUserRecord['status'],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const toSessionRecord = (session: {
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
}): AuthSessionRecord => session

export const createPrismaAuthStore = (prisma: PrismaClient): AuthStore => ({
  async findUserByIdentifier(identifier) {
    const user = await prisma.user.findFirst({
      select: userFields,
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    })

    return user ? toUserRecord(user) : null
  },

  async findUserById(id) {
    const user = await prisma.user.findUnique({
      select: userFields,
      where: { id },
    })

    return user ? toUserRecord(user) : null
  },

  async createStudentUser(input) {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        phone: input.phone,
        role: 'STUDENT',
        studentProfile: { create: { track: input.track ?? null } },
      },
      select: userFields,
    })

    return toUserRecord(user)
  },

  async createSession(input: CreateSessionInput) {
    const session = await prisma.authSession.create({
      data: input,
    })

    return toSessionRecord(session)
  },

  async findSessionByTokenHash(tokenHash) {
    const session = await prisma.authSession.findUnique({
      where: { tokenHash },
    })

    return session ? toSessionRecord(session) : null
  },

  async rotateSession({ now, replacement, sessionId }) {
    return prisma.$transaction(async (transaction) => {
      const revoked = await transaction.authSession.updateMany({
        data: {
          lastUsedAt: now,
          revokedAt: now,
        },
        where: {
          expiresAt: { gt: now },
          id: sessionId,
          revokedAt: null,
        },
      })

      if (revoked.count !== 1) return null

      const session = await transaction.authSession.create({
        data: replacement,
      })

      return toSessionRecord(session)
    })
  },

  async revokeSession(sessionId, now) {
    await prisma.authSession.update({
      data: { revokedAt: now },
      where: { id: sessionId },
    })
  },

  async revokeSessionFamily(familyId, now) {
    await prisma.authSession.updateMany({
      data: { revokedAt: now },
      where: { familyId, revokedAt: null },
    })
  },

  async revokeAllUserSessions(userId, now) {
    await prisma.authSession.updateMany({
      data: { revokedAt: now },
      where: { userId, revokedAt: null },
    })
  },

  async changePasswordAndRevokeSessions({ now, passwordHash, userId }) {
    await prisma.$transaction([
      prisma.user.update({
        data: { passwordHash },
        where: { id: userId },
      }),
      prisma.authSession.updateMany({
        data: { revokedAt: now },
        where: { userId, revokedAt: null },
      }),
    ])
  },
})
