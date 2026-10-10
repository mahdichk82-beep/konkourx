# Planning UX and Actual Test Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add concurrency-safe cumulative solved-test progress and complete the approved compact, overdue-capable planning UX.

**Architecture:** Extend `DailyTask` with one additive scalar and expose a Student-only conditional progress mutation plus a paginated overdue query. Preserve the existing independent Task, Curriculum, StudySession, and Assessment lifecycles while integrating the field into Student/Counselor read views and replacing Today with a state-preserving controlled accordion.

**Tech Stack:** TypeScript, Fastify, Zod, Prisma/PostgreSQL, React 19, CSS, Node test runner, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-09-planning-ux-test-progress-design.md`

## Global Constraints

- Start from `d70434a38d4df7a46beed4dcdb970838a0b1d136` in an isolated worktree.
- Use only an additive migration; never execute a destructive database operation or rewrite migration history.
- Treat `actualSolvedTestCount` as a cumulative total and keep it independent of every other execution/outcome domain.
- Preserve historical `PARTIAL`, nullable content types, terminal records, Jalali display, and existing time validation.
- Do not implement automatic missed-task persistence or transfer remaining work.
- Keep the original dirty checkout untouched and produce one final commit named `feat: improve planning UX and test progress`.

## Review Focus

- Two tabs submit different cumulative totals from the same Task version: one succeeds and one receives a stale conflict.
- A Student records progress on a Counselor-assigned Task without gaining any Counselor-content mutation authority.
- A terminal, GENERAL, nullable historical, foreign, negative, or fractional update is rejected without changing stored progress.
- Overdue retrieval returns only pending Tasks strictly before Today through bounded pagination and never includes future/today/terminal Tasks.
- Collapsing/switching cards preserves unsaved input and leaves the global active timer operational.

---

### Task 1: Backend persistence and Student progress mutation

**Files:**
- Modify: `database/prisma/schema.prisma`
- Create: `database/prisma/migrations/20261009230000_add_daily_task_actual_solved_test_count/migration.sql`
- Modify: `apps/api/src/student-core/{types,store,services,prisma-store}.ts`
- Modify: `apps/api/src/schemas/student-core.ts`
- Modify: `apps/api/src/routes/student-core.ts`
- Modify: `apps/api/src/counselor-tasks/{types,services,prisma-store}.ts`
- Test: `apps/api/test/student-core-service.test.ts`
- Test: `apps/api/test/student-core-routes.test.ts`
- Test: `apps/api/test/student-core-prisma-store.test.ts`

**Interfaces:**
- Produces: `tasks.recordProgress(actor, id, { actualSolvedTestCount, expectedUpdatedAt })` and `PATCH /student/daily-tasks/:id/progress`.
- Produces: `DailyTaskView.actualSolvedTestCount: number` in Student and Counselor reads.

- [ ] Write focused failing service, route, and store tests for cumulative replacement, correction, authorization, terminal/type rejection, and stale conditional updates.
- [ ] Run each focused test and confirm failure is caused by the missing progress contract.
- [ ] Add the schema field/migration, domain/store contract, conditional Prisma mutation, service errors, Zod payload, and route.
- [ ] Generate the committed Prisma client and rerun focused API tests to green.

### Task 2: Paginated overdue Task retrieval

**Files:**
- Modify: `apps/api/src/student-core/{types,store,services,prisma-store}.ts`
- Modify: `apps/api/src/schemas/student-core.ts`
- Test: `apps/api/test/student-core-service.test.ts`
- Test: `apps/api/test/student-core-routes.test.ts`
- Test: `apps/api/test/student-core-prisma-store.test.ts`

**Interfaces:**
- Produces: `GET /student/daily-tasks?overdueBefore=YYYY-MM-DD&limit=N&cursor=...`, selecting only `PENDING` rows with `scheduledFor < overdueBefore`.
- Consumes: existing Task pagination and composite status/date index.

- [ ] Write failing tests for exclusive filter validation, strict date boundary, forced pending status, and cursor/limit propagation.
- [ ] Run focused tests and confirm the missing contract failure.
- [ ] Implement the minimal query/schema/service/store extension and rerun focused tests to green.

### Task 3: Exclusive scheduling controls

**Files:**
- Modify: `apps/student-web/src/planning/{task-scheduling.ts,TaskScheduleFields.tsx}`
- Modify: `apps/counselor-web/src/students/{task-scheduling.ts,TaskScheduleFields.tsx}`
- Test: `apps/student-web/src/planning/task-scheduling.test.ts`
- Test: `apps/counselor-web/src/students/task-scheduling.test.ts`

**Interfaces:**
- Produces: `TaskScheduleDraft.mode: 'VOLUMETRIC' | 'TIMED'` with preserved unsaved times.
- Consumes: unchanged `{ startMinuteOfDay, endMinuteOfDay }` API payloads.

- [ ] Change helper tests first to require explicit modes, null volumetric serialization, timed validation, and retained drafts; confirm red.
- [ ] Implement helpers and accessible radio controls in both apps; rerun focused tests to green.

### Task 4: Student progress, overdue group, and compact Today accordion

**Files:**
- Create: `apps/student-web/src/planning/task-progress.ts`
- Create: `apps/student-web/src/planning/task-progress.test.ts`
- Modify: `apps/student-web/src/planning/planning-client.ts`
- Modify: `apps/student-web/src/planning/TaskExecutionPanel.tsx`
- Modify: `apps/student-web/src/pages/TodayPlanningPage.tsx`
- Modify: relevant Student planning CSS
- Modify: `apps/student-web/package.json`

**Interfaces:**
- Consumes: Task progress endpoint and paginated `overdueBefore` list mode.
- Produces: cumulative progress draft preparation and one-open accordion behavior without unmounting details.

- [ ] Write failing helper/client-contract tests for valid cumulative totals, stale reconciliation inputs, bounded overdue pagination, and STUDY-only recording capability; confirm red.
- [ ] Implement client types/methods and bounded overdue state/loading.
- [ ] Implement the mounted, inert controlled accordion, progress form, overdue group, STUDY-only session controls, and summary metadata.
- [ ] Add 250ms responsive RTL styles and reduced-motion override; rerun Student tests/build.

### Task 5: Student history and Counselor read integration

**Files:**
- Modify: `apps/student-web/src/pages/WeeklyPlanningPage.tsx`
- Modify: `apps/counselor-web/src/students/student-tasks-client.ts`
- Modify: `apps/counselor-web/src/students/StudentTaskList.tsx`
- Modify: `apps/counselor-web/src/students/StudentWeeklyPlanning.tsx`
- Test: focused existing Student/Counselor task-view tests where behavior can be exercised without source-text assertions.

**Interfaces:**
- Consumes: `actualSolvedTestCount` from authorized read responses.
- Produces: separately labeled actual versus planned totals; no Counselor mutation.

- [ ] Add failing pure presentation/helper assertions if an existing behavioral seam exists; otherwise rely on typed integration builds and record the limitation.
- [ ] Render the actual count in Student weekly/history and authorized Counselor task/weekly views.
- [ ] Run focused Student/Counselor tests and builds.

### Task 6: Verification, targeted review, and single commit

**Files:**
- Modify: only files required by Tasks 1–5 and these approved design/plan documents.

**Interfaces:**
- Consumes: all prior task contracts.
- Produces: verified isolated commit.

- [ ] Run one relevant final validation pass covering API tests/typecheck, Student tests/build/lint, Counselor tests/build/lint, and Prisma validation.
- [ ] Produce a whole-branch review package and request one targeted fresh review against the approved spec.
- [ ] Fix Critical/Important findings with RED→GREEN tests, then rerun the affected validation once.
- [ ] Confirm original checkout status is unchanged and isolated worktree diff contains no unrelated files.
- [ ] Commit once with `feat: improve planning UX and test progress` and record exact final `git status --short`.
