import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../components/layout/AppShell.tsx', import.meta.url), 'utf8')
const accountMenu = readFileSync(new URL('./AccountMenu.tsx', import.meta.url), 'utf8')
const page = readFileSync(new URL('./StudentProfilePage.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('./profile.css', import.meta.url), 'utf8')

test('Student Profile Center is canonical and old settings route is compatibility-only', () => {
  assert.match(app, /profileSectionForPath\(effectivePath\) !== null/)
  assert.doesNotMatch(app, /path\.startsWith\('\/profile'\)/)
  assert.match(app, /path === '\/settings'.*navigate\('\/profile\/settings', true\)/s)
  const navigationBlock = app.match(/const navigation[\s\S]*?\n\]/)?.[0] ?? ''
  assert.doesNotMatch(navigationBlock, /تنظیمات|\/settings/)
})

test('Student header owns the accessible account trigger and menu outside the drawer', () => {
  assert.match(accountMenu, /className="account-trigger"/)
  assert.match(accountMenu, /aria-expanded=\{open\}/)
  assert.match(accountMenu, /event\.key !== 'Escape'/)
  assert.match(accountMenu, /nextAccountMenuItemIndex/)
  assert.match(accountMenu, /\[role="menuitem"\].*focus\(\)/s)
  assert.match(accountMenu, /pointerdown/)
  assert.match(accountMenu, /پروفایل من/)
  assert.match(accountMenu, /امنیت و حساب/)
  const drawer = shell.slice(shell.indexOf('className={mobileNavigationOpen'))
  assert.doesNotMatch(drawer, /account-trigger/)
  assert.doesNotMatch(accountMenu, /user\.id/)
})

test('Student Profile preserves real academic, appearance, and security behavior', () => {
  assert.match(page, /رشته تحصیلی هنوز مشخص نشده است/)
  assert.match(page, /educationLevel/)
  assert.match(page, /schoolName/)
  assert.match(page, /changePassword/)
  assert.match(page, /logoutAll/)
  assert.match(page, /onThemeChange/)
  assert.doesNotMatch(page, /subscription|اشتراک|ProfessionalProfile|پروفایل عمومی/)
})

test('Student Profile uses an identity-first compact tab layout instead of a second sidebar', () => {
  assert.match(page, /className="profile-identity"/)
  assert.match(page, /className="profile-tabs"/)
  assert.match(page, /className="profile-section"/)
  assert.match(page, /deriveDisplayName/)
  assert.match(page, /deriveInitials/)
  assert.doesNotMatch(page, /className="profile-nav"/)
  assert.doesNotMatch(styles, /grid-template-columns:\s*220px/)
  assert.match(styles, /overflow-x:\s*auto/)
})

test('Student Profile keeps loading and failure inside compact section context', () => {
  assert.match(page, /profile-inline-state--loading/)
  assert.match(page, /profile-inline-state--error/)
  assert.doesNotMatch(page, /<ContentState/)
})

test('Student settings and security remain real but visually compact', () => {
  assert.match(page, /className="profile-setting-row"/)
  assert.match(page, /className="profile-account-grid"/)
  assert.match(page, /ظاهر برنامه/)
  assert.match(page, /رمز عبور فعلی/)
  assert.match(page, /خروج از این نشست/)
  assert.match(page, /خروج از همه دستگاه‌ها/)
  assert.doesNotMatch(page, /تغییر ایمیل|تغییر شماره|فراموشی رمز|بازنشانی رمز/)
})

test('Planning and Curriculum remain free of client-side track selectors', () => {
  const planning = readFileSync(new URL('../pages/TodayPlanningPage.tsx', import.meta.url), 'utf8')
  const curriculum = readFileSync(new URL('../curriculum/StudentCurriculumPage.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(planning, /trackSelector|selectedTrack|StudentTrack/)
  assert.doesNotMatch(curriculum, /trackSelector|selectedTrack|StudentTrack/)
})
