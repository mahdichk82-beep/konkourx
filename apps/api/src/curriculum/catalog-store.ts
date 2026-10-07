import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error.js'
import {
  CURRICULUM_CATALOG_FORMAT_VERSION,
  type CurriculumArtifact,
  type CurriculumCatalogArtifact,
  type CurriculumCatalogEntry,
  type CurriculumCatalogNodeView,
  type CurriculumCatalogRootItem,
  type CurriculumCatalogSearchResult,
  type CurriculumPage,
  type CurriculumSourceNode,
  type CurriculumTrack,
  type CurriculumTrackId,
  type CurriculumTrackSearchQuery,
} from './types.js'

export type CurriculumCatalogPageQuery = { limit: number; offset: number }

export type CurriculumCatalogReadStore = {
  listTracks(): readonly CurriculumTrack[]
  listTrackCatalog(track: CurriculumTrackId): readonly CurriculumCatalogEntry[]
  getTrackCatalogEntry(track: CurriculumTrackId, entryId: string): CurriculumCatalogEntry
  listCatalogRoots(track: CurriculumTrackId, entryId: string): readonly CurriculumCatalogRootItem[]
  getCatalogNode(track: CurriculumTrackId, entryId: string, nodeId: string): CurriculumCatalogNodeView
  isSelectableNodeInTrack(track: CurriculumTrackId, nodeId: string): boolean
  isNavigationGroup(id: string): boolean
  listCatalogChildren(
    track: CurriculumTrackId,
    entryId: string,
    nodeId: string,
    page: CurriculumCatalogPageQuery,
  ): CurriculumPage<CurriculumCatalogNodeView>
  searchTrack(query: CurriculumTrackSearchQuery): CurriculumPage<CurriculumCatalogSearchResult>
}

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex')

const deepFreeze = <T>(value: T): T => {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

const page = <T>(items: readonly T[], query: CurriculumCatalogPageQuery): CurriculumPage<T> => ({
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

const assertCatalogArtifact = (
  base: CurriculumArtifact,
  catalog: CurriculumCatalogArtifact,
): void => {
  if (catalog.formatVersion !== CURRICULUM_CATALOG_FORMAT_VERSION) {
    throw new Error(`Unsupported Curriculum catalog format: ${catalog.formatVersion}`)
  }
  const { payloadSha256, ...payload } = catalog
  if (sha256(JSON.stringify(payload)) !== payloadSha256) {
    throw new Error('Curriculum catalog artifact payload hash mismatch')
  }
  if (catalog.source.basePayloadSha256 !== base.payloadSha256) {
    throw new Error('Curriculum catalog base artifact identity mismatch')
  }
  if (
    catalog.tracks.length !== catalog.counts.trackCount
    || catalog.entries.length !== catalog.counts.resolvedEntryCount
    || catalog.unresolvedInventory.length !== catalog.counts.unresolvedInventoryCount
  ) {
    throw new Error('Curriculum catalog artifact count mismatch')
  }
}

export const createCurriculumCatalogReadStore = (
  baseInput: CurriculumArtifact,
  catalogInput: CurriculumCatalogArtifact,
): CurriculumCatalogReadStore => {
  assertCatalogArtifact(baseInput, catalogInput)
  const base = deepFreeze(baseInput)
  const catalog = deepFreeze(catalogInput)
  const nodesById = new Map(base.nodes.map((node) => [node.id, node]))
  const childrenByParentId = new Map<string, string[]>()
  for (const node of base.nodes) {
    if (!node.parentId) continue
    const children = childrenByParentId.get(node.parentId) ?? []
    children.push(node.id)
    childrenByParentId.set(node.parentId, children)
  }
  const tracksById = new Map(catalog.tracks.map((track) => [track.id, track]))
  const entriesById = new Map(catalog.entries.map((entry) => [entry.id, entry]))
  const membershipByEntry = new Map<string, Set<string>>()
  const groupByEntryNode = new Map<string, CurriculumCatalogRootItem & { itemKind: 'GROUP' }>()
  const navigationGroupIds = new Set<string>()

  const addDescendants = (
    entryId: string,
    rootId: string,
    group?: CurriculumCatalogRootItem & { itemKind: 'GROUP' },
  ): void => {
    const membership = membershipByEntry.get(entryId) ?? new Set<string>()
    membershipByEntry.set(entryId, membership)
    const visit = (nodeId: string): void => {
      if (!nodesById.has(nodeId)) throw new Error(`Catalog references unknown node: ${nodeId}`)
      if (membership.has(nodeId)) return
      membership.add(nodeId)
      if (group) groupByEntryNode.set(`${entryId}:${nodeId}`, group)
      for (const childId of childrenByParentId.get(nodeId) ?? []) visit(childId)
    }
    visit(rootId)
  }

  for (const entry of catalog.entries) {
    for (const root of entry.rootItems) {
      if (root.itemKind === 'NODE') addDescendants(entry.id, root.nodeId)
      else {
        navigationGroupIds.add(root.id)
        for (const childId of root.childNodeIds) addDescendants(entry.id, childId, root)
      }
    }
    if ((membershipByEntry.get(entry.id)?.size ?? 0) !== entry.nodeCount) {
      throw new Error(`Catalog entry node count mismatch: ${entry.key}`)
    }
  }

  const getTrack = (trackId: CurriculumTrackId) => {
    const track = tracksById.get(trackId)
    if (!track) throw new ApiError(404, 'CURRICULUM_TRACK_NOT_FOUND', 'Curriculum track not found')
    return track
  }
  const getEntry = (trackId: CurriculumTrackId, entryId: string) => {
    const track = getTrack(trackId)
    if (!track.entryIds.includes(entryId)) {
      throw new ApiError(
        404,
        'CURRICULUM_CATALOG_ENTRY_NOT_FOUND',
        'Curriculum catalog entry not found in track',
      )
    }
    const entry = entriesById.get(entryId)
    if (!entry) throw new Error(`Catalog track references unknown entry: ${entryId}`)
    return { entry, track }
  }
  const getMemberNode = (trackId: CurriculumTrackId, entryId: string, nodeId: string) => {
    const context = getEntry(trackId, entryId)
    const node = nodesById.get(nodeId)
    if (!node || !membershipByEntry.get(entryId)?.has(nodeId)) {
      throw new ApiError(
        404,
        'CURRICULUM_CATALOG_NODE_NOT_FOUND',
        'Curriculum node not found in catalog entry',
      )
    }
    return { ...context, node }
  }
  const nodeView = (
    trackId: CurriculumTrackId,
    entryId: string,
    nodeId: string,
  ): CurriculumCatalogNodeView => {
    const { entry, track, node } = getMemberNode(trackId, entryId, nodeId)
    const membership = membershipByEntry.get(entryId)!
    const canonicalPath = []
    let current: CurriculumSourceNode | undefined = node
    while (current && membership.has(current.id)) {
      canonicalPath.push(current)
      current = current.parentId ? nodesById.get(current.parentId) : undefined
    }
    canonicalPath.reverse()
    const group = groupByEntryNode.get(`${entryId}:${nodeId}`)
    return {
      ...node,
      trackId,
      entryId,
      breadcrumb: [
        { kind: 'TRACK', id: track.id, label: track.title },
        { kind: 'ENTRY', id: entry.id, label: entry.title },
        ...(group ? [{ kind: 'GROUP' as const, id: group.id, label: group.label }] : []),
        ...canonicalPath.map((pathNode) => ({
          kind: 'NODE' as const,
          id: pathNode.id,
          label: pathNode.rawLabel,
        })),
      ],
      ambiguityCodes: entry.ambiguityCodes,
    }
  }

  return {
    listTracks: () => catalog.tracks.map(({ entryIds: _entryIds, ...track }) => track),
    listTrackCatalog: (trackId) => getTrack(trackId).entryIds.map((id) => entriesById.get(id)!),
    getTrackCatalogEntry: (trackId, entryId) => getEntry(trackId, entryId).entry,
    listCatalogRoots: (trackId, entryId) => getEntry(trackId, entryId).entry.rootItems,
    getCatalogNode: nodeView,
    isSelectableNodeInTrack: (trackId, nodeId) =>
      getTrack(trackId).entryIds.some((entryId) => membershipByEntry.get(entryId)?.has(nodeId) ?? false),
    isNavigationGroup: (id) => navigationGroupIds.has(id),
    listCatalogChildren: (trackId, entryId, nodeId, query) => {
      getMemberNode(trackId, entryId, nodeId)
      const membership = membershipByEntry.get(entryId)!
      const views = (childrenByParentId.get(nodeId) ?? [])
        .filter((childId) => membership.has(childId))
        .map((childId) => nodeView(trackId, entryId, childId))
      return page(views, query)
    },
    searchTrack: (query) => {
      const normalizedQuery = normalizeCurriculumSearch(query.q)
      const results: CurriculumCatalogSearchResult[] = []
      for (const entry of getTrack(query.track).entryIds.map((id) => entriesById.get(id)!)) {
        const membership = membershipByEntry.get(entry.id) ?? new Set<string>()
        for (const node of base.nodes) {
          if (
            membership.has(node.id)
            && normalizeCurriculumSearch(node.rawLabel).includes(normalizedQuery)
          ) {
            results.push(nodeView(query.track, entry.id, node.id))
          }
        }
      }
      return page(results, query)
    },
  }
}
