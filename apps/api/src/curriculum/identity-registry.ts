import { createHash } from 'node:crypto'
import type {
  CurriculumIdentityCandidate,
  CurriculumIdentityKind,
  CurriculumIdentityRecord,
  CurriculumIdentityRegistry,
  CurriculumIdentityResolution,
} from './types.js'

const IDENTITY_FORMAT_VERSION = 'konkourx-curriculum-identities/v1' as const
const IDENTITY_NAMESPACE = 'konkourx-curriculum-identity/v1'

const registryPayloadSha256 = (records: readonly CurriculumIdentityRecord[]): string =>
  createHash('sha256')
    .update(JSON.stringify({ formatVersion: IDENTITY_FORMAT_VERSION, records }))
    .digest('hex')

export const createCurriculumIdentityRegistry = (
  records: readonly CurriculumIdentityRecord[],
): CurriculumIdentityRegistry => ({
  formatVersion: IDENTITY_FORMAT_VERSION,
  records,
  payloadSha256: registryPayloadSha256(records),
})

const allocateId = (candidate: CurriculumIdentityCandidate, generation: number): string => {
  const digest = createHash('sha256')
    .update(
      [
        IDENTITY_NAMESPACE,
        candidate.logicalKey,
        candidate.fingerprint,
        generation.toString(10),
      ].join('\0'),
    )
    .digest('hex')
    .slice(0, 32)
  return `${candidate.prefix}_${digest}`
}

const compareCandidates = (
  left: CurriculumIdentityCandidate,
  right: CurriculumIdentityCandidate,
): number => left.kind.localeCompare(right.kind) || left.logicalKey.localeCompare(right.logicalKey)

const validatePreviousRegistry = (registry: CurriculumIdentityRegistry): void => {
  if (registry.formatVersion !== IDENTITY_FORMAT_VERSION) {
    throw new Error(`Unsupported Curriculum identity registry: ${registry.formatVersion}`)
  }
  if (registry.payloadSha256 !== registryPayloadSha256(registry.records)) {
    throw new Error('Curriculum identity registry payload hash mismatch')
  }

  const ids = new Set<string>()
  const activeKeys = new Set<string>()
  for (const record of registry.records) {
    if (ids.has(record.id)) {
      throw new Error(`Duplicate identity ID: ${record.id}`)
    }
    ids.add(record.id)
    if (!Number.isSafeInteger(record.generation) || record.generation < 0) {
      throw new Error(`Invalid identity generation for ${record.logicalKey}`)
    }
    if (record.status === 'ACTIVE') {
      if (activeKeys.has(record.logicalKey)) {
        throw new Error(`Duplicate active identity key: ${record.logicalKey}`)
      }
      activeKeys.add(record.logicalKey)
    }
  }
}

const validateCandidates = (candidates: readonly CurriculumIdentityCandidate[]): void => {
  const keys = new Set<string>()
  for (const candidate of candidates) {
    if (keys.has(candidate.logicalKey)) {
      throw new Error(`Duplicate identity candidate: ${candidate.logicalKey}`)
    }
    keys.add(candidate.logicalKey)
    if (!candidate.prefix || !candidate.logicalKey || !candidate.fingerprint) {
      throw new Error('Identity candidates require a prefix, logical key, and fingerprint')
    }
  }
}

export const reconcileCurriculumIdentityRegistry = (
  previous: CurriculumIdentityRegistry,
  candidates: readonly CurriculumIdentityCandidate[],
  managedKinds: ReadonlySet<CurriculumIdentityKind>,
): CurriculumIdentityResolution => {
  validatePreviousRegistry(previous)
  validateCandidates(candidates)

  for (const candidate of candidates) {
    if (!managedKinds.has(candidate.kind)) {
      throw new Error(`Candidate kind is not managed: ${candidate.kind}`)
    }
  }

  const candidatesByKey = new Map(candidates.map((candidate) => [candidate.logicalKey, candidate]))
  const existingIds = new Set(previous.records.map((record) => record.id))
  const activeByKey = new Map(
    previous.records
      .filter((record) => record.status === 'ACTIVE')
      .map((record) => [record.logicalKey, record]),
  )
  const generationsByKey = new Map<string, number>()
  for (const record of previous.records) {
    generationsByKey.set(
      record.logicalKey,
      Math.max(generationsByKey.get(record.logicalKey) ?? -1, record.generation),
    )
  }

  const records: CurriculumIdentityRecord[] = previous.records.map((record) => {
    if (record.status === 'RETIRED' || !managedKinds.has(record.kind)) return record
    const candidate = candidatesByKey.get(record.logicalKey)
    if (
      candidate &&
      candidate.kind === record.kind &&
      candidate.prefix === record.prefix &&
      candidate.fingerprint === record.fingerprint
    ) {
      return record
    }
    return { ...record, status: 'RETIRED' }
  })

  for (const candidate of [...candidates].sort(compareCandidates)) {
    const active = activeByKey.get(candidate.logicalKey)
    if (
      active &&
      active.kind === candidate.kind &&
      active.prefix === candidate.prefix &&
      active.fingerprint === candidate.fingerprint
    ) {
      continue
    }
    if (active && !managedKinds.has(active.kind)) {
      throw new Error(`Identity logical key is owned by an unmanaged kind: ${candidate.logicalKey}`)
    }

    const generation = (generationsByKey.get(candidate.logicalKey) ?? -1) + 1
    const id = allocateId(candidate, generation)
    if (existingIds.has(id)) {
      throw new Error(`Identity ID collision: ${id}`)
    }
    existingIds.add(id)
    generationsByKey.set(candidate.logicalKey, generation)
    records.push({ ...candidate, id, generation, status: 'ACTIVE' })
  }

  const registry = createCurriculumIdentityRegistry(records)
  const idsByLogicalKey = new Map<string, string>()
  for (const record of records) {
    if (record.status !== 'ACTIVE') continue
    if (idsByLogicalKey.has(record.logicalKey)) {
      throw new Error(`Duplicate active identity key: ${record.logicalKey}`)
    }
    idsByLogicalKey.set(record.logicalKey, record.id)
  }

  return { registry, idsByLogicalKey }
}
