import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('./CounselorCurriculumPage.tsx', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../students/StudentDetailPage.tsx', import.meta.url), 'utf8');
const studentLabelModule = await import('./student-display-label.ts').catch(() => ({}));

test('Counselor route is nested under the selected assigned Student', () => {
  assert.match(app, /students\\\/.*curriculum/);
  assert.match(app, /CounselorCurriculumPage/);
  assert.match(detail, /`\/students\/\$\{student\.id\}\/curriculum`/);
});

test('Counselor page binds shared browser to the selected Student and shows that context', () => {
  assert.match(page, /createCounselorCurriculumClient\(studentId/);
  assert.match(page, /studentsClient\.get\(studentId\)/);
  assert.match(page, /audience="counselor"/);
  assert.match(page, /contextLabel=\{studentDisplayLabel\(student\)\}/);
  assert.doesNotMatch(page, /contextLabel=\{[^}]*student\.id/);
  assert.doesNotMatch(page, /curriculum\/tracks/);
  assert.doesNotMatch(page, /track(Id)?\s*=/);
});

test('Counselor Curriculum context never renders a raw UUID for an unnamed Student', () => {
  const studentDisplayLabel = (studentLabelModule as Record<string, unknown>).studentDisplayLabel;
  assert.equal(typeof studentDisplayLabel, 'function');

  const rawStudentId = 'a444feaf-961b-4a1e-926d-013a8bfe9163';
  const label = (studentDisplayLabel as (student: {
    displayName: string | null;
    educationLevel: string | null;
    id: string;
    schoolName: string | null;
    status: 'ACTIVE';
  }) => string)({
    displayName: null,
    educationLevel: null,
    id: rawStudentId,
    schoolName: null,
    status: 'ACTIVE',
  });

  assert.equal(label, 'دانش‌آموز بدون نام');
  assert.doesNotMatch(label, new RegExp(rawStudentId));
});
