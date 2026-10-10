# Konkourix API Migration Plan

**Status:** LEGACY / SUPPORTING TARGET BLUEPRINT; REVALIDATION REQUIRED
**Last synchronized:** 2026-10-02
**Current baseline:** M19 (`76bc4d7`)
**Contract baseline:** `/api/v1`, standard success/error envelope, server-owned authentication and authorization

This document preserves an M19-era API migration proposal. It does not define product behavior or current sequencing. [PRODUCT_MAP.md](PRODUCT_MAP.md) and [ROADMAP.md](ROADMAP.md) govern, and every proposal here requires revalidation against them before use. It does not change an API contract, reserve final URI names, or authorize implementation.

## Sources of Truth

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DOMAIN_MAP.md](DOMAIN_MAP.md)
- [TARGET_DATABASE_DESIGN.md](database/TARGET_DATABASE_DESIGN.md)
- [PRODUCT_MAP.md](PRODUCT_MAP.md)
- [ROADMAP.md](ROADMAP.md)
- [UI_MIGRATION_PLAN.md](UI_MIGRATION_PLAN.md)
- [API.md](API.md)
- [PROJECT_STATE.md](PROJECT_STATE.md)
- [DECISIONS.md](DECISIONS.md) and the standalone [ADR index](adr/README.md)

Implemented route source under `apps/api/src/routes` is authoritative for the inventory below. `API.md` supplies the detailed behavior documented for newer execution and assessment contracts.

## Migration Dispositions

| Disposition | Meaning |
| --- | --- |
| **RETAIN** | Remains a supported target capability, though response detail may evolve additively. |
| **MODIFY** | Keeps its domain meaning but requires an additive target-era contract or stricter boundary. |
| **COMPATIBILITY** | Remains available for current clients and historical resolution while target workflows are introduced. |
| **DEPRECATE** | Stops receiving new target writes only after client cutover, reconciliation, and rollback proof; removal is a separate decision. |
| **NEW** | Required target contract with no implemented endpoint. |

Deprecation in this plan is not immediate removal and never authorizes deletion or reinterpretation of data.

## 1. Current API Inventory

### Cross-Cutting Contract

- Application routes use `/api/v1`; health routes are additionally registered at root for operational probes.
- Success responses use `{ success, data, requestId }`; errors are centralized and include a request identifier.
- Access tokens authenticate requests; refresh tokens use an HTTP-only cookie scoped to `/api/v1/auth`.
- Request schemas are allowlisted and strict in the implemented product routes.
- The API, not the browser, derives user identity, student ownership, counselor relationship, creator identity, and server-owned lifecycle timestamps.
- Current authorization combines `STUDENT`, `COUNSELOR`, and `ADMIN` roles with ownership or active `StudentCounselor` checks. It does not yet implement curriculum-specific capabilities.

### Operational and Identity

| Method and current path | Purpose | Disposition |
| --- | --- | --- |
| `GET /health/live`, `GET /api/v1/health/live` | Process liveness | **RETAIN** |
| `GET /health`, `GET /api/v1/health` | Database-aware readiness | **RETAIN** |
| `POST /api/v1/auth/register` | Free user registration foundation | **RETAIN** |
| `POST /api/v1/auth/login` | Login and refresh-cookie issuance | **RETAIN** |
| `POST /api/v1/auth/refresh` | Rotating refresh session | **RETAIN** |
| `POST /api/v1/auth/logout` | Current-session logout | **RETAIN** |
| `POST /api/v1/auth/logout-all` | Revoke all sessions | **RETAIN** |
| `POST /api/v1/auth/change-password` | Password change and reauthentication | **RETAIN** |
| `GET /api/v1/auth/me` | Authenticated account identity | **RETAIN** |
| `GET /api/v1/student/session` | Student role-boundary verification | **RETAIN** during current shell compatibility; later consolidation requires client review |
| `GET /api/v1/counselor/session` | Counselor role-boundary verification | **RETAIN** during current shell compatibility; later consolidation requires client review |

### Profiles and Relationships

| Method and current path | Purpose | Disposition |
| --- | --- | --- |
| `GET/PATCH /api/v1/me/student-profile` | Student profile read/upsert | **RETAIN** |
| `GET/PATCH /api/v1/me/counselor-profile` | Counselor profile read/upsert | **RETAIN** |
| `GET /api/v1/me/counselor-relationships` | Student relationship list | **RETAIN** |
| `GET /api/v1/me/student-relationships` | Counselor relationship list | **RETAIN** |
| `POST /api/v1/admin/student-counselor-relationships` | Direct administrative relationship creation | **COMPATIBILITY**; target acquisition must not fabricate invitation/request/introduction history |
| `PATCH /api/v1/admin/student-counselor-relationships/:relationshipId` | Administrative relationship status update | **MODIFY** when audited target relationship transitions are approved |
| `GET /api/v1/counselor/students` | Active assigned-student list | **RETAIN** |
| `GET /api/v1/counselor/students/:id` | Active assigned-student detail | **RETAIN** |

### Transitional Curriculum, Student Planning, and Tasks

| Method and current path | Purpose | Disposition |
| --- | --- | --- |
| `GET/POST /api/v1/student/subjects` | List/create student-owned `StudySubject` | **COMPATIBILITY**, then **DEPRECATE** new writes after canonical workflow cutover |
| `GET/PATCH /api/v1/student/subjects/:id` | Read/update/archive legacy subject | **COMPATIBILITY** for historical and transitional use |
| `GET/POST /api/v1/student/subjects/:subjectId/topics` | List/create student-owned `Topic` | **COMPATIBILITY**, then **DEPRECATE** new writes |
| `GET/PATCH /api/v1/student/topics/:id` | Read/update/archive legacy topic | **COMPATIBILITY** |
| `GET/POST /api/v1/student/study-plans` | List/create student-owned `StudyPlan` | **COMPATIBILITY**; not converted into counselor publication history |
| `GET/PATCH /api/v1/student/study-plans/:id` | Read/update current StudyPlan | **COMPATIBILITY** until approved personal-planning replacement exists |
| `GET/POST /api/v1/student/daily-tasks` | List/create owned DailyTasks | **MODIFY** additively for target personal Tasks; current contract stays during transition |
| `GET/PATCH /api/v1/student/daily-tasks/:id` | Read/update Task and current lifecycle fields | **COMPATIBILITY** while Task Result becomes authoritative for new target result writes |
| `PATCH /api/v1/student/daily-tasks/:id/schedule` | Reschedule eligible personal Task | **RETAIN** for personal Tasks with target provenance/lock validation |
| `GET /api/v1/counselor/students/:studentProfileId/subjects` | Read assigned student's legacy subjects | **COMPATIBILITY**, then **DEPRECATE** from target Plan authoring |
| `GET /api/v1/counselor/students/:studentProfileId/subjects/:subjectId/topics` | Read assigned student's legacy topics | **COMPATIBILITY**, then **DEPRECATE** from target Plan authoring |
| `GET /api/v1/counselor/students/:studentProfileId/tasks` | Read assigned student's Tasks | **MODIFY** into source-preserving target/legacy execution reads |
| `POST /api/v1/counselor/students/:studentProfileId/tasks` | Create immediate counselor Task | **COMPATIBILITY**, then **DEPRECATE** after atomic Plan publication cutover |
| `POST /api/v1/counselor/students/:studentProfileId/tasks/batch` | Atomic batch creation of immediate counselor Tasks | **COMPATIBILITY**, then **DEPRECATE** after Plan draft/publication cutover |
| `PATCH /api/v1/counselor/students/:studentProfileId/tasks/:taskId/schedule` | Directly reschedule eligible counselor Task | **COMPATIBILITY**, then **DEPRECATE** for target counselor intention; revisions replace this behavior |

### Execution and Goals

| Method and current path | Purpose | Disposition |
| --- | --- | --- |
| `GET/POST /api/v1/student/study-sessions` | List/manual completed-session creation | **RETAIN** with additive exact curriculum provenance later |
| `POST /api/v1/student/daily-tasks/:taskId/sessions` | Create completed historical Task-linked session | **RETAIN** |
| `POST /api/v1/student/tasks/:id/start` | Start or safely recover Task execution | **RETAIN** |
| `POST /api/v1/student/tasks/:id/switch` | Atomically finish/cancel current interval and switch | **RETAIN** |
| `GET /api/v1/student/study-sessions/active` | Restore active Study Session | **RETAIN** |
| `GET/PATCH /api/v1/student/study-sessions/:id` | Read/update permitted generic session facts | **RETAIN** with current lifecycle restrictions |
| `PATCH /api/v1/student/study-sessions/:id/finish` | Server-finish active session | **RETAIN** |
| `PATCH /api/v1/student/study-sessions/:id/feedback` | Edit finished-session focus/quality feedback | **RETAIN**; never becomes Task Result or mastery |
| `PATCH /api/v1/student/study-sessions/:id/cancel` | Persist cancellation of active interval | **RETAIN** |
| `GET/POST /api/v1/student/goals` | List/create Student Goals | **COMPATIBILITY**; target canonical Goal design is outside approved scope |
| `GET/PATCH /api/v1/student/goals/:id` | Read/update Student Goal | **COMPATIBILITY** |

### M19 Assessment Evidence

| Method and current path | Purpose | Disposition |
| --- | --- | --- |
| `POST /api/v1/student/assessment-attempts` | Record a completed aggregate assessment bundle | **COMPATIBILITY**, then stop generic target writes according to ADR-040 |
| `GET /api/v1/student/assessment-attempts` | Owner-scoped legacy assessment history | **RETAIN** as labelled legacy evidence |
| `GET /api/v1/student/assessment-attempts/:id` | Read one legacy attempt | **RETAIN** |
| `PATCH /api/v1/student/assessment-attempts/:id` | Correct permitted legacy facts | **COMPATIBILITY** under long-term ADR-040 policy |
| `PATCH /api/v1/student/assessment-attempts/:id/invalidate` | Soft-invalidate legacy evidence | **RETAIN** under long-term ADR-040 policy |

## 2. Target API Domains

| API domain | Ownership and boundary | Roadmap gate |
| --- | --- | --- |
| Identity and Access | Users, sessions, authentication, roles/capabilities; authorizes but does not own educational facts | Existing foundation; capability expansion per domain |
| Profiles and Counselor Relationships | Student/counselor profiles, active relationship authorization, later acquisition lifecycle | Existing plus Supporting Lane A |
| Canonical Curriculum | Published reference reads; draft/import/review/publication/mapping/audit commands | Phase 1 |
| Student Progress | Student/version/node overlay and append-only events/evidence | Phase 2; ADR-035 |
| Counselor Planning | Draft revisions, blocks/items, validation, diff, atomic publication, history | Phase 3 |
| Daily Reality | Student-owned draft/publication and counselor read-only snapshot consumption | Phase 3 |
| Tasks and Task Results | Personal/plan-materialized intention, execution-facing reads, separate student result revisions | Phase 3 |
| Study Execution | Study Session lifecycle and feedback | Existing; additive provenance in Phase 3 |
| Practice | Draft/record/correct/invalidate aggregate or governed-question practice | Phase 4; ADR-040 |
| Question Bank | Versioned content, multi-node classification, rights, moderation, publication | Phase 5 |
| External Exam Reports | Provider-owned evidence reporting and counselor review | Phase 6; ADR-042 |
| Internal Online Exams | Authoring/publication, eligibility, delivery, answers, evaluation, results | Phase 6 |
| Communication and Counselor Ecosystem | Chat, Tickets, Suggestions, acquisition, private notes | Supporting Lane A after Phase 3 |
| Reporting | Source-preserving, versioned, freshness-aware queries only | Phase 7 |

## 3. Required New Endpoint Families

The paths below are proposed contract namespaces. Required behavior and separation are authoritative; exact URI spelling, pagination, filters, representations, idempotency mechanism, and status codes require a phase-specific API review.

### Phase 1 — Canonical Curriculum

| Proposed operation | Required behavior |
| --- | --- |
| `GET /api/v1/curriculum/versions/current` | Resolve the current published version; never fall back from an explicitly requested historical version |
| `GET /api/v1/curriculum/versions/:versionId` | Read published/superseded version metadata allowed to the caller |
| `GET /api/v1/curriculum/versions/:versionId/nodes` | Ordered tree/children query with exact source labels and version context |
| `GET /api/v1/curriculum/versions/:versionId/nodes/:nodeId` | Read the exact version/node pair, path, type, status, and allowed relationships |
| `GET /api/v1/curriculum/versions/:versionId/search` | Search normalized discovery data but return exact labels and ancestry; names never establish identity |
| Admin draft-version create/read commands | Create a draft from an approved base or initial source; no direct published mutation |
| Admin draft-node and relationship commands | Add/change/move/order/deprecate only inside drafts with reason/provenance and concurrency control |
| Admin import create/status/report/source-record/issue queries | Idempotent import, immutable provenance, accepted/unchanged/ambiguous/rejected counts, quarantine visibility |
| Admin import-issue resolution commands | Record an authorized decision; never let the importer guess ownership or identity |
| Admin validation/review-decision commands | Validate structure, identity, order, lineage, references, and unresolved blockers; separate review from publication |
| Admin publish command | Atomically publish one validated version, freeze it, audit actor/reason, and retain prior versions |
| Admin cross-version mapping commands | Create reviewed directional mappings without rewriting either endpoint |
| Admin legacy-mapping queries/decisions | Review StudySubject/Topic mapping states without modifying legacy records or name-only matching |
| Admin curriculum audit queries | Permission-scoped append-only governance history |

### Phase 2 — Student Progress

- Student/version/node Progress reads and permitted event commands.
- Counselor Progress reads scoped to an active relationship.
- Evidence-link reads/commands only for source domains approved by ADR-035.
- Historical-version and reviewed mapping context; no “latest” substitution or automatic mastery endpoint.

### Phase 3 — Planning, Reality, Tasks, and Results

- Daily Reality aggregate, draft block, validate, publish, version/history, and counselor read-only endpoints.
- Counselor Plan aggregate/draft/revision block/item commands, validation, diff, publish, revise-future, published history, and audit reads.
- Atomic and idempotent publication that materializes Tasks or creates neither version nor Tasks.
- Student published-plan and Plan history reads.
- Personal Task creation using an exact eligible curriculum version/node pair.
- Task Result submit, effective read, history, and audited correction commands.
- Target Task/Session reads that disclose legacy versus canonical provenance without changing existing execution semantics.

### Phase 4 — Practice

- Practice draft, record, read/list, correct, invalidate, and immutable revision-history endpoints.
- Optional Task/Session provenance and one-or-more exact curriculum targets.
- Counselor read-only review scoped to active relationships.
- No eligibility, timer, secure delivery, exam submission, or provider-report commands.

### Phase 5 — Question Bank

- Question logical identity/version draft and submission commands.
- Separate educational, answer/solution, rights/attribution, and curriculum-classification review operations.
- Approval, publication, withdrawal/retirement, history, queue, and audit queries.
- Published eligible Question Version consumption separated from protected drafts, keys, solutions, and rights evidence.

### Phase 6 — External Reports and Internal Exams

- External provider reads/admin governance; report draft/record/correct/invalidate; section result/evidence status; counselor review.
- Internal Exam draft/version/section/item, review/publication, eligibility, discover/start/resume, answer-save, submit, attempt state, evaluation/manual review, result release/correction/invalidation.
- Separate route namespaces and services; no External Report operation uses Internal Attempt semantics.

### Supporting Lane A — Communication and Counselor Ecosystem

- Relationship Chat conversation/history/send/retry commands.
- Ticket create/read/thread/status-transition/participant operations.
- Suggestion intake/read/timeline/review/decision operations.
- Invitation, request, admin review/introduction, and student selection operations; no automatic match endpoint.
- Counselor-owned Private Note create/read/archive/supersede and narrowly authorized audit access outside unified inbox APIs.

### Phase 7 — Reporting

- Student learning timeline, curriculum Progress report, Plan-versus-execution, and assessment evidence timeline queries.
- Every query exposes period, source coverage, source kind/ID, curriculum/calculation version, freshness, and partial-data state where relevant.
- Reports are read-only; no reporting endpoint corrects or mutates source facts.

## 4. Deprecated Endpoint Plan

No endpoint is deprecated merely by publishing this document.

| Current endpoint family | Deprecation trigger | Required retained behavior |
| --- | --- | --- |
| Student Subject/Topic writes | Canonical consumer and every affected target writer are proven; separate Curriculum migration/cutover policy accepted | Historical legacy reads, exact labels, mapping state, and unresolved legacy-only records |
| Counselor legacy Subject/Topic resource reads | Plan node picker and legacy compatibility display are proven | Existing legacy Task display and old links |
| Direct counselor single/batch Task creation | Plan draft/publication/materialization works end to end with rollback | Standalone legacy counselor Tasks remain readable/executable |
| Direct counselor Task schedule mutation | Future-plan revision and lock boundary are authoritative | Historical Task intention and evidence remain unchanged |
| Legacy StudyPlan writes | Approved personal-planning replacement and history adapter exist | Historical StudyPlans remain queryable |
| Direct `DailyTask` result-field mutation | Task Result cutover and reconciliation prove one authority | Legacy status/completion/skip facts remain visible with unknown quality |
| Generic AssessmentAttempt creation | Practice cutover and ADR-040 classification/retention decision | Existing attempt read/correction/invalidation per approved policy |
| Generic Reports placeholders | Target source-preserving report APIs are complete | No API currently exists to remove; UI routes remain hidden until data is ready |

Endpoint retirement requires usage telemetry or an equivalent client inventory, an announced compatibility window, updated Student/Counselor clients, successful reconciliation, and a rollback plan. Physical route removal and data retention are separate decisions.

## 5. Compatibility Strategy

### Expand and Cut Over

1. Add target endpoints without changing current request/response semantics.
2. Add explicit compatibility readers that identify `canonical`, `legacy`, `mapped`, `ambiguous`, or `unmapped` provenance.
3. Populate only from confirmed source identity or reviewed mapping; never infer from normalized names, titles, counts, or dates.
4. Move one frontend workflow at a time to target writes.
5. Compare target and legacy reads, authorization, counts, failure recovery, and performance.
6. Disable legacy writes only after all known callers have migrated and rollback is proven.
7. Keep historical reads and identifiers for as long as source records require them.

### Contract Rules

- Existing `/api/v1` contracts do not silently change meaning. Additive fields must not cause clients to confuse legacy and target records.
- A target record that references Curriculum returns both `curriculumVersionId` and `curriculumNodeId`; a node ID alone is incomplete.
- Historical requests with an explicit version never fall forward to the current version.
- Unified lists are projections with a required source discriminator, source ID, status vocabulary, and correction/invalidation state.
- Cursor pagination, stable ordering, filter validation, strict request schemas, request IDs, and standard envelopes remain baseline conventions.
- Dual writes are prohibited unless atomicity, retry, idempotency, reconciliation, partial failure, and rollback are explicitly approved.
- Compatibility adapters may compose reads; they never mutate source facts or synthesize publication, mastery, provider, Question, or Exam history.
- A new API version is considered only for an unavoidable breaking contract. It is not a substitute for domain separation or staged migration.

## 6. Authentication and Authorization Impacts

### Retained Security Baseline

- Keep access-token authentication, refresh rotation/reuse defense, session revocation, strict input allowlists, request IDs, redacted logging, security headers, and server-derived ownership.
- Student/counselor application separation is not an authorization boundary.
- Resource non-disclosure remains required for unauthorized student, plan, note, question, exam, attempt, and evidence identifiers.

### Required Capability Expansion

The current role enum is insufficient for target administration. A generic `ADMIN` check must not grant all of the following by implication:

- curriculum edit, import, ambiguity resolution, review, publish, mapping approval, and audit access;
- question submission review, answer-key access, rights evidence, approval, and publication;
- exam authoring, eligibility, delivery operations, manual evaluation, and result correction;
- communication operations, relationship introduction, private-note exceptional access, or security audit.

Before Phase 20 mutation endpoints are implemented, the server-enforced curriculum capabilities and assignment/audit model in [ADR-034](adr/ADR-034-curriculum-governance-and-administrative-permissions.md) must be implemented. Editor, reviewer, publisher, mapper, importer, and auditor capabilities may be combined only according to that governance. UI visibility never supplies permission.

### Domain-Specific Authorization Effects

- Published Curriculum consumer reads are read-only for Students and Counselors; draft/import/provenance/audit data is narrower.
- Progress actor authority waits for ADR-035.
- Plan publication revalidates the active counselor relationship at commit time; reassignment does not transfer drafts silently.
- Daily Reality is student-owned and counselor read-only within relationship/privacy policy.
- Task Results and Practice facts are ordinarily student-authored; counselors read but do not impersonate.
- Question keys/solutions and Exam delivery content have state- and policy-dependent disclosure.
- Private Notes never enter Student or general Communication APIs and require audited exceptional access.

## 7. Frontend Migration Dependency

| Frontend target | Required API readiness |
| --- | --- |
| Curriculum Explorer | Published version/tree/node/path/search; exact labels/order; historical version; retired/unavailable states |
| Curriculum Admin | Draft/import/issues/source/mappings/validation/review/publish/audit plus capability enforcement |
| Student Progress | Progress state/history/evidence with ADR-035 authority and historical curriculum resolution |
| Student Today/Plan | Published Plan/Task reads, active execution recovery, Task Result, compatibility provenance |
| Counselor Planning | Student context, Reality snapshot, draft/revision/diff/validate/publish/history, atomic materialization, concurrency conflicts |
| Practice & Exams | Explicit capability discovery and distinct Practice/External/Internal contracts; labelled legacy history |
| Messages/Inbox | Separate Chat/Ticket/Suggestion contracts and unread projection without merged lifecycle |
| Reports | Source-preserving queries, freshness, partial state, calculation version, authorized drill-down |

Frontend work may prototype earlier, but it must not ship a target destination before all required API, database, authorization, compatibility, accessibility, and recovery behavior is ready. Current clients remain on current contracts until the corresponding target workflow passes its roadmap exit gate.

## API Migration Exit Criteria

For each endpoint family:

- ownership and lifecycle belong to one bounded domain;
- authorization is tested independently of frontend visibility;
- strict inputs reject owner, role, publication state, and server-owned timestamps where applicable;
- idempotency/concurrency behavior is explicit for publication, import, correction, send, answer-save, and submission operations;
- legacy clients and records remain supported through the declared compatibility window;
- historical version and source provenance resolve without “latest” substitution;
- errors distinguish validation, conflict, authorization, missing/hidden resource, and recoverable operational failure without data leakage;
- contract, authorization, integration, migration, resilience, and frontend end-to-end tests pass;
- documentation identifies the exact cutover, deprecation, rollback, and retained-history behavior.
