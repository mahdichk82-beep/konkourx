import assert from 'node:assert/strict';
import test from 'node:test';

import { createBoundCurriculumClient } from './client.ts';
import {
  childPageToSelectionFact,
  invalidatesSelectionSession,
  loadSelectionRequirements,
  nodeViewToSelectionFact,
  rootItemsToSelectionGroupFacts,
  runSelectionOperationWithRetry,
  selectionAdapterErrorText,
} from './selection-adapter.ts';
import {
  createTriStateSelectionState,
  deselectNode,
  queryNodeSelection,
  registerTriStateSelectionFacts,
  selectNavigationGroup,
  selectNode,
  serializeTriStateSelection,
  type CurriculumSelectionAuthority,
  type CurriculumSelectionNodeFact,
  type TriStateSelectionState,
} from './selection-engine.ts';
import type {
  CurriculumBrowserClient,
  CurriculumCatalogNodeView,
  CurriculumPage,
} from './types.ts';

const authority: CurriculumSelectionAuthority = {
  trackId: 'EXPERIMENTAL',
  catalogRevision: 'modal-session-1',
};

const view = (
  id: string,
  ancestorIds: readonly string[] = [],
  childrenCount = 0,
  sourceOrder = 0,
  trackId: CurriculumCatalogNodeView['trackId'] = 'EXPERIMENTAL',
): CurriculumCatalogNodeView => ({
  ambiguityCodes: [],
  breadcrumb: [
    { kind: 'TRACK', id: trackId, label: 'track' },
    { kind: 'ENTRY', id: 'entry-1', label: 'entry' },
    { kind: 'GROUP', id: 'wrapper', label: 'wrapper' },
    ...ancestorIds.map((ancestorId) => ({ kind: 'NODE' as const, id: ancestorId, label: ancestorId })),
    { kind: 'NODE', id, label: id },
  ],
  childrenCount,
  depth: ancestorIds.length,
  entryId: 'entry-1',
  id,
  parentId: 'outside-entry-parent',
  rawLabel: id,
  representationId: 'rep-1',
  sourceLocator: `source:${id}`,
  sourceMarker: null,
  sourceOrder,
  trackId,
});

const register = (
  state: TriStateSelectionState,
  nodes: readonly CurriculumSelectionNodeFact[],
): TriStateSelectionState => {
  const result = registerTriStateSelectionFacts(state, { authority, nodes });
  assert.equal(result.kind, 'REGISTERED');
  if (result.kind !== 'REGISTERED') assert.fail('expected registered facts');
  return result.state;
};

const source = (
  client: Partial<CurriculumBrowserClient>,
  overrides: Partial<Parameters<typeof runSelectionOperationWithRetry>[2]> = {},
): Parameters<typeof runSelectionOperationWithRetry>[2] => ({
  authority,
  client: client as CurriculumBrowserClient,
  generation: 'generation-1',
  isCurrentGeneration: () => true,
  nodeEntryHints: { root: 'entry-1', target: 'entry-1', sibling: 'entry-1' },
  groupEntryHints: { group: 'entry-1' },
  ...overrides,
});

test('node facts derive ancestry only from NODE breadcrumbs and ignore raw external parents', () => {
  assert.deepEqual(nodeViewToSelectionFact(view('leaf', ['root', 'branch'], 0, 7)), {
    id: 'leaf',
    parentId: 'branch',
    ancestorIds: ['root', 'branch'],
    childrenCount: 0,
    sourceOrder: 7,
  });
  assert.equal(nodeViewToSelectionFact(view('root')).parentId, null);
});

test('child pages preserve offset, total, order, and gaps until every position is known', () => {
  const base = createTriStateSelectionState(authority);
  const second = childPageToSelectionFact('root', {
    items: [view('child-2', ['root'], 0, 2)], limit: 1, offset: 1, total: 2,
  });
  let result = registerTriStateSelectionFacts(base, { authority, childPages: [second] });
  assert.equal(result.kind, 'REGISTERED');
  if (result.kind !== 'REGISTERED') assert.fail('expected second page registration');
  assert.deepEqual(result.state.facts.childPages.root.childIds, [null, 'child-2']);
  assert.equal(result.state.facts.childPages.root.complete, false);

  const first = childPageToSelectionFact('root', {
    items: [view('child-1', ['root'], 0, 1)], limit: 1, offset: 0, total: 2,
  });
  result = registerTriStateSelectionFacts(result.state, { authority, childPages: [first] });
  assert.equal(result.kind, 'REGISTERED');
  if (result.kind !== 'REGISTERED') assert.fail('expected first page registration');
  assert.deepEqual(result.state.facts.childPages.root.childIds, ['child-1', 'child-2']);
  assert.equal(result.state.facts.childPages.root.complete, true);
});

test('GROUP facts retain wrapper identity, child roots, and authoritative root-list order', () => {
  assert.deepEqual(rootItemsToSelectionGroupFacts([
    { itemKind: 'NODE', nodeId: 'standalone' },
    { itemKind: 'GROUP', id: 'group-b', label: 'B', selectable: false, childNodeIds: ['b1'] },
    { itemKind: 'GROUP', id: 'group-a', label: 'A', selectable: false, childNodeIds: ['a1', 'a2'] },
  ]), [
    { id: 'group-b', childNodeIds: ['b1'], sourceOrder: 1 },
    { id: 'group-a', childNodeIds: ['a1', 'a2'], sourceOrder: 2 },
  ]);
});

test('selecting a known non-terminal parent emits SUBTREE without loading descendants', async () => {
  const state = register(createTriStateSelectionState(authority), [nodeViewToSelectionFact(view('root', [], 2))]);
  let childCalls = 0;
  const result = await runSelectionOperationWithRetry(
    state,
    (current) => selectNode(current, 'root'),
    source({ listChildren: async () => { childCalls += 1; throw new Error('unexpected'); } }),
  );
  assert.equal(result.kind, 'UPDATED');
  if (result.kind !== 'UPDATED') assert.fail('expected update');
  assert.deepEqual(result.state.selection.selectors, [
    { rootKind: 'NODE', rootId: 'root', selector: 'SUBTREE' },
  ]);
  assert.equal(childCalls, 0);
});

test('partial deselection loads requested child ranges, retries, and preserves siblings', async () => {
  let state = createTriStateSelectionState(authority, {
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'root', selector: 'SUBTREE' }],
  });
  state = register(state, [
    nodeViewToSelectionFact(view('root', [], 2)),
    nodeViewToSelectionFact(view('target', ['root'])),
  ]);
  const calls: Array<[number | undefined, number | undefined]> = [];
  const client = {
    listChildren: async (_entryId: string, _nodeId: string, offset?: number, limit?: number) => {
      calls.push([offset, limit]);
      return {
        items: [view('target', ['root'], 0, 0), view('sibling', ['root'], 0, 1)],
        limit: 100,
        offset: 0,
        total: 2,
      };
    },
  };
  const result = await runSelectionOperationWithRetry(
    state,
    (current) => deselectNode(current, 'target'),
    source(client),
  );
  assert.equal(result.kind, 'UPDATED');
  if (result.kind !== 'UPDATED') assert.fail('expected update');
  assert.deepEqual(result.state.selection.selectors, [
    { rootKind: 'NODE', rootId: 'sibling', selector: 'EXACT' },
  ]);
  assert.deepEqual(calls, [[0, 2]]);
});

test('query retry hydrates a restored non-root selector without a selection mutation', async () => {
  const state = register(createTriStateSelectionState(authority, {
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'target', selector: 'EXACT' }],
  }), [nodeViewToSelectionFact(view('root', [], 1))]);
  const result = await runSelectionOperationWithRetry(
    state,
    (current) => queryNodeSelection(current, 'root'),
    source({ getNode: async () => view('target', ['root']) }),
  );

  assert.equal(result.kind, 'QUERIED');
  if (result.kind !== 'QUERIED') assert.fail('expected query result');
  assert.equal(result.value, 'INDETERMINATE');
  assert.deepEqual(result.state.selection, state.selection);
  assert.ok(result.state.facts.nodes.target);
});

test('failed fact request is retryable and publishes neither facts nor selection changes', async () => {
  const state = register(createTriStateSelectionState(authority, {
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'root', selector: 'SUBTREE' }],
  }), [nodeViewToSelectionFact(view('root', [], 1)), nodeViewToSelectionFact(view('target', ['root']))]);
  const result = await runSelectionOperationWithRetry(
    state,
    (current) => deselectNode(current, 'target'),
    source({ listChildren: async () => { throw new Error('offline'); } }),
  );
  assert.equal(result.kind, 'ADAPTER_FAILURE');
  if (result.kind !== 'ADAPTER_FAILURE') assert.fail('expected adapter failure');
  assert.equal(result.code, 'REQUEST_FAILED');
  assert.equal(result.retryable, true);
  assert.equal(result.state, state);
});

test('no-progress child pages and repeated retry tokens terminate without looping', async () => {
  const state = register(createTriStateSelectionState(authority, {
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'root', selector: 'SUBTREE' }],
  }), [nodeViewToSelectionFact(view('root', [], 1)), nodeViewToSelectionFact(view('target', ['root']))]);
  const noProgress = await runSelectionOperationWithRetry(
    state,
    (current) => deselectNode(current, 'target'),
    source({
      listChildren: async () => ({ items: [], limit: 1, offset: 0, total: 1 }),
    }),
  );
  assert.equal(noProgress.kind, 'ADAPTER_FAILURE');
  if (noProgress.kind !== 'ADAPTER_FAILURE') assert.fail('expected no-progress failure');
  assert.equal(noProgress.code, 'NO_PROGRESS');

  let attempts = 0;
  const repeated = await runSelectionOperationWithRetry(
    createTriStateSelectionState(authority),
    (current) => {
      attempts += 1;
      return {
        kind: 'STRUCTURE_REQUIRED' as const,
        requirements: [{ kind: 'NODE_FACT' as const, nodeId: 'target' }],
        factsVersion: 0,
        retryToken: 'same-token',
      };
    },
    source({ getNode: async () => view('target') }),
  );
  assert.equal(repeated.kind, 'ADAPTER_FAILURE');
  if (repeated.kind !== 'ADAPTER_FAILURE') assert.fail('expected repeated-token failure');
  assert.equal(repeated.code, 'RETRY_STALLED');
  assert.equal(attempts, 2);
});

test('late requests become STALE and never publish fetched facts', async () => {
  let current = true;
  let release!: (value: CurriculumCatalogNodeView) => void;
  const pendingNode = new Promise<CurriculumCatalogNodeView>((resolve) => { release = resolve; });
  const state = createTriStateSelectionState(authority);
  const pending = runSelectionOperationWithRetry(
    state,
    (draft) => selectNode(draft, 'target'),
    source({ getNode: async () => pendingNode }, { isCurrentGeneration: () => current }),
  );
  current = false;
  release(view('target'));
  const result = await pending;
  assert.deepEqual(result, { kind: 'STALE', state });
});

test('track mismatches and fact conflicts invalidate the draft instead of merging facts', async () => {
  const base = createTriStateSelectionState(authority);
  const mismatch = await runSelectionOperationWithRetry(
    base,
    (state) => selectNode(state, 'target'),
    source({ getNode: async () => view('target', [], 0, 0, 'MATHEMATICS') }),
  );
  assert.equal(mismatch.kind, 'ADAPTER_FAILURE');
  if (mismatch.kind !== 'ADAPTER_FAILURE') assert.fail('expected mismatch');
  assert.equal(mismatch.code, 'AUTHORITY_MISMATCH');
  assert.equal(mismatch.state, base);
  assert.equal(invalidatesSelectionSession(mismatch), true);
  assert.doesNotMatch(selectionAdapterErrorText(mismatch), /AUTHORITY_|FACT_|ENTRY_|REQUEST_|RETRY_/);

  const existing = register(base, [{
    id: 'target', parentId: null, ancestorIds: [], childrenCount: 0, sourceOrder: 9,
  }]);
  const conflict = await loadSelectionRequirements(
    existing,
    [{ kind: 'NODE_FACT', nodeId: 'target' }],
    source({ getNode: async () => view('target', [], 0, 1) }),
  );
  assert.equal(conflict.kind, 'ADAPTER_FAILURE');
  if (conflict.kind !== 'ADAPTER_FAILURE') assert.fail('expected conflict');
  assert.equal(conflict.code, 'FACT_CONFLICT');
  assert.equal(conflict.state, existing);
  assert.equal(invalidatesSelectionSession(conflict), true);
});

test('selector-limit results preserve the prior state for raw and expanded group limits', async () => {
  const selectors = Array.from({ length: 51 }, (_, index) => ({
    rootKind: 'NODE' as const, rootId: `n-${index}`, selector: 'EXACT' as const,
  }));
  const raw = register(
    createTriStateSelectionState(authority, { version: 2, selectors }),
    selectors.map(({ rootId }, sourceOrder) => ({
      id: rootId, parentId: null, ancestorIds: [], childrenCount: 0, sourceOrder,
    })),
  );
  const rawResult = await runSelectionOperationWithRetry(raw, serializeTriStateSelection, source({}));
  assert.equal(rawResult.kind, 'SELECTOR_LIMIT_EXCEEDED');
  if (rawResult.kind !== 'SELECTOR_LIMIT_EXCEEDED') assert.fail('expected raw limit');
  assert.equal(rawResult.state, raw);

  const nodes = Array.from({ length: 51 }, (_, sourceOrder) => ({
    id: `g-${sourceOrder}`, parentId: null, ancestorIds: [], childrenCount: 0, sourceOrder,
  }));
  let grouped = register(createTriStateSelectionState(authority), nodes);
  const registered = registerTriStateSelectionFacts(grouped, {
    authority,
    groups: [{ id: 'group', childNodeIds: nodes.map(({ id }) => id), sourceOrder: 0 }],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') assert.fail('expected group facts');
  grouped = registered.state;
  const groupResult = await runSelectionOperationWithRetry(
    grouped,
    (state) => selectNavigationGroup(state, 'group'),
    source({}),
  );
  assert.equal(groupResult.kind, 'SELECTOR_LIMIT_EXCEEDED');
  if (groupResult.kind !== 'SELECTOR_LIMIT_EXCEEDED') assert.fail('expected group limit');
  assert.equal(groupResult.state, grouped);
});

test('client forwards offset and caps requested child-page size at 100', async () => {
  const paths: string[] = [];
  const client = createBoundCurriculumClient('/curriculum', async (path) => {
    paths.push(path);
    return { items: [], limit: 100, offset: 25, total: 25 } as CurriculumPage<CurriculumCatalogNodeView>;
  });
  await client.listChildren('entry 1', 'node/1', 25, 250);
  assert.deepEqual(paths, [
    '/curriculum/catalog/entry%201/nodes/node%2F1/children?limit=100&offset=25',
  ]);
});
