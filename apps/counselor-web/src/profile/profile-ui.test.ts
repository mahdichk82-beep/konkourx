import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../components/layout/AppShell.tsx', import.meta.url), 'utf8')
const accountMenu = readFileSync(new URL('./AccountMenu.tsx', import.meta.url), 'utf8')
const page = readFileSync(new URL('./CounselorProfilePage.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('./profile.css', import.meta.url), 'utf8')

test('Counselor Profile Center is canonical and Settings is absent from sidebar navigation', () => {
  assert.match(app, /profileSectionForPath\(effectivePath\) !== null/)
  assert.doesNotMatch(app, /path\.startsWith\('\/profile'\)/)
  assert.match(app, /path === '\/settings'.*navigate\('\/profile\/settings', true\)/s)
  const navigationBlock = app.match(/const navigation[\s\S]*?\n\]/)?.[0] ?? ''
  assert.doesNotMatch(navigationBlock, /تنظیمات|\/settings/)
})

test('Counselor header account menu is accessible, outside the drawer, and never renders UUID', () => {
  assert.match(accountMenu, /className="account-trigger"/)
  assert.match(accountMenu, /aria-expanded=\{open\}/)
  assert.match(accountMenu, /event\.key !== 'Escape'/)
  assert.match(accountMenu, /nextAccountMenuItemIndex/)
  assert.match(accountMenu, /\[role="menuitem"\].*focus\(\)/s)
  assert.match(accountMenu, /pointerdown/)
  const drawer = shell.slice(shell.indexOf('className={mobileNavigationOpen'))
  assert.doesNotMatch(drawer, /account-trigger/)
  assert.doesNotMatch(accountMenu, /user\.id/)
})

test('Counselor Profile preserves private professional, appearance, and security behavior only', () => {
  assert.match(page, /specialization/)
  assert.match(page, /bio/)
  assert.match(page, /اطلاعات حرفه‌ای خصوصی/)
  assert.match(page, /changePassword/)
  assert.match(page, /logoutAll/)
  assert.match(page, /onThemeChange/)
  assert.doesNotMatch(page, /StudentTrack|educationLevel|schoolName/)
  assert.doesNotMatch(page, /subscription|اشتراک|انتشار|پروفایل عمومی/)
})

test('Counselor Profile uses an identity-first compact tab layout instead of a second sidebar', () => {
  assert.match(page, /className="profile-identity"/)
  assert.match(page, /className="profile-tabs"/)
  assert.match(page, /className="profile-section"/)
  assert.match(page, /deriveDisplayName/)
  assert.match(page, /deriveInitials/)
  assert.doesNotMatch(page, /className="profile-nav"/)
  assert.doesNotMatch(styles, /grid-template-columns:\s*220px/)
  assert.match(styles, /overflow-x:\s*auto/)
})

test('Counselor Profile keeps loading and failure inside compact section context', () => {
  assert.match(page, /profile-inline-state--loading/)
  assert.match(page, /profile-inline-state--error/)
  assert.doesNotMatch(page, /<ContentState/)
})

test('Counselor settings and security stay compact without future account workflows', () => {
  assert.match(page, /className="profile-setting-row"/)
  assert.match(page, /className="profile-account-grid"/)
  assert.match(page, /ظاهر برنامه/)
  assert.match(page, /رمز عبور فعلی/)
  assert.match(page, /خروج از این نشست/)
  assert.match(page, /خروج از همه دستگاه‌ها/)
  assert.doesNotMatch(page, /تغییر ایمیل|تغییر شماره|فراموشی رمز|بازنشانی رمز/)
})
