import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  canRecordSolvedTestProgress,
  progressDraftForTask,
  prepareSolvedTestProgress,
  studySessionPanelMode,
  shouldShowOverdueGroup,
  toggleExpandedTask,
} from './task-progress.ts'

test('solved-test progress is a cumulative nonnegative integer payload', () => {
  assert.deepEqual(prepareSolvedTestProgress('18', 'version-1'), {
    ok: true,
    value: { actualSolvedTestCount: 18, expectedUpdatedAt: 'version-1' },
  })
  assert.deepEqual(prepareSolvedTestProgress('4', 'version-2'), {
    ok: true,
    value: { actualSolvedTestCount: 4, expectedUpdatedAt: 'version-2' },
  })
  assert.equal(prepareSolvedTestProgress('-1', 'version-1').ok, false)
  assert.equal(prepareSolvedTestProgress('1.5', 'version-1').ok, false)
  assert.equal(prepareSolvedTestProgress('', 'version-1').ok, false)
  assert.equal(prepareSolvedTestProgress('2147483648', 'version-1').ok, false)
})

test('an unsaved progress draft keeps the version it was based on', () => {
  const initial = progressDraftForTask(undefined, 8, 'version-1')
  const retained = progressDraftForTask(
    { ...initial, count: '11' },
    14,
    'version-2',
  )
  assert.deepEqual(retained, { count: '11', expectedUpdatedAt: 'version-1' })
  assert.deepEqual(progressDraftForTask(undefined, 14, 'version-2'), {
    count: '14',
    expectedUpdatedAt: 'version-2',
  })
})

test('overdue pagination remains reachable after the currently loaded page is cleared', () => {
  assert.equal(shouldShowOverdueGroup(0, 'older-task'), true)
  assert.equal(shouldShowOverdueGroup(0, null), false)
  assert.equal(shouldShowOverdueGroup(1, null), true)
})

test('only pending STUDY tasks expose execution-progress recording', () => {
  assert.equal(canRecordSolvedTestProgress('STUDY', 'PENDING'), true)
  assert.equal(canRecordSolvedTestProgress('GENERAL', 'PENDING'), false)
  assert.equal(canRecordSolvedTestProgress(null, 'PENDING'), false)
  assert.equal(canRecordSolvedTestProgress('STUDY', 'PARTIAL'), false)
  assert.equal(canRecordSolvedTestProgress('STUDY', 'COMPLETED'), false)
  assert.equal(canRecordSolvedTestProgress('STUDY', 'SKIPPED'), false)
})

test('GENERAL hides StudySession controls while nullable history remains read-only', () => {
  assert.equal(studySessionPanelMode('STUDY'), 'INTERACTIVE')
  assert.equal(studySessionPanelMode('GENERAL'), 'HIDDEN')
  assert.equal(studySessionPanelMode(null), 'READ_ONLY')
})

test('accordion keeps at most one task expanded and permits closing it', () => {
  assert.equal(toggleExpandedTask(null, 'task-1'), 'task-1')
  assert.equal(toggleExpandedTask('task-1', 'task-2'), 'task-2')
  assert.equal(toggleExpandedTask('task-2', 'task-2'), null)
})

test('Today wires bounded overdue continuation, optimistic progress, and STUDY-only execution', () => {
  const page = readFileSync(new URL('../pages/TodayPlanningPage.tsx', import.meta.url), 'utf8')
  const client = readFileSync(new URL('./planning-client.ts', import.meta.url), 'utf8')
  assert.match(page, /overdueBefore: todayKey/)
  assert.match(page, /prepareSolvedTestProgress\([\s\S]*task\.updatedAt/)
  assert.match(page, /sessionPanelMode !== 'HIDDEN' && \(\s*<TaskExecutionPanel/)
  assert.match(page, /readOnly=\{sessionPanelMode === 'READ_ONLY'\}/)
  assert.match(page, /aria-expanded=\{isExpanded\}/)
  assert.match(page, /inert=\{isExpanded \? undefined : true\}/)
  assert.match(client, /daily-tasks\/\$\{encodeURIComponent\(id\)\}\/progress/)
})
