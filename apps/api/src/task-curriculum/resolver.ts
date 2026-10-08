import { ApiError } from '../errors/api-error.js'
import type { CurriculumReadStore } from '../curriculum/store.js'
import type {
  CurriculumSourceNode,
  CurriculumSubjectPlacement,
} from '../curriculum/types.js'
import type {
  CurriculumSelectionV2Input,
  CurriculumTargetInput,
  ResolvedCurriculumItem,
  ResolvedCurriculumTarget,
} from './types.js'

const MAX_SELECTOR_ROOTS = 50

const nodePath = (store: CurriculumReadStore, node: CurriculumSourceNode): string[] => {
  const labels: string[] = []
  let current: CurriculumSourceNode | null = node
  const visited = new Set<string>()
  while (current) {
    if (visited.has(current.id)) throw new Error('Canonical Curriculum contains a node cycle')
    visited.add(current.id)
    labels.unshift(current.rawLabel)
    current = current.parentId ? store.getNode(current.parentId) : null
  }
  return [store.getRepresentation(node.representationId).sourceHeading, ...labels]
}

const placementPath = (
  store: CurriculumReadStore,
  placement: CurriculumSubjectPlacement,
): string[] => [
  store.getScope(placement.scopeId).rawLabel,
  store.getGradePlacement(placement.gradePlacementId).rawLabel,
  placement.rawLabel,
]

const duplicateError = (): never => {
  throw new ApiError(
    409,
    'CURRICULUM_TARGET_OVERLAP',
    'Curriculum selections produce duplicate execution checklist items',
  )
}

export const resolveCurriculumTargets = (
  store: CurriculumReadStore,
  inputs: readonly CurriculumTargetInput[],
): ResolvedCurriculumTarget[] => {
  const itemKeys = new Set<string>()
  let itemPosition = 0

  return inputs.map((input, targetPosition) => {
    if (input.referenceKind === 'PLACEMENT') {
      if (input.selectionMode !== 'EXACT') {
        throw new ApiError(
          400,
          'CURRICULUM_PLACEMENT_WHOLE_UNSUPPORTED',
          'WHOLE selection is not available for Curriculum placements',
        )
      }
      const placement = store.getPlacement(input.curriculumRefId)
      const key = `PLACEMENT:${placement.id}`
      if (itemKeys.has(key)) duplicateError()
      itemKeys.add(key)
      const pathSnapshot = placementPath(store, placement)
      return {
        ...input,
        position: targetPosition,
        labelSnapshot: placement.rawLabel,
        pathSnapshot,
        representationIdSnapshot: null,
        items: [{
          referenceKind: 'PLACEMENT',
          curriculumRefId: placement.id,
          labelSnapshot: placement.rawLabel,
          pathSnapshot,
          position: itemPosition++,
        }],
      }
    }

    const node = store.getNode(input.curriculumRefId)
    const expanded = input.selectionMode === 'WHOLE' && node.childrenCount > 0
      ? store.getDirectChildren(node.id)
      : [node]
    const items: ResolvedCurriculumItem[] = expanded.map((itemNode) => {
      const key = `NODE:${itemNode.id}`
      if (itemKeys.has(key)) duplicateError()
      itemKeys.add(key)
      return {
        referenceKind: 'NODE',
        curriculumRefId: itemNode.id,
        labelSnapshot: itemNode.rawLabel,
        pathSnapshot: nodePath(store, itemNode),
        position: itemPosition++,
      }
    })
    return {
      ...input,
      position: targetPosition,
      labelSnapshot: node.rawLabel,
      pathSnapshot: nodePath(store, node),
      representationIdSnapshot: node.representationId,
      items,
    }
  })
}

type NormalizedV2Selector = {
  rootId: string
  selector: 'EXACT' | 'SUBTREE'
}

const selectorLimitError = (): never => {
  throw new ApiError(
    400,
    'CURRICULUM_SELECTOR_LIMIT_EXCEEDED',
    `Curriculum selections cannot contain more than ${MAX_SELECTOR_ROOTS} roots`,
  )
}

const compareNodes = (left: CurriculumSourceNode, right: CurriculumSourceNode): number =>
  left.sourceOrder - right.sourceOrder || left.id.localeCompare(right.id)

const assertSelectableNode = (
  store: CurriculumReadStore,
  track: import('../curriculum/types.js').CurriculumTrackId,
  nodeId: string,
): CurriculumSourceNode => {
  if (!store.isSelectableNodeInTrack(track, nodeId)) {
    throw new ApiError(
      409,
      'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK',
      'Curriculum target is not available for the Student track',
    )
  }
  return store.getNode(nodeId)
}

const isDescendantOf = (
  store: CurriculumReadStore,
  node: CurriculumSourceNode,
  ancestorIds: ReadonlySet<string>,
): boolean => {
  const visited = new Set<string>()
  let parentId = node.parentId
  while (parentId) {
    if (visited.has(parentId)) throw new Error('Canonical Curriculum contains a node cycle')
    visited.add(parentId)
    if (ancestorIds.has(parentId)) return true
    parentId = store.getNode(parentId).parentId
  }
  return false
}

const normalizeV2Selectors = (
  store: CurriculumReadStore,
  track: import('../curriculum/types.js').CurriculumTrackId,
  input: CurriculumSelectionV2Input,
): NormalizedV2Selector[] => {
  if (input.selectors.length > MAX_SELECTOR_ROOTS) selectorLimitError()
  const expanded: NormalizedV2Selector[] = []
  for (const selector of input.selectors) {
    if (selector.rootKind === 'NODE') {
      assertSelectableNode(store, track, selector.rootId)
      expanded.push({ rootId: selector.rootId, selector: selector.selector })
      continue
    }
    const childNodeIds = store.getNavigationGroupChildNodeIds(track, selector.rootId)
    if (childNodeIds.length === 0) {
      throw new ApiError(400, 'CURRICULUM_SELECTION_EMPTY', 'Curriculum selection resolves to no targets')
    }
    for (const childNodeId of childNodeIds) {
      const child = assertSelectableNode(store, track, childNodeId)
      const hasSelectableChildren = store.getDirectChildren(child.id)
        .some(({ id }) => store.isSelectableNodeInTrack(track, id))
      expanded.push({
        rootId: child.id,
        selector: hasSelectableChildren ? 'SUBTREE' : 'EXACT',
      })
    }
  }

  const byRoot = new Map<string, NormalizedV2Selector>()
  for (const selector of expanded) {
    const current = byRoot.get(selector.rootId)
    if (!current || selector.selector === 'SUBTREE') byRoot.set(selector.rootId, selector)
  }

  const subtreeRoots = new Set([...byRoot.values()]
    .filter(({ selector }) => selector === 'SUBTREE')
    .map(({ rootId }) => rootId))
  const normalized = [...byRoot.values()]
    .filter(({ rootId }) => !isDescendantOf(store, store.getNode(rootId), subtreeRoots))
  if (normalized.length > MAX_SELECTOR_ROOTS) selectorLimitError()
  return normalized.sort((left, right) => compareNodes(store.getNode(left.rootId), store.getNode(right.rootId)))
}

const terminalSelectableDescendants = (
  store: CurriculumReadStore,
  track: import('../curriculum/types.js').CurriculumTrackId,
  node: CurriculumSourceNode,
): CurriculumSourceNode[] => {
  const children = store.getDirectChildren(node.id)
    .filter(({ id }) => store.isSelectableNodeInTrack(track, id))
    .sort(compareNodes)
  return children.length === 0
    ? [node]
    : children.flatMap((child) => terminalSelectableDescendants(store, track, child))
}

export const resolveCurriculumSelectionV2 = (
  store: CurriculumReadStore,
  track: import('../curriculum/types.js').CurriculumTrackId,
  input: CurriculumSelectionV2Input,
): ResolvedCurriculumTarget[] => {
  let itemPosition = 0
  const itemIds = new Set<string>()
  return normalizeV2Selectors(store, track, input).map((selector, targetPosition) => {
    const node = store.getNode(selector.rootId)
    const resolvedNodes = selector.selector === 'SUBTREE'
      ? terminalSelectableDescendants(store, track, node)
      : [node]
    const items = resolvedNodes.map((itemNode): ResolvedCurriculumItem => {
      if (itemIds.has(itemNode.id)) duplicateError()
      itemIds.add(itemNode.id)
      return {
        referenceKind: 'NODE',
        curriculumRefId: itemNode.id,
        labelSnapshot: itemNode.rawLabel,
        pathSnapshot: nodePath(store, itemNode),
        position: itemPosition++,
      }
    })
    if (items.length === 0) {
      throw new ApiError(400, 'CURRICULUM_SELECTION_EMPTY', 'Curriculum selection resolves to no items')
    }
    return {
      referenceKind: 'NODE',
      curriculumRefId: node.id,
      selectionMode: selector.selector,
      position: targetPosition,
      labelSnapshot: node.rawLabel,
      pathSnapshot: nodePath(store, node),
      representationIdSnapshot: node.representationId,
      items,
    }
  })
}

