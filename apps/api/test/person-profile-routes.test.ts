import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from '../src/app.js'
import type { AuthService } from '../src/auth/auth-service.js'
import type { PublicUser } from '../src/auth/types.js'
import { createDomainService, type DomainStore } from '../src/domain/domain-service.js'
import type { PersonProfileInput, PersonProfileRecord } from '../src/domain/types.js'
import { ApiError } from '../src/errors/api-error.js'

const timestamp = new Date('2026-10-05T00:00:00.000Z')
const users = {
  student: {
    id: '10000000-0000-4000-8000-000000000001',
    email: 'student@example.com',
    phone: null,
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  counselor: {
    id: '10000000-0000-4000-8000-000000000002',
    email: 'counselor@example.com',
    phone: null,
    role: 'COUNSELOR',
    status: 'ACTIVE',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
} satisfies Record<string, PublicUser>

const createAuth = (): AuthService => ({
  authenticateAccessToken: async (token) => {
    const user = users[token as keyof typeof users]
    if (!user) throw new ApiError(401, 'TOKEN_INVALID', 'Access token is invalid')
    return user
  },
  changePassword: async () => undefined,
  getCurrentUser: async () => { throw new Error('not used') },
  login: async () => { throw new Error('not used') },
  logout: async () => undefined,
  logoutAll: async () => undefined,
  refresh: async () => { throw new Error('not used') },
  register: async () => ({
    accessToken: 'access-token',
    expiresIn: 900,
    refreshToken: 'refresh-token',
    user: users.student,
  }),
})

const createStore = () => {
  const personProfiles = new Map<string, PersonProfileRecord>()
  let personProfileWrites = 0
  const store = {
    findUserById: async (id: string) => {
      const user = Object.values(users).find((candidate) => candidate.id === id)
      return user ? { id: user.id, role: user.role, status: user.status } : null
    },
    findPersonProfile: async (userId: string) => personProfiles.get(userId) ?? null,
    upsertPersonProfile: async (userId: string, input: PersonProfileInput) => {
      personProfileWrites += 1
      const current = personProfiles.get(userId)
      const profile: PersonProfileRecord = {
        id: current?.id ?? `profile-${personProfiles.size + 1}`,
        userId,
        firstName: input.firstName === undefined ? current?.firstName ?? null : input.firstName,
        lastName: input.lastName === undefined ? current?.lastName ?? null : input.lastName,
        preferredName: input.preferredName === undefined ? current?.preferredName ?? null : input.preferredName,
        province: input.province === undefined ? current?.province ?? null : input.province,
        city: input.city === undefined ? current?.city ?? null : input.city,
        createdAt: current?.createdAt ?? timestamp,
        updatedAt: timestamp,
      }
      personProfiles.set(userId, profile)
      return profile
    },
    findStudentProfile: async () => null,
    upsertStudentProfile: async (userId: string, input: { track?: 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES' | null; educationLevel?: string | null; schoolName?: string | null }) => ({
      id: 'student-profile-1', userId, track: input.track ?? null,
      educationLevel: input.educationLevel ?? null, schoolName: input.schoolName ?? null,
      createdAt: timestamp, updatedAt: timestamp,
    }),
    findCounselorProfile: async () => null,
    upsertCounselorProfile: async (userId: string, input: { bio?: string | null; specialization?: string | null }) => ({
      id: 'counselor-profile-1', userId, bio: input.bio ?? null,
      specialization: input.specialization ?? null, createdAt: timestamp, updatedAt: timestamp,
    }),
    listStudentRelationships: async () => [],
    listCounselorRelationships: async () => [],
    createRelationship: async () => { throw new Error('not used') },
    updateRelationship: async () => null,
    listAssignedStudents: async () => ({ items: [], nextCursor: null }),
    findAssignedStudent: async () => null,
    findAssignedStudentTrack: async () => null,
  } as unknown as DomainStore

  return {
    personProfiles,
    personProfileWrites: () => personProfileWrites,
    store,
  }
}

const createApp = (store: DomainStore) => buildApp({
  auth: createAuth(),
  domain: createDomainService(store),
  environment: 'test',
  logger: false,
  prisma: { $queryRaw: async () => [{ '?column?': 1 }] },
})

const authorized = (
  app: ReturnType<typeof createApp>,
  token: keyof typeof users,
  method: 'GET' | 'PATCH',
  payload?: unknown,
) => app.inject({
  headers: { authorization: `Bearer ${token}` },
  method,
  payload,
  url: '/api/v1/me/person-profile',
})

test('authenticated GET returns an intentional null state without creating a row', async () => {
  const fixture = createStore()
  const app = createApp(fixture.store)

  const response = await authorized(app, 'student', 'GET')

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data, null)
  assert.equal(fixture.personProfileWrites(), 0)
  assert.equal(fixture.personProfiles.size, 0)
  await app.close()
})

test('Student PATCH creates only the authenticated User person profile', async () => {
  const fixture = createStore()
  const app = createApp(fixture.store)

  const response = await authorized(app, 'student', 'PATCH', {
    firstName: '  علی  ', lastName: '  احمدی ', province: ' تهران ', city: ' ری ',
  })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json().data, {
    id: 'profile-1', userId: users.student.id,
    firstName: 'علی', lastName: 'احمدی', preferredName: null,
    province: 'تهران', city: 'ری',
    createdAt: timestamp.toISOString(), updatedAt: timestamp.toISOString(),
  })
  assert.equal(fixture.personProfiles.has(users.student.id), true)
  assert.equal(fixture.personProfiles.has(users.counselor.id), false)
  await app.close()
})

test('PATCH updates supplied values, preserves omitted fields, and clears explicit nulls', async () => {
  const fixture = createStore()
  fixture.personProfiles.set(users.student.id, {
    id: 'profile-1', userId: users.student.id,
    firstName: 'Ali', lastName: 'Ahmadi', preferredName: null,
    province: 'Tehran', city: 'Rey', createdAt: timestamp, updatedAt: timestamp,
  })
  const app = createApp(fixture.store)

  const response = await authorized(app, 'student', 'PATCH', {
    preferredName: ' Arman ', city: null,
  })

  assert.equal(response.statusCode, 200)
  assert.equal(response.json().data.firstName, 'Ali')
  assert.equal(response.json().data.lastName, 'Ahmadi')
  assert.equal(response.json().data.province, 'Tehran')
  assert.equal(response.json().data.preferredName, 'Arman')
  assert.equal(response.json().data.city, null)
  await app.close()
})

test('Counselor can independently create and read their own private person profile', async () => {
  const fixture = createStore()
  const app = createApp(fixture.store)

  const patched = await authorized(app, 'counselor', 'PATCH', { preferredName: 'مشاور' })
  const fetched = await authorized(app, 'counselor', 'GET')

  assert.equal(patched.statusCode, 200)
  assert.equal(fetched.statusCode, 200)
  assert.equal(fetched.json().data.userId, users.counselor.id)
  assert.equal(fetched.json().data.preferredName, 'مشاور')
  assert.equal(fixture.personProfiles.has(users.student.id), false)
  await app.close()
})

test('client-supplied userId cannot mutate another User profile', async () => {
  const fixture = createStore()
  const app = createApp(fixture.store)

  const response = await authorized(app, 'student', 'PATCH', {
    firstName: 'Intruder', userId: users.counselor.id,
  })

  assert.equal(response.statusCode, 400)
  assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  assert.equal(fixture.personProfiles.size, 0)
  await app.close()
})

test('person profile routes reject unauthenticated access', async () => {
  const fixture = createStore()
  const app = createApp(fixture.store)

  for (const method of ['GET', 'PATCH'] as const) {
    const response = await app.inject({ method, url: '/api/v1/me/person-profile' })
    assert.equal(response.statusCode, 401)
    assert.equal(response.json().error.code, 'TOKEN_MISSING')
  }
  await app.close()
})

test('no arbitrary User person-profile lookup endpoint is exposed', async () => {
  const fixture = createStore()
  const app = createApp(fixture.store)

  const response = await app.inject({
    headers: { authorization: 'Bearer counselor' },
    method: 'GET',
    url: `/api/v1/users/${users.student.id}/person-profile`,
  })

  assert.equal(response.statusCode, 404)
  await app.close()
})

test('existing StudentProfile and CounselorProfile routes retain their behavior', async () => {
  const fixture = createStore()
  const app = createApp(fixture.store)

  const student = await app.inject({
    headers: { authorization: 'Bearer student' }, method: 'PATCH',
    payload: { track: 'HUMANITIES', educationLevel: '12' },
    url: '/api/v1/me/student-profile',
  })
  const counselor = await app.inject({
    headers: { authorization: 'Bearer counselor' }, method: 'PATCH',
    payload: { bio: 'Bio', specialization: 'Planning' },
    url: '/api/v1/me/counselor-profile',
  })

  assert.equal(student.statusCode, 200)
  assert.equal(student.json().data.track, 'HUMANITIES')
  assert.equal(counselor.statusCode, 200)
  assert.equal(counselor.json().data.specialization, 'Planning')
  assert.equal(fixture.personProfiles.size, 0)
  await app.close()
})

test('registration remains valid without creating a PersonProfile', async () => {
  const fixture = createStore()
  const app = createApp(fixture.store)

  const response = await app.inject({
    method: 'POST',
    payload: { email: 'new-student@example.com', password: 'Password123!', track: 'EXPERIMENTAL' },
    url: '/api/v1/auth/register',
  })

  assert.equal(response.statusCode, 201)
  assert.equal(fixture.personProfiles.size, 0)
  assert.equal(fixture.personProfileWrites(), 0)
  await app.close()
})
