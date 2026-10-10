# Konkourix Implementation Roadmap V2

**Status:** LEGACY / SUPERSEDED IMPLEMENTATION ROADMAP
**Last synchronized:** 2026-10-02
**Implementation baseline:** M19 (`76bc4d7`)
**Planning model:** Dependency-gated; no dates or effort commitments

This file preserves the 2026-09-17 dependency-gated architecture plan as historical context. It no longer governs ordering. [PRODUCT_MAP.md](PRODUCT_MAP.md) defines the current product, and [ROADMAP.md](ROADMAP.md) defines the current implementation sequence. Historical phase gates here do not reopen decisions closed by the Product Map and do not authorize code, schema, migration, API, frontend, deployment, or data changes.

## Historical Inputs

- [PRODUCT_VISION.md](PRODUCT_VISION.md)
- [DOMAIN_MAP.md](DOMAIN_MAP.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- ADR-024 through ADR-032 in [DECISIONS.md](DECISIONS.md)
- the standalone accepted ADRs in [adr/README.md](adr/README.md)
- [TARGET_DATABASE_DESIGN.md](database/TARGET_DATABASE_DESIGN.md)
- [UX_ARCHITECTURE.md](UX_ARCHITECTURE.md)

## Mandatory Critical Path

```text
Curriculum
    -> Student Progress
        -> Counselor Planning
            -> Practice
                -> Question Bank
                    -> Exams
                        -> Analytics
```

Each arrow is a hard delivery gate. A later phase may be designed in more detail, but implementation must not begin until every earlier phase has met its exit criteria in the target environment. Partial backend completion, a hidden frontend, an experimental table, or incomplete migration verification does not count as phase completion.

Communication and counselor-ecosystem capabilities have their own supporting dependency lane after Planning. They do not weaken, bypass, or reorder the educational critical path.

## Phase Completion Standard

A phase is complete only when all of the following apply:

- required ADRs and unresolved policies for that phase are accepted;
- database evolution is additive, deployed, verified, observable, and reversible under the approved rollback plan;
- historical M19 records and current users continue to work;
- backend authorization and domain invariants are enforced independently of frontend visibility;
- API contracts and compatibility behavior are approved and tested;
- student, counselor, and admin surfaces required by the phase meet the target UX, RTL, responsive, state-recovery, and accessibility criteria;
- unit, integration, authorization, migration, contract, end-to-end, accessibility, and relevant performance/resilience tests pass;
- production-readiness evidence covers monitoring, support/recovery behavior, data reconciliation, and rollback;
- product/domain owners sign off against explicit exit criteria.

The next phase remains blocked if any required criterion is waived, deferred, or known to be false.

## 1. Current M19 Baseline

### Repository and Runtime

- pnpm monorepo;
- Fastify API in `apps/api`;
- independent React/TypeScript student and counselor applications in `apps/student-web` and `apps/counselor-web`;
- PostgreSQL with Prisma schema/migrations under `database/prisma`;
- current implementation checkpoint `76bc4d7` (`feat: add assessment attempt foundation`).

### Implemented Domain Foundation

| Domain | M19 implementation |
| --- | --- |
| Identity and access | Users, roles, sessions, student/counselor profiles, active/inactive counselor relationships |
| Transitional curriculum | Student-owned `StudySubject` and `Topic` with archive behavior |
| Planning | Student-owned `StudyPlan`; personal/counselor-attributed `DailyTask`; task lifecycle and planned test count |
| Execution | `StudySession` live, finish, cancellation/recovery, focus, study-quality feedback |
| Assessment | `AssessmentAttempt` completed aggregate counts/timing with soft invalidation |
| Goals | `StudentGoal` optionally linked to legacy subjects |
| Frontends | Student execution/planning/assessment foundations and counselor planning foundations |

### Not Implemented at M19

- Canonical Curriculum storage, governance, import, publication, or legacy mapping;
- Student Progress overlay;
- versioned counselor Plan drafts/publications or atomic Task materialization;
- Daily Reality Schedule;
- separate Task Result revisions and five-level task learning quality;
- Practice Activity domain;
- Question Bank;
- External Exam Report domain;
- Internal Online Exam delivery/evaluation;
- target Communication/Ticket/Suggestion modules;
- target reporting projections or advanced analytics.

M19 `StudySubject`, `Topic`, `StudyPlan`, `DailyTask`, `StudySession`, `AssessmentAttempt`, and `StudentGoal` records are preserved compatibility data. Their existence does not prove target-domain identity or justify inferred backfills.

## 2. Migration Strategy

### Expand, Verify, Cut Over, Retain

Every phase follows this pattern:

1. **Inventory:** record source counts, relationships, orphan conditions, and compatibility assumptions before change.
2. **Decide:** approve required ADRs, ownership, lifecycle, correction, rollback, and security policies.
3. **Expand:** add new structures and optional references without removing or changing current behavior.
4. **Populate deliberately:** import or backfill only when identity/provenance is proven; quarantine ambiguity.
5. **Dual read:** compose target and legacy data through explicit compatibility adapters where needed.
6. **Verify:** reconcile counts, sample histories, authorization, performance, idempotency, and failure recovery.
7. **Cut over writes:** move one approved workflow at a time to the target domain behind observable release controls.
8. **Cut over reads:** make target reads primary only after comparison and rollback evidence.
9. **Disable legacy writes:** only after all writers and recovery paths are proven.
10. **Retain history:** keep legacy rows and identifiers readable for historical resolution; physical removal requires a separate approved retention decision.

### Non-Negotiable Preservation Rules

- Never rewrite an applied migration.
- Never delete or reinterpret historical `StudySession` or `AssessmentAttempt` data.
- Never infer canonical identity from normalized names alone.
- Never invent plan publication, Question responses, provider identity, Task learning quality, mastery, or exam-delivery history.
- Never update an old curriculum reference to “latest.” Every target reference pins curriculum version and node.
- Never merge Practice, External Reports, and Internal Exams into one write model.
- Never use analytics projections as authoritative source records.
- Do not use uncontrolled dual writes. Any proposed dual write requires explicit atomicity, retry, reconciliation, and rollback semantics.

### Compatibility and Release Controls

- Target capabilities remain hidden until their database, API, authorization, UX, and recovery paths are ready.
- Feature/capability rollout may be cohort-based, but cohorts cannot observe partially published curriculum or plans.
- Backfills/imports are resumable and idempotent with immutable run reports.
- Each cutover defines measurable rollback boundaries and how target-era writes remain safe during rollback.
- Read projections retain source kind, source ID, curriculum version, and calculation version.
- Deprecation means “no new writes after verified cutover,” not “drop data.”

## 3. Future Phases Ordered by Dependency

## Phase 0 — Delivery Readiness and Decision Gates

### Goal

Turn the approved logical architecture into implementation-ready slices without changing runtime behavior. Establish the test, migration rehearsal, authorization, observability, rollout, and rollback standards used by every later phase.

### Domains Involved

Architecture governance, security, operations, testing, and compatibility planning across all domains.

### Database Impact

None. Physical schema proposals may be reviewed, but no schema or migration is created in this phase unless separately authorized as Phase 1 work.

### API Impact

None. Proposed contracts and compatibility/versioning rules are documentation artifacts only.

### Frontend Impact

None. Responsive prototypes and state models may be reviewed without modifying the applications.

### Migration Requirements

- inventory M19 tables, row counts, inbound references, orphan/quality conditions, and production-sized test fixtures;
- define backup, restore, reconciliation, rollback, and target-era-write handling;
- accept ADR-034 governance/permission requirements and the separate Curriculum legacy mapping/cutover policy before Phase 1 implementation begins;
- schedule ADR-035, ADR-040, and ADR-042 as hard gates for their respective later phases rather than guessing them early.

### Tests Required

- establish repeatable baseline application/database validation;
- prepare migration rehearsal and reconciliation test harnesses;
- define authorization, accessibility, performance, resilience, audit, and end-to-end acceptance matrices;
- verify a clean restore/recovery rehearsal process before any production data evolution.

### Exit Criteria

- Phase 1 scope and physical design are approved;
- ADR-034 is accepted and Curriculum import/mapping/cutover/rollback policies are accepted;
- M19 preservation inventory is signed off;
- release, observability, migration rehearsal, and rollback templates are ready;
- no unresolved Curriculum blocker is being delegated implicitly to implementation.

## Phase 1 — Canonical Curriculum Foundation

**Entry dependency:** Phase 0 complete.

### Goal

Deliver the controlled, versioned Canonical Curriculum foundation: exact Persian source preservation, stable node identity, imports/provenance, review/publication, cross-version lineage, and non-destructive M19 compatibility.

### Domains Involved

Canonical Curriculum, curriculum administration, legacy `StudySubject`/`Topic` compatibility, security/audit, and read-only Curriculum Explorer foundations.

### Database Impact

- add Curriculum Version, Node Type, logical Node, version-scoped Node Revision, Node Relationship, import/source/issue, mapping, and audit structures from the target database design;
- enforce version/node pair integrity, one canonical parent per version, deterministic sibling order, lifecycle, and immutable publication;
- add reviewed legacy mapping registry without changing legacy IDs/rows;
- retain published and superseded versions indefinitely for historical resolution.

### API Impact

- add version-aware published curriculum tree, path, node, search, and selection reads;
- add permission-scoped draft/import/review/validation/publication/mapping administration boundaries;
- preserve existing subject/topic contracts during compatibility;
- ensure clients cannot mutate Curriculum through consumer endpoints.

### Frontend Impact

- introduce role-appropriate read-only Curriculum Explorer foundations;
- add future admin Curriculum Operations for drafts, imports, ambiguity review, mappings, impact review, and publication;
- preserve exact Persian labels, source order, RTL hierarchy, missing-level behavior, retired/deprecated context, loading/error states, and accessible tree/list alternatives;
- do not expose target selection in operational workflows until their target writes are ready.

### Migration Requirements

- import the approved `cori.docx` transcription idempotently with checksum, exact labels, source order, and provenance;
- quarantine unresolved structures and prevent publication when blocking ambiguity remains;
- inventory and review `StudySubject`/`Topic` mappings without normalized-name-only matching;
- implement compatibility reads and rollback/reconciliation reports;
- do not disable legacy writes in this phase unless every existing workflow has an approved target replacement.

### Tests Required

- stable identity across compatible rename/reorder and new identity for semantic split/merge;
- hierarchy/type, cycle, parent, ordering, deprecation, lineage, and publication validation;
- import exactness, Unicode/source-label preservation, idempotency, ambiguity quarantine, and report reproducibility;
- published/superseded immutability and historical version resolution;
- curriculum-admin authorization and student/counselor read-only enforcement;
- legacy mapping ambiguity, compatibility reads, rollback, tree/search performance, RTL, keyboard, and screen-reader behavior.

### Exit Criteria

- at least one approved Curriculum Version is published atomically with retained source/import report;
- every published node has stable identity, type, parent/root state, order, and provenance;
- blocking ambiguities are resolved or explicitly excluded by authorized decision;
- old versions resolve and cannot be modified;
- reviewed legacy mappings distinguish confirmed, ambiguous, unmapped, and legacy-only records;
- M19 subject/topic workflows and historical reads still work;
- operational monitoring, reconciliation, backup, and rollback evidence is accepted.

## Phase 2 — Student Progress Overlay

**Entry dependency:** Phase 1 complete. ADR-035 accepted before implementation.

### Goal

Deliver student-specific learning state against exact published Curriculum references without changing Curriculum and without inferring mastery from M19 Tasks, sessions, or assessments.

### Domains Involved

Student Progress, Canonical Curriculum, Identity/Access, evidence provenance, Student App, and Counselor read access.

### Database Impact

- add version-pinned student-node Progress state and append-only Progress Event history;
- add evidence associations only according to ADR-035 and available source domains;
- enforce one current overlay per student/version/node and mastery range when known;
- preserve separate values for Progress mastery, Task learning quality, and Session quality.

### API Impact

- add version-aware student progress reads and permitted update/event commands;
- add counselor read access scoped to active relationships;
- expose source/evidence provenance without allowing Progress endpoints to mutate Curriculum or evidence;
- define cross-version reads according to approved mapping/continuity policy.

### Frontend Impact

- add Student Progress curriculum view, statuses, mastery, notes, review dates, strengths/weaknesses, and evidence history;
- add Counselor student-progress view within the student workspace;
- display unknown mastery as `Not rated`, never `0/5`;
- label version/mapping context and preserve accessible tree/list, empty, loading, partial, and error behavior.

### Migration Requirements

- create no mastery/status backfill from legacy Topic existence, Task completion, session ratings, or assessment counts;
- leave Progress empty/unknown until an authorized event establishes it;
- keep old-version Progress records intact when a new Curriculum Version publishes;
- rehearse cross-version mapping display without destructive transfer.

### Tests Required

- composite Curriculum reference and student ownership constraints;
- mastery/status validation and unknown-value behavior;
- append-only event history and correction/audit rules;
- student/counselor/admin authorization and relationship closure;
- no side effects from Tasks, Study Sessions, Practice, or assessments unless an approved evidence rule explicitly applies;
- historical-version display, mapping ambiguity, concurrency, accessibility, and performance over deep trees.

### Exit Criteria

- Progress state/history works end to end against exact Curriculum version/node pairs;
- authorized students and counselors see correct, isolated records;
- no current or historical Progress changes when Curriculum publishes a new version;
- no inferred mastery was introduced during migration;
- compatibility and reporting distinguish unknown, legacy activity, and explicit Progress;
- Phase 2 monitoring, reconciliation, accessibility, and rollback evidence is accepted.

## Phase 3 — Counselor Planning, Daily Reality, and Task Evolution

**Entry dependency:** Phase 2 complete. Planning lock-boundary, concurrency, reassignment, and Task-status cutover policies accepted.

### Goal

Deliver the target counselor planning loop: student-owned Daily Reality snapshots, editable counselor drafts, immutable published Plan Versions, atomic Task materialization, future-only revision, personal Tasks, separate Task Results, and preserved execution history.

### Domains Involved

Counselor Planning, Daily Reality Schedule, Tasks, Task Results, Study Sessions, Curriculum, Progress read context, student-counselor relationships, audit, Student App, and Counselor App.

### Database Impact

- add Daily Reality schedule/version/block structures;
- add Counselor Plan aggregate, draft revision, block/item lineage, immutable Plan Version/block/item, and Plan audit structures;
- add nullable version-pinned Curriculum and plan-item provenance to evolved `DailyTask` and `StudySession` during compatibility;
- add Task Result aggregate and immutable revisions with five-level learning quality;
- retain current `StudyPlan`, Task lifecycle fields, subject/topic references, and all sessions.

### API Impact

- add student-owned Daily Reality draft/publication and counselor read-only consumption;
- add counselor plan draft/edit/validate/diff/publish/revise/history commands with relationship and concurrency enforcement;
- make publication and Task materialization atomic and idempotent;
- add personal Task and Task Result flows that protect counselor-authored fields;
- preserve M19 Task/Plan/Session contracts through explicit compatibility behavior while target clients transition.

### Frontend Impact

- implement the target Counselor planning workspace, reality overlay, curriculum picker, workload editor, version diff, validation, publication, and history;
- implement Student published-plan, source-labelled counselor/personal Tasks, Plan history, Daily Reality editor, and Task Result workflow;
- clearly separate Plan intention, Study Session, Task Result, Practice entry point, and Progress;
- support mobile direct-entry/list alternatives, desktop paper-speed planning, Persian/RTL, keyboard, accessible time editing, and all recovery states.

### Migration Requirements

- do not synthesize Plan Versions or publication events for current `StudyPlan` or counselor-created Tasks;
- preserve every existing personal/counselor Task and its provenance as standalone legacy intention;
- add target references as nullable, backfilling only confirmed Curriculum mappings;
- represent legacy completed Task quality as unknown and retain existing skip facts;
- never copy `StudySession.studyQualityRating` to Task Result;
- disable legacy planning writes only after target student and counselor workflows, reads, and rollback are proven.

### Tests Required

- relationship authorization, student/counselor field ownership, private-data isolation, and reassignment behavior;
- draft concurrency, no silent last-write-wins, validation, publication atomicity/idempotency, and partial-failure rollback;
- immutable published versions and evidence-bearing historical Tasks;
- correct retain/supersede/replace Task materialization across future revisions;
- Daily Reality student ownership, counselor read-only access, snapshot pinning, time-zone/range validation, and privacy;
- five-level Task Result requirements, skip behavior, correction history, and separation from Session/Progress;
- M19 compatibility, migration reconciliation, end-to-end responsive/RTL/accessibility, and planning performance.

### Exit Criteria

- counselor can draft, validate, publish, and revise future plans end to end;
- student sees an atomic published version and correct materialized Tasks;
- historical published intention and all execution/result evidence remain unchanged after revision;
- student can publish Daily Reality and counselors can only consume the pinned snapshot;
- personal Tasks remain visibly and technically distinct;
- Task Result and Study Session facts remain separate with no automatic Progress mutation;
- M19 Tasks, Plans, Sessions, and historical reads remain operational;
- migration, monitoring, reconciliation, rollback, UX, and accessibility acceptance is complete.

## Phase 4 — Practice Activity

**Entry dependency:** Phase 3 complete. ADR-040 accepted before any legacy-assessment classification or cutover behavior is implemented.

### Goal

Deliver daily Practice as its own learning/evidence lifecycle, optionally connected to a Task or Study Session, without exam-delivery semantics and without reclassifying M19 `AssessmentAttempt` rows by inference.

### Domains Involved

Practice Activity, Tasks, Study Sessions, Curriculum, Student Progress evidence integration when ADR-035 permits it, legacy assessment compatibility, Student App, and Counselor evidence review.

### Database Impact

- add Practice aggregate, immutable revision, Curriculum target, and optional governed Question-response structures;
- support aggregate source/count/time evidence without requiring Question Bank items;
- retain optional Task/Session provenance without manufacturing either record;
- leave `AssessmentAttempt` unchanged as generic legacy completed evidence unless ADR-040 explicitly says otherwise.

### API Impact

- add Practice draft/record/correct/invalidate and history reads;
- validate student ownership, exact Curriculum pairs, source attribution, count invariants, and optional Task/Session compatibility;
- add counselor read access scoped to active relationships;
- expose no exam eligibility, secure delivery, timer, or authoritative scoring lifecycle.

### Frontend Impact

- add the explicit chooser separating Practice, External Exam Report, and Konkourix Online Exam;
- add low-friction Task-linked or independent Practice capture with source, Curriculum, time if known, and aggregate counts;
- show recorded revision, correction/invalidation history, and provenance;
- preserve `Legacy assessment` labelling for M19 attempts rather than relabelling them as Practice.

### Migration Requirements

- perform no bulk conversion based on title, counts, Task link, legacy Subject/Topic, or timing;
- keep existing assessment APIs/history active through compatibility;
- add canonical references only to new Practice writes or explicitly confirmed mappings;
- introduce Question-level responses later when published Question Versions exist, without making them required for aggregate Practice.

### Tests Required

- draft/record/correct/invalidate lifecycle and immutable revision history;
- non-negative/reconciled counts and exact version-pinned Curriculum validation;
- student ownership and counselor relationship-scoped reads;
- optional Task/Session provenance and no fake Task/Session creation;
- no automatic Task Result or Progress mutation;
- no Internal Exam states or External provider semantics;
- M19 legacy evidence compatibility, idempotency, migration rollback, accessibility, RTL, and mobile entry recovery.

### Exit Criteria

- students can record aggregate Practice independently or from eligible Tasks without a fake Study Session;
- counselors can review Practice without editing student evidence;
- recorded/corrected/invalidated history is reproducible;
- no M19 attempt was reclassified without the approved ADR-040 process;
- Practice remains separate from External Reports and Internal Exams in storage, APIs, UI language, and tests;
- Phase 4 reconciliation, observability, rollback, UX, and accessibility evidence is accepted.

## Phase 5 — Question Bank Foundation

**Entry dependency:** Phase 4 complete. Question media/storage and operational rights-review policies accepted.

### Goal

Deliver a governed, rights-aware, versioned Question Bank with moderated multi-node Curriculum classification for future governed Practice and Internal Exams.

### Domains Involved

Question Bank, Canonical Curriculum, attribution/rights, moderation/audit, admin identity/permissions, governed Practice integration, and future Internal Exams.

### Database Impact

- add stable Question identity and immutable Question Version structures;
- add format-specific answer/option structures, attribution, rights, Curriculum tags, and moderation events;
- enforce one or more version-pinned Curriculum tags and exactly one primary tag for published versions;
- retain withdrawn/retired content needed by historical Practice/Exam evidence;
- add approved media references only after secure object-storage design.

### API Impact

- add permission-separated submission, edit-draft, educational review, answer/solution verification, rights review, Curriculum review, approval, publication, withdrawal, and history operations;
- add student/counselor consumption endpoints only for eligible published Question Versions;
- protect answer keys, solutions, unpublished content, rights evidence, and moderation data;
- ensure logical Question IDs alone are insufficient for delivery—consumers pin exact versions.

### Frontend Impact

- implement future role-scoped Question Bank admin workspaces, queues, editor, attribution/rights panels, Curriculum tagging, review checklist, preview, publication, and withdrawal;
- require exactly one primary most-specific defensible Curriculum tag without inventing missing atomic nodes;
- show derived ancestors as context rather than editable authoritative tags;
- add governed Question Bank Practice consumption only after publication and entitlement rules are enforced.

### Migration Requirements

- there is no M19 question table to convert;
- seed/import/partner content enters through source, rights, moderation, and Curriculum workflows rather than direct publication;
- preserve source artifacts and deduplication decisions without identity-by-normalized-text;
- do not create item-level responses for aggregate legacy Practice/Assessment history.

### Tests Required

- stable logical identity, version creation, published immutability, withdrawal/retirement, and historical resolution;
- moderation transition/capability separation and full audit history;
- attribution and rights publication gates, expiry/dispute/revocation effects, and restricted evidence access;
- multi-node tags, exactly one primary, pinned Curriculum version, derived ancestry, and classification-version correction;
- answer-key/solution confidentiality, rich-content sanitization, media scanning/access, and unauthorized enumeration protection;
- search/filter performance, Persian/RTL content, preview fidelity, accessibility, and integration with governed Practice.

### Exit Criteria

- authorized staff can take a Question Version from submission through every required review to atomic publication;
- no Question Version publishes without verified answer/solution, attribution, usable rights basis, and valid Curriculum classification;
- published versions are immutable and precisely consumable; withdrawal blocks new use without corrupting history;
- student/counselor users cannot access protected drafts, rights evidence, or unreleased answers;
- a production-ready set of approved Question Versions is available for Internal Exam validation;
- monitoring, audit, security, performance, rollback, UX, and accessibility acceptance is complete.

## Phase 6 — External Reports and Internal Online Exams

**Entry dependency:** Phase 5 complete. ADR-042, secure evidence storage, and Internal Exam attempt/scoring/release policies accepted.

This phase has two separate delivery slices. They may share reporting later, but they never share a write lifecycle. Internal Exam implementation cannot begin until the Question Bank exit criteria are met. External Report implementation also waits until this phase to preserve the mandated critical-path order.

### Goal

Deliver provider-owned External Exam reporting and Konkourix-owned Internal Online Exam authoring, eligibility, secure delivery, answer capture, evaluation, and reproducible results as separate domains.

### Domains Involved

- **External slice:** provider registry, External Exam Reports, evidence files, structured section results, counselor review, Curriculum.
- **Internal slice:** Question Bank, Exam builder/versioning, eligibility, Attempt delivery, answers, evaluation/manual review, results, Curriculum, security/audit.
- **Shared read concern:** legacy `AssessmentAttempt` compatibility and source-preserving assessment history.

### Database Impact

- add External provider, report aggregate/revisions, section results, evidence metadata, and counselor review structures;
- add stable Internal Exam, immutable Exam Version/Section/Item, eligibility, Attempt, delivered-item snapshot, Answer, Attempt Event, Evaluation/Item Evaluation, and Result structures;
- pin exact Curriculum, Question, and Exam Versions;
- preserve `AssessmentAttempt` unchanged and represent any unified history as a read projection.

### API Impact

- add External Report draft/record/correct/invalidate, evidence upload/scan status, structured result, history, and counselor review operations according to ADR-042;
- add Internal Exam author/review/publish, eligibility, start/resume, answer-save, submit, expire/terminate/invalidate, automatic/manual evaluation, result-release, and correction operations;
- use server-authoritative time, state, ownership, idempotency, and delivery snapshots;
- maintain separate route/domain contracts and do not route External Reports through Internal Exam Attempt endpoints.

### Frontend Impact

- implement Student External Report entry, evidence status, exact provider facts, correction/invalidation, and counselor-review experience;
- implement Internal Exam discovery/eligibility, preflight, server-timed attempt, accessible question navigation, save/reconnect, explicit submission, evaluation status, and result history;
- implement admin Exam builder/version publication, eligibility/delivery operations, manual evaluation, correction/invalidation, and audit views;
- retain the three-way Practice/External/Internal chooser and clearly labelled legacy assessment history.

### Migration Requirements

- create no External provider/report or Internal Exam/Attempt from an M19 title/count heuristic;
- follow ADR-040 for any approved legacy classification while retaining original rows and IDs;
- follow ADR-042 for provider identity, normalization, import, correction, and evidence retention;
- validate object-storage quarantine/retention and rollback without orphaning report revisions;
- preserve exact Question/Exam delivery snapshots and scoring specifications indefinitely where results depend on them.

### Tests Required

- External provider governance, report revisions, evidence upload validation/scanning/access, counselor review separation, and no Internal lifecycle leakage;
- immutable Exam Version/Question Version selection and publication validation;
- eligibility, ownership, attempt allowance, state-machine transitions, server timer/deadline, reconnect/resume, idempotent answer save/submission, expiry, and duplicate/replay resistance;
- realized item/option order stability and result reproducibility;
- objective scoring, manual review, finalized Evaluation immutability, re-evaluation/result supersession, and release policy;
- answer-key confidentiality, authorization, rate/abuse protection, audit integrity, accessibility under time pressure, RTL, responsive recovery, load/performance, and failure resilience;
- no automatic Study Session, Task Result, or Progress mutation.

### Exit Criteria

- External Report evidence can be recorded, corrected, invalidated, reviewed, and resolved without provider/internal-exam conflation;
- an authorized Internal Exam can be built from published Question Versions and published immutably;
- an eligible student can start, reconnect, answer, submit, and receive a reproducible result under server-authoritative state/time;
- manual evaluation and correction produce immutable, auditable revisions;
- protected content and other students' attempts/results remain isolated;
- M19 `AssessmentAttempt` history remains visible and unchanged;
- security, performance, resilience, monitoring, migration, rollback, UX, and accessibility acceptance is complete.

## Phase 7 — Reporting and Analytics

**Entry dependency:** Phase 6 complete. Reporting calculation/versioning, freshness, retention, and access policies accepted.

### Goal

Deliver trustworthy cross-domain reporting and explainable improvement views over authoritative source facts. This phase does not authorize AI diagnosis, ranking, or an opaque analytics platform.

### Domains Involved

Curriculum, Progress, Planning, Tasks/Results, Study Sessions, Practice, External Reports, Internal Exam Results, legacy assessment evidence, reporting projections, Student App, and Counselor App.

### Database Impact

- add/rebuild source-preserving views or projections for student learning timeline, Curriculum progress reports, Plan execution comparison, and assessment evidence timeline;
- add projection checkpoint/freshness metadata only if asynchronous materialization is necessary;
- retain source kind/ID, Curriculum version, and calculation version in materialized metrics;
- do not copy source facts into a new authoritative generic activity table.

### API Impact

- add permission-scoped report queries with explicit period, source coverage, freshness, calculation version, and partial-data semantics;
- expose drill-down from summaries to authorized source facts;
- preserve source-specific units and refuse unsupported cross-provider/exam normalization;
- make projection rebuild/failure invisible to source write correctness.

### Frontend Impact

- implement student progress/momentum views that explain their evidence and support improvement without shame, rank, or diagnosis;
- implement counselor Plan-versus-execution, learning timeline, Curriculum evidence, and assessment-source views;
- show legacy, missing, partial, stale, invalidated, corrected, and version-mapped data explicitly;
- provide accessible text/table equivalents for every chart and retain source drill-down.

### Migration Requirements

- build projections from immutable source facts in resumable/rebuildable jobs;
- include M19 records under explicit legacy source kinds without synthetic classification;
- validate old Curriculum versions and mappings during historical rollup;
- run shadow comparisons and reconciliation before making target reports primary;
- rollback by disabling/rebuilding projections, never by changing source records.

### Tests Required

- deterministic calculation and calculation-version reproducibility;
- source inclusion/exclusion, invalidation/correction, time-zone/date-boundary, Curriculum-version rollup, and legacy handling;
- projection idempotency, ordering, rebuild, lag/freshness, partial failure, and reconciliation;
- student/counselor/admin authorization and source drill-down isolation;
- large-data performance, accessible charts/tables, responsive layouts, RTL, empty/loading/partial/error states;
- assertions that report/API actions cannot mutate source domains.

### Exit Criteria

- every reported value can identify its source facts, time range, Curriculum/calculation version, and freshness;
- projection rebuilds reproduce accepted results and reconcile against source counts;
- students and counselors receive role-appropriate, accessible, non-shaming views;
- legacy/partial data is disclosed and not presented as complete or normalized;
- reporting cannot mutate Planning, Progress, Practice, Exam, or Communication facts;
- monitoring, support, rollback, performance, UX, and accessibility acceptance is complete.

## Supporting Lane A — Communication and Counselor Ecosystem

**Entry dependency:** Phase 3 complete plus acceptance of retention, moderation, attachment, notification, relationship, and private-note policies. This lane may not consume capacity or shared contracts in a way that bypasses the critical-path gates.

### Goal

Deliver separate General Chat, Ticket/Thread, and Suggestion workflows; human-reviewed counselor acquisition; and confidential private counselor notes without creating entity-specific chat or weakening domain ownership.

### Domains Involved

Communication, Tickets, Suggestions, student-counselor relationships/acquisition, private counselor notes, security/audit, Student App, Counselor App, and future admin workspaces.

### Database Impact

- add relationship-scoped conversation/messages, Tickets/participants/messages/status events, Suggestions/events, and typed contextual links;
- add invitation/request/introduction/selection lifecycle structures only after exact counselor-acquisition policy is approved;
- add separately protected private note and note-access audit structures;
- do not store plan/result/curriculum mutations in communication records.

### API Impact

- add separate contracts and authorization for Chat, Tickets, Suggestions, acquisition transitions, and private notes;
- validate contextual targets without transferring ownership to Communication;
- ensure relationship closure, exceptional admin access, retention, and notification behavior follow approved policy;
- keep private notes outside student-visible and unified-inbox APIs.

### Frontend Impact

- add unified inbox projection with visibly separate Chat/Ticket/Suggestion modes;
- add structured Ticket status/history and governed Suggestion review feedback;
- add free registration, invitation, human-reviewed introduction, and student final-selection UX without automatic matching;
- add separately protected Counselor private-note area and authorized admin oversight, never Student access.

### Migration Requirements

- no M19 Task, plan, note-like text, or activity is converted to Chat/Ticket/Suggestion/private note;
- preserve current `StudentCounselor` relationships and add acquisition history only for future transitions;
- do not fabricate invitation, request, review, or consent events for current active relationships.

### Tests Required

- relationship/participant authorization, closure/reassignment, contextual-link validation, notification privacy, retention, and abuse controls;
- separate Chat, Ticket, Suggestion, and private-note lifecycle and visibility tests;
- human-review/no-automatic-matching acquisition invariants and student final selection;
- private-note read/export/exceptional-access audit and non-transfer on reassignment;
- accessibility, RTL, pagination/order, idempotent send/retry, offline/error recovery, and load behavior.

### Exit Criteria

- each communication mode works end to end without becoming authoritative domain state;
- no entity-specific chat proliferation exists;
- counselor acquisition is explicit, human-reviewed, and student-selected;
- private notes are inaccessible to students and unauthorized counselors, with audited exceptional access;
- current relationships remain valid without synthetic acquisition history;
- security, retention, monitoring, rollback, UX, and accessibility acceptance is complete.

## Phase Gate Register

| Gate | Required before | Decision/evidence |
| --- | --- | --- |
| ADR-034 | Phase 1 | Curriculum governance, administrative capabilities, separation of duties, and audit |
| Curriculum migration policy gate | Phase 1 | Legacy Curriculum mapping, cutover, reconciliation, and rollback |
| ADR-035 | Phase 2 | Progress actor authority, evidence acceptance, mastery calculation, cross-version continuity |
| Planning policy gate | Phase 3 | Future/historical lock boundary, reassignment, concurrency, Task status authority |
| ADR-040 | Phase 4 and Phase 6 migration behavior | Long-term role and safe classification policy for `AssessmentAttempt` |
| Media/storage gate | Phase 5 and Phase 6 | Secure object storage, scanning, access, retention, deletion |
| ADR-042 | Phase 6 | External provider identity, normalization, correction/import, legacy compatibility |
| Internal Exam policy gate | Phase 6 | Retakes, accommodations, timing, appeals, scoring, manual review, release, proctoring/offline boundaries |
| Reporting policy gate | Phase 7 | Calculation versions, freshness, retention, access, partial-data semantics |
| Communication policy gate | Supporting Lane A | Attachments, edit/delete, moderation, abuse, notification, retention, relationship/acquisition rules |

An unresolved gate blocks the affected phase or slice. It is not permission to choose a convenient implementation default.

## Explicitly Deferred Beyond Roadmap V2

The following have no implementation phase in this roadmap:

- AI analysis or recommendations;
- student ranking or competitive leaderboards;
- live or recorded classes/content platform;
- school/organization management;
- subscriptions, billing, or marketplace;
- post-exam ecosystem services.

These directions require new product decisions, ADRs, domain/data/API/UX design, security review, and a revised dependency roadmap. They must not be inserted opportunistically into the phases above.

## Roadmap Change Control

- Phase ordering may change only through an explicit approved architecture decision that explains dependency, migration, and compatibility effects.
- Phase scope may be split into smaller release slices, but no slice may bypass its entry dependency or weaken its exit criteria.
- A feature being technically hidden does not permit premature schema or write-path implementation.
- Documentation, prototypes, and test design may proceed ahead for discovery; production implementation and data mutation may not.
- Completion status must cite verifiable code, migration, test, reconciliation, operational, UX, and accessibility evidence rather than roadmap prose.
