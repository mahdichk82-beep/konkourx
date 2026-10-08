import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const browser = readFileSync(new URL('./CurriculumBrowser.tsx', import.meta.url), 'utf8');
const field = readFileSync(new URL('./PlanningCurriculumField.tsx', import.meta.url), 'utf8');

test('browser picker mode is controlled without changing tree or search ownership', () => {
  assert.match(browser, /selectedNodes\?/);
  assert.match(browser, /onSelectedNodesChange\?/);
  assert.match(browser, /mode\?: 'BROWSE' \| 'PICKER'/);
  assert.match(browser, /mode === 'BROWSE'/);
  assert.match(browser, /listChildren/);
  assert.match(browser, /client\.search/);
  assert.match(browser, /toggleCheckboxSelection/);
  assert.match(browser, /type="checkbox"/);
  assert.match(browser, /!picker \? <fieldset/);
});

test('planning field owns an isolated tri-state modal draft flow', () => {
  assert.match(field, /<TriStateCurriculumPicker/);
  assert.doesNotMatch(field, /<CurriculumBrowser|mode="PICKER"/);
  assert.match(field, /role="dialog"/);
  assert.match(field, /contextLabel=\{contextLabel\}/);
  assert.match(field, /onCancel=\{\(\) => setOpen\(false\)\}/);
  assert.match(field, /onConfirm=\{\(next\) =>/);
  assert.match(field, /Escape/);
  assert.match(field, /\(replacingHistorical \? replacementTriggerRef : triggerRef\)\.current\?\.focus/);
  assert.match(field, /planning-curriculum-modal__backdrop/);
  assert.doesNotMatch(field, /backdrop[^>]*onClick/s);
  assert.doesNotMatch(field, /trackSelector|select.*track|رشته.*<select/s);
});

test('historical snapshots stay visible and require explicit full replacement', () => {
  assert.match(field, /PRESERVED_HISTORICAL/);
  assert.match(field, /labelSnapshot/);
  assert.match(field, /pathSnapshot/);
  assert.match(field, /انتخاب مباحث جدید/);
  assert.match(field, /جایگزین/);
  assert.doesNotMatch(field, /selectionMode\}/);
});
