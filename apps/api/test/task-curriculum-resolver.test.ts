import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import test from 'node:test'
import { canonicalCurriculumArtifact, canonicalCurriculumStore } from '../src/curriculum/artifact.js'
import { ApiError } from '../src/errors/api-error.js'
import {
  resolveCurriculumSelectionV2,
  resolveCurriculumTargets,
} from '../src/task-curriculum/resolver.js'
import type { CurriculumReadStore } from '../src/curriculum/store.js'

const parent = canonicalCurriculumArtifact.nodes.find((node) => node.childrenCount >= 2)
if (!parent) throw new Error('Canonical Curriculum test fixture requires a parent with two children')
const children = canonicalCurriculumStore.getDirectChildren(parent.id)
const leaf = canonicalCurriculumArtifact.nodes.find((node) => node.childrenCount === 0)
if (!leaf) throw new Error('Canonical Curriculum test fixture requires a leaf')
const placement = canonicalCurriculumArtifact.subjectPlacements[0]
if (!placement) throw new Error('Canonical Curriculum test fixture requires a placement')
const humanitiesArabic = canonicalCurriculumStore
  .listTrackCatalog('HUMANITIES')
  .find(({ title }) => title === 'عربی انسانی')
if (!humanitiesArabic) throw new Error('Canonical Curriculum test fixture requires Humanities Arabic')
const navigationGroup = canonicalCurriculumStore
  .listCatalogRoots('HUMANITIES', humanitiesArabic.id)
  .find((item) => item.itemKind === 'GROUP')
if (!navigationGroup || navigationGroup.itemKind !== 'GROUP') {
  throw new Error('Canonical Curriculum test fixture requires a navigation group')
}

test('task Curriculum resolver supports multiple targets and exact source snapshots', () => {
  const targets = resolveCurriculumTargets(canonicalCurriculumStore, [
    { referenceKind: 'NODE', curriculumRefId: leaf.id, selectionMode: 'EXACT' },
    { referenceKind: 'PLACEMENT', curriculumRefId: placement.id, selectionMode: 'EXACT' },
  ])

  assert.equal(targets.length, 2)
  assert.equal(targets[0]?.items.length, 1)
  assert.equal(targets[0]?.items[0]?.labelSnapshot, leaf.rawLabel)
  assert.equal(targets[0]?.representationIdSnapshot, leaf.representationId)
  assert.equal(targets[1]?.items[0]?.labelSnapshot, placement.rawLabel)
  assert.equal(targets[1]?.representationIdSnapshot, null)
  assert.deepEqual(targets.flatMap((target) => target.items.map((item) => item.position)), [0, 1])
})

test('WHOLE expands only direct children and falls back to the selected leaf', () => {
  const whole = resolveCurriculumTargets(canonicalCurriculumStore, [
    { referenceKind: 'NODE', curriculumRefId: parent.id, selectionMode: 'WHOLE' },
  ])[0]
  assert.deepEqual(
    whole?.items.map((item) => item.curriculumRefId),
    children.map((child) => child.id),
  )
  assert.equal(whole?.items.length, parent.childrenCount)

  const leafWhole = resolveCurriculumTargets(canonicalCurriculumStore, [
    { referenceKind: 'NODE', curriculumRefId: leaf.id, selectionMode: 'WHOLE' },
  ])[0]
  assert.deepEqual(leafWhole?.items.map((item) => item.curriculumRefId), [leaf.id])
})

test('placement WHOLE, invalid references, duplicates, and overlapping expansion are rejected', () => {
  assert.throws(
    () => resolveCurriculumTargets(canonicalCurriculumStore, [
      { referenceKind: 'PLACEMENT', curriculumRefId: placement.id, selectionMode: 'WHOLE' },
    ]),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_PLACEMENT_WHOLE_UNSUPPORTED',
  )
  assert.throws(
    () => resolveCurriculumTargets(canonicalCurriculumStore, [
      { referenceKind: 'NODE', curriculumRefId: 'unknown', selectionMode: 'EXACT' },
    ]),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_NODE_NOT_FOUND',
  )
  assert.throws(
    () => resolveCurriculumTargets(canonicalCurriculumStore, [
      { referenceKind: 'NODE', curriculumRefId: navigationGroup.id, selectionMode: 'EXACT' },
    ]),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_NODE_NOT_FOUND',
  )
  assert.throws(
    () => resolveCurriculumTargets(canonicalCurriculumStore, [
      { referenceKind: 'NODE', curriculumRefId: leaf.id, selectionMode: 'EXACT' },
      { referenceKind: 'NODE', curriculumRefId: leaf.id, selectionMode: 'EXACT' },
    ]),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_TARGET_OVERLAP',
  )
  assert.throws(
    () => resolveCurriculumTargets(canonicalCurriculumStore, [
      { referenceKind: 'NODE', curriculumRefId: parent.id, selectionMode: 'WHOLE' },
      { referenceKind: 'NODE', curriculumRefId: children[0]!.id, selectionMode: 'EXACT' },
    ]),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_TARGET_OVERLAP',
  )
})

const experimentalNodes = canonicalCurriculumStore.searchTrack({
  track: 'EXPERIMENTAL', q: '', limit: 10_000, offset: 0,
}).items
const experimentalLeaf = experimentalNodes.find((node) => node.childrenCount === 0)
if (!experimentalLeaf) throw new Error('Canonical fixture requires an Experimental leaf')
const recursiveRoot = experimentalNodes.find((node) => node.childrenCount > 0
  && canonicalCurriculumStore.getDirectChildren(node.id).some((child) => child.childrenCount > 0))
if (!recursiveRoot) throw new Error('Canonical fixture requires a recursive Experimental root')
const recursiveChild = canonicalCurriculumStore.getDirectChildren(recursiveRoot.id)[0]!

const terminalDescendants = (rootId: string): string[] => {
  const node = canonicalCurriculumStore.getNode(rootId)
  const selectableChildren = canonicalCurriculumStore.getDirectChildren(node.id)
    .filter((child) => canonicalCurriculumStore.isSelectableNodeInTrack('EXPERIMENTAL', child.id))
  return selectableChildren.length === 0
    ? [node.id]
    : selectableChildren.flatMap((child) => terminalDescendants(child.id))
}

test('v2 SUBTREE resolves terminal descendants recursively with leaf fallback and immutable snapshots', () => {
  const [target] = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'EXPERIMENTAL', {
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: recursiveRoot.id, selector: 'SUBTREE' }],
  })
  assert.equal(target?.selectionMode, 'SUBTREE')
  assert.equal(target?.referenceKind, 'NODE')
  assert.equal(target?.curriculumRefId, recursiveRoot.id)
  assert.deepEqual(target?.items.map(({ curriculumRefId }) => curriculumRefId), terminalDescendants(recursiveRoot.id))
  assert.equal(target?.items.some(({ curriculumRefId }) => curriculumRefId === recursiveRoot.id), false)
  assert.equal(target?.items.some(({ curriculumRefId }) => curriculumRefId === recursiveChild.id), false)
  assert.equal(target?.items.every(({ labelSnapshot, pathSnapshot }) => (
    labelSnapshot.length > 0 && pathSnapshot.at(-1) === labelSnapshot
  )), true)

  const [leafTarget] = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'EXPERIMENTAL', {
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: experimentalLeaf.id, selector: 'SUBTREE' }],
  })
  assert.deepEqual(leafTarget?.items.map(({ curriculumRefId }) => curriculumRefId), [experimentalLeaf.id])
})

test('v2 normalization is minimal, idempotent, and independent of selector input order', () => {
  const anotherLeaf = experimentalNodes.find((node) => node.childrenCount === 0
    && !terminalDescendants(recursiveRoot.id).includes(node.id))!
  const selectors = [
    { rootKind: 'NODE' as const, rootId: recursiveChild.id, selector: 'EXACT' as const },
    { rootKind: 'NODE' as const, rootId: anotherLeaf.id, selector: 'EXACT' as const },
    { rootKind: 'NODE' as const, rootId: recursiveRoot.id, selector: 'SUBTREE' as const },
    { rootKind: 'NODE' as const, rootId: recursiveRoot.id, selector: 'SUBTREE' as const },
  ]
  const forward = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'EXPERIMENTAL', {
    version: 2, selectors,
  })
  const reverse = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'EXPERIMENTAL', {
    version: 2, selectors: [...selectors].reverse(),
  })
  assert.deepEqual(reverse, forward)
  assert.deepEqual(new Set(forward.map(({ curriculumRefId }) => curriculumRefId)), new Set([
    recursiveRoot.id, anotherLeaf.id,
  ]))
  assert.equal(new Set(forward.flatMap(({ items }) => items.map(({ curriculumRefId }) => curriculumRefId))).size,
    forward.flatMap(({ items }) => items).length)
})

test('v2 accepts non-terminal EXACT and expands track-scoped groups without persisting wrappers', () => {
  const exactTarget = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'EXPERIMENTAL', {
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: recursiveRoot.id, selector: 'EXACT' }],
  })
  assert.deepEqual(exactTarget[0]?.items.map(({ curriculumRefId }) => curriculumRefId), [recursiveRoot.id])

  const groupTargets = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'HUMANITIES', {
    version: 2,
    selectors: [{ rootKind: 'NAVIGATION_GROUP', rootId: navigationGroup.id, selector: 'SUBTREE' }],
  })
  assert.ok(groupTargets.length > 0)
  assert.equal(groupTargets.every(({ referenceKind, curriculumRefId }) => (
    referenceKind === 'NODE' && curriculumRefId !== navigationGroup.id
  )), true)
  assert.equal(groupTargets.every(({ selectionMode }) => (
    selectionMode === 'EXACT' || selectionMode === 'SUBTREE'
  )), true)
  assert.throws(
    () => resolveCurriculumSelectionV2(canonicalCurriculumStore, 'EXPERIMENTAL', {
      version: 2,
      selectors: [{ rootKind: 'NAVIGATION_GROUP', rootId: navigationGroup.id, selector: 'SUBTREE' }],
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_NAVIGATION_GROUP_NOT_FOUND',
  )
})

test('v2 applies the normalized-root limit after wrapper overlap elimination', () => {
  const coveredDescendants = navigationGroup.childNodeIds
    .flatMap((rootId) => terminalDescendants(rootId))
    .filter((nodeId) => !navigationGroup.childNodeIds.includes(nodeId))
    .slice(0, 43)
  assert.equal(coveredDescendants.length, 43)

  const groupSelector = {
    rootKind: 'NAVIGATION_GROUP' as const,
    rootId: navigationGroup.id,
    selector: 'SUBTREE' as const,
  }
  const selectors = [
    groupSelector,
    ...coveredDescendants.map((rootId) => ({
      rootKind: 'NODE' as const,
      rootId,
      selector: 'EXACT' as const,
    })),
  ]
  assert.equal(selectors.length, 44)

  const expected = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'HUMANITIES', {
    version: 2,
    selectors: [groupSelector],
  })
  const forward = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'HUMANITIES', {
    version: 2,
    selectors,
  })
  const reverse = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'HUMANITIES', {
    version: 2,
    selectors: [...selectors].reverse(),
  })

  assert.equal(expected.length, navigationGroup.childNodeIds.length)
  assert.deepEqual(forward, expected)
  assert.deepEqual(reverse, expected)
})

test('v2 rejects invalid roots, empty groups, and raw or expanded selector sets over 50', () => {
  assert.throws(
    () => resolveCurriculumSelectionV2(canonicalCurriculumStore, 'EXPERIMENTAL', {
      version: 2,
      selectors: [{ rootKind: 'NODE', rootId: 'unknown', selector: 'SUBTREE' }],
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK',
  )
  assert.throws(
    () => resolveCurriculumSelectionV2(canonicalCurriculumStore, 'EXPERIMENTAL', {
      version: 2,
      selectors: Array.from({ length: 51 }, (_, index) => ({
        rootKind: 'NODE' as const, rootId: `${experimentalLeaf.id}-${index}`, selector: 'EXACT' as const,
      })),
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_SELECTOR_LIMIT_EXCEEDED',
  )

  const groupStore = {
    ...canonicalCurriculumStore,
    getNavigationGroupChildNodeIds: (_track: string, id: string) => {
      if (id === 'empty') return []
      return experimentalNodes
        .filter(({ childrenCount }) => childrenCount === 0)
        .slice(0, 51)
        .map(({ id: nodeId }) => nodeId)
    },
  } as CurriculumReadStore
  assert.throws(
    () => resolveCurriculumSelectionV2(groupStore, 'EXPERIMENTAL', {
      version: 2,
      selectors: [{ rootKind: 'NAVIGATION_GROUP', rootId: 'empty', selector: 'SUBTREE' }],
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_SELECTION_EMPTY',
  )
  assert.throws(
    () => resolveCurriculumSelectionV2(groupStore, 'EXPERIMENTAL', {
      version: 2,
      selectors: [{ rootKind: 'NAVIGATION_GROUP', rootId: 'large', selector: 'SUBTREE' }],
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_SELECTOR_LIMIT_EXCEEDED',
  )
})

test('current Experimental 50-root capacity resolves the audited 1,325 unique terminal items', () => {
  const rootIds = [...new Set(canonicalCurriculumStore
    .listTrackCatalog('EXPERIMENTAL')
    .flatMap((entry) => canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id))
    .flatMap((root) => root.itemKind === 'NODE' ? [root.nodeId] : root.childNodeIds))]
  const rootsByCapacity = rootIds
    .map((rootId) => ({ rootId, count: terminalDescendants(rootId).length }))
    .sort((left, right) => right.count - left.count
      || canonicalCurriculumStore.getNode(left.rootId).sourceOrder
        - canonicalCurriculumStore.getNode(right.rootId).sourceOrder
      || left.rootId.localeCompare(right.rootId))
    .slice(0, 50)
  assert.equal(rootsByCapacity.length, 50)

  const startedAt = performance.now()
  const resolved = resolveCurriculumSelectionV2(canonicalCurriculumStore, 'EXPERIMENTAL', {
    version: 2,
    selectors: rootsByCapacity.map(({ rootId }) => ({
      rootKind: 'NODE', rootId, selector: 'SUBTREE',
    })),
  })
  const elapsedMs = performance.now() - startedAt
  const itemIds = resolved.flatMap(({ items }) => items.map(({ curriculumRefId }) => curriculumRefId))

  assert.equal(resolved.length, 50)
  assert.equal(itemIds.length, 1_325)
  assert.equal(new Set(itemIds).size, 1_325)
  assert.ok(elapsedMs < 2_000, `Expected local resolution under 2000ms, received ${elapsedMs}ms`)
})

