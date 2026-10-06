import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const component = readFileSync(new URL('./CurriculumBrowser.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const viewModel = readFileSync(new URL('./view-model.ts', import.meta.url), 'utf8');

test('tree UI is recursive, lazy, and exposes accessible expansion and selection state', () => {
  assert.match(component, /function TreeNode/);
  assert.match(component, /<TreeNode/);
  assert.match(component, /listChildren/);
  assert.match(component, /aria-expanded/);
  assert.match(component, /aria-pressed/);
  assert.doesNotMatch(component, /<h1>/);
});

test('GROUP items are rendered as non-selectable navigation wrappers', () => {
  assert.match(component, /itemKind === 'GROUP'/);
  assert.match(component, /curriculum-browser__group/);
  assert.doesNotMatch(component, /CATALOG_ENTRY/);
});

test('search opens backend-provided entry and breadcrumb context', () => {
  assert.match(component, /openSearchResult/);
  assert.match(component, /result\.breadcrumb/);
  assert.match(component, /result\.entryId/);
});

test('browser exposes explicit loading, empty, retryable error, and no-track state paths', () => {
  assert.match(component, /StatusPanel/);
  assert.match(component, /ErrorPanel/);
  assert.match(component, /نتیجه‌ای پیدا نشد/);
  assert.match(component, /تلاش دوباره/);
  assert.match(viewModel, /NO_TRACK/);
});

test('layout has keyboard focus, RTL-safe wrapping, shared semantic theming, and mobile breakpoints', () => {
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /overflow-wrap:\s*anywhere/);
  assert.match(styles, /var\(--curriculum-bg-surface\)/);
  assert.match(styles, /var\(--curriculum-text-primary\)/);
  assert.doesNotMatch(styles, /--curriculum-(?:surface|ink|accent|border):/);
  assert.doesNotMatch(styles, /prefers-color-scheme:\s*dark/);
  assert.match(styles, /max-width:\s*600px/);
});
