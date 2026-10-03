import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import registryJson from '../src/curriculum/generated/canonical-curriculum-identities.v1.json' with { type: 'json' }
import { compileCanonicalCurriculum } from '../src/curriculum/compiler.js'
import {
  compileCurriculumCatalog,
  serializeCurriculumCatalogArtifact,
} from '../src/curriculum/catalog-compiler.js'
import { curriculumCatalogManifest } from '../src/curriculum/catalog-manifest.js'
import type {
  CurriculumBaseCompilation,
  CurriculumCatalogManifest,
  CurriculumIdentityRegistry,
  CurriculumTrackId,
} from '../src/curriculum/types.js'

const canonicalPath = new URL('../../../docs/curriculum/CANONICAL_CURRICULUM.md', import.meta.url)
const catalogArtifactPath = new URL(
  '../src/curriculum/generated/canonical-curriculum-catalog.v1.json',
  import.meta.url,
)
const identityRegistryPath = new URL(
  '../src/curriculum/generated/canonical-curriculum-identities.v1.json',
  import.meta.url,
)

const compileBase = async (): Promise<CurriculumBaseCompilation> => {
  const source = await readFile(canonicalPath, 'utf8')
  return compileCanonicalCurriculum(
    source,
    registryJson as unknown as CurriculumIdentityRegistry,
  )
}

const expectedTitles: Record<CurriculumTrackId, readonly string[]> = {
  EXPERIMENTAL: [
    'فارسی', 'فارسی موضوعی', 'عربی', 'عربی موضوعی', 'دین و زندگی',
    'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'ریاضی', 'ریاضی موضوعی',
    'زیست', 'فیزیک تجربی', 'شیمی',
  ],
  MATHEMATICS: [
    'فارسی', 'فارسی موضوعی', 'عربی', 'عربی موضوعی', 'دین و زندگی',
    'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'ریاضی', 'حسابان', 'هندسه',
    'آمار و احتمال', 'ریاضیات گسسته', 'فیزیک ریاضی', 'شیمی',
  ],
  HUMANITIES: [
    'فارسی', 'فارسی موضوعی', 'عربی انسانی', 'دین و زندگی',
    'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'علوم و فنون ادبی',
    'علوم و فنون ادبی موضوعی', 'جامعه‌شناسی', 'ریاضی و آمار',
    'اقتصاد', 'منطق', 'فلسفه', 'روان‌شناسی', 'تاریخ', 'جغرافیا',
  ],
}

test('catalog exposes the exact ordered inventory for every track', async () => {
  const compilation = compileCurriculumCatalog(
    await compileBase(),
    curriculumCatalogManifest,
    registryJson as unknown as CurriculumIdentityRegistry,
  )
  const entries = new Map(compilation.artifact.entries.map((entry) => [entry.id, entry]))
  for (const track of compilation.artifact.tracks) {
    assert.deepEqual(track.entryIds.map((id) => entries.get(id)?.title), expectedTitles[track.id])
  }
})

test('shared entries retain one identity while Arabic and Physics remain distinct', async () => {
  const { artifact } = compileCurriculumCatalog(
    await compileBase(), curriculumCatalogManifest,
    registryJson as unknown as CurriculumIdentityRegistry,
  )
  const byTitle = (track: CurriculumTrackId, title: string) => {
    const entryIds = artifact.tracks.find(({ id }) => id === track)?.entryIds ?? []
    return artifact.entries.find((entry) => entryIds.includes(entry.id) && entry.title === title)
  }

  assert.equal(byTitle('EXPERIMENTAL', 'فارسی')?.id, byTitle('HUMANITIES', 'فارسی')?.id)
  assert.equal(byTitle('EXPERIMENTAL', 'عربی')?.id, byTitle('MATHEMATICS', 'عربی')?.id)
  assert.notEqual(byTitle('EXPERIMENTAL', 'عربی')?.id, byTitle('HUMANITIES', 'عربی انسانی')?.id)
  assert.notEqual(byTitle('EXPERIMENTAL', 'فیزیک تجربی')?.id, byTitle('MATHEMATICS', 'فیزیک ریاضی')?.id)
})

test('Humanities Arabic uses three non-selectable grade groups over canonical lessons', async () => {
  const base = await compileBase()
  const { artifact } = compileCurriculumCatalog(
    base, curriculumCatalogManifest,
    registryJson as unknown as CurriculumIdentityRegistry,
  )
  const entry = artifact.entries.find(({ title }) => title === 'عربی انسانی')
  assert.ok(entry)
  assert.deepEqual(entry.rootItems.map((item) => item.itemKind), ['GROUP', 'GROUP', 'GROUP'])
  assert.deepEqual(entry.rootItems.map((item) => item.itemKind === 'GROUP' ? item.label : ''), [
    'دهم', 'یازدهم', 'دوازدهم',
  ])
  const canonicalNodeIds = new Set(base.artifact.nodes.map(({ id }) => id))
  for (const item of entry.rootItems) {
    assert.equal(item.itemKind, 'GROUP')
    if (item.itemKind !== 'GROUP') continue
    assert.equal(item.selectable, false)
    assert.ok(item.childNodeIds.length > 0)
    assert.equal(item.childNodeIds.every((id) => canonicalNodeIds.has(id)), true)
  }
})

test('Biology is resolved while sequence-to-grade assignments remain ambiguous', async () => {
  const { artifact } = compileCurriculumCatalog(
    await compileBase(), curriculumCatalogManifest,
    registryJson as unknown as CurriculumIdentityRegistry,
  )
  const biology = artifact.entries.find(({ title }) => title === 'زیست')
  assert.equal(biology?.resolutionStatus, 'RESOLVED')
  assert.deepEqual(biology?.ambiguityCodes, ['BIOLOGY_SEQUENCE_GRADE_ASSIGNMENT_UNRESOLVED'])
  assert.equal(biology?.representationIds.length, 3)
})

test('placement-only and ownership-ambiguous representations stay outside resolved catalogs', async () => {
  const { artifact } = compileCurriculumCatalog(
    await compileBase(), curriculumCatalogManifest,
    registryJson as unknown as CurriculumIdentityRegistry,
  )
  assert.ok(artifact.unresolvedInventory.some(({ key }) => key === 'placement-only-subjects'))
  assert.ok(artifact.unresolvedInventory.some(({ key }) => key === 'standalone-source-markers'))
  const mounted = new Set(artifact.entries.flatMap(({ representationIds }) => representationIds))
  for (const item of artifact.unresolvedInventory) {
    assert.equal(item.representationIds.some((id) => mounted.has(id)), false)
  }
})

test('thematic entries are sibling entries rather than a navigation branch', async () => {
  const { artifact } = compileCurriculumCatalog(
    await compileBase(), curriculumCatalogManifest,
    registryJson as unknown as CurriculumIdentityRegistry,
  )
  const track = artifact.tracks.find(({ id }) => id === 'EXPERIMENTAL')
  assert.ok(track)
  const entries = track.entryIds.map((id) => artifact.entries.find((entry) => entry.id === id)!)
  assert.equal(entries.find(({ title }) => title === 'فارسی موضوعی')?.kind, 'THEMATIC')
  assert.equal(entries.find(({ title }) => title === 'فارسی')?.kind, 'BOOK_BASED')
  assert.equal(entries.every((entry) => entry.rootItems.every((item) => item.itemKind !== 'ENTRY')), true)
})

test('Chemistry shares one identity only when evidence and structure agree', async () => {
  const base = await compileBase()
  const { artifact } = compileCurriculumCatalog(
    base, curriculumCatalogManifest,
    registryJson as unknown as CurriculumIdentityRegistry,
  )
  const chemistry = artifact.entries.find(({ title }) => title === 'شیمی')
  assert.ok(chemistry)
  assert.deepEqual(chemistry.visibleInTracks, ['EXPERIMENTAL', 'MATHEMATICS'])
  assert.equal(chemistry.resolutionStatus, 'RESOLVED')
  assert.equal(artifact.unresolvedInventory.some(({ key }) => key === 'chemistry'), false)

  const invalidEvidenceManifest = structuredClone(
    curriculumCatalogManifest,
  ) as CurriculumCatalogManifest
  const chemistryManifest = invalidEvidenceManifest.entries.find(({ key }) => key === 'chemistry')
  assert.ok(chemistryManifest?.equivalence)
  chemistryManifest.equivalence.evidenceRawLabel = 'unsupported sharing claim'
  const invalidEvidence = compileCurriculumCatalog(
    base,
    invalidEvidenceManifest,
    registryJson as unknown as CurriculumIdentityRegistry,
  ).artifact
  assert.equal(invalidEvidence.entries.some(({ title }) => title === 'شیمی'), false)
  assert.deepEqual(
    invalidEvidence.unresolvedInventory.find(({ key }) => key === 'chemistry')?.ambiguityCodes,
    ['CHEMISTRY_EQUIVALENCE_MISMATCH'],
  )
})

test('Chemistry mismatch is quarantined without aborting other catalogs', async () => {
  const base = await compileBase()
  const comparisonId = base.representationIdsByKey.get('chemistry-10-secondary')
  const nodeIndex = base.artifact.nodes.findIndex(({ representationId }) => representationId === comparisonId)
  assert.notEqual(nodeIndex, -1)
  const nodes = [...base.artifact.nodes]
  nodes[nodeIndex] = { ...nodes[nodeIndex]!, rawLabel: `${nodes[nodeIndex]!.rawLabel} changed` }
  const mismatchedBase = {
    ...base,
    artifact: { ...base.artifact, nodes },
  }
  const { artifact } = compileCurriculumCatalog(
    mismatchedBase,
    structuredClone(curriculumCatalogManifest) as CurriculumCatalogManifest,
    registryJson as unknown as CurriculumIdentityRegistry,
  )

  assert.equal(artifact.entries.some(({ title }) => title === 'شیمی'), false)
  assert.deepEqual(
    artifact.unresolvedInventory.find(({ key }) => key === 'chemistry')?.ambiguityCodes,
    ['CHEMISTRY_EQUIVALENCE_MISMATCH'],
  )
  assert.ok(artifact.entries.some(({ title }) => title === 'زیست'))
  assert.doesNotThrow(() => serializeCurriculumCatalogArtifact(artifact))
})

test('catalog and identity registry generation is byte-for-byte deterministic', async () => {
  const [source, checkedCatalog, checkedRegistry] = await Promise.all([
    readFile(canonicalPath, 'utf8'),
    readFile(catalogArtifactPath, 'utf8'),
    readFile(identityRegistryPath, 'utf8'),
  ])
  const compile = () => {
    const base = compileCanonicalCurriculum(
      source,
      registryJson as unknown as CurriculumIdentityRegistry,
    )
    return compileCurriculumCatalog(
      base,
      curriculumCatalogManifest,
      base.identityRegistry,
    )
  }
  const first = compile()
  const second = compile()
  const firstCatalog = serializeCurriculumCatalogArtifact(first.artifact)
  const secondCatalog = serializeCurriculumCatalogArtifact(second.artifact)
  const firstRegistry = `${JSON.stringify(first.identityRegistry, null, 2)}\n`
  const secondRegistry = `${JSON.stringify(second.identityRegistry, null, 2)}\n`

  assert.equal(firstCatalog, secondCatalog)
  assert.equal(firstRegistry, secondRegistry)
  assert.equal(firstCatalog, checkedCatalog)
  assert.equal(firstRegistry, checkedRegistry)
})
