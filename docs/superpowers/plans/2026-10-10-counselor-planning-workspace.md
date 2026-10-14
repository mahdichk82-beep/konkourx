# Counselor Planning Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the real Counselor planning workspace and one same-Student task composer over existing APIs and domain contracts.

**Architecture:** A shared route-level workspace loads authorized Students and ranged Tasks, then composes pure timeline layout helpers, a read-only timeline, a compact task rail, and an atomic batch-backed composer. Both global and Student-context routes render the same component; all persistence remains in existing clients and endpoints.

**Tech Stack:** React 19, TypeScript, Vite, Node test runner, existing Fastify REST clients, existing theme and Curriculum packages.

**Spec:** `docs/superpowers/specs/2026-10-10-counselor-planning-workspace-design.md`

## Global Constraints

- No database schema, migration, backend authorization, API validation, or transaction-semantics changes.
- No Student Today redesign, cross-Student planning, drag/drop, timeline cell creation, analytics, or fabricated data.
- VOLUMETRIC never receives clock times; its planned duration remains optional and distinct from actual recorded minutes.
- TIMED start/end remain paired, same-day, and 15-minute aligned.
- Use the existing atomic same-Student batch endpoint for one or many new tasks; preserve the single endpoint.
- Reuse the official tri-state Curriculum Picker for STUDY; GENERAL exposes no Curriculum or planned-test controls.
- Preserve Persian RTL, right-side navigation, responsive Light/Dark parity, accessibility, and existing theme tokens.
- Do not commit automatically.

## Review Focus

- An assigned Student list spanning multiple cursor pages must remain fully selectable without looping on a repeated cursor.
- A TIMED task ending at `24:00` must position correctly; a duration crossing midnight must be rejected before submission.
- Overlapping and nested intervals must receive readable deterministic lanes without becoming invalid or blocked.
- A failed batch request must preserve every row and re-enable submission without showing success.
- VOLUMETRIC rows with blank duration must submit zero/default planned minutes and null start/end values.

---

### Task 1: Pure timeline and composer contracts

**Files:**
- Create: `apps/counselor-web/src/planning/planning-timeline.ts`
- Create: `apps/counselor-web/src/planning/planning-timeline.test.ts`
- Create: `apps/counselor-web/src/planning/task-composer.ts`
- Create: `apps/counselor-web/src/planning/task-composer.test.ts`
- Modify: `apps/counselor-web/package.json`

**Interfaces:**
- Produces: `layoutTimedTasks(tasks)`, `groupTasksByDate(tasks)`, `timelineHeight(expanded)`, `createComposerTask(id, date)`, `validateComposerTasks(tasks)`, `toBatchInputs(tasks)`, and TIMED end-time derivation.

- [ ] Write failing tests for exact top/height positioning, `24:00`, deterministic overlap lanes, VOLUMETRIC exclusion, optional duration, STUDY/GENERAL conditional payloads, presets, and cross-midnight rejection.
- [ ] Run the two new test files and confirm expected failures.
- [ ] Implement the minimal pure types and helpers.
- [ ] Add both test files to the Counselor test script and rerun them green.

### Task 2: Authorized planner data and shared routing

**Files:**
- Create: `apps/counselor-web/src/planning/planning-data.ts`
- Create: `apps/counselor-web/src/planning/planning-data.test.ts`
- Modify: `apps/counselor-web/src/App.tsx`
- Modify: `apps/counselor-web/src/pages/PlanningShellPage.tsx`
- Modify: `apps/counselor-web/src/students/StudentDetailPage.tsx`
- Modify: `apps/counselor-web/package.json`

**Interfaces:**
- Consumes: existing `studentsClient.list` and `studentTasksClient.listTasks`.
- Produces: guarded `loadAllStudents(fetchPage)` and `loadPlanningTasks(fetchPage, range)`, plus both approved route mappings into one workspace.

- [ ] Write failing tests for multi-page aggregation, duplicate cursor termination, and duplicate Task suppression.
- [ ] Run the planning-data test and confirm expected failures.
- [ ] Implement data helpers and route `/planning` plus `/students/:studentId/planning` to the same page component.
- [ ] Add the Student Workspace planning entry and remove separate creation forms from its overview while retaining existing evidence/edit controls.
- [ ] Run the focused tests green.

### Task 3: Read-only timeline and task rail

**Files:**
- Create: `apps/counselor-web/src/planning/PlanningTimeline.tsx`
- Create: `apps/counselor-web/src/planning/PlanningTaskRail.tsx`
- Create: `apps/counselor-web/src/planning/planning-ui-contract.test.ts`
- Modify: `apps/counselor-web/package.json`

**Interfaces:**
- Consumes: `layoutTimedTasks`, grouped real `CounselorVisibleTask` values, selected day/week, and `navigate`.
- Produces: accessible day/week timeline, density toggle, VOLUMETRIC area, status filters, evidence labels, and Student Workspace edit/detail links.

- [ ] Write a failing source/markup contract test for read-only semantics, density control, Persian labels, non-color status text, task evidence, and absence of drag/drop handlers.
- [ ] Run it and confirm expected failures.
- [ ] Implement the timeline and task rail using real Task fields and existing presentation helpers.
- [ ] Run timeline and UI contract tests green.

### Task 4: Unified task composer

**Files:**
- Create: `apps/counselor-web/src/planning/UnifiedTaskComposer.tsx`
- Modify: `apps/counselor-web/src/students/student-tasks-client.ts`
- Modify: `apps/counselor-web/src/pages/PlanningShellPage.tsx`

**Interfaces:**
- Consumes: Task 1 composer helpers, `PlanningCurriculumField`, selected Student, and `studentTasksClient.createBatch`.
- Produces: one-to-fifty independent same-Student drafts, review state, duplicate-submit protection, safe feedback, and refresh callback.

- [ ] Extend failing composer tests for draft preservation on failed submission and reset-after-success behavior through a pure submission helper.
- [ ] Run the composer test and confirm expected failures.
- [ ] Implement the component with conditional STUDY/GENERAL and VOLUMETRIC/TIMED controls, presets, review, and one atomic request.
- [ ] Integrate it into the shared page and rerun composer tests green.

### Task 5: Reference-aligned responsive presentation

**Files:**
- Create: `apps/counselor-web/src/planning/planning-workspace.css`
- Modify: `apps/counselor-web/src/pages/PlanningShellPage.tsx`
- Modify: `apps/counselor-web/src/App.tsx`

**Interfaces:**
- Consumes: shared theme tokens and all planning components.
- Produces: reference-aligned desktop calendar/task-rail proportions, compact cards and controls, mobile selected-day stacking, modal/full-width composer, and Light/Dark parity.

- [ ] Implement desktop geometry and restrained blue/violet/cyan task treatments without static data or image backgrounds.
- [ ] Implement tablet/mobile breakpoints with no page-level horizontal overflow.
- [ ] Verify focus visibility, dialog semantics, touch targets, RTL ordering, and reduced-motion compatibility.
- [ ] Run Counselor lint and build; resolve only milestone-related findings.

### Task 6: Documentation and targeted closeout

**Files:**
- Modify: `docs/PROJECT_STATE.md`
- Modify: `docs/ROADMAP.md`

**Interfaces:**
- Consumes: verified implementation and test evidence.
- Produces: explicit `CURRENT IMPLEMENTED STATE`, preserved future state, authorized Roadmap discrepancy note, and exact milestone limitations.

- [ ] Update documentation without claiming Product Owner Visual PASS or closing unrelated Roadmap work.
- [ ] Run affected Counselor tests, Counselor lint/build, and relevant shared-package tests only where imports changed.
- [ ] Run `git diff --check` and capture exact `git status --short`.
- [ ] When the authenticated local stack is feasible, capture desktop/mobile Light/Dark and composer screenshots; otherwise report the concrete environment blocker.
