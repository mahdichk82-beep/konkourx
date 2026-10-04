import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from '../src/app.js'
import { ApiError } from '../src/errors/api-error.js'
import type { AuthService } from '../src/auth/auth-service.js'
import type { PublicUser } from '../src/auth/types.js'
import { createDomainService, type DomainStore } from '../src/domain/domain-service.js'
import type { CounselorStudentRecord, DomainUser } from '../src/domain/types.js'

const ids = {
  counselorA: '10000000-0000-4000-8000-000000000001',
  counselorB: '10000000-0000-4000-8000-000000000002',
  studentUser: '20000000-0000-4000-8000-000000000001',
  studentA: '30000000-0000-4000-8000-000000000001',
  studentB: '30000000-0000-4000-8000-000000000002',
  studentC: '30000000-0000-4000-8000-000000000003',
  studentD: '30000000-0000-4000-8000-000000000004',
} as const

const timestamp = new Date('2026-09-11T00:00:00.000Z')

const publicUser = (id: string, role: PublicUser['role']): PublicUser => ({
  id,
  email: `${id}@example.com`,
  phone: null,
  role,
  status: 'ACTIVE',
  createdAt: timestamp,
  updatedAt: timestamp,
})

const usersByToken = new Map<string, PublicUser>([
  ['counselor-a', publicUser(ids.counselorA, 'COUNSELOR')],
  ['counselor-b', publicUser(ids.counselorB, 'COUNSELOR')],
  ['student', publicUser(ids.studentUser, 'STUDENT')],
  ['admin', publicUser('40000000-0000-4000-8000-000000000001', 'ADMIN')],
])

const createAuth = (): AuthService => ({
  authenticateAccessToken: async (token) => {
    const user = usersByToken.get(token)
    if (!user) throw new ApiError(401, 'TOKEN_INVALID', 'Access token is invalid')
    return user
  },
  changePassword: async () => undefined,
  getCurrentUser: async () => { throw new Error('not used') },
  login: async () => { throw new Error('not used') },
  logout: async () => undefined,
  logoutAll: async () => undefined,
  refresh: async () => { throw new Error('not used') },
  register: async () => { throw new Error('not used') },
})

const students = new Map<string, CounselorStudentRecord>([
  [ids.studentA, {
    id: ids.studentA,
    displayName: null,
    educationLevel: 'دوازدهم',
    schoolName: 'دبیرستان نمونه',
    status: 'ACTIVE',
  }],
  [ids.studentB, {
    id: ids.studentB,
    displayName: null,
    educationLevel: 'یازدهم',
    schoolName: null,
    status: 'ACTIVE',
  }],
  [ids.studentC, {
    id: ids.studentC,
    displayName: null,
    educationLevel: null,
    schoolName: 'مدرسه دیگر',
    status: 'SUSPENDED',
  }],
  [ids.studentD, {
    id: ids.studentD,
    displayName: null,
    educationLevel: 'دهم',
    schoolName: null,
    status: 'ACTIVE',
  }],
])

const assignments = new Map<string, string[]>([
  [ids.counselorA, [ids.studentA, ids.studentB]],
  [ids.counselorB, [ids.studentC]],
])

const createStore = (): DomainStore => ({
  findUserById: async (id) => {
    const user = [...usersByToken.values()].find((candidate) => candidate.id === id)
    return user ? { id: user.id, role: user.role, status: user.status } : null
  },
  findStudentProfile: async () => null,
  upsertStudentProfile: async () => { throw new Error('not used') },
  findCounselorProfile: async () => null,
  upsertCounselorProfile: async () => { throw new Error('not used') },
  listStudentRelationships: async () => [],
  listCounselorRelationships: async () => [],
  createRelationship: async () => { throw new Error('not used') },
  updateRelationship: async () => null,
  listAssignedStudents: async (counselorId, query) => {
    const assigned = (assignments.get(counselorId) ?? [])
      .map((id) => students.get(id))
      .filter((student): student is CounselorStudentRecord => Boolean(student))
    const start = query.cursor
      ? Math.max(assigned.findIndex((student) => student.id === query.cursor) + 1, 0)
      : 0
    const limit = query.limit ?? 50
    const items = assigned.slice(start, start + limit)
    return {
      items,
      nextCursor: assigned.length > start + limit ? items.at(-1)?.id ?? null : null,
    }
  },
  findAssignedStudent: async (counselorId, studentProfileId) => {
    if (!(assignments.get(counselorId) ?? []).includes(studentProfileId)) return null
    return students.get(studentProfileId) ?? null
  },
})

const createApp = () => buildApp({
  auth: createAuth(),
  domain: createDomainService(createStore()),
  environment: 'test',
  logger: false,
  prisma: { $queryRaw: async () => [{ '?column?': 1 }] },
})

const authorizedGet = (app: ReturnType<typeof createApp>, token: string, url: string) =>
  app.inject({
    headers: { authorization: `Bearer ${token}` },
    method: 'GET',
    url,
  })

test('counselor list returns only students assigned to the authenticated counselor', async () => {
  const app = createApp()

  const counselorAResponse = await authorizedGet(app, 'counselor-a', '/api/v1/counselor/students?limit=1')
  assert.equal(counselorAResponse.statusCode, 200)
  assert.deepEqual(counselorAResponse.json().data, {
    items: [{
      id: ids.studentA,
      displayName: null,
      educationLevel: 'دوازدهم',
      schoolName: 'دبیرستان نمونه',
      status: 'ACTIVE',
    }],
    nextCursor: ids.studentA,
  })

  const counselorBResponse = await authorizedGet(app, 'counselor-b', '/api/v1/counselor/students')
  assert.equal(counselorBResponse.statusCode, 200)
  assert.deepEqual(counselorBResponse.json().data.items.map((student: { id: string }) => student.id), [ids.studentC])
  assert.ok(!counselorBResponse.body.includes(ids.studentA))
  assert.ok(!counselorBResponse.body.includes(ids.studentB))

  const ownershipOverride = await authorizedGet(
    app,
    'counselor-a',
    `/api/v1/counselor/students?counselorId=${ids.counselorB}`,
  )
  assert.equal(ownershipOverride.statusCode, 400)
  assert.equal(ownershipOverride.json().error.code, 'VALIDATION_ERROR')

  await app.close()
})

test('counselor student routes reject student, administrator, and unauthenticated access', async () => {
  const app = createApp()

  for (const token of ['student', 'admin']) {
    const response = await authorizedGet(app, token, '/api/v1/counselor/students')
    assert.equal(response.statusCode, 403)
    assert.equal(response.json().error.code, 'ROLE_FORBIDDEN')
  }

  const unauthenticated = await app.inject({ method: 'GET', url: '/api/v1/counselor/students' })
  assert.equal(unauthenticated.statusCode, 401)
  assert.equal(unauthenticated.json().error.code, 'TOKEN_MISSING')

  await app.close()
})

test('assigned student detail is accessible without sensitive authentication or session fields', async () => {
  const app = createApp()
  const response = await authorizedGet(app, 'counselor-a', `/api/v1/counselor/students/${ids.studentA}`)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json().data, students.get(ids.studentA))
  for (const field of ['track', 'email', 'phone', 'passwordHash', 'sessions', 'refreshToken', 'tokenHash']) {
    assert.equal(Object.hasOwn(response.json().data, field), false)
  }

  await app.close()
})

test('student detail hides unassigned and cross-counselor profiles behind not found', async () => {
  const app = createApp()

  for (const studentId of [ids.studentD, ids.studentC]) {
    const response = await authorizedGet(app, 'counselor-a', `/api/v1/counselor/students/${studentId}`)
    assert.equal(response.statusCode, 404)
    assert.equal(response.json().error.code, 'STUDENT_NOT_FOUND')
  }

  await app.close()
})

test('service scope is derived from the authenticated counselor identity', async () => {
  const requestedCounselorIds: string[] = []
  const store = createStore()
  const originalList = store.listAssignedStudents
  store.listAssignedStudents = async (counselorId, query) => {
    requestedCounselorIds.push(counselorId)
    return originalList(counselorId, query)
  }
  const service = createDomainService(store)
  const actor: DomainUser = { id: ids.counselorA, role: 'COUNSELOR', status: 'ACTIVE' }

  await service.listAssignedStudents(actor, {})
  assert.deepEqual(requestedCounselorIds, [ids.counselorA])
})
