import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from '../src/app.js'
import type { AuthService } from '../src/auth/auth-service.js'
import type { PublicUser } from '../src/auth/types.js'
import { canonicalCurriculumStore } from '../src/curriculum/artifact.js'
import type { CurriculumTrackId } from '../src/curriculum/types.js'
import { createDomainService, type DomainStore } from '../src/domain/domain-service.js'
import type { StudentProfileRecord } from '../src/domain/types.js'
import { ApiError } from '../src/errors/api-error.js'

const timestamp = new Date('2026-10-03T00:00:00.000Z')
const ids = {
  experimentalUser: '10000000-0000-4000-8000-000000000001',
  mathematicsUser: '10000000-0000-4000-8000-000000000002',
  humanitiesUser: '10000000-0000-4000-8000-000000000003',
  nullTrackUser: '10000000-0000-4000-8000-000000000004',
  counselorA: '20000000-0000-4000-8000-000000000001',
  counselorB: '20000000-0000-4000-8000-000000000002',
  admin: '30000000-0000-4000-8000-000000000001',
  experimentalProfile: '40000000-0000-4000-8000-000000000001',
  mathematicsProfile: '40000000-0000-4000-8000-000000000002',
  humanitiesProfile: '40000000-0000-4000-8000-000000000003',
  nullTrackProfile: '40000000-0000-4000-8000-000000000004',
  unassignedProfile: '40000000-0000-4000-8000-000000000005',
} as const

const user = (id: string, role: PublicUser['role']): PublicUser => ({
  id,
  email: `${id}@example.com`,
  phone: null,
  role,
  status: 'ACTIVE',
  createdAt: timestamp,
  updatedAt: timestamp,
})

const usersByToken = new Map<string, PublicUser>([
  ['experimental', user(ids.experimentalUser, 'STUDENT')],
  ['mathematics', user(ids.mathematicsUser, 'STUDENT')],
  ['humanities', user(ids.humanitiesUser, 'STUDENT')],
  ['null-track', user(ids.nullTrackUser, 'STUDENT')],
  ['counselor-a', user(ids.counselorA, 'COUNSELOR')],
  ['counselor-b', user(ids.counselorB, 'COUNSELOR')],
  ['admin', user(ids.admin, 'ADMIN')],
])

const profile = (
  id: string,
  userId: string,
  track: CurriculumTrackId | null,
): StudentProfileRecord => ({
  id,
  userId,
  track,
  educationLevel: null,
  schoolName: null,
  createdAt: timestamp,
  updatedAt: timestamp,
})

const profiles = new Map<string, StudentProfileRecord>([
  [ids.experimentalUser, profile(ids.experimentalProfile, ids.experimentalUser, 'EXPERIMENTAL')],
  [ids.mathematicsUser, profile(ids.mathematicsProfile, ids.mathematicsUser, 'MATHEMATICS')],
  [ids.humanitiesUser, profile(ids.humanitiesProfile, ids.humanitiesUser, 'HUMANITIES')],
  [ids.nullTrackUser, profile(ids.nullTrackProfile, ids.nullTrackUser, null)],
])

const auth: AuthService = {
  authenticateAccessToken: async (token) => {
    const actor = usersByToken.get(token)
    if (!actor) throw new ApiError(401, 'TOKEN_INVALID', 'Access token is invalid')
    return actor
  },
  changePassword: async () => undefined,
  getCurrentUser: async () => { throw new Error('unused') },
  login: async () => { throw new Error('unused') },
  logout: async () => undefined,
  logoutAll: async () => undefined,
  refresh: async () => { throw new Error('unused') },
  register: async () => { throw new Error('unused') },
}

const store: DomainStore = {
  findUserById: async (id) => {
    const found = [...usersByToken.values()].find((candidate) => candidate.id === id)
    return found ? { id: found.id, role: found.role, status: found.status } : null
  },
  findStudentProfile: async (userId) => profiles.get(userId) ?? null,
  upsertStudentProfile: async () => { throw new Error('unused') },
  findCounselorProfile: async () => null,
  upsertCounselorProfile: async () => { throw new Error('unused') },
  listStudentRelationships: async () => [],
  listCounselorRelationships: async () => [],
  createRelationship: async () => { throw new Error('unused') },
  updateRelationship: async () => null,
  listAssignedStudents: async () => ({ items: [], nextCursor: null }),
  findAssignedStudent: async (counselorId, studentProfileId) => {
    if (counselorId !== ids.counselorA) return null
    if (studentProfileId === ids.experimentalProfile) {
      return {
        id: ids.experimentalProfile,
        displayName: null,
        educationLevel: null,
        schoolName: null,
        status: 'ACTIVE',
      }
    }
    if (studentProfileId === ids.nullTrackProfile) {
      return {
        id: ids.nullTrackProfile,
        displayName: null,
        educationLevel: null,
        schoolName: null,
        status: 'ACTIVE',
      }
    }
    return null
  },
  findAssignedStudentTrack: async (counselorId, studentProfileId) => {
    if (counselorId !== ids.counselorA) return null
    if (studentProfileId === ids.experimentalProfile) return { track: 'EXPERIMENTAL' }
    if (studentProfileId === ids.nullTrackProfile) return { track: null }
    return null
  },
}

const createApp = () => buildApp({
  auth,
  curriculum: canonicalCurriculumStore,
  domain: createDomainService(store),
  environment: 'test',
  logger: false,
  prisma: { $queryRaw: async () => [{ '?column?': 1 }] },
})

const get = (
  app: ReturnType<typeof createApp>,
  token: string,
  url: string,
) => app.inject({
  headers: { authorization: `Bearer ${token}` },
  method: 'GET',
  url,
})

const catalogIds = (track: CurriculumTrackId) =>
  canonicalCurriculumStore.listTrackCatalog(track).map(({ id }) => id)

const membershipFixtures = {
  experimentalEntry: 'ce_55d06a5d7a2d09d942be0c6654dec89b',
  humanitiesOnlyEntry: 'ce_812893cdbdb0ff4073ef148b765f237c',
  nodeFromAnotherEntry: 'cn_68aa84a496a95888152d143bb1f0f5b1',
} as const

test('Student Curriculum derives every canonical track from the authenticated profile', async () => {
  const app = createApp()

  for (const [token, track] of [
    ['experimental', 'EXPERIMENTAL'],
    ['mathematics', 'MATHEMATICS'],
    ['humanities', 'HUMANITIES'],
  ] as const) {
    const response = await get(app, token, '/api/v1/student/curriculum/catalog')
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.json().data.map(({ id }: { id: string }) => id), catalogIds(track))
  }

  const entry = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')[0]!
  const root = canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id)
    .find((candidate) => candidate.itemKind === 'NODE')!
  assert.equal(root.itemKind, 'NODE')
  if (root.itemKind !== 'NODE') return

  for (const url of [
    `/api/v1/student/curriculum/catalog/${entry.id}`,
    `/api/v1/student/curriculum/catalog/${entry.id}/roots`,
    `/api/v1/student/curriculum/catalog/${entry.id}/nodes/${root.nodeId}`,
    `/api/v1/student/curriculum/catalog/${entry.id}/nodes/${root.nodeId}/children`,
    '/api/v1/student/curriculum/search?q=درس',
  ]) {
    const response = await get(app, 'experimental', url)
    assert.equal(response.statusCode, 200, url)
  }

  await app.close()
})

test('Student Curriculum ignores caller track input and reports an unset authoritative track', async () => {
  const app = createApp()

  const spoofed = await get(
    app,
    'experimental',
    '/api/v1/student/curriculum/catalog?track=HUMANITIES',
  )
  assert.equal(spoofed.statusCode, 200)
  assert.deepEqual(
    spoofed.json().data.map(({ id }: { id: string }) => id),
    catalogIds('EXPERIMENTAL'),
  )

  const unset = await get(app, 'null-track', '/api/v1/student/curriculum/catalog')
  assert.equal(unset.statusCode, 409)
  assert.equal(unset.json().error.code, 'STUDENT_TRACK_NOT_SET')

  await app.close()
})

test('Student Curriculum hides entries outside the authoritative track and nodes outside the selected entry', async () => {
  const app = createApp()

  const otherTrackEntry = await get(
    app,
    'experimental',
    `/api/v1/student/curriculum/catalog/${membershipFixtures.humanitiesOnlyEntry}`,
  )
  assert.equal(otherTrackEntry.statusCode, 404)
  assert.equal(otherTrackEntry.json().error.code, 'CURRICULUM_CATALOG_ENTRY_NOT_FOUND')

  const otherEntryNode = await get(
    app,
    'experimental',
    `/api/v1/student/curriculum/catalog/${membershipFixtures.experimentalEntry}/nodes/${membershipFixtures.nodeFromAnotherEntry}`,
  )
  assert.equal(otherEntryNode.statusCode, 404)
  assert.equal(otherEntryNode.json().error.code, 'CURRICULUM_CATALOG_NODE_NOT_FOUND')

  await app.close()
})

test('Counselor Curriculum uses the assigned Student profile track for the full contract', async () => {
  const app = createApp()
  const base = `/api/v1/counselor/students/${ids.experimentalProfile}/curriculum`
  const catalog = await get(app, 'counselor-a', `${base}/catalog?track=HUMANITIES`)
  assert.equal(catalog.statusCode, 200)
  assert.deepEqual(
    catalog.json().data.map(({ id }: { id: string }) => id),
    catalogIds('EXPERIMENTAL'),
  )

  const entry = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')[0]!
  const root = canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id)
    .find((candidate) => candidate.itemKind === 'NODE')!
  assert.equal(root.itemKind, 'NODE')
  if (root.itemKind !== 'NODE') return

  for (const url of [
    `${base}/catalog/${entry.id}`,
    `${base}/catalog/${entry.id}/roots`,
    `${base}/catalog/${entry.id}/nodes/${root.nodeId}`,
    `${base}/catalog/${entry.id}/nodes/${root.nodeId}/children`,
    `${base}/search?q=درس`,
  ]) {
    const response = await get(app, 'counselor-a', url)
    assert.equal(response.statusCode, 200, url)
  }

  await app.close()
})

test('Counselor Curriculum preserves assignment hiding and null-track errors', async () => {
  const app = createApp()

  for (const [token, studentId] of [
    ['counselor-a', ids.unassignedProfile],
    ['counselor-b', ids.experimentalProfile],
  ] as const) {
    const response = await get(
      app,
      token,
      `/api/v1/counselor/students/${studentId}/curriculum/catalog`,
    )
    assert.equal(response.statusCode, 404)
    assert.equal(response.json().error.code, 'STUDENT_NOT_FOUND')
  }

  const unset = await get(
    app,
    'counselor-a',
    `/api/v1/counselor/students/${ids.nullTrackProfile}/curriculum/catalog`,
  )
  assert.equal(unset.statusCode, 409)
  assert.equal(unset.json().error.code, 'STUDENT_TRACK_NOT_SET')

  const studentLeak = await get(
    app,
    'experimental',
    `/api/v1/counselor/students/${ids.experimentalProfile}/curriculum/catalog`,
  )
  assert.equal(studentLeak.statusCode, 403)
  assert.equal(studentLeak.json().error.code, 'ROLE_FORBIDDEN')

  await app.close()
})

test('Counselor Curriculum enforces the assigned Student track and selected-entry node membership', async () => {
  const app = createApp()
  const base = `/api/v1/counselor/students/${ids.experimentalProfile}/curriculum/catalog`

  const otherTrackEntry = await get(
    app,
    'counselor-a',
    `${base}/${membershipFixtures.humanitiesOnlyEntry}`,
  )
  assert.equal(otherTrackEntry.statusCode, 404)
  assert.equal(otherTrackEntry.json().error.code, 'CURRICULUM_CATALOG_ENTRY_NOT_FOUND')

  const otherEntryNode = await get(
    app,
    'counselor-a',
    `${base}/${membershipFixtures.experimentalEntry}/nodes/${membershipFixtures.nodeFromAnotherEntry}`,
  )
  assert.equal(otherEntryNode.statusCode, 404)
  assert.equal(otherEntryNode.json().error.code, 'CURRICULUM_CATALOG_NODE_NOT_FOUND')

  await app.close()
})

test('generic explicit-track Curriculum routes are ADMIN-only', async () => {
  const app = createApp()

  for (const url of [
    '/api/v1/curriculum/tracks',
    '/api/v1/curriculum/tracks/HUMANITIES/catalog',
  ]) {
    for (const token of ['experimental', 'counselor-a']) {
      const response = await get(app, token, url)
      assert.equal(response.statusCode, 403, `${token}: ${url}`)
      assert.equal(response.json().error.code, 'ROLE_FORBIDDEN')
    }

    const admin = await get(app, 'admin', url)
    assert.equal(admin.statusCode, 200, url)
  }

  await app.close()
})
