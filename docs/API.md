# Konkourix API

All application routes use the `/api/v1` prefix and the standard success/error envelope. Authentication and authorization are server-owned; browser-supplied roles, owners, and creator identities are never authoritative.

This file documents the currently implemented HTTP contract, including student-owned subject/topic validation and the read-only file-backed Canonical Curriculum runtime.

## Canonical Curriculum reads

### CURRENT IMPLEMENTED STATE

The following authenticated routes are readable by `STUDENT`, `COUNSELOR`, and `ADMIN`:

```text
GET /api/v1/curriculum/scopes
GET /api/v1/curriculum/placements
GET /api/v1/curriculum/representations
GET /api/v1/curriculum/nodes/:id
GET /api/v1/curriculum/nodes/:id/children
GET /api/v1/curriculum/search?q=...
```

The runtime loads the checked-in deterministic artifact generated from `docs/curriculum/CANONICAL_CURRICULUM.md`. It exposes four source scopes, twelve scope/grade placements, all 74 subject placements, and 67 independent detailed source representations. Detailed nodes retain exact raw labels, source locators and order, source-visible depth, nullable source marker metadata, and direct-child counts. Representation metadata does not assert that a detailed tree belongs to a high-level placement unless the source states that relationship unambiguously.

Placement and representation lists use `limit` and `offset`. Node children and search use the same bounded pagination. Limits are 1 through 100, offsets are 0 through 10,000, and search text is required with a maximum length of 100 characters. Search normalization never replaces the returned raw label, and results remain in deterministic source order. Unknown well-formed node IDs return `CURRICULUM_NODE_NOT_FOUND`; malformed IDs and invalid bounds return `VALIDATION_ERROR`.

There is no Curriculum write endpoint, admin Curriculum endpoint, authoring operation, import operation, publication/version workflow, or separate Curriculum permission system.

### TEMPORARY

Historical Prisma Curriculum governance models and their applied PostgreSQL tables remain unused until a separately approved RF4 forward migration. The read API neither reads nor writes those tables.

### APPROVED FUTURE STATE

Product records may reference approved canonical Curriculum nodes in a later milestone. A future Question Bank may also link to existing Curriculum nodes, but remains separate from Curriculum authority. Neither integration is implemented by the current API.

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
      "plannedMinutes": 90,
      "plannedTestCount": 0,
      "description": ""
    }
  ]
}
```

- `title` and a real `YYYY-MM-DD` `scheduledFor` date are required.
- `plannedMinutes` is a non-negative integer up to 1440 and maps to the existing `DailyTask.estimatedMinutes` field. It defaults to `0` when omitted.
- `plannedTestCount` is a non-negative integer persisted on `DailyTask` and defaults to `0`.
- `subjectId`, `topicId`, and `description` are optional. A topic requires a subject and must be an active topic belonging to that active student-owned subject.
- The strict request schema rejects `studentProfileId`, `createdByUserId`, `source`, status/lifecycle timestamps, and all other unknown fields.

The server assigns the URL student after authorization, uses the authenticated user as creator, and sets every task to `source: "COUNSELOR"` and `status: "PENDING"` with empty completion/skip metadata. It validates the full batch before one transactional bulk insert, so a rejected or failed item creates no tasks.

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

Changing a linked `DailyTask` to `COMPLETED` or `SKIPPED` returns HTTP `409` with `TASK_ACTIVE_SESSION_EXISTS` while that task has an active session. A cancelled session does not block this independent outcome choice. Task rescheduling is blocked by active or finished execution, while cancelled-only history does not block it. No execution endpoint changes `DailyTask.status`.

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
