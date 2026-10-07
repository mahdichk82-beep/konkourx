import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { isNavigationItemActive, mobileNavigationState, nextTheme } from './shell-state.ts'

test('counselor shell marks only the current navigation item selected', () => {
  assert.equal(isNavigationItemActive('/students', '/students'), true)
  assert.equal(isNavigationItemActive('/students/one', '/students'), false)
})

test('counselor mobile drawer closes after navigation and explicit close', () => {
  assert.equal(mobileNavigationState(false, 'open'), true)
  assert.equal(mobileNavigationState(true, 'navigate'), false)
  assert.equal(mobileNavigationState(true, 'close'), false)
  assert.equal(mobileNavigationState(false, 'toggle'), true)
})

test('counselor theme switch alternates light and dark', () => {
  assert.equal(nextTheme('light'), 'dark')
  assert.equal(nextTheme('dark'), 'light')
})

test('counselor shell keeps the right-side and accessible mobile navigation contract', () => {
  const shellSource = readFileSync(new URL('./AppShell.tsx', import.meta.url), 'utf8')
  const shellStyles = readFileSync(new URL('../../App.css', import.meta.url), 'utf8')
  assert.match(shellSource, /data-side="right"/)
  assert.match(shellSource, /aria-controls="counselor-mobile-navigation"/)
  assert.match(shellSource, /event\.key === 'Escape'/)
  assert.match(shellSource, /event\.key !== 'Tab'/)
  assert.match(shellSource, /className="skip-link"/)
  assert.match(shellSource, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(shellStyles, /grid-template-columns: minmax\(0, 1fr\) 276px/)
  assert.match(shellStyles, /inset: 0 0 0 auto/)
})

test('counselor login exposes the branded identity', () => {
  const loginSource = readFileSync(new URL('../../pages/LoginPage.tsx', import.meta.url), 'utf8')
  assert.match(loginSource, /from '@konkourx\/brand'/)
  assert.match(loginSource, /<BrandLogo context="dark" \/>/)
  assert.doesNotMatch(loginSource, /konkour<span>X<\/span>/)
  assert.match(loginSource, /جایی که موفقیت مهندسی می‌شود/)
  assert.match(loginSource, /آموزش مفهومی؛ مشاوره تخصصی؛ برنامه‌ریزی هدفمند/)
})
