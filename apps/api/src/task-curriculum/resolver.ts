import { ApiError } from '../errors/api-error.js'
import type { CurriculumReadStore } from '../curriculum/store.js'
import type {
  CurriculumSourceNode,
  CurriculumSubjectPlacement,
} from '../curriculum/types.js'
import type {
  CurriculumTargetInput,
  ResolvedCurriculumItem,
  ResolvedCurriculumTarget,
} from './types.js'

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

