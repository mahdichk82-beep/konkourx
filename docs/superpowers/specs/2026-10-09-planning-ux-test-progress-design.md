# Planning UX and Actual Test Progress Design

**Status:** APPROVED IMPLEMENTATION DESIGN
**Approval:** Product Owner, 2026-10-09

## Intent

Implement the approved planning corrections without merging Planning, StudySession,
Curriculum execution, Task outcomes, or AssessmentAttempt semantics. Students need
an explicit cumulative solved-test total on applicable `STUDY` Tasks, a usable path
to continue overdue pending work, unambiguous scheduling choices, and a compact
Today surface. Counselor views may read Student-recorded progress but may not write
it.

## Persistence and Concurrency

`DailyTask.actualSolvedTestCount` is an additive nonnegative integer with database
default `0` and a database check constraint. It is an execution observation, not a
planned quantity, session measurement, assessment result, Curriculum completion
signal, or Task outcome trigger.

Students update the cumulative total through a dedicated progress endpoint. The
payload contains `actualSolvedTestCount` and the Task's last observed
`expectedUpdatedAt`. The store performs one conditional update scoped by Student
ownership, `PENDING` status, explicit `STUDY` content type, and matching
`updatedAt`. A mismatch returns a stale-progress conflict and the client reloads
the authoritative Task. Corrections are allowed while pending; terminal Tasks are
immutable. The endpoint does not distinguish Personal and Counselor provenance,
because the assigned Student owns execution evidence, but it cannot update any
Counselor-owned planning content.

No existing records are rewritten. The default provides a truthful zero for old
rows. Historical `PARTIAL`, nullable content types, terminal restrictions, checked
Curriculum items, and existing StudySessions remain unchanged.

## Overdue Continuation

The Student Task list contract gains a paginated `overdueBefore=YYYY-MM-DD` mode.
It is mutually exclusive with exact-date and range filters and always selects
`PENDING` Tasks scheduled strictly before the supplied Tehran date. It uses the
existing `(studentProfileId, status, scheduledFor)` index and normal cursor/limit
pagination. Today loads one bounded overdue page separately from today's page and
offers its own load-more action. Tasks are neither moved nor marked missed.

Overdue pending Tasks expose the same authorized execution controls as current
pending Tasks. Explicit completion remains independent and records the existing
late-completion timestamp semantics.

## Scheduling

Student and Counselor create/edit controls present two radio options:

- `VOLUMETRIC`: no fixed schedule; both time fields serialize as `null`.
- `TIMED`: paired required start/end values aligned to 15-minute precision.

The draft retains unsaved start/end values when switching modes. Existing persisted
values initialize the appropriate mode, Jalali dates remain visible, and backend
validation stays authoritative. This applies to personal creation/editing,
Counselor single creation/editing, and one-Student batch creation.

## Today Interaction

Today Task cards are collapsed initially and controlled by one `expandedTaskId`, so
only one is expanded. The summary button exposes title, presentation status,
source, schedule, Curriculum coverage, and actual solved-test total when available.
Expanded content remains mounted and is made inert/hidden to assistive technology
while collapsed, preserving unsaved progress, schedule, skip, Curriculum, feedback,
and timer drafts. The transition uses a 250ms grid/opacity treatment with a
`prefers-reduced-motion` override and no nested scrolling.

Only explicit `STUDY` Tasks expose the solved-test input and StudySession controls.
`GENERAL` Tasks retain explicit completion and skip actions. Nullable historical
content types keep their existing read presentation and terminal history but gain
no new progress input.

The global active timer remains outside cards and operational regardless of card
expansion.

## Read Surfaces

The actual cumulative solved count is included in authorized Student Task responses
and assigned-Counselor Task responses. It is shown distinctly from planned tests in
Student Today/weekly history and Counselor Task/weekly views. No Counselor mutation
route is added.

## Validation

Focused TDD covers cumulative replacement, correction, ownership, Task type/status,
stale writes, atomic store conditions, route validation, and paginated overdue
selection. Frontend helper tests cover progress drafts and exclusive schedule
serialization. Targeted API/frontend tests, type-checks/builds, schema validation,
and one final relevant validation pass precede review and commit.

Manual visual QA remains required for RTL, keyboard accordion operation, one-open
behavior, draft retention, active timer behavior, mobile/desktop layout, Light/Dark,
and reduced-motion rendering.

## Explicit Exclusions

- no automatic Task completion from solved tests or StudySessions;
- no automatic missed-task persistence;
- no automatic transfer or compensation Task;
- no Task subtype redesign or test-specific subtype invention;
- no Counselor progress mutation;
- no Assessment, Profile, Counselor Planning shell, or legacy-navigation redesign.
