import type { PrismaClient } from '../generated/prisma/client.js'
import type {
  CounselorProfileInput,
  CounselorProfileRecord,
  CounselorStudentRecord,
  DomainUser,
  PersonProfileInput,
  PersonProfileRecord,
  StudentCounselorRecord,
  StudentProfileInput,
  StudentProfileRecord,
  StudentCounselorStatus,
} from './types.js'
import type { DomainStore } from './domain-store.js'
import { derivePersonDisplayName } from './person-profile.js'

const toDomainUser = (user: {
  id: string
  role: string
  status: string
}): DomainUser => ({
  id: user.id,
  role: user.role as DomainUser['role'],
  status: user.status as DomainUser['status'],
})
const toPersonProfile = (profile: PersonProfileRecord): PersonProfileRecord => profile

const toStudentProfile = (profile: StudentProfileRecord): StudentProfileRecord => profile
const toCounselorProfile = (profile: CounselorProfileRecord): CounselorProfileRecord => profile
const toRelationship = (relationship: StudentCounselorRecord): StudentCounselorRecord => relationship
const toCounselorStudent = (profile: {
  id: string
  educationLevel: string | null
  schoolName: string | null
  user: {
    status: string
    personProfile: {
      firstName: string | null
      lastName: string | null
      preferredName: string | null
    } | null
  }
}): CounselorStudentRecord => ({
  id: profile.id,
  displayName: derivePersonDisplayName(profile.user.personProfile),
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

  async findPersonProfile(userId) {
    const profile = await prisma.personProfile.findUnique({ where: { userId } })
    return profile ? toPersonProfile(profile) : null
  },

  async upsertPersonProfile(userId: string, input: PersonProfileInput) {
    const profile = await prisma.personProfile.upsert({
      create: {
        userId,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        preferredName: input.preferredName ?? null,
        province: input.province ?? null,
        city: input.city ?? null,
      },
      update: {
        ...(input.firstName === undefined ? {} : { firstName: input.firstName }),
        ...(input.lastName === undefined ? {} : { lastName: input.lastName }),
        ...(input.preferredName === undefined ? {} : { preferredName: input.preferredName }),
        ...(input.province === undefined ? {} : { province: input.province }),
        ...(input.city === undefined ? {} : { city: input.city }),
      },
      where: { userId },
    })
    return toPersonProfile(profile)
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
        user: {
          select: {
            status: true,
            personProfile: {
              select: { firstName: true, lastName: true, preferredName: true },
            },
          },
        },
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
        user: {
          select: {
            status: true,
            personProfile: {
              select: { firstName: true, lastName: true, preferredName: true },
            },
          },
        },
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
