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
  assert.doesNotMatch(detail, /`\/students\/\$\{student\.id\}\/curriculum`/);
});

test('legacy Counselor Curriculum URL permission-checks the Student and returns to their workspace', () => {
  assert.match(page, /studentsClient\.get\(studentId\)/);
  assert.match(page, /navigate\(`\/students\/\$\{result\.id\}`, true\)/);
  assert.doesNotMatch(page, /CurriculumBrowser|PlanningCurriculumField/);
  assert.doesNotMatch(page, /createCounselorCurriculumClient/);
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
