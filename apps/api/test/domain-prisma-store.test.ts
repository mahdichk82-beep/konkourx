import assert from 'node:assert/strict'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import { createPrismaDomainStore } from '../src/domain/prisma-domain-store.js'
import type {
  CounselorProfileRecord,
  PersonProfileRecord,
  StudentProfileRecord,
} from '../src/domain/types.js'

test('person profile GET is read-only and PATCH preserves omitted fields while clearing nulls', async () => {
  const timestamp = new Date('2026-10-05T00:00:00.000Z')
  let profile: PersonProfileRecord | null = null
  const finds: unknown[] = []
  const upserts: unknown[] = []
  const prisma = {
    personProfile: {
      async findUnique(input: unknown) {
        finds.push(input)
        return profile
      },
      async upsert(input: {
        create: Omit<PersonProfileRecord, 'id' | 'createdAt' | 'updatedAt'>
        update: Partial<Omit<PersonProfileRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
        where: { userId: string }
      }) {
        upserts.push(input)
        profile = {
          id: 'person-profile-1',
          ...input.create,
          ...profile,
          ...input.update,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        return profile
      },
    },
  } as unknown as PrismaClient
  const store = createPrismaDomainStore(prisma)

  assert.equal(await store.findPersonProfile('user-1'), null)
  assert.equal(upserts.length, 0)

  const created = await store.upsertPersonProfile('user-1', {
    firstName: 'Ali', lastName: 'Ahmadi', province: 'Tehran', city: 'Rey',
  })
  const updated = await store.upsertPersonProfile('user-1', {
    preferredName: 'Arman', city: null,
  })

  assert.equal(created.userId, 'user-1')
  assert.equal(updated.firstName, 'Ali')
  assert.equal(updated.lastName, 'Ahmadi')
  assert.equal(updated.province, 'Tehran')
  assert.equal(updated.preferredName, 'Arman')
  assert.equal(updated.city, null)
  assert.deepEqual(finds, [{ where: { userId: 'user-1' } }])
  assert.deepEqual(upserts, [
    {
      create: {
        userId: 'user-1', firstName: 'Ali', lastName: 'Ahmadi',
        preferredName: null, province: 'Tehran', city: 'Rey',
      },
      update: { firstName: 'Ali', lastName: 'Ahmadi', province: 'Tehran', city: 'Rey' },
      where: { userId: 'user-1' },
    },
    {
      create: {
        userId: 'user-1', firstName: null, lastName: null,
        preferredName: 'Arman', province: null, city: null,
      },
      update: { preferredName: 'Arman', city: null },
      where: { userId: 'user-1' },
    },
  ])
})

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
    user: {
      status: 'ACTIVE',
      personProfile: {
        firstName: 'علی',
        lastName: 'احمدی',
        preferredName: 'آرمان',
      },
    },
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
      displayName: 'آرمان',
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
      user: {
        select: {
          status: true,
          personProfile: {
            select: { firstName: true, lastName: true, preferredName: true },
          },
        },
      },
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
  assert.equal(JSON.stringify(listQueries).includes('province'), false)
  assert.equal(JSON.stringify(listQueries).includes('city'), false)
  assert.equal(JSON.stringify(detailQueries).includes('province'), false)
  assert.equal(JSON.stringify(detailQueries).includes('city'), false)
})
