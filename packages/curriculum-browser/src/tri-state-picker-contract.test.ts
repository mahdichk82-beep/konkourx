import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const picker = readFileSync(new URL('./TriStateCurriculumPicker.tsx', import.meta.url), 'utf8');
const hook = readFileSync(new URL('./useTriStateCurriculumPicker.ts', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

test('tri-state picker delegates all selection truth and mutation to the shared engine', () => {
  assert.match(picker, /useTriStateCurriculumPicker/);
  assert.match(hook, /queryNodeSelection/);
  assert.match(hook, /queryNavigationGroupSelection/);
  assert.match(hook, /toggleNode/);
  assert.match(hook, /toggleNavigationGroup/);
  assert.match(hook, /serializeTriStateSelection/);
  assert.match(hook, /runSelectionOperationWithRetry/);
  assert.doesNotMatch(picker + hook, /toggleCheckboxSelection|toggleSelection|updateSelectionMode/);
});

test('native checkboxes expose indeterminate and unknown-loading states accessibly', () => {
  assert.match(picker, /type="checkbox"/);
  assert.match(picker, /inputRef\.current\.indeterminate/);
  assert.match(picker, /UNKNOWN_LOADING/);
  assert.match(picker, /aria-busy/);
  assert.match(picker, /aria-expanded/);
  assert.match(picker, /aria-live="polite"/);
  assert.match(picker, /role="alert"/);
});

test('tree, search, and GROUP controls share one engine draft and report selector choices', () => {
  assert.match(picker, /item\.itemKind === 'NODE'/);
  assert.match(picker, /toggleGroup/);
  assert.match(picker, /revealSearchResult/);
  assert.match(picker, /selection\.selectors\.length/);
  assert.doesNotMatch(picker, /totalItemCount|nodeCount.*انتخاب|موضوع.*پایانی/);
  assert.doesNotMatch(picker, /EXACT|WHOLE|SUBTREE|دامنه|با زیرمبحث/);
});

test('picker has explicit confirmation, cancellation, compact RTL hierarchy, and responsive theming', () => {
  assert.match(picker, /dir="rtl"/);
  assert.match(picker, /onCancel/);
  assert.match(picker, /confirm/);
  assert.match(styles, /\.tri-state-picker/);
  assert.match(styles, /--curriculum-bg-surface/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(max-width: 900px\)/);
  assert.match(styles, /@media \(max-width: 600px\)/);
  assert.match(styles, /planning-curriculum-modal__body[^}]*overflow-y:\s*auto/s);
});

test('picker resolves unknown checkbox facts and terminally invalidates contradictory sessions', () => {
  assert.match(hook, /ensureNodeSelectionState/);
  assert.match(hook, /ensureGroupSelectionState/);
  assert.match(hook, /invalidatesSelectionSession/);
  assert.match(hook, /invalidatedRef\.current/);
  assert.match(picker, /picker\.invalidated/);
});

test('picker search never nests or submits the containing task form', () => {
  assert.doesNotMatch(picker, /<form[^>]*tri-state-picker__search/);
  assert.match(picker, /className="tri-state-picker__search" role="search"/);
  assert.match(picker, /event\.key === 'Enter'/);
  assert.match(picker, /event\.stopPropagation\(\)/);
  assert.match(picker, /type="button" onClick=\{\(\) => void picker\.submitSearch\(\)\}/);
});

test('picker preserves untouched intent and rejects superseded search responses', () => {
  assert.match(hook, /selectionChangedRef/);
  assert.match(hook, /confirmedPlanningCurriculumValue/);
  assert.match(hook, /searchRequest/);
  assert.match(hook, /requestId !== searchRequest\.current/);
});
