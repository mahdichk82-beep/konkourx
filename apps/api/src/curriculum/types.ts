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
