export const CURRICULUM_FORMAT_VERSION = 'konkourx-canonical-curriculum/v1' as const

export type CurriculumSourceHeadingMetadata = {
  prefix: string
}

export type CurriculumScope = {
  id: string
  rawLabel: string
  sourceLocator: string
  sourceOrder: number
  gradePlacementIds: readonly string[]
}

export type CurriculumGradePlacement = {
  id: string
  scopeId: string
  rawLabel: string
  sourceLocator: string
  sourceOrder: number
  subjectPlacementIds: readonly string[]
}

export type CurriculumSubjectPlacement = {
  id: string
  scopeId: string
  gradePlacementId: string
  rawLabel: string
  sourceLocator: string
  sourceOrder: number
}

export type CurriculumRepresentation = {
  id: string
  sourceHeading: string
  sourceLocator: string
  sourceOrder: number
  sourceEntryCount: number
  nodeCount: number
  rootNodeIds: readonly string[]
}

export type CurriculumSourceNode = {
  id: string
  representationId: string
  parentId: string | null
  rawLabel: string
  sourceOrder: number
  depth: number
  sourceLocator: string
  sourceMarker: string | null
  childrenCount: number
  headingMetadata?: CurriculumSourceHeadingMetadata
}

export type CurriculumArtifact = {
  formatVersion: typeof CURRICULUM_FORMAT_VERSION
  source: {
    authoritativeDocxSha256: string
    canonicalMarkdownSha256: string
    highLevelTreeSha256: string
    detailedSourceTreeSha256: string
  }
  counts: {
    scopeCount: number
    gradePlacementCount: number
    subjectPlacementCount: number
    representationCount: number
    detailedEntryCount: number
    detailedNodeCount: number
  }
  scopes: readonly CurriculumScope[]
  gradePlacements: readonly CurriculumGradePlacement[]
  subjectPlacements: readonly CurriculumSubjectPlacement[]
  representations: readonly CurriculumRepresentation[]
  nodes: readonly CurriculumSourceNode[]
  payloadSha256: string
}

export type CurriculumPage<T> = {
  items: readonly T[]
  limit: number
  offset: number
  total: number
}

export type CurriculumIdentityKind =
  | 'SCOPE'
  | 'GRADE'
  | 'PLACEMENT'
  | 'REPRESENTATION'
  | 'NODE'
  | 'CATALOG_ENTRY'
  | 'CATALOG_GROUP'

export type CurriculumIdentityStatus = 'ACTIVE' | 'RETIRED'

export type CurriculumIdentityCandidate = {
  kind: CurriculumIdentityKind
  prefix: string
  logicalKey: string
  fingerprint: string
}

export type CurriculumIdentityRecord = CurriculumIdentityCandidate & {
  id: string
  generation: number
  status: CurriculumIdentityStatus
}

export type CurriculumIdentityRegistry = {
  formatVersion: 'konkourx-curriculum-identities/v1'
  records: readonly CurriculumIdentityRecord[]
  payloadSha256: string
}

export type CurriculumIdentityResolution = {
  registry: CurriculumIdentityRegistry
  idsByLogicalKey: ReadonlyMap<string, string>
}

export type CurriculumBaseCompilation = {
  artifact: CurriculumArtifact
  identityRegistry: CurriculumIdentityRegistry
  representationIdsByKey: ReadonlyMap<string, string>
  nodeIdsByKey: ReadonlyMap<string, string>
}

export const CURRICULUM_CATALOG_FORMAT_VERSION = 'konkourx-curriculum-catalog/v1' as const

export type CurriculumTrackId = 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES'

export type CurriculumTrack = {
  id: CurriculumTrackId
  title: string
  sourceOrder: number
}

export type CurriculumCatalogTrack = CurriculumTrack & {
  entryIds: readonly string[]
}

export type CurriculumCatalogEntryKind = 'BOOK_BASED' | 'THEMATIC'
export type CurriculumCatalogResolutionStatus = 'RESOLVED' | 'AMBIGUOUS' | 'UNRESOLVED'
export type CurriculumMountMode =
  | 'ALL_ROOTS'
  | 'ROOTS_AFTER_SOURCE_HEADING'
  | 'GROUP_ROOTS_AFTER_SOURCE_HEADING'

export type CurriculumProvenance = {
  kind: 'SOURCE_REPRESENTATION' | 'SOURCE_STATEMENT' | 'PRODUCT_OWNER_APPROVAL'
  reference: string
}

export type CurriculumCatalogRootItem =
  | {
      itemKind: 'NODE'
      nodeId: string
    }
  | {
      itemKind: 'GROUP'
      id: string
      label: string
      selectable: false
      childNodeIds: readonly string[]
      provenance: readonly CurriculumProvenance[]
    }

export type CurriculumCatalogEntry = {
  id: string
  key: string
  title: string
  kind: CurriculumCatalogEntryKind
  visibleInTracks: readonly CurriculumTrackId[]
  representationIds: readonly string[]
  rootItems: readonly CurriculumCatalogRootItem[]
  nodeCount: number
  resolutionStatus: CurriculumCatalogResolutionStatus
  ambiguityCodes: readonly string[]
  provenance: readonly CurriculumProvenance[]
}

export type CurriculumCatalogUnresolvedItem = {
  key: string
  title: string
  representationIds: readonly string[]
  resolutionStatus: 'AMBIGUOUS' | 'UNRESOLVED'
  ambiguityCodes: readonly string[]
  provenance: readonly CurriculumProvenance[]
}

export type CurriculumCatalogArtifact = {
  formatVersion: typeof CURRICULUM_CATALOG_FORMAT_VERSION
  source: {
    basePayloadSha256: string
    manifestSha256: string
    identityRegistrySha256: string
  }
  counts: {
    trackCount: number
    resolvedEntryCount: number
    groupCount: number
    unresolvedInventoryCount: number
  }
  tracks: readonly CurriculumCatalogTrack[]
  entries: readonly CurriculumCatalogEntry[]
  unresolvedInventory: readonly CurriculumCatalogUnresolvedItem[]
  payloadSha256: string
}

export type CurriculumCatalogManifestGroup = {
  key: string
  label: string
  representationKey: string
  provenance: readonly CurriculumProvenance[]
}

export type CurriculumCatalogEquivalence = {
  evidenceRepresentationKey: string
  evidenceRawLabel: string
  pairs: readonly {
    canonicalRepresentationKey: string
    comparisonRepresentationKey: string
  }[]
  mismatchPolicy: 'QUARANTINE' | 'FATAL'
  mismatchCode: string
}

export type CurriculumCatalogManifestEntry = {
  key: string
  title: string
  kind: CurriculumCatalogEntryKind
  visibleInTracks: readonly CurriculumTrackId[]
  representationKeys: readonly string[]
  mountMode: CurriculumMountMode
  groups?: readonly CurriculumCatalogManifestGroup[]
  resolutionStatus: 'RESOLVED'
  ambiguityCodes: readonly string[]
  provenance: readonly CurriculumProvenance[]
  equivalence?: CurriculumCatalogEquivalence
}

export type CurriculumCatalogManifestUnresolvedItem = {
  key: string
  title: string
  representationKeys: readonly string[]
  resolutionStatus: 'AMBIGUOUS' | 'UNRESOLVED'
  ambiguityCodes: readonly string[]
  provenance: readonly CurriculumProvenance[]
}

export type CurriculumCatalogManifest = {
  formatVersion: 'konkourx-curriculum-catalog-manifest/v1'
  tracks: readonly (CurriculumTrack & { entryKeys: readonly string[] })[]
  entries: readonly CurriculumCatalogManifestEntry[]
  unresolvedInventory: readonly CurriculumCatalogManifestUnresolvedItem[]
}

export type CurriculumCatalogCompilation = {
  artifact: CurriculumCatalogArtifact
  identityRegistry: CurriculumIdentityRegistry
}

export type CurriculumCatalogBreadcrumbSegment = {
  kind: 'TRACK' | 'ENTRY' | 'GROUP' | 'NODE'
  id: string
  label: string
}

export type CurriculumCatalogNodeView = CurriculumSourceNode & {
  trackId: CurriculumTrackId
  entryId: string
  breadcrumb: readonly CurriculumCatalogBreadcrumbSegment[]
  ambiguityCodes: readonly string[]
}

export type CurriculumCatalogSearchResult = CurriculumCatalogNodeView

export type CurriculumTrackSearchQuery = {
  track: CurriculumTrackId
  q: string
  limit: number
  offset: number
}
