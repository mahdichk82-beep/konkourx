import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  buildTaskEvidence,
  filterPlanningTasks,
  plannedMinutesForTask,
  taskProgressPercent,
  taskSubjectLabel,
  tasksForDate,
} from './planning-ui.ts'
import type { CounselorVisibleTask } from '../students/student-tasks-client.ts'

const task = (overrides: Partial<CounselorVisibleTask> = {}): CounselorVisibleTask => ({
  actualSolvedTestCount: 0,
  completedAt: null,
  completedStudySessionCount: 0,
  contentType: 'STUDY',
  createdAt: '2026-10-10T08:00:00.000Z',
  curriculum: { completedItemCount: 0, remainingItemCount: 2, targets: [], totalItemCount: 2 },
  description: null,
  endMinuteOfDay: 600,
  estimatedMinutes: 60,
  hasActiveStudySession: false,
  hasValidAssessmentAttempt: false,
  id: 'task-1',
  plannedTestCount: 20,
  recordedMinutes: 0,
  scheduledFor: '2026-10-10T00:00:00.000Z',
  skipReason: null,
  skippedAt: null,
  source: 'COUNSELOR',
  startMinuteOfDay: 540,
  status: 'PENDING',
  studentProfileId: 'student-1',
  studyPlanId: null,
  studySessionCount: 0,
  subjectId: null,
  title: 'زیست‌شناسی',
  topicId: null,
  updatedAt: '2026-10-10T08:00:00.000Z',
  ...overrides,
})

test('task evidence keeps planned and actual study time visibly separate', () => {
  const evidence = buildTaskEvidence(task({
    completedStudySessionCount: 2,
    hasActiveStudySession: true,
    hasValidAssessmentAttempt: true,
    recordedMinutes: 47,
  }), '2026-10-10')

  assert.equal(evidence.statusLabel, 'در انتظار انجام')
  assert.equal(evidence.plannedTimeLabel, 'زمان برنامه‌ریزی‌شده: ۶۰ دقیقه')
  assert.equal(evidence.actualTimeLabel, 'مطالعه ثبت‌شده: ۴۷ دقیقه')
  assert.deepEqual(evidence.details, [
    '۲ جلسه مطالعه پایان‌یافته',
    'مطالعه اکنون در حال اجراست',
    'نتیجه آزمون معتبر ثبت شده',
    '۰ از ۲ مبحث تکمیل شده',
    '۲۰ تست برنامه‌ریزی‌شده',
  ])
})

test('task evidence handles absent planned and actual time honestly', () => {
  const evidence = buildTaskEvidence(task({
    endMinuteOfDay: null,
    estimatedMinutes: null,
    startMinuteOfDay: null,
  }), '2026-10-10')
  assert.equal(evidence.plannedTimeLabel, 'مدت برنامه‌ریزی‌شده ثبت نشده')
  assert.equal(evidence.actualTimeLabel, 'مطالعه ثبت‌شده‌ای ندارد')
})

test('planned time totals fall back to the real timed window without inventing volumetric time', () => {
  assert.equal(plannedMinutesForTask(task({ estimatedMinutes: null })), 60)
  assert.equal(plannedMinutesForTask(task({
    endMinuteOfDay: null,
    estimatedMinutes: null,
    startMinuteOfDay: null,
  })), 0)
})

test('compact task summaries use real Curriculum labels and recorded progress only', () => {
  const summarized = task({
    curriculum: {
      completedItemCount: 1,
      remainingItemCount: 1,
      targets: [{
        curriculumRefId: 'biology',
        labelSnapshot: 'تنظیم عصبی',
        pathSnapshot: ['زیست‌شناسی', 'تنظیم عصبی'],
        position: 0,
        referenceKind: 'NODE',
        representationIdSnapshot: 'grade-11',
        selectionMode: 'SUBTREE',
      }],
      totalItemCount: 2,
    },
    recordedMinutes: 30,
  })
  assert.equal(taskSubjectLabel(summarized), 'زیست‌شناسی')
  assert.equal(taskProgressPercent(summarized), 50)
  assert.equal(taskSubjectLabel(task({ contentType: 'GENERAL', curriculum: { completedItemCount: 0, remainingItemCount: 0, targets: [], totalItemCount: 0 } })), 'عمومی')
  assert.equal(taskProgressPercent(task({ estimatedMinutes: null, endMinuteOfDay: null, startMinuteOfDay: null })), null)
})

test('task rail filters by real lifecycle status and date', () => {
  const tasks = [
    task(),
    task({ id: 'partial', status: 'PARTIAL' }),
    task({ id: 'other-day', scheduledFor: '2026-10-11T00:00:00.000Z', status: 'COMPLETED' }),
  ]
  assert.deepEqual(tasksForDate(tasks, '2026-10-10').map(({ id }) => id), ['task-1', 'partial'])
  assert.deepEqual(filterPlanningTasks(tasks, 'PARTIAL', '2026-10-10').map(({ id }) => id), ['partial'])
  assert.deepEqual(filterPlanningTasks(tasks, 'ALL', '2026-10-10').map(({ id }) => id), ['task-1', 'partial'])
})

test('timeline selection is keyboard accessible and opens the existing composer with a timed prefill', () => {
  const timelineSource = readFileSync(new URL('./PlanningTimeline.tsx', import.meta.url), 'utf8')
  const pageSource = readFileSync(new URL('../pages/PlanningShellPage.tsx', import.meta.url), 'utf8')
  const composerSource = readFileSync(new URL('./UnifiedTaskComposer.tsx', import.meta.url), 'utf8')

  assert.match(timelineSource, /onTimeRangeSelected/)
  assert.match(timelineSource, /role="button"/)
  assert.match(timelineSource, /onKeyDown=/)
  assert.match(timelineSource, /onClick=/)
  assert.match(timelineSource, /لغو انتخاب/)
  assert.match(pageSource, /composerTimedPrefill/)
  assert.match(pageSource, /initialTimedWindow=\{composerTimedPrefill/)
  assert.match(composerSource, /initialTimedWindow/)
  assert.match(composerSource, /createComposerTask\('composer-task-1', initialDate, initialTimedWindow\)/)
  assert.match(composerSource, /expandedTaskId/)
  assert.match(composerSource, /aria-expanded=/)
})

test('composer escapes the application stacking context and owns one form scroll region', () => {
  const composerSource = readFileSync(new URL('./UnifiedTaskComposer.tsx', import.meta.url), 'utf8')
  const composerStyles = readFileSync(new URL('./planning-workspace.css', import.meta.url), 'utf8')

  assert.match(composerSource, /createPortal/)
  assert.match(composerSource, /document\.body/)
  assert.match(composerSource, /className="unified-composer__scroll-region"/)
  assert.match(composerStyles, /\.unified-composer\s*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto;[^}]*overflow:\s*hidden;/s)
  assert.match(composerStyles, /\.unified-composer__scroll-region\s*\{[^}]*overflow-y:\s*auto;/s)
  assert.doesNotMatch(composerStyles, /\.unified-composer\s*\{[^}]*overflow-y:\s*auto;/s)
})

test('Student Workspace keeps the task workspace primary and weekly history behind disclosure', () => {
  const source = readFileSync(new URL('../students/StudentDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /className="student-overview-details"/)
  assert.match(source, /<summary>نمای هفتگی فشرده<\/summary>/)
  assert.match(source, /<StudentWeeklyPlanning/)
  assert.match(source, /<StudentTaskList/)
  assert.ok(source.indexOf('<StudentTaskList') < source.indexOf('className="student-overview-details"'))
  assert.ok(source.indexOf('className="student-overview-details"') < source.indexOf('<StudentWeeklyPlanning'))
})

test('Student Workspace has no standalone Curriculum-selection action', () => {
  const source = readFileSync(new URL('../students/StudentDetailPage.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /\/students\/\$\{student\.id\}\/curriculum/)
  assert.doesNotMatch(source, /انتخاب مبحث درسی|>مباحث درسی</)
})
