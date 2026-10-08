import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTriStateSelectionState,
  deselectNode,
  deselectNavigationGroup,
  queryNodeSelection,
  queryNavigationGroupSelection,
  registerTriStateSelectionFacts,
  selectNavigationGroup,
  selectNode,
  serializeTriStateSelection,
  toggleNavigationGroup,
  toggleNode,
} from './selection-engine.ts';
import type {
  CurriculumSelectionAuthority,
  CurriculumSelectionNodeFact,
  CurriculumSelectionV2,
} from './selection-engine.ts';

const authority: CurriculumSelectionAuthority = {
  trackId: 'EXPERIMENTAL',
  catalogRevision: 'catalog-2026-10-08',
};

const root: CurriculumSelectionNodeFact = {
  id: 'root',
  parentId: null,
  ancestorIds: [],
  childrenCount: 3,
  sourceOrder: 1,
};

const child = (id: string, sourceOrder: number): CurriculumSelectionNodeFact => ({
  id,
  parentId: root.id,
  ancestorIds: [root.id],
  childrenCount: 0,
  sourceOrder,
});

test('creates an empty authority-bound immutable selection state', () => {
  const state = createTriStateSelectionState(authority);

  assert.deepEqual(state.authority, authority);
  assert.deepEqual(state.selection, { version: 2, selectors: [] });
  assert.equal(state.factsVersion, 0);
  assert.deepEqual(state.facts.nodes, {});
  assert.deepEqual(state.facts.childPages, {});
  assert.deepEqual(state.facts.groups, {});
});

test('restoration removes only byte-identical selectors and preserves EXACT semantics', () => {
  const selection: CurriculumSelectionV2 = {
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: root.id, selector: 'EXACT' },
      { rootKind: 'NODE', rootId: root.id, selector: 'EXACT' },
      { rootKind: 'NODE', rootId: root.id, selector: 'SUBTREE' },
      { rootKind: 'NAVIGATION_GROUP', rootId: 'grade-10', selector: 'SUBTREE' },
    ],
  };

  const state = createTriStateSelectionState(authority, selection);

  assert.deepEqual(state.selection.selectors, [
    { rootKind: 'NODE', rootId: root.id, selector: 'EXACT' },
    { rootKind: 'NODE', rootId: root.id, selector: 'SUBTREE' },
    { rootKind: 'NAVIGATION_GROUP', rootId: 'grade-10', selector: 'SUBTREE' },
  ]);
  assert.notEqual(state.selection, selection);
  assert.notEqual(state.selection.selectors, selection.selectors);
});

test('registering node facts returns a new state and identical registration is idempotent', () => {
  const original = createTriStateSelectionState(authority);
  const first = registerTriStateSelectionFacts(original, { authority, nodes: [root] });
  assert.equal(first.kind, 'REGISTERED');
  if (first.kind !== 'REGISTERED') return;

  assert.notEqual(first.state, original);
  assert.equal(first.state.factsVersion, 1);
  assert.deepEqual(first.state.facts.nodes[root.id], root);
  assert.equal(original.factsVersion, 0);
  assert.deepEqual(original.facts.nodes, {});

  const repeated = registerTriStateSelectionFacts(first.state, { authority, nodes: [root] });
  assert.equal(repeated.kind, 'REGISTERED');
  if (repeated.kind !== 'REGISTERED') return;
  assert.equal(repeated.state, first.state);
  assert.equal(repeated.state.factsVersion, 1);
});

test('rejects track and catalog revision mismatches without mutation', () => {
  const state = createTriStateSelectionState(authority);
  for (const received of [
    { ...authority, trackId: 'MATHEMATICS' as const },
    { ...authority, catalogRevision: 'catalog-other' },
  ]) {
    const result = registerTriStateSelectionFacts(state, { authority: received, nodes: [root] });
    assert.deepEqual(result, { kind: 'AUTHORITY_MISMATCH', expected: authority, received });
    assert.equal(state.factsVersion, 0);
    assert.deepEqual(state.facts.nodes, {});
  }
});

test('out-of-order pages become complete only after every authoritative position is known', () => {
  const empty = createTriStateSelectionState(authority);
  const tail = registerTriStateSelectionFacts(empty, {
    authority,
    childPages: [{ parentId: root.id, offset: 2, total: 3, children: [child('c', 3)] }],
  });
  assert.equal(tail.kind, 'REGISTERED');
  if (tail.kind !== 'REGISTERED') return;
  assert.equal(tail.state.facts.childPages[root.id]?.complete, false);
  assert.deepEqual(tail.state.facts.childPages[root.id]?.childIds, [null, null, 'c']);

  const head = registerTriStateSelectionFacts(tail.state, {
    authority,
    childPages: [{ parentId: root.id, offset: 0, total: 3, children: [child('a', 1), child('b', 2)] }],
  });
  assert.equal(head.kind, 'REGISTERED');
  if (head.kind !== 'REGISTERED') return;
  assert.deepEqual(head.state.facts.childPages[root.id], {
    total: 3,
    childIds: ['a', 'b', 'c'],
    complete: true,
  });
});

test('partial pages and gaps are never treated as complete subtrees', () => {
  const state = createTriStateSelectionState(authority);
  const cases = [
    [{ parentId: root.id, offset: 0, total: 3, children: [child('a', 1)] }],
    [
      { parentId: root.id, offset: 0, total: 3, children: [child('a', 1)] },
      { parentId: root.id, offset: 2, total: 3, children: [child('c', 3)] },
    ],
  ] as const;

  for (const childPages of cases) {
    const result = registerTriStateSelectionFacts(state, { authority, childPages });
    assert.equal(result.kind, 'REGISTERED');
    if (result.kind !== 'REGISTERED') continue;
    assert.equal(result.state.facts.childPages[root.id]?.complete, false);
  }
});

test('rejects page totals, page identities, parent identities, ancestry, and metadata conflicts atomically', () => {
  const seeded = registerTriStateSelectionFacts(createTriStateSelectionState(authority), {
    authority,
    nodes: [root],
    childPages: [{ parentId: root.id, offset: 0, total: 3, children: [child('a', 1)] }],
  });
  assert.equal(seeded.kind, 'REGISTERED');
  if (seeded.kind !== 'REGISTERED') return;

  const conflictingBatches = [
    { childPages: [{ parentId: root.id, offset: 1, total: 4, children: [child('b', 2)] }] },
    { childPages: [{ parentId: root.id, offset: 0, total: 3, children: [child('other', 1)] }] },
    { nodes: [{ ...child('a', 1), parentId: 'other-parent' }] },
    { nodes: [{ ...child('a', 1), ancestorIds: ['other-parent'] }] },
    { nodes: [{ ...child('a', 1), childrenCount: 2 }] },
    { childPages: [{ parentId: root.id, offset: 1, total: 3, children: [{ ...child('b', 2), parentId: 'wrong' }] }] },
  ];

  for (const batch of conflictingBatches) {
    const result = registerTriStateSelectionFacts(seeded.state, { authority, ...batch });
    assert.equal(result.kind, 'FACT_CONFLICT');
    assert.equal(seeded.state.factsVersion, 1);
    assert.deepEqual(seeded.state.facts.childPages[root.id]?.childIds, ['a', null, null]);
    assert.equal(seeded.state.facts.nodes.other, undefined);
    assert.equal(seeded.state.facts.nodes.b, undefined);
  }
});

test('group facts retain ordered child roots and reject conflicting re-registration', () => {
  const state = createTriStateSelectionState(authority);
  const group = { id: 'grade-10', childNodeIds: ['b', 'a'], sourceOrder: 7 };
  const registered = registerTriStateSelectionFacts(state, { authority, groups: [group] });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  assert.deepEqual(registered.state.facts.groups[group.id], group);

  const conflict = registerTriStateSelectionFacts(registered.state, {
    authority,
    groups: [{ ...group, childNodeIds: ['a', 'b'] }],
  });
  assert.equal(conflict.kind, 'FACT_CONFLICT');
  assert.equal(registered.state.factsVersion, 1);
  assert.deepEqual(registered.state.facts.groups[group.id]?.childNodeIds, ['b', 'a']);
});

const branch = (selection?: CurriculumSelectionV2) => {
  const facts: CurriculumSelectionNodeFact[] = [
    { id: 'r', parentId: null, ancestorIds: [], childrenCount: 2, sourceOrder: 1 },
    { id: 'a', parentId: 'r', ancestorIds: ['r'], childrenCount: 2, sourceOrder: 1 },
    { id: 'a1', parentId: 'a', ancestorIds: ['r', 'a'], childrenCount: 1, sourceOrder: 1 },
    { id: 'a1x', parentId: 'a1', ancestorIds: ['r', 'a', 'a1'], childrenCount: 0, sourceOrder: 1 },
    { id: 'a2', parentId: 'a', ancestorIds: ['r', 'a'], childrenCount: 0, sourceOrder: 2 },
    { id: 'b', parentId: 'r', ancestorIds: ['r'], childrenCount: 0, sourceOrder: 2 },
  ];
  const registered = registerTriStateSelectionFacts(
    createTriStateSelectionState(authority, selection),
    { authority, nodes: facts },
  );
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') throw new Error('Expected registered tree facts');
  return registered.state;
};

const expectKnown = (state: ReturnType<typeof branch>, nodeId: string, value: string) => {
  assert.deepEqual(queryNodeSelection(state, nodeId), { kind: 'KNOWN', value });
};

test('empty leaves and parents are authoritatively unchecked', () => {
  const state = branch();
  expectKnown(state, 'r', 'UNCHECKED');
  expectKnown(state, 'a1x', 'UNCHECKED');
});

test('an exact leaf is checked while its ancestors are indeterminate and other branches stay unchecked', () => {
  const state = branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'a1x', selector: 'EXACT' }],
  });
  expectKnown(state, 'a1x', 'CHECKED');
  expectKnown(state, 'a1', 'INDETERMINATE');
  expectKnown(state, 'a', 'INDETERMINATE');
  expectKnown(state, 'r', 'INDETERMINATE');
  expectKnown(state, 'b', 'UNCHECKED');
});

test('a subtree selector checks its root and every known descendant without child pages', () => {
  const state = branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' }],
  });
  expectKnown(state, 'a', 'CHECKED');
  expectKnown(state, 'a1', 'CHECKED');
  expectKnown(state, 'a1x', 'CHECKED');
  expectKnown(state, 'b', 'UNCHECKED');
});

test('complete direct-child facts and complete child coverage prove the parent checked', () => {
  let state = branch({
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' },
      { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
    ],
  });
  const registered = registerTriStateSelectionFacts(state, {
    authority,
    childPages: [{
      parentId: 'r',
      offset: 0,
      total: 2,
      children: [state.facts.nodes.a, state.facts.nodes.b],
    }],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  state = registered.state;
  expectKnown(state, 'r', 'CHECKED');
});

test('incomplete direct-child pages never prove full parent coverage', () => {
  let state = branch({
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' },
      { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
    ],
  });
  const registered = registerTriStateSelectionFacts(state, {
    authority,
    childPages: [{ parentId: 'r', offset: 0, total: 2, children: [state.facts.nodes.a] }],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  state = registered.state;
  expectKnown(state, 'r', 'INDETERMINATE');
});

test('a restored non-terminal exact selector is partial rather than recursive coverage', () => {
  const state = branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'a', selector: 'EXACT' }],
  });
  expectKnown(state, 'a', 'INDETERMINATE');
  expectKnown(state, 'a1', 'UNCHECKED');
  expectKnown(state, 'r', 'INDETERMINATE');
});

test('an unplaced restored selector requests ancestry rather than reporting unchecked', () => {
  const state = branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'not-loaded', selector: 'EXACT' }],
  });
  const before = state;
  const result = queryNodeSelection(state, 'b');
  assert.equal(result.kind, 'STRUCTURE_REQUIRED');
  if (result.kind !== 'STRUCTURE_REQUIRED') return;
  assert.deepEqual(result.requirements, [{ kind: 'SELECTOR_ANCESTRY', nodeId: 'not-loaded' }]);
  assert.equal(result.factsVersion, state.factsVersion);
  assert.equal(state, before);
  assert.deepEqual(queryNodeSelection(state, 'b'), result);
});

test('querying an unknown target requests its node fact without mutating state', () => {
  const state = branch();
  assert.deepEqual(queryNodeSelection(state, 'missing-target'), {
    kind: 'STRUCTURE_REQUIRED',
    requirements: [{ kind: 'NODE_FACT', nodeId: 'missing-target' }],
    factsVersion: state.factsVersion,
    retryToken: `query:missing-target:${state.factsVersion}:NODE_FACT:missing-target`,
  });
  assert.equal(state.facts.nodes['missing-target'], undefined);
});

const withCompletePages = (state: ReturnType<typeof branch>) => {
  const registered = registerTriStateSelectionFacts(state, {
    authority,
    childPages: [
      {
        parentId: 'r',
        offset: 0,
        total: 2,
        children: [state.facts.nodes.a, state.facts.nodes.b],
      },
      {
        parentId: 'a',
        offset: 0,
        total: 2,
        children: [state.facts.nodes.a1, state.facts.nodes.a2],
      },
      {
        parentId: 'a1',
        offset: 0,
        total: 1,
        children: [state.facts.nodes.a1x],
      },
    ],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') throw new Error('Expected complete pages');
  return registered.state;
};

const expectUpdated = <T extends { kind: string }>(result: T) => {
  assert.equal(result.kind, 'UPDATED');
  if (!('state' in result)) throw new Error('Expected an updated state');
  return result.state as ReturnType<typeof branch>;
};

test('selecting a leaf creates EXACT while selecting a parent creates SUBTREE without pages', () => {
  const state = branch();
  const leaf = expectUpdated(selectNode(state, 'a1x'));
  assert.deepEqual(leaf.selection.selectors, [
    { rootKind: 'NODE', rootId: 'a1x', selector: 'EXACT' },
  ]);

  const parent = expectUpdated(selectNode(state, 'a'));
  assert.deepEqual(parent.selection.selectors, [
    { rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' },
  ]);
  assert.deepEqual(parent.facts.childPages, {});
  assert.equal(state.selection.selectors.length, 0);
});

test('selecting an indeterminate parent replaces its covered descendants with one subtree', () => {
  const state = branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'a1x', selector: 'EXACT' }],
  });
  const updated = expectUpdated(selectNode(state, 'a'));
  assert.deepEqual(updated.selection.selectors, [
    { rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' },
  ]);
});

test('deselecting exact leaves and complete subtrees removes only covered selectors', () => {
  const state = branch({
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' },
      { rootKind: 'NODE', rootId: 'a1x', selector: 'EXACT' },
      { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
    ],
  });
  const withoutLeaf = expectUpdated(deselectNode(state, 'b'));
  assert.deepEqual(withoutLeaf.selection.selectors.map(({ rootId }) => rootId), ['a']);

  const withoutSubtree = expectUpdated(deselectNode(state, 'a'));
  assert.deepEqual(withoutSubtree.selection.selectors, [
    { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
  ]);
});

test('deep partial deselection decomposes only sibling branches and preserves all other coverage', () => {
  const state = withCompletePages(branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'r', selector: 'SUBTREE' }],
  }));
  const updated = expectUpdated(deselectNode(state, 'a1x'));
  assert.deepEqual(updated.selection.selectors, [
    { rootKind: 'NODE', rootId: 'a2', selector: 'EXACT' },
    { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
  ]);
  expectKnown(updated, 'a1x', 'UNCHECKED');
  expectKnown(updated, 'a2', 'CHECKED');
  expectKnown(updated, 'b', 'CHECKED');

  const twice = expectUpdated(deselectNode(updated, 'a2'));
  assert.deepEqual(twice.selection.selectors, [
    { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
  ]);
});

test('incomplete decomposition reports every missing page atomically with stable retry identity', () => {
  const original = branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'r', selector: 'SUBTREE' }],
  });
  const first = deselectNode(original, 'a1x');
  assert.equal(first.kind, 'STRUCTURE_REQUIRED');
  if (first.kind !== 'STRUCTURE_REQUIRED') return;
  assert.deepEqual(first.requirements, [
    { kind: 'CHILD_PAGE', parentId: 'a', ranges: [{ offset: 0, limit: 2 }] },
    { kind: 'CHILD_PAGE', parentId: 'a1', ranges: [{ offset: 0, limit: 1 }] },
    { kind: 'CHILD_PAGE', parentId: 'r', ranges: [{ offset: 0, limit: 2 }] },
  ]);
  assert.equal(first.factsVersion, original.factsVersion);
  assert.deepEqual(deselectNode(original, 'a1x'), first);
  assert.deepEqual(original.selection.selectors, [
    { rootKind: 'NODE', rootId: 'r', selector: 'SUBTREE' },
  ]);

  const completed = withCompletePages(original);
  assert.ok(completed.factsVersion > original.factsVersion);
  assert.equal(deselectNode(completed, 'a1x').kind, 'UPDATED');
});

test('selecting the removed leaf compacts back to the parent only with complete authoritative pages', () => {
  const original = withCompletePages(branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'r', selector: 'SUBTREE' }],
  }));
  const decomposed = expectUpdated(deselectNode(original, 'a1x'));
  const compacted = expectUpdated(selectNode(decomposed, 'a1x'));
  assert.deepEqual(compacted.selection.selectors, [
    { rootKind: 'NODE', rootId: 'r', selector: 'SUBTREE' },
  ]);

  const incomplete = branch({
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: 'a2', selector: 'EXACT' },
      { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
    ],
  });
  const notCompacted = expectUpdated(selectNode(incomplete, 'a1x'));
  assert.deepEqual(notCompacted.selection.selectors.map(({ rootId }) => rootId), ['a1x', 'a2', 'b']);
});

test('node commands preserve independent branches and normalize input permutations deterministically', () => {
  const left = branch({
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
      { rootKind: 'NODE', rootId: 'a2', selector: 'EXACT' },
    ],
  });
  const right = branch({
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: 'a2', selector: 'EXACT' },
      { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
    ],
  });
  const selectedLeft = expectUpdated(selectNode(left, 'a1x'));
  const selectedRight = expectUpdated(selectNode(right, 'a1x'));
  assert.deepEqual(selectedLeft, selectedRight);
  assert.deepEqual(expectUpdated(toggleNode(selectedLeft, 'a1x')).selection.selectors, [
    { rootKind: 'NODE', rootId: 'a2', selector: 'EXACT' },
    { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
  ]);
});

const withGroup = (state: ReturnType<typeof branch>, childNodeIds = ['a', 'b']) => {
  const registered = registerTriStateSelectionFacts(state, {
    authority,
    groups: [{ id: 'grade', childNodeIds, sourceOrder: 1 }],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') throw new Error('Expected group registration');
  return registered.state;
};

test('selecting a navigation group preserves one raw group selector and checks its child coverage', () => {
  const state = withGroup(branch());
  const updated = expectUpdated(selectNavigationGroup(state, 'grade'));
  assert.deepEqual(updated.selection.selectors, [
    { rootKind: 'NAVIGATION_GROUP', rootId: 'grade', selector: 'SUBTREE' },
  ]);
  assert.equal(updated.facts.nodes.grade, undefined);
  expectKnown(updated, 'a', 'CHECKED');
  expectKnown(updated, 'a1x', 'CHECKED');
  expectKnown(updated, 'b', 'CHECKED');
  assert.deepEqual(queryNavigationGroupSelection(updated, 'grade'), { kind: 'KNOWN', value: 'CHECKED' });
});

test('group query derives checked, indeterminate, and unchecked from authoritative ordered child roots', () => {
  const unchecked = withGroup(branch());
  assert.deepEqual(queryNavigationGroupSelection(unchecked, 'grade'), {
    kind: 'KNOWN', value: 'UNCHECKED',
  });

  const partial = withGroup(branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'b', selector: 'EXACT' }],
  }));
  assert.deepEqual(queryNavigationGroupSelection(partial, 'grade'), {
    kind: 'KNOWN', value: 'INDETERMINATE',
  });

  const checked = withGroup(branch({
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' },
      { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
    ],
  }));
  assert.deepEqual(queryNavigationGroupSelection(checked, 'grade'), {
    kind: 'KNOWN', value: 'CHECKED',
  });
});

test('deselecting below a selected group replaces the shorthand with compact remaining node roots', () => {
  const selected = expectUpdated(selectNavigationGroup(withCompletePages(withGroup(branch())), 'grade'));
  const updated = expectUpdated(deselectNode(selected, 'a1x'));
  assert.deepEqual(updated.selection.selectors, [
    { rootKind: 'NODE', rootId: 'a2', selector: 'EXACT' },
    { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
  ]);
  assert.deepEqual(queryNavigationGroupSelection(updated, 'grade'), {
    kind: 'KNOWN', value: 'INDETERMINATE',
  });
});

test('group mutations require every authoritative child-root node fact before changing state', () => {
  const a = branch().facts.nodes.a;
  const registered = registerTriStateSelectionFacts(createTriStateSelectionState(authority), {
    authority,
    nodes: [a],
    groups: [{ id: 'grade', childNodeIds: ['a', 'missing-root'], sourceOrder: 1 }],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  const result = selectNavigationGroup(registered.state, 'grade');
  assert.equal(result.kind, 'STRUCTURE_REQUIRED');
  if (result.kind !== 'STRUCTURE_REQUIRED') return;
  assert.deepEqual(result.requirements, [{ kind: 'NODE_FACT', nodeId: 'missing-root' }]);
  assert.deepEqual(registered.state.selection.selectors, []);
});

test('group and explicit child overlap is order invariant and deselect/toggle stays atomic', () => {
  const explicit = withGroup(branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' }],
  }));
  const selected = expectUpdated(selectNavigationGroup(explicit, 'grade'));
  assert.deepEqual(selected.selection.selectors, [
    { rootKind: 'NAVIGATION_GROUP', rootId: 'grade', selector: 'SUBTREE' },
  ]);
  const deselected = expectUpdated(deselectNavigationGroup(selected, 'grade'));
  assert.deepEqual(deselected.selection.selectors, []);
  const toggled = expectUpdated(toggleNavigationGroup(deselected, 'grade'));
  assert.deepEqual(toggled.selection.selectors, selected.selection.selectors);
});

test('group facts cannot be reused across a different track or catalog revision', () => {
  const state = withGroup(branch());
  const mismatch = registerTriStateSelectionFacts(state, {
    authority: { trackId: 'MATHEMATICS', catalogRevision: authority.catalogRevision },
    groups: [{ id: 'other', childNodeIds: ['a'], sourceOrder: 2 }],
  });
  assert.equal(mismatch.kind, 'AUTHORITY_MISMATCH');
  assert.equal(state.facts.groups.other, undefined);
  assert.equal(state.facts.groups.grade?.childNodeIds[0], 'a');
});

const flatFacts = (count: number): CurriculumSelectionNodeFact[] => Array.from(
  { length: count },
  (_, index) => ({
    id: `root-${String(index).padStart(3, '0')}`,
    parentId: null,
    ancestorIds: [],
    childrenCount: 0,
    sourceOrder: index,
  }),
);

const stateWithFlatSelectors = (count: number) => {
  const nodes = flatFacts(count);
  const selection: CurriculumSelectionV2 = {
    version: 2,
    selectors: nodes.map(({ id }) => ({ rootKind: 'NODE', rootId: id, selector: 'EXACT' })),
  };
  const registered = registerTriStateSelectionFacts(
    createTriStateSelectionState(authority, selection),
    { authority, nodes },
  );
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') throw new Error('Expected flat facts');
  return registered.state;
};

test('serialization emits an empty v2 expression and compactly removes duplicate overlap', () => {
  assert.deepEqual(serializeTriStateSelection(createTriStateSelectionState(authority)), {
    kind: 'SERIALIZED',
    value: { version: 2, selectors: [] },
  });

  const overlapping = branch({
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: 'a1x', selector: 'EXACT' },
      { rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' },
      { rootKind: 'NODE', rootId: 'a1x', selector: 'EXACT' },
    ],
  });
  assert.deepEqual(serializeTriStateSelection(overlapping), {
    kind: 'SERIALIZED',
    value: {
      version: 2,
      selectors: [{ rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' }],
    },
  });
});

test('serialization order follows source order then canonical ID independent of restore and fact order', () => {
  const nodes: CurriculumSelectionNodeFact[] = [
    { id: 'z', parentId: null, ancestorIds: [], childrenCount: 0, sourceOrder: 1 },
    { id: 'a', parentId: null, ancestorIds: [], childrenCount: 0, sourceOrder: 1 },
    { id: 'm', parentId: null, ancestorIds: [], childrenCount: 0, sourceOrder: 2 },
  ];
  const selectors: CurriculumSelectionV2 = {
    version: 2,
    selectors: nodes.map(({ id }) => ({ rootKind: 'NODE', rootId: id, selector: 'EXACT' })).reverse(),
  };
  const build = (facts: readonly CurriculumSelectionNodeFact[]) => {
    const result = registerTriStateSelectionFacts(
      createTriStateSelectionState(authority, selectors),
      { authority, nodes: facts },
    );
    assert.equal(result.kind, 'REGISTERED');
    if (result.kind !== 'REGISTERED') throw new Error('Expected deterministic facts');
    return serializeTriStateSelection(result.state);
  };
  const expected = {
    kind: 'SERIALIZED',
    value: {
      version: 2,
      selectors: [
        { rootKind: 'NODE', rootId: 'a', selector: 'EXACT' },
        { rootKind: 'NODE', rootId: 'z', selector: 'EXACT' },
        { rootKind: 'NODE', rootId: 'm', selector: 'EXACT' },
      ],
    },
  };
  assert.deepEqual(build(nodes), expected);
  assert.deepEqual(build([...nodes].reverse()), expected);
});

test('restored non-terminal EXACT round-trips while new non-terminal selection remains SUBTREE', () => {
  const restored = branch({
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'a', selector: 'EXACT' }],
  });
  assert.deepEqual(serializeTriStateSelection(restored), {
    kind: 'SERIALIZED',
    value: {
      version: 2,
      selectors: [{ rootKind: 'NODE', rootId: 'a', selector: 'EXACT' }],
    },
  });
  const selected = expectUpdated(selectNode(branch(), 'a'));
  assert.deepEqual(selected.selection.selectors, [
    { rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' },
  ]);
});

test('50 raw and normalized roots serialize, while 51 fail without truncation', () => {
  const fifty = stateWithFlatSelectors(50);
  const serialized = serializeTriStateSelection(fifty);
  assert.equal(serialized.kind, 'SERIALIZED');
  if (serialized.kind === 'SERIALIZED') assert.equal(serialized.value.selectors.length, 50);

  const fiftyOne = stateWithFlatSelectors(51);
  const rejected = serializeTriStateSelection(fiftyOne);
  assert.deepEqual(rejected, {
    kind: 'SELECTOR_LIMIT_EXCEEDED',
    limit: 50,
    rawCount: 51,
    normalizedCount: 51,
  });
  assert.equal(fiftyOne.selection.selectors.length, 51);
});

test('one raw group expanding to 51 normalized roots is rejected with both useful counts', () => {
  const nodes = flatFacts(51);
  let registered = registerTriStateSelectionFacts(createTriStateSelectionState(authority, {
    version: 2,
    selectors: [{ rootKind: 'NAVIGATION_GROUP', rootId: 'large-group', selector: 'SUBTREE' }],
  }), { authority, nodes });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  registered = registerTriStateSelectionFacts(registered.state, {
    authority,
    groups: [{ id: 'large-group', childNodeIds: nodes.map(({ id }) => id), sourceOrder: 1 }],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  assert.deepEqual(serializeTriStateSelection(registered.state), {
    kind: 'SELECTOR_LIMIT_EXCEEDED',
    limit: 50,
    rawCount: 1,
    normalizedCount: 51,
  });
  assert.deepEqual(registered.state.selection.selectors, [
    { rootKind: 'NAVIGATION_GROUP', rootId: 'large-group', selector: 'SUBTREE' },
  ]);
});

test('a 51-root partial-deselection expansion fails atomically without dropping coverage', () => {
  const siblings = flatFacts(51).map((fact, index) => ({
    ...fact,
    parentId: 'large-root',
    ancestorIds: ['large-root'],
    sourceOrder: index + 1,
  }));
  const removed: CurriculumSelectionNodeFact = {
    id: 'removed', parentId: 'large-root', ancestorIds: ['large-root'], childrenCount: 0, sourceOrder: 0,
  };
  const largeRoot: CurriculumSelectionNodeFact = {
    id: 'large-root', parentId: null, ancestorIds: [], childrenCount: 52, sourceOrder: 0,
  };
  const registered = registerTriStateSelectionFacts(createTriStateSelectionState(authority, {
    version: 2,
    selectors: [{ rootKind: 'NODE', rootId: 'large-root', selector: 'SUBTREE' }],
  }), {
    authority,
    nodes: [largeRoot],
    childPages: [{ parentId: largeRoot.id, offset: 0, total: 52, children: [removed, ...siblings] }],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  const result = deselectNode(registered.state, removed.id);
  assert.deepEqual(result, {
    kind: 'SELECTOR_LIMIT_EXCEEDED',
    limit: 50,
    rawCount: 51,
    normalizedCount: 51,
  });
  assert.deepEqual(registered.state.selection.selectors, [
    { rootKind: 'NODE', rootId: 'large-root', selector: 'SUBTREE' },
  ]);
});

test('complete empty pages and empty groups never invent selected coverage', () => {
  const parent: CurriculumSelectionNodeFact = {
    id: 'empty-parent', parentId: null, ancestorIds: [], childrenCount: 1, sourceOrder: 0,
  };
  const leaf: CurriculumSelectionNodeFact = {
    id: 'empty-leaf', parentId: parent.id, ancestorIds: [parent.id], childrenCount: 0, sourceOrder: 0,
  };
  const registered = registerTriStateSelectionFacts(createTriStateSelectionState(authority), {
    authority,
    nodes: [parent],
    childPages: [
      { parentId: parent.id, offset: 0, total: 1, children: [leaf] },
      { parentId: leaf.id, offset: 0, total: 0, children: [] },
    ],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  expectKnown(registered.state, leaf.id, 'UNCHECKED');
  expectKnown(registered.state, parent.id, 'UNCHECKED');
  assert.deepEqual(serializeTriStateSelection(registered.state), {
    kind: 'SERIALIZED', value: { version: 2, selectors: [] },
  });

  const emptyGroup = registerTriStateSelectionFacts(registered.state, {
    authority,
    groups: [{ id: 'empty-group', childNodeIds: [], sourceOrder: 0 }],
  });
  assert.equal(emptyGroup.kind, 'FACT_CONFLICT');
});

test('page-only registration is retained as progress and remains idempotent', () => {
  const leaf: CurriculumSelectionNodeFact = {
    id: 'page-only-leaf', parentId: null, ancestorIds: [], childrenCount: 0, sourceOrder: 0,
  };
  const nodeResult = registerTriStateSelectionFacts(createTriStateSelectionState(authority), {
    authority, nodes: [leaf],
  });
  assert.equal(nodeResult.kind, 'REGISTERED');
  if (nodeResult.kind !== 'REGISTERED') return;
  const page = { parentId: leaf.id, offset: 0, total: 0, children: [] } as const;
  const pageResult = registerTriStateSelectionFacts(nodeResult.state, { authority, childPages: [page] });
  assert.equal(pageResult.kind, 'REGISTERED');
  if (pageResult.kind !== 'REGISTERED') return;
  assert.notEqual(pageResult.state, nodeResult.state);
  assert.equal(pageResult.state.factsVersion, nodeResult.state.factsVersion + 1);
  assert.deepEqual(pageResult.state.facts.childPages[leaf.id], {
    total: 0, childIds: [], complete: true,
  });
  const repeated = registerTriStateSelectionFacts(pageResult.state, { authority, childPages: [page] });
  assert.equal(repeated.kind, 'REGISTERED');
  if (repeated.kind === 'REGISTERED') assert.equal(repeated.state, pageResult.state);
});

test('merged fact validation rejects count mismatches, duplicate positions, and cycles atomically', () => {
  const parent: CurriculumSelectionNodeFact = {
    id: 'validated-parent', parentId: null, ancestorIds: [], childrenCount: 2, sourceOrder: 0,
  };
  const onlyChild: CurriculumSelectionNodeFact = {
    id: 'only-child', parentId: parent.id, ancestorIds: [parent.id], childrenCount: 0, sourceOrder: 0,
  };
  const empty = createTriStateSelectionState(authority);
  const mismatch = registerTriStateSelectionFacts(empty, {
    authority,
    nodes: [parent],
    childPages: [{ parentId: parent.id, offset: 0, total: 1, children: [onlyChild] }],
  });
  assert.equal(mismatch.kind, 'FACT_CONFLICT');
  assert.equal(empty.factsVersion, 0);

  const pageFirst = registerTriStateSelectionFacts(empty, {
    authority,
    childPages: [{ parentId: parent.id, offset: 0, total: 1, children: [onlyChild] }],
  });
  assert.equal(pageFirst.kind, 'REGISTERED');
  if (pageFirst.kind !== 'REGISTERED') return;
  const lateMismatch = registerTriStateSelectionFacts(pageFirst.state, { authority, nodes: [parent] });
  assert.equal(lateMismatch.kind, 'FACT_CONFLICT');
  assert.equal(pageFirst.state.facts.nodes[parent.id], undefined);

  const duplicate = registerTriStateSelectionFacts(empty, {
    authority,
    nodes: [{ ...parent, childrenCount: 2 }],
    childPages: [{ parentId: parent.id, offset: 0, total: 2, children: [onlyChild, onlyChild] }],
  });
  assert.equal(duplicate.kind, 'FACT_CONFLICT');

  const cycle = registerTriStateSelectionFacts(empty, {
    authority,
    nodes: [
      { id: 'cycle-a', parentId: 'cycle-b', ancestorIds: ['cycle-b'], childrenCount: 1, sourceOrder: 0 },
      { id: 'cycle-b', parentId: 'cycle-a', ancestorIds: ['cycle-a'], childrenCount: 1, sourceOrder: 0 },
    ],
  });
  assert.equal(cycle.kind, 'FACT_CONFLICT');
  assert.equal(empty.facts.nodes['cycle-a'], undefined);
});

test('deselecting an ancestor of selected group roots removes only group coverage inside that ancestor', () => {
  const selected = expectUpdated(selectNavigationGroup(withGroup(branch()), 'grade'));
  const updated = expectUpdated(deselectNode(selected, 'r'));
  assert.deepEqual(updated.selection.selectors, []);
  expectKnown(updated, 'a1x', 'UNCHECKED');
  expectKnown(updated, 'b', 'UNCHECKED');
});

test('partial deselection removes every overlapping restored ancestor selector', () => {
  const state = withCompletePages(branch({
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: 'r', selector: 'SUBTREE' },
      { rootKind: 'NODE', rootId: 'a', selector: 'SUBTREE' },
    ],
  }));
  const updated = expectUpdated(deselectNode(state, 'a1x'));
  expectKnown(updated, 'a1x', 'UNCHECKED');
  assert.deepEqual(updated.selection.selectors, [
    { rootKind: 'NODE', rootId: 'a2', selector: 'EXACT' },
    { rootKind: 'NODE', rootId: 'b', selector: 'EXACT' },
  ]);
});

test('group deselection evaluates limits once against the final atomic result', () => {
  const parent: CurriculumSelectionNodeFact = {
    id: 'capacity-parent', parentId: null, ancestorIds: [], childrenCount: 52, sourceOrder: 0,
  };
  const children: CurriculumSelectionNodeFact[] = Array.from({ length: 52 }, (_, index) => ({
    id: `capacity-${String(index).padStart(2, '0')}`,
    parentId: parent.id,
    ancestorIds: [parent.id],
    childrenCount: 0,
    sourceOrder: index,
  }));
  const registered = registerTriStateSelectionFacts(createTriStateSelectionState(authority, {
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: parent.id, selector: 'SUBTREE' },
      { rootKind: 'NAVIGATION_GROUP', rootId: 'remove-two', selector: 'SUBTREE' },
    ],
  }), {
    authority,
    nodes: [parent],
    childPages: [{ parentId: parent.id, offset: 0, total: 52, children }],
    groups: [{ id: 'remove-two', childNodeIds: children.slice(0, 2).map(({ id }) => id), sourceOrder: 0 }],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  const updated = expectUpdated(deselectNavigationGroup(registered.state, 'remove-two'));
  assert.equal(updated.selection.selectors.length, 50);
  assert.deepEqual(updated.selection.selectors.map(({ rootId }) => rootId), children.slice(2).map(({ id }) => id));
});

test('group deselection aggregates every missing branch page under one stable group retry', () => {
  const rootNode: CurriculumSelectionNodeFact = {
    id: 'group-root', parentId: null, ancestorIds: [], childrenCount: 2, sourceOrder: 0,
  };
  const left: CurriculumSelectionNodeFact = {
    id: 'group-left', parentId: rootNode.id, ancestorIds: [rootNode.id], childrenCount: 1, sourceOrder: 0,
  };
  const right: CurriculumSelectionNodeFact = {
    id: 'group-right', parentId: rootNode.id, ancestorIds: [rootNode.id], childrenCount: 1, sourceOrder: 1,
  };
  const leftLeaf: CurriculumSelectionNodeFact = {
    id: 'group-left-leaf', parentId: left.id, ancestorIds: [rootNode.id, left.id], childrenCount: 0, sourceOrder: 0,
  };
  const rightLeaf: CurriculumSelectionNodeFact = {
    id: 'group-right-leaf', parentId: right.id, ancestorIds: [rootNode.id, right.id], childrenCount: 0, sourceOrder: 0,
  };
  const registered = registerTriStateSelectionFacts(createTriStateSelectionState(authority, {
    version: 2,
    selectors: [
      { rootKind: 'NODE', rootId: rootNode.id, selector: 'SUBTREE' },
      { rootKind: 'NAVIGATION_GROUP', rootId: 'two-leaves', selector: 'SUBTREE' },
    ],
  }), {
    authority,
    nodes: [rootNode, leftLeaf, rightLeaf],
    childPages: [{ parentId: rootNode.id, offset: 0, total: 2, children: [left, right] }],
    groups: [{ id: 'two-leaves', childNodeIds: [leftLeaf.id, rightLeaf.id], sourceOrder: 0 }],
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  const result = deselectNavigationGroup(registered.state, 'two-leaves');
  assert.equal(result.kind, 'STRUCTURE_REQUIRED');
  if (result.kind !== 'STRUCTURE_REQUIRED') return;
  assert.deepEqual(result.requirements, [
    { kind: 'CHILD_PAGE', parentId: left.id, ranges: [{ offset: 0, limit: 1 }] },
    { kind: 'CHILD_PAGE', parentId: right.id, ranges: [{ offset: 0, limit: 1 }] },
  ]);
  assert.match(result.retryToken, /^deselect-group:two-leaves:/);
  assert.deepEqual(deselectNavigationGroup(registered.state, 'two-leaves'), result);
  assert.equal(registered.state.selection.selectors.length, 2);
});

test('selecting a fully registered 511-node subtree remains bounded', () => {
  const nodeCount = 511;
  const nodes: CurriculumSelectionNodeFact[] = Array.from({ length: nodeCount }, (_, index) => {
    const parentIndex = index === 0 ? null : Math.floor((index - 1) / 2);
    const ancestorIds: string[] = [];
    let cursor = parentIndex;
    while (cursor !== null) {
      ancestorIds.unshift(`perf-${cursor}`);
      cursor = cursor === 0 ? null : Math.floor((cursor - 1) / 2);
    }
    const firstChild = index * 2 + 1;
    return {
      id: `perf-${index}`,
      parentId: parentIndex === null ? null : `perf-${parentIndex}`,
      ancestorIds,
      childrenCount: firstChild >= nodeCount ? 0 : Math.min(2, nodeCount - firstChild),
      sourceOrder: index === 0 ? 0 : (index - 1) % 2,
    };
  });
  const pages = nodes
    .filter(({ childrenCount }) => childrenCount > 0)
    .map((node) => ({
      parentId: node.id,
      offset: 0,
      total: node.childrenCount,
      children: nodes.filter(({ parentId }) => parentId === node.id),
    }));
  const registered = registerTriStateSelectionFacts(createTriStateSelectionState(authority), {
    authority, nodes, childPages: pages,
  });
  assert.equal(registered.kind, 'REGISTERED');
  if (registered.kind !== 'REGISTERED') return;
  const started = performance.now();
  const result = selectNode(registered.state, 'perf-0');
  const elapsedMs = performance.now() - started;
  assert.equal(result.kind, 'UPDATED');
  assert.ok(elapsedMs < 500, `root SUBTREE selection took ${elapsedMs.toFixed(2)} ms`);
});
