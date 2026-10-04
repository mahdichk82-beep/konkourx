import { ApiError } from '../errors/api-error.js'
import type { DomainStore } from './domain-store.js'
import type {
  CounselorProfileInput,
  CounselorProfileRecord,
  CounselorStudentPage,
  CounselorStudentPageQuery,
  CounselorStudentRecord,
  DomainUser,
  StudentCounselorRecord,
  StudentProfileInput,
  StudentProfileRecord,
  StudentTrack,
  StudentCounselorStatus,
} from './types.js'

export type { DomainStore } from './domain-store.js'

const ensureActive = (user: DomainUser): void => {
  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Account is inactive')
  }
}

const ensureRole = (user: DomainUser, role: DomainUser['role']): void => {
  if (user.role !== role && user.role !== 'ADMIN') {
    throw new ApiError(403, 'ROLE_FORBIDDEN', 'Insufficient role permissions')
  }
}

const ensureAdmin = (user: DomainUser): void => {
  if (user.role !== 'ADMIN') {
    throw new ApiError(403, 'ROLE_FORBIDDEN', 'Insufficient role permissions')
  }
}

const ensureCounselor = (user: DomainUser): void => {
  if (user.role !== 'COUNSELOR') {
    throw new ApiError(403, 'ROLE_FORBIDDEN', 'Insufficient role permissions')
  }
}

const requireUser = async (store: DomainStore, id: string): Promise<DomainUser> => {
  const user = await store.findUserById(id)

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found')
  }

  return user
}

export type DomainService = ReturnType<typeof createDomainService>

export const createDomainService = (store: DomainStore) => ({
  async getStudentProfile(actor: DomainUser): Promise<StudentProfileRecord | null> {
    ensureActive(actor)
    ensureRole(actor, 'STUDENT')
    return store.findStudentProfile(actor.id)
  },

  async upsertStudentProfile(
    actor: DomainUser,
    input: StudentProfileInput,
  ): Promise<StudentProfileRecord> {
    ensureActive(actor)
    ensureRole(actor, 'STUDENT')
    return store.upsertStudentProfile(actor.id, input)
  },

  async getCounselorProfile(actor: DomainUser): Promise<CounselorProfileRecord | null> {
    ensureActive(actor)
    ensureRole(actor, 'COUNSELOR')
    return store.findCounselorProfile(actor.id)
  },

  async upsertCounselorProfile(
    actor: DomainUser,
    input: CounselorProfileInput,
  ): Promise<CounselorProfileRecord> {
    ensureActive(actor)
    ensureRole(actor, 'COUNSELOR')
    return store.upsertCounselorProfile(actor.id, input)
  },

  async listStudentRelationships(actor: DomainUser): Promise<StudentCounselorRecord[]> {
    ensureActive(actor)
    ensureRole(actor, 'STUDENT')
    return store.listStudentRelationships(actor.id)
  },

  async listCounselorRelationships(actor: DomainUser): Promise<StudentCounselorRecord[]> {
    ensureActive(actor)
    ensureRole(actor, 'COUNSELOR')
    return store.listCounselorRelationships(actor.id)
  },

  async createRelationship(
    actor: DomainUser,
    input: { studentId: string; counselorId: string },
  ): Promise<StudentCounselorRecord> {
    ensureActive(actor)
    ensureAdmin(actor)

    if (input.studentId === input.counselorId) {
      throw new ApiError(400, 'DOMAIN_ROLE_INVALID', 'Student and counselor must be different users')
    }

    const [student, counselor] = await Promise.all([
      requireUser(store, input.studentId),
      requireUser(store, input.counselorId),
    ])

    if (student.role !== 'STUDENT' || counselor.role !== 'COUNSELOR') {
      throw new ApiError(400, 'DOMAIN_ROLE_INVALID', 'Relationship users have invalid roles')
    }

    ensureActive(student)
    ensureActive(counselor)

    try {
      return await store.createRelationship(input)
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ApiError(409, 'RELATIONSHIP_CONFLICT', 'Student-counselor relationship already exists')
      }
      throw error
    }
  },

  async updateRelationship(
    actor: DomainUser,
    id: string,
    status: StudentCounselorStatus,
  ): Promise<StudentCounselorRecord> {
    ensureActive(actor)
    ensureAdmin(actor)
    const relationship = await store.updateRelationship(id, status)

    if (!relationship) {
      throw new ApiError(404, 'RELATIONSHIP_NOT_FOUND', 'Student-counselor relationship not found')
    }

    return relationship
  },

  async listAssignedStudents(
    actor: DomainUser,
    query: CounselorStudentPageQuery,
  ): Promise<CounselorStudentPage> {
    ensureActive(actor)
    ensureCounselor(actor)
    return store.listAssignedStudents(actor.id, query)
  },

  async getAssignedStudent(
    actor: DomainUser,
    studentProfileId: string,
  ): Promise<CounselorStudentRecord> {
    ensureActive(actor)
    ensureCounselor(actor)
    const student = await store.findAssignedStudent(actor.id, studentProfileId)

    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
    }

    return student
  },

  async getAssignedStudentTrack(
    actor: DomainUser,
    studentProfileId: string,
  ): Promise<StudentTrack | null> {
    ensureActive(actor)
    ensureCounselor(actor)
    const student = await store.findAssignedStudentTrack(actor.id, studentProfileId)

    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
    }

    return student.track
  },
})
