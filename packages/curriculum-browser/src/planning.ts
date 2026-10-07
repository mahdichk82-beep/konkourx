import { selectionKey } from './state.ts';
import type {
  CurriculumBrowserClient,
  CurriculumSelection,
  CurriculumSelectionMode,
} from './types.ts';

export type PlanningCurriculumTargetInput = {
  referenceKind: 'NODE' | 'PLACEMENT';
  curriculumRefId: string;
  selectionMode: CurriculumSelectionMode;
};

export type PlanningCurriculumTargetSnapshot = PlanningCurriculumTargetInput & {
  labelSnapshot: string;
  pathSnapshot: readonly string[];
  position: number;
  representationIdSnapshot: string | null;
};

export type PlanningTargetDraftItem =
  | {
      kind: 'NODE';
      selection: CurriculumSelection;
      displayPath: readonly string[];
    }
  | {
      kind: 'PLACEMENT';
      target: PlanningCurriculumTargetSnapshot;
    }
  | {
      kind: 'UNRESOLVED_NODE';
      target: PlanningCurriculumTargetSnapshot;
    };

export type PlanningCurriculumEditContext = {
  actor: 'student' | 'counselor';
  contentType: 'STUDY' | 'GENERAL' | null;
  source: 'PERSONAL' | 'COUNSELOR';
  status: 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED';
  completedItemCount: number;
  hasActiveStudySession?: boolean;
  hasStudyHistory?: boolean;
  hasValidAssessmentAttempt?: boolean;
};

export function selectionsToNodeTargets(
  selections: readonly CurriculumSelection[],
): PlanningCurriculumTargetInput[] {
  return selections.map(({ nodeId, mode }) => ({
    referenceKind: 'NODE',
    curriculumRefId: nodeId,
    selectionMode: mode,
  }));
}

const snapshotBreadcrumb = (
  target: PlanningCurriculumTargetSnapshot,
): CurriculumSelection['breadcrumb'] => target.pathSnapshot.map((label, index) => ({
  id: index === target.pathSnapshot.length - 1
    ? target.curriculumRefId
    : `snapshot:${target.position}:${index}`,
  kind: 'NODE' as const,
  label,
}));

export async function restorePlanningDraft(
  targets: readonly PlanningCurriculumTargetSnapshot[],
  client: CurriculumBrowserClient,
): Promise<PlanningTargetDraftItem[]> {
  const snapshots = snapshotPlanningDraft(targets);
  if (snapshots.every((item) => item.kind === 'PLACEMENT')) return snapshots;
  let entries: Awaited<ReturnType<CurriculumBrowserClient['listCatalog']>>;
  try {
    entries = await client.listCatalog();
  } catch {
    return snapshots;
  }

  return Promise.all(snapshots.map(async (item): Promise<PlanningTargetDraftItem> => {
    if (item.kind !== 'UNRESOLVED_NODE') return item;
    const target = item.target;

    const entry = target.representationIdSnapshot
      ? entries.find(({ representationIds }) => (
          representationIds.includes(target.representationIdSnapshot as string)
        ))
      : undefined;
    if (!entry) return { kind: 'UNRESOLVED_NODE', target };

    try {
      const node = await client.getNode(entry.id, target.curriculumRefId);
      return {
        displayPath: target.pathSnapshot,
        kind: 'NODE',
        selection: {
          breadcrumb: snapshotBreadcrumb(target),
          entryId: node.entryId,
          label: target.labelSnapshot,
          mode: target.selectionMode,
          nodeId: node.id,
          trackId: node.trackId,
        },
      };
    } catch {
      return { kind: 'UNRESOLVED_NODE', target };
    }
  }));
}

export function snapshotPlanningDraft(
  targets: readonly PlanningCurriculumTargetSnapshot[],
): PlanningTargetDraftItem[] {
  return [...targets]
    .sort((left, right) => left.position - right.position)
    .map((target) => target.referenceKind === 'PLACEMENT'
      ? { kind: 'PLACEMENT', target }
      : { kind: 'UNRESOLVED_NODE', target });
}

export async function loadPlanningTaskDrafts(
  tasks: readonly { id: string; curriculum: { targets: readonly PlanningCurriculumTargetSnapshot[] } }[],
  client: CurriculumBrowserClient,
  publish: (drafts: Record<string, PlanningTargetDraftItem[]>) => void,
): Promise<void> {
  publish(Object.fromEntries(tasks.map((task) => [task.id, snapshotPlanningDraft(task.curriculum.targets)])));
  const enriched = await Promise.all(tasks.map(async (task) => [
    task.id,
    await restorePlanningDraft(task.curriculum.targets, client),
  ] as const));
  publish(Object.fromEntries(enriched));
}

export function mergePlanningSelections(
  original: readonly PlanningTargetDraftItem[],
  selections: readonly CurriculumSelection[],
): PlanningTargetDraftItem[] {
  const remaining = new Map(selections.map((selection) => [selectionKey(selection), selection]));
  const merged: PlanningTargetDraftItem[] = [];

  for (const item of original) {
    if (item.kind !== 'NODE') {
      merged.push(item);
      continue;
    }

    const key = selectionKey(item.selection);
    const selection = remaining.get(key);
    if (!selection) continue;
    merged.push({ ...item, selection });
    remaining.delete(key);
  }

  for (const selection of selections) {
    const key = selectionKey(selection);
    if (!remaining.has(key)) continue;
    merged.push({
      displayPath: selection.breadcrumb.map(({ label }) => label),
      kind: 'NODE',
      selection,
    });
    remaining.delete(key);
  }

  return merged;
}

export function planningDraftToTargetInputs(
  items: readonly PlanningTargetDraftItem[],
): PlanningCurriculumTargetInput[] {
  return items.map((item) => {
    if (item.kind === 'NODE') {
      return {
        referenceKind: 'NODE',
        curriculumRefId: item.selection.nodeId,
        selectionMode: item.selection.mode,
      };
    }
    return {
      referenceKind: item.target.referenceKind,
      curriculumRefId: item.target.curriculumRefId,
      selectionMode: item.target.selectionMode,
    };
  });
}

export function canEditPlanningCurriculum(
  context: PlanningCurriculumEditContext,
  originals: readonly PlanningCurriculumTargetSnapshot[],
  draft: readonly PlanningTargetDraftItem[],
): boolean {
  return context.status === 'PENDING'
    && context.contentType === 'STUDY'
    && context.source === (context.actor === 'student' ? 'PERSONAL' : 'COUNSELOR')
    && context.completedItemCount === 0
    && !context.hasActiveStudySession
    && !context.hasStudyHistory
    && !context.hasValidAssessmentAttempt
    && !originals.some((target) => target.referenceKind === 'PLACEMENT')
    && draft.every((item) => item.kind === 'NODE');
}

export async function replaceChangedPlanningTargets<T>(
  originals: readonly PlanningCurriculumTargetSnapshot[],
  draft: readonly PlanningTargetDraftItem[],
  context: PlanningCurriculumEditContext,
  replace: (targets: PlanningCurriculumTargetInput[]) => Promise<T>,
): Promise<{ kind: 'UNCHANGED' | 'READ_ONLY' } | { kind: 'REPLACED'; value: T }> {
  const before = [...originals]
    .sort((left, right) => left.position - right.position)
    .map(({ referenceKind, curriculumRefId, selectionMode }) => ({
      referenceKind,
      curriculumRefId,
      selectionMode,
    }));
  const after = planningDraftToTargetInputs(draft);
  const unchanged = before.length === after.length && before.every((target, index) => (
    target.referenceKind === after[index]?.referenceKind
    && target.curriculumRefId === after[index]?.curriculumRefId
    && target.selectionMode === after[index]?.selectionMode
  ));
  if (unchanged) return { kind: 'UNCHANGED' };
  // Replacement recreates the whole target set. Retaining a historical WHOLE
  // would resolve it against today's children and rewrite its stored snapshot.
  if (after.some((target) => target.selectionMode === 'WHOLE')) return { kind: 'READ_ONLY' };
  if (!canEditPlanningCurriculum(context, originals, draft)) return { kind: 'READ_ONLY' };
  return { kind: 'REPLACED', value: await replace(after) };
}

export const resolvedSelections = (
  items: readonly PlanningTargetDraftItem[],
): CurriculumSelection[] => items.flatMap((item) => item.kind === 'NODE' ? [item.selection] : []);
