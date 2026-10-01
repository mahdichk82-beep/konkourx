import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error.js'
import {
  CURRICULUM_FORMAT_VERSION,
  type CurriculumArtifact,
  type CurriculumGradePlacement,
  type CurriculumPage,
  type CurriculumRepresentation,
  type CurriculumScope,
  type CurriculumSourceNode,
  type CurriculumSubjectPlacement,
} from './types.js'

export type CurriculumPlacementQuery = {
  scopeId?: string
  gradePlacementId?: string
  limit: number
  offset: number
}

export type CurriculumPageQuery = {
  limit: number
  offset: number
}

export type CurriculumSearchQuery = CurriculumPageQuery & {
  q: string
}

export type CurriculumReadStore = {
  artifactIdentity(): CurriculumArtifact['source'] & CurriculumArtifact['counts']
  listScopes(): readonly CurriculumScope[]
  listGradePlacements(): readonly CurriculumGradePlacement[]
  listPlacements(query: CurriculumPlacementQuery): CurriculumPage<CurriculumSubjectPlacement>
  listRepresentations(query: CurriculumPageQuery): CurriculumPage<CurriculumRepresentation>
  getScope(id: string): CurriculumScope
  getGradePlacement(id: string): CurriculumGradePlacement
  getPlacement(id: string): CurriculumSubjectPlacement
  getRepresentation(id: string): CurriculumRepresentation
  getNode(id: string): CurriculumSourceNode
  getDirectChildren(id: string): readonly CurriculumSourceNode[]
  listChildren(id: string, query: CurriculumPageQuery): CurriculumPage<CurriculumSourceNode>
  search(query: CurriculumSearchQuery): CurriculumPage<CurriculumSourceNode>
}

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex')

const deepFreeze = <T>(value: T): T => {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

const page = <T>(items: readonly T[], query: CurriculumPageQuery): CurriculumPage<T> => ({
  items: items.slice(query.offset, query.offset + query.limit),
  limit: query.limit,
  offset: query.offset,
  total: items.length,
})

export const normalizeCurriculumSearch = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('fa')
    .replaceAll('ي', 'ی')
    .replaceAll('ك', 'ک')
    .replace(/\s+/gu, ' ')
    .trim()

const assertArtifact = (artifact: CurriculumArtifact): void => {
  if (artifact.formatVersion !== CURRICULUM_FORMAT_VERSION) {
    throw new Error(`Unsupported Curriculum artifact format: ${artifact.formatVersion}`)
  }
  const { payloadSha256, ...payload } = artifact
  if (sha256(JSON.stringify(payload)) !== payloadSha256) {
    throw new Error('Canonical Curriculum artifact payload hash mismatch')
  }
  if (
    artifact.scopes.length !== artifact.counts.scopeCount
    || artifact.gradePlacements.length !== artifact.counts.gradePlacementCount
    || artifact.subjectPlacements.length !== artifact.counts.subjectPlacementCount
    || artifact.representations.length !== artifact.counts.representationCount
    || artifact.nodes.length !== artifact.counts.detailedNodeCount
  ) {
    throw new Error('Canonical Curriculum artifact count mismatch')
  }
}
export const createCurriculumReadStore = (
  input: CurriculumArtifact,
): CurriculumReadStore => {
  assertArtifact(input)
  const artifact = deepFreeze(input)
  const nodesById = new Map(artifact.nodes.map((node) => [node.id, node]))
  const scopesById = new Map(artifact.scopes.map((scope) => [scope.id, scope]))
  const gradesById = new Map(artifact.gradePlacements.map((grade) => [grade.id, grade]))
  const placementsById = new Map(artifact.subjectPlacements.map((placement) => [placement.id, placement]))
  const representationsById = new Map(artifact.representations.map((representation) => [representation.id, representation]))
  const childrenByParentId = new Map<string, CurriculumSourceNode[]>()
  const normalizedLabels = new Map<string, string>()

  for (const node of artifact.nodes) {
    normalizedLabels.set(node.id, normalizeCurriculumSearch(node.rawLabel))
    if (node.parentId) {
      const children = childrenByParentId.get(node.parentId) ?? []
      children.push(node)
      childrenByParentId.set(node.parentId, children)
    }
  }
  for (const children of childrenByParentId.values()) deepFreeze(children)

  const getNode = (id: string): CurriculumSourceNode => {
    const node = nodesById.get(id)
    if (!node) {
      throw new ApiError(404, 'CURRICULUM_NODE_NOT_FOUND', 'Curriculum node not found')
    }
    return node
  }

  return {
    artifactIdentity: () => ({ ...artifact.source, ...artifact.counts }),
    listScopes: () => artifact.scopes,
    listGradePlacements: () => artifact.gradePlacements,
    listPlacements: (query) => page(
      artifact.subjectPlacements.filter((placement) =>
        (!query.scopeId || placement.scopeId === query.scopeId)
        && (!query.gradePlacementId || placement.gradePlacementId === query.gradePlacementId)),
      query,
    ),
    listRepresentations: (query) => page(artifact.representations, query),
    getScope: (id) => {
      const value = scopesById.get(id)
      if (!value) throw new ApiError(404, 'CURRICULUM_SCOPE_NOT_FOUND', 'Curriculum scope not found')
      return value
    },
    getGradePlacement: (id) => {
      const value = gradesById.get(id)
      if (!value) throw new ApiError(404, 'CURRICULUM_GRADE_NOT_FOUND', 'Curriculum grade placement not found')
      return value
    },
    getPlacement: (id) => {
      const value = placementsById.get(id)
      if (!value) throw new ApiError(404, 'CURRICULUM_PLACEMENT_NOT_FOUND', 'Curriculum subject placement not found')
      return value
    },
    getRepresentation: (id) => {
      const value = representationsById.get(id)
      if (!value) throw new ApiError(404, 'CURRICULUM_REPRESENTATION_NOT_FOUND', 'Curriculum representation not found')
      return value
    },
    getNode,
    getDirectChildren: (id) => {
      getNode(id)
      return childrenByParentId.get(id) ?? []
    },
    listChildren: (id, query) => {
      getNode(id)
      return page(childrenByParentId.get(id) ?? [], query)
    },
    search: (query) => {
      const normalizedQuery = normalizeCurriculumSearch(query.q)
      const matches = artifact.nodes.filter((node) =>
        normalizedLabels.get(node.id)?.includes(normalizedQuery))
      return page(matches, query)
    },
  }
}
