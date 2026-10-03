import { createHash } from 'node:crypto'
import { reconcileCurriculumIdentityRegistry } from './identity-registry.js'
import {
  CURRICULUM_CATALOG_FORMAT_VERSION,
  type CurriculumBaseCompilation,
  type CurriculumCatalogArtifact,
  type CurriculumCatalogCompilation,
  type CurriculumCatalogEntry,
  type CurriculumCatalogManifest,
  type CurriculumCatalogManifestEntry,
  type CurriculumCatalogRootItem,
  type CurriculumCatalogUnresolvedItem,
  type CurriculumIdentityCandidate,
  type CurriculumIdentityKind,
  type CurriculumIdentityRegistry,
  type CurriculumRepresentation,
  type CurriculumSourceNode,
} from './types.js'

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex')

const catalogKinds = new Set<CurriculumIdentityKind>(['CATALOG_ENTRY', 'CATALOG_GROUP'])

const fingerprint = (value: unknown): string => sha256(JSON.stringify(value))

const representationNodes = (
  base: CurriculumBaseCompilation,
  representationId: string,
): readonly CurriculumSourceNode[] =>
  base.artifact.nodes.filter((node) => node.representationId === representationId)

const structuralSignature = (
  base: CurriculumBaseCompilation,
  representationId: string,
): string => {
  const nodes = representationNodes(base, representationId)
  const indexById = new Map(nodes.map((node, index) => [node.id, index]))
  return JSON.stringify(nodes.map((node) => ({
    rawLabel: node.rawLabel,
    depth: node.depth,
    parentIndex: node.parentId === null ? null : indexById.get(node.parentId),
    sourceMarker: node.sourceMarker,
    headingMetadata: node.headingMetadata ?? null,
  })))
}

const descendantsIncludingRoots = (
  base: CurriculumBaseCompilation,
  rootIds: readonly string[],
): readonly string[] => {
  const childrenByParent = new Map<string, string[]>()
  for (const node of base.artifact.nodes) {
    if (!node.parentId) continue
    const children = childrenByParent.get(node.parentId) ?? []
    children.push(node.id)
    childrenByParent.set(node.parentId, children)
  }
  const result: string[] = []
  const visit = (id: string): void => {
    result.push(id)
    for (const childId of childrenByParent.get(id) ?? []) visit(childId)
  }
  for (const rootId of rootIds) visit(rootId)
  return result
}

const rootsAfterSourceHeading = (
  base: CurriculumBaseCompilation,
  representation: CurriculumRepresentation,
): readonly string[] => {
  if (representation.rootNodeIds.length > 1) return representation.rootNodeIds.slice(1)
  const headingId = representation.rootNodeIds[0]
  if (!headingId) return []
  return base.artifact.nodes
    .filter((node) => node.parentId === headingId)
    .map((node) => node.id)
}

const representationForKey = (
  base: CurriculumBaseCompilation,
  key: string,
): CurriculumRepresentation => {
  const id = base.representationIdsByKey.get(key)
  const representation = id
    ? base.artifact.representations.find((candidate) => candidate.id === id)
    : undefined
  if (!representation) throw new Error(`Unknown catalog representation key: ${key}`)
  return representation
}

const rootIdsFor = (
  base: CurriculumBaseCompilation,
  entry: CurriculumCatalogManifestEntry,
  representation: CurriculumRepresentation,
): readonly string[] => {
  if (entry.mountMode === 'ALL_ROOTS') return representation.rootNodeIds
  return rootsAfterSourceHeading(base, representation)
}

const validateManifest = (manifest: CurriculumCatalogManifest): void => {
  if (manifest.formatVersion !== 'konkourx-curriculum-catalog-manifest/v1') {
    throw new Error(`Unsupported catalog manifest: ${manifest.formatVersion}`)
  }
  const trackIds = new Set<string>()
  const entryKeys = new Set<string>()
  for (const track of manifest.tracks) {
    if (trackIds.has(track.id)) throw new Error(`Duplicate catalog track: ${track.id}`)
    trackIds.add(track.id)
  }
  for (const entry of manifest.entries) {
    if (entryKeys.has(entry.key)) throw new Error(`Duplicate catalog entry key: ${entry.key}`)
    entryKeys.add(entry.key)
    if (entry.visibleInTracks.length === 0) {
      throw new Error(`Catalog entry has no visible tracks: ${entry.key}`)
    }
    for (const track of entry.visibleInTracks) {
      if (!trackIds.has(track)) throw new Error(`Unknown visible track ${track} for ${entry.key}`)
    }
    if (entry.mountMode === 'GROUP_ROOTS_AFTER_SOURCE_HEADING') {
      if (!entry.groups?.length) throw new Error(`Grouped catalog entry has no groups: ${entry.key}`)
      const groupKeys = new Set<string>()
      for (const group of entry.groups) {
        if (groupKeys.has(group.key)) throw new Error(`Duplicate catalog group: ${entry.key}/${group.key}`)
        groupKeys.add(group.key)
        if (!entry.representationKeys.includes(group.representationKey)) {
          throw new Error(`Catalog group references an unmounted representation: ${entry.key}/${group.key}`)
        }
      }
    } else if (entry.groups?.length) {
      throw new Error(`Ungrouped catalog entry defines groups: ${entry.key}`)
    }
  }
  for (const track of manifest.tracks) {
    for (const key of track.entryKeys) {
      const entry = manifest.entries.find((candidate) => candidate.key === key)
      if (!entry) throw new Error(`Track ${track.id} references unknown entry ${key}`)
      if (!entry.visibleInTracks.includes(track.id)) {
        throw new Error(`Track ${track.id} references invisible entry ${key}`)
      }
    }
  }
}

const catalogCandidates = (
  manifest: CurriculumCatalogManifest,
): readonly CurriculumIdentityCandidate[] => {
  const candidates: CurriculumIdentityCandidate[] = []
  for (const entry of manifest.entries) {
    const logicalKey = `catalog-entry/${entry.key}`
    candidates.push({
      kind: 'CATALOG_ENTRY',
      prefix: 'ce',
      logicalKey,
      fingerprint: fingerprint({
        logicalKey,
        title: entry.title,
        kind: entry.kind,
        visibleInTracks: entry.visibleInTracks,
        representationKeys: entry.representationKeys,
        mountMode: entry.mountMode,
      }),
    })
    for (const group of entry.groups ?? []) {
      const groupLogicalKey = `${logicalKey}/group/${group.key}`
      candidates.push({
        kind: 'CATALOG_GROUP',
        prefix: 'cm',
        logicalKey: groupLogicalKey,
        fingerprint: fingerprint({
          logicalKey: groupLogicalKey,
          label: group.label,
          representationKey: group.representationKey,
        }),
      })
    }
  }
  return candidates
}

const equivalenceMismatch = (
  base: CurriculumBaseCompilation,
  entry: CurriculumCatalogManifestEntry,
): boolean => {
  if (!entry.equivalence) return false
  const evidence = representationForKey(base, entry.equivalence.evidenceRepresentationKey)
  if (evidence.sourceHeading !== entry.equivalence.evidenceRawLabel) return true
  return entry.equivalence.pairs.some((pair) => {
    const canonical = representationForKey(base, pair.canonicalRepresentationKey)
    const comparison = representationForKey(base, pair.comparisonRepresentationKey)
    return structuralSignature(base, canonical.id) !== structuralSignature(base, comparison.id)
  })
}

export const compileCurriculumCatalog = (
  base: CurriculumBaseCompilation,
  manifest: CurriculumCatalogManifest,
  registry: CurriculumIdentityRegistry,
): CurriculumCatalogCompilation => {
  validateManifest(manifest)
  for (const entry of manifest.entries) {
    for (const key of entry.representationKeys) representationForKey(base, key)
  }
  for (const item of manifest.unresolvedInventory) {
    for (const key of item.representationKeys) representationForKey(base, key)
  }

  const resolution = reconcileCurriculumIdentityRegistry(
    registry,
    catalogCandidates(manifest),
    catalogKinds,
  )
  const ids = resolution.idsByLogicalKey
  const entries: CurriculumCatalogEntry[] = []
  const unresolvedInventory: CurriculumCatalogUnresolvedItem[] = manifest.unresolvedInventory.map(
    (item) => ({
      key: item.key,
      title: item.title,
      representationIds: item.representationKeys.map(
        (key) => representationForKey(base, key).id,
      ),
      resolutionStatus: item.resolutionStatus,
      ambiguityCodes: item.ambiguityCodes,
      provenance: item.provenance,
    }),
  )

  for (const manifestEntry of manifest.entries) {
    if (equivalenceMismatch(base, manifestEntry)) {
      const equivalence = manifestEntry.equivalence!
      if (equivalence.mismatchPolicy === 'FATAL') {
        throw new Error(`${manifestEntry.key}: ${equivalence.mismatchCode}`)
      }
      unresolvedInventory.push({
        key: manifestEntry.key,
        title: manifestEntry.title,
        representationIds: [
          ...manifestEntry.representationKeys,
          ...equivalence.pairs.map((pair) => pair.comparisonRepresentationKey),
          equivalence.evidenceRepresentationKey,
        ].map((key) => representationForKey(base, key).id),
        resolutionStatus: 'AMBIGUOUS',
        ambiguityCodes: [equivalence.mismatchCode],
        provenance: manifestEntry.provenance,
      })
      continue
    }

    const representations = manifestEntry.representationKeys.map(
      (key) => representationForKey(base, key),
    )
    let rootItems: readonly CurriculumCatalogRootItem[]
    if (manifestEntry.mountMode === 'GROUP_ROOTS_AFTER_SOURCE_HEADING') {
      rootItems = (manifestEntry.groups ?? []).map((group) => {
        const representation = representationForKey(base, group.representationKey)
        const groupId = ids.get(`catalog-entry/${manifestEntry.key}/group/${group.key}`)
        if (!groupId) throw new Error(`Missing catalog group identity: ${manifestEntry.key}/${group.key}`)
        return {
          itemKind: 'GROUP' as const,
          id: groupId,
          label: group.label,
          selectable: false as const,
          childNodeIds: rootsAfterSourceHeading(base, representation),
          provenance: group.provenance,
        }
      })
    } else {
      rootItems = representations.flatMap((representation) =>
        rootIdsFor(base, manifestEntry, representation).map((nodeId) => ({
          itemKind: 'NODE' as const,
          nodeId,
        })),
      )
    }

    const mountedRootIds = rootItems.flatMap((item) =>
      item.itemKind === 'NODE' ? [item.nodeId] : item.childNodeIds,
    )
    const mountedNodeIds = new Set(descendantsIncludingRoots(base, mountedRootIds))
    const entryId = ids.get(`catalog-entry/${manifestEntry.key}`)
    if (!entryId) throw new Error(`Missing catalog entry identity: ${manifestEntry.key}`)
    entries.push({
      id: entryId,
      key: manifestEntry.key,
      title: manifestEntry.title,
      kind: manifestEntry.kind,
      visibleInTracks: manifestEntry.visibleInTracks,
      representationIds: representations.map(({ id }) => id),
      rootItems,
      nodeCount: mountedNodeIds.size,
      resolutionStatus: manifestEntry.resolutionStatus,
      ambiguityCodes: manifestEntry.ambiguityCodes,
      provenance: manifestEntry.provenance,
    })
  }

  const entriesByKey = new Map(entries.map((entry) => [entry.key, entry]))
  const tracks = manifest.tracks.map(({ entryKeys, ...track }) => ({
    ...track,
    entryIds: entryKeys.flatMap((key) => {
      const entry = entriesByKey.get(key)
      return entry ? [entry.id] : []
    }),
  }))
  const manifestSha256 = sha256(JSON.stringify(manifest))
  const payload: Omit<CurriculumCatalogArtifact, 'payloadSha256'> = {
    formatVersion: CURRICULUM_CATALOG_FORMAT_VERSION,
    source: {
      basePayloadSha256: base.artifact.payloadSha256,
      manifestSha256,
      identityRegistrySha256: resolution.registry.payloadSha256,
    },
    counts: {
      trackCount: tracks.length,
      resolvedEntryCount: entries.length,
      groupCount: entries.reduce(
        (count, entry) => count + entry.rootItems.filter(({ itemKind }) => itemKind === 'GROUP').length,
        0,
      ),
      unresolvedInventoryCount: unresolvedInventory.length,
    },
    tracks,
    entries,
    unresolvedInventory,
  }
  const artifact: CurriculumCatalogArtifact = {
    ...payload,
    payloadSha256: sha256(JSON.stringify(payload)),
  }
  return { artifact, identityRegistry: resolution.registry }
}

export const serializeCurriculumCatalogArtifact = (
  artifact: CurriculumCatalogArtifact,
): string => `${JSON.stringify(artifact, null, 2)}\n`
