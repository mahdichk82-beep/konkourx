import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const dashboardSource = readFileSync(new URL('../pages/DashboardPage.tsx', import.meta.url), 'utf8')

test('Student dashboard renders authorized Today loading, error, empty, and summary states', () => {
  assert.match(dashboardSource, /useTehranTodayKey\(\)/)
  assert.match(dashboardSource, /loadDashboardTodayTasks/)
  assert.match(dashboardSource, /planningClient\.listTasks\.bind\(planningClient\)/)
  assert.match(dashboardSource, /kind="loading"/)
  assert.match(dashboardSource, /kind="error"/)
  assert.match(dashboardSource, /todaySummary\.total === 0/)
  assert.match(dashboardSource, /todaySummary\.statuses\.map/)
  assert.match(dashboardSource, /visibilitychange/)
})

test('Student dashboard opens the Curriculum Browser and never restores primary legacy Study navigation', () => {
  assert.match(dashboardSource, /navigate\('\/curriculum'\)/)
  assert.match(dashboardSource, />مباحث درسی</)
  assert.doesNotMatch(dashboardSource, /navigate\('\/study'\)/)
})
