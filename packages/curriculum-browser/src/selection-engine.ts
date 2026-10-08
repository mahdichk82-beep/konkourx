import type { CurriculumTrackId } from './types.ts';

export type CurriculumSelectionAuthority = {
  trackId: CurriculumTrackId;
  catalogRevision: string;
};

export type CurriculumSelectorV2 =
  | { rootKind: 'NODE'; rootId: string; selector: 'EXACT' | 'SUBTREE' }
  | { rootKind: 'NAVIGATION_GROUP'; rootId: string; selector: 'SUBTREE' };

export type CurriculumSelectionV2 = {
  version: 2;
  selectors: readonly CurriculumSelectorV2[];
};

export type CurriculumSelectionNodeFact = {
  id: string;
  parentId: string | null;
  ancestorIds: readonly string[];
  childrenCount: number;
  sourceOrder: number;
};

export type CurriculumSelectionChildPageFact = {
  parentId: string;
  offset: number;
  total: number;
  children: readonly CurriculumSelectionNodeFact[];
};

export type CurriculumSelectionGroupFact = {
  id: string;
  childNodeIds: readonly string[];
  sourceOrder: number;
};

export type RegisteredCurriculumChildren = {
  total: number;
  childIds: readonly (string | null)[];
  complete: boolean;
};

export type TriStateSelectionFacts = {
  nodes: Readonly<Record<string, CurriculumSelectionNodeFact>>;
  childPages: Readonly<Record<string, RegisteredCurriculumChildren>>;
  groups: Readonly<Record<string, CurriculumSelectionGroupFact>>;
};

export type TriStateSelectionState = {
  authority: CurriculumSelectionAuthority;
  selection: CurriculumSelectionV2;
  factsVersion: number;
  facts: TriStateSelectionFacts;
};

export type CurriculumSelectionFactBatch = {
  authority: CurriculumSelectionAuthority;
  nodes?: readonly CurriculumSelectionNodeFact[];
  childPages?: readonly CurriculumSelectionChildPageFact[];
  groups?: readonly CurriculumSelectionGroupFact[];
};

export type RegisterTriStateSelectionFactsResult =
  | { kind: 'REGISTERED'; state: TriStateSelectionState }
  | {
      kind: 'AUTHORITY_MISMATCH';
      expected: CurriculumSelectionAuthority;
      received: CurriculumSelectionAuthority;
    }
  | { kind: 'FACT_CONFLICT'; fact: string; message: string };

export type CurriculumCheckboxState = 'UNCHECKED' | 'CHECKED' | 'INDETERMINATE';

export type CurriculumStructureRequirement =
  | { kind: 'NODE_FACT'; nodeId: string }
  | { kind: 'GROUP_FACT'; groupId: string }
  | { kind: 'SELECTOR_ANCESTRY'; nodeId: string }
  | {
      kind: 'CHILD_PAGE';
      parentId: string;
      ranges: readonly { offset: number; limit: number }[];
    };

export type StructureRequiredResult = {
  kind: 'STRUCTURE_REQUIRED';
  requirements: readonly CurriculumStructureRequirement[];
  factsVersion: number;
  retryToken: string;
};

export type SelectionQueryResult =
  | { kind: 'KNOWN'; value: CurriculumCheckboxState }
  | StructureRequiredResult;

export type SelectorLimitExceededResult = {
  kind: 'SELECTOR_LIMIT_EXCEEDED';
  limit: 50;
  rawCount: number;
  normalizedCount: number;
};

export type SelectionMutationResult =
  | { kind: 'UPDATED'; state: TriStateSelectionState }
  | StructureRequiredResult
  | SelectorLimitExceededResult;

export type SelectionSerializationResult =
  | { kind: 'SERIALIZED'; value: CurriculumSelectionV2 }
  | StructureRequiredResult
  | SelectorLimitExceededResult;

const emptyRecord = <T>(): Readonly<Record<string, T>> => Object.freeze({});

const freezeAuthority = (value: CurriculumSelectionAuthority): CurriculumSelectionAuthority => Object.freeze({
  trackId: value.trackId,
  catalogRevision: value.catalogRevision,
});

const freezeSelector = (value: CurriculumSelectorV2): CurriculumSelectorV2 => Object.freeze({ ...value });

const selectorKey = (selector: CurriculumSelectorV2): string => (
  `${selector.rootKind}\u0000${selector.rootId}\u0000${selector.selector}`
);

const freezeNodeFact = (fact: CurriculumSelectionNodeFact): CurriculumSelectionNodeFact => Object.freeze({
  id: fact.id,
  parentId: fact.parentId,
  ancestorIds: Object.freeze([...fact.ancestorIds]),
  childrenCount: fact.childrenCount,
  sourceOrder: fact.sourceOrder,
});

const freezeGroupFact = (fact: CurriculumSelectionGroupFact): CurriculumSelectionGroupFact => Object.freeze({
  id: fact.id,
  childNodeIds: Object.freeze([...fact.childNodeIds]),
  sourceOrder: fact.sourceOrder,
});

const sameStrings = (left: readonly string[], right: readonly string[]): boolean => (
  left.length === right.length && left.every((value, index) => value === right[index])
);

const sameNodeFact = (
  left: CurriculumSelectionNodeFact,
  right: CurriculumSelectionNodeFact,
): boolean => left.id === right.id
  && left.parentId === right.parentId
  && sameStrings(left.ancestorIds, right.ancestorIds)
  && left.childrenCount === right.childrenCount
  && left.sourceOrder === right.sourceOrder;

const sameGroupFact = (
  left: CurriculumSelectionGroupFact,
  right: CurriculumSelectionGroupFact,
): boolean => left.id === right.id
  && sameStrings(left.childNodeIds, right.childNodeIds)
  && left.sourceOrder === right.sourceOrder;

const factConflict = (fact: string, message: string): RegisterTriStateSelectionFactsResult => ({
  kind: 'FACT_CONFLICT',
  fact,
  message,
});

type FactConflictResult = Extract<RegisterTriStateSelectionFactsResult, { kind: 'FACT_CONFLICT' }>;

const validateMergedFacts = (
  nodes: Readonly<Record<string, CurriculumSelectionNodeFact>>,
  childPages: Readonly<Record<string, RegisteredCurriculumChildren>>,
  groups: Readonly<Record<string, CurriculumSelectionGroupFact>>,
): FactConflictResult | undefined => {
  for (const node of Object.values(nodes)) {
    if (!Number.isSafeInteger(node.childrenCount) || node.childrenCount < 0
      || !Number.isSafeInteger(node.sourceOrder) || node.sourceOrder < 0) {
      return factConflict(`node:${node.id}`, 'Node counts and source order must be non-negative safe integers') as FactConflictResult;
    }
    if (node.ancestorIds.includes(node.id) || new Set(node.ancestorIds).size !== node.ancestorIds.length) {
      return factConflict(`node:${node.id}`, 'Node ancestry cannot contain itself or repeated ancestors') as FactConflictResult;
    }
    if (node.parentId === null && node.ancestorIds.length > 0) {
      return factConflict(`node:${node.id}`, 'A root node cannot declare ancestors') as FactConflictResult;
    }
    if (node.parentId !== null && node.ancestorIds.at(-1) !== node.parentId) {
      return factConflict(`node:${node.id}`, 'A node ancestry must end with its direct parent') as FactConflictResult;
    }
    const parent = node.parentId === null ? undefined : nodes[node.parentId];
    if (parent && !sameStrings(node.ancestorIds, [...parent.ancestorIds, parent.id])) {
      return factConflict(`node:${node.id}`, 'Node ancestry conflicts with its registered parent chain') as FactConflictResult;
    }
    const page = childPages[node.id];
    if (page && page.total !== node.childrenCount) {
      return factConflict(`children:${node.id}`, 'Child page total conflicts with the parent node child count') as FactConflictResult;
    }
  }

  for (const node of Object.values(nodes)) {
    const seen = new Set<string>([node.id]);
    let parentId = node.parentId;
    while (parentId !== null) {
      if (seen.has(parentId)) {
        return factConflict(`node:${node.id}`, 'Registered parent relationships contain a cycle') as FactConflictResult;
      }
      seen.add(parentId);
      parentId = nodes[parentId]?.parentId ?? null;
    }
  }

  for (const [parentId, page] of Object.entries(childPages)) {
    if (!Number.isSafeInteger(page.total) || page.total < 0 || page.childIds.length !== page.total) {
      return factConflict(`children:${parentId}`, 'Child page total must be a non-negative safe integer') as FactConflictResult;
    }
    const knownIds = page.childIds.filter((id): id is string => id !== null);
    if (new Set(knownIds).size !== knownIds.length) {
      return factConflict(`children:${parentId}`, 'A child identity cannot occupy more than one page position') as FactConflictResult;
    }
    for (const childId of knownIds) {
      const child = nodes[childId];
      if (!child || child.parentId !== parentId) {
        return factConflict(`children:${parentId}`, `Child ${childId} conflicts with its registered parent`) as FactConflictResult;
      }
    }
  }

  for (const group of Object.values(groups)) {
    if (!Number.isSafeInteger(group.sourceOrder) || group.sourceOrder < 0) {
      return factConflict(`group:${group.id}`, 'Navigation group source order must be a non-negative safe integer') as FactConflictResult;
    }
    if (group.childNodeIds.length === 0) {
      return factConflict(`group:${group.id}`, 'A navigation group must contain at least one canonical child root') as FactConflictResult;
    }
    if (new Set(group.childNodeIds).size !== group.childNodeIds.length) {
      return factConflict(`group:${group.id}`, 'A navigation group cannot repeat a canonical child root') as FactConflictResult;
    }
  }
  return undefined;
};

export function createTriStateSelectionState(
  authority: CurriculumSelectionAuthority,
  selection: CurriculumSelectionV2 = { version: 2, selectors: [] },
): TriStateSelectionState {
  const seen = new Set<string>();
  const selectors = selection.selectors.flatMap((selector) => {
    const key = selectorKey(selector);
    if (seen.has(key)) return [];
    seen.add(key);
    return [freezeSelector(selector)];
  });

  return Object.freeze({
    authority: freezeAuthority(authority),
    selection: Object.freeze({ version: 2 as const, selectors: Object.freeze(selectors) }),
    factsVersion: 0,
    facts: Object.freeze({
      nodes: emptyRecord<CurriculumSelectionNodeFact>(),
      childPages: emptyRecord<RegisteredCurriculumChildren>(),
      groups: emptyRecord<CurriculumSelectionGroupFact>(),
    }),
  });
}

export function registerTriStateSelectionFacts(
  state: TriStateSelectionState,
  batch: CurriculumSelectionFactBatch,
): RegisterTriStateSelectionFactsResult {
  if (state.authority.trackId !== batch.authority.trackId
    || state.authority.catalogRevision !== batch.authority.catalogRevision) {
    return {
      kind: 'AUTHORITY_MISMATCH',
      expected: state.authority,
      received: freezeAuthority(batch.authority),
    };
  }

  const nodes: Record<string, CurriculumSelectionNodeFact> = { ...state.facts.nodes };
  const childPages: Record<string, RegisteredCurriculumChildren> = { ...state.facts.childPages };
  const groups: Record<string, CurriculumSelectionGroupFact> = { ...state.facts.groups };
  let changed = false;

  const registerNode = (fact: CurriculumSelectionNodeFact): RegisterTriStateSelectionFactsResult | undefined => {
    if (!Number.isSafeInteger(fact.childrenCount) || fact.childrenCount < 0
      || !Number.isSafeInteger(fact.sourceOrder) || fact.sourceOrder < 0) {
      return factConflict(`node:${fact.id}`, 'Node counts and source order must be non-negative safe integers');
    }
    if (fact.parentId === null && fact.ancestorIds.length > 0) {
      return factConflict(`node:${fact.id}`, 'A root node cannot declare ancestors');
    }
    if (fact.parentId !== null && fact.ancestorIds.at(-1) !== fact.parentId) {
      return factConflict(`node:${fact.id}`, 'A node ancestry must end with its direct parent');
    }
    const existing = nodes[fact.id];
    if (existing) {
      return sameNodeFact(existing, fact)
        ? undefined
        : factConflict(`node:${fact.id}`, 'Node metadata conflicts with registered authoritative facts');
    }
    nodes[fact.id] = freezeNodeFact(fact);
    changed = true;
    return undefined;
  };

  for (const fact of batch.nodes ?? []) {
    const conflict = registerNode(fact);
    if (conflict) return conflict;
  }

  for (const page of batch.childPages ?? []) {
    if (!Number.isSafeInteger(page.offset) || !Number.isSafeInteger(page.total)
      || page.offset < 0 || page.total < 0 || page.offset + page.children.length > page.total) {
      return factConflict(`children:${page.parentId}`, 'Child page bounds conflict with its declared total');
    }
    const existing = childPages[page.parentId];
    if (existing && existing.total !== page.total) {
      return factConflict(`children:${page.parentId}`, 'Child page total conflicts with registered facts');
    }

    const childIds = existing ? [...existing.childIds] : Array<string | null>(page.total).fill(null);
    for (const [relativeIndex, childFact] of page.children.entries()) {
      if (childFact.parentId !== page.parentId) {
        return factConflict(`children:${page.parentId}`, `Child ${childFact.id} has a conflicting parent`);
      }
      const conflict = registerNode(childFact);
      if (conflict) return conflict;
      const index = page.offset + relativeIndex;
      const registeredId = childIds[index];
      if (registeredId !== null && registeredId !== childFact.id) {
        return factConflict(`children:${page.parentId}:${index}`, 'Child identity conflicts at a registered page position');
      }
      if (registeredId === null) {
        childIds[index] = childFact.id;
        changed = true;
      }
    }
    const complete = childIds.every((id) => id !== null);
    const samePage = existing
      && existing.complete === complete
      && existing.childIds.every((id, index) => id === childIds[index]);
    if (!samePage) {
      childPages[page.parentId] = Object.freeze({
        total: page.total,
        childIds: Object.freeze(childIds),
        complete,
      });
      changed = true;
    }
  }

  for (const fact of batch.groups ?? []) {
    const existing = groups[fact.id];
    if (existing) {
      if (!sameGroupFact(existing, fact)) {
        return factConflict(`group:${fact.id}`, 'Navigation group metadata conflicts with registered facts');
      }
      continue;
    }
    groups[fact.id] = freezeGroupFact(fact);
    changed = true;
  }

  const mergedConflict = validateMergedFacts(nodes, childPages, groups);
  if (mergedConflict) return mergedConflict;

  if (!changed) return { kind: 'REGISTERED', state };

  return {
    kind: 'REGISTERED',
    state: Object.freeze({
      authority: state.authority,
      selection: state.selection,
      factsVersion: state.factsVersion + 1,
      facts: Object.freeze({
        nodes: Object.freeze(nodes),
        childPages: Object.freeze(childPages),
        groups: Object.freeze(groups),
      }),
    }),
  };
}

const requirementKey = (requirement: CurriculumStructureRequirement): string => {
  if (requirement.kind === 'NODE_FACT') return `NODE_FACT:${requirement.nodeId}`;
  if (requirement.kind === 'GROUP_FACT') return `GROUP_FACT:${requirement.groupId}`;
  if (requirement.kind === 'SELECTOR_ANCESTRY') return `SELECTOR_ANCESTRY:${requirement.nodeId}`;
  return `CHILD_PAGE:${requirement.parentId}:${requirement.ranges
    .map(({ offset, limit }) => `${offset}+${limit}`)
    .join(',')}`;
};

const sortedRequirements = (
  requirements: readonly CurriculumStructureRequirement[],
): CurriculumStructureRequirement[] => {
  const unique = new Map<string, CurriculumStructureRequirement>();
  for (const requirement of requirements) unique.set(requirementKey(requirement), requirement);
  const kindOrder = { CHILD_PAGE: 0, GROUP_FACT: 1, NODE_FACT: 2, SELECTOR_ANCESTRY: 3 } as const;
  return [...unique.values()].sort((left, right) => {
    const byKind = kindOrder[left.kind] - kindOrder[right.kind];
    if (byKind !== 0) return byKind;
    const leftId = left.kind === 'CHILD_PAGE'
      ? left.parentId
      : left.kind === 'GROUP_FACT' ? left.groupId : left.nodeId;
    const rightId = right.kind === 'CHILD_PAGE'
      ? right.parentId
      : right.kind === 'GROUP_FACT' ? right.groupId : right.nodeId;
    return leftId.localeCompare(rightId);
  });
};

const structureRequired = (
  state: TriStateSelectionState,
  operation: string,
  requirements: readonly CurriculumStructureRequirement[],
): StructureRequiredResult => {
  const sorted = sortedRequirements(requirements);
  return {
    kind: 'STRUCTURE_REQUIRED',
    requirements: sorted,
    factsVersion: state.factsVersion,
    retryToken: `${operation}:${state.factsVersion}:${sorted.map(requirementKey).join('|')}`,
  };
};

type InternalQueryResult =
  | { value: CurriculumCheckboxState }
  | { requirements: CurriculumStructureRequirement[] };

const queryKnownNode = (
  state: TriStateSelectionState,
  nodeId: string,
  visiting: ReadonlySet<string>,
): InternalQueryResult => {
  const node = state.facts.nodes[nodeId];
  if (!node) return { requirements: [{ kind: 'NODE_FACT', nodeId }] };

  const unknownSelectors: CurriculumStructureRequirement[] = [];
  let relatedCoverage = false;
  let ownNonTerminalExact = false;

  for (const selector of state.selection.selectors) {
    if (selector.rootKind === 'NAVIGATION_GROUP') {
      const group = state.facts.groups[selector.rootId];
      if (!group) {
        unknownSelectors.push({ kind: 'GROUP_FACT', groupId: selector.rootId });
        continue;
      }
      for (const childNodeId of group.childNodeIds) {
        const childNode = state.facts.nodes[childNodeId];
        if (!childNode) {
          unknownSelectors.push({ kind: 'NODE_FACT', nodeId: childNodeId });
          continue;
        }
        if (nodeId === childNodeId || node.ancestorIds.includes(childNodeId)) {
          return { value: 'CHECKED' };
        }
        if (childNode.ancestorIds.includes(nodeId)) relatedCoverage = true;
      }
      continue;
    }
    if (selector.rootId === nodeId) {
      if (selector.selector === 'SUBTREE') return { value: 'CHECKED' };
      if (node.childrenCount === 0) return { value: 'CHECKED' };
      ownNonTerminalExact = true;
      relatedCoverage = true;
      continue;
    }

    const selectorNode = state.facts.nodes[selector.rootId];
    if (!selectorNode) {
      unknownSelectors.push({ kind: 'SELECTOR_ANCESTRY', nodeId: selector.rootId });
      continue;
    }
    if (selector.selector === 'SUBTREE' && node.ancestorIds.includes(selector.rootId)) {
      return { value: 'CHECKED' };
    }
    if (selectorNode.ancestorIds.includes(nodeId)) relatedCoverage = true;
  }

  if (!visiting.has(nodeId)) {
    const childPage = state.facts.childPages[nodeId];
    if (childPage?.complete && childPage.total > 0) {
      const nextVisiting = new Set(visiting);
      nextVisiting.add(nodeId);
      const childResults = childPage.childIds.map((childId): InternalQueryResult => (
        childId === null
          ? { requirements: [] }
          : queryKnownNode(state, childId, nextVisiting)
      ));
      if (childResults.length === childPage.total
        && childResults.every((result) => 'value' in result && result.value === 'CHECKED')) {
        return { value: 'CHECKED' };
      }
      if (childResults.some((result) => 'value' in result && result.value !== 'UNCHECKED')) {
        relatedCoverage = true;
      }
    }
  }

  if (relatedCoverage || ownNonTerminalExact) return { value: 'INDETERMINATE' };
  if (unknownSelectors.length > 0) return { requirements: unknownSelectors };
  return { value: 'UNCHECKED' };
};

export function queryNodeSelection(
  state: TriStateSelectionState,
  nodeId: string,
): SelectionQueryResult {
  const result = queryKnownNode(state, nodeId, new Set());
  return 'value' in result
    ? { kind: 'KNOWN', value: result.value }
    : structureRequired(state, `query:${nodeId}`, result.requirements);
}

const stateWithSelection = (
  state: TriStateSelectionState,
  selectors: readonly CurriculumSelectorV2[],
): TriStateSelectionState => Object.freeze({
  authority: state.authority,
  selection: Object.freeze({
    version: 2 as const,
    selectors: Object.freeze(selectors.map(freezeSelector)),
  }),
  factsVersion: state.factsVersion,
  facts: state.facts,
});

const isNodeWithin = (
  state: TriStateSelectionState,
  nodeId: string,
  ancestorId: string,
): boolean => nodeId === ancestorId
  || state.facts.nodes[nodeId]?.ancestorIds.includes(ancestorId) === true;

const selectorSortPath = (
  state: TriStateSelectionState,
  selector: CurriculumSelectorV2,
): readonly { order: number; id: string }[] => {
  if (selector.rootKind === 'NAVIGATION_GROUP') {
    const group = state.facts.groups[selector.rootId];
    return [{ order: group?.sourceOrder ?? Number.MAX_SAFE_INTEGER, id: selector.rootId }];
  }
  const node = state.facts.nodes[selector.rootId];
  if (!node) return [{ order: Number.MAX_SAFE_INTEGER, id: selector.rootId }];
  return [...node.ancestorIds, node.id].map((id) => ({
    order: state.facts.nodes[id]?.sourceOrder ?? Number.MAX_SAFE_INTEGER,
    id,
  }));
};

const compareSelectors = (
  state: TriStateSelectionState,
  left: CurriculumSelectorV2,
  right: CurriculumSelectorV2,
): number => {
  const leftPath = selectorSortPath(state, left);
  const rightPath = selectorSortPath(state, right);
  for (let index = 0; index < Math.min(leftPath.length, rightPath.length); index += 1) {
    const byOrder = leftPath[index].order - rightPath[index].order;
    if (byOrder !== 0) return byOrder;
    const byId = leftPath[index].id.localeCompare(rightPath[index].id);
    if (byId !== 0) return byId;
  }
  if (leftPath.length !== rightPath.length) return leftPath.length - rightPath.length;
  return selectorKey(left).localeCompare(selectorKey(right));
};

type NormalizeResult =
  | { selectors: CurriculumSelectorV2[] }
  | { requirements: CurriculumStructureRequirement[] };

const normalizeNodeSelectors = (
  state: TriStateSelectionState,
  input: readonly CurriculumSelectorV2[],
): NormalizeResult => {
  const deduplicated = new Map<string, CurriculumSelectorV2>();
  for (const selector of input) deduplicated.set(selectorKey(selector), selector);
  let selectors = [...deduplicated.values()];

  const unknown = selectors.flatMap((selector): CurriculumStructureRequirement[] => (
    selector.rootKind === 'NODE'
      ? (!state.facts.nodes[selector.rootId]
        ? [{ kind: 'SELECTOR_ANCESTRY', nodeId: selector.rootId }]
        : [])
      : (() => {
        const group = state.facts.groups[selector.rootId];
        if (!group) return [{ kind: 'GROUP_FACT', groupId: selector.rootId }];
        return group.childNodeIds.flatMap((nodeId): CurriculumStructureRequirement[] => (
          state.facts.nodes[nodeId] ? [] : [{ kind: 'NODE_FACT', nodeId }]
        ));
      })()
  ));
  if (unknown.length > 0) return { requirements: unknown };

  const groupRoots = selectors.flatMap((selector) => selector.rootKind === 'NAVIGATION_GROUP'
    ? state.facts.groups[selector.rootId].childNodeIds
    : []);

  selectors = selectors.filter((selector) => {
    if (selector.rootKind !== 'NODE') return true;
    if (groupRoots.some((rootId) => isNodeWithin(state, selector.rootId, rootId))) return false;
    return !selectors.some((candidate) => candidate !== selector
      && candidate.rootKind === 'NODE'
      && candidate.selector === 'SUBTREE'
      && isNodeWithin(state, selector.rootId, candidate.rootId));
  });

  const completeParents = Object.entries(state.facts.childPages)
    .filter(([, page]) => page.complete && page.total > 0)
    .map(([parentId]) => parentId)
    .sort((left, right) => {
      const leftDepth = state.facts.nodes[left]?.ancestorIds.length ?? -1;
      const rightDepth = state.facts.nodes[right]?.ancestorIds.length ?? -1;
      return rightDepth - leftDepth || left.localeCompare(right);
    });

  for (const parentId of completeParents) {
    const alreadyCovered = selectors.some((selector) => selector.rootKind === 'NODE'
      && selector.selector === 'SUBTREE'
      && isNodeWithin(state, parentId, selector.rootId));
    if (alreadyCovered) continue;
    const page = state.facts.childPages[parentId];
    const candidateState = stateWithSelection(
      state,
      selectors.filter((selector) => selector.rootKind === 'NODE'),
    );
    const allChildrenChecked = page.childIds.every((childId) => {
      if (childId === null) return false;
      const result = queryKnownNode(candidateState, childId, new Set());
      return 'value' in result && result.value === 'CHECKED';
    });
    if (!allChildrenChecked) continue;
    selectors = selectors.filter((selector) => selector.rootKind !== 'NODE'
      || !isNodeWithin(state, selector.rootId, parentId));
    selectors.push({ rootKind: 'NODE', rootId: parentId, selector: 'SUBTREE' });
  }

  selectors = selectors.filter((selector) => {
    if (selector.rootKind !== 'NODE') return true;
    return !selectors.some((candidate) => candidate !== selector
      && candidate.rootKind === 'NODE'
      && candidate.selector === 'SUBTREE'
      && isNodeWithin(state, selector.rootId, candidate.rootId));
  });
  selectors.sort((left, right) => compareSelectors(state, left, right));
  return { selectors };
};

const missingPageRanges = (
  state: TriStateSelectionState,
  parentId: string,
): readonly { offset: number; limit: number }[] => {
  const page = state.facts.childPages[parentId];
  const total = page?.total ?? state.facts.nodes[parentId]?.childrenCount ?? 0;
  const childIds = page?.childIds ?? Array<string | null>(total).fill(null);
  const ranges: { offset: number; limit: number }[] = [];
  let start: number | undefined;
  for (let index = 0; index <= total; index += 1) {
    const missing = index < total && childIds[index] === null;
    if (missing && start === undefined) start = index;
    if (!missing && start !== undefined) {
      ranges.push({ offset: start, limit: index - start });
      start = undefined;
    }
  }
  return ranges;
};

const finishMutation = (
  state: TriStateSelectionState,
  operation: string,
  candidate: readonly CurriculumSelectorV2[],
): SelectionMutationResult => {
  const evaluated = evaluateSelectionExpression(state, candidate);
  if ('requirements' in evaluated) {
    return structureRequired(state, operation, evaluated.requirements);
  }
  if (evaluated.raw.length > 50 || evaluated.normalized.length > 50) {
    return {
      kind: 'SELECTOR_LIMIT_EXCEEDED',
      limit: 50,
      rawCount: evaluated.raw.length,
      normalizedCount: evaluated.normalized.length,
    };
  }
  return { kind: 'UPDATED', state: stateWithSelection(state, evaluated.raw) };
};

type EvaluatedSelectionExpression =
  | { raw: CurriculumSelectorV2[]; normalized: CurriculumSelectorV2[] }
  | { requirements: CurriculumStructureRequirement[] };

const evaluateSelectionExpression = (
  state: TriStateSelectionState,
  input: readonly CurriculumSelectorV2[],
): EvaluatedSelectionExpression => {
  const raw = normalizeNodeSelectors(state, input);
  if ('requirements' in raw) return raw;
  const projected: CurriculumSelectorV2[] = [];
  for (const selector of raw.selectors) {
    if (selector.rootKind === 'NODE') {
      projected.push(selector);
      continue;
    }
    const group = state.facts.groups[selector.rootId];
    if (!group) return { requirements: [{ kind: 'GROUP_FACT', groupId: selector.rootId }] };
    for (const nodeId of group.childNodeIds) {
      const node = state.facts.nodes[nodeId];
      if (!node) return { requirements: [{ kind: 'NODE_FACT', nodeId }] };
      projected.push({
        rootKind: 'NODE',
        rootId: nodeId,
        selector: node.childrenCount === 0 ? 'EXACT' : 'SUBTREE',
      });
    }
  }
  const normalized = normalizeNodeSelectors(state, projected);
  if ('requirements' in normalized) return normalized;
  return { raw: raw.selectors, normalized: normalized.selectors };
};

export function serializeTriStateSelection(
  state: TriStateSelectionState,
): SelectionSerializationResult {
  const evaluated = evaluateSelectionExpression(state, state.selection.selectors);
  if ('requirements' in evaluated) {
    return structureRequired(state, 'serialize', evaluated.requirements);
  }
  if (evaluated.raw.length > 50 || evaluated.normalized.length > 50) {
    return {
      kind: 'SELECTOR_LIMIT_EXCEEDED',
      limit: 50,
      rawCount: evaluated.raw.length,
      normalizedCount: evaluated.normalized.length,
    };
  }
  return {
    kind: 'SERIALIZED',
    value: Object.freeze({
      version: 2 as const,
      selectors: Object.freeze(evaluated.raw.map(freezeSelector)),
    }),
  };
}

export function selectNode(state: TriStateSelectionState, nodeId: string): SelectionMutationResult {
  const node = state.facts.nodes[nodeId];
  if (!node) return structureRequired(state, `select-node:${nodeId}`, [{ kind: 'NODE_FACT', nodeId }]);
  const selector: CurriculumSelectorV2 = {
    rootKind: 'NODE',
    rootId: nodeId,
    selector: node.childrenCount === 0 ? 'EXACT' : 'SUBTREE',
  };
  return finishMutation(state, `select-node:${nodeId}`, [...state.selection.selectors, selector]);
}

type DeselectCandidateResult =
  | { selectors: CurriculumSelectorV2[] }
  | { requirements: CurriculumStructureRequirement[] };

const selectorForCompleteRoot = (
  state: TriStateSelectionState,
  nodeId: string,
): CurriculumSelectorV2 => ({
  rootKind: 'NODE',
  rootId: nodeId,
  selector: state.facts.nodes[nodeId].childrenCount === 0 ? 'EXACT' : 'SUBTREE',
});

const planNodeDeselection = (
  state: TriStateSelectionState,
  input: readonly CurriculumSelectorV2[],
  nodeId: string,
  expandGroups = true,
): DeselectCandidateResult => {
  const node = state.facts.nodes[nodeId];
  if (!node) return { requirements: [{ kind: 'NODE_FACT', nodeId }] };
  const normalized = normalizeNodeSelectors(state, input);
  if ('requirements' in normalized) return normalized;
  let selectors = normalized.selectors;

  if (expandGroups) {
    const overlappingGroups = selectors.filter((selector) => {
      if (selector.rootKind !== 'NAVIGATION_GROUP') return false;
      const group = state.facts.groups[selector.rootId];
      return group.childNodeIds.some((rootId) => (
        isNodeWithin(state, nodeId, rootId) || isNodeWithin(state, rootId, nodeId)
      ));
    });
    if (overlappingGroups.length > 0) {
      const groupKeys = new Set(overlappingGroups.map(selectorKey));
      const expanded = selectors.filter((selector) => !groupKeys.has(selectorKey(selector)));
      for (const selector of overlappingGroups) {
        const group = state.facts.groups[selector.rootId];
        expanded.push(...group.childNodeIds.map((rootId) => selectorForCompleteRoot(state, rootId)));
      }
      return planNodeDeselection(state, expanded, nodeId, false);
    }
  }

  const ancestorSubtrees = selectors.filter((selector): selector is Extract<
    CurriculumSelectorV2,
    { rootKind: 'NODE' }
  > => selector.rootKind === 'NODE'
    && selector.selector === 'SUBTREE'
    && selector.rootId !== nodeId
    && node.ancestorIds.includes(selector.rootId));
  const covering = ancestorSubtrees.sort((left, right) => (
    node.ancestorIds.indexOf(left.rootId) - node.ancestorIds.indexOf(right.rootId)
  ))[0];

  if (!covering) {
    return {
      selectors: selectors.filter((selector) => selector.rootKind !== 'NODE'
        || !isNodeWithin(state, selector.rootId, nodeId)),
    };
  }

  const rootIndex = node.ancestorIds.indexOf(covering.rootId);
  const path = [...node.ancestorIds.slice(rootIndex), nodeId];
  const requirements: CurriculumStructureRequirement[] = [];
  for (const parentId of path.slice(0, -1)) {
    if (!state.facts.nodes[parentId]) {
      requirements.push({ kind: 'NODE_FACT', nodeId: parentId });
      continue;
    }
    const page = state.facts.childPages[parentId];
    if (!page?.complete) {
      requirements.push({ kind: 'CHILD_PAGE', parentId, ranges: missingPageRanges(state, parentId) });
      continue;
    }
    for (const childId of page.childIds) {
      if (childId !== null && !state.facts.nodes[childId]) {
        requirements.push({ kind: 'NODE_FACT', nodeId: childId });
      }
    }
  }
  if (requirements.length > 0) return { requirements };

  const candidate = selectors.filter((selector) => selector.rootKind !== 'NODE'
    || !isNodeWithin(state, selector.rootId, covering.rootId));
  for (let index = 0; index < path.length - 1; index += 1) {
    const parentId = path[index];
    const nextId = path[index + 1];
    const page = state.facts.childPages[parentId];
    for (const siblingId of page.childIds) {
      if (siblingId === null || siblingId === nextId) continue;
      candidate.push(selectorForCompleteRoot(state, siblingId));
    }
  }
  return { selectors: candidate };
};

export function deselectNode(state: TriStateSelectionState, nodeId: string): SelectionMutationResult {
  const planned = planNodeDeselection(state, state.selection.selectors, nodeId);
  if ('requirements' in planned) {
    return structureRequired(state, `deselect-node:${nodeId}`, planned.requirements);
  }
  return finishMutation(state, `deselect-node:${nodeId}`, planned.selectors);
}

export function toggleNode(state: TriStateSelectionState, nodeId: string): SelectionMutationResult {
  const query = queryNodeSelection(state, nodeId);
  if (query.kind === 'STRUCTURE_REQUIRED') return query;
  return query.value === 'CHECKED' ? deselectNode(state, nodeId) : selectNode(state, nodeId);
}

const navigationGroupRequirements = (
  state: TriStateSelectionState,
  groupId: string,
): CurriculumStructureRequirement[] => {
  const group = state.facts.groups[groupId];
  if (!group) return [{ kind: 'GROUP_FACT', groupId }];
  return group.childNodeIds.flatMap((nodeId): CurriculumStructureRequirement[] => (
    state.facts.nodes[nodeId] ? [] : [{ kind: 'NODE_FACT', nodeId }]
  ));
};

export function queryNavigationGroupSelection(
  state: TriStateSelectionState,
  groupId: string,
): SelectionQueryResult {
  const requirements = navigationGroupRequirements(state, groupId);
  if (requirements.length > 0) {
    return structureRequired(state, `query-group:${groupId}`, requirements);
  }
  if (state.selection.selectors.some((selector) => selector.rootKind === 'NAVIGATION_GROUP'
    && selector.rootId === groupId)) {
    return { kind: 'KNOWN', value: 'CHECKED' };
  }
  const group = state.facts.groups[groupId];
  const childResults = group.childNodeIds.map((nodeId) => queryNodeSelection(state, nodeId));
  const childRequirements = childResults.flatMap((result) => (
    result.kind === 'STRUCTURE_REQUIRED' ? result.requirements : []
  ));
  if (childRequirements.length > 0) {
    return structureRequired(state, `query-group:${groupId}`, childRequirements);
  }
  const values = childResults.map((result) => (
    result.kind === 'KNOWN' ? result.value : 'UNCHECKED'
  ));
  if (values.length === 0) return { kind: 'KNOWN', value: 'UNCHECKED' };
  if (values.every((value) => value === 'CHECKED')) return { kind: 'KNOWN', value: 'CHECKED' };
  if (values.every((value) => value === 'UNCHECKED')) return { kind: 'KNOWN', value: 'UNCHECKED' };
  return { kind: 'KNOWN', value: 'INDETERMINATE' };
}

export function selectNavigationGroup(
  state: TriStateSelectionState,
  groupId: string,
): SelectionMutationResult {
  const requirements = navigationGroupRequirements(state, groupId);
  if (requirements.length > 0) {
    return structureRequired(state, `select-group:${groupId}`, requirements);
  }
  return finishMutation(state, `select-group:${groupId}`, [
    ...state.selection.selectors,
    { rootKind: 'NAVIGATION_GROUP', rootId: groupId, selector: 'SUBTREE' },
  ]);
}

export function deselectNavigationGroup(
  state: TriStateSelectionState,
  groupId: string,
): SelectionMutationResult {
  const requirements = navigationGroupRequirements(state, groupId);
  if (requirements.length > 0) {
    return structureRequired(state, `deselect-group:${groupId}`, requirements);
  }
  const group = state.facts.groups[groupId];
  const base = state.selection.selectors.filter((selector) => (
    selector.rootKind !== 'NAVIGATION_GROUP' || selector.rootId !== groupId
  ));
  const allRequirements: CurriculumStructureRequirement[] = [];
  for (const childNodeId of group.childNodeIds) {
    const planned = planNodeDeselection(state, base, childNodeId);
    if ('requirements' in planned) allRequirements.push(...planned.requirements);
  }
  if (allRequirements.length > 0) {
    return structureRequired(state, `deselect-group:${groupId}`, allRequirements);
  }

  let candidate = [...base];
  for (const childNodeId of group.childNodeIds) {
    const planned = planNodeDeselection(state, candidate, childNodeId);
    if ('requirements' in planned) {
      return structureRequired(state, `deselect-group:${groupId}`, planned.requirements);
    }
    candidate = planned.selectors;
  }
  return finishMutation(state, `deselect-group:${groupId}`, candidate);
}

export function toggleNavigationGroup(
  state: TriStateSelectionState,
  groupId: string,
): SelectionMutationResult {
  const query = queryNavigationGroupSelection(state, groupId);
  if (query.kind === 'STRUCTURE_REQUIRED') return query;
  return query.value === 'CHECKED'
    ? deselectNavigationGroup(state, groupId)
    : selectNavigationGroup(state, groupId);
}
