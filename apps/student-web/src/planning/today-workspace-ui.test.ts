import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const planningSource = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8')

test('Today renders a today-first compact list and one contextual detail surface', () => {
  const workspaceSource = planningSource('./TodayTaskWorkspace.tsx')
  const pageSource = planningSource('../pages/TodayPlanningPage.tsx')
  assert.match(workspaceSource, /TodayTaskList/)
  assert.match(workspaceSource, /TodayTaskDetail/)
  assert.match(workspaceSource, /todayTaskGroups/)
  assert.doesNotMatch(pageSource, /task-item__collapsible/)
  assert.doesNotMatch(pageSource, /expandedTaskId/)
})

test('compact rows expose one contextual primary action and no accordion payload', () => {
  const listSource = planningSource('./TodayTaskList.tsx')
  assert.match(listSource, /taskActionModel/)
  assert.match(listSource, /data-task-focus-id/)
  assert.match(listSource, /aria-label=.*task\.title/s)
  assert.doesNotMatch(listSource, /TaskExecutionPanel|PlanningCurriculumField|task-item__collapsible/)
})

test('selected Today rows expose a visible state without changing URL-backed selection', () => {
  const listSource = planningSource('./TodayTaskList.tsx')
  const styles = planningSource('../App.css')
  assert.match(listSource, /today-task-row__selection/)
  assert.match(listSource, /selectedTaskId === task\.id/)
  assert.match(listSource, /aria-current=/)
  assert.match(styles, /\.today-task-row__selection/)
  assert.match(styles, /\.today-task-row\.is-selected[^}]*box-shadow:/)
})

test('detail is one selected surface with progressive secondary disclosures', () => {
  const detailSource = planningSource('./TodayTaskDetail.tsx')
  assert.match(detailSource, /data-today-task-detail/)
  assert.match(detailSource, /<details/)
  assert.match(detailSource, /بازگشت به فهرست/)
  assert.match(detailSource, /tabIndex=\{-1\}/)
})

test('Student task detail renders durable missed scheduled days without replacing lifecycle status', () => {
  const detailSource = planningSource('./TodayTaskDetail.tsx')

  assert.match(detailSource, /task\.deadlineMisses\.length > 0/)
  assert.match(detailSource, /task\.deadlineMisses\.map/)
  assert.match(detailSource, /سابقه موعدهای انجام‌نشده/)
  assert.match(detailSource, /classifyTaskPresentation\(task, todayKey\)/)
})

test('active result entry loads only the associated task when it is absent from loaded pages', () => {
  const pageSource = planningSource('../pages/TodayPlanningPage.tsx')
  assert.match(pageSource, /openTaskResult\(activeSession\.dailyTaskId\)/)
  assert.match(pageSource, /planningClient\.getTask\(taskId\)/)
  assert.doesNotMatch(pageSource, /activeSession.*group\.items\[0\]/s)
})

test('all lifecycle statuses remain filterable and Today is ordered before overdue', () => {
  const pageSource = planningSource('../pages/TodayPlanningPage.tsx')
  assert.match(pageSource, /<option value="PARTIAL">/)
  const workspaceSource = planningSource('./TodayTaskWorkspace.tsx')
  assert.match(workspaceSource, /todayTaskGroups\(todayTasks, overdueTasks\)/)
})

test('unified result flow uses safe orchestration and keeps completion explicit', () => {
  const flowSource = planningSource('./TaskResultFlow.tsx')
  const pageSource = planningSource('../pages/TodayPlanningPage.tsx')
  assert.match(flowSource, /finishStudySessionSafely/)
  assert.match(flowSource, /saveTaskResult/)
  assert.match(flowSource, /کار کاملاً انجام شد/)
  assert.match(flowSource, /بعداً ادامه می‌دهم/)
  assert.match(flowSource, /CONTINUE/)
  assert.match(pageSource, /<TaskResultFlow/)
  assert.match(flowSource, /projectedCoverageComplete/)
  assert.match(flowSource, /onDirtyChange/)
  assert.match(flowSource, /onMutationUncertaintyChange/)
  assert.match(pageSource, /pendingDetailNavigation/)
  assert.match(pageSource, /uncertainResultTaskId/)
  assert.match(pageSource, /اطلاعات ذخیره‌شده حفظ می‌شوند/)
})

test('study history does not duplicate live start or finish controls', () => {
  const historySource = planningSource('./TaskExecutionPanel.tsx')
  assert.doesNotMatch(historySource, /onStart|onFinish|ActiveSessionTiming|پایان و ثبت مطالعه/)
  assert.match(historySource, /سابقه بازه‌های مطالعه/)
  assert.match(historySource, /ثبت بازخورد/)
  assert.match(historySource, /requestGeneration/)
})

test('terminal and legacy tasks remain read-only in result and scheduling surfaces', () => {
  const flowSource = planningSource('./TaskResultFlow.tsx')
  const pageSource = planningSource('../pages/TodayPlanningPage.tsx')
  assert.match(flowSource, /status === 'PENDING'[\s\S]*contentType !== null/)
  assert.match(pageSource, /selectedTask\.status !== 'PENDING'/)
  assert.match(pageSource, /selectedTask\.source === 'PERSONAL'[\s\S]*selectedTask\.status === 'PENDING'/)
})

test('workspace styles provide desktop split, mobile replacement, focus, and reduced motion', () => {
  const styles = readFileSync(new URL('../App.css', import.meta.url), 'utf8')
  assert.match(styles, /\.today-workspace \{[^}]*grid-template-columns/s)
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.today-workspace\.has-detail \.today-workspace__list \{ display: none; \}/)
  assert.match(styles, /\.today-task-detail__back \{ display: inline-flex; \}/)
  assert.match(styles, /\.today-task-row__summary:focus-visible/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.today-task-row/)
})

test('App recognizes canonical task routes and the global timer opens its exact task', () => {
  const appSource = planningSource('../App.tsx')
  assert.match(appSource, /planningTaskIdForPath\(path\)/)
  assert.match(appSource, /<TodayPlanningPage[\s\S]*taskId=\{planningTaskId\}/)
  assert.match(appSource, /planningTaskPath\(session\.dailyTaskId\)/)
  assert.doesNotMatch(appSource, /onClick=\{\(\) => navigate\('\/planning'\)\}/)
})

test('direct task routes load one owned task and reject stale route responses', () => {
  const pageSource = planningSource('../pages/TodayPlanningPage.tsx')
  assert.match(pageSource, /planningClient\.getTask\(taskId\)/)
  assert.match(pageSource, /createLatestTaskRouteLoader/)
  assert.match(pageSource, /routeTaskLoad[\s\S]*ContentState/)
  assert.match(pageSource, /setNavigationBlocker/)
  assert.match(pageSource, /pendingRouteNavigation/)
  assert.match(pageSource, /mergeTasks\(\[[\s\S]{0,120}\.\.\.overdueTasks,[\s\S]{0,80}\.\.\.tasks,[\s\S]{0,100}selectedExternalTask \? \[selectedExternalTask\] : \[\]/)
  assert.match(pageSource, /result\.kind === 'REPLACED'[\s\S]{0,120}replaceTaskFromServer\(result\.value\)/)
})

test('Weekly task summaries navigate without sharing the reschedule handler', () => {
  const weeklySource = planningSource('../pages/WeeklyPlanningPage.tsx')
  assert.match(weeklySource, /weekly-task__open/)
  assert.match(weeklySource, /navigate\(planningTaskPath\(task\.id\)\)/)
  assert.match(weeklySource, /onClick=\{\(\) => void handleMove\(selectedTask\.id, day\.key\)\}/)
  assert.doesNotMatch(weeklySource, /weekly-task__open[\s\S]{0,300}handleMove/)
  assert.match(weeklySource, /planningWeekStart/)
  assert.match(weeklySource, /buildCompactTaskSummary\(task, todayKey\)/)
  assert.match(weeklySource, /summary\.presentation\.indicatorLabel/)
  assert.match(weeklySource, /<progress/)
  assert.match(weeklySource, /formatJalaliDate\(day\.key\)/)
  assert.match(weeklySource, /calendarDateKey\(task\.scheduledFor\)/)
  assert.doesNotMatch(weeklySource, /formatCurriculumProgress|subjectNames|topicNames/)
})

test('URL-backed detail closing restores list focus without forcing a scroll jump', () => {
  const pageSource = planningSource('../pages/TodayPlanningPage.tsx')
  const routerSource = planningSource('../routing/useBrowserRouter.ts')
  assert.match(pageSource, /onCloseDetail=\{\(\) => requestDetailNavigation\(\{ type: 'CLOSE' \}\)\}/)
  assert.match(pageSource, /navigate\('\/planning',[\s\S]*preserveScroll/)
  assert.match(routerSource, /setNavigationBlocker/)
  assert.match(routerSource, /popstate/)
  assert.match(routerSource, /history\.go/)
  assert.match(routerSource, /preserveScroll/)
})

test('an accepted result-flow close bypasses only the navigation it already approved', () => {
  const pageSource = planningSource('../pages/TodayPlanningPage.tsx')
  assert.match(
    pageSource,
    /onRequestClose=\{\(\) => \{[\s\S]{0,220}allowNextNavigationRef\.current = true[\s\S]{0,120}completeDetailNavigation\(\{ type: 'CLOSE' \}\)/,
  )
})
