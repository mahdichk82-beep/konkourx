import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ambiguityNotice,
  errorPresentation,
  modeDescription,
  presentBreadcrumb,
  presentCatalog,
} from './view-model.ts';
import type { CurriculumCatalogEntry } from './types.ts';

const entry = (id: string, title: string, kind: 'BOOK_BASED' | 'THEMATIC'): CurriculumCatalogEntry => ({
  id,
  key: id,
  title,
  kind,
  visibleInTracks: ['EXPERIMENTAL'],
  representationIds: [],
  rootItems: [],
  nodeCount: 0,
  resolutionStatus: 'RESOLVED',
  ambiguityCodes: [],
  provenance: [],
});

test('catalog presentation preserves backend order and treats thematic entries as siblings', () => {
  const presented = presentCatalog([
    entry('biology', 'زیست‌شناسی', 'BOOK_BASED'),
    entry('thematic', 'ترکیبی و موضوعی', 'THEMATIC'),
    entry('physics', 'فیزیک', 'BOOK_BASED'),
  ]);

  assert.deepEqual(presented.map(({ id }) => id), ['biology', 'thematic', 'physics']);
  assert.deepEqual(presented.map(({ badge }) => badge), [null, 'نمای موضوعی', null]);
});

test('breadcrumbs retain entry/group/node context while omitting only the redundant track segment', () => {
  assert.equal(presentBreadcrumb([
    { kind: 'TRACK', id: 'humanities', label: 'علوم انسانی' },
    { kind: 'ENTRY', id: 'arabic', label: 'عربی انسانی' },
    { kind: 'GROUP', id: 'grade-10', label: 'دهم' },
    { kind: 'NODE', id: 'lesson-1', label: 'درس اول' },
  ]), 'عربی انسانی / دهم / درس اول');
});

test('Biology grade ambiguity is neutral metadata rather than an unavailable state', () => {
  assert.match(ambiguityNotice({
    ...entry('biology', 'زیست‌شناسی', 'BOOK_BASED'),
    ambiguityCodes: ['BIOLOGY_SEQUENCE_GRADE_ASSIGNMENT_UNRESOLVED'],
  }) ?? '', /در دسترس/);
  assert.equal(ambiguityNotice(entry('physics', 'فیزیک', 'BOOK_BASED')), null);
});

test('EXACT and WHOLE wording limits WHOLE to direct children', () => {
  assert.match(modeDescription('EXACT'), /فقط همین مبحث/);
  assert.match(modeDescription('WHOLE'), /فرزندان مستقیم/);
});

test('known bound-access errors receive distinct recoverable presentations', () => {
  assert.equal(errorPresentation({ status: 409, code: 'STUDENT_TRACK_NOT_SET' }, 'student').kind, 'NO_TRACK');
  assert.equal(errorPresentation({ status: 404, code: 'STUDENT_NOT_FOUND' }, 'counselor').kind, 'INACCESSIBLE_STUDENT');
  assert.equal(errorPresentation({ status: 404, code: 'CURRICULUM_CATALOG_NODE_NOT_FOUND' }, 'student').kind, 'NOT_FOUND');
  assert.equal(errorPresentation(new Error('offline'), 'student').kind, 'RECOVERABLE');
});
