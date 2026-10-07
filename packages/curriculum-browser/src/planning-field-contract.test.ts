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

test('planning field reuses the shared browser in a compact modal draft flow', () => {
  assert.match(field, /<CurriculumBrowser/);
  assert.match(field, /mode="PICKER"/);
  assert.match(field, /role="dialog"/);
  assert.match(field, /mergePlanningSelections/);
  assert.match(field, /contextLabel=\{contextLabel\}/);
  assert.match(field, /انصراف/);
  assert.match(field, /تأیید انتخاب/);
  assert.match(field, /مبحث انتخاب شده/);
  assert.match(field, /triggerRef\.current\?\.focus/);
  assert.doesNotMatch(field, /trackSelector|select.*track|رشته.*<select/s);
});

test('legacy and unresolved snapshots stay visible but cannot become picker selections', () => {
  assert.match(field, /item\.kind === 'PLACEMENT'/);
  assert.match(field, /item\.kind === 'UNRESOLVED_NODE'/);
  assert.match(field, /هدف قدیمی/);
  assert.match(field, /resolvedSelections/);
});
