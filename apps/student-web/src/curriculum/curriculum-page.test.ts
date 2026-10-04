import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('./StudentCurriculumPage.tsx', import.meta.url), 'utf8');

test('Student shell exposes a real Curriculum destination', () => {
  assert.match(app, /path:\s*['"]\/curriculum['"]/);
  assert.match(app, /path === ['"]\/curriculum['"]/);
  assert.match(app, /StudentCurriculumPage/);
});

test('Student page binds the shared browser to authenticated Student Curriculum routes', () => {
  assert.match(page, /createStudentCurriculumClient/);
  assert.match(page, /authClient\.authorizedRequest\.bind\(authClient\)/);
  assert.match(page, /audience="student"/);
  assert.doesNotMatch(page, /curriculum\/tracks/);
  assert.doesNotMatch(page, /track(Id)?\s*=/);
});
