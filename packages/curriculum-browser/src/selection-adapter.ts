import {
  registerTriStateSelectionFacts,
  type CurriculumSelectionAuthority,
  type CurriculumSelectionChildPageFact,
  type CurriculumSelectionGroupFact,
  type CurriculumSelectionNodeFact,
  type CurriculumStructureRequirement,
  type SelectionMutationResult,
  type SelectionQueryResult,
  type SelectionSerializationResult,
  type TriStateSelectionState,
} from './selection-engine.ts';
import type {
  CurriculumBrowserClient,
  CurriculumCatalogNodeView,
  CurriculumCatalogRootItem,
  CurriculumPage,
} from './types.ts';

export function nodeViewToSelectionFact(
  view: CurriculumCatalogNodeView,
): CurriculumSelectionNodeFact {
  const nodeSegments = view.breadcrumb.filter(({ kind }) => kind === 'NODE');
  const currentIndex = nodeSegments.findLastIndex(({ id }) => id === view.id);
  const ancestors = (currentIndex >= 0 ? nodeSegments.slice(0, currentIndex) : nodeSegments)
    .map(({ id }) => id);
  return Object.freeze({
    id: view.id,
    parentId: ancestors.at(-1) ?? null,
    ancestorIds: Object.freeze(ancestors),
    childrenCount: view.childrenCount,
    sourceOrder: view.sourceOrder,
  });
}

export function childPageToSelectionFact(
  parentId: string,
  page: CurriculumPage<CurriculumCatalogNodeView>,
): CurriculumSelectionChildPageFact {
  return Object.freeze({
    parentId,
    offset: page.offset,
    total: page.total,
    children: Object.freeze(page.items.map(nodeViewToSelectionFact)),
  });
}

export function rootItemsToSelectionGroupFacts(
  items: readonly CurriculumCatalogRootItem[],
): readonly CurriculumSelectionGroupFact[] {
  return Object.freeze(items.flatMap((item, sourceOrder) => item.itemKind === 'GROUP'
    ? [Object.freeze({
        id: item.id,
        childNodeIds: Object.freeze([...item.childNodeIds]),
        sourceOrder,
      })]
    : []));
}

export type SelectionAdapterSource = {
  authority: CurriculumSelectionAuthority;
  client: CurriculumBrowserClient;
  generation: string;
  isCurrentGeneration(generation: string): boolean;
  nodeEntryHints: Readonly<Record<string, string>>;
  groupEntryHints: Readonly<Record<string, string>>;
};

export type SelectionAdapterFailureCode =
  | 'ENTRY_HINT_REQUIRED'
  | 'REQUEST_FAILED'
  | 'NO_PROGRESS'
  | 'RETRY_STALLED'
  | 'AUTHORITY_MISMATCH'
  | 'FACT_CONFLICT';

export type SelectionAdapterFailure = {
  kind: 'ADAPTER_FAILURE';
  code: SelectionAdapterFailureCode;
  message: string;
  retryable: boolean;
  state: TriStateSelectionState;
  requirement?: CurriculumStructureRequirement;
  cause?: unknown;
};

export type SelectionFactsLoaded = {
  kind: 'LOADED';
  state: TriStateSelectionState;
  nodeEntryHints: Readonly<Record<string, string>>;
  groupEntryHints: Readonly<Record<string, string>>;
  nodeViews: readonly CurriculumCatalogNodeView[];
};

export type SelectionAdapterStale = { kind: 'STALE'; state: TriStateSelectionState };

const failure = (
  state: TriStateSelectionState,
  code: SelectionAdapterFailureCode,
  message: string,
  retryable: boolean,
  requirement?: CurriculumStructureRequirement,
  cause?: unknown,
): SelectionAdapterFailure => ({
  kind: 'ADAPTER_FAILURE', code, message, retryable, state, requirement, cause,
});

const isCurrent = (source: SelectionAdapterSource): boolean => (
  source.isCurrentGeneration(source.generation)
);

const rememberViewHints = (
  view: CurriculumCatalogNodeView,
  nodeEntryHints: Record<string, string>,
): void => {
  nodeEntryHints[view.id] = view.entryId;
  for (const segment of view.breadcrumb) {
    if (segment.kind === 'NODE') nodeEntryHints[segment.id] = view.entryId;
  }
};

const registerBatch = (
  current: TriStateSelectionState,
  batch: Parameters<typeof registerTriStateSelectionFacts>[1],
  original: TriStateSelectionState,
  requirement: CurriculumStructureRequirement,
): TriStateSelectionState | SelectionAdapterFailure => {
  const registered = registerTriStateSelectionFacts(current, batch);
  if (registered.kind === 'REGISTERED') return registered.state;
  return failure(
    original,
    registered.kind,
    registered.kind === 'FACT_CONFLICT'
      ? registered.message
      : 'Authoritative Curriculum facts do not match this modal session',
    false,
    requirement,
  );
};

export async function loadSelectionRequirements(
  state: TriStateSelectionState,
  requirements: readonly CurriculumStructureRequirement[],
  source: SelectionAdapterSource,
): Promise<SelectionFactsLoaded | SelectionAdapterStale | SelectionAdapterFailure> {
  const original = state;
  let current = state;
  const nodeEntryHints = { ...source.nodeEntryHints };
  const groupEntryHints = { ...source.groupEntryHints };
  const nodeViews: CurriculumCatalogNodeView[] = [];

  for (const requirement of requirements) {
    if (!isCurrent(source)) return { kind: 'STALE', state: original };
    try {
      if (requirement.kind === 'NODE_FACT' || requirement.kind === 'SELECTOR_ANCESTRY') {
        const entryId = nodeEntryHints[requirement.nodeId];
        if (!entryId) {
          return failure(original, 'ENTRY_HINT_REQUIRED', 'No authoritative catalog entry is known for this node', false, requirement);
        }
        const view = await source.client.getNode(entryId, requirement.nodeId);
        if (!isCurrent(source)) return { kind: 'STALE', state: original };
        if (view.trackId !== source.authority.trackId) {
          return failure(original, 'AUTHORITY_MISMATCH', 'The fetched node belongs to a different authoritative track', false, requirement);
        }
        rememberViewHints(view, nodeEntryHints);
        nodeViews.push(view);
        const next = registerBatch(current, {
          authority: source.authority,
          nodes: [nodeViewToSelectionFact(view)],
        }, original, requirement);
        if ('kind' in next) return next;
        current = next;
        continue;
      }

      if (requirement.kind === 'GROUP_FACT') {
        const entryId = groupEntryHints[requirement.groupId];
        if (!entryId) {
          return failure(original, 'ENTRY_HINT_REQUIRED', 'No authoritative catalog entry is known for this navigation group', false, requirement);
        }
        const roots = await source.client.listRoots(entryId);
        if (!isCurrent(source)) return { kind: 'STALE', state: original };
        const groups = rootItemsToSelectionGroupFacts(roots);
        if (!groups.some(({ id }) => id === requirement.groupId)) {
          return failure(original, 'NO_PROGRESS', 'The authoritative root list did not contain the requested navigation group', true, requirement);
        }
        for (const item of roots) {
          if (item.itemKind === 'NODE') nodeEntryHints[item.nodeId] = entryId;
          else {
            groupEntryHints[item.id] = entryId;
            for (const nodeId of item.childNodeIds) nodeEntryHints[nodeId] = entryId;
          }
        }
        const next = registerBatch(current, { authority: source.authority, groups }, original, requirement);
        if ('kind' in next) return next;
        current = next;
        continue;
      }

      const entryId = nodeEntryHints[requirement.parentId];
      if (!entryId) {
        return failure(original, 'ENTRY_HINT_REQUIRED', 'No authoritative catalog entry is known for this parent', false, requirement);
      }
      for (const range of requirement.ranges) {
        let offset = range.offset;
        const requestedEnd = range.offset + range.limit;
        while (offset < requestedEnd) {
          const limit = Math.min(100, requestedEnd - offset);
          const page = await source.client.listChildren(entryId, requirement.parentId, offset, limit);
          if (!isCurrent(source)) return { kind: 'STALE', state: original };
          if (page.offset !== offset) {
            return failure(original, 'NO_PROGRESS', 'The authoritative child page did not start at the requested offset', true, requirement);
          }
          if (page.items.some((item) => item.trackId !== source.authority.trackId)) {
            return failure(original, 'AUTHORITY_MISMATCH', 'A fetched child belongs to a different authoritative track', false, requirement);
          }
          if (page.items.length === 0 && offset < Math.min(page.total, requestedEnd)) {
            return failure(original, 'NO_PROGRESS', 'The authoritative child page did not advance the requested range', true, requirement);
          }
          for (const item of page.items) rememberViewHints(item, nodeEntryHints);
          nodeViews.push(...page.items);
          const next = registerBatch(current, {
            authority: source.authority,
            childPages: [childPageToSelectionFact(requirement.parentId, page)],
          }, original, requirement);
          if ('kind' in next) return next;
          current = next;
          if (page.items.length === 0 || offset + page.items.length >= page.total) break;
          offset += page.items.length;
        }
      }
    } catch (cause) {
      return failure(
        original,
        'REQUEST_FAILED',
        cause instanceof Error ? cause.message : 'Authoritative Curriculum request failed',
        true,
        requirement,
        cause,
      );
    }
  }

  return {
    kind: 'LOADED',
    state: current,
    nodeEntryHints: Object.freeze(nodeEntryHints),
    groupEntryHints: Object.freeze(groupEntryHints),
    nodeViews: Object.freeze(nodeViews),
  };
}

type RetryableSelectionOperation = (
  state: TriStateSelectionState,
) => SelectionMutationResult | SelectionQueryResult | SelectionSerializationResult;

export type SelectionOperationResult =
  | { kind: 'UPDATED'; state: TriStateSelectionState; nodeEntryHints: Readonly<Record<string, string>>; groupEntryHints: Readonly<Record<string, string>>; nodeViews: readonly CurriculumCatalogNodeView[] }
  | { kind: 'QUERIED'; value: Extract<SelectionQueryResult, { kind: 'KNOWN' }>['value']; state: TriStateSelectionState; nodeEntryHints: Readonly<Record<string, string>>; groupEntryHints: Readonly<Record<string, string>>; nodeViews: readonly CurriculumCatalogNodeView[] }
  | { kind: 'SERIALIZED'; value: Extract<SelectionSerializationResult, { kind: 'SERIALIZED' }>['value']; state: TriStateSelectionState; nodeEntryHints: Readonly<Record<string, string>>; groupEntryHints: Readonly<Record<string, string>>; nodeViews: readonly CurriculumCatalogNodeView[] }
  | (Extract<SelectionMutationResult, { kind: 'SELECTOR_LIMIT_EXCEEDED' }> & { state: TriStateSelectionState; nodeEntryHints: Readonly<Record<string, string>>; groupEntryHints: Readonly<Record<string, string>>; nodeViews: readonly CurriculumCatalogNodeView[] })
  | SelectionAdapterStale
  | SelectionAdapterFailure;

export async function runSelectionOperationWithRetry(
  state: TriStateSelectionState,
  operation: RetryableSelectionOperation,
  source: SelectionAdapterSource,
): Promise<SelectionOperationResult> {
  const original = state;
  let current = state;
  let nodeEntryHints = source.nodeEntryHints;
  let groupEntryHints = source.groupEntryHints;
  let nodeViews: readonly CurriculumCatalogNodeView[] = [];
  const seenRetryTokens = new Set<string>();

  for (let attempt = 0; attempt < 32; attempt += 1) {
    if (!isCurrent(source)) return { kind: 'STALE', state: original };
    const result = operation(current);
    if (result.kind === 'UPDATED') return { ...result, nodeEntryHints, groupEntryHints, nodeViews };
    if (result.kind === 'KNOWN') return { kind: 'QUERIED', value: result.value, state: current, nodeEntryHints, groupEntryHints, nodeViews };
    if (result.kind === 'SERIALIZED') return { ...result, state: current, nodeEntryHints, groupEntryHints, nodeViews };
    if (result.kind === 'SELECTOR_LIMIT_EXCEEDED') return { ...result, state: original, nodeEntryHints, groupEntryHints, nodeViews };
    if (seenRetryTokens.has(result.retryToken)) {
      return failure(original, 'RETRY_STALLED', 'The same structure requirement repeated without progress', true);
    }
    seenRetryTokens.add(result.retryToken);
    const beforeVersion = current.factsVersion;
    const loaded = await loadSelectionRequirements(current, result.requirements, {
      ...source,
      nodeEntryHints,
      groupEntryHints,
    });
    if (loaded.kind !== 'LOADED') return loaded.kind === 'STALE' ? loaded : { ...loaded, state: original };
    if (loaded.state.factsVersion <= beforeVersion) {
      return failure(original, 'RETRY_STALLED', 'Authoritative fact loading did not advance the engine facts version', true);
    }
    current = loaded.state;
    nodeEntryHints = loaded.nodeEntryHints;
    groupEntryHints = loaded.groupEntryHints;
    nodeViews = Object.freeze([...nodeViews, ...loaded.nodeViews]);
  }

  return failure(original, 'RETRY_STALLED', 'The selection operation exceeded its finite retry budget', true);
}

export const invalidatesSelectionSession = (failure: SelectionAdapterFailure): boolean => (
  failure.code === 'AUTHORITY_MISMATCH' || failure.code === 'FACT_CONFLICT'
);

export const selectionAdapterErrorText = (failure: SelectionAdapterFailure): string => {
  switch (failure.code) {
    case 'AUTHORITY_MISMATCH':
    case 'FACT_CONFLICT':
      return 'ساختار برنامه درسی با این پنجره سازگار نیست. پنجره را ببندید و دوباره باز کنید.';
    case 'ENTRY_HINT_REQUIRED':
      return 'ساختار لازم برای این مبحث در دسترس نیست. پنجره را ببندید و دوباره باز کنید.';
    case 'REQUEST_FAILED':
      return 'دریافت ساختار لازم انجام نشد. اتصال را بررسی و دوباره تلاش کنید.';
    case 'NO_PROGRESS':
    case 'RETRY_STALLED':
      return 'ساختار لازم کامل دریافت نشد. دوباره تلاش کنید.';
  }
};
