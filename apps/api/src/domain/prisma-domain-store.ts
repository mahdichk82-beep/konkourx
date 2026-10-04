import type { PrismaClient } from '../generated/prisma/client.js'
import type {
  CounselorProfileInput,
  CounselorProfileRecord,
  CounselorStudentRecord,
  DomainUser,
  StudentCounselorRecord,
  StudentProfileInput,
  StudentProfileRecord,
  StudentCounselorStatus,
} from './types.js'
import type { DomainStore } from './domain-store.js'

const toDomainUser = (user: {
  id: string
  role: string
  status: string
}): DomainUser => ({
  id: user.id,
  role: user.role as DomainUser['role'],
  status: user.status as DomainUser['status'],
})

const toStudentProfile = (profile: StudentProfileRecord): StudentProfileRecord => profile
const toCounselorProfile = (profile: CounselorProfileRecord): CounselorProfileRecord => profile
const toRelationship = (relationship: StudentCounselorRecord): StudentCounselorRecord => relationship
const toCounselorStudent = (profile: {
  id: string
  educationLevel: string | null
  schoolName: string | null
  user: { status: string }
}): CounselorStudentRecord => ({
  id: profile.id,
  displayName: null,
  educationLevel: profile.educationLevel,
  schoolName: profile.schoolName,
  status: profile.user.status as CounselorStudentRecord['status'],
})

export const createPrismaDomainStore = (prisma: PrismaClient): DomainStore => ({
  async findUserById(id) {
    const user = await prisma.user.findUnique({
      select: { id: true, role: true, status: true },
      where: { id },
    })
    return user ? toDomainUser(user) : null
  },

  async findStudentProfile(userId) {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } })
    return profile ? toStudentProfile(profile) : null
  },

  async upsertStudentProfile(userId: string, input: StudentProfileInput) {
    const profile = await prisma.studentProfile.upsert({
      create: {
        userId,
        track: input.track ?? null,
        educationLevel: input.educationLevel ?? null,
        schoolName: input.schoolName ?? null,
      },
      update: {
        ...(input.track === undefined ? {} : { track: input.track }),
        ...(input.educationLevel === undefined ? {} : { educationLevel: input.educationLevel }),
        ...(input.schoolName === undefined ? {} : { schoolName: input.schoolName }),
      },
      where: { userId },
    })
    return toStudentProfile(profile)
  },

  async findCounselorProfile(userId) {
    const profile = await prisma.counselorProfile.findUnique({ where: { userId } })
    return profile ? toCounselorProfile(profile) : null
  },

  async upsertCounselorProfile(userId: string, input: CounselorProfileInput) {
    const profile = await prisma.counselorProfile.upsert({
      create: { userId, bio: input.bio ?? null, specialization: input.specialization ?? null },
      update: {
        ...(input.bio === undefined ? {} : { bio: input.bio }),
        ...(input.specialization === undefined ? {} : { specialization: input.specialization }),
      },
      where: { userId },
    })
    return toCounselorProfile(profile)
  },

  async listStudentRelationships(studentId) {
    const relationships = await prisma.studentCounselor.findMany({
      orderBy: { createdAt: 'desc' },
      where: { studentId },
    })
    return relationships.map(toRelationship)
  },

  async listCounselorRelationships(counselorId) {
    const relationships = await prisma.studentCounselor.findMany({
      orderBy: { createdAt: 'desc' },
      where: { counselorId },
    })
    return relationships.map(toRelationship)
  },

  async createRelationship(input) {
    const relationship = await prisma.studentCounselor.create({ data: input })
    return toRelationship(relationship)
  },

  async updateRelationship(id: string, status: StudentCounselorStatus) {
    try {
      const relationship = await prisma.studentCounselor.update({
        data: {
          endedAt: status === 'INACTIVE' ? new Date() : null,
          status,
        },
        where: { id },
      })
      return toRelationship(relationship)
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
        return null
      }
      throw error
    }
  },

  async listAssignedStudents(counselorId, query) {
    const limit = query.limit ?? 50
    const profiles = await prisma.studentProfile.findMany({
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        educationLevel: true,
        schoolName: true,
        user: { select: { status: true } },
      },
      skip: query.cursor ? 1 : undefined,
      take: limit + 1,
      where: {
        user: {
          studentRelationships: {
            some: { counselorId, status: 'ACTIVE' },
          },
        },
      },
    })
    const hasMore = profiles.length > limit
    const items = profiles.slice(0, limit)

    return {
      items: items.map(toCounselorStudent),
      nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
    }
  },

  async findAssignedStudent(counselorId, studentProfileId) {
    const profile = await prisma.studentProfile.findFirst({
      select: {
        id: true,
        educationLevel: true,
        schoolName: true,
        user: { select: { status: true } },
      },
      where: {
        id: studentProfileId,
        user: {
          studentRelationships: {
            some: { counselorId, status: 'ACTIVE' },
          },
        },
      },
    })

    return profile ? toCounselorStudent(profile) : null
  },

  async findAssignedStudentTrack(counselorId, studentProfileId) {
    return prisma.studentProfile.findFirst({
      select: { track: true },
      where: {
        id: studentProfileId,
        user: {
          studentRelationships: {
            some: { counselorId, status: 'ACTIVE' },
          },
        },
      },
    })
  },
})
