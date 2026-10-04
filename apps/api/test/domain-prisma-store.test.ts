import assert from 'node:assert/strict'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import { createPrismaDomainStore } from '../src/domain/prisma-domain-store.js'
import type { CounselorProfileRecord, StudentProfileRecord } from '../src/domain/types.js'

test('profile PATCH upserts preserve omitted fields and apply supplied nulls', async () => {
  const timestamp = new Date('2026-09-03T00:00:00.000Z')
  let studentProfile: StudentProfileRecord = {
    id: 'student-profile-1',
    userId: 'student-user-1',
    track: null,
    educationLevel: '12',
    schoolName: 'Konkourix Academy',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  let counselorProfile: CounselorProfileRecord = {
    id: 'counselor-profile-1',
    userId: 'counselor-user-1',
    bio: 'Experienced counselor',
    specialization: 'Exam planning',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const studentUpdates: Array<Record<string, string | null>> = []
  const counselorUpdates: Array<Record<string, string | null>> = []
  const prisma = {
    studentProfile: {
      async upsert(input: {
        create: { userId: string; track: string | null; educationLevel: string | null; schoolName: string | null }
        update: { track?: string | null; educationLevel?: string | null; schoolName?: string | null }
      }) {
        studentUpdates.push(input.update)
        studentProfile = { ...studentProfile, ...input.update }
        return studentProfile
      },
    },
    counselorProfile: {
      async upsert(input: {
        create: { userId: string; bio: string | null; specialization: string | null }
        update: { bio?: string | null; specialization?: string | null }
      }) {
        counselorUpdates.push(input.update)
        counselorProfile = { ...counselorProfile, ...input.update }
        return counselorProfile
      },
    },
  } as unknown as PrismaClient
  const store = createPrismaDomainStore(prisma)

  const studentSingleField = await store.upsertStudentProfile('student-user-1', {
    educationLevel: '11',
  })
  assert.equal(studentSingleField.educationLevel, '11')
  assert.equal(studentSingleField.schoolName, 'Konkourix Academy')

  const studentMultipleFields = await store.upsertStudentProfile('student-user-1', {
    educationLevel: '12',
    schoolName: 'New School',
  })
  assert.equal(studentMultipleFields.educationLevel, '12')
  assert.equal(studentMultipleFields.schoolName, 'New School')

  const studentExplicitNull = await store.upsertStudentProfile('student-user-1', {
    schoolName: null,
  })
  assert.equal(studentExplicitNull.educationLevel, '12')
  assert.equal(studentExplicitNull.schoolName, null)

  const studentTrack = await store.upsertStudentProfile('student-user-1', {
    track: 'HUMANITIES',
  })
  assert.equal(studentTrack.track, 'HUMANITIES')

  const counselorSingleField = await store.upsertCounselorProfile('counselor-user-1', {
    bio: 'Updated bio',
  })
  assert.equal(counselorSingleField.bio, 'Updated bio')
  assert.equal(counselorSingleField.specialization, 'Exam planning')

  const counselorMultipleFields = await store.upsertCounselorProfile('counselor-user-1', {
    bio: 'Second bio',
    specialization: 'Study skills',
  })
  assert.equal(counselorMultipleFields.bio, 'Second bio')
  assert.equal(counselorMultipleFields.specialization, 'Study skills')

  const counselorExplicitNull = await store.upsertCounselorProfile('counselor-user-1', {
    bio: null,
  })
  assert.equal(counselorExplicitNull.bio, null)
  assert.equal(counselorExplicitNull.specialization, 'Study skills')

  assert.deepEqual(studentUpdates, [
    { educationLevel: '11' },
    { educationLevel: '12', schoolName: 'New School' },
    { schoolName: null },
    { track: 'HUMANITIES' },
  ])
  assert.deepEqual(counselorUpdates, [
    { bio: 'Updated bio' },
    { bio: 'Second bio', specialization: 'Study skills' },
    { bio: null },
  ])
})

test('counselor student store scopes list and detail queries to active assignments', async () => {
  const counselorId = '10000000-0000-4000-8000-000000000001'
  const studentProfileId = '30000000-0000-4000-8000-000000000001'
  const listQueries: unknown[] = []
  const detailQueries: unknown[] = []
  const trackQueries: unknown[] = []
  const profile = {
    id: studentProfileId,
    track: 'MATHEMATICS',
    educationLevel: 'دوازدهم',
    schoolName: 'دبیرستان نمونه',
    user: { status: 'ACTIVE' },
  }
  const prisma = {
    studentProfile: {
      async findMany(input: unknown) {
        listQueries.push(input)
        return [profile]
      },
      async findFirst(input: unknown) {
        if (
          typeof input === 'object'
          && input !== null
          && 'select' in input
          && typeof input.select === 'object'
          && input.select !== null
          && 'track' in input.select
          && Object.keys(input.select).length === 1
        ) {
          trackQueries.push(input)
          return { track: profile.track }
        }
        detailQueries.push(input)
        return profile
      },
    },
  } as unknown as PrismaClient
  const store = createPrismaDomainStore(prisma)

  const list = await store.listAssignedStudents(counselorId, { limit: 25 })
  const detail = await store.findAssignedStudent(counselorId, studentProfileId)
  const track = await store.findAssignedStudentTrack(counselorId, studentProfileId)

  assert.deepEqual(list, {
    items: [{
      id: studentProfileId,
      displayName: null,
      educationLevel: 'دوازدهم',
      schoolName: 'دبیرستان نمونه',
      status: 'ACTIVE',
    }],
    nextCursor: null,
  })
  assert.deepEqual(detail, list.items[0])
  assert.deepEqual(track, { track: 'MATHEMATICS' })
  assert.deepEqual(listQueries, [{
    cursor: undefined,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      educationLevel: true,
      schoolName: true,
      user: { select: { status: true } },
    },
    skip: undefined,
    take: 26,
    where: {
      user: {
        studentRelationships: {
          some: { counselorId, status: 'ACTIVE' },
        },
      },
    },
  }])
  assert.deepEqual(detailQueries, [{
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
  }])
  assert.deepEqual(trackQueries, [{
    select: { track: true },
    where: {
      id: studentProfileId,
      user: {
        studentRelationships: {
          some: { counselorId, status: 'ACTIVE' },
        },
      },
    },
  }])
})
