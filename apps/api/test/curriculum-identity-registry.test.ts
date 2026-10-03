import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createCurriculumIdentityRegistry,
  reconcileCurriculumIdentityRegistry,
} from '../src/curriculum/identity-registry.js'
import type {
  CurriculumIdentityCandidate,
  CurriculumIdentityKind,
  CurriculumIdentityRecord,
} from '../src/curriculum/types.js'

const managed = new Set<CurriculumIdentityKind>(['NODE'])

const candidate = (
  logicalKey: string,
  fingerprint = `fingerprint:${logicalKey}`,
): CurriculumIdentityCandidate => ({
  kind: 'NODE',
  prefix: 'cn',
  logicalKey,
  fingerprint,
})

const record = (
  logicalKey: string,
  id: string,
  overrides: Partial<CurriculumIdentityRecord> = {},
): CurriculumIdentityRecord => ({
  ...candidate(logicalKey),
  id,
  generation: 0,
  status: 'ACTIVE',
  ...overrides,
})

test('preserves an active identity across unrelated additions', () => {
  const previous = createCurriculumIdentityRegistry([record('node:a', 'cn_existing')])
  const result = reconcileCurriculumIdentityRegistry(
    previous,
    [candidate('node:a'), candidate('node:b')],
    managed,
  )

  assert.equal(result.idsByLogicalKey.get('node:a'), 'cn_existing')
  assert.match(result.idsByLogicalKey.get('node:b') ?? '', /^cn_[0-9a-f]{32}$/)
  assert.deepEqual(result.registry.records[0], record('node:a', 'cn_existing'))
  assert.equal(result.registry.records[1]?.generation, 0)
  assert.equal(result.registry.records[1]?.status, 'ACTIVE')
})

test('retires a changed fingerprint and assigns a new ID', () => {
  const previous = createCurriculumIdentityRegistry([record('node:a', 'cn_existing')])
  const result = reconcileCurriculumIdentityRegistry(
    previous,
    [candidate('node:a', 'fingerprint:changed')],
    managed,
  )

  assert.deepEqual(result.registry.records[0], {
    ...record('node:a', 'cn_existing'),
    status: 'RETIRED',
  })
  assert.equal(result.registry.records[1]?.logicalKey, 'node:a')
  assert.equal(result.registry.records[1]?.fingerprint, 'fingerprint:changed')
  assert.equal(result.registry.records[1]?.generation, 1)
  assert.equal(result.registry.records[1]?.status, 'ACTIVE')
  assert.notEqual(result.registry.records[1]?.id, 'cn_existing')
})

test('tombstones removed identities without touching unmanaged kinds', () => {
  const unmanagedRecord: CurriculumIdentityRecord = {
    kind: 'CATALOG_ENTRY',
    prefix: 'ce',
    logicalKey: 'entry:shared-persian',
    fingerprint: 'entry:fingerprint',
    id: 'ce_existing',
    generation: 0,
    status: 'ACTIVE',
  }
  const previous = createCurriculumIdentityRegistry([
    record('node:removed', 'cn_removed'),
    unmanagedRecord,
  ])
  const result = reconcileCurriculumIdentityRegistry(previous, [], managed)

  assert.deepEqual(result.registry.records, [
    { ...record('node:removed', 'cn_removed'), status: 'RETIRED' },
    unmanagedRecord,
  ])
  assert.deepEqual(
    [...result.idsByLogicalKey],
    [['entry:shared-persian', 'ce_existing']],
  )
})

test('never reuses a tombstoned ID when an identical concept returns', () => {
  const previous = createCurriculumIdentityRegistry([
    record('node:returning', 'cn_tombstone', { status: 'RETIRED' }),
  ])
  const result = reconcileCurriculumIdentityRegistry(
    previous,
    [candidate('node:returning')],
    managed,
  )

  assert.equal(result.registry.records[0]?.id, 'cn_tombstone')
  assert.equal(result.registry.records[0]?.status, 'RETIRED')
  assert.equal(result.registry.records[1]?.generation, 1)
  assert.equal(result.registry.records[1]?.status, 'ACTIVE')
  assert.notEqual(result.registry.records[1]?.id, 'cn_tombstone')
})

test('produces deterministic IDs and rejects duplicate keys or IDs', () => {
  const empty = createCurriculumIdentityRegistry([])
  const candidates = [candidate('node:b'), candidate('node:a')]
  const first = reconcileCurriculumIdentityRegistry(empty, candidates, managed)
  const second = reconcileCurriculumIdentityRegistry(empty, candidates, managed)

  assert.deepEqual(first.registry, second.registry)
  assert.throws(
    () => reconcileCurriculumIdentityRegistry(empty, [candidate('node:a'), candidate('node:a')], managed),
    /duplicate identity candidate/i,
  )

  const duplicateIds = createCurriculumIdentityRegistry([
    record('node:a', 'cn_duplicate'),
    record('node:b', 'cn_duplicate'),
  ])
  assert.throws(
    () => reconcileCurriculumIdentityRegistry(duplicateIds, [], managed),
    /duplicate identity ID/i,
  )
})
