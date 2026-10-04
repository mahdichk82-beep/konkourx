import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError } from '../src/errors/api-error.js'
import {
  createDomainService,
  type DomainStore,
} from '../src/domain/domain-service.js'
import type {
  DomainUser,
  StudentCounselorRecord,
  StudentProfileRecord,
  CounselorProfileRecord,
} from '../src/domain/types.js'

const student: DomainUser = {
  id: 'student-1',
  role: 'STUDENT',
  status: 'ACTIVE',
}

const counselor: DomainUser = {
  id: 'counselor-1',
  role: 'COUNSELOR',
  status: 'ACTIVE',
}

const admin: DomainUser = {
  id: 'admin-1',
  role: 'ADMIN',
  status: 'ACTIVE',
}

const createStore = (): DomainStore & {
  studentProfile?: StudentProfileRecord
  counselorProfile?: CounselorProfileRecord
  relationships: StudentCounselorRecord[]
} => {
  const users = new Map([student, counselor, admin].map((user) => [user.id, user]))
  const store = {
    relationships: [] as StudentCounselorRecord[],
    async findUserById(id: string) {
      return users.get(id) ?? null
    },
    async findStudentProfile(userId: string) {
      return store.studentProfile?.userId === userId ? store.studentProfile : null
    },
    async upsertStudentProfile(userId: string, input: { track?: 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES' | null; educationLevel?: string | null; schoolName?: string | null }) {
      store.studentProfile = {
        id: 'student-profile-1',
        userId,
        track: input.track ?? null,
        educationLevel: input.educationLevel ?? null,
        schoolName: input.schoolName ?? null,
        createdAt: new Date('2026-09-03T00:00:00.000Z'),
        updatedAt: new Date('2026-09-03T00:00:00.000Z'),
      }
      return store.studentProfile
    },
    async findCounselorProfile(userId: string) {
      return store.counselorProfile?.userId === userId ? store.counselorProfile : null
    },
    async upsertCounselorProfile(userId: string, input: { bio?: string | null; specialization?: string | null }) {
      store.counselorProfile = {
        id: 'counselor-profile-1',
        userId,
        bio: input.bio ?? null,
        specialization: input.specialization ?? null,
        createdAt: new Date('2026-09-03T00:00:00.000Z'),
        updatedAt: new Date('2026-09-03T00:00:00.000Z'),
      }
      return store.counselorProfile
    },
    async listStudentRelationships(studentId: string) {
      return store.relationships.filter((relationship) => relationship.studentId === studentId)
    },
    async listCounselorRelationships(counselorId: string) {
      return store.relationships.filter((relationship) => relationship.counselorId === counselorId)
    },
    async createRelationship(input: { studentId: string; counselorId: string }) {
      const relationship: StudentCounselorRecord = {
        id: `relationship-${store.relationships.length + 1}`,
        studentId: input.studentId,
        counselorId: input.counselorId,
        status: 'ACTIVE',
        startedAt: new Date('2026-09-03T00:00:00.000Z'),
        endedAt: null,
        createdAt: new Date('2026-09-03T00:00:00.000Z'),
        updatedAt: new Date('2026-09-03T00:00:00.000Z'),
      }
      store.relationships.push(relationship)
      return relationship
    },
    async updateRelationship(id: string, status: 'ACTIVE' | 'INACTIVE') {
      const relationship = store.relationships.find((item) => item.id === id)
      if (!relationship) return null
      relationship.status = status
      relationship.endedAt = status === 'INACTIVE' ? new Date('2026-09-03T00:00:00.000Z') : null
      return relationship
    },
    async listAssignedStudents(counselorId: string, query: { cursor?: string; limit?: number }) {
      void counselorId
      void query
      return { items: [], nextCursor: null }
    },
    async findAssignedStudent(counselorId: string, studentProfileId: string) {
      void counselorId
      void studentProfileId
      return null
    },
  }

  return store
}

test('student can upsert only their own student profile', async () => {
  const store = createStore()
  const service = createDomainService(store)

  const profile = await service.upsertStudentProfile(student, {
    educationLevel: 'secondary',
    schoolName: 'Konkourix Academy',
  })

  assert.equal(profile.userId, student.id)
  assert.equal(profile.schoolName, 'Konkourix Academy')

  await assert.rejects(
    service.upsertStudentProfile(counselor, { schoolName: 'Nope' }),
    (error: unknown) => error instanceof ApiError && error.code === 'ROLE_FORBIDDEN',
  )
})

test('only an administrator can create and update student-counselor relationships', async () => {
  const store = createStore()
  const service = createDomainService(store)

  await assert.rejects(
    service.createRelationship(student, { studentId: student.id, counselorId: counselor.id }),
    (error: unknown) => error instanceof ApiError && error.code === 'ROLE_FORBIDDEN',
  )

  const relationship = await service.createRelationship(admin, {
    studentId: student.id,
    counselorId: counselor.id,
  })

  assert.equal(relationship.status, 'ACTIVE')
  const updated = await service.updateRelationship(admin, relationship.id, 'INACTIVE')
  assert.equal(updated.status, 'INACTIVE')
})

test('relationship creation rejects users with incorrect roles', async () => {
  const store = createStore()
  const service = createDomainService(store)

  await assert.rejects(
    service.createRelationship(admin, { studentId: counselor.id, counselorId: student.id }),
    (error: unknown) => error instanceof ApiError && error.code === 'DOMAIN_ROLE_INVALID',
  )
})
