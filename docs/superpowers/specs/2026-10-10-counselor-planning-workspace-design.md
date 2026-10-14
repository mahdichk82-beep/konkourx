# Counselor Planning Workspace and Unified Task Composer Design

**State:** APPROVED IMPLEMENTATION SPECIFICATION  
**Approval:** Product Owner visual direction and Principal Architect execution approval, 2026-10-10  
**Owning Product Map:** Sections 3.2 Student Management and 3.3 Professional Planning

## Objective

Replace the Counselor `/planning` placeholder and the competing single/batch creation surfaces with one real, student-scoped planning workspace. The implementation must use the existing authorized Student, Task, Curriculum, scheduling, StudySession-evidence, and atomic batch contracts. It must reproduce the approved planning reference in responsive Persian RTL Light and Dark themes without creating a new planning domain.

## Starting State

- `/planning` renders a visual placeholder.
- `/students/:studentId` renders profile information, weekly distribution, a task list with existing schedule/Curriculum editing, and separate single and batch creation forms.
- Assigned-Student reads, ranged Task reads, single creation, atomic same-Student batch creation, schedule updates, planning updates, Curriculum replacement, exact 15-minute scheduling, and execution evidence already exist.
- Batch accepts one to fifty tasks, persists `plannedMinutes` as `estimatedMinutes`, and supports `plannedTestCount`; single creation does not support planned test count.
- No database or API change is needed.

## Routes and Context

- `/planning` is the global Counselor entry. It loads the complete authorized Student list and selects the first available Student unless the Counselor chooses another.
- `/students/:studentId/planning` renders the same workspace with that authorized Student selected.
- Student Workspace exposes a planning action linking to the Student-specific route and retains its overview/evidence role.
- A shared `CounselorPlanningWorkspace` owns both routes. No second planner implementation is introduced.
- Student identifiers remain inputs to server-authorized endpoints; frontend selection never substitutes for backend authorization.

## Workspace Composition

Desktop follows the approved reference: a compact context/toolbar header, a large weekly or daily timeline, and an adjacent task rail. The persistent application shell remains unchanged with its right-side navigation. The planner includes:

- authorized Student selector and direct link back to Student Workspace;
- Persian week label with previous/current/next controls;
- day/week view switch;
- read-only timed timeline;
- separate VOLUMETRIC section;
- status-filtered task rail;
- planned and actual time labels that are never conflated;
- available Curriculum coverage, completed-session minutes, active-session state, assessment evidence, and task outcome labels; and
- creation and supported edit entry points.

Mobile uses the existing hamburger/right drawer, one selected day at a time, stacked task details, and a full-width composer. It must not create horizontal page overflow or a bottom navigation.

## Smart Timeline

The timeline is a derived visualization over `scheduledFor`, `startMinuteOfDay`, and `endMinuteOfDay`.

- The default view shows a clean hourly grid over the full 24-hour contract inside a bounded scroll region.
- An explicit density control expands each hour visually into four quarter-hour divisions; it does not render or persist 96 domain entities.
- TIMED blocks use exact minute offsets and durations. Blocks outside the reference image's daytime sample remain visible in their correct positions.
- Overlapping intervals are assigned readable lanes and receive a text/icon conflict marker. Detection is descriptive only and adds no save restriction or scheduling policy.
- VOLUMETRIC tasks never receive clock positions and render in a separate list.
- Task status is expressed by text and restrained semantic styling, never color alone.
- Timeline blocks are not draggable, resizable, clickable for creation, or direct schedule editors.

## Unified Task Composer

The composer is opened from the planning workspace and is bound to exactly one selected authorized Student.

- It starts with one independent task and allows up to fifty tasks for that same Student.
- Every row selects STUDY or GENERAL explicitly.
- STUDY renders the official `PlanningCurriculumField` tri-state Picker and planned test count.
- GENERAL renders neither Curriculum nor planned-test controls and serializes test count as zero under the existing batch contract.
- VOLUMETRIC has no start/end fields. Planned duration is optional in the UI; blank uses the batch contract's existing zero/default behavior. Presets of 30, 45, 60, 90, and 120 minutes are conveniences only.
- TIMED selects a 15-minute-aligned start and duration. End is derived, remains within the same day, and is submitted as the existing paired start/end values. Its planned duration equals the selected window duration.
- Title, date, optional instruction/description, type-specific Curriculum, optional VOLUMETRIC duration, TIMED schedule, and supported planned test count map to the unchanged batch payload.
- Review summarizes all rows before one atomic request. Submission disables repeat actions until resolution, preserves drafts on failure, reports server-safe errors, and resets to one blank task only after success.
- The existing single endpoint remains untouched for compatibility; the Counselor UI uses the batch endpoint for both one-task and multi-task submissions.

## Existing Editing and Historical Integrity

The milestone does not invent an edit matrix. Existing Counselor Task list controls and server rules remain authoritative for schedule/Curriculum editing. The compact planning task rail provides a real entry to Student Workspace task details. Personal tasks, executed tasks, historical targets, and execution snapshots retain current restrictions.

Historical `WHOLE`, recursive `SUBTREE`, historical `PLACEMENT`, immutable execution snapshots, Track authority, STUDY/GENERAL validation, lifecycle outcomes, PARTIAL remainder, StudySession independence, Pause Ledger behavior, and missed/late/skipped distinctions are unchanged.

## Loading, Empty, and Error Behavior

- Student-list failure, no assigned Students, invalid/revoked Student context, weekly Task-load failure, empty day/week, composer validation, and submission failure receive explicit Persian states with retry where meaningful.
- Partial data is not represented as zero or success.
- Real persisted data is used throughout; no demonstration tasks, analytics, or progress are generated.

## Files and Boundaries

Planning-specific pure logic and React components live under `apps/counselor-web/src/planning/`. Existing clients remain under `students/` and receive only the minimal pagination helpers needed by the planner. `PlanningShellPage` becomes the thin route page. `App.tsx` owns route matching; `StudentDetailPage.tsx` owns the contextual entry. Planner styles live in one planning stylesheet and consume existing theme tokens.

## Verification

Development follows test-first cycles for timeline layout, overlaps, composer validation/serialization, and paginated data loading. Final checks are limited to affected Counselor tests, Counselor lint/build, relevant package type/build checks, and real rendered screenshots for desktop/mobile Light/Dark plus the composer when the local authenticated stack is available.

## Explicitly Out of Scope

Student Today redesign; cross-Student assignment; drag/drop, resize, cell-click creation, or direct timeline edits; new conflict policy; new analytics; new database models or migrations; API authorization/transaction changes; recurrence/templates/copy-week; and automatic Task completion from StudySession state.

## Documentation Discrepancy

`docs/ROADMAP.md` previously named Browser/Picker split as the next default milestone and permitted a different milestone only through explicit architect authorization. The 2026-10-10 Principal Architect approval is that explicit authorization. This work does not silently mark Browser/Picker or adjacent Roadmap work complete.
