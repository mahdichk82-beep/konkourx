# Phase 20 Implementation Contract — Canonical Curriculum Foundation

**Status:** HISTORICAL / SUPERSEDED by Recovery Foundation 1 and 2; not active authority
**Contract date:** 2026-09-18
**Starting baseline:** M19 (`76bc4d7`)
**Roadmap alignment:** Roadmap V2 Phase 1 after Phase 0 readiness gates

This document records the former Phase 20 execution boundary. It is retained for history and must not guide the replacement Curriculum runtime.

This document defines intended future work only. It creates no code, Prisma model, migration, API implementation, UI, test, import run, permission grant, or database change.

## Authority and Change Control

This contract is derived from:

- [PRODUCT_VISION.md](PRODUCT_VISION.md)
- [DOMAIN_MAP.md](DOMAIN_MAP.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md)
- [ADR-033](adr/ADR-033-curriculum-persistence-and-composite-references.md)
- [ADR-034](adr/ADR-034-curriculum-governance-and-administrative-permissions.md)
- [TARGET_DATABASE_DESIGN.md](database/TARGET_DATABASE_DESIGN.md)
- [PHASE_20_IMPLEMENTATION_SPEC.md](PHASE_20_IMPLEMENTATION_SPEC.md)

The ADRs govern persistence, identity, immutability, governance, and permission semantics. This contract narrows them into a Phase 20 delivery boundary. It does not supersede them.

A contract change requires an explicit documentation review before code changes. A change affecting identity, ownership, published immutability, permission boundaries, legacy interpretation, or lifecycle requires an ADR update or new ADR. Implementation convenience is not authority to change this contract.

Approval of this contract satisfies the Phase 20 foundation migration-policy definition only: additive Curriculum storage, mapping registry behavior, coexistence, reconciliation, and rollback. Disabling legacy writes or backfilling target references into existing product records remains a later, separately authorized cutover.

## 1. Exact Scope of Phase 20

Phase 20 delivers one bounded domain: **Canonical Curriculum Foundation**.

### Required Deliverables

1. Additive persistence for Curriculum versions, stable logical nodes, version-scoped node revisions, node types, non-owning relationships, imports, source records, import issues, validation evidence, review decisions, cross-version mappings, legacy mappings, permission grants, and audit history.
2. A new Canonical Curriculum backend module inside the existing Fastify modular monolith.
3. Explicit Curriculum administrative capabilities that do not derive automatically from `User.role = ADMIN`.
4. A deterministic structured-manifest import path tied to the exact `cori.docx` artifact checksum and reviewed transcription provenance.
5. Exact source-label and source-order preservation, ambiguity quarantine, reproducible validation, and idempotent import behavior.
6. Draft authoring, review decision, and atomic publication workflows with stale-review protection.
7. Immutable published and superseded Curriculum Versions.
8. Authenticated, version-aware, read-only Curriculum queries for Student, Counselor, and authorized Admin consumers.
9. A permission-scoped Curriculum Operations Admin application surface.
10. Minimal read-only Curriculum Explorer surfaces for Student Web and Counselor Web after an approved version is published. These surfaces are browse/search only and are not integrated into Task, Plan, Session, Goal, or Assessment writes.
11. A reviewed legacy mapping registry for `StudySubject` and `Topic`, including proposed, confirmed, ambiguous, and legacy-only decisions without changing legacy rows.
12. Migration rehearsal, reconciliation, observability, backup/restore evidence, rollback controls, security verification, Persian/RTL verification, accessibility acceptance, and production-readiness sign-off.

### Phase Completion Meaning

Phase 20 is not complete when tables or endpoints merely exist. It is complete only when:

- an authorized source manifest has been imported into a draft;
- blocking source ambiguities are resolved or explicitly excluded by authorized decisions;
- the exact reviewed draft is validated, approved, and published atomically;
- published reads and historical-version reads work;
- Admin governance and consumer read-only surfaces work;
- old applications and M19 records still behave correctly;
- rollback can disable all Phase 20 traffic without rewriting or deleting Phase 20 data;
- every acceptance criterion in this contract passes.

## 2. Explicit Out-of-Scope Items

The following are prohibited in Phase 20:

- Student Progress tables, mastery, learning status, notes, evidence, APIs, or UI;
- automatic Progress transfer across Curriculum versions;
- adding `curriculum_version_id` or `curriculum_node_id` to `DailyTask`, `StudySession`, `AssessmentAttempt`, `StudyPlan`, or `StudentGoal`;
- backfilling any existing product record with a canonical reference;
- disabling, changing, or deleting Student Subject/Topic APIs or UI;
- treating a legacy subject/topic mapping as a product-record rewrite;
- versioned Counselor Planning, Plan publication, Task materialization, or Plan history;
- Daily Reality Schedule;
- Task Result or five-level Task learning quality;
- changes to current Task status or Study Session lifecycle/feedback;
- Practice Activity;
- classification or conversion of `AssessmentAttempt` records;
- Question Bank, question media, question responses, rights review, or moderation;
- External Exam Reports, provider identity, report files, or score normalization;
- Internal Online Exams, delivery, timing, answers, evaluation, or results;
- Communication, Tickets, Suggestions, counselor acquisition, or Private Counselor Notes;
- cross-domain reporting, Analytics, ranking, recommendations, AI analysis, or automated diagnosis;
- live/recorded content, schools, subscriptions, billing, marketplace, or post-exam abstractions;
- raw DOCX parsing that guesses structure from formatting;
- inventing missing curriculum labels, types, parents, levels, relationships, prerequisites, objectives, weights, aliases, or marker semantics;
- automatic identity matching from normalized labels, paths, sibling position, or similar text;
- a generic unrestricted Admin panel;
- microservices, a second database, message queues, or new deployment topology;
- editing, squashing, renaming, deleting, or replacing any applied migration;
- dropping or modifying an M19 table, column, constraint, index, enum, or stored row;
- a production legacy-write cutover.

If an implementation task requires any item above, it stops and requests a contract change rather than absorbing the work.

## 3. Database Tables to Add

Phase 20 adds exactly the following fourteen tables. Names are normative for this contract. A physical review may refine index or constraint names, but may not merge these lifecycles into generic tables.

### Curriculum Identity and Version Tables

| Table | Required purpose and fields | Required constraints |
| --- | --- | --- |
| `curriculum_versions` | Version identity; `version_label`; lifecycle status; optional `based_on_version_id`; source summary; monotonic draft revision token; review/publication/supersession actor and time; effective metadata; created/updated metadata | Status is `DRAFT`, `IN_REVIEW`, `PUBLISHED`, or `SUPERSEDED`; published/superseded snapshot fields are immutable; base version is retained; current-published selection is unambiguous |
| `curriculum_node_types` | Stable controlled structural codes, display metadata, active state, and approved parent-policy metadata | Codes are unique and immutable after use; Phase 20 codes are `CURRICULUM_ROOT`, `FIELD`, `GRADE`, `SUBJECT`, `CHAPTER`, `TOPIC`, `CONCEPT`, `SUBCONCEPT` |
| `curriculum_nodes` | Opaque logical Node identity, creation metadata, optional identity note and tombstone metadata | ID is never derived from label/path/order and never reused; published use prevents hard deletion |
| `curriculum_node_revisions` | Exact representation of one logical Node in one Version: version ID, node ID, type, same-version parent, exact display/source label, separate search value, sibling position, availability state, deprecation reason, provenance metadata | Unique `(curriculum_version_id, curriculum_node_id)`; parent resolves within the same version; one canonical parent; deterministic sibling order; published rows immutable |
| `curriculum_node_relationships` | Approved non-owning relationship or lineage metadata between exact version/node endpoints, type, status, rationale, actor/time | Both endpoints are complete version/node pairs; cannot create a second canonical parent; no name-derived relationship; published/approved history retained |

Node availability supports `ACTIVE`, `DEPRECATED`, and `RETIRED`. Draft status belongs to the Curriculum Version, not the Node's published availability.

### Import and Governance Tables

| Table | Required purpose and fields | Required constraints |
| --- | --- | --- |
| `curriculum_imports` | One import run: target draft, manifest version/checksum, source artifact name/SHA-256, transcription checksum, idempotency key, importer, status, counts, report payload/reference, start/completion/failure metadata | Target must be editable draft; same target plus idempotency identity does not duplicate; completed source identity/counts/report are immutable; import cannot publish |
| `curriculum_source_records` | Lossless input provenance: import, stable source-record key, exact raw text/label, locator, order, proposed structural hints, checksum, disposition, optional matched node | Unique source-record key per import; raw text/checksum/locator/import are immutable; original text survives any resolution |
| `curriculum_import_issues` | Quarantined issue: import/source record, code, severity, details, blocking flag, current disposition, effective resolution reference, resolution actor/time | Original finding is immutable; resolution is append/audit driven; unresolved blocking issue prevents publication |
| `curriculum_validation_runs` | Immutable validation evidence tied to exact Version revision token: initiator, status, blocker/warning counts, result payload/reference, started/completed times | A completed run cannot be edited; publication requires a passing run for the current unchanged draft revision |
| `curriculum_review_decisions` | Immutable review submission/decision evidence: version, exact draft revision token and validation run, reviewer, decision, findings/reason, decided time, invalidation metadata | Decision is `APPROVED`, `CHANGES_REQUESTED`, or `REJECTED`; material change makes approval ineffective without deleting it; publication requires current approval |
| `curriculum_audit_logs` | Append-only governance trail: actor, effective capability, action/outcome, target kind/ID, version/node/import/mapping/grant context, reason, before/after or integrity reference, request ID, occurred time | Append-only; no ordinary update/delete; separate authorization for read; not a substitute for import/validation/review source facts |

Import status is `CREATED`, `VALIDATING`, `COMPLETED`, or `FAILED`. A failed run and its safe diagnostics remain retained.

### Mapping and Authorization Tables

| Table | Required purpose and fields | Required constraints |
| --- | --- | --- |
| `curriculum_node_mappings` | Directional cross-version mapping with exact from/to pairs, mapping type, status, confidence/rationale, approval and supersession metadata | Supports one-to-many/many-to-one; approved mapping immutable; correction supersedes; never rewrites endpoints |
| `legacy_curriculum_mappings` | Decision record for one `StudySubject` or `Topic`: legacy kind/ID, optional exact canonical pair, decision state, rationale, reviewer, supersession metadata | No normalized-name-only confirmation; no update to legacy record; approved correction supersedes; absence is reported as `UNMAPPED` |
| `curriculum_capability_grants` | Explicit grant to an active existing `ADMIN`: capability code, global Curriculum scope, grant actor/reason/time, optional expiry for exceptional access, revocation actor/reason/time | No implicit grant from role; no active duplicate grant; self-grant prohibited; revocation retained; grant/revoke is audited atomically |

Phase 20 legacy decision states are `PROPOSED`, `CONFIRMED`, `AMBIGUOUS`, and `LEGACY_ONLY`; a legacy row with no effective decision is `UNMAPPED` in query results. Mapping does not backfill consumers.

Phase 20 capability codes are exactly:

- `CURRICULUM_DRAFT_READ`
- `CURRICULUM_DRAFT_EDIT`
- `CURRICULUM_IMPORT_OPERATE`
- `CURRICULUM_SOURCE_READ`
- `CURRICULUM_ISSUE_RESOLVE`
- `CURRICULUM_REVIEW_DECIDE`
- `CURRICULUM_PUBLISH`
- `CURRICULUM_MAPPING_APPROVE`
- `CURRICULUM_AUDIT_READ`
- `CURRICULUM_PERMISSION_MANAGE`

Only global Curriculum scope is implemented in Phase 20. The table must permit later additive scope refinement without pretending that organization/version-scoped behavior already exists.

### Cross-Table Publication Invariants

- Publication validates one exact version revision token, passing validation run, effective approval, and no unresolved blocking issues.
- Publication makes the full Version visible atomically; partial Node visibility is impossible.
- Publishing a successor supersedes the previous current version without changing its Node snapshot.
- Published/superseded Versions, Node Revisions, relationships, completed imports, validation runs, review decisions, mappings, and audit facts use restrictive deletion.
- Every actor reference is server-derived from an authenticated user or approved bootstrap identity.
- Search normalization is derived data and never replaces exact source/display text.

## 4. Database Tables That Must Not Change

Phase 20 must make no physical or semantic change to these M19 tables:

| Frozen table | Prohibited Phase 20 change |
| --- | --- |
| `users` | No new role, column, role reinterpretation, or automatic capability flag |
| `auth_sessions` | No lifecycle, token, cookie, or retention change |
| `student_profiles` | No Curriculum or Progress field |
| `counselor_profiles` | No Curriculum-authority field |
| `student_counselor_relationships` | No Curriculum permission or acquisition change |
| `study_subjects` | No rename, merge, archive, canonical ID, constraint, index, or data rewrite |
| `study_topics` | No rename, merge, archive, canonical ID, constraint, index, or data rewrite |
| `study_plans` | No Plan-version or Curriculum field |
| `daily_tasks` | No Curriculum pair, Task Result, activity type, expected outcome, or provenance change |
| `study_sessions` | No Curriculum pair, lifecycle, rating, or Task behavior change |
| `assessment_attempts` | No classification, Curriculum pair, provider, Practice, Question, or Exam field |
| `student_goals` | No Curriculum pair or canonical Goal redesign |

New tables may reference existing `users`, `study_subjects`, and `study_topics` primary keys with restrictive foreign keys. Such inbound references do not authorize changing the referenced table or cascade-deleting its rows.

All existing enums, API behavior, stored values, migration history, and generated semantics remain compatible. An additive Prisma relation field that does not alter an existing physical table still requires review but may not change current behavior.

## 5. Backend Modules to Create

Phase 20 stays inside `apps/api` and follows the current service/store/Prisma-store modular-monolith pattern.

### Canonical Curriculum Domain Module

Create `apps/api/src/curriculum/` with these explicit responsibilities:

| Module responsibility | Required boundary |
| --- | --- |
| Domain types and lifecycle | Version, Node, revision, relationship, import, issue, validation, review, mapping, and audit vocabulary |
| Service/command layer | Draft mutation, import, resolution, validation, review, publication, mapping, and permission commands |
| Query layer | Published tree/node/path/search and protected Admin queries |
| Store interfaces | Domain-oriented persistence ports; no Fastify or Prisma types in domain service contracts |
| Prisma stores | Persistence and transaction implementation; no route-level direct Prisma access |
| Publication policy | One transaction for lifecycle checks, exact-review verification, supersession, publication, and audit |
| Validation policy | Deterministic hierarchy, identity, provenance, mapping, and publication blocker checks |
| Import manifest/parser | Strict structured-manifest validation; no raw DOCX inference |
| Compatibility resolver | Legacy mapping status and exact-label resolution without writing legacy tables |
| Permission policy | Capability checks, grant/revoke rules, state-aware authorization, bootstrap guard |

The module may use internal files/subdirectories, but it remains one Canonical Curriculum bounded domain. It must not become a generic content or administration module.

### Transport Modules

Create:

- `apps/api/src/routes/curriculum.ts` for authenticated published read-only endpoints;
- `apps/api/src/routes/admin-curriculum.ts` for capability-protected administration endpoints;
- `apps/api/src/schemas/curriculum.ts` for consumer transport validation;
- `apps/api/src/schemas/admin-curriculum.ts` for strict administrative transport validation.

Register them under the existing `/api/v1` Fastify application. Existing route plugins remain unchanged in meaning.

### Admin Frontend Boundary

Create a separate `apps/admin-web` React/TypeScript/Vite application for permission-scoped administration. Curriculum administration must not be embedded in Student Web or Counselor Web. Phase 20 does not define a production hostname, TLS, deployment, or broader Admin modules; those require infrastructure approval before production exposure.

The application contains only authentication/session handling, a capability-aware shell, Curriculum Operations, and required account/logout behavior. It is not a generic Admin panel.

### Consumer Frontend Boundary

Student Web and Counselor Web receive read-only Curriculum Explorer modules backed only by published endpoints. They must not reuse the editable legacy Subject/Topic component as a mutation UI and must not expose Curriculum selection inside current operational forms.

## 6. API Endpoints

All endpoints use `/api/v1`, the existing success/error envelope, request IDs, strict schemas, server-derived actor identity, and existing authentication/session behavior. Exact identifiers are opaque UUIDs. Administrative commands require an explicit `reason` where specified and an optimistic concurrency token for draft mutation.

### Published Consumer Endpoints

| Method and path | Purpose | Authorization |
| --- | --- | --- |
| `GET /api/v1/curriculum/versions/current` | Current published Version metadata | Authenticated `STUDENT`, `COUNSELOR`, or `ADMIN` |
| `GET /api/v1/curriculum/versions/:versionId` | Exact published/superseded Version metadata | Same; never substitutes current |
| `GET /api/v1/curriculum/versions/:versionId/roots` | Ordered root representations | Same |
| `GET /api/v1/curriculum/versions/:versionId/nodes/:nodeId` | Exact node representation and permitted relationship summary | Same |
| `GET /api/v1/curriculum/versions/:versionId/nodes/:nodeId/children` | Cursor-paginated ordered children | Same |
| `GET /api/v1/curriculum/versions/:versionId/nodes/:nodeId/path` | Ordered ancestor path in exact Version | Same |
| `GET /api/v1/curriculum/versions/:versionId/search` | Bounded search returning exact label, type, state, ID, and distinguishing ancestry | Same |

Consumer responses always include `curriculumVersionId` and `curriculumNodeId`. They never expose draft data, import/source evidence, issue resolution, review findings, grant records, or audit payloads. Anonymous access is out of scope.

### Capability Grant Endpoints

| Method and path | Purpose | Required capability |
| --- | --- | --- |
| `GET /api/v1/admin/curriculum/capability-grants` | List active/revoked grants with filters | `CURRICULUM_PERMISSION_MANAGE` |
| `POST /api/v1/admin/curriculum/capability-grants` | Grant one allowed capability to an active `ADMIN` with reason | `CURRICULUM_PERMISSION_MANAGE` |
| `POST /api/v1/admin/curriculum/capability-grants/:grantId/revoke` | Revoke an active grant with reason | `CURRICULUM_PERMISSION_MANAGE` |

Self-grant is rejected. A grantee cannot revoke the grant that supplies their own sole permission-management authority. Initial bootstrap uses the one-time operational command defined under Permission Checks, not a role-only HTTP exception.

### Version, Node, and Relationship Endpoints

| Method and path | Purpose | Required capability |
| --- | --- | --- |
| `GET /api/v1/admin/curriculum/node-types` | Read controlled Node Types | Any Curriculum Admin capability |
| `GET /api/v1/admin/curriculum/versions` | List all version states | `CURRICULUM_DRAFT_READ` or stronger relevant capability |
| `POST /api/v1/admin/curriculum/versions` | Create initial draft or derive from a published base | `CURRICULUM_DRAFT_EDIT` |
| `GET /api/v1/admin/curriculum/versions/:versionId` | Read protected draft/governance overview | `CURRICULUM_DRAFT_READ` or action-specific capability |
| `PATCH /api/v1/admin/curriculum/versions/:versionId` | Edit allowed draft metadata using expected revision and reason | `CURRICULUM_DRAFT_EDIT` |
| `GET /api/v1/admin/curriculum/versions/:versionId/roots` | Read draft/published roots | `CURRICULUM_DRAFT_READ` |
| `POST /api/v1/admin/curriculum/versions/:versionId/nodes` | Create one draft Node/revision | `CURRICULUM_DRAFT_EDIT` |
| `GET /api/v1/admin/curriculum/versions/:versionId/nodes/:nodeId` | Read protected Node/provenance/governance detail | `CURRICULUM_DRAFT_READ` |
| `PATCH /api/v1/admin/curriculum/versions/:versionId/nodes/:nodeId` | Correct label/metadata, move, reorder, or change draft availability using expected revision and reason | `CURRICULUM_DRAFT_EDIT` |
| `DELETE /api/v1/admin/curriculum/versions/:versionId/nodes/:nodeId` | Hard-delete only an unpublished, unreferenced draft Node under tombstone/reason rules | `CURRICULUM_DRAFT_EDIT` |
| `GET /api/v1/admin/curriculum/versions/:versionId/relationships` | List protected relationships | `CURRICULUM_DRAFT_READ` |
| `POST /api/v1/admin/curriculum/versions/:versionId/relationships` | Create a draft relationship with exact endpoints/rationale | `CURRICULUM_DRAFT_EDIT` |
| `PATCH /api/v1/admin/curriculum/versions/:versionId/relationships/:relationshipId` | Correct permitted draft relationship fields | `CURRICULUM_DRAFT_EDIT` |
| `DELETE /api/v1/admin/curriculum/versions/:versionId/relationships/:relationshipId` | Remove unapproved draft relationship with reason | `CURRICULUM_DRAFT_EDIT` |

No endpoint edits or deletes published/superseded content. No generic status PATCH publishes a Version.

### Import and Issue Endpoints

| Method and path | Purpose | Required capability |
| --- | --- | --- |
| `GET /api/v1/admin/curriculum/versions/:versionId/imports` | List import runs for a draft | `CURRICULUM_IMPORT_OPERATE`; source detail still requires source-read capability |
| `POST /api/v1/admin/curriculum/versions/:versionId/imports` | Validate and execute one complete structured-manifest import synchronously and idempotently | `CURRICULUM_IMPORT_OPERATE` |
| `GET /api/v1/admin/curriculum/imports/:importId` | Import status/count/report summary | `CURRICULUM_IMPORT_OPERATE` |
| `GET /api/v1/admin/curriculum/imports/:importId/source-records` | Paginated exact source records | `CURRICULUM_SOURCE_READ` |
| `GET /api/v1/admin/curriculum/imports/:importId/issues` | Filtered ambiguity/validation issue queue | `CURRICULUM_ISSUE_RESOLVE` or `CURRICULUM_REVIEW_DECIDE` |
| `POST /api/v1/admin/curriculum/imports/:importId/issues/:issueId/decisions` | Append resolution/exclusion/more-evidence decision with reason | `CURRICULUM_ISSUE_RESOLVE` |

The import request accepts only the Phase 20 structured JSON manifest and required source/checksum metadata. Raw DOCX upload/parsing and arbitrary archive/media upload are rejected. The endpoint retains a failed run safely and never partially reports success.

### Validation, Review, and Publication Endpoints

| Method and path | Purpose | Required capability |
| --- | --- | --- |
| `POST /api/v1/admin/curriculum/versions/:versionId/validations` | Run deterministic validation for exact current draft revision | `CURRICULUM_DRAFT_READ` |
| `GET /api/v1/admin/curriculum/versions/:versionId/validations` | List validation history | `CURRICULUM_DRAFT_READ` |
| `GET /api/v1/admin/curriculum/validations/:validationId` | Read immutable validation result | `CURRICULUM_DRAFT_READ` |
| `POST /api/v1/admin/curriculum/versions/:versionId/submit-review` | Move exact valid draft revision to `IN_REVIEW` | `CURRICULUM_DRAFT_EDIT` |
| `POST /api/v1/admin/curriculum/versions/:versionId/review-decisions` | Record `APPROVED`, `CHANGES_REQUESTED`, or `REJECTED` with findings/reason | `CURRICULUM_REVIEW_DECIDE` |
| `GET /api/v1/admin/curriculum/versions/:versionId/review-decisions` | Read immutable review history | `CURRICULUM_DRAFT_READ` or `CURRICULUM_REVIEW_DECIDE` |
| `POST /api/v1/admin/curriculum/versions/:versionId/publish` | Atomically publish the exact approved revision and supersede prior current Version | `CURRICULUM_PUBLISH` |

Publication requires an idempotency key, expected revision token, validation ID, review-decision ID, and reason. It returns success only after the transaction commits. A stale, changed, blocked, or partially valid draft returns conflict/validation failure and remains unpublished.

### Mapping and Audit Endpoints

| Method and path | Purpose | Required capability |
| --- | --- | --- |
| `GET /api/v1/admin/curriculum/node-mappings` | Filter cross-version mapping decisions | `CURRICULUM_MAPPING_APPROVE` or `CURRICULUM_AUDIT_READ` |
| `POST /api/v1/admin/curriculum/node-mappings` | Approve/supersede an exact directional mapping with rationale | `CURRICULUM_MAPPING_APPROVE` |
| `GET /api/v1/admin/curriculum/legacy-mappings` | List legacy Subject/Topic rows and effective mapping state | `CURRICULUM_MAPPING_APPROVE` |
| `POST /api/v1/admin/curriculum/legacy-mappings` | Record/supersede a proposed/confirmed/ambiguous/legacy-only decision | `CURRICULUM_MAPPING_APPROVE` |
| `GET /api/v1/admin/curriculum/audit` | Paginated audit query by actor/action/target/version/time | `CURRICULUM_AUDIT_READ` |

Mapping endpoints never mutate either endpoint, change legacy data, or create Progress transfer.

### Common API Requirements

- Lists use bounded cursor pagination and deterministic order.
- Draft mutations use optimistic concurrency; silent last-write-wins is prohibited.
- Search input is bounded and normalized only for lookup; exact labels are returned.
- Strict schemas reject client-supplied actor IDs, lifecycle timestamps, publication state, audit identity, and unknown fields.
- Authorization failures do not disclose protected resource existence.
- Import and publication are idempotent. Ordinary safe reads require no idempotency token.
- Error contracts distinguish validation, stale revision, lifecycle conflict, blocking issue, duplicate idempotency request, forbidden capability, hidden resource, and operational failure.

## 7. Admin UI Screens

The new `apps/admin-web` application contains the following Phase 20 routes/screens and no unrelated administration.

| Route/screen | Required behavior |
| --- | --- |
| `/login` | Existing authentication contract, Admin-role gate, then capability discovery; role alone does not reveal Curriculum content |
| `/curriculum/versions` | Version list with Draft/In Review/Published/Superseded, source, review/publication state, blockers, and permitted actions |
| `/curriculum/versions/new` | Create initial draft or derive from allowed base; exact consequence and source context |
| `/curriculum/versions/:versionId` | Version overview, revision token, import/validation/review/publication readiness, provenance, and audit summary |
| `/curriculum/versions/:versionId/tree` | Tree plus accessible list, breadcrumb, Node inspector, exact source label/order/type/parent/provenance, draft-only editing |
| `/curriculum/versions/:versionId/imports` | Register manifest, show checksum/idempotency, import history, counts, failure and retry behavior |
| `/curriculum/imports/:importId` | Import report and source metadata without implying acceptance/publication |
| `/curriculum/imports/:importId/issues` | Filtered ambiguity queue, exact source evidence, blocking state, append-only resolution actions |
| `/curriculum/versions/:versionId/validation` | Immutable validation runs, exact draft revision, blockers/warnings, links to affected records |
| `/curriculum/versions/:versionId/review` | Submission state, validation evidence, reviewer findings, approve/changes-requested/reject actions; no publish action without capability |
| `/curriculum/versions/:versionId/publish` | Publication preview and explicit confirmation showing exact revision, validation, approval, source, counts, current-version effect, actor, and reason |
| `/curriculum/mappings/cross-version` | Exact endpoint paths/versions, typed direction, rationale, approval/supersession history |
| `/curriculum/mappings/legacy` | StudySubject/Topic inventory, preserved labels, candidate context, UNMAPPED/PROPOSED/CONFIRMED/AMBIGUOUS/LEGACY_ONLY state; no automatic confirm |
| `/curriculum/audit` | Permission-scoped filters and immutable event detail |
| `/curriculum/access` | Grant/revoke explicit Curriculum capabilities, active/revoked history, no self-grant |

### Admin UI Rules

- Navigation is capability-derived; hidden controls do not replace API checks.
- Published mode has no edit/delete affordance.
- Import completion never looks like review approval or publication.
- Draft changes visibly invalidate stale validation/review state.
- High-impact actions show target, actor, reason, version/revision, validation, consequences, and server-confirmed result.
- Long workflows use full pages, not modal-only forms.
- Exact Persian labels are never normalized in display or accessible names.
- The tree has a keyboard/screen-reader list representation and no drag-only editing.
- Loading, empty, stale, partial, conflict, forbidden, failed import, blocked publish, and retry states preserve context and input.
- WCAG 2.2 AA, RTL, zoom/reflow, contrast, focus, reduced motion, and mobile access are release criteria.

### Read-Only Consumer Screens

Student Web and Counselor Web each add a read-only Curriculum Explorer route after publication. The Explorer provides current/historical version context, ordered tree/list, breadcrumbs, exact labels, search with ancestry, and deprecated/retired state. No Progress overlay or curriculum selection for operational writes exists in Phase 20.

## 8. Import Pipeline Workflow

### Accepted Input Contract

Phase 20 imports a reviewed `application/json` manifest, not raw DOCX. The manifest contains:

- manifest schema version;
- canonical source artifact name and SHA-256;
- reviewed transcription identifier and SHA-256;
- one stable source-record key per source record;
- exact raw text and exact proposed display label;
- source locator and source order;
- proposed node type and parent source-record key where reviewed;
- structural hints and explicit ambiguity markers;
- no preassigned canonical identity unless an approved source-registry match exists.

The manifest is a transport of reviewed source transcription, not a new educational authority. `cori.docx` remains the educational source; discrepancies block acceptance and require human review.

### Pipeline

```text
Authenticate Import Operator
    -> authorize target Draft and capability
    -> validate manifest schema, size, checksums, and idempotency key
    -> create Import record
    -> persist immutable source records in exact order
    -> reconcile only through stable source registry/provenance
    -> create or update draft candidates
    -> emit issues for every ambiguity/rejection
    -> validate candidate tree and provenance
    -> commit completed Import and immutable report
    -> human issue resolution
    -> independent validation run
    -> submit exact revision for review
    -> independent review decision
    -> explicit atomic publish
```

### Import Transaction and Failure Rules

- Import registration is retained even if processing fails.
- Candidate Node/revision/relationship changes for one run are atomic: either the run's safe draft changes commit with its completed report, or those candidate changes roll back and the Import becomes `FAILED` with safe diagnostics.
- Reusing the same idempotency identity for the same target and payload returns the original run/result. A changed payload with the same key is rejected.
- Reimporting the same manifest into the same unchanged draft creates no duplicate Nodes, source records, or IDs.
- A retry after a failed run is a new audited attempt linked to the failed run unless the idempotency contract returns the completed original.
- Import never moves a Version to `IN_REVIEW` or `PUBLISHED`.

### Mandatory Quarantine Cases

The pipeline must preserve and quarantine, not solve automatically:

- missing Biology subject boundaries;
- cross-grade thematic trees whose ownership/type is unclear;
- joined Arabic source text;
- undefined `⭐` marker meaning;
- shared Chemistry prose relationship;
- bridging-skills ownership;
- informal field headings;
- omitted intermediate levels or unlabeled branches;
- same/similar labels in different branches;
- any record without a defensible single canonical parent.

## 9. Permission Checks

### General Rules

- Every Admin request first requires authenticated active user status and `User.role = ADMIN`, then the exact active Curriculum capability.
- Existing `ADMIN` grants no Curriculum capability automatically.
- Student/Counselor roles may read eligible published Curriculum only through consumer endpoints.
- Capability and target lifecycle are rechecked at command commit time.
- Capability claims from tokens or request bodies are not authoritative; server persistence is authoritative.
- Revoked/expired grants stop new operations immediately according to server state.
- Service/import identities receive only import-operate scope and never Publisher authority.

### Separation-of-Duty Checks

- Draft edit does not imply review or publish.
- Import operate does not imply source read, issue resolution, review, or publish.
- Issue resolution does not imply edit, review, or publish.
- Review decision does not imply edit or publish.
- Publisher may publish only a currently approved unchanged revision.
- Same-person editor/reviewer/publisher combination requires an explicit recorded exception policy and reason; it is never inferred from multiple grants.
- Mapping approval and permission management are separate from content publication.
- Permission Administrator cannot grant themselves any capability or erase/revoke historical grant evidence.

### Bootstrap Contract

Phase 20 includes one operational bootstrap command, not a public endpoint. It:

1. accepts an existing active `ADMIN` user ID and required reason;
2. requires an explicitly authorized operator context defined in the deployment runbook;
3. refuses to run if an effective `CURRICULUM_PERMISSION_MANAGE` grant already exists;
4. atomically creates the initial Permission Administrator grant and matching audit record;
5. prints no secret or sensitive source content;
6. is idempotent for the exact same target/reason and cannot be reused for ordinary grants.

Direct manual database grants and role-only bootstrap HTTP routes are prohibited.

### Endpoint Capability Matrix Tests

Every Admin endpoint is tested with:

- no authentication;
- inactive account;
- Student role;
- Counselor role;
- Admin with no grant;
- Admin with each unrelated grant;
- Admin with exact grant;
- revoked/expired grant;
- stale lifecycle state;
- forbidden self-action where applicable.

## 10. Migration Strategy

### Pre-Migration Inventory

Before implementation migration work:

- record counts and constraints for all twelve frozen M19 tables;
- inventory every `StudySubject` and `Topic` plus inbound Task/Session/Assessment/Goal references;
- record orphan/null/archived distributions without changing them;
- create production-sized anonymized fixtures;
- verify backup and isolated restore;
- measure expected DDL/index lock behavior;
- confirm the current application passes against the unmodified baseline.

### Additive Migration Sequence

Use new migration files only:

1. **Governance/core migration:** add capability grants, versions, node types, nodes, node revisions, relationships, validation runs, review decisions, and audit logs.
2. **Import/mapping migration:** add imports, source records, issues, cross-version mappings, and legacy mappings.
3. Seed only the eight approved Node Type codes idempotently. No educational node, permission grant, mapping, or published version is seeded by a migration.

The existing application must remain runnable after each migration. Generated Prisma artifacts change only in the authorized implementation checkpoint and are never hand-edited.

### Deployment and Cutover Sequence

1. Back up and verify restore evidence.
2. Apply additive migrations in a rehearsal environment using an M19-sized fixture.
3. Run all current tests and M19 reconciliation with the old workflows still primary.
4. Deploy API code with all Curriculum routes and processing disabled by release control.
5. Run the one-time Permission Administrator bootstrap and verify audit.
6. Enable Admin Curriculum capability for an approved internal cohort.
7. Create the initial draft; import the approved manifest; resolve/exclude blockers; validate; review; publish.
8. Reconcile source counts, hierarchy, order, provenance, permissions, and published resolution.
9. Enable authenticated published-read endpoints.
10. Enable Admin UI and read-only Student/Counselor Explorer surfaces for approved cohorts.
11. Observe and verify before broadening access.

No Phase 20 step disables a legacy API/write or changes current frontend operational forms.

### Legacy Mapping Strategy

- The mapping screen queries every legacy Subject/Topic and left-joins its effective decision; absence displays `UNMAPPED`.
- Candidate suggestions may use provenance/context to assist review but can never confirm a mapping.
- `CONFIRMED` requires Mapping Reviewer action, exact canonical pair, rationale, and audit.
- One legacy record may have multiple explicit confirmed target records only when approved policy and rationale support it.
- Mappings remain interpretive metadata; Phase 20 does not copy them to Tasks, Sessions, Assessments, Plans, or Goals.
- Reconciliation reports count legacy records by effective mapping state and preserve original labels/IDs.

## 11. Testing Requirements

### Domain Unit Tests

- lifecycle transitions and rejected transitions;
- stable logical identity versus new identity for semantic change;
- one-parent/same-version/cycle/orphan/type/order validation;
- published/superseded immutability;
- exact composite reference validation and no latest-version fallback;
- mapping direction/supersession and no endpoint rewrite;
- material-change invalidation of validation/review evidence;
- publication preconditions and blocker aggregation;
- permission/separation-of-duty/bootstrap rules.

### Database and Migration Tests

- both new migrations apply from the exact M19 schema and from a production-sized fixture;
- all frozen-table schemas, constraints, indexes, enums, row counts, and values remain unchanged;
- composite version/node and parent/version integrity;
- deterministic sibling uniqueness/order behavior;
- restrictive deletes and immutable published data enforcement;
- append-only audit/review/validation behavior;
- transaction failure leaves no partial publication or import candidate set;
- old API and frontend validation passes against the expanded schema;
- backup/restore and rollback rehearsals preserve both M19 and Phase 20 data.

### Import Tests

- manifest schema/version/size/checksum validation;
- exact Persian/Arabic/English text, punctuation, digits, diacritics, joined text, whitespace policy, and `⭐` round trip;
- whole-source record coverage and order;
- same-manifest idempotency and changed-payload key conflict;
- stable source registry matching and normalized-name collision quarantine;
- required source-specific ambiguity fixtures;
- atomic candidate changes, retained failed run, safe retry, and reproducible report counts;
- no import-driven review or publication transition.

### API and Authorization Tests

- contract tests for every endpoint, strict body/query/param validation, pagination, ordering, and error codes;
- complete capability matrix described above;
- protected-resource non-disclosure;
- optimistic concurrency and stale-review rejection;
- import and publication idempotency;
- historical version resolution and current-version behavior;
- no draft/source/audit leakage through consumer endpoints;
- request ID, log redaction, security headers, and approved abuse limits.

### UI and Accessibility Tests

- Admin version/import/issue/tree/validation/review/publish/mapping/audit/access screens;
- Student/Counselor read-only Explorer;
- capability-derived navigation and API-denied fallback;
- exact Persian labels and order;
- keyboard, screen reader, visible focus, RTL order, zoom/reflow, contrast, reduced motion, touch targets, and tree list alternative;
- loading, empty, partial, stale, conflict, failure, retry, blocked publication, and server-confirmed success states;
- no edit controls in published mode or consumer applications;
- no Curriculum selector in current Task/Plan/Session/Assessment forms.

### Compatibility and Regression Tests

- authentication, profiles, relationships, Student/Counselor Tasks, Study Sessions, Goals, Assessment Attempts, current Subject/Topic, settings, and current frontend workflows remain unchanged;
- all existing tests pass without rewriting assertions to hide regressions;
- legacy labels/IDs and mapping states remain distinguishable;
- release controls can disable Phase 20 routes/UI while M19 stays operational.

### Performance, Security, and Operations Tests

- production-sized import duration and memory bounds;
- deep-tree children/path/search query latency and N+1 prevention;
- concurrent draft mutation, validation, review, permission revocation, and publication races;
- audit completeness and inability to modify history;
- denial of self-grant, stale grant, and role-only Admin access;
- cache/search version isolation;
- monitoring, alerting, reconciliation mismatch, backup/restore, and rollback drill.

The repository's canonical validation command and all relevant focused suites must pass. No failing or skipped acceptance test may be waived to declare the phase complete.

## 12. Acceptance Criteria

Phase 20 is accepted only when every item is evidenced:

1. Exactly the fourteen approved new tables exist; every frozen M19 table is unchanged.
2. Both additive migrations pass clean-schema and M19-upgrade rehearsals without rewriting history.
3. The eight Node Type codes exist and no educational data was seeded by migration.
4. ADR-034 capabilities are persisted, enforced server-side, revocable, and audited; `ADMIN` alone cannot access Curriculum administration.
5. The initial Permission Administrator was created through the one-time bootstrap contract with audit evidence.
6. The authorized manifest identifies the exact `cori.docx` SHA-256 and reviewed transcription SHA-256.
7. Reimport of the same manifest into the same unchanged draft is idempotent.
8. Exact source labels/text and order round-trip without silent normalization or correction.
9. Every source record is accepted, unchanged, ambiguous, rejected, or explicitly excluded; counts reconcile to the manifest.
10. All mandatory source-specific ambiguities are visible and none was solved by heuristic.
11. The published tree has no cycle, orphan, duplicate logical identity, broken parent, invalid type relation, unresolved blocker, or nondeterministic sibling order.
12. Validation and review evidence refer to the exact published draft revision; stale approval cannot publish.
13. Publication is atomic and idempotent, and the published/superseded snapshot cannot be updated or hard-deleted.
14. Current and explicit historical published reads always return the complete version/node pair and never substitute latest.
15. Student and Counselor accounts can browse eligible published Curriculum and cannot access protected data or mutate it.
16. Admin UI implements all contracted screens with capability-specific actions and server-confirmed state.
17. Student/Counselor Explorer is read-only and not wired into operational write forms.
18. Legacy Subject/Topic mapping states are reviewable without modifying legacy rows or consumers.
19. Every current API, application workflow, M19 row, and historical reference remains operational and unchanged in meaning.
20. Unit, migration, database, import, API, authorization, UI, accessibility, security, performance, regression, backup/restore, and rollback suites pass.
21. Operational monitoring can identify import failure, validation blocker, publication failure, authorization denial, reconciliation mismatch, and read latency without exposing sensitive data.
22. Product, Curriculum/domain experts, security, database, backend, API, frontend, accessibility, and operations owners sign off.
23. No out-of-scope table, endpoint, module, UI integration, data backfill, or behavior is present.

Evidence must reference concrete migration runs, test results, reconciliation reports, screenshots/accessibility results, audit events, and rollback rehearsal. Statements of intent are not acceptance evidence.

## 13. Rollback Strategy

Rollback is stage-aware and preserves history. It never edits an applied migration, deletes published data, or reactivates an incompatible legacy writer because Phase 20 does not disable one.

### Before Migration

- Capture database backup and schema/data inventory.
- Prove isolated restore.
- Do not proceed if frozen-table fingerprints or row counts are unexplained.

### After Additive Migration, Before Target Writes

- Roll back application binaries/release controls while leaving empty additive tables in place.
- If a migration itself fails before production acceptance, restore the verified backup or apply a reviewed forward fix; never rewrite the migration file.
- M19 applications continue because no old table changed.

### After Capability Grants or Imports, Before Publication

- Disable Admin Curriculum routes and UI by release control.
- Revoke non-bootstrap grants if required through audited commands.
- Preserve grants, imports, source records, issues, draft Nodes, validation, review, and audit for investigation.
- Continue all M19 workflows normally.

### After Publication, Before Consumer Rollout

- Disable Admin mutation and published consumer routes/UI.
- Preserve the published Version and all provenance; do not unpublish, mutate, or delete it.
- Correct defects through a later reviewed draft/version after incident resolution.
- Legacy Subject/Topic workflows remain primary and unaffected.

### After Consumer Rollout

- Disable Curriculum Explorer navigation and published-read release control for affected cohorts.
- Invalidate version-keyed caches/search indexes without changing source data.
- Keep M19 operational routes and data active.
- If a later valid published Version exists, changing which Version is current requires an authorized lifecycle operation; it is not an ad hoc rollback query.
- Preserve any user-visible reference to an explicit historical Version if one was created; never repoint it to another Version.

### Database Rollback Limit

Once any Phase 20 data exists, dropping the new tables is prohibited under normal rollback. Database removal requires a separate destructive-retention decision and proof that no published, audit, import, grant, mapping, or external reference exists. Operational rollback means disabling target capability and returning traffic to unchanged M19 behavior while retaining Phase 20 evidence.

### Rollback Acceptance

A successful rehearsal demonstrates:

- all Phase 20 endpoints and screens can be disabled independently;
- M19 login, profiles, relationships, Subjects/Topics, Tasks, Sessions, Goals, Assessments, Student Web, and Counselor Web continue working;
- no frozen table changes;
- no loss of Phase 20 grants, audit, source, draft, mapping, or published data;
- re-enable resumes from authoritative server state without duplicate import or publication;
- monitoring and support can distinguish disabled, failed, and unavailable states.

## Execution Stop Conditions

Implementation must stop and request architecture/product direction if:

- a required educational parent/type/relationship is absent or ambiguous;
- the source artifact or reviewed transcription checksum is not approved;
- an old table must change to make a feature work;
- normalized labels appear to be the only mapping evidence;
- an Admin action cannot be expressed by the contracted capability;
- publication cannot be atomic or cannot bind exact validation/review evidence;
- rollback would require deleting target data or rewriting migration history;
- raw DOCX inference, a queue/microservice, or an out-of-scope domain appears necessary;
- a Student/Counselor operational form would need a canonical write before its later roadmap phase;
- any acceptance criterion would need to be waived.

Phase 21 or any later implementation may begin only after this contract is accepted, Phase 20 is implemented and evidenced in full, and the next dependency receives separate authorization.
