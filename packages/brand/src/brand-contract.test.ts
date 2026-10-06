import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('canonical brand identity and mark are centralized without marketing copy', () => {
  assert.equal(existsSync(new URL('../assets/mark.svg', import.meta.url)), true)
  const config = read('./brand-config.ts')
  const logo = read('./BrandLogo.tsx')

  assert.match(config, /name:\s*['"]konkourX['"]/)
  assert.match(config, /fullLogoLight:\s*null/)
  assert.match(config, /fullLogoDark:\s*null/)
  assert.doesNotMatch(`${config}\n${logo}`, /مسیر مطمئن|Learn\s*[·.]\s*Plan/i)
  assert.doesNotMatch(`${config}\n${logo}`, /uuid|personProfile|studentProfile/i)
})

test('BrandLogo owns the temporary wordmark and centralized theme context', () => {
  const logo = read('./BrandLogo.tsx')
  const mark = read('./BrandMark.tsx')

  assert.match(logo, /BrandContext\s*=\s*['"]light['"]\s*\|\s*['"]dark['"]\s*\|\s*['"]auto['"]/)
  assert.match(logo, /brand\.name/)
  assert.match(mark, /brand\.assets\.mark/)
  assert.doesNotMatch(mark, /favicon\.svg/)
})

test('Student and Counselor shells and logins consume the shared brand API only', () => {
  for (const app of ['student-web', 'counselor-web']) {
    const shell = read(`../../../apps/${app}/src/components/layout/AppShell.tsx`)
    const login = read(`../../../apps/${app}/src/pages/LoginPage.tsx`)
    assert.equal(existsSync(new URL(`../../../apps/${app}/src/components/brand/BrandMark.tsx`, import.meta.url)), false)
    assert.match(shell, /from ['"]@konkourx\/brand['"]/)
    assert.match(login, /from ['"]@konkourx\/brand['"]/)
    assert.match(shell, /<BrandLogo/)
    assert.match(login, /<BrandLogo/)
    assert.doesNotMatch(`${shell}\n${login}`, /konkour<span>|src=['"]\/favicon\.svg/)
  }
})

test('app favicon copies match the canonical mark byte for byte', () => {
  const canonical = readFileSync(new URL('../assets/mark.svg', import.meta.url))
  for (const app of ['student-web', 'counselor-web']) {
    const favicon = readFileSync(new URL(`../../../apps/${app}/public/favicon.svg`, import.meta.url))
    assert.deepEqual(favicon, canonical)
  }
})
