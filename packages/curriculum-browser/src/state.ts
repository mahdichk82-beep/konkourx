import type {
  CurriculumCatalogNodeView,
  CurriculumCatalogRootItem,
  CurriculumSelection,
  CurriculumSelectionMode,
} from './types.ts';

export function selectionKey(selection: Pick<CurriculumSelection, 'entryId' | 'nodeId'>): string {
  return `${selection.entryId}:${selection.nodeId}`;
}

export function toggleSelection(
  selections: readonly CurriculumSelection[],
  node: CurriculumCatalogNodeView,
  options: { multiple: boolean; mode: CurriculumSelectionMode },
): CurriculumSelection[] {
  const candidate: CurriculumSelection = {
    nodeId: node.id,
    entryId: node.entryId,
    label: node.rawLabel,
    breadcrumb: node.breadcrumb,
    trackId: node.trackId,
    mode: options.mode,
  };
  const key = selectionKey(candidate);
  if (selections.some((selection) => selectionKey(selection) === key)) {
    return selections.filter((selection) => selectionKey(selection) !== key);
  }
  return options.multiple ? [...selections, candidate] : [candidate];
}

export function updateSelectionMode(
  selections: readonly CurriculumSelection[],
  key: string,
  mode: CurriculumSelectionMode,
): CurriculumSelection[] {
  return selections.map((selection) => (
    selectionKey(selection) === key ? { ...selection, mode } : selection
  ));
}

export function isSelectableRoot(
  item: CurriculumCatalogRootItem,
): item is Extract<CurriculumCatalogRootItem, { itemKind: 'NODE' }> {
  return item.itemKind === 'NODE';
}

export function toggleExpanded(expanded: ReadonlySet<string>, nodeId: string): Set<string> {
  const next = new Set(expanded);
  if (next.has(nodeId)) next.delete(nodeId);
  else next.add(nodeId);
  return next;
}
