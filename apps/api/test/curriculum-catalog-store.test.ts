import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalCurriculumArtifact,
  canonicalCurriculumCatalogArtifact,
} from '../src/curriculum/artifact.js'
import { createCurriculumReadStore } from '../src/curriculum/store.js'
import type { CurriculumTrackId } from '../src/curriculum/types.js'

const createStore = () => createCurriculumReadStore(
  structuredClone(canonicalCurriculumArtifact),
  structuredClone(canonicalCurriculumCatalogArtifact),
)

test('catalog store filters exact inventories and preserves shared identities', () => {
  const store = createStore()
  assert.deepEqual(store.listTracks().map(({ id }) => id), [
    'EXPERIMENTAL', 'MATHEMATICS', 'HUMANITIES',
  ])
  assert.deepEqual(store.listTrackCatalog('EXPERIMENTAL').map(({ title }) => title), [
    'فارسی', 'فارسی موضوعی', 'عربی', 'عربی موضوعی', 'دین و زندگی',
    'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'ریاضی', 'ریاضی موضوعی',
    'زیست', 'فیزیک تجربی', 'شیمی',
  ])
  assert.deepEqual(store.listTrackCatalog('MATHEMATICS').map(({ title }) => title), [
    'فارسی', 'فارسی موضوعی', 'عربی', 'عربی موضوعی', 'دین و زندگی',
    'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'ریاضی', 'حسابان', 'هندسه',
    'آمار و احتمال', 'ریاضیات گسسته', 'فیزیک ریاضی', 'شیمی',
  ])
  assert.deepEqual(store.listTrackCatalog('HUMANITIES').map(({ title }) => title), [
    'فارسی', 'فارسی موضوعی', 'عربی انسانی', 'دین و زندگی',
    'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'علوم و فنون ادبی',
    'علوم و فنون ادبی موضوعی', 'جامعه‌شناسی', 'ریاضی و آمار',
    'اقتصاد', 'منطق', 'فلسفه', 'روان‌شناسی', 'تاریخ', 'جغرافیا',
  ])

  const persianIds = (['EXPERIMENTAL', 'MATHEMATICS', 'HUMANITIES'] as CurriculumTrackId[])
    .map((track) => store.listTrackCatalog(track).find(({ title }) => title === 'فارسی')?.id)
  assert.equal(new Set(persianIds).size, 1)
  const experimentalArabic = store.listTrackCatalog('EXPERIMENTAL').find(({ title }) => title === 'عربی')!
  const humanitiesArabic = store.listTrackCatalog('HUMANITIES').find(({ title }) => title === 'عربی انسانی')!
  assert.notEqual(experimentalArabic.id, humanitiesArabic.id)
  assert.throws(
    () => store.getTrackCatalogEntry('HUMANITIES', experimentalArabic.id),
    (error: unknown) => typeof error === 'object' && error !== null
      && 'code' in error && error.code === 'CURRICULUM_CATALOG_ENTRY_NOT_FOUND',
  )
})

test('Humanities Arabic roots and node views retain groups, paths, and arbitrary depth', () => {
  const store = createStore()
  const entry = store.listTrackCatalog('HUMANITIES').find(({ title }) => title === 'عربی انسانی')!
  const roots = store.listCatalogRoots('HUMANITIES', entry.id)
  assert.deepEqual(roots.map((item) => item.itemKind === 'GROUP' ? item.label : ''), [
    'دهم', 'یازدهم', 'دوازدهم',
  ])
  assert.equal(roots.every((item) => item.itemKind === 'GROUP' && item.selectable === false), true)
  const firstGroup = roots[0]!
  assert.equal(firstGroup.itemKind, 'GROUP')
  if (firstGroup.itemKind !== 'GROUP') return
  assert.deepEqual(
    store.getNavigationGroupChildNodeIds('HUMANITIES', firstGroup.id),
    firstGroup.childNodeIds,
  )
  assert.throws(
    () => store.getNavigationGroupChildNodeIds('EXPERIMENTAL', firstGroup.id),
    (error: unknown) => typeof error === 'object' && error !== null
      && 'code' in error && error.code === 'CURRICULUM_NAVIGATION_GROUP_NOT_FOUND',
  )
  const rootNodeId = firstGroup.childNodeIds[0]!
  const rootView = store.getCatalogNode('HUMANITIES', entry.id, rootNodeId)
  assert.deepEqual(rootView.breadcrumb.slice(0, 3).map(({ kind }) => kind), [
    'TRACK', 'ENTRY', 'GROUP',
  ])
  assert.equal(rootView.breadcrumb[2]?.label, 'دهم')

  const children = store.listCatalogChildren(
    'HUMANITIES', entry.id, rootNodeId, { limit: 100, offset: 0 },
  )
  assert.equal(children.items.every(({ parentId }) => parentId === rootNodeId), true)
  const deeper = children.items.find(({ childrenCount }) => childrenCount > 0)
  if (deeper) {
    const deeperChildren = store.listCatalogChildren(
      'HUMANITIES', entry.id, deeper.id, { limit: 100, offset: 0 },
    )
    assert.equal(deeperChildren.items.every(({ parentId }) => parentId === deeper.id), true)
    assert.ok(deeperChildren.items[0]!.breadcrumb.length > rootView.breadcrumb.length)
  }
})

test('track search is deterministic, entry-scoped, and excludes unresolved representations', () => {
  const store = createStore()
  const first = store.searchTrack({ track: 'EXPERIMENTAL', q: '', limit: 10_000, offset: 0 })
  const second = store.searchTrack({ track: 'EXPERIMENTAL', q: '', limit: 10_000, offset: 0 })
  assert.deepEqual(first, second)
  assert.ok(first.total > 0)
  assert.equal(first.items.every(({ trackId }) => trackId === 'EXPERIMENTAL'), true)
  assert.equal(first.items.every(({ breadcrumb }) => breadcrumb[0]?.kind === 'TRACK'
    && breadcrumb[1]?.kind === 'ENTRY'), true)

  const excludedRepresentationIds = new Set(
    canonicalCurriculumCatalogArtifact.unresolvedInventory
      .flatMap(({ representationIds }) => representationIds),
  )
  assert.equal(
    first.items.some(({ representationId }) => excludedRepresentationIds.has(representationId)),
    false,
  )

  const chemistry = store.listTrackCatalog('EXPERIMENTAL').find(({ title }) => title === 'شیمی')!
  const chemistryResult = first.items.find(({ entryId }) => entryId === chemistry.id)
  assert.ok(chemistryResult)
  assert.throws(
    () => store.getCatalogNode('EXPERIMENTAL', chemistry.id, canonicalCurriculumArtifact.nodes[0]!.id),
    (error: unknown) => typeof error === 'object' && error !== null
      && 'code' in error && error.code === 'CURRICULUM_CATALOG_NODE_NOT_FOUND',
  )
})
