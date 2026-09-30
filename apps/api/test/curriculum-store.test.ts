import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalCurriculumArtifact } from '../src/curriculum/artifact.js'
import {
  createCurriculumReadStore,
  normalizeCurriculumSearch,
} from '../src/curriculum/store.js'

test('read store exposes immutable placements and representations in source order', () => {
  const store = createCurriculumReadStore(structuredClone(canonicalCurriculumArtifact))
  const scopes = store.listScopes()
  const gradePlacements = store.listGradePlacements()

  assert.equal(scopes.length, 4)
  assert.equal(gradePlacements.length, 12)
  assert.equal(Object.isFrozen(scopes), true)
  assert.equal(Object.isFrozen(scopes[0]), true)

  const firstScope = scopes[0]!
  const placements = store.listPlacements({
    scopeId: firstScope.id,
    limit: 100,
    offset: 0,
  })
  assert.equal(placements.total, 21)
  assert.equal(placements.items.every((item) => item.scopeId === firstScope.id), true)

  const representations = store.listRepresentations({ limit: 10, offset: 10 })
  assert.equal(representations.total, 67)
  assert.deepEqual(
    representations.items.map((item) => item.sourceOrder),
    [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  )
})

test('read store resolves nodes, direct children, and unknown IDs', () => {
  const store = createCurriculumReadStore(structuredClone(canonicalCurriculumArtifact))
  const parent = canonicalCurriculumArtifact.nodes.find((node) => node.childrenCount > 0)!
  const children = store.listChildren(parent.id, { limit: 100, offset: 0 })

  assert.equal(store.getNode(parent.id).id, parent.id)
  assert.equal(children.total, parent.childrenCount)
  assert.equal(children.items.every((node) => node.parentId === parent.id), true)
  assert.throws(
    () => store.getNode(`cn_${'0'.repeat(32)}`),
    (error: unknown) =>
      typeof error === 'object'
      && error !== null
      && 'code' in error
      && error.code === 'CURRICULUM_NODE_NOT_FOUND',
  )
})

test('search is normalized, bounded by the caller, raw-label preserving, and deterministic', () => {
  const store = createCurriculumReadStore(structuredClone(canonicalCurriculumArtifact))
  assert.equal(normalizeCurriculumSearch('  كيان  '), 'کیان')

  const first = store.search({ q: 'فیزیک', limit: 7, offset: 0 })
  const second = store.search({ q: 'فیزیک', limit: 7, offset: 0 })
  assert.deepEqual(first, second)
  assert.equal(first.items.length, 7)
  assert.ok(first.total > first.items.length)
  assert.equal(first.items.every((node) => node.rawLabel.includes('فیزیک')), true)
  assert.deepEqual(
    first.items.map((node) => node.sourceOrder),
    [...first.items].map((node) => node.sourceOrder).sort((left, right) => left - right),
  )
})
