import assert from 'node:assert/strict';
import test from 'node:test';

import { createCounselorCurriculumClient } from './curriculum-client.ts';
import {
  canEditPlanningCurriculum,
  loadPlanningTaskDrafts,
  type PlanningTargetDraftItem,
} from '../../../../packages/curriculum-browser/src/planning.ts';

test('Counselor Curriculum client uses only the selected Student-bound routes', async () => {
  const paths: string[] = [];
  const request = async <T>(path: string): Promise<T> => {
    paths.push(path);
    return ({ items: [] } as unknown) as T;
  };
  const client = createCounselorCurriculumClient('student/id', request);

  await client.listCatalog();
  await client.getEntry('entry/biology');
  await client.listRoots('entry/biology');
  await client.getNode('entry/biology', 'node one');
  await client.listChildren('entry/biology', 'node one', 25);
  await client.search('سلول و ژنتیک', 50);

  const base = '/counselor/students/student%2Fid/curriculum';
  assert.deepEqual(paths, [
    `${base}/catalog`,
    `${base}/catalog/entry%2Fbiology`,
    `${base}/catalog/entry%2Fbiology/roots`,
    `${base}/catalog/entry%2Fbiology/nodes/node%20one`,
    `${base}/catalog/entry%2Fbiology/nodes/node%20one/children?limit=100&offset=25`,
    `${base}/search?q=%D8%B3%D9%84%D9%88%D9%84%20%D9%88%20%DA%98%D9%86%D8%AA%DB%8C%DA%A9&limit=50&offset=50`,
  ]);
  assert.equal(paths.some((path) => path.includes('/curriculum/tracks/')), false);
});

test('Counselor sees a selected Student saved snapshot when that Student has no track', async () => {
  const paths: string[] = [];
  const client = createCounselorCurriculumClient('selected/student', async <T>(path: string): Promise<T> => {
    paths.push(path);
    throw Object.assign(new Error('track not set'), { code: 'STUDENT_TRACK_NOT_SET', status: 409 });
  });
  const target = {
    referenceKind: 'NODE' as const,
    curriculumRefId: 'saved-node',
    selectionMode: 'EXACT' as const,
    labelSnapshot: 'Saved lesson',
    pathSnapshot: ['Saved subject', 'Saved lesson'],
    representationIdSnapshot: 'saved-representation',
    position: 0,
  };
  const updates: Record<string, PlanningTargetDraftItem[]>[] = [];

  await loadPlanningTaskDrafts(
    [{ id: 'task-1', curriculum: { targets: [target] } }],
    client,
    (drafts) => updates.push(drafts),
  );

  assert.deepEqual(paths, ['/counselor/students/selected%2Fstudent/curriculum/catalog']);
  assert.deepEqual(updates, [
    { 'task-1': [{ kind: 'UNRESOLVED_NODE', target }] },
    { 'task-1': [{ kind: 'UNRESOLVED_NODE', target }] },
  ]);
  assert.equal(canEditPlanningCurriculum({
    actor: 'counselor', contentType: null, source: 'COUNSELOR', status: 'PENDING', completedItemCount: 0,
  }, [target], updates.at(-1)!['task-1']!), false);
});
