import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isSelectableRoot,
  selectionKey,
  toggleExpanded,
  toggleSelection,
  updateSelectionMode,
} from './state.ts';
import type { CurriculumCatalogNodeView, CurriculumCatalogRootItem } from './types.ts';

const node: CurriculumCatalogNodeView = {
  id: 'node-biology-1',
  entryId: 'entry-biology',
  trackId: 'EXPERIMENTAL',
  representationId: 'representation-biology',
  parentId: null,
  rawLabel: 'زیست‌شناسی سلولی',
  sourceOrder: 1,
  depth: 0,
  sourceLocator: 'source:biology:1',
  sourceMarker: null,
  childrenCount: 2,
  breadcrumb: [
    { id: 'entry-biology', label: 'زیست‌شناسی', kind: 'ENTRY' },
    { id: 'node-biology-1', label: 'زیست‌شناسی سلولی', kind: 'NODE' },
  ],
  ambiguityCodes: [],
};

test('selection preserves canonical identity, entry, breadcrumb, track, and mode', () => {
  const selected = toggleSelection([], node, { multiple: true, mode: 'EXACT' });

  assert.deepEqual(selected, [{
    nodeId: node.id,
    entryId: node.entryId,
    label: node.rawLabel,
    breadcrumb: node.breadcrumb,
    trackId: node.trackId,
    mode: 'EXACT',
  }]);
  assert.equal(selectionKey(selected[0]), 'entry-biology:node-biology-1');
});

test('single selection replaces the prior node and selecting it again deselects it', () => {
  const first = toggleSelection([], node, { multiple: false, mode: 'WHOLE' });
  const other = { ...node, id: 'node-biology-2', rawLabel: 'ژنتیک' };

  assert.deepEqual(toggleSelection(first, other, { multiple: false, mode: 'EXACT' }), [
    expectSelection(other, 'EXACT'),
  ]);
  assert.deepEqual(toggleSelection(first, node, { multiple: false, mode: 'WHOLE' }), []);
});

test('multiple selection toggles independently and can update EXACT/WHOLE mode', () => {
  const other = { ...node, id: 'node-biology-2', rawLabel: 'ژنتیک' };
  const both = toggleSelection(
    toggleSelection([], node, { multiple: true, mode: 'EXACT' }),
    other,
    { multiple: true, mode: 'WHOLE' },
  );

  assert.equal(both.length, 2);
  assert.equal(updateSelectionMode(both, selectionKey(both[0]), 'WHOLE')[0].mode, 'WHOLE');
  assert.deepEqual(toggleSelection(both, node, { multiple: true, mode: 'EXACT' }), [
    expectSelection(other, 'WHOLE'),
  ]);
});

test('GROUP roots are navigation-only while NODE roots are selectable candidates', () => {
  const group: CurriculumCatalogRootItem = {
    itemKind: 'GROUP',
    id: 'grade-10',
    label: 'دهم',
    selectable: false,
    childNodeIds: ['arabic-lesson-1'],
  };
  const rootNode: CurriculumCatalogRootItem = {
    itemKind: 'NODE',
    nodeId: node.id,
  };

  assert.equal(isSelectableRoot(group), false);
  assert.equal(isSelectableRoot(rootNode), true);
});

test('Humanities Arabic grade wrappers stay non-selectable while canonical lessons remain selectable', () => {
  const gradeGroup: CurriculumCatalogRootItem = {
    itemKind: 'GROUP',
    id: 'arabic-humanities-grade-11',
    label: 'یازدهم',
    selectable: false,
    childNodeIds: ['arabic-humanities-lesson-3'],
  };
  const canonicalLesson: CurriculumCatalogRootItem = {
    itemKind: 'NODE',
    nodeId: 'arabic-humanities-lesson-3',
  };

  assert.equal(isSelectableRoot(gradeGroup), false);
  assert.equal(isSelectableRoot(canonicalLesson), true);
});

test('shared backend node identities pass through selection unchanged', () => {
  const sharedNode = {
    ...node,
    id: 'shared-persian-node',
    entryId: 'shared-persian-entry',
  };

  const selected = toggleSelection([], sharedNode, { multiple: false, mode: 'EXACT' });
  assert.equal(selected[0].nodeId, 'shared-persian-node');
  assert.equal(selected[0].entryId, 'shared-persian-entry');
});

test('expanded state toggles without assuming a maximum tree depth', () => {
  const expanded = toggleExpanded(new Set(), 'deep-node');
  assert.equal(expanded.has('deep-node'), true);
  assert.equal(toggleExpanded(expanded, 'deep-node').has('deep-node'), false);
});

function expectSelection(source: CurriculumCatalogNodeView, mode: 'EXACT' | 'WHOLE') {
  return {
    nodeId: source.id,
    entryId: source.entryId,
    label: source.rawLabel,
    breadcrumb: source.breadcrumb,
    trackId: source.trackId,
    mode,
  };
}
