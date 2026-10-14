# Student Today Workspace + Unified Study Result Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Student `/planning` into a compact desktop/mobile Today workspace with one explicit, retry-safe study-result flow over the existing independent APIs.

**Architecture:** Keep `TodayPlanningPage` as the data owner and `StudyTimerContext` as the only live-session authority, but move presentation decisions and result orchestration into pure tested helpers and focused Student components. Save session, Curriculum, solved-test, and Task outcome mutations sequentially; reconcile authoritative state after uncertain responses and never infer Task completion.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Node test runner, existing `planningClient`, `StudyTimerContext`, `@konkourx/task-presentation`, and existing KonkourX CSS tokens.

**Spec:** `docs/superpowers/specs/2026-10-13-student-today-workspace-unified-results-design.md`

## Global Constraints

- Work only in `apps/student-web` plus this Student-specific plan/spec; preserve every existing Counselor, shared-package, lockfile, and canonical-document change.
- Do not switch branches, stash, reset, clean, stage, commit, migrate, reseed, or reset the database.
- Add no backend endpoint, schema, migration, Task state, persistence model, permission, or automatic lifecycle transition.
- `DailyTask`, `StudySession`, Curriculum coverage, and cumulative solved-test progress remain independent.
- Task completion requires explicit Student confirmation and a server-confirmed `COMPLETED` response.
- `بعداً ادامه می‌دهم` keeps the Task `PENDING`; historical `PARTIAL` remains terminal and read-only.
- Result recording must work without an active StudySession.
- Use the existing server-backed timer, pause ledger, active-session recovery, ownership checks, Curriculum snapshot semantics, solved-test optimistic concurrency, and Task validation.
- Reconcile authoritative server state before retrying an ambiguous StudySession finish or Task completion response; never blindly repeat an uncertain mutation.
- Before closing with `بعداً ادامه می‌دهم`, distinguish saved from unsaved edits and require confirmation before discarding any local edit.
- Keep one primary action per compact Task row and disclose secondary controls only in the selected detail surface.
- Desktop uses one list/detail workspace; mobile uses one full-width detail surface with Back and focus restoration.
- Do not claim Product Owner Visual PASS.

## File structure

- Create `apps/student-web/src/planning/task-result-flow.ts`: pure orchestration contracts, reconciliation decisions, save reports, and unsaved-edit guards.
- Create `apps/student-web/src/planning/task-result-flow.test.ts`: failure-ordering, authoritative reconciliation, retry, and discard-confirmation tests.
- Create `apps/student-web/src/planning/today-workspace.ts`: pure Task action, grouping, summary, and detail-navigation view model.
- Create `apps/student-web/src/planning/today-workspace.test.ts`: STUDY/GENERAL, lifecycle, timing, active association, and navigation tests.
- Create `apps/student-web/src/planning/TodayTaskWorkspace.tsx`: desktop list/detail and mobile list/detail composition.
- Create `apps/student-web/src/planning/TodayTaskList.tsx`: compact group and Task-row rendering.
- Create `apps/student-web/src/planning/TodayTaskDetail.tsx`: selected Task identity, primary action, and progressive secondary sections.
- Create `apps/student-web/src/planning/TaskResultFlow.tsx`: result UI state and connections to pure orchestration.
- Create `apps/student-web/src/planning/today-workspace-ui.test.ts`: repository-standard source contract checks for structure, copy, accessibility hooks, and forbidden duplicate controls.
- Modify `apps/student-web/src/pages/TodayPlanningPage.tsx`: retain queries/mutations, supply focused component props, and remove the expanded-card renderer.
- Modify `apps/student-web/src/planning/TaskExecutionPanel.tsx`: retain read-only history and finished-session feedback; remove duplicated live start/finish controls.
- Modify `apps/student-web/src/planning/task-progress.ts` and `task-progress.test.ts`: retire accordion-only state and preserve progress/overdue/session-mode helpers still used.
- Modify `apps/student-web/src/planning/task-execution.ts` and `task-execution.test.ts`: preserve timer/history utilities and add only reconciliation helpers that belong to session execution.
- Modify `apps/student-web/src/App.css`: compact workspace, detail, result-flow, Light/Dark, RTL, responsive, focus, and reduced-motion styles.
- Modify `apps/student-web/package.json`: add the three new test files to the existing deterministic Student test command.

## Review Focus

1. A finish response is lost after the server closed the session: reconcile by session ID, display the server-recorded duration, and do not issue a second finish.
2. A completion response is lost after the server completed the Task: reconcile the Task as `COMPLETED`, report success, and do not repeat completion.
3. The active session's Task is excluded by filters/pagination or was concurrently removed: load only its `dailyTaskId`, never bind it to another row, and preserve the authoritative active session if detail loading fails.
4. Another client changes a Task between Curriculum saves and solved-test submission: use the latest returned/reconciled `updatedAt`, preserve the local solved-test draft, and require a deliberate retry on conflict.
5. The Student chooses `بعداً ادامه می‌دهم` with invalid, failed, or otherwise unsaved edits: name saved and unsaved data and confirm before discarding the local remainder.

---

### Task 1: Result orchestration and authoritative reconciliation

**Files:**
- Create: `apps/student-web/src/planning/task-result-flow.ts`
- Create: `apps/student-web/src/planning/task-result-flow.test.ts`
- Modify: `apps/student-web/package.json`

**Interfaces:**
- Consumes: `DailyTask`, `FinishStudySessionInput`, and `StudySession` from `planning-client.ts`.
- Produces: `finishStudySessionSafely(input, ports): Promise<FinishSessionReport>`.
- Produces: `saveTaskResult(task, draft, ports): Promise<TaskResultSaveReport>`.
- Produces: `pendingResultEdits(task, draft): PendingResultEdit[]` and `continueLaterDisposition(report, pendingEdits): 'CLOSE' | 'CONFIRM_DISCARD'`.
- `FinishSessionReport.kind`: `FINISHED | ACTIVE_RETRYABLE | UNKNOWN`; only `ACTIVE_RETRYABLE` permits another finish request.
- `TaskResultSaveReport` carries the latest authoritative Task, per-item Curriculum results, solved-test result, outcome result, and saved/unsaved labels.

- [ ] **Step 1: Write failing finish-reconciliation tests**

```ts
test('lost finish response reconciles the same session as finished without repeating finish', async () => {
  const report = await finishStudySessionSafely(input, portsWhoseFinishThrowsButHistoryIsFinished)
  assert.equal(report.kind, 'FINISHED')
  assert.equal(report.session.id, input.session.id)
  assert.equal(finishCalls, 1)
})

test('retry is enabled only after authoritative reconciliation still finds the same active session', async () => {
  assert.equal((await finishStudySessionSafely(input, activeAfterFailurePorts)).kind, 'ACTIVE_RETRYABLE')
  assert.equal((await finishStudySessionSafely(input, reconciliationFailurePorts)).kind, 'UNKNOWN')
})
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `pnpm --filter student-web exec node --test src/planning/task-result-flow.test.ts`  
Expected: FAIL because `task-result-flow.ts` and its exports do not exist.

- [ ] **Step 3: Implement `finishStudySessionSafely`**

Call finish once. On failure, reconcile the active session and load the selected Task's session history. Return `FINISHED` when the same ID is server-finished, `ACTIVE_RETRYABLE` only when the same ID remains active, and `UNKNOWN` when authoritative state cannot establish either result. Never call finish from the reconciliation branch.

- [ ] **Step 4: Add failing sequential-save and ambiguous-completion tests**

```ts
test('result save retains successful item writes and uses the latest task version for solved tests', async () => {
  const report = await saveTaskResult(taskV1, draftWithThreeItemsAndTests, partialFailurePorts)
  assert.deepEqual(itemCallOrder, ['item-1', 'item-2', 'item-3'])
  assert.equal(solvedTestInput.expectedUpdatedAt, latestSuccessfulTask.updatedAt)
  assert.deepEqual(report.curriculum.failedItemIds, ['item-2'])
  assert.equal(completeCalls, 0)
})

test('lost completion response reconciles completed state without repeating completion', async () => {
  const report = await saveTaskResult(fullyCoveredTask, completeDraft, lostCompletionResponsePorts)
  assert.equal(report.outcome.kind, 'COMPLETED')
  assert.equal(completeCalls, 1)
})
```

- [ ] **Step 5: Run the focused test and verify the new cases fail for missing behavior**

Run: `pnpm --filter student-web exec node --test src/planning/task-result-flow.test.ts`  
Expected: FAIL on sequential report/reconciliation assertions, not on fixture setup.

- [ ] **Step 6: Implement `saveTaskResult`**

Submit dirty Curriculum items sequentially, reconcile uncertain item responses against the desired absolute checkbox state, then submit solved tests with the latest Task `updatedAt`. Preserve the solved-test draft on any mismatch. Request `COMPLETED` only for the explicit complete outcome when no required write remains failed/unsaved and existing coverage permits completion. Reconcile every completion failure before returning retry eligibility.

- [ ] **Step 7: Add failing unsaved-edit guard tests**

```ts
test('continue later names unsaved edits and requires confirmation before discard', () => {
  assert.deepEqual(pendingResultEdits(task, dirtyDraft), ['CURRICULUM', 'SOLVED_TESTS'])
  assert.equal(continueLaterDisposition(partiallySavedReport, ['SOLVED_TESTS']), 'CONFIRM_DISCARD')
  assert.equal(continueLaterDisposition(fullySavedPendingReport, []), 'CLOSE')
})
```

- [ ] **Step 8: Implement the pending-edit and close-disposition helpers, then verify GREEN**

Run: `pnpm --filter student-web exec node --test src/planning/task-result-flow.test.ts`  
Expected: PASS with finish, result ordering, lost-response reconciliation, partial failure, stale progress, and discard-confirmation cases.

- [ ] **Step 9: Record a recoverable no-commit checkpoint**

Run: `git diff --check -- apps/student-web/src/planning/task-result-flow.ts apps/student-web/src/planning/task-result-flow.test.ts apps/student-web/package.json`  
Expected: exit 0. Do not stage or commit.

### Task 2: Today workspace view model

**Files:**
- Create: `apps/student-web/src/planning/today-workspace.ts`
- Create: `apps/student-web/src/planning/today-workspace.test.ts`
- Modify: `apps/student-web/package.json`
- Modify: `apps/student-web/src/planning/task-progress.ts`
- Modify: `apps/student-web/src/planning/task-progress.test.ts`

**Interfaces:**
- Consumes: `DailyTask`, `StudySession`, existing schedule formatters, and task presentation status.
- Produces: `taskActionModel(task, activeSession): { primary: TodayTaskAction; secondary: TodayTaskAction[] }`.
- Produces: `todayTaskGroups(todayTasks, overdueTasks): TodayTaskGroup[]` with `today` before `overdue`.
- Produces: `taskSummaryModel(task, subjectName): TodayTaskSummaryModel` without invented times or a zero/unrecorded distinction.
- Produces: `detailNavigationReducer(state, event): DetailNavigationState` carrying selected and return-focus Task IDs.
- Produces: `activeTaskMatch(session, loadedTasks): DailyTask | null`; absence means load that exact ID.

- [ ] **Step 1: Write failing action and grouping tests**

```ts
test('one primary action respects content type, lifecycle, and active association', () => {
  assert.deepEqual(taskActionModel(pendingStudy, null), { primary: 'START_STUDY', secondary: ['RECORD_RESULT'] })
  assert.equal(taskActionModel(pendingStudy, matchingActive).primary, 'FINISH_AND_RECORD')
  assert.equal(taskActionModel(pendingStudy, otherActive).primary, 'SWITCH_STUDY')
  assert.equal(taskActionModel(pendingGeneral, null).primary, 'RECORD_RESULT')
  assert.equal(taskActionModel(partialStudy, null).primary, 'VIEW_DETAILS')
})

test('today precedes overdue and every terminal today status remains present', () => {
  assert.deepEqual(todayTaskGroups(todayWithAllStatuses, overdue).map(({ id }) => id), ['today', 'overdue'])
  assert.deepEqual(todayTaskGroups(todayWithAllStatuses, overdue)[0].items.map(({ status }) => status),
    ['PENDING', 'COMPLETED', 'PARTIAL', 'SKIPPED'])
})
```

- [ ] **Step 2: Run and verify RED**

Run: `pnpm --filter student-web exec node --test src/planning/today-workspace.test.ts`  
Expected: FAIL because the view-model module does not exist.

- [ ] **Step 3: Implement action, grouping, and honest summary models**

Timed summaries expose the existing exact range. Date-only/target-based summaries never receive fabricated clock values. A solved-test value of zero stays numeric truth and never gains an “unrecorded” label. Include stored Curriculum context when legacy subject is absent.

- [ ] **Step 4: Add failing active-association and detail-navigation tests**

```ts
test('active session matches only its dailyTaskId and requests an exact load when absent', () => {
  assert.equal(activeTaskMatch(active, [otherTask]), null)
  assert.equal(activeTaskMatch(active, [matchingTask])?.id, active.dailyTaskId)
})

test('mobile detail close restores the originating task identity', () => {
  const opened = detailNavigationReducer(initialDetailState, { type: 'OPEN', taskId: 'task-2' })
  assert.deepEqual(detailNavigationReducer(opened, { type: 'CLOSE' }), {
    selectedTaskId: null,
    returnFocusTaskId: 'task-2',
  })
})
```

- [ ] **Step 5: Implement navigation state, remove accordion-only helpers, and verify GREEN**

Remove `toggleExpandedTask` and its accordion assertion only after the new navigation test is RED. Preserve overdue request keys, progress-draft settlement, solved-test applicability, and historical session-panel behavior.

Run: `pnpm --filter student-web exec node --test src/planning/today-workspace.test.ts src/planning/task-progress.test.ts`  
Expected: PASS.

- [ ] **Step 6: Record a recoverable no-commit checkpoint**

Run: `git diff --check -- apps/student-web/src/planning/today-workspace.ts apps/student-web/src/planning/today-workspace.test.ts apps/student-web/src/planning/task-progress.ts apps/student-web/src/planning/task-progress.test.ts apps/student-web/package.json`  
Expected: exit 0. Do not stage or commit.

### Task 3: Compact list/detail workspace and active Task recovery

**Files:**
- Create: `apps/student-web/src/planning/TodayTaskWorkspace.tsx`
- Create: `apps/student-web/src/planning/TodayTaskList.tsx`
- Create: `apps/student-web/src/planning/TodayTaskDetail.tsx`
- Create: `apps/student-web/src/planning/today-workspace-ui.test.ts`
- Modify: `apps/student-web/src/pages/TodayPlanningPage.tsx:169-244,246-890,891-1556`
- Modify: `apps/student-web/package.json`

**Interfaces:**
- Consumes: Task/group/action models from Task 2 and existing page-owned Task, filter, loading, mutation, scheduling, Curriculum, and timer callbacks.
- Produces: `TodayTaskWorkspaceProps` with exactly one `selectedTask`, `onSelectTask(taskId)`, and `onCloseDetail()`.
- Produces: `TodayTaskDetailProps` that receives already-authorized callbacks; it does not call Counselor or shared-package mutation APIs.
- `TodayPlanningPage` retains the authoritative `tasks`, `overdueTasks`, `activeSession`, and separately loaded `selectedExternalTask` state.

- [ ] **Step 1: Write failing UI contract tests**

```ts
test('Today renders compact today-first list and one contextual detail surface', () => {
  assert.match(workspaceSource, /TodayTaskList/)
  assert.match(workspaceSource, /TodayTaskDetail/)
  assert.doesNotMatch(pageSource, /task-item__collapsible/)
  assert.doesNotMatch(pageSource, /expandedTaskId/)
})

test('active result entry loads only the associated task when it is absent from loaded pages', () => {
  assert.match(pageSource, /planningClient\.getTask\(activeSession\.dailyTaskId\)/)
  assert.doesNotMatch(pageSource, /activeSession.*group\.items\[0\]/s)
})
```

- [ ] **Step 2: Run and verify RED**

Run: `pnpm --filter student-web exec node --test src/planning/today-workspace-ui.test.ts`  
Expected: FAIL because the workspace components do not exist and the old accordion remains.

- [ ] **Step 3: Implement compact list and selected detail composition**

Render today's group before overdue. Put title, relevant subject/Curriculum context, schedule/target, planned versus actual facts, localized status, and one action in each summary. Move scheduling, plan detail, history, and skip into independent secondary disclosures in `TodayTaskDetail`; do not render every section open.

- [ ] **Step 4: Integrate exact active-Task selection and recovery**

When the top active card or global result entry opens, select the loaded Task only when IDs match. Otherwise call the existing owned `getTask(activeSession.dailyTaskId)`, store it as `selectedExternalTask`, and keep the active card operational if the Task detail request fails. Clear stale external detail when the authoritative active session changes to another ID.

- [ ] **Step 5: Preserve page operations while removing the accordion renderer**

Keep existing date/filter pagination, bounded overdue pagination, create-personal-task form, Curriculum planning edit permissions, personal rescheduling, skip reasons, start/switch/cancel handlers, and server reconciliation. Add `PARTIAL` to the status filter and compact loaded-page summary.

- [ ] **Step 6: Run focused Student tests and verify GREEN**

Run: `pnpm --filter student-web exec node --test src/planning/today-workspace.test.ts src/planning/today-workspace-ui.test.ts src/planning/task-progress.test.ts src/planning/planning-curriculum.test.ts src/planning/task-scheduling.test.ts`  
Expected: PASS.

- [ ] **Step 7: Record a recoverable no-commit checkpoint**

Run: `git diff --check -- apps/student-web/src/pages/TodayPlanningPage.tsx apps/student-web/src/planning/TodayTaskWorkspace.tsx apps/student-web/src/planning/TodayTaskList.tsx apps/student-web/src/planning/TodayTaskDetail.tsx apps/student-web/src/planning/today-workspace-ui.test.ts`  
Expected: exit 0. Do not stage or commit.

### Task 4: Unified STUDY/GENERAL result UI and partial-failure recovery

**Files:**
- Create: `apps/student-web/src/planning/TaskResultFlow.tsx`
- Modify: `apps/student-web/src/planning/TodayTaskDetail.tsx`
- Modify: `apps/student-web/src/planning/TaskExecutionPanel.tsx:1-418`
- Modify: `apps/student-web/src/pages/TodayPlanningPage.tsx:539-733,924-1029,1210-1527`
- Modify: `apps/student-web/src/planning/task-execution.ts`
- Modify: `apps/student-web/src/planning/task-execution.test.ts`
- Modify: `apps/student-web/src/planning/today-workspace-ui.test.ts`

**Interfaces:**
- Consumes: `finishStudySessionSafely`, `saveTaskResult`, pending-edit guards, page-owned timer callbacks, `planningClient`, and existing Task reconciliation.
- Produces: `TaskResultFlowProps` with `task`, optional matching `activeSession`, recorded sessions, `onTaskChanged(task)`, and `onRequestClose()`.
- Produces: per-operation UI states for session, Curriculum items, solved tests, and Task outcome; no aggregate “all saved” success is emitted while any operation is failed/unsaved.
- `TaskExecutionPanel` becomes history/feedback-only and has no live start, pause, resume, or finish props.

- [ ] **Step 1: Extend failing UI contract tests for the unified flow**

```ts
test('result flow supports no-timer recording and keeps GENERAL simple', () => {
  assert.match(resultSource, /ثبت نتیجه بدون تایمر/)
  assert.match(resultSource, /task\.contentType === 'STUDY'/)
  assert.match(resultSource, /کار کاملاً انجام شد/)
  assert.match(resultSource, /بعداً ادامه می‌دهم/)
})

test('history panel no longer duplicates live execution actions', () => {
  assert.doesNotMatch(historySource, /onStart|onPause|onResume|onFinish/)
})
```

- [ ] **Step 2: Run and verify RED**

Run: `pnpm --filter student-web exec node --test src/planning/today-workspace-ui.test.ts src/planning/task-execution.test.ts`  
Expected: FAIL because the unified component is absent and `TaskExecutionPanel` still owns live controls.

- [ ] **Step 3: Implement the active-session result stage**

Show the matching running/paused timer and explicit explanation. Submit finish once through `finishStudySessionSafely`. On `FINISHED`, show the returned/reconciled duration and continue. On `ACTIVE_RETRYABLE`, offer retry. On `UNKNOWN`, offer authoritative recheck but no finish retry. Keep existing optional session note/focus/quality fields collapsed and labelled as session feedback.

- [ ] **Step 4: Implement progress and explicit outcome stages**

For STUDY, initialize Curriculum and solved-test drafts from the selected authoritative Task. Save through `saveTaskResult` and render per-operation saved/failed state plus targeted retry. Enable `کار کاملاً انجام شد` only under existing coverage and save-report rules. For GENERAL, omit timer/Curriculum/test/session-feedback UI and call the same safe completion reconciliation with no progress writes.

- [ ] **Step 5: Implement `بعداً ادامه می‌دهم` close protection**

If no edits remain, close and state that the Task remains open. If writes failed or local edits remain, list which data is saved and unsaved, then require explicit discard confirmation before closing. Cancelling confirmation returns to the result flow with drafts intact.

- [ ] **Step 6: Reduce `TaskExecutionPanel` to history and optional finished-session feedback**

Retain pagination, completed-duration totals, cancelled/active/finished labels, and the existing feedback endpoint. Remove local live-start/finish forms and duplicated timer controls. Keep nullable historical content types read-only.

- [ ] **Step 7: Verify focused GREEN**

Run: `pnpm --filter student-web exec node --test src/planning/task-result-flow.test.ts src/planning/task-execution.test.ts src/planning/today-workspace-ui.test.ts src/planning/task-progress.test.ts`  
Expected: PASS, including uncertain finish/completion, failed-item retry, stale solved-test draft, explicit completion, continue-later, GENERAL, and history-only cases.

- [ ] **Step 8: Record a recoverable no-commit checkpoint**

Run: `git diff --check -- apps/student-web/src/planning/TaskResultFlow.tsx apps/student-web/src/planning/TodayTaskDetail.tsx apps/student-web/src/planning/TaskExecutionPanel.tsx apps/student-web/src/pages/TodayPlanningPage.tsx apps/student-web/src/planning/task-execution.ts apps/student-web/src/planning/task-execution.test.ts apps/student-web/src/planning/today-workspace-ui.test.ts`  
Expected: exit 0. Do not stage or commit.

### Task 5: Responsive styling, focus management, and accessible status feedback

**Files:**
- Modify: `apps/student-web/src/App.css:132-239,308-336,389-395,470-493`
- Modify: `apps/student-web/src/planning/TodayTaskWorkspace.tsx`
- Modify: `apps/student-web/src/planning/TodayTaskList.tsx`
- Modify: `apps/student-web/src/planning/TodayTaskDetail.tsx`
- Modify: `apps/student-web/src/planning/TaskResultFlow.tsx`
- Modify: `apps/student-web/src/planning/today-workspace-ui.test.ts`

**Interfaces:**
- Consumes: `DetailNavigationState.returnFocusTaskId` from Task 2.
- Produces: refs keyed by Task ID, focusable detail heading, and labelled mobile Back control.
- Produces: `.today-workspace`, `.today-task-rail`, `.today-task-detail`, `.task-result-flow`, and mobile detail-mode selectors using existing theme tokens.

- [ ] **Step 1: Add failing accessibility and responsive source-contract tests**

```ts
test('mobile detail moves focus to its heading and Back restores the originating row', () => {
  assert.match(workspaceSource, /detailHeadingRef\.current\?\.focus\(\)/)
  assert.match(workspaceSource, /taskTriggerRefs\.current\.get\(returnFocusTaskId\)\?\.focus\(\)/)
  assert.match(detailSource, /aria-label="بازگشت به فهرست کارها"/)
})

test('workspace styles use one page scroll and a full-width mobile detail', () => {
  assert.match(styles, /\.today-workspace[^}]*grid-template-columns/)
  assert.match(styles, /@media[^]*\.today-task-detail[^}]*width:\s*100%/)
  assert.doesNotMatch(styles, /\.today-task-detail[^}]*overflow-y:\s*(auto|scroll)/)
})
```

- [ ] **Step 2: Run and verify RED**

Run: `pnpm --filter student-web exec node --test src/planning/today-workspace-ui.test.ts`  
Expected: FAIL on missing focus hooks and responsive selectors.

- [ ] **Step 3: Implement desktop and mobile layout styles**

Use a compact bounded Task rail plus flexible contextual detail on desktop, with no nested scrolling. At the existing mobile breakpoint, show either the list or one full-width detail surface. Keep actions at least the existing accessible control height, prevent horizontal overflow, wrap Persian text, and preserve right-sidebar/right-drawer behavior.

- [ ] **Step 4: Implement focus and status semantics**

On detail open, focus a `tabIndex={-1}` heading after render. On Back, restore the exact originating summary button when it still exists; otherwise focus the Task-list heading. Use `role="status"` for successful saved-operation feedback and `role="alert"` for failures. Keep confirmation focus inside the visible result section and restore it on cancel.

- [ ] **Step 5: Implement theme and motion parity**

Use existing CSS variables for blue/violet/cyan accents, surfaces, borders, focus rings, status colors, and dark mode. Under `prefers-reduced-motion`, remove workspace/detail transitions. Do not add fixed glows, oversized cards, or a mobile bottom navigation.

- [ ] **Step 6: Verify focused tests, lint, and build**

Run: `pnpm --filter student-web exec node --test src/planning/today-workspace-ui.test.ts src/planning/today-workspace.test.ts src/planning/task-result-flow.test.ts`  
Expected: PASS.

Run: `pnpm --filter student-web lint`  
Expected: exit 0 with no lint errors.

Run: `pnpm --filter student-web build`  
Expected: exit 0 with TypeScript and Vite build success.

- [ ] **Step 7: Record a recoverable no-commit checkpoint**

Run: `git diff --check -- apps/student-web/src/App.css apps/student-web/src/planning apps/student-web/src/pages/TodayPlanningPage.tsx apps/student-web/package.json`  
Expected: exit 0. Do not stage or commit.

### Task 6: Contract regression verification and real-browser review

**Files:**
- Modify only if verification exposes an in-scope defect: Student files listed above and their focused tests.
- Do not modify API, database, Counselor, shared packages, canonical docs, or migrations.

**Interfaces:**
- Consumes: the completed Student implementation and existing API contract tests.
- Produces: fresh command evidence, browser screenshots where the existing local runtime/data permit them, exact remaining differences, and final `git status --short`.

- [ ] **Step 1: Run the complete Student unit suite once**

Run: `pnpm --filter student-web test`  
Expected: all Student tests pass, including the three new files. Report every failure by name before changing code.

- [ ] **Step 2: Run focused existing API contract tests without changing API code**

Run: `pnpm --filter api exec tsx --test test/task-curriculum-lifecycle.test.ts test/student-core-service.test.ts test/study-tracking-service.test.ts test/study-tracking-duration.test.ts`  
Expected: exit 0; existing Curriculum outcome, solved-progress, active-session terminal blocking, finish/pause/resume, and duration contracts pass.

- [ ] **Step 3: Re-run Student static verification after any fix**

Run: `pnpm --filter student-web lint`  
Expected: exit 0.

Run: `pnpm --filter student-web build`  
Expected: exit 0.

- [ ] **Step 4: Inspect the real browser without seeding or resetting data**

Use the existing local Student runtime and accounts only if available. Capture desktop `1440×900` and mobile `390×844` evidence in Light and Dark themes for:

- STUDY and GENERAL;
- timed and date-only/target-based Tasks;
- running and paused sessions plus refresh recovery;
- result recording without an active session;
- partial saves, explicit completion, ambiguous-error recovery, and unsaved-edit confirmation;
- overdue continuation;
- completed, skipped, and historical `PARTIAL` presentation;
- Persian wrapping, keyboard focus, mobile Back, and absence of horizontal overflow.

If local authentication/data cannot represent a case without forbidden seeding or database mutation, record that exact limitation instead of fabricating a screenshot or claiming visual coverage.

- [ ] **Step 5: Verify repository safety and scope**

Run: `git diff --check`  
Expected: exit 0.

Run: `git diff --name-only`  
Expected: pre-existing Counselor/shared/doc/lockfile paths plus only the authorized Student files and this Student plan/spec; no API, Prisma schema, or migration changes from this milestone.

Run: `git status --short`  
Expected: preserve and report every pre-existing WIP entry plus the new Student files exactly. Do not stage or commit.

- [ ] **Step 6: Produce the milestone closeout and stop**

End with: changed files; database and migrations (`NONE`); API changes (`NONE`); UI changes; tests and validation; screenshots or their exact limitation; remaining visual differences; API limitations; remaining issues and Decision Gates (`NONE` unless newly discovered); WIP safety; and exact `git status --short`. Explicitly state that Product Owner Visual PASS remains pending.
