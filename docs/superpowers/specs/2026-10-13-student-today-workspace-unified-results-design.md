# Student Today Workspace + Unified Study Result Design

**State:** APPROVED FUTURE STATE — authorized Student UX Milestone 1 design; not yet implemented  
**Date:** 2026-10-13  
**Scope:** Student Web `/planning` only, plus focused Student-side helpers and tests  
**Product authority:** Product Owner approval in the 2026-10-13 milestone brief and follow-up approval

## CURRENT IMPLEMENTED STATE

Student Today already loads today's tasks and a separate bounded overdue page, restores one server-backed active `StudySession`, supports start/switch/pause/resume/finish, records Curriculum execution items and cumulative solved-test progress, and changes Task outcomes through existing APIs.

The current page exposes these capabilities through large expandable Task cards. Scheduling, Curriculum planning, execution coverage, solved-test input, session history, session controls, completion, and skipping compete inside the same expanded surface. Study-session finishing and Task completion are separate actions with insufficient guidance about their independent meaning.

The working tree also contains valuable uncommitted Counselor, shared Curriculum package, lockfile, and canonical-document work. This milestone must not modify or commit that work.

## APPROVED FUTURE STATE

### 1. Outcome and non-negotiable boundaries

Today becomes the Student's primary daily action workspace and immediately answers:

1. What should I study now?
2. How do I start or continue?
3. How do I record what I actually accomplished?

This is a Student presentation and orchestration redesign over existing contracts. It adds no backend endpoint, schema, migration, Task state, persistence model, scheduling policy, permission, or automatic lifecycle transition.

The following records remain independent:

- `DailyTask` is planned work and owns the explicit Task outcome;
- `StudySession` is actual server-timed study and never completes a Task automatically;
- Curriculum execution items are item-level coverage and never complete a Task automatically;
- `actualSolvedTestCount` is a cumulative observation and never completes a Task automatically.

Task completion always requires a deliberate Student action. Planned duration never becomes actual duration. Finishing a session, marking all Curriculum items, or recording solved tests never silently changes Task status.

`PARTIAL` retains its existing terminal meaning. Choosing “continue later” does not create `PARTIAL`; it keeps the Task `PENDING` and preserves successfully saved progress. Existing terminal `PARTIAL` Tasks remain read-only and display completed and remaining Curriculum evidence.

### 2. Page structure and hierarchy

The page uses this fixed information order:

1. compact page heading and date, with secondary Weekly Plan and personal-Task creation actions;
2. active StudySession, when present;
3. today's Tasks;
4. overdue pending Tasks;
5. compact, clearly labelled loaded-page summary or filters only where they help locate work.

Today's Tasks appear before overdue Tasks. Overdue work remains a separate paginated group. It is not moved to today, rescheduled, marked missed, or converted into another Task.

All loaded Tasks scheduled for today remain discoverable, including `PENDING`, `COMPLETED`, `PARTIAL`, and `SKIPPED`. The status filter includes every existing status. Pagination remains available, and any count derived from a bounded page remains labelled as loaded-page information rather than a complete daily aggregate.

The large summary-card grid is replaced by a quieter compact summary so immediate work stays above reporting decoration.

### 3. Active study priority

An active session renders above the Task workspace with:

- the associated Task title;
- running or paused state in plain Persian;
- live elapsed active time derived from server-backed session state;
- Resume or Pause;
- the primary action `پایان و ثبت نتیجه`;
- cancellation as a secondary, confirmed action.

The card and the global header timer use the same `StudyTimerContext` authority. Refresh, focus, visibility, online recovery, and cross-tab reconciliation remain unchanged.

The active session remains bound to `dailyTaskId`. Opening its result flow selects that exact Task. If filtering or bounded pagination means the Task is not in the current lists, Student Today loads it through the existing owned-Task read instead of associating the session with a visually adjacent Task or inventing a placeholder identity. Failure to load optional Task detail must not discard or mutate the authoritative active session.

### 4. Compact Task list

Each Task row/card contains only execution-relevant summary information:

- title;
- relevant subject or stored Curriculum context when available;
- restrained Counselor/Personal provenance;
- exact time range for a timed Task, or an honest date-only/target presentation without fabricated clock time;
- planned duration and planned tests where present, clearly labelled as planned;
- actual solved-test or Curriculum progress when useful, clearly separate from planned values;
- localized lifecycle/presentation status;
- one primary action.

The UI must not infer whether numeric zero means “explicitly recorded zero” or “not yet recorded.” It may show the current numeric value in the result editor, but it does not invent a separate unrecorded state.

Primary actions are contextual:

- matching active STUDY Task: `پایان و ثبت نتیجه`;
- pending STUDY Task without a matching active session: `شروع مطالعه`, plus a secondary `ثبت نتیجه بدون تایمر` entry;
- another Task while a session is active: the existing confirmed switch behavior;
- pending GENERAL Task: `ثبت نتیجه`;
- terminal Task: `مشاهده جزئیات`.

Students may open result recording for an authorized pending STUDY Task without an active session. The product never forces a new `StudySession` merely to record previously completed Curriculum items, solved tests, or an explicit Task outcome.

### 5. Contextual detail behavior

Desktop uses a two-column workspace: a compact Task rail and one contextual detail panel. Only the selected Task's details are rendered as interactive content. The panel is not a relocated copy of the old all-controls-at-once accordion.

The detail panel leads with the selected Task's identity, status, schedule/target, and primary action. Secondary sections are disclosed separately and only when applicable:

- result/progress recording;
- plan and Counselor instruction;
- study history and optional session feedback;
- authorized personal scheduling;
- skip action and optional existing skip reason.

On mobile, selecting a Task replaces the list workspace with a full-width detail surface on the same route. A labelled Back action returns to the previous list and restores focus to the originating Task control. Opening detail moves focus to its heading. The detail surface does not compete with the shell's right-side navigation drawer and introduces no bottom navigation.

Terminal records expose read-only historical evidence. Controls forbidden by content type, Task source, lifecycle, or backend permissions are omitted or disabled with a plain-language explanation.

### 6. Unified `پایان و ثبت نتیجه` flow

The unified flow is a focused result section inside the selected Task detail. It is an orchestrated sequence over independent APIs, not an atomic transaction.

#### 6.1 Entry without an active session

For a pending authorized STUDY Task with no matching active session, the flow opens directly at result recording. Existing completed-session totals may be loaded and shown as recorded study history, but the Student is not asked to create or fabricate a session.

#### 6.2 Entry with the matching active session

The first step explicitly explains that ending study records time but does not complete the Task. The Student confirms the existing finish operation. Optional existing session note/focus/quality fields remain clearly labelled as StudySession feedback and are progressively disclosed; they are not presented as a Task-level Quality Score.

After a successful finish, the returned server duration is shown as recorded study time and session history is refreshed. If finishing fails, the flow stays at this step, reconciles authoritative timer state where existing conflict rules require it, and does not attempt result or Task-outcome writes.

#### 6.3 STUDY progress recording

The result section presents only applicable inputs:

- Curriculum execution checklist from immutable stored item snapshots;
- cumulative solved-test count for explicit pending STUDY Tasks;
- actual recorded study time from finished, non-cancelled sessions.

Curriculum changes use the existing item endpoint and update the local Task from each server response. Multiple dirty item changes are submitted sequentially so successful writes are retained and the latest returned Task version remains authoritative.

Solved-test progress is submitted after Curriculum operations and uses the latest server-returned `updatedAt` through the existing optimistic-concurrency input. A stale response triggers the existing Task reconciliation, preserves the Student's visible draft, explains the conflict, and requires a deliberate retry.

#### 6.4 Explicit Task decision

The final question has two unambiguous choices:

- `کار کاملاً انجام شد` — request `COMPLETED` only after all intended progress writes succeeded and existing Curriculum completion validation permits it;
- `بعداً ادامه می‌دهم` — perform no Task-status mutation and leave the Task `PENDING`.

The completion action is never inferred or preselected. If the server rejects completion, the client reconciles the Task, keeps the flow open, and shows the actual reason. A successful finish-session response or N/N Curriculum coverage is never described as successful Task completion until the Task endpoint confirms `COMPLETED`.

The existing skip flow remains secondary and explicit. An active matching session must be finished or cancelled under existing rules before a terminal skip request can succeed.

#### 6.5 GENERAL result flow

GENERAL Tasks do not show Study Timer, Curriculum, solved-test, or academic session-feedback controls. Their result surface provides a short explicit completion confirmation and retains the existing secondary skip behavior. Completing GENERAL work uses only the existing Task-status endpoint.

Nullable historical content types remain compatibility records. Their existing session history may be read, but the redesign does not classify them as STUDY or GENERAL or grant new mutations.

### 7. Partial failure and retry behavior

The client tracks each independent operation as not attempted, saving, saved, or failed. It never rolls back a successful server write in the browser and never claims the entire result was saved when only part succeeded.

Rules:

- a failed session finish prevents later operations that require the matching session to be closed;
- successful Curriculum item writes remain visibly saved when a later item fails;
- a failed item is identified and retryable without resubmitting successful items;
- a failed or stale solved-test write retains the Student's draft and reconciles the latest Task version;
- Task completion is blocked while required progress writes are failed or unsaved;
- a failed Task completion does not repeat successful session/progress writes;
- `بعداً ادامه می‌دهم` may close the flow after partial saves, but feedback must name any unsaved operation and state that the Task remains open;
- retries reuse existing ownership, lifecycle, active-session, and optimistic-concurrency protections.

Page-level list, overdue, subject, active-session, Task-detail, history, and mutation failures remain independently recoverable. A failed secondary source must not erase successfully loaded content or be rendered as a false zero/empty state.

### 8. Component and helper boundaries

`TodayPlanningPage` remains responsible for page queries, filters, selected Task identity, and coordination with `StudyTimerContext`, but the current monolithic render is split into focused Student-side units.

Planned boundaries:

- `TodayTaskWorkspace`: desktop list/detail layout and mobile list/detail mode;
- `TodayTaskList` and `TodayTaskSummary`: compact grouping and one-primary-action rows;
- `TodayTaskDetail`: selected Task context and progressive secondary sections;
- `TaskResultFlow`: visible orchestration and per-operation feedback;
- a pure result-flow helper module: operation ordering, retry eligibility, completion gating, and outcome messages;
- the existing `TaskExecutionPanel`: reduced to read-oriented StudySession history and optional finished-session feedback; live start/finish controls move to the Task summary and unified result flow so they are not duplicated;
- existing `PlanningCurriculumField`, scheduling controls, `planningClient`, Task completion helpers, solved-test helpers, and `StudyTimerContext`: reused without shared-package or API changes.

No unrelated shell, navigation, Weekly Planning, Curriculum package, Counselor Web, API, database, or canonical Roadmap refactor belongs to this milestone.

### 9. Accessibility and responsive behavior

- Preserve Persian RTL and logical CSS properties.
- Keep visible keyboard focus and meaningful headings/landmarks.
- Ensure every primary action has an accessible name containing enough Task context.
- Announce mutation success with status semantics and failures with alert semantics without moving focus unexpectedly.
- Restore focus when mobile detail closes and when a confirmation is dismissed.
- Keep timer and result actions reachable without horizontal scrolling.
- Respect reduced-motion preferences.
- Maintain Light/Dark token parity and accessible contrast.
- Avoid nested scrolling regions in the Today workspace; the page remains the primary scroll container.

### 10. Targeted acceptance tests

Focused pure/helper and component-contract tests must cover:

1. primary action selection for STUDY/GENERAL, pending/terminal, matching/other/no active session;
2. active-session Task association after refresh and when the Task is outside current filters or loaded pages;
3. running and paused server-backed timer presentation and Resume/Pause behavior;
4. opening result recording without an active StudySession;
5. finish success displaying the returned recorded duration without completing the Task;
6. finish failure preventing later writes and preserving reconciled active state;
7. Curriculum item sequencing with an intermediate failure, retained successes, and retry of failures only;
8. solved-test save after Curriculum changes using the latest Task version;
9. stale solved-test conflict retaining the draft and reconciling authoritative state;
10. explicit completion only after affirmative choice and existing coverage validation;
11. `بعداً ادامه می‌دهم` preserving progress while leaving status `PENDING`;
12. failed Task completion not repeating successful session or progress operations;
13. GENERAL completion without StudySession/Curriculum/test controls;
14. overdue Task continuation without rescheduling or transfer;
15. completed, skipped, and historical `PARTIAL` read-only presentation;
16. Counselor-created Task execution without Counselor-owned planning mutation;
17. timed and date-only/target-based summary presentation without fabricated times;
18. zero solved-test truth without an invented recorded/unrecorded distinction;
19. mobile full-width detail Back behavior and focus restoration;
20. desktop single-selection list/detail behavior, keyboard access, and no simultaneous overloaded Task panels.

Verification is limited to focused Student tests, relevant existing API contract tests for Task lifecycle/Curriculum/progress/StudySession behavior, Student TypeScript/lint/build checks, and real-browser desktop/mobile Light/Dark inspection where the local runtime permits it. Full repository suites are not repeated unless a focused failure indicates broader impact.

## EXPLORATORY / DEFERRED

The following remain outside this milestone and are not authorized by this specification:

- a new atomic finish/result API or Task Result aggregate;
- new Task states, persistent missed state, or reinterpretation of `PARTIAL`;
- automatic Task completion, rescheduling, overdue transfer, or compensatory Tasks;
- Task-level Quality Score persistence without an approved backend contract;
- new Student Curriculum progress persistence, analytics, assessment, messaging, notifications, or billing;
- Counselor planning changes, shared Curriculum package changes, navigation rewrites, schema changes, or migrations.

## Product Owner decisions and architectural conflicts

No blocking Product Owner decision or architectural conflict remains for this milestone.

The existing backend has no Task-level Quality Score or Task-result transaction. This specification therefore preserves existing StudySession feedback as session-level data and implements transparent sequential orchestration. It does not fabricate a Task-level score or atomic guarantee.

Product Owner Visual PASS remains explicitly unclaimed and requires separate review of the implemented browser result.
