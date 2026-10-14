import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const browser = readFileSync(new URL('./CurriculumBrowser.tsx', import.meta.url), 'utf8');
const field = readFileSync(new URL('./PlanningCurriculumField.tsx', import.meta.url), 'utf8');

test('standalone browser and Task picker remain separate contracts', () => {
  assert.match(browser, /listChildren/);
  assert.match(browser, /client\.search/);
  assert.doesNotMatch(browser, /selectedNodes|onSelectedNodesChange|toggleCheckboxSelection/);
  assert.doesNotMatch(browser, /type="checkbox"|SelectionTray/);
  assert.match(field, /<TriStateCurriculumPicker/);
});

test('planning field owns an isolated tri-state modal draft flow', () => {
  assert.match(field, /<TriStateCurriculumPicker/);
  assert.doesNotMatch(field, /<CurriculumBrowser|mode="PICKER"/);
  assert.match(field, /createPortal/);
  assert.match(field, /document\.body/);
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
