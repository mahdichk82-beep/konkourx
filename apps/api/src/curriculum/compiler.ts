import { createHash } from 'node:crypto'
import {
  createCurriculumIdentityRegistry,
  reconcileCurriculumIdentityRegistry,
} from './identity-registry.js'
import { representationDefinitions } from './representation-definitions.js'
import {
  CURRICULUM_FORMAT_VERSION,
  type CurriculumArtifact,
  type CurriculumBaseCompilation,
  type CurriculumGradePlacement,
  type CurriculumIdentityCandidate,
  type CurriculumIdentityKind,
  type CurriculumIdentityRecord,
  type CurriculumIdentityRegistry,
  type CurriculumRepresentation,
  type CurriculumScope,
  type CurriculumSourceHeadingMetadata,
  type CurriculumSourceNode,
  type CurriculumSubjectPlacement,
} from './types.js'

export const AUTHORITATIVE_DOCX_SHA256 =
  '120f2b80c3ccf825dcb24406dcc328d32bbdfba9fb4f747edf258d047678b948'
export const CANONICAL_MARKDOWN_SHA256 =
  '1576b4f886e13b2829f8e373b6d11ca126837766504a187114e2584c24ea933d'
export const HIGH_LEVEL_TREE_SHA256 =
  '901b1c9bfdb19baa79835bd21cd2dcc6cb445a852bd09c564e333a1a804c76c9'
export const DETAILED_SOURCE_TREE_SHA256 =
  '88864361dc09d6ba47b73b417769c8e01ae6c50db3b13a3396129066a6af3584'

const EXPECTED_SCOPE_COUNT = 4
const EXPECTED_GRADE_PLACEMENT_COUNT = 12
const EXPECTED_SUBJECT_PLACEMENT_COUNT = 74
const EXPECTED_DETAILED_ENTRY_COUNT = 6_588
const EXPECTED_DETAILED_NODE_COUNT = 5_484

// One-based entry locators in the locked SOURCE_TREE block. These boundaries only
// separate source-authored trees; they assign no subject, grade, or scope meaning.
// The three unlabelled Biology sequences start at entries 1629, 1780, and 1940.
const REPRESENTATION_START_ENTRIES = representationDefinitions.map(
  ({ startEntry }) => startEntry,
)

const sha256 = (value: string | Buffer): string =>
  createHash('sha256').update(value).digest('hex')

const stableId = (prefix: string, ...parts: readonly string[]): string =>
  `${prefix}_${sha256(parts.join('\u001f')).slice(0, 32)}`

const normalizeNewlines = (value: string): string => value.replaceAll('\r\n', '\n')

const requiredMatch = (value: string, pattern: RegExp, label: string): string => {
  const match = value.match(pattern)
  if (!match?.[1]) {
    throw new Error(`Canonical Curriculum ${label} is missing`)
  }
  return match[1]
}

const highLevelBlockFrom = (markdown: string): string =>
  requiredMatch(
    markdown,
    /## Official high-level curriculum tree[\s\S]*?```text\nCurriculum\n([\s\S]*?)\n```/,
    'high-level tree',
  )

const detailedBlockFrom = (markdown: string): string =>
  requiredMatch(
    markdown,
    /<!-- SOURCE_TREE_START -->\n([\s\S]*?)\n<!-- SOURCE_TREE_END -->/,
    'detailed source tree',
  )

const parseTreeLine = (sourceText: string): { depth: number; rawLabel: string } | null => {
  if (sourceText.replaceAll('│', '').trim() === '') return null

  let remainder = sourceText
  let indentationDepth = 0
  while (remainder.startsWith('│   ') || remainder.startsWith('    ')) {
    indentationDepth += 1
    remainder = remainder.slice(4)
  }

  if (remainder.startsWith('├── ') || remainder.startsWith('└── ')) {
    return { depth: indentationDepth + 1, rawLabel: remainder.slice(4) }
  }

  return { depth: indentationDepth, rawLabel: remainder }
}

const parseHeadingMetadata = (rawLabel: string): CurriculumSourceHeadingMetadata | undefined => {
  const match = rawLabel.match(/^(فصل|بخش|درس|گفتار|موضوع|Lesson)(?=\s|$)/u)
  return match?.[1] ? { prefix: match[1] } : undefined
}

const parsePlacements = (highLevel: string, sourceHash: string) => {
  const scopes: CurriculumScope[] = []
  const gradePlacements: CurriculumGradePlacement[] = []
  const subjectPlacements: CurriculumSubjectPlacement[] = []
  let currentScope: CurriculumScope | undefined
  let currentGrade: CurriculumGradePlacement | undefined

  for (const [index, sourceText] of highLevel.split('\n').entries()) {
    const parsed = parseTreeLine(sourceText)
    if (!parsed) throw new Error(`Unexpected empty high-level entry at ${index + 1}`)
    const sourceLocator = `CANONICAL_CURRICULUM.md#HIGH_LEVEL:L${String(index + 1).padStart(4, '0')}`

    if (parsed.depth === 1) {
      currentScope = {
        id: stableId('cs', sourceHash, sourceLocator, parsed.rawLabel),
        rawLabel: parsed.rawLabel,
        sourceLocator,
        sourceOrder: scopes.length + 1,
        gradePlacementIds: [],
      }
      scopes.push(currentScope)
      currentGrade = undefined
      continue
    }

    if (parsed.depth === 2) {
      if (!currentScope) throw new Error(`Grade placement without scope at ${sourceLocator}`)
      currentGrade = {
        id: stableId('cg', sourceHash, sourceLocator, parsed.rawLabel),
        scopeId: currentScope.id,
        rawLabel: parsed.rawLabel,
        sourceLocator,
        sourceOrder: gradePlacements.length + 1,
        subjectPlacementIds: [],
      }
      gradePlacements.push(currentGrade)
      ;(currentScope.gradePlacementIds as string[]).push(currentGrade.id)
      continue
    }

    if (parsed.depth === 3) {
      if (!currentScope || !currentGrade) {
        throw new Error(`Subject placement without scope/grade at ${sourceLocator}`)
      }
      const placement: CurriculumSubjectPlacement = {
        id: stableId('cp', sourceHash, sourceLocator, parsed.rawLabel),
        scopeId: currentScope.id,
        gradePlacementId: currentGrade.id,
        rawLabel: parsed.rawLabel,
        sourceLocator,
        sourceOrder: subjectPlacements.length + 1,
      }
      subjectPlacements.push(placement)
      ;(currentGrade.subjectPlacementIds as string[]).push(placement.id)
      continue
    }

    throw new Error(`Unexpected high-level depth ${parsed.depth} at ${sourceLocator}`)
  }

  return { gradePlacements, scopes, subjectPlacements }
}

const parseRepresentations = (detailed: string, sourceHash: string) => {
  const entries = detailed.split('\n')
  const representations: CurriculumRepresentation[] = []
  const nodes: CurriculumSourceNode[] = []
  const nodeIds = new Set<string>()

  for (const [representationIndex, startEntry] of REPRESENTATION_START_ENTRIES.entries()) {
    const endEntry = REPRESENTATION_START_ENTRIES[representationIndex + 1] ?? entries.length + 1
    const firstParsed = parseTreeLine(entries[startEntry - 1] ?? '')
    if (!firstParsed) {
      throw new Error(`Representation ${representationIndex + 1} has no source heading`)
    }

    const representationLocator =
      `CANONICAL_CURRICULUM.md#SOURCE_TREE:L${String(startEntry).padStart(4, '0')}`
    const representationId = stableId(
      'cr',
      sourceHash,
      representationLocator,
      firstParsed.rawLabel,
    )
    const representationNodes: CurriculumSourceNode[] = []
    const latestByDepth = new Map<number, string>()

    for (let entry = startEntry; entry < endEntry; entry += 1) {
      const parsed = parseTreeLine(entries[entry - 1] ?? '')
      if (!parsed) continue

      let parentId: string | null = null
      for (let parentDepth = parsed.depth - 1; parentDepth >= 0; parentDepth -= 1) {
        const candidate = latestByDepth.get(parentDepth)
        if (candidate) {
          parentId = candidate
          break
        }
      }

      const sourceLocator =
        `CANONICAL_CURRICULUM.md#SOURCE_TREE:L${String(entry).padStart(4, '0')}`
      const id = stableId('cn', sourceHash, representationId, sourceLocator, parsed.rawLabel)
      if (nodeIds.has(id)) throw new Error(`Duplicate Curriculum node ID at ${sourceLocator}`)
      nodeIds.add(id)

      const headingMetadata = parseHeadingMetadata(parsed.rawLabel)
      const node: CurriculumSourceNode = {
        id,
        representationId,
        parentId,
        rawLabel: parsed.rawLabel,
        sourceOrder: nodes.length + 1,
        depth: parsed.depth,
        sourceLocator,
        sourceMarker: parsed.rawLabel.includes('⭐') ? '⭐' : null,
        childrenCount: 0,
        ...(headingMetadata ? { headingMetadata } : {}),
      }
      nodes.push(node)
      representationNodes.push(node)

      for (const depth of [...latestByDepth.keys()]) {
        if (depth >= parsed.depth) latestByDepth.delete(depth)
      }
      latestByDepth.set(parsed.depth, id)
    }

    const childrenCountByParent = new Map<string, number>()
    for (const node of representationNodes) {
      if (node.parentId) {
        childrenCountByParent.set(
          node.parentId,
          (childrenCountByParent.get(node.parentId) ?? 0) + 1,
        )
      }
    }
    for (const node of representationNodes) {
      node.childrenCount = childrenCountByParent.get(node.id) ?? 0
    }

    representations.push({
      id: representationId,
      sourceHeading: firstParsed.rawLabel,
      sourceLocator: representationLocator,
      sourceOrder: representationIndex + 1,
      sourceEntryCount: endEntry - startEntry,
      nodeCount: representationNodes.length,
      rootNodeIds: representationNodes
        .filter((node) => node.parentId === null)
        .map((node) => node.id),
    })
  }

  return { detailedEntryCount: entries.length, nodes, representations }
}

const assertProjection = (artifact: Omit<CurriculumArtifact, 'payloadSha256'>): void => {
  const { counts } = artifact
  const expectedCounts = {
    scopeCount: EXPECTED_SCOPE_COUNT,
    gradePlacementCount: EXPECTED_GRADE_PLACEMENT_COUNT,
    subjectPlacementCount: EXPECTED_SUBJECT_PLACEMENT_COUNT,
    representationCount: REPRESENTATION_START_ENTRIES.length,
    detailedEntryCount: EXPECTED_DETAILED_ENTRY_COUNT,
    detailedNodeCount: EXPECTED_DETAILED_NODE_COUNT,
  }
  for (const [name, expected] of Object.entries(expectedCounts)) {
    if (counts[name as keyof typeof counts] !== expected) {
      throw new Error(`Canonical Curriculum ${name} mismatch: expected ${expected}`)
    }
  }

  const nodeById = new Map(artifact.nodes.map((node) => [node.id, node]))
  if (nodeById.size !== artifact.nodes.length) throw new Error('Duplicate Curriculum node IDs')
  const representationById = new Map(
    artifact.representations.map((representation) => [representation.id, representation]),
  )
  if (representationById.size !== artifact.representations.length) {
    throw new Error('Duplicate Curriculum representation IDs')
  }
  const childCounts = new Map<string, number>()

  for (const node of artifact.nodes) {
    if (!node.rawLabel) throw new Error(`Empty Curriculum node label at ${node.sourceLocator}`)
    if (!representationById.has(node.representationId)) {
      throw new Error(`Unknown Curriculum representation at ${node.sourceLocator}`)
    }
    if (node.sourceMarker !== (node.rawLabel.includes('⭐') ? '⭐' : null)) {
      throw new Error(`Invalid source marker at ${node.sourceLocator}`)
    }
    if (!node.parentId) continue
    const parent = nodeById.get(node.parentId)
    if (!parent) throw new Error(`Orphan Curriculum node at ${node.sourceLocator}`)
    if (parent.representationId !== node.representationId) {
      throw new Error(`Cross-representation parent at ${node.sourceLocator}`)
    }

    const seen = new Set<string>([node.id])
    let ancestor: CurriculumSourceNode | undefined = parent
    while (ancestor) {
      if (seen.has(ancestor.id)) throw new Error(`Curriculum cycle at ${node.sourceLocator}`)
      seen.add(ancestor.id)
      ancestor = ancestor.parentId ? nodeById.get(ancestor.parentId) : undefined
    }
    childCounts.set(node.parentId, (childCounts.get(node.parentId) ?? 0) + 1)
  }

  for (const node of artifact.nodes) {
    if (node.childrenCount !== (childCounts.get(node.id) ?? 0)) {
      throw new Error(`Invalid child count at ${node.sourceLocator}`)
    }
  }

  for (const representation of artifact.representations) {
    const representationNodes = artifact.nodes.filter(
      (node) => node.representationId === representation.id,
    )
    if (representationNodes.length !== representation.nodeCount) {
      throw new Error(`Invalid node count for ${representation.sourceLocator}`)
    }
    const rootIds = representationNodes
      .filter((node) => node.parentId === null)
      .map((node) => node.id)
    if (JSON.stringify(rootIds) !== JSON.stringify(representation.rootNodeIds)) {
      throw new Error(`Invalid roots for ${representation.sourceLocator}`)
    }
  }
}

const compileLegacyCanonicalCurriculum = (sourceMarkdown: string): CurriculumArtifact => {
  const markdown = normalizeNewlines(sourceMarkdown)
  const canonicalMarkdownSha256 = sha256(markdown)
  if (canonicalMarkdownSha256 !== CANONICAL_MARKDOWN_SHA256) {
    throw new Error(
      `Canonical Curriculum Markdown hash mismatch: ${canonicalMarkdownSha256}`,
    )
  }

  const highLevel = highLevelBlockFrom(markdown)
  if (sha256(highLevel) !== HIGH_LEVEL_TREE_SHA256) {
    throw new Error('Canonical Curriculum high-level tree hash mismatch')
  }

  const detailed = detailedBlockFrom(markdown)
  if (sha256(detailed) !== DETAILED_SOURCE_TREE_SHA256) {
    throw new Error('Canonical Curriculum detailed tree hash mismatch')
  }

  const placements = parsePlacements(highLevel, canonicalMarkdownSha256)
  const detailedProjection = parseRepresentations(detailed, canonicalMarkdownSha256)
  const payload: Omit<CurriculumArtifact, 'payloadSha256'> = {
    formatVersion: CURRICULUM_FORMAT_VERSION,
    source: {
      authoritativeDocxSha256: AUTHORITATIVE_DOCX_SHA256,
      canonicalMarkdownSha256,
      highLevelTreeSha256: HIGH_LEVEL_TREE_SHA256,
      detailedSourceTreeSha256: DETAILED_SOURCE_TREE_SHA256,
    },
    counts: {
      scopeCount: placements.scopes.length,
      gradePlacementCount: placements.gradePlacements.length,
      subjectPlacementCount: placements.subjectPlacements.length,
      representationCount: detailedProjection.representations.length,
      detailedEntryCount: detailedProjection.detailedEntryCount,
      detailedNodeCount: detailedProjection.nodes.length,
    },
    scopes: placements.scopes,
    gradePlacements: placements.gradePlacements,
    subjectPlacements: placements.subjectPlacements,
    representations: detailedProjection.representations,
    nodes: detailedProjection.nodes,
  }
  assertProjection(payload)

  return {
    ...payload,
    payloadSha256: sha256(JSON.stringify(payload)),
  }
}

type StructuralIdentityProjection = {
  candidates: readonly CurriculumIdentityCandidate[]
  scopeKeys: readonly string[]
  gradeKeys: readonly string[]
  placementKeys: readonly string[]
  representationKeys: readonly string[]
  nodeKeys: readonly string[]
}

const occurrenceSegment = (
  rawLabel: string,
  occurrences: Map<string, number>,
): string => {
  const occurrence = (occurrences.get(rawLabel) ?? 0) + 1
  occurrences.set(rawLabel, occurrence)
  return `${JSON.stringify(rawLabel)}#${occurrence}`
}

const identityFingerprint = (
  kind: CurriculumIdentityKind,
  logicalKey: string,
  rawLabel: string,
): string => sha256(JSON.stringify({ kind, logicalKey, rawLabel }))

const identityCandidate = (
  kind: CurriculumIdentityKind,
  prefix: string,
  logicalKey: string,
  rawLabel: string,
): CurriculumIdentityCandidate => ({
  kind,
  prefix,
  logicalKey,
  fingerprint: identityFingerprint(kind, logicalKey, rawLabel),
})

const structuralIdentityProjection = (
  artifact: CurriculumArtifact,
): StructuralIdentityProjection => {
  const candidates: CurriculumIdentityCandidate[] = []
  const scopeKeys: string[] = []
  const gradeKeys: string[] = []
  const placementKeys: string[] = []
  const representationKeys: string[] = []
  const nodeKeys: string[] = []
  const scopeKeyById = new Map<string, string>()
  const gradeKeyById = new Map<string, string>()
  const representationKeyById = new Map<string, string>()
  const nodeKeyById = new Map<string, string>()

  const scopeOccurrences = new Map<string, number>()
  for (const scope of artifact.scopes) {
    const key = `scope/${occurrenceSegment(scope.rawLabel, scopeOccurrences)}`
    scopeKeys.push(key)
    scopeKeyById.set(scope.id, key)
    candidates.push(identityCandidate('SCOPE', 'cs', key, scope.rawLabel))
  }

  const gradeOccurrencesByScope = new Map<string, Map<string, number>>()
  for (const grade of artifact.gradePlacements) {
    const scopeKey = scopeKeyById.get(grade.scopeId)
    if (!scopeKey) throw new Error(`Missing structural scope for ${grade.sourceLocator}`)
    const occurrences = gradeOccurrencesByScope.get(scopeKey) ?? new Map<string, number>()
    gradeOccurrencesByScope.set(scopeKey, occurrences)
    const key = `${scopeKey}/grade/${occurrenceSegment(grade.rawLabel, occurrences)}`
    gradeKeys.push(key)
    gradeKeyById.set(grade.id, key)
    candidates.push(identityCandidate('GRADE', 'cg', key, grade.rawLabel))
  }

  const placementOccurrencesByGrade = new Map<string, Map<string, number>>()
  for (const placement of artifact.subjectPlacements) {
    const gradeKey = gradeKeyById.get(placement.gradePlacementId)
    if (!gradeKey) throw new Error(`Missing structural grade for ${placement.sourceLocator}`)
    const occurrences = placementOccurrencesByGrade.get(gradeKey) ?? new Map<string, number>()
    placementOccurrencesByGrade.set(gradeKey, occurrences)
    const key = `${gradeKey}/placement/${occurrenceSegment(placement.rawLabel, occurrences)}`
    placementKeys.push(key)
    candidates.push(identityCandidate('PLACEMENT', 'cp', key, placement.rawLabel))
  }

  for (const [index, representation] of artifact.representations.entries()) {
    const definition = representationDefinitions[index]
    if (!definition) throw new Error(`Missing representation definition at index ${index}`)
    const key = `representation/${definition.key}`
    representationKeys.push(key)
    representationKeyById.set(representation.id, key)
    candidates.push(
      identityCandidate('REPRESENTATION', 'cr', key, representation.sourceHeading),
    )
  }

  const siblingOccurrences = new Map<string, Map<string, number>>()
  for (const node of artifact.nodes) {
    const representationKey = representationKeyById.get(node.representationId)
    if (!representationKey) {
      throw new Error(`Missing structural representation for ${node.sourceLocator}`)
    }
    const parentKey = node.parentId ? nodeKeyById.get(node.parentId) : representationKey
    if (!parentKey) throw new Error(`Missing structural parent for ${node.sourceLocator}`)
    const occurrences = siblingOccurrences.get(parentKey) ?? new Map<string, number>()
    siblingOccurrences.set(parentKey, occurrences)
    const key = `${parentKey}/node/${occurrenceSegment(node.rawLabel, occurrences)}`
    nodeKeys.push(key)
    nodeKeyById.set(node.id, key)
    candidates.push(identityCandidate('NODE', 'cn', key, node.rawLabel))
  }

  return {
    candidates,
    scopeKeys,
    gradeKeys,
    placementKeys,
    representationKeys,
    nodeKeys,
  }
}

const baseEntityKinds = new Set<CurriculumIdentityKind>([
  'SCOPE',
  'GRADE',
  'PLACEMENT',
  'REPRESENTATION',
  'NODE',
])

export const bootstrapCurriculumIdentityRegistry = (
  sourceMarkdown: string,
  legacyArtifact: CurriculumArtifact,
): CurriculumIdentityRegistry => {
  const compiledLegacyArtifact = compileLegacyCanonicalCurriculum(sourceMarkdown)
  if (JSON.stringify(compiledLegacyArtifact) !== JSON.stringify(legacyArtifact)) {
    throw new Error('Legacy Curriculum artifact does not match the protected source')
  }

  const projection = structuralIdentityProjection(compiledLegacyArtifact)
  const legacyEntities = [
    ...legacyArtifact.scopes,
    ...legacyArtifact.gradePlacements,
    ...legacyArtifact.subjectPlacements,
    ...legacyArtifact.representations,
    ...legacyArtifact.nodes,
  ]
  if (legacyEntities.length !== projection.candidates.length) {
    throw new Error('Legacy Curriculum identity count mismatch')
  }

  const records: CurriculumIdentityRecord[] = projection.candidates.map(
    (candidate, index) => ({
      ...candidate,
      id: legacyEntities[index]!.id,
      generation: 0,
      status: 'ACTIVE',
    }),
  )
  return createCurriculumIdentityRegistry(records)
}

const requireIdentity = (ids: ReadonlyMap<string, string>, key: string): string => {
  const id = ids.get(key)
  if (!id) throw new Error(`Missing active Curriculum identity: ${key}`)
  return id
}

export const compileCanonicalCurriculum = (
  sourceMarkdown: string,
  registry: CurriculumIdentityRegistry,
): CurriculumBaseCompilation => {
  const legacyArtifact = compileLegacyCanonicalCurriculum(sourceMarkdown)
  const projection = structuralIdentityProjection(legacyArtifact)
  const resolution = reconcileCurriculumIdentityRegistry(
    registry,
    projection.candidates,
    baseEntityKinds,
  )
  const ids = resolution.idsByLogicalKey

  const scopeIdMap = new Map(
    legacyArtifact.scopes.map((scope, index) => [
      scope.id,
      requireIdentity(ids, projection.scopeKeys[index]!),
    ]),
  )
  const gradeIdMap = new Map(
    legacyArtifact.gradePlacements.map((grade, index) => [
      grade.id,
      requireIdentity(ids, projection.gradeKeys[index]!),
    ]),
  )
  const placementIdMap = new Map(
    legacyArtifact.subjectPlacements.map((placement, index) => [
      placement.id,
      requireIdentity(ids, projection.placementKeys[index]!),
    ]),
  )
  const representationIdMap = new Map(
    legacyArtifact.representations.map((representation, index) => [
      representation.id,
      requireIdentity(ids, projection.representationKeys[index]!),
    ]),
  )
  const nodeIdMap = new Map(
    legacyArtifact.nodes.map((node, index) => [
      node.id,
      requireIdentity(ids, projection.nodeKeys[index]!),
    ]),
  )

  const payload: Omit<CurriculumArtifact, 'payloadSha256'> = {
    ...legacyArtifact,
    scopes: legacyArtifact.scopes.map((scope) => ({
      ...scope,
      id: scopeIdMap.get(scope.id)!,
      gradePlacementIds: scope.gradePlacementIds.map((id) => gradeIdMap.get(id)!),
    })),
    gradePlacements: legacyArtifact.gradePlacements.map((grade) => ({
      ...grade,
      id: gradeIdMap.get(grade.id)!,
      scopeId: scopeIdMap.get(grade.scopeId)!,
      subjectPlacementIds: grade.subjectPlacementIds.map((id) => placementIdMap.get(id)!),
    })),
    subjectPlacements: legacyArtifact.subjectPlacements.map((placement) => ({
      ...placement,
      id: placementIdMap.get(placement.id)!,
      scopeId: scopeIdMap.get(placement.scopeId)!,
      gradePlacementId: gradeIdMap.get(placement.gradePlacementId)!,
    })),
    representations: legacyArtifact.representations.map((representation) => ({
      ...representation,
      id: representationIdMap.get(representation.id)!,
      rootNodeIds: representation.rootNodeIds.map((id) => nodeIdMap.get(id)!),
    })),
    nodes: legacyArtifact.nodes.map((node) => ({
      ...node,
      id: nodeIdMap.get(node.id)!,
      representationId: representationIdMap.get(node.representationId)!,
      parentId: node.parentId ? nodeIdMap.get(node.parentId)! : null,
    })),
  }
  delete (payload as Partial<CurriculumArtifact>).payloadSha256
  assertProjection(payload)
  const artifact: CurriculumArtifact = {
    ...payload,
    payloadSha256: sha256(JSON.stringify(payload)),
  }

  return {
    artifact,
    identityRegistry: resolution.registry,
    representationIdsByKey: new Map(
      representationDefinitions.map((definition, index) => [
        definition.key,
        requireIdentity(ids, projection.representationKeys[index]!),
      ]),
    ),
    nodeIdsByKey: new Map(
      projection.nodeKeys.map((key) => [key, requireIdentity(ids, key)]),
    ),
  }
}

export const serializeCurriculumArtifact = (artifact: CurriculumArtifact): string =>
  `${JSON.stringify(artifact, null, 2)}\n`
