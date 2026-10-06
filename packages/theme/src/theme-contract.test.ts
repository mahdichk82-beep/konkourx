import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('shared theme exposes one entrypoint with canonical brand primitives', () => {
  assert.equal(existsSync(new URL('./index.css', import.meta.url)), true)
  const entrypoint = read('./index.css')
  const brand = read('./brand.css')
  assert.match(entrypoint, /brand\.css/)
  assert.match(entrypoint, /semantic\.css/)
  assert.match(entrypoint, /light\.css/)
  assert.match(entrypoint, /dark\.css/)
  assert.match(brand, /--brand-primary:\s*#2563eb/i)
  assert.match(brand, /--brand-secondary:\s*#8b5cf6/i)
  assert.match(brand, /--brand-accent:\s*#06b6d4/i)
})

test('light and dark themes define the required semantic UI contract', () => {
  const light = read('./light.css')
  const dark = read('./dark.css')
  const required = [
    '--bg-page', '--bg-surface', '--bg-surface-raised', '--bg-subtle',
    '--text-primary', '--text-secondary', '--text-muted', '--text-on-action',
    '--border-default', '--border-subtle', '--border-strong',
    '--action-primary', '--action-primary-hover', '--action-primary-text',
    '--action-secondary', '--action-secondary-hover', '--focus-ring',
    '--selection-bg', '--selection-border', '--hover-bg', '--active-bg',
    '--status-success', '--status-warning', '--status-danger', '--status-info',
    '--input-bg', '--input-border', '--input-placeholder', '--input-disabled-bg',
  ]
  for (const token of required) {
    assert.match(light, new RegExp(`${token}:`))
    assert.match(dark, new RegExp(`${token}:`))
  }
  assert.match(light, /--bg-page:\s*#f8fafc/i)
  assert.match(dark, /--bg-page:\s*#0b1220/i)
})

test('both apps import the shared theme and preserve the existing data-theme engine', () => {
  for (const app of ['student-web', 'counselor-web']) {
    const index = read(`../../../apps/${app}/src/index.css`)
    const themeState = read(`../../../apps/${app}/src/theme/useTheme.ts`)
    assert.match(index, /@konkourx\/theme\/styles\.css/)
    assert.match(themeState, /dataset\.theme/)
    assert.match(themeState, /localStorage/)
  }
})

test('migrated runtime CSS consumes semantic tokens without duplicating canonical colors', () => {
  const paths = [
    '../../../apps/student-web/src/index.css',
    '../../../apps/student-web/src/App.css',
    '../../../apps/student-web/src/phase2c.css',
    '../../../apps/student-web/src/profile/profile.css',
    '../../../apps/counselor-web/src/index.css',
    '../../../apps/counselor-web/src/App.css',
    '../../../apps/counselor-web/src/phase2c.css',
    '../../../apps/counselor-web/src/profile/profile.css',
    '../../curriculum-browser/src/styles.css',
  ]
  const css = paths.filter((path) => existsSync(new URL(path, import.meta.url))).map(read).join('\n')
  assert.match(css, /var\(--(?:bg-surface|text-primary|border-default|action-primary)\)/)
  assert.doesNotMatch(css, /var\(--(?:background|surface|surface-muted|surface-elevated|text|border|accent|accent-hover|accent-strong|accent-soft|danger|danger-soft|success|warning|info|violet|cyan)\)/)
  assert.doesNotMatch(css, /#(?:2563eb|8b5cf6|06b6d4|0f172a|475569|0b1220|111827|162033|f8fafc|f7f9fc|243042)\b/i)
})

test('visualization and legacy compatibility colors are owned by the shared theme', () => {
  const runtimeCss = [
    '../../../apps/student-web/src/App.css',
    '../../../apps/student-web/src/phase2c.css',
    '../../../apps/counselor-web/src/App.css',
    '../../../apps/counselor-web/src/phase2c.css',
    '../../curriculum-browser/src/styles.css',
  ].filter((path) => existsSync(new URL(path, import.meta.url))).map(read).join('\n')
  const theme = [read('./light.css'), read('./dark.css'), read('./semantic.css')].join('\n')
  const migratedLiterals = [
    '#202c5b', '#334a92', '#e0e5f8', '#f1c86d', '#6178c9', '#2a396f', '#151c3c', '#dbe1f7',
    '#3730a3', '#2e4371', '#111d35', '#173b7a', '#37307c', '#172b4d', '#1d2940',
    '#0d4934', '#176b4d', '#d9eee4', '#3d9d72', '#114a36', '#092b21', '#d4e8dd',
    '#2b3b53', '#2b4161', '#132f43', '#24526e', '#241d47', '#132440', '#17345f', '#ddd6fe', '#35265f', '#123d49',
  ]

  for (const literal of migratedLiterals) {
    assert.doesNotMatch(runtimeCss, new RegExp(`${literal}\\b`, 'i'))
  }
  assert.doesNotMatch(runtimeCss, /rgba\(30,\s*58,\s*138,\s*0\.18\)/i)
  assert.match(theme, /--viz-planning-card-start:/)
  assert.match(theme, /--viz-honesty-surface:/)
  assert.match(theme, /--legacy-student-hero-start:/)
  assert.match(theme, /--legacy-counselor-hero-start:/)
  assert.match(theme, /temporary compatibility debt/i)
})
