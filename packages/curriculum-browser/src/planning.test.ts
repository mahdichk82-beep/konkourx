import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mergePlanningSelections,
  loadPlanningTaskDrafts,
  planningDraftToTargetInputs,
  replaceChangedPlanningTargets,
  restorePlanningDraft,
  snapshotPlanningDraft,
  selectionsToNodeTargets,
  type PlanningCurriculumTargetSnapshot,
} from './planning.ts';
import type {
  CurriculumBrowserClient,
  CurriculumCatalogEntry,
  CurriculumCatalogNodeView,
  CurriculumSelection,
} from './types.ts';

const breadcrumb = [
  { kind: 'TRACK' as const, id: 'EXPERIMENTAL', label: 'تجربی' },
  { kind: 'ENTRY' as const, id: 'biology', label: 'زیست' },
  { kind: 'NODE' as const, id: 'node-1', label: 'سلول' },
];

const selection = (nodeId: string, mode: 'EXACT' | 'WHOLE'): CurriculumSelection => ({
  breadcrumb,
  entryId: 'biology',
  label: `label-${nodeId}`,
  mode,
  nodeId,
  trackId: 'EXPERIMENTAL',
});

const snapshot = (
  referenceKind: 'NODE' | 'PLACEMENT',
  curriculumRefId: string,
  selectionMode: 'EXACT' | 'WHOLE' | 'SUBTREE',
  position: number,
): PlanningCurriculumTargetSnapshot => ({
  curriculumRefId,
  labelSnapshot: `historical-${curriculumRefId}`,
  pathSnapshot: ['زیست', `historical-${curriculumRefId}`],
  position,
  referenceKind,
  representationIdSnapshot: referenceKind === 'NODE' ? 'rep-biology' : null,
  selectionMode,
});

test('canonical selections serialize only as ordered NODE target inputs', () => {
  const actual = selectionsToNodeTargets([
    { ...selection('node-1', 'EXACT'), catalogEntryId: 'never' },
    { ...selection('node-2', 'WHOLE'), representationId: 'never' },
  ] as CurriculumSelection[]);

  assert.deepEqual(actual, [
    { referenceKind: 'NODE', curriculumRefId: 'node-1', selectionMode: 'EXACT' },
    { referenceKind: 'NODE', curriculumRefId: 'node-2', selectionMode: 'WHOLE' },
  ]);
  assert.equal(JSON.stringify(actual).includes('entryId'), false);
  assert.equal(JSON.stringify(actual).includes('track'), false);
  assert.equal(JSON.stringify(actual).includes('representation'), false);
  assert.equal(JSON.stringify(actual).includes('GROUP'), false);
});

test('restore uses explicit representation membership and historical snapshots', async () => {
  const entries: CurriculumCatalogEntry[] = [{
    ambiguityCodes: [],
    id: 'biology',
    key: 'biology',
    kind: 'BOOK_BASED',
    nodeCount: 1,
    provenance: [],
    representationIds: ['rep-biology'],
    resolutionStatus: 'RESOLVED',
    rootItems: [],
    title: 'زیست',
    visibleInTracks: ['EXPERIMENTAL'],
  }];
  const node: CurriculumCatalogNodeView = {
    ambiguityCodes: [],
    breadcrumb,
    childrenCount: 0,
    depth: 2,
    entryId: 'biology',
    id: 'node-1',
    parentId: null,
    rawLabel: 'current-label',
    representationId: 'rep-biology',
    sourceLocator: 'source',
    sourceMarker: null,
    sourceOrder: 0,
    trackId: 'EXPERIMENTAL',
  };
  const requested: string[] = [];
  const client = {
    getNode: async (entryId: string, nodeId: string) => {
      requested.push(`${entryId}:${nodeId}`);
      return node;
    },
    listCatalog: async () => entries,
  } as CurriculumBrowserClient;

  const draft = await restorePlanningDraft([
    snapshot('PLACEMENT', 'placement-1', 'EXACT', 0),
    snapshot('NODE', 'node-1', 'WHOLE', 1),
  ], client);

  assert.deepEqual(requested, ['biology:node-1']);
  assert.equal(draft[0]?.kind, 'PLACEMENT');
  assert.equal(draft[1]?.kind, 'NODE');
  if (draft[1]?.kind !== 'NODE') assert.fail('expected restored NODE');
  assert.equal(draft[1].selection.mode, 'WHOLE');
  assert.equal(draft[1].selection.label, 'historical-node-1');
  assert.deepEqual(draft[1].displayPath, ['زیست', 'historical-node-1']);
});

test('removing one restored node preserves order and immutable PLACEMENT targets', async () => {
  const original = [
    { kind: 'NODE' as const, selection: selection('node-1', 'EXACT'), displayPath: ['one'] },
    { kind: 'PLACEMENT' as const, target: snapshot('PLACEMENT', 'placement-1', 'EXACT', 1) },
    { kind: 'NODE' as const, selection: selection('node-2', 'WHOLE'), displayPath: ['two'] },
  ];

  const merged = mergePlanningSelections(original, [selection('node-2', 'WHOLE')]);
  assert.deepEqual(planningDraftToTargetInputs(merged), [
    { referenceKind: 'PLACEMENT', curriculumRefId: 'placement-1', selectionMode: 'EXACT' },
    { referenceKind: 'NODE', curriculumRefId: 'node-2', selectionMode: 'WHOLE' },
  ]);
});

test('unresolved historical NODE stays readable and is never remapped', async () => {
  const target = snapshot('NODE', 'retired-node', 'EXACT', 0);
  const client = {
    listCatalog: async () => [],
  } as unknown as CurriculumBrowserClient;
  const draft = await restorePlanningDraft([target], client);

  assert.deepEqual(draft, [{ kind: 'UNRESOLVED_NODE', target }]);
  assert.deepEqual(planningDraftToTargetInputs(draft), [
    { referenceKind: 'NODE', curriculumRefId: 'retired-node', selectionMode: 'EXACT' },
  ]);
});

test('saved targets render from snapshots in stored order before any catalog request', () => {
  const targets = [
    snapshot('NODE', 'node-2', 'WHOLE', 2),
    snapshot('PLACEMENT', 'placement-1', 'EXACT', 0),
    snapshot('NODE', 'node-1', 'EXACT', 1),
  ];

  assert.deepEqual(snapshotPlanningDraft(targets), [
    { kind: 'PLACEMENT', target: targets[1] },
    { kind: 'UNRESOLVED_NODE', target: targets[2] },
    { kind: 'UNRESOLVED_NODE', target: targets[0] },
  ]);
});

test('stored SUBTREE snapshots publish immediately and remain read-only after catalog enrichment', async () => {
  const target = snapshot('NODE', 'node-1', 'SUBTREE', 0);
  const published: unknown[] = [];
  const requested: string[] = [];
  const client = {
    listCatalog: async () => [{ id: 'biology', representationIds: ['rep-biology'] }],
    getNode: async (entryId: string, nodeId: string) => {
      requested.push(`${entryId}:${nodeId}`);
      return {
        id: nodeId,
        entryId,
        trackId: 'EXPERIMENTAL',
      };
    },
  } as unknown as CurriculumBrowserClient;

  await loadPlanningTaskDrafts(
    [{ id: 'task-1', curriculum: { targets: [target] } }],
    client,
    (drafts) => published.push(drafts),
  );

  const expected = { 'task-1': [{ kind: 'UNRESOLVED_NODE', target }] };
  assert.deepEqual(published, [expected, expected]);
  assert.deepEqual(requested, []);
  assert.deepEqual(await restorePlanningDraft([target], client), expected['task-1']);
  assert.throws(
    () => planningDraftToTargetInputs(expected['task-1']),
    /SUBTREE snapshots are read-only/,
  );
  assert.deepEqual(await replaceChangedPlanningTargets(
    [target],
    [{ kind: 'NODE', selection: selection('node-2', 'EXACT'), displayPath: ['two'] }],
    editableContext,
    async () => assert.fail('stored SUBTREE must never enter the v1 replacement flow'),
  ), { kind: 'READ_ONLY' });
});

test('catalog failure, including null track, leaves stored summaries readable', async () => {
  const targets = [
    snapshot('NODE', 'node-1', 'EXACT', 0),
    snapshot('NODE', 'node-2', 'WHOLE', 1),
    snapshot('PLACEMENT', 'placement-1', 'EXACT', 2),
  ];
  for (const code of ['STUDENT_TRACK_NOT_SET', 'NETWORK_ERROR']) {
    const client = {
      listCatalog: async () => { throw Object.assign(new Error(code), { code }); },
    } as unknown as CurriculumBrowserClient;
    assert.deepEqual(await restorePlanningDraft(targets, client), snapshotPlanningDraft(targets));
  }
});

test('a missing current node remains a stored, read-only snapshot', async () => {
  const target = snapshot('NODE', 'node-1', 'WHOLE', 0);
  const client = {
    listCatalog: async () => [{ id: 'biology', representationIds: ['rep-biology'] }],
    getNode: async () => { throw new Error('not found'); },
  } as unknown as CurriculumBrowserClient;
  assert.deepEqual(await restorePlanningDraft([target], client), [
    { kind: 'UNRESOLVED_NODE', target },
  ]);
});

test('task summaries publish stored snapshots before a delayed catalog lookup', async () => {
  const target = snapshot('NODE', 'node-1', 'EXACT', 0);
  let releaseCatalog!: () => void;
  const catalogGate = new Promise<void>((resolve) => { releaseCatalog = resolve; });
  const client = {
    listCatalog: async () => {
      await catalogGate;
      throw Object.assign(new Error('track missing'), { code: 'STUDENT_TRACK_NOT_SET' });
    },
  } as unknown as CurriculumBrowserClient;
  const updates: unknown[] = [];
  const pending = loadPlanningTaskDrafts(
    [{ id: 'task-1', curriculum: { targets: [target] } }],
    client,
    (drafts) => updates.push(drafts),
  );

  assert.deepEqual(updates, [{ 'task-1': [{ kind: 'UNRESOLVED_NODE', target }] }]);
  releaseCatalog();
  await pending;
  assert.deepEqual(updates[1], updates[0]);
});

const editableContext = {
  contentType: 'STUDY' as const,
  actor: 'student' as const,
  source: 'PERSONAL' as const,
  status: 'PENDING' as const,
  completedItemCount: 0,
  hasActiveStudySession: false,
  hasStudyHistory: false,
  hasValidAssessmentAttempt: false,
};

test('historical null and explicit GENERAL tasks keep Curriculum read-only', async () => {
  const originals = [snapshot('NODE', 'node-1', 'EXACT', 0)];
  const changed = [{ kind: 'NODE' as const, selection: selection('node-2', 'EXACT'), displayPath: ['two'] }];
  let calls = 0;
  for (const contentType of [null, 'GENERAL'] as const) {
    const result = await replaceChangedPlanningTargets(
      originals,
      changed,
      { ...editableContext, contentType },
      async () => { calls += 1; return null; },
    );
    assert.deepEqual(result, { kind: 'READ_ONLY' });
  }
  assert.equal(calls, 0);
});

test('unchanged EXACT/WHOLE targets do not invoke replacement or rewrite snapshots', async () => {
  const originals = [
    snapshot('NODE', 'node-1', 'EXACT', 0),
    snapshot('NODE', 'node-2', 'WHOLE', 1),
  ];
  const draft = [
    { kind: 'NODE' as const, selection: selection('node-1', 'EXACT'), displayPath: ['current'] },
    { kind: 'NODE' as const, selection: selection('node-2', 'WHOLE'), displayPath: ['current'] },
  ];
  let calls = 0;
  const result = await replaceChangedPlanningTargets(originals, draft, editableContext, async () => {
    calls += 1;
    return { id: 'updated' };
  });
  assert.deepEqual(result, { kind: 'UNCHANGED' });
  assert.equal(calls, 0);
  assert.deepEqual(originals.map(({ labelSnapshot }) => labelSnapshot), [
    'historical-node-1', 'historical-node-2',
  ]);
});

test('changing another node while retaining historical WHOLE cannot rewrite its snapshot', async () => {
  const originals = [
    snapshot('NODE', 'node-1', 'EXACT', 0),
    snapshot('NODE', 'node-2', 'WHOLE', 1),
  ];
  const draft = [
    { kind: 'NODE' as const, selection: selection('node-2', 'WHOLE'), displayPath: ['two'] },
    { kind: 'NODE' as const, selection: selection('node-3', 'EXACT'), displayPath: ['three'] },
  ];
  const sent: unknown[] = [];
  const result = await replaceChangedPlanningTargets(originals, draft, editableContext, async (targets) => {
    sent.push(targets);
    return { id: 'updated' };
  });

  assert.deepEqual(result, { kind: 'READ_ONLY' });
  assert.deepEqual(sent, []);
});

test('intentionally removing historical WHOLE permits only exact replacement targets', async () => {
  const originals = [snapshot('NODE', 'node-2', 'WHOLE', 0)];
  const draft = [{ kind: 'NODE' as const, selection: selection('node-3', 'EXACT'), displayPath: ['three'] }];
  const sent: unknown[] = [];
  const result = await replaceChangedPlanningTargets(originals, draft, editableContext, async (targets) => {
    sent.push(targets);
    return { id: 'updated' };
  });
  assert.deepEqual(result, { kind: 'REPLACED', value: { id: 'updated' } });
  assert.deepEqual(sent, [[{ referenceKind: 'NODE', curriculumRefId: 'node-3', selectionMode: 'EXACT' }]]);
});

test('legacy PLACEMENT is read-only and never sent through replacement', async () => {
  const originals = [snapshot('PLACEMENT', 'placement-1', 'EXACT', 0)];
  const draft = [
    { kind: 'PLACEMENT' as const, target: originals[0]! },
    { kind: 'NODE' as const, selection: selection('node-1', 'EXACT'), displayPath: ['one'] },
  ];
  let calls = 0;
  const result = await replaceChangedPlanningTargets(originals, draft, editableContext, async () => {
    calls += 1;
    return null;
  });
  assert.deepEqual(result, { kind: 'READ_ONLY' });
  assert.equal(calls, 0);
  assert.deepEqual(snapshotPlanningDraft(originals), [{ kind: 'PLACEMENT', target: originals[0] }]);
});

test('unresolved snapshots and finalized or executed tasks cannot replace targets', async () => {
  const originals = [snapshot('NODE', 'node-1', 'EXACT', 0)];
  const changed = [{ kind: 'NODE' as const, selection: selection('node-2', 'WHOLE'), displayPath: ['two'] }];
  const contexts = [
    { ...editableContext, status: 'COMPLETED' as const },
    { ...editableContext, status: 'PARTIAL' as const },
    { ...editableContext, status: 'SKIPPED' as const },
    { ...editableContext, hasActiveStudySession: true },
    { ...editableContext, hasStudyHistory: true },
    { ...editableContext, hasValidAssessmentAttempt: true },
    { ...editableContext, completedItemCount: 1 },
    { ...editableContext, source: 'COUNSELOR' as const },
  ];
  let calls = 0;
  for (const context of contexts) {
    assert.deepEqual(await replaceChangedPlanningTargets(originals, changed, context, async () => {
      calls += 1;
      return null;
    }), { kind: 'READ_ONLY' });
  }
  assert.deepEqual(await replaceChangedPlanningTargets(
    originals,
    [{ kind: 'UNRESOLVED_NODE', target: originals[0]! }, ...changed],
    editableContext,
    async () => { calls += 1; return null; },
  ), { kind: 'READ_ONLY' });
  assert.equal(calls, 0);
});
