import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from '../src/app.js'
import type { AuthService } from '../src/auth/auth-service.js'
import type { PublicUser } from '../src/auth/types.js'
import { canonicalCurriculumArtifact, canonicalCurriculumStore } from '../src/curriculum/artifact.js'

const createUser = (role: PublicUser['role']): PublicUser => ({
  id: `${role.toLowerCase()}-user`,
  email: `${role.toLowerCase()}@example.com`,
  phone: null,
  role,
  status: 'ACTIVE',
  createdAt: new Date('2026-09-30T00:00:00.000Z'),
  updatedAt: new Date('2026-09-30T00:00:00.000Z'),
})

const auth: AuthService = {
  authenticateAccessToken: async (token) => {
    if (token === 'student-token') return createUser('STUDENT')
    if (token === 'counselor-token') return createUser('COUNSELOR')
    if (token === 'admin-token') return createUser('ADMIN')
    throw new Error('invalid token')
  },
  changePassword: async () => undefined,
  getCurrentUser: async () => createUser('STUDENT'),
  login: async () => { throw new Error('unused') },
  logout: async () => undefined,
  logoutAll: async () => undefined,
  refresh: async () => { throw new Error('unused') },
  register: async () => { throw new Error('unused') },
}

const createApp = () => buildApp({
  auth,
  curriculum: canonicalCurriculumStore,
  environment: 'test',
  logger: false,
  prisma: { $queryRaw: async () => [{ '?column?': 1 }] },
})

const get = (app: ReturnType<typeof createApp>, url: string, token = 'student-token') =>
  app.inject({ headers: { authorization: `Bearer ${token}` }, method: 'GET', url })

test('Curriculum routes require authentication and allow every existing role', async () => {
  const app = createApp()
  const anonymous = await app.inject({ method: 'GET', url: '/api/v1/curriculum/scopes' })
  assert.equal(anonymous.statusCode, 401)
  assert.equal(anonymous.json().error.code, 'TOKEN_MISSING')

  for (const token of ['student-token', 'counselor-token', 'admin-token']) {
    const response = await get(app, '/api/v1/curriculum/scopes', token)
    assert.equal(response.statusCode, 200)
    assert.equal(response.json().data.scopeCount, 4)
    assert.equal(response.json().data.gradePlacementCount, 12)
    assert.equal(response.json().data.subjectPlacementCount, 74)
    assert.equal(response.json().data.scopes.length, 4)
  }
  await app.close()
})

test('Curriculum routes expose placements, representations, nodes, children, and search', async () => {
  const app = createApp()
  const firstScope = canonicalCurriculumArtifact.scopes[0]!
  const placements = await get(
    app,
    `/api/v1/curriculum/placements?scopeId=${firstScope.id}&limit=100`,
  )
  assert.equal(placements.statusCode, 200)
  assert.equal(placements.json().data.total, 21)

  const representations = await get(
    app,
    '/api/v1/curriculum/representations?limit=5&offset=15',
  )
  assert.equal(representations.statusCode, 200)
  assert.deepEqual(
    representations.json().data.items.map((item: { sourceHeading: string }) => item.sourceHeading),
    ['فصل ۱ ـ دنیای زنده', 'فصل ۱ ـ تنظیم عصبی', 'فصل ۱ ـ مولکول‌های اطلاعاتی', 'شیمی دهم', 'شیمی یازدهم'],
  )

  const node = canonicalCurriculumArtifact.nodes.find((candidate) => candidate.childrenCount > 0)!
  const read = await get(app, `/api/v1/curriculum/nodes/${node.id}`)
  assert.equal(read.statusCode, 200)
  assert.equal(read.json().data.rawLabel, node.rawLabel)

  const children = await get(app, `/api/v1/curriculum/nodes/${node.id}/children`)
  assert.equal(children.statusCode, 200)
  assert.equal(children.json().data.total, node.childrenCount)

  const search = await get(app, '/api/v1/curriculum/search?q=فیزیک&limit=3')
  assert.equal(search.statusCode, 200)
  assert.equal(search.json().data.items.length, 3)
  assert.equal(search.json().data.items.every(
    (item: { rawLabel: string }) => item.rawLabel.includes('فیزیک'),
  ), true)
  await app.close()
})

test('Curriculum routes reject unknown IDs, unsafe bounds, and all write/admin paths', async () => {
  const app = createApp()
  const unknown = await get(app, `/api/v1/curriculum/nodes/cn_${'0'.repeat(32)}`)
  assert.equal(unknown.statusCode, 404)
  assert.equal(unknown.json().error.code, 'CURRICULUM_NODE_NOT_FOUND')

  for (const url of [
    '/api/v1/curriculum/search?q=',
    `/api/v1/curriculum/search?q=${'x'.repeat(101)}`,
    '/api/v1/curriculum/search?q=test&limit=101',
    '/api/v1/curriculum/placements?offset=10001',
    '/api/v1/curriculum/nodes/not-an-id',
  ]) {
    const response = await get(app, url)
    assert.equal(response.statusCode, 400, url)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  }

  const write = await app.inject({
    headers: { authorization: 'Bearer admin-token' },
    method: 'POST',
    payload: {},
    url: '/api/v1/curriculum/placements',
  })
  assert.equal(write.statusCode, 404)

  const admin = await get(app, '/api/v1/admin/curriculum')
  assert.equal(admin.statusCode, 404)
  await app.close()
})

test('track-scoped Curriculum routes require authentication and allow all reader roles', async () => {
  const app = createApp()
  const humanitiesArabic = canonicalCurriculumStore
    .listTrackCatalog('HUMANITIES')
    .find(({ title }) => title === 'عربی انسانی')!
  const firstRoot = canonicalCurriculumStore
    .listCatalogRoots('HUMANITIES', humanitiesArabic.id)[0]!
  assert.equal(firstRoot.itemKind, 'GROUP')
  if (firstRoot.itemKind !== 'GROUP') return
  const nodeId = firstRoot.childNodeIds[0]!
  const urls = [
    '/api/v1/curriculum/tracks',
    '/api/v1/curriculum/tracks/HUMANITIES/catalog',
    `/api/v1/curriculum/tracks/HUMANITIES/catalog/${humanitiesArabic.id}`,
    `/api/v1/curriculum/tracks/HUMANITIES/catalog/${humanitiesArabic.id}/roots`,
    `/api/v1/curriculum/tracks/HUMANITIES/catalog/${humanitiesArabic.id}/nodes/${nodeId}`,
    `/api/v1/curriculum/tracks/HUMANITIES/catalog/${humanitiesArabic.id}/nodes/${nodeId}/children`,
    '/api/v1/curriculum/tracks/HUMANITIES/search?q=درس',
  ]

  for (const url of urls) {
    const anonymous = await app.inject({ method: 'GET', url })
    assert.equal(anonymous.statusCode, 401, url)
    assert.equal(anonymous.json().error.code, 'TOKEN_MISSING')
    for (const token of ['student-token', 'counselor-token', 'admin-token']) {
      const response = await get(app, url, token)
      assert.equal(response.statusCode, 200, `${token}: ${url}`)
    }
  }

  for (const track of ['EXPERIMENTAL', 'MATHEMATICS', 'HUMANITIES']) {
    const response = await get(app, `/api/v1/curriculum/tracks/${track}/catalog`, 'student-token')
    assert.equal(response.statusCode, 200)
  }
  await app.close()
})

test('track-scoped Curriculum routes filter entries, trees, and search by request context', async () => {
  const app = createApp()
  const experimental = await get(app, '/api/v1/curriculum/tracks/EXPERIMENTAL/catalog')
  assert.deepEqual(experimental.json().data.map(({ title }: { title: string }) => title), [
    'فارسی', 'فارسی موضوعی', 'عربی', 'عربی موضوعی', 'دین و زندگی',
    'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'ریاضی', 'ریاضی موضوعی',
    'زیست', 'فیزیک تجربی', 'شیمی',
  ])
  const mathematics = await get(app, '/api/v1/curriculum/tracks/MATHEMATICS/catalog')
  const humanities = await get(app, '/api/v1/curriculum/tracks/HUMANITIES/catalog')
  const experimentalPersian = experimental.json().data.find(({ title }: { title: string }) => title === 'فارسی')
  const humanitiesPersian = humanities.json().data.find(({ title }: { title: string }) => title === 'فارسی')
  assert.equal(experimentalPersian.id, humanitiesPersian.id)

  const humanitiesArabic = humanities.json().data.find(({ title }: { title: string }) => title === 'عربی انسانی')
  const unavailableArabic = await get(
    app,
    `/api/v1/curriculum/tracks/EXPERIMENTAL/catalog/${humanitiesArabic.id}`,
  )
  assert.equal(unavailableArabic.statusCode, 404)
  assert.equal(unavailableArabic.json().error.code, 'CURRICULUM_CATALOG_ENTRY_NOT_FOUND')

  const mathOnly = mathematics.json().data.find(({ title }: { title: string }) => title === 'حسابان')
  const unavailableMath = await get(
    app,
    `/api/v1/curriculum/tracks/EXPERIMENTAL/catalog/${mathOnly.id}`,
  )
  assert.equal(unavailableMath.statusCode, 404)
  assert.equal(unavailableMath.json().error.code, 'CURRICULUM_CATALOG_ENTRY_NOT_FOUND')

  const search = await get(app, '/api/v1/curriculum/tracks/EXPERIMENTAL/search?q=فصل&limit=100')
  assert.equal(search.statusCode, 200)
  assert.equal(search.json().data.items.every(
    ({ trackId, breadcrumb }: { trackId: string; breadcrumb: { kind: string }[] }) =>
      trackId === 'EXPERIMENTAL' && breadcrumb[0]?.kind === 'TRACK' && breadcrumb[1]?.kind === 'ENTRY',
  ), true)
  await app.close()
})

test('track-scoped Curriculum routes strictly validate track, IDs, pagination, and search', async () => {
  const app = createApp()
  const entry = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')[0]!
  const root = canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id)
    .find((item) => item.itemKind === 'NODE')!
  assert.equal(root.itemKind, 'NODE')
  if (root.itemKind !== 'NODE') return
  for (const url of [
    '/api/v1/curriculum/tracks/UNKNOWN/catalog',
    '/api/v1/curriculum/tracks/EXPERIMENTAL/catalog/not-an-entry',
    `/api/v1/curriculum/tracks/EXPERIMENTAL/catalog/${entry.id}/nodes/not-a-node`,
    `/api/v1/curriculum/tracks/EXPERIMENTAL/catalog/${entry.id}/nodes/${root.nodeId}/children?limit=101`,
    '/api/v1/curriculum/tracks/EXPERIMENTAL/search?q=',
    '/api/v1/curriculum/tracks/EXPERIMENTAL/search?q=test&offset=10001',
  ]) {
    const response = await get(app, url)
    assert.equal(response.statusCode, 400, url)
    assert.equal(response.json().error.code, 'VALIDATION_ERROR')
  }
  await app.close()
})
