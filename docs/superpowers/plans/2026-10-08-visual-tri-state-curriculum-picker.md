# Visual Tri-State Curriculum Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current v1 Planning Picker with one accessible visual tri-state Picker that drives the completed synchronous selection engine and writes the existing versioned v2 Curriculum contract in every authorized Student and one-Student Counselor STUDY Task flow.

**Architecture:** Keep `selection-engine.ts` unchanged as the pure synchronous authority for selection semantics. Add a shared adapter that converts authoritative Curriculum DTOs into registered facts and coordinates asynchronous `STRUCTURE_REQUIRED` loading outside the engine, then place a dedicated Picker component inside `PlanningCurriculumField`; the independent `/curriculum` Browser continues unchanged until its later browse-only cleanup milestone. Planning forms own only committed v2 selector expressions plus display summaries, while each modal opening owns an isolated draft engine session that is discarded on cancel and published only after successful serialization.

**Tech Stack:** TypeScript 6, React 19, native HTML dialog semantics implemented by the existing portal-free modal pattern, Node test runner, Vite, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-10-07-planning-curriculum-interaction-design.md`

**Baseline:** `0b9c6c7e08136ea1655c70beafd33dd77308ee77`

## Global Constraints

- Scope is the shared visual Picker, its state adapter, and its integration into Student create/permitted-edit plus Counselor single-create, one-Student batch-create, and permitted-edit flows.
- Do not change `selection-engine.ts` semantics unless a failing integration test proves a genuine engine defect and the architect approves reopening that completed milestone.
- Do not modify backend routes, schemas, Prisma, migrations, generated clients, Curriculum artifacts/content, `/curriculum` behavior, `/study` navigation, Today/Weekly presentation, 24x4, Profile, Assessments, or cross-Student assignment.
- New STUDY selections use only `curriculumSelection: { version: 2, selectors }`; never mix it with `curriculumTargets` in one request.
- Historical `WHOLE` retains direct-child meaning. Historical `WHOLE` and `PLACEMENT` are never auto-converted, re-resolved, or carried into a v2 replacement.
- A stored `SUBTREE` or compatible `EXACT` selector restores into the v2 Picker from snapshots; an unchanged edit never calls the replacement endpoint.
- The engine remains synchronous and framework-independent. React and clients implement Register Facts -> Mutate -> Retry around it.
- Selecting a known non-terminal node as `SUBTREE` must not load descendants. Missing pages are loaded only when the engine returns `STRUCTURE_REQUIRED` for a query, decomposition, group operation, or serialization.
- Every failed mutation is selection-atomic. Fact knowledge may advance, but the last valid selector expression remains unchanged.
- `SELECTOR_LIMIT_EXCEEDED` is shown in clear Persian with `limit`, `rawCount`, and `normalizedCount` available for diagnostics; selectors are never truncated.
- No user-facing `EXACT`, `WHOLE`, `SUBTREE`, `دامنه`, `دقیق`, `با زیرمبحث`, or `فرزندان مستقیم` appears in the new Picker.
- The footer reports selector choices (for example, `۳ انتخاب`), never a count of terminal topics that the client has not authoritatively resolved.
- Preserve current Task provenance, lifecycle/finalization, execution/history/assessment locks, source ownership, and server-authoritative Student track validation.
- Preserve every unrelated dirty or untracked file. In particular, do not edit the already-dirty Counselor shell files or `apps/counselor-web/src/students/StudentsPage.tsx`.
- Do not claim Product Owner Visual PASS as part of technical completion; record the visual review as pending until the Product Owner grants it.

## Review Focus

1. A late response from a previous modal generation, Student, client, or authoritative track must be discarded and must not alter the current draft; Task 2 adds this test.
2. Deselecting below a selected subtree with missing pages must fetch exactly the requested structure, retry only after facts advance, preserve every unaffected selector, and remain atomic on fetch failure; Task 2 adds this test.
3. Missing/null track or removed current nodes must not hide saved `WHOLE`, `PLACEMENT`, `EXACT`, or `SUBTREE` snapshots, and unchanged history must not call replacement; Tasks 1, 4, and 5 add these tests.
4. Raw or normalized selector count 51 must show the limit error while preserving the prior 50-or-fewer selection; Tasks 2 and 3 add these tests.
5. Unknown checkbox completeness, Cancel/Escape, and modal reopen must never masquerade as unchecked state or publish an abandoned draft; Task 3 adds these tests.

---

## Scope and File Map

### Create

- `packages/curriculum-browser/src/selection-adapter.ts` — DTO-to-fact conversion, requirement loading, generation guards, and finite retry orchestration around the existing engine.
- `packages/curriculum-browser/src/selection-adapter.test.ts` — adapter mapping, pagination, stale-response, retry, limit, and atomicity tests.
- `packages/curriculum-browser/src/useTriStateCurriculumPicker.ts` — React ownership of one modal draft session and async request state.
- `packages/curriculum-browser/src/TriStateCurriculumPicker.tsx` — dedicated search/subject/tree Picker presentation; it must not import legacy selection helpers from `state.ts`.
- `packages/curriculum-browser/src/tri-state-picker-contract.test.ts` — source-contract checks for engine use, checkbox semantics, dialog behavior, forbidden copy, and responsive/theme styling hooks.

### Modify

- `packages/curriculum-browser/src/types.ts` — allow explicit child-page limits while preserving existing client calls.
- `packages/curriculum-browser/src/client.ts` — forward requested page ranges to the existing children endpoint; no endpoint changes.
- `packages/curriculum-browser/src/planning.ts` — snapshot-safe Planning value, legacy/v2 classification, unchanged comparison, and v2 replacement helper.
- `packages/curriculum-browser/src/planning.test.ts` — legacy preservation, v2 restore, explicit replacement, and unchanged-write tests.
- `packages/curriculum-browser/src/PlanningCurriculumField.tsx` — committed summary plus isolated Picker modal; remove its dependency on `CurriculumBrowser` Picker mode.
- `packages/curriculum-browser/src/planning-field-contract.test.ts` — new modal/draft/legacy replacement contract.
- `packages/curriculum-browser/src/styles.css` — scoped compact modal, subject navigation, tree, status, footer, light/dark token, and responsive rules.
- `packages/curriculum-browser/src/index.ts` — export the new Planning and Picker contracts.
- `packages/curriculum-browser/package.json` — add the two new test files to the existing test command only; no dependencies.
- `apps/student-web/src/planning/planning-client.ts` — v2 create and replacement request bodies.
- `apps/student-web/src/planning/task-content.ts` — prepare v2 STUDY content and omit Curriculum writes for GENERAL.
- `apps/student-web/src/planning/task-content.test.ts` — v2/GENERAL validation tests.
- `apps/student-web/src/planning/planning-curriculum.test.ts` — Student route, payload, ownership, and no-v1-write contracts.
- `apps/student-web/src/pages/TodayPlanningPage.tsx` — new Planning value in create/permitted-edit paths while preserving all current lifecycle behavior.
- `apps/counselor-web/src/students/student-tasks-client.ts` — v2 single/batch/replacement request bodies.
- `apps/counselor-web/src/students/StudentTaskForm.tsx` — v2 single-Student create integration.
- `apps/counselor-web/src/students/batch-task-form.ts` — per-row v2 value and validation for one Student.
- `apps/counselor-web/src/students/batch-task-form.test.ts` — v2 batch payload and GENERAL omission tests.
- `apps/counselor-web/src/students/StudentBatchTaskForm.tsx` — isolated v2 Picker draft per row.
- `apps/counselor-web/src/students/StudentTaskList.tsx` — v2 permitted-edit integration without changing locks.
- `apps/counselor-web/src/students/planning-curriculum.test.ts` — single/batch/edit v2 route and selected-Student boundary tests.
- `apps/counselor-web/src/students/task-error-messages.ts` — Persian messages for existing v2 server rejection codes.
- `apps/counselor-web/src/students/task-error-messages.test.ts` — safe-message coverage.

### Explicitly Do Not Modify

- `packages/curriculum-browser/src/CurriculumBrowser.tsx`, `state.ts`, and their browse-page behavior.
- Any `apps/api/**`, `prisma/**`, migration, generated Prisma, canonical Curriculum artifact, package lock, or root package file.
- Existing dirty shell/profile/assessment/subject files and user assets.

---

### Task 1: Define the snapshot-safe Planning v2 value and edit boundary

**Files:**
- Modify: `packages/curriculum-browser/src/planning.ts`
- Modify: `packages/curriculum-browser/src/planning.test.ts`
- Modify: `packages/curriculum-browser/src/index.ts`

**Interfaces:**
- Produces: `PlanningCurriculumValue`, `PlanningCurriculumSelectorSummary`, `createEmptyPlanningCurriculumValue()`, `planningCurriculumValueFromSnapshots()`, `canReplacePlanningCurriculum()`, and `replaceChangedPlanningCurriculum()`.
- Consumes: `CurriculumSelectionV2`, `PlanningCurriculumTargetSnapshot`, and the existing `PlanningCurriculumEditContext`.
- `PlanningCurriculumValue` is exactly one of:
  - `{ kind: 'V2'; selection: CurriculumSelectionV2; summaries: readonly PlanningCurriculumSelectorSummary[] }`
  - `{ kind: 'PRESERVED_HISTORICAL'; snapshots: readonly PlanningCurriculumTargetSnapshot[] }`
- A summary carries `rootKind`, `rootId`, visible `label`, `path`, and optional `representationIdSnapshot`; it is display/entry-hint metadata, never selection truth.

- [ ] **Step 1: Write failing Planning tests**

Add named tests proving:

- `EXACT`-only and `EXACT` + `SUBTREE` stored NODE snapshots restore as the same ordered v2 selectors and snapshot summaries.
- Any `WHOLE` or `PLACEMENT` in the set preserves the complete set as `PRESERVED_HISTORICAL`; it does not produce a partial v2 expression.
- An empty create value is `{ version: 2, selectors: [] }`.
- Stored labels and paths remain visible without any Curriculum API call.
- Compatible unchanged `EXACT`/`SUBTREE` returns `UNCHANGED` and performs zero replacement calls.
- Transition from `PRESERVED_HISTORICAL` to a non-empty explicit v2 value calls replacement once when lifecycle rules allow it, and cancel/no transition calls zero times.
- Locked, wrong-source, GENERAL/null-content, executed/history/assessment cases remain `READ_ONLY`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
pnpm --filter @konkourx/curriculum-browser exec node --test src/planning.test.ts
```

Expected: FAIL because the new Planning value and replacement helpers do not exist.

- [ ] **Step 3: Implement the minimal Planning contracts**

Implement the interfaces above. Freeze/copy arrays as the existing module does. Compare original persisted targets in `position` order with serialized v2 selectors; a byte-semantic match is unchanged. Never derive v2 selectors from `WHOLE` or `PLACEMENT`. Allow a legacy set to be replaced only when the field explicitly returns a new non-empty `V2` value and `canReplacePlanningCurriculum(context)` passes.

Do not retain `TriStateSelectionState` in form/page state: engine facts belong to one modal session and must not leak between Students or catalog sessions.

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```powershell
pnpm --filter @konkourx/curriculum-browser exec node --test src/planning.test.ts
pnpm --filter @konkourx/curriculum-browser typecheck
```

Expected: PASS.

- [ ] **Step 5: Review checkpoint; do not commit yet**

Confirm this task changes only shared Planning types/helpers/tests and exports. Preserve the work unstaged until the whole milestone passes.

---

### Task 2: Build the authoritative fact adapter and finite retry coordinator

**Files:**
- Create: `packages/curriculum-browser/src/selection-adapter.ts`
- Create: `packages/curriculum-browser/src/selection-adapter.test.ts`
- Modify: `packages/curriculum-browser/src/types.ts`
- Modify: `packages/curriculum-browser/src/client.ts`
- Modify: `packages/curriculum-browser/src/index.ts`
- Modify: `packages/curriculum-browser/package.json`

**Interfaces:**
- Consumes: the existing `createTriStateSelectionState`, `registerTriStateSelectionFacts`, query/mutation/serialization functions, typed requirements, and `CurriculumBrowserClient`.
- Produces:
  - `nodeViewToSelectionFact(view: CurriculumCatalogNodeView): CurriculumSelectionNodeFact`
  - `childPageToSelectionFact(parentId: string, page: CurriculumPage<CurriculumCatalogNodeView>): CurriculumSelectionChildPageFact`
  - `rootItemsToSelectionGroupFacts(items: readonly CurriculumCatalogRootItem[]): readonly CurriculumSelectionGroupFact[]`
  - `loadSelectionRequirements(...)` for `NODE_FACT`, `SELECTOR_ANCESTRY`, `GROUP_FACT`, and every requested `CHILD_PAGE` range.
  - `runSelectionOperationWithRetry(...)`, returning `UPDATED`, `SERIALIZED`, `SELECTOR_LIMIT_EXCEEDED`, `STALE`, or a typed adapter failure without ever publishing a partially mutated selection.
- Modify `listChildren(entryId, nodeId, offset?, limit?)`; default remains 100.

- [ ] **Step 1: Write failing adapter and client tests**

Cover all of the following:

- Node ancestry is derived only from backend breadcrumb NODE segments. The current node is removed from `ancestorIds`, and its in-entry parent is the last remaining NODE segment or `null`; raw parents outside the entry are never invented into the Picker tree.
- Child pages preserve API `offset`, `total`, source order, and gaps. Two out-of-order pages become complete only after all positions are registered.
- Ordered GROUP root items become GROUP facts using their authoritative root-list order; wrapper IDs are never rewritten as NODE IDs.
- Selecting a loaded non-terminal parent returns `SUBTREE` without any `listChildren` call.
- Partial deselection loads every engine-requested page range, registers the returned facts, and retries the original mutation. Every unaffected selection remains present.
- A failed page request leaves selection unchanged and exposes a retryable adapter error.
- Repeated `retryToken` without a higher `factsVersion`, an empty/no-progress page, or the same unmet requirement terminates with a controlled error instead of looping.
- A generation/client/Student/track change while requests are in flight returns `STALE` and registers nothing into the current session.
- Track mismatch or `FACT_CONFLICT` invalidates the draft session; it is never merged.
- 51 raw roots and a group that normalizes to 51 roots return the existing typed limit result and preserve the prior state.
- `client.listChildren(..., offset, limit)` forwards both values and caps/chunks only according to the existing endpoint maximum of 100.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
pnpm --filter @konkourx/curriculum-browser exec node --test src/selection-adapter.test.ts
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement DTO-to-fact conversion and requirement loading**

Keep all HTTP calls outside `selection-engine.ts`. Maintain an entry hint for every visible/search/restored node so the adapter can call the existing entry-bound `getNode` and `listChildren` routes. For restored snapshots, first match `representationIdSnapshot` to the loaded catalog entry; if it no longer resolves, retain the snapshot and return a controlled read-only/unavailable state rather than probing arbitrary semantics.

For each `CHILD_PAGE` requirement, request all missing ranges in chunks of at most 100, reject a page that does not advance the requested offset, and register the API's total rather than assuming a requested range completed the subtree.

- [ ] **Step 4: Implement bounded Register Facts -> Mutate -> Retry**

The coordinator must:

1. run the synchronous engine operation;
2. return immediately on `UPDATED`, `SERIALIZED`, or `SELECTOR_LIMIT_EXCEEDED`;
3. load exactly the `STRUCTURE_REQUIRED.requirements` under the captured generation;
4. register facts atomically;
5. retry only when `factsVersion` advances; and
6. terminate on stale generation, repeated token/no progress, authority mismatch, fact conflict, or request failure.

Because the existing engine authority type requires `catalogRevision` but the read API does not expose the server artifact identity, use a clearly local, fresh modal-session epoch in that field solely as a fact-isolation token; never label it or treat it as the server revision, and never cache facts across modal openings. The first authoritative node response supplies `trackId`; every later node must match it.

- [ ] **Step 5: Run adapter, engine, full shared tests, and typecheck**

Run:

```powershell
pnpm --filter @konkourx/curriculum-browser exec node --test src/selection-adapter.test.ts src/selection-engine.test.ts
pnpm --filter @konkourx/curriculum-browser test
pnpm --filter @konkourx/curriculum-browser typecheck
```

Expected: PASS, including all existing engine tests unchanged.

- [ ] **Step 6: Review checkpoint; do not commit yet**

Verify there is no React, DOM, API-client-specific import, or asynchronous loader inside `selection-engine.ts` and no backend file changed.

---

### Task 3: Build the accessible compact Picker and modal draft flow

**Files:**
- Create: `packages/curriculum-browser/src/useTriStateCurriculumPicker.ts`
- Create: `packages/curriculum-browser/src/TriStateCurriculumPicker.tsx`
- Create: `packages/curriculum-browser/src/tri-state-picker-contract.test.ts`
- Modify: `packages/curriculum-browser/src/PlanningCurriculumField.tsx`
- Modify: `packages/curriculum-browser/src/planning-field-contract.test.ts`
- Modify: `packages/curriculum-browser/src/styles.css`
- Modify: `packages/curriculum-browser/src/index.ts`
- Modify: `packages/curriculum-browser/package.json`

**Interfaces:**
- `TriStateCurriculumPickerProps` consumes `audience`, `client`, `contextLabel`, `initialValue: Extract<PlanningCurriculumValue, { kind: 'V2' }>`, `onCancel()`, and `onConfirm(value)`.
- `useTriStateCurriculumPicker` owns catalog/tree/search view state, the current engine draft, loaded facts/views, busy/error state, request generation, and the one pending retryable operation.
- `PlanningCurriculumField` continues to own the outer summary, disabled reason, focus restoration, and modal open/close; it publishes only confirmed `PlanningCurriculumValue`.

- [ ] **Step 1: Write failing component contract tests**

Assert that the new Picker:

- imports and uses the adapter/engine query and mutation path and does not import `toggleCheckboxSelection`, `toggleSelection`, or `updateSelectionMode`;
- renders native checkboxes with a ref-driven `indeterminate` property, visible labels, and an unknown/loading presentation that is not unchecked;
- uses semantic expand buttons with `aria-expanded`, labels, `aria-live` status/error output, and `aria-busy` during structure resolution;
- renders GROUP wrappers as optional tri-state bulk controls but sends them only through engine group operations;
- uses one shared engine draft for tree and search results;
- contains no forbidden selector terminology;
- reports `selection.selectors.length` as choices, not `totalItemCount`, `nodeCount`, or inferred terminal topics;
- has Confirm and Cancel, focus trap/restoration, Escape cancellation, and no backdrop click that silently discards a changed draft;
- uses one primary vertical overflow region, scoped theme tokens, focus-visible rules, and 900px/600px responsive breakpoints.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
pnpm --filter @konkourx/curriculum-browser exec node --test src/tri-state-picker-contract.test.ts src/planning-field-contract.test.ts
```

Expected: FAIL because the visual Picker and new field contract do not exist.

- [ ] **Step 3: Implement the hook and Picker view states**

Implement these states without inventing completeness:

- initial catalog loading, empty catalog, no-track, inaccessible Student, recoverable failure;
- compact subject navigation and active-entry roots;
- collapsed/expanded nodes with paginated children and inline retry;
- idle/loading/empty/error search, plus reveal-in-tree behavior;
- checkbox `CHECKED`, `UNCHECKED`, `INDETERMINATE`, and `UNKNOWN_LOADING` while required facts are fetched;
- mutation structure loading, limit error, stale-session reset, and safe retry;
- serialized-confirm loading/error.

Selecting a known parent calls `selectNode` immediately and does not expand or load children. Expanding is a separate navigation action. A child deselection below selected `SUBTREE` may load structure, but the visible selector state does not change until the engine returns `UPDATED`.

- [ ] **Step 4: Redesign `PlanningCurriculumField` around isolated committed/draft state**

On open, create a fresh adapter generation from the committed v2 value. Cancel and Escape discard only that modal draft and restore trigger focus. The backdrop is visual only and does not dismiss unsaved changes. Confirm serializes through the adapter; it closes and calls `onChange` only on `SERIALIZED` and only after the `minimumOne` rule passes.

For `PRESERVED_HISTORICAL`, render every stored snapshot from label/path first. Do not display internal modes. If lifecycle permits, expose one explicit Persian action equivalent to “انتخاب مباحث جدید”; it opens an empty v2 draft and explains that confirmation replaces the complete saved set. Cancel preserves history byte-for-byte.

For a missing Student track, keep existing summaries visible outside the modal and show the existing audience-specific no-track guidance inside it; block new confirmation.

- [ ] **Step 5: Implement the compact responsive styling**

Use a centered desktop panel with header, one scrollable body, and small sticky footer. Put search above content; use compact subject navigation and a readable RTL hierarchy with capped indentation. On mobile, use a near-full-height bottom sheet, horizontally scrollable subject navigation, full-width actions, and no page-level horizontal overflow. Use only existing `--curriculum-*` and shared emphasis/text tokens so both app-owned light/dark themes remain authoritative.

- [ ] **Step 6: Run the complete shared gate**

Run:

```powershell
pnpm --filter @konkourx/curriculum-browser test
pnpm --filter @konkourx/curriculum-browser typecheck
```

Expected: PASS.

- [ ] **Step 7: Review checkpoint; do not commit yet**

Confirm `PlanningCurriculumField.tsx` no longer renders `<CurriculumBrowser mode="PICKER">`, while `CurriculumBrowser.tsx` itself is unchanged for the later browse-only milestone.

---

### Task 4: Integrate Student STUDY Task create and permitted edit

**Files:**
- Modify: `apps/student-web/src/planning/planning-client.ts`
- Modify: `apps/student-web/src/planning/task-content.ts`
- Modify: `apps/student-web/src/planning/task-content.test.ts`
- Modify: `apps/student-web/src/planning/planning-curriculum.test.ts`
- Modify: `apps/student-web/src/pages/TodayPlanningPage.tsx`

**Interfaces:**
- Consumes: `PlanningCurriculumValue`, `createEmptyPlanningCurriculumValue()`, `planningCurriculumValueFromSnapshots()`, `canReplacePlanningCurriculum()`, and `replaceChangedPlanningCurriculum()`.
- Produces: Student create body with `curriculumSelection` for STUDY, no Curriculum contract for GENERAL, and Student replacement body `{ curriculumSelection }`.

- [ ] **Step 1: Write failing Student tests**

Update/add tests proving:

- STUDY create emits only `curriculumSelection: { version: 2, selectors }` and null legacy Subject/Topic links.
- GENERAL omits both `curriculumSelection` and `curriculumTargets` even if a stale Picker value exists.
- empty or preserved-historical input cannot create a new STUDY Task.
- replacement uses the existing `/student/daily-tasks/:id/curriculum-targets` route with `{ curriculumSelection }`.
- unchanged stored `EXACT`/`SUBTREE` performs zero replacement calls.
- counselor-created, terminal, completed-item, active-session, or study-history Task remains non-editable.
- historical summaries render before/without catalog success, including the no-track case.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
pnpm --filter student-web exec node --test src/planning/task-content.test.ts src/planning/planning-curriculum.test.ts
```

Expected: FAIL on the old `curriculumTargets` contract.

- [ ] **Step 3: Change the Student client and content preparation**

Rename the replacement method to reflect selection rather than targets (for example, `replaceTaskCurriculumSelection`) while keeping the route unchanged. Send one mutually exclusive v2 body. `prepareTaskContent` validates a non-empty serialized v2 value for STUDY and omits Curriculum fields for GENERAL.

Map the existing server v2 codes (`CURRICULUM_SELECTOR_LIMIT_EXCEEDED`, `CURRICULUM_SELECTION_EMPTY`, track/selectability errors) to calm Persian messages; local limit errors normally stop before the request, but server authority remains final.

- [ ] **Step 4: Integrate create/edit without changing Today Planning presentation**

Replace only Curriculum-related state and handlers in `TodayPlanningPage.tsx`. Initialize create state with the empty v2 value. Build every task field value synchronously from stored snapshots so history never waits on current catalog enrichment. Preserve all existing Task filters, execution state, scheduling, provenance, and edit-lock checks.

On successful replacement, use the returned Task snapshots as the new committed value. On failure, keep the prior Task and field value. Do not add progressive-disclosure or 24x4 work.

- [ ] **Step 5: Run Student tests, lint, and build**

Run:

```powershell
pnpm --filter student-web test
pnpm --filter student-web lint
pnpm --filter student-web build
```

Expected: PASS.

- [ ] **Step 6: Review checkpoint; do not commit yet**

Search Student code to confirm new writes contain no `curriculumTargets`, `WHOLE`, or client-selected track and that historical read types remain intact.

---

### Task 5: Integrate Counselor single, one-Student batch, and permitted edit

**Files:**
- Modify: `apps/counselor-web/src/students/student-tasks-client.ts`
- Modify: `apps/counselor-web/src/students/StudentTaskForm.tsx`
- Modify: `apps/counselor-web/src/students/batch-task-form.ts`
- Modify: `apps/counselor-web/src/students/batch-task-form.test.ts`
- Modify: `apps/counselor-web/src/students/StudentBatchTaskForm.tsx`
- Modify: `apps/counselor-web/src/students/StudentTaskList.tsx`
- Modify: `apps/counselor-web/src/students/planning-curriculum.test.ts`
- Modify: `apps/counselor-web/src/students/task-error-messages.ts`
- Modify: `apps/counselor-web/src/students/task-error-messages.test.ts`

**Interfaces:**
- Produces: selected-Student-bound v2 single/batch/replacement bodies using the existing routes.
- Preserves: `studentId`-bound Curriculum client, `contextLabel`, assigned-Student authorization, Counselor source, pending/execution/history/assessment locks, and independent Task lifecycle per batch row.

- [ ] **Step 1: Write failing Counselor tests**

Update/add tests proving:

- single STUDY create and each STUDY batch row contain a non-empty v2 `curriculumSelection` and no `curriculumTargets`;
- GENERAL single/batch rows omit both Curriculum contracts and legacy links;
- every batch row owns an independent Picker value; removing/changing one row cannot leak selectors to another row;
- all three UI flows still build `createCounselorCurriculumClient(studentId, ...)`, pass `contextLabel={studentLabel}`, and expose no track selector;
- edit replacement keeps the existing selected-Student route and sends `{ curriculumSelection }` once only when changed;
- PERSONAL, terminal, active-session, completed-session, valid-assessment, and completed-Curriculum-item cases remain read-only;
- `STUDENT_TRACK_NOT_SET`, selector-limit/empty, and track/selectability server codes have safe Persian messages with no raw code shown.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
pnpm --filter counselor-web exec node --test src/students/batch-task-form.test.ts src/students/planning-curriculum.test.ts src/students/task-error-messages.test.ts
```

Expected: FAIL on old v1 row/client contracts.

- [ ] **Step 3: Change Counselor clients and pure batch preparation**

Replace `curriculumTargets` with optional v2 `curriculumSelection` in single and batch inputs. Keep the batch endpoint/body wrapper `{ tasks }` unchanged. Validate each STUDY row independently and require at least one selector; GENERAL omits Curriculum and resets planned test count exactly as today.

- [ ] **Step 4: Integrate the field into all three Counselor flows**

Use one committed `PlanningCurriculumValue` per single form or batch row. Recreate the Student-bound client when `studentId` changes; the hook generation must make late responses from the old Student inert. In `StudentTaskList`, build values from snapshots and keep the current lifecycle gate before allowing direct v2 editing or explicit full legacy replacement.

Do not alter Counselor `/planning`, one-Student batch semantics, Student selection, or any cross-Student capability.

- [ ] **Step 5: Run Counselor tests, lint, and build**

Run:

```powershell
pnpm --filter counselor-web test
pnpm --filter counselor-web lint
pnpm --filter counselor-web build
```

Expected: PASS.

- [ ] **Step 6: Review checkpoint; do not commit yet**

Confirm only selected-Student routes are used and the already-dirty `StudentsPage.tsx`, shell files, and app CSS were not edited.

---

### Task 6: Whole-change validation, visual acceptance, review, and selective closeout

**Files:**
- Verify all files listed in Tasks 1-5.
- Do not modify documentation state files, backend, Prisma, migrations, Curriculum artifacts, or unrelated dirty files.

**Interfaces:**
- Consumes the complete milestone diff.
- Produces technical evidence, visual review evidence, a fresh-context review, and one isolated feature commit if every gate passes.

- [ ] **Step 1: Run shared and role-focused regression suites**

Run:

```powershell
pnpm --filter @konkourx/curriculum-browser test
pnpm --filter @konkourx/curriculum-browser typecheck
pnpm --filter student-web test
pnpm --filter counselor-web test
```

Expected: PASS. Record exact counts; do not reuse counts from the engine milestone.

- [ ] **Step 2: Run the repository validation gate**

Run:

```powershell
pnpm validate
git diff --check
```

Expected: all API, Student, Counselor, typecheck, lint, build, and Prisma validation commands PASS even though backend/schema were not changed.

- [ ] **Step 3: Run semantic source checks**

Run targeted `rg` checks over the new Picker/field and app write clients to confirm:

- no forbidden technical selector copy is rendered;
- `PlanningCurriculumField` uses `TriStateCurriculumPicker`, not `CurriculumBrowser` Picker mode;
- new first-party writes use `curriculumSelection` and do not mix `curriculumTargets`;
- no frontend track selector was added;
- no backend, Prisma, migration, generated, Curriculum artifact, or `/curriculum` Browser file appears in the diff.

- [ ] **Step 4: Perform manual Light/Dark, RTL, keyboard, and responsive acceptance**

Using existing authorized local accounts/data only (do not seed, migrate, or touch the database), inspect Student create/edit and Counselor single/batch/edit at approximately 1440px, 900px, and 390px:

- one vertical scroll region; compact footer remains reachable;
- no horizontal page overflow or nested vertical scroll maze;
- focus enters the dialog, Tab/Shift+Tab stay inside, Escape cancels, and focus returns to the trigger;
- native checkbox labels toggle, expand buttons are separate, and indeterminate state is visibly distinct in both themes;
- selecting a parent does not trigger descendant fetches; expanding does;
- search and tree reflect the same checked state;
- partial deselection visibly waits for structure and either updates atomically or leaves the prior state with retry feedback;
- limit failure remains in the modal and preserves the prior selection;
- null track blocks new selection while saved snapshots remain visible;
- historical `WHOLE`/`PLACEMENT` requires explicit full replacement, and Cancel preserves it;
- stored `SUBTREE` restores; Confirm without change triggers no replacement request;
- footer says choices, not an invented count of terminal topics.

If the required local authenticated state is unavailable, report visual verification as blocked rather than changing DB state or claiming PASS.

- [ ] **Step 5: Perform the required fresh-context whole-change review**

Give the reviewer the baseline, approved spec, this plan, and the complete diff. Require explicit review of:

- engine reuse versus duplicated React selection logic;
- structure retry termination and stale-request isolation;
- legacy/v2 restore and replacement semantics;
- Student/Counselor authority and lifecycle locks;
- accessibility, RTL, theme, responsive, and one-scroll-region behavior;
- scope containment and dirty-work preservation.

Fix every blocking finding with a targeted test first, rerun the affected focused suite, then rerun Steps 1-3. Record non-blocking findings without expanding scope.

- [ ] **Step 6: Inspect and selectively stage only milestone files**

Before staging, run:

```powershell
git status --short
git diff --name-only
git diff --check
```

Use explicit `git add -- <exact paths>` for only this plan and the files listed in Tasks 1-5. Never use `git add .` or `git add -A`. If any listed file acquired unrelated hunks, use hunk-selective staging or stop if isolation cannot be proven.

Then run:

```powershell
git diff --cached --name-only
git diff --cached --stat
git diff --cached --check
git diff --cached
```

Expected: no backend, Prisma, migration, generated, Curriculum artifact, `/curriculum` Browser, package lock, asset, or unrelated dirty file is staged.

- [ ] **Step 7: Commit only after every gate passes**

Proposed commit message:

```text
feat: add visual tri-state curriculum picker
```

After commit, verify the index is empty and capture exact `git status --short`. The closeout must state changed files, database/migrations (`NONE`), API changes (`NONE`; existing v2 contract consumed), UI changes, exact tests/validation, review findings, remaining issues/decision gates, commit hash, and exact remaining dirty state.

---

## UI Interaction Contract

1. Opening the field clones the committed value into a new modal session. The committed value cannot change while browsing, searching, loading structure, or encountering an error.
2. Catalog and roots load through the role-bound client. The first node response establishes authoritative track for that modal epoch; inconsistent later responses invalidate the session.
3. Tree and search register the same node facts and query the same engine state. Neither keeps a separate selected-ID set.
4. Checking a loaded parent calls the engine immediately; the resulting compact `SUBTREE` requires no descendant load.
5. Deselecting within selected coverage may return `STRUCTURE_REQUIRED`. The UI shows a pending state, fetches/registers only requested facts, and retries the exact original operation.
6. A wrapper checkbox calls GROUP engine functions. Serialization may retain an input-only GROUP selector; the existing server expands and normalizes it before persistence.
7. A mutation limit or structure failure leaves the last valid selector expression visible and recoverable.
8. Confirm serializes once. Only `SERIALIZED` can publish the draft. Cancel/Escape publish nothing.
9. Existing compatible `EXACT`/`SUBTREE` snapshots restore with snapshot labels immediately, then current facts enrich interaction. Missing current structure cannot erase the summary.
10. Any `WHOLE`/`PLACEMENT` makes the complete historical set preserved. Only the explicit replace action starts an empty v2 draft; it never preselects or converts legacy intent.

## API-Client Boundary

- Existing endpoints remain unchanged.
- Student create: `POST /student/daily-tasks` with `curriculumSelection` for STUDY.
- Student replace: `PATCH /student/daily-tasks/:id/curriculum-targets` with `{ curriculumSelection }`.
- Counselor single create: existing assigned-Student task route with `curriculumSelection`.
- Counselor one-Student batch create: existing `/counselor/students/:studentId/tasks/batch`; each STUDY row carries its own `curriculumSelection`.
- Counselor replace: existing selected-Student task Curriculum route with `{ curriculumSelection }`.
- GENERAL writes omit both Curriculum contracts.
- V1 read compatibility remains through stored snapshots. V1 write support remains on the backend but is no longer used for new first-party Picker writes.
- The backend remains final authority for track, wrapper expansion, normalization, selector capacity, lifecycle, authorization, and immutable persisted coverage.

## Visual Acceptance Criteria

- Persian-first RTL alignment and native logical CSS properties.
- Compact professional modal; desktop max width around the existing 64rem boundary, mobile bottom-sheet behavior.
- Exactly one primary vertical scrolling body; header and compact footer remain stable.
- Search is above subject/tree content; subjects are compact buttons, not a dense form.
- Expand control and checkbox are distinct targets; labels remain readable with deep hierarchy.
- Checked, unchecked, indeterminate, unknown/loading, disabled, hover, focus, error, and retry states are distinguishable.
- Light and dark use existing semantic variables; no `prefers-color-scheme` fork or hardcoded light-only surface.
- Visible focus ring, focus containment/restoration, native keyboard activation, screen-reader checkbox state, and live loading/error feedback.
- At 390px, footer actions fit, subject navigation may scroll horizontally, and the page itself does not overflow.
- No large selected-item tray, technical mode switch, dense explanation block, or misleading topic total.

## Risks, Blockers, and Decision Gates

1. **Server catalog revision is not exposed by current read APIs.** This milestone must not claim that a local value is the server revision or change the backend. The safe in-scope strategy uses a clearly local, non-reused modal epoch only to isolate engine facts, plus no cross-modal cache, authoritative `trackId` comparison on every node, generation guards for late requests, and final server validation. If the architect requires detection of an in-session server artifact swap across deployments, that is a blocker requiring a separately approved backend response/header change.
2. **No DOM testing library is installed.** Do not add dependencies in this milestone. Put selection/retry logic under Node-tested pure modules, retain source-contract tests for markup invariants, and require manual browser acceptance for actual focus, layout, and theme behavior.
3. **`ROADMAP.md` contains older wording that says v2 implementation is future, while `PROJECT_STATE.md` correctly records the completed backend and engine.** Do not edit documentation under this UI milestone; use `PROJECT_STATE.md` for implemented facts and the approved spec/Product Map for behavior.
4. **The working tree contains unrelated visual CSS and Counselor shell changes.** They may affect manual appearance but are not owned by this milestone. Do not “fix” or stage them; report any visual collision that cannot be isolated.
5. **Product Owner Visual PASS is separate from technical acceptance.** A technically passing implementation is ready for visual review, not visually approved.

No other product behavior is unresolved by this plan. Any request to change historical selection meaning, add a track selector, redesign `/curriculum`, or broaden Counselor batch scope must stop and return to a Decision Gate.
