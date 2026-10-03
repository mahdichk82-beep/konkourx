# Konkourix API

All application routes use the `/api/v1` prefix and the standard success/error envelope. Authentication and authorization are server-owned; browser-supplied roles, owners, and creator identities are never authoritative.

This file documents the currently implemented HTTP contract, including student-owned subject/topic validation and the read-only file-backed Canonical Curriculum runtime.

## Canonical Curriculum reads

### CURRENT IMPLEMENTED STATE

The following authenticated routes are readable by `STUDENT`, `COUNSELOR`, and `ADMIN`:

```text
GET /api/v1/curriculum/tracks
GET /api/v1/curriculum/tracks/:track/catalog
GET /api/v1/curriculum/tracks/:track/catalog/:entryId
GET /api/v1/curriculum/tracks/:track/catalog/:entryId/roots
GET /api/v1/curriculum/tracks/:track/catalog/:entryId/nodes/:nodeId
GET /api/v1/curriculum/tracks/:track/catalog/:entryId/nodes/:nodeId/children
GET /api/v1/curriculum/tracks/:track/search?q=...

# Compatibility representation APIs
GET /api/v1/curriculum/scopes
GET /api/v1/curriculum/placements
GET /api/v1/curriculum/representations
GET /api/v1/curriculum/nodes/:id
GET /api/v1/curriculum/nodes/:id/children
GET /api/v1/curriculum/search?q=...
```

The primary navigation contract is `TRACK -> SUBJECT / SUBJECT VIEW -> ARBITRARY CANONICAL TREE`. The three stable track values are `EXPERIMENTAL`, `MATHEMATICS`, and `HUMANITIES`. A catalog entry is a navigation identity, not a task-target kind. Book-based and thematic entries are siblings. Shared entries retain one catalog ID and the same canonical representation/node IDs in every explicitly permitted track.

The `:track` path value is filtering context only. It is not user-to-track authorization, and the same authenticated Student, Counselor, or Admin may currently request any of the three catalogs. No profile lookup or track permission is performed by these routes.

Catalog lists contain resolved entries only. Roots are canonical nodes or non-selectable navigation groups. Groups contain existing canonical node IDs, cannot be submitted as task targets, and do not create synthetic educational nodes. Entry-scoped node and child responses include the requested track, entry, ambiguity codes, and a breadcrumb containing track, entry, optional navigation group, and canonical node ancestors. Track search is bounded to nodes mounted by resolved entries in that track; it never falls back to the global representation inventory.

Humanities Arabic is a distinct Humanities-only catalog entry whose `دهم`, `یازدهم`, and `دوازدهم` groups mount existing Arabic lesson nodes. Biology is a resolved Experimental entry; `BIOLOGY_SEQUENCE_GRADE_ASSIGNMENT_UNRESOLVED` records only the unresolved internal sequence-to-grade mapping. Chemistry is shared between Experimental and Mathematics only while its explicit source statement and paired source-tree structures agree. A structural mismatch quarantines Chemistry as `CHEMISTRY_EQUIVALENCE_MISMATCH` without aborting unrelated catalogs.

The runtime loads the checked-in deterministic base artifact and additive catalog overlay generated from `docs/curriculum/CANONICAL_CURRICULUM.md` plus the explicit catalog manifest. A generated identity registry preserves all 5,641 pre-catalog runtime IDs and never reassigns tombstoned IDs. The base exposes four source scopes, twelve scope/grade placements, all 74 subject placements, 67 independent detailed source representations, and 5,484 detailed nodes. Detailed nodes retain exact raw labels, source locators and order, source-visible depth, nullable source marker metadata, and direct-child counts. Compatibility representation metadata still does not assert a placement relationship unless explicitly mapped by the catalog manifest.

Placement and representation lists use `limit` and `offset`. Node children and search use the same bounded pagination. Limits are 1 through 100, offsets are 0 through 10,000, and search text is required with a maximum length of 100 characters. Search normalization never replaces the returned raw label, and results remain in deterministic source order. Unknown well-formed node IDs return `CURRICULUM_NODE_NOT_FOUND`; malformed IDs and invalid bounds return `VALIDATION_ERROR`.

There is no Curriculum write endpoint, admin Curriculum endpoint, authoring operation, import operation, publication/version workflow, separate Curriculum permission system, database migration, or frontend change in this milestone.

### CURRENT DATABASE BOUNDARY

Historical Prisma Curriculum governance models and PostgreSQL objects were retired by the RF4 forward migration. Canonical Curriculum itself remains file-backed and has no PostgreSQL persistence. DailyTask planning stores only validated runtime IDs and historical display snapshots; these task references do not make PostgreSQL authoritative over Curriculum.

### APPROVED FUTURE STATE

The remaining authoritative track-enforcement gate requires `StudentProfile.track`. Student access will resolve the track from the authenticated Student's profile. Counselor access will resolve it from the selected authorized and assigned Student's profile. Until that separately approved gate is implemented, request-supplied track remains temporary filtering context only.

A future Question Bank contract may link `Question` and `CurriculumNode` many-to-many. Those links are human-tagged, may span book-based views, thematic views, and multiple grades, and perform no automatic semantic mapping. This is compatibility direction only and is not implemented by this milestone.

## DailyTask Curriculum planning and execution

### CURRENT IMPLEMENTED STATE

Student personal-task creation, counselor single-task creation, and counselor batch-task creation accept an optional `curriculumTargets` array. Each target has `referenceKind` (`NODE` or `PLACEMENT`), `curriculumRefId`, and `selectionMode` (`EXACT` or `WHOLE`). References are checked against the file-backed Canonical Curriculum before persistence.

`CATALOG_ENTRY` and catalog navigation groups are not task-target kinds. Canonical nodes mounted below an entry remain selectable through the existing `NODE` contract; group IDs submitted as nodes return `CURRICULUM_NODE_NOT_FOUND`.

- `NODE + EXACT` creates one execution item for the selected node.
- `NODE + WHOLE` creates one execution item per direct child; a leaf creates one item for itself. Descendants below the direct children are not recursively flattened.
- `PLACEMENT + EXACT` creates one execution item for the selected subject placement.
- `PLACEMENT + WHOLE` returns `CURRICULUM_PLACEMENT_WHOLE_UNSUPPORTED` because no placement-to-representation mapping is inferred.
- Duplicate targets or overlapping selections that would create the same item return `CURRICULUM_TARGET_OVERLAP`.

One task may contain multiple targets. Curriculum-backed and freeform tasks coexist; omitting or clearing targets leaves a normal freeform task and never creates a Curriculum node. Stored targets/items contain opaque runtime IDs plus immutable raw-label and path snapshots for historical display. There is no database foreign key to Curriculum.

Task responses include `curriculum.targets`, `completedItemCount`, `totalItemCount`, and `remainingItemCount`. Planning-target replacement uses:

```text
PATCH /api/v1/student/daily-tasks/:id/curriculum-targets
PATCH /api/v1/counselor/students/:studentProfileId/tasks/:taskId/curriculum-targets
```

The strict body is `{ "curriculumTargets": [...] }`; an empty array clears targets. A student may replace targets only on an owned personal task. A counselor may replace targets only on a counselor-created task for an actively assigned student. The task must be `PENDING` and have zero completed Curriculum items. Targets and snapshots become immutable after execution starts or the task closes.

Student checklist execution uses `PATCH /api/v1/student/daily-tasks/:id/curriculum-items/:itemId` with the strict body `{ "completed": true | false }`. The server assigns or clears the item `completedAt`. The authenticated student may toggle items on their own personal tasks and counselor-created tasks assigned to them while the task is `PENDING`; this does not grant permission to edit counselor planning content. Foreign task/item identifiers are hidden behind owner-scoped not-found responses. Counselors read checklist coverage through their existing assigned-student task list.

`DailyTask.status` now includes terminal `PARTIAL`. For a Curriculum-backed task: `COMPLETED` requires N/N completed items, `PARTIAL` requires X/N where `0 < X < N`, and `SKIPPED` requires 0/N. `PENDING` remains open, checkbox changes never automatically transition the task, and lifecycle timestamps remain server-owned. `PARTIAL` keeps the completed and unfinished items, never reopens the original task, and never creates a compensatory task automatically. Existing tasks without Curriculum references retain their prior `PENDING`/`COMPLETED`/`SKIPPED` behavior; freeform tasks cannot use `PARTIAL`.

### APPROVED FUTURE STATE

A counselor may later create a separate compensatory task from a partial task's remaining items. Reporting may derive direct coverage, repeated study, last-study time, accumulated duration, and unfinished planned content. Task completion is not mastery. No compensatory workflow, aggregate report, mastery persistence, or UI is implemented here.

## DailyTask planner scheduling

### CURRENT IMPLEMENTED STATE

`scheduledFor` remains the required calendar date (`YYYY-MM-DD`). An exact same-day planner position is represented by the optional paired fields `startMinuteOfDay` and `endMinuteOfDay`. Values are minutes after local midnight: start is from `0` through `1425`, end is from `15` through `1440`, both must be divisible by 15, and end must be greater than start. Consequently `945` to `1020` represents `15:45–17:00`.

Task responses expose both nullable minute fields and derived `miniBoxSpan`. The example above returns `miniBoxSpan: 5`. Date-only legacy tasks return null for all three exact-time values; the API does not invent historical times.

Student personal-task creation, counselor single/batch creation, and both existing schedule mutations accept the optional paired time fields. The date-only schedule body remains compatible. Passing only one time, an unaligned time, an end not after its start, or a cross-midnight range is rejected. `24:00` is permitted only as the same-day end boundary.

Counselors may update the title, nullable description, nullable estimated minutes, date, and exact time of an assigned counselor-created task through:

```text
PATCH /api/v1/counselor/students/:studentProfileId/tasks/:taskId
```

The existing focused `/schedule` route remains available. Both mutations preserve server-owned ownership and provenance and reject personal, foreign, or already-executed tasks. Curriculum targets continue to use their separate mutation and retain their existing execution/terminal immutability rules.

The 24 hourly boxes and 96 fifteen-minute mini-boxes remain a UI/time-grid model. No MiniBox persistence exists. This scheduling contract unblocks, but does not implement, the Counselor planning interface.

## Counselor batch task creation

`POST /api/v1/counselor/students/:studentProfileId/tasks/batch`

Creates between 1 and 50 ordinary `DailyTask` records for one actively assigned student. The caller must be an active authenticated counselor with a `CounselorProfile` and an active `StudentCounselor` assignment to the URL student.

Request body:

```json
{
  "tasks": [
    {
      "title": "مطالعه زیست فصل ۳",
      "subjectId": "40000000-0000-4000-8000-000000000001",
      "topicId": "50000000-0000-4000-8000-000000000001",
      "scheduledFor": "2026-09-15",
      "startMinuteOfDay": 945,
      "endMinuteOfDay": 1020,
      "plannedMinutes": 90,
      "plannedTestCount": 0,
      "description": ""
    }
  ]
}
```

- `title` and a real `YYYY-MM-DD` `scheduledFor` date are required.
- `startMinuteOfDay` and `endMinuteOfDay` are optional as a pair and follow the same 15-minute schedule rules described above.
- `plannedMinutes` is a non-negative integer up to 1440 and maps to the existing `DailyTask.estimatedMinutes` field. It defaults to `0` when omitted.
- `plannedTestCount` is a non-negative integer persisted on `DailyTask` and defaults to `0`.
- `subjectId`, `topicId`, and `description` are optional. A topic requires a subject and must be an active topic belonging to that active student-owned subject.
- The strict request schema rejects `studentProfileId`, `createdByUserId`, `source`, status/lifecycle timestamps, and all other unknown fields.

The server assigns the URL student after authorization, uses the authenticated user as creator, and sets every task to `source: "COUNSELOR"` and `status: "PENDING"` with empty completion/skip metadata. It validates the full batch and persists it in one transaction, so a rejected or failed item creates no tasks.

Successful response (`201`):

```json
{
  "success": true,
  "data": {
    "created": 1,
    "tasks": [
      {
        "id": "60000000-0000-4000-8000-000000000001",
        "title": "مطالعه زیست فصل ۳",
        "source": "COUNSELOR",
        "status": "PENDING",
        "estimatedMinutes": 90,
        "plannedTestCount": 0
      }
    ]
  },
  "requestId": "request-id"
}
```

The real `tasks` array contains the created creator-safe `DailyTask` representations. Standard errors include authentication/role failures, `STUDENT_NOT_FOUND`, subject/topic validation errors, `TASK_DATE_INVALID`, and `VALIDATION_ERROR`.

## Student task execution

Task execution keeps planning and actual work separate: `DailyTask` remains planned work and each execution is a normal `StudySession`. Starting, finishing, switching, or cancelling a session never changes the task lifecycle automatically. Session lifecycle is derived exclusively from timestamps: active means `endedAt = null` and `cancelledAt = null`, finished means `endedAt != null` and `cancelledAt = null`, and cancelled means `endedAt = null` and `cancelledAt != null`.

### Start a task

`POST /api/v1/student/tasks/:id/start`

The endpoint accepts an empty strict JSON object. It requires an active authenticated student and an owned `PENDING` task. The server derives the student profile, task relation, optional subject relation, and `startedAt`; ownership or timestamps cannot be supplied by the client.

Successful response (`201`) returns an active `StudySession` whose `endedAt`, `cancelledAt`, and `durationMinutes` are `null`. Foreign or missing tasks return `TASK_NOT_FOUND`; non-pending tasks return `TASK_NOT_EXECUTABLE`.

If that task is already the student's active task, a retried start safely returns the existing session. If a different task is active, the endpoint returns HTTP `409` with `ACTIVE_STUDY_SESSION_EXISTS`; it never creates a second live session. Start is serialized by locking the authenticated student's stable `StudentProfile` row inside the database transaction.

### Read the active session

`GET /api/v1/student/study-sessions/active`

Returns the authenticated student's single current session whose `endedAt` and `cancelledAt` are both `null`, or `null` when no live session exists. The route accepts no user or profile identifier. It is registered before the parameterized `/student/study-sessions/:id` route.

### Switch tasks atomically

`POST /api/v1/student/tasks/:id/switch`

The strict body accepts only the optional `currentSessionAction` value `FINISH` or `CANCEL`; omission defaults to `FINISH`. The endpoint applies the same owned, `PENDING`, executable-task checks as start. In one student-row-locked transaction it uses one server transition timestamp to finish or cancel a different active session and create a new active `StudySession` for the target. It returns:

```json
{
  "finishedSession": {},
  "cancelledSession": null,
  "activeSession": {}
}
```

With `CANCEL`, `finishedSession` is null and `cancelledSession` contains the discarded previous interval. Cancelled intervals have `durationMinutes: null`. When no session is active, either action safely starts the target. When the target is already active, it returns the existing session with both prior-session fields null and creates nothing. Returning to a previously studied task always creates a new continuous interval after the intervening session is closed; history is never resumed or collapsed.

### Finish a study session

`PATCH /api/v1/student/study-sessions/:id/finish`

Optional request body:

```json
{
  "notes": "مرور فصل سوم",
  "focusRating": 4,
  "studyQualityRating": 5
}
```

All three fields are optional. Ratings are integer raw student self-reports from 1 through 5; finishing never requires feedback. The server resolves session ownership, assigns the finish time, and calculates `durationMinutes`. Only an owned active session can be finished. Foreign sessions return `SESSION_NOT_FOUND`, repeated finishes return `SESSION_ALREADY_FINISHED`, cancelled sessions return `SESSION_ALREADY_CANCELLED`, and a server finish time that is not after the start is rejected as `SESSION_TIME_INVALID`.

### Add or edit finished-session feedback

`PATCH /api/v1/student/study-sessions/:id/feedback`

The strict body accepts at least one of `focusRating` or `studyQualityRating`. Each may be an integer from 1 through 5 or explicit `null` to clear that rating. Only the authenticated owner may edit a finished, non-cancelled session. Active sessions return `SESSION_NOT_FINISHED`; cancelled sessions return `SESSION_ALREADY_CANCELLED`; foreign or missing sessions return `SESSION_NOT_FOUND`. Notes, lifecycle timestamps, relationships, ownership fields, and unknown fields are rejected.

Safe StudySession responses expose both ratings as `number | null`; sessions without feedback return null for each. Active and cancelled sessions have no feedback. Ratings are not task outcomes, counselor evaluations, aggregates, or calculated scores.

### Cancel a live interval

`PATCH /api/v1/student/study-sessions/:id/cancel`

The endpoint accepts only an empty JSON object. It resolves ownership from the authenticated student and sets `cancelledAt` from the server clock while keeping `endedAt` null. Only an active session can be cancelled. Finished, already-cancelled, and foreign/missing sessions return intentional `SESSION_ALREADY_FINISHED`, `SESSION_ALREADY_CANCELLED`, or `SESSION_NOT_FOUND` errors.

Cancellation is persisted recovery metadata, not deletion or task cancellation. The interval remains in history with `durationMinutes: null` and contributes neither completed study minutes nor completed-session count. It never changes the linked `DailyTask`. If some real study should be retained after cancelling a stale timer, the existing manual completed historical-session flow records the accurate interval separately.

The existing completed-session creation routes remain available for compatibility. A task may have zero, one, or multiple sessions; no one-to-one constraint or new execution entity was introduced.

Manual/generic StudySession creation still requires both client timestamps and may record only a completed historical interval with `startedAt < endedAt`; valid optional ratings may accompany that completed interval. It cannot create an open live session or assign `cancelledAt`. Generic updates cannot assign ratings, edit active or cancelled sessions, reopen a finished session, or clear server-owned cancellation metadata. Feedback edits use the focused endpoint. Live start, finish, and cancellation timestamps remain exclusive to the server-backed start, switch, finish, and cancel operations.

Changing a linked `DailyTask` to `COMPLETED`, `PARTIAL`, or `SKIPPED` returns HTTP `409` with `TASK_ACTIVE_SESSION_EXISTS` while that task has an active session. A cancelled session does not block this independent outcome choice. Task rescheduling is blocked by active or finished execution, while cancelled-only history does not block it. No execution endpoint changes `DailyTask.status`.

## Completed assessment attempts

`AssessmentAttempt` is a completed assessment result bundle and is independent of `StudySession`. It has no live start, finish, pause, resume, or cancellation operations. Its question total and elapsed duration are derived from raw counts and timestamps; no score, percentage, or accuracy is calculated.

### Create a completed attempt

`POST /api/v1/student/assessment-attempts`

```json
{
  "title": "آزمون زیست فصل سوم",
  "dailyTaskId": "60000000-0000-4000-8000-000000000001",
  "subjectId": null,
  "topicId": null,
  "startedAt": "2026-09-13T10:30:00.000Z",
  "endedAt": "2026-09-13T11:00:00.000Z",
  "correctCount": 20,
  "incorrectCount": 5,
  "blankCount": 5
}
```

The strict request accepts no student/profile ownership field. The authenticated student's profile is authoritative. A linked task, subject, or topic must belong to that profile; a topic requires its matching subject. When omitted, subject/topic provenance may be derived from an owned linked task. Archived resources cannot receive new attempts.

Both timestamps are required and `endedAt` must be after `startedAt`. Counts are non-negative integers and their sum must be positive. `questionCount` is derived as `correctCount + incorrectCount + blankCount`, and `durationMinutes` is derived from the timestamps. Creation never changes `DailyTask.status` or `plannedTestCount`.

### List and read attempts

```text
GET /api/v1/student/assessment-attempts
GET /api/v1/student/assessment-attempts/:id
```

Lists and reads are owner-scoped. The list supports cursor pagination and an optional `dailyTaskId` filter. Safe responses omit `studentProfileId` and expose the immutable provenance, raw counts, `questionCount`, timestamps, `durationMinutes`, and nullable `invalidatedAt`.

### Correct attempt facts

`PATCH /api/v1/student/assessment-attempts/:id`

The strict body requires at least one of `startedAt`, `endedAt`, `correctCount`, `incorrectCount`, or `blankCount`. Ownership, title, task, subject, topic, creation metadata, and invalidation metadata cannot be changed. The complete updated record must continue satisfying the timestamp and count invariants. Invalidated attempts return `ATTEMPT_INVALIDATED`.

### Invalidate an attempt

`PATCH /api/v1/student/assessment-attempts/:id/invalidate`

The endpoint accepts only an empty object and assigns `invalidatedAt` from the server clock. It does not delete the record or change its linked task. Repeated invalidation returns `ATTEMPT_ALREADY_INVALIDATED`; foreign and missing attempts return `ATTEMPT_NOT_FOUND`.

A valid attempt linked to a task blocks student and counselor rescheduling. Invalidated-only assessment history does not. Assessment creation/invalidation and rescheduling share the authenticated student's PostgreSQL row-lock boundary so concurrent operations produce one serialized result.
