import assert from 'node:assert/strict';
import test from 'node:test';

import { createStudentCurriculumClient } from './curriculum-client.ts';

test('Student Curriculum client uses only authenticated Student-bound routes', async () => {
  const paths: string[] = [];
  const request = async <T>(path: string): Promise<T> => {
    paths.push(path);
    return ({ items: [] } as unknown) as T;
  };
  const client = createStudentCurriculumClient(request);

  await client.listCatalog();
  await client.getEntry('entry/biology');
  await client.listRoots('entry/biology');
  await client.getNode('entry/biology', 'node one');
  await client.listChildren('entry/biology', 'node one', 25);
  await client.search('سلول و ژنتیک', 50);

  assert.deepEqual(paths, [
    '/student/curriculum/catalog',
    '/student/curriculum/catalog/entry%2Fbiology',
    '/student/curriculum/catalog/entry%2Fbiology/roots',
    '/student/curriculum/catalog/entry%2Fbiology/nodes/node%20one',
    '/student/curriculum/catalog/entry%2Fbiology/nodes/node%20one/children?limit=100&offset=25',
    '/student/curriculum/search?q=%D8%B3%D9%84%D9%88%D9%84%20%D9%88%20%DA%98%D9%86%D8%AA%DB%8C%DA%A9&limit=50&offset=50',
  ]);
  assert.equal(paths.some((path) => path.includes('/curriculum/tracks/')), false);
});
