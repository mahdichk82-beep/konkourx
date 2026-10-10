# Konkourix Backend Domain Migration Plan

**Status:** LEGACY / SUPPORTING TARGET BLUEPRINT; REVALIDATION REQUIRED
**Last synchronized:** 2026-10-02
**Current baseline:** M19 (`76bc4d7`)
**Architecture style:** Modular monolith; one Fastify deployable, one PostgreSQL database, Prisma persistence

This plan preserves an M19-era backend migration proposal. It does not define product behavior or current sequencing. [PRODUCT_MAP.md](PRODUCT_MAP.md) and [ROADMAP.md](ROADMAP.md) govern, and every proposal here requires revalidation against them before use. It does not modify code, Prisma, schema, migrations, APIs, or tests.

## Sources of Truth

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DOMAIN_MAP.md](DOMAIN_MAP.md)
- [TARGET_DATABASE_DESIGN.md](database/TARGET_DATABASE_DESIGN.md)
- [PRODUCT_MAP.md](PRODUCT_MAP.md)
- [ROADMAP.md](ROADMAP.md)
- [UI_MIGRATION_PLAN.md](UI_MIGRATION_PLAN.md)
- [API_MIGRATION_PLAN.md](API_MIGRATION_PLAN.md)
- [API.md](API.md)
- [PROJECT_STATE.md](PROJECT_STATE.md)
- [DECISIONS.md](DECISIONS.md) and the standalone [ADR index](adr/README.md)
- [ADR-034](adr/ADR-034-curriculum-governance-and-administrative-permissions.md)

## Governing Rules

- Keep a modular monolith until operational evidence justifies extraction.
- Preserve all 14 applied M19 migrations; never edit, rename, reorder, squash, or replace them.
- Add domains and tables in dependency order. A later domain may be designed but not implemented before the earlier roadmap gate exits.
- Keep source facts in their owning domain and integrate through explicit IDs, command/query contracts, or read projections.
- Never reclassify or rewrite historical `StudySession` or `AssessmentAttempt` data.
- Never infer canonical identity, Progress mastery, Plan publication, Task learning quality, provider identity, Question response, or Exam delivery history.
- Use one database transaction only where a domain invariant truly spans writes, such as Curriculum publication or Plan publication/materialization. Transaction sharing does not erase module ownership.
- Prefer additive modules and adapters over a rewrite of `student-core` or current clients.

## 1. Current Backend Modules

### Product Modules

| Current module | Current responsibility | Persistence touched | Target disposition |
| --- | --- | --- | --- |
| `auth` | Registration, login, access/refresh sessions, rotation/reuse handling, logout, password change, authenticated identity, RBAC helpers | `User`, `AuthSession` | **Retain** as Identity and Access; extend toward capability authorization without becoming owner of product data |
| `domain` | Student/Counselor profiles, relationship list/admin transitions, assigned-student reads | `StudentProfile`, `CounselorProfile`, `StudentCounselor`, `User` | **Split by responsibility** into Profile and Counselor Relationship/Ecosystem boundaries while preserving current contracts |
| `student-core` | Student-owned subjects/topics, StudyPlans, DailyTasks, task lifecycle/rescheduling | `StudySubject`, `Topic`, `StudyPlan`, `DailyTask` | **Decompose gradually** into legacy curriculum adapter, Planning/Tasks, and compatibility services; do not rewrite in place |
| `counselor-tasks` | Assigned-student legacy resources, Task reads, single/batch counselor Task creation, rescheduling | `StudentCounselor`, profiles, `StudySubject`, `Topic`, `DailyTask`, execution/evidence checks | **Compatibility module**, later replaced for target authoring by Counselor Planning; retain legacy Task reads/history |
| `study-tracking` | Study Session manual/live lifecycle, recovery/switching/feedback, Student Goals | `StudySession`, `StudentGoal`, related Task/Subject | **Split conceptually** into Study Execution and legacy Goals; keep session integrity unchanged |
| `assessment-attempts` | Completed aggregate assessment evidence, correction, invalidation, ownership, reschedule locks | `AssessmentAttempt` and related Task/legacy curriculum | **Retain as legacy assessment boundary**; never expand into Practice, External Reports, or Internal Exams |

Each product module currently follows a useful `types` / `store` interface / service / Prisma store pattern. That pattern is a reusable modular-monolith boundary, not a requirement that all future domains use one large service or one cross-domain store.

### Horizontal and Delivery Modules

| Current area | Responsibility | Migration direction |
| --- | --- | --- |
| `routes` | Fastify route registration and transport adaptation | Keep thin; register domain route plugins without embedding business rules |
| `schemas` | Zod transport validation | Keep transport-specific; domain invariants still execute in domain services and database constraints |
| `contracts` | Standard response envelope | Retain and expand only through contract review |
| `plugins` | Authentication, CORS, security, request context, auth rate limiting | Retain; add capability checks and domain-specific abuse controls where approved |
| `errors` | Central API error representation/handling | Retain; preserve safe error boundaries and request IDs |
| `config` | Environment/runtime validation | Retain; curriculum import/storage configuration must be explicit if introduced |
| `lib` | Prisma singleton, lifecycle, operational logging | Retain as infrastructure; prevent it from becoming a generic domain-logic location |
| `seed` | Development domain seed | Keep development-only; future Curriculum source imports are not ordinary seed inserts |
| `generated/prisma` | Generated Prisma client | Regenerate only as part of an authorized schema phase; never hand-edit |

### Current Dependency Shape

```text
Fastify routes
    -> services/domain services
        -> store interfaces
            -> Prisma stores
                -> PostgreSQL

auth/RBAC + request context + errors + response envelope
    -> cross-cut every route without owning its domain facts
```

This layering should remain. The migration adds bounded modules and explicit integration contracts rather than introducing direct route-to-Prisma access or a shared repository that can mutate every table.

## 2. Target Bounded Domains

| Target domain | Owns | May read/reference | Must not own or infer |
| --- | --- | --- | --- |
| Identity and Access | Users, credentials, sessions, capability assignments, authentication decisions | Domain identifiers required for authorization | Curriculum, plans, Progress, educational evidence |
| Profiles | Student/Counselor profile facts | User identity | Relationship lifecycle or educational records |
| Counselor Ecosystem | Relationship authorization and later invitation/request/introduction/selection | Profiles and audit identity | Automatic matching, private-note content, Plan data |
| Canonical Curriculum | Versions, logical Nodes, revisions, relationships, imports, source records/issues, mappings, audit | Actor identity | Student personalization or legacy row mutation |
| Legacy Curriculum Compatibility | Reviewed links from `StudySubject`/`Topic` to exact canonical pairs and display resolution | Curriculum and legacy rows | Name-only identity or destructive conversion |
| Student Progress | Student/version/node state, events, accepted evidence links | Curriculum and source evidence | Curriculum edits, Task result authority, automatic mastery before ADR-035 |
| Counselor Planning | Plan aggregate, draft revisions, block/item lineage, immutable versions, publication audit | Curriculum, relationship, optional Reality snapshot | Actual execution, student result, mutable historical intention |
| Daily Reality | Student-owned schedules, drafts/versions/blocks | Student and authorized relationship | Tasks, Plan Items, retrospective execution |
| Tasks | Personal and plan-materialized learning intention, source/provenance, supersession | Curriculum, Plan item | Study time, result revisions, Practice, mastery |
| Task Results | Student-reported outcome and immutable corrections | Task and actor | Plan content, Session rating, Progress mastery |
| Study Execution | Study Session lifecycle and feedback | Optional Task/curriculum/plan provenance | Task completion, Practice, Exam attempt |
| Practice | Student Practice aggregates/revisions/targets and later exact Question responses | Task/Session/Curriculum/Question versions | External provider or Internal Exam lifecycle |
| Question Bank | Logical Questions, immutable Versions, options, attribution, rights, curriculum tags, moderation | Curriculum and actors | Exam attempt state or direct publication by authorship |
| External Exam Reports | Providers, student reports/revisions/sections/evidence, counselor reviews | Curriculum, Task, relationship | Provider delivery/questions or Internal Attempt state |
| Internal Online Exams | Exams/versions/items, eligibility, delivery snapshots, answers, evaluations/results | Question/Curriculum versions and actors | Practice or External Report writes, automatic Task/Progress mutation |
| Communication | Relationship Chat, Tickets, Suggestions and contextual links | Relationship and validated target references | Plan/Curriculum/evidence mutation or entity-specific chat rooms |
| Private Counselor Notes | Confidential notes and access audit | Student, owning counselor, relationship | Student-visible communication, Progress facts, automatic matching |
| Reporting | Rebuildable projections/checkpoints | Authorized source facts across domains | Authoritative educational writes or source correction |

### Dependency Direction

```text
Identity/Profile/Relationship
          |
          v
Canonical Curriculum
          |
          v
Student Progress
          |
          v
Reality + Counselor Planning -> Tasks -> Task Results / Study Execution
                                      |
                                      v
                                   Practice
                                      |
                                      v
                                Question Bank
                                      |
                                      v
                    External Reports + Internal Exams
                                      |
                                      v
                                  Reporting

Communication/Counselor Ecosystem begins after Planning and references,
but never owns, educational domain state.
```

Identity, Profiles, and Relationships are foundations, not downward dependencies on educational domains. Reporting depends on sources; source domains never depend on reporting projections.

## 3. Current-to-Target Module Evolution

| Current responsibility | Intermediate boundary | Target owner |
| --- | --- | --- |
| `domain` profile operations | Keep existing service contracts while extracting internal ownership | Profiles |
| `domain` relationships/assigned students | Relationship authorization facade | Counselor Ecosystem |
| `student-core.subjects/topics` | Explicit legacy-curriculum service and mapping adapter | Legacy Curriculum Compatibility; Canonical Curriculum owns only canonical records |
| `student-core.plans` | Legacy StudyPlan compatibility service | Planning compatibility; not Counselor Planning history |
| `student-core.tasks` | Task facade supporting legacy and target representations | Tasks/Planning |
| `counselor-tasks` resource selection | Legacy selection adapter | Removed from target authoring after Curriculum/Plan cutover |
| `counselor-tasks` creation/rescheduling | Compatibility command facade | Counselor Planning publication/revision plus Tasks |
| `study-tracking.sessions` | Preserve service/store boundary | Study Execution |
| `study-tracking.goals` | Isolate from Session changes | Legacy Goals until a canonical Goal ADR exists |
| `assessment-attempts` | Label explicitly as legacy assessment evidence | Legacy Assessment Compatibility |

The intermediate facades prevent a big-bang rewrite. They may coordinate reads across old and new stores, but must not let one module update another domain's tables directly without an explicit command/transaction contract.

## 4. Migration Order

| Order | Backend work | Entry/exit boundary |
| --- | --- | --- |
| 0 | Delivery readiness: physical-design reviews, M19 inventory, migration rehearsal, rollback, ADR-034 capability design, and separate Curriculum migration/cutover policy | Roadmap Phase 0 exits; no runtime domain change |
| 1 | Canonical Curriculum module, persistence, import/provenance/issues, publication, mappings, audit, consumer/admin APIs | At least one approved version publishes; legacy workflows still work |
| 2 | Student Progress state/events/evidence boundary | ADR-035 accepted; no inferred mastery |
| 3 | Daily Reality, Counselor Planning, Task evolution, Task Results; preserve Study Execution | Planning policies accepted; atomic publication/materialization and M19 compatibility proven |
| 4 | Practice Activity and legacy assessment adapter | ADR-040 accepted; no M19 heuristic conversion |
| 5 | Question Bank moderation/version/rights/classification | Secure media/rights policy accepted; published governed Questions available |
| 6A | External Exam Reports | ADR-042 and evidence-storage policies accepted |
| 6B | Internal Online Exams | Question Bank complete and exam policies accepted |
| 7 | Reporting projections and source-preserving queries | All source domains ready; reporting policy accepted |
| A | Communication, acquisition, private notes | After Order 3 plus communication/acquisition/note policy gates |

No target module may create placeholder database writes “for later.” Documentation, interfaces, and tests may be designed ahead, but production implementation obeys this order.

## 5. Data Ownership Changes

| Current data | Current owner | Target ownership and preservation |
| --- | --- | --- |
| `User`, `AuthSession` | `auth` | Identity and Access remains owner; capability assignments are additive and separately approved |
| `StudentProfile`, `CounselorProfile` | `domain` | Profiles owns profile facts; educational domains reference profile IDs |
| `StudentCounselor` | `domain` | Counselor Ecosystem owns relationship state and authorization provenance; current rows remain valid without synthetic acquisition events |
| `StudySubject`, `Topic` | `student-core` | Legacy Curriculum Compatibility owns future mapping/display behavior; rows/IDs remain intact and never become canonical by name |
| `StudyPlan` | `student-core` | Legacy Planning compatibility; not converted into published Counselor Plan Versions |
| `DailyTask` | `student-core` and `counselor-tasks` | Tasks owns execution-facing intention; target fields are additive; Plan publication creates new counselor Tasks, existing rows remain standalone |
| Task status/completion/skip fields | `student-core` | Compatibility facts remain; Task Results owns new target result revisions after cutover |
| `StudySession` | `study-tracking` | Study Execution remains owner; nullable canonical/plan provenance may be added later without changing lifecycle |
| `StudentGoal` | `study-tracking` | Legacy Goals remains owner until a separate target Goal decision; subject provenance retained |
| `AssessmentAttempt` | `assessment-attempts` | Legacy Assessment Compatibility remains owner; never moved into Practice/External/Internal tables by inference |
| Target Curriculum data | None | Canonical Curriculum only; consumers reference exact version/node pairs |
| Target Progress | None | Student Progress only; Curriculum and evidence sources remain unchanged |
| Target Plans/Reality | None | Counselor Planning and Daily Reality separately own their versions |
| Target assessment domains | None | Practice, External Reports, and Internal Exams each own their lifecycle |

## 6. Prisma Migration Strategy

This section defines process and boundaries, not Prisma schema or SQL.

### Migration Unit Rules

- Every schema slice receives a new timestamped additive migration after physical-schema review.
- One migration should have one explainable domain purpose and a reviewed rollback/forward-fix plan; do not generate the entire future model at once.
- Generated Prisma client output changes only with an authorized schema implementation and is committed/validated according to the existing repository workflow.
- Destructive rename/drop is avoided during compatibility. If a logical rename is needed, add/copy/verify/cut over first; physical cleanup requires a later retention decision.
- Required target constraints are enforced at the database where practical and repeated in domain validation. Prisma limitations do not justify weakening composite version/node integrity or publication immutability.
- Production migration execution remains an operational gate; current Compose does not run migrations automatically.

### Required Preflight per Migration

1. Record current row counts, inbound references, null/orphan distributions, enum values, and relevant indexes.
2. Verify backup/restore and forward-fix behavior with production-sized fixtures.
3. Estimate lock duration, table rewrite risk, index build cost, and application compatibility.
4. Prove the old application can run safely against the expanded schema until the cutover point.
5. Define post-deploy reconciliation queries/metrics and rollback treatment for target-era writes.

### Staged Persistence Evolution

1. Add Canonical Curriculum tables, constraints, import/audit, and legacy mapping registry; do not modify legacy rows.
2. Publish and verify an initial Curriculum Version; keep consumer references out of current writes.
3. Add Progress after Curriculum exits.
4. Add nullable exact curriculum pairs to consumer tables only in their owning phase; validate confirmed mappings before any backfill.
5. Add Reality/Planning/Task Result structures and Task provenance; keep existing Task/Session fields.
6. Add Practice, Question Bank, External Reports, Internal Exams, Communication, and Reporting only at their roadmap gates.
7. Make target fields required for new target writes through service rules before considering database-wide non-null constraints that legacy rows cannot satisfy.
8. Disable legacy writes workflow by workflow; retain historical structures until a separately approved cleanup phase.

### Curriculum Composite Integrity

Every target consumer reference stores `curriculum_version_id` and `curriculum_node_id` and resolves to the unique node revision pair. A logical node foreign key without its version is insufficient. Any physical Prisma design must prove:

- uniqueness of the version/node pair;
- same-version parent resolution;
- deterministic sibling ordering;
- restrictive deletion for published/history references;
- draft-only mutation and published/superseded immutability;
- no cascade from canonical administration into consumer history.

### Backfill Rules

- Backfills are resumable, idempotent, observable, and produce immutable reconciliation reports.
- Only confirmed mappings populate canonical references. Ambiguous/unmapped/legacy-only records remain null on the canonical side and valid on the legacy side.
- Backfills never invent Plan Versions, Task Result quality, Progress mastery, Question responses, providers, or Exams.
- Original legacy IDs and columns remain available throughout rollback and historical resolution.

## 7. Compatibility Layer Strategy

### Compatibility Responsibilities

| Adapter/facade | Responsibility | Prohibited behavior |
| --- | --- | --- |
| Curriculum display resolver | Return canonical exact label/path when pair exists; otherwise preserved legacy label plus mapping state | Guessing a canonical node or using latest version |
| Task read facade | Compose legacy and target Task shapes with explicit source/provenance/result availability | Fabricating Plan versions or Task Results |
| Planning facade | Keep legacy direct Task commands until target Plan cutover | Dual-writing an unapproved Plan publication |
| Legacy assessment facade | Keep M19 attempts readable/correctable/invalidateable under ADR-040 | Relabelling as Practice/External/Internal from heuristics |
| Unified evidence projection | Read separate source facts with source kind/ID | Becoming a generic write table |
| Relationship authorization facade | Centralize active relationship checks for counselor reads/writes | Treating cached UI selection as authority |

### Compatibility Lifecycle

```text
old module/write remains authoritative
    -> target tables and read adapter added
    -> target writer introduced for one workflow
    -> shadow/reconciliation reads prove equivalence where equivalence is valid
    -> target read becomes primary
    -> old writer disabled
    -> old history remains readable
```

Adapters are temporary architecture with an explicit owner, metrics, failure policy, and retirement criterion. They must not become a permanent generic `common` domain.

## 8. Transaction and Integration Boundaries

- Curriculum publication owns validation, version freezing, publication state, and audit in one authoritative operation.
- Plan publication owns Plan Version snapshot and actionable Task materialization atomically.
- Study Execution retains its student-row serialization for one active Session and task switching.
- Assessment creation/invalidation and Task rescheduling retain their current serialization until target policies replace the workflow.
- Cross-domain evidence links validate both records and student/curriculum compatibility but never transfer ownership.
- Reporting and unified inbox projections are rebuildable and may be eventually consistent only when freshness/partial-state behavior is explicit.
- Domain services exchange typed commands/results or stable IDs; they do not import another domain's Prisma store as a shortcut.

## 9. Risks and Controls

| Risk | Consequence | Required control |
| --- | --- | --- |
| Big-bang `student-core` rewrite | Regressions across current Student/Counselor clients | Add target modules beside current services; cut over one workflow at a time |
| Generic `ADMIN` authorization | Excessive access to drafts, publication, rights, notes, or audit | Capability-specific server checks and authorization matrix before exposure |
| Normalized-name curriculum matching | False educational identity and corrupted history | Stable source registry, provenance, ambiguity quarantine, reviewed mapping |
| Weak composite references | Historical records resolve against wrong version | Database-enforced version/node pair and explicit API representation |
| Mutable published data | Reinterpreted plans/questions/exams/progress | Immutable snapshots, append-only corrections, restrictive deletes, audit |
| Uncontrolled dual writes | Partial or contradictory source facts | Avoid; if unavoidable, approve atomicity/idempotency/reconciliation/rollback first |
| Cross-domain store access | Hidden coupling and unclear transaction ownership | Explicit service contracts and transaction coordinator only for accepted invariant |
| Prisma-generated migration side effects | Table rewrites, locks, dropped constraints/data | Review SQL separately, rehearse, measure locks, use forward-safe additive steps |
| Large/deep Curriculum queries | Slow tree/search and N+1 behavior | Phase-specific indexes, bounded query shapes, performance fixtures, version-keyed caches |
| Unicode/search normalization leakage | Exact Persian source labels change | Separate exact source/display text from normalized search data; round-trip tests |
| Source ambiguity hidden in importer | Invented parents/types/relationships | Quarantine, blocking issues, human decisions, immutable import reports |
| Compatibility adapters never retire | Permanent complexity and conflicting authorities | Owner, telemetry, cutover criteria, and retained-history versus active-write distinction |
| Stale counselor authorization | Unauthorized student data after relationship change | Revalidate relationship per request/commit; cache invalidation and non-disclosure tests |
| Reporting backflow | Projection becomes accidental source of truth | Read-only stores/contracts and rebuildability tests |
| Generated-client or fixture drift | Code/test mismatches schema phase | Regenerate and update fixtures only in authorized implementation milestone; full validation gate |

## Backend Migration Completion Criteria

A bounded-domain phase is complete only when:

- its module owns an explicit lifecycle and persistence boundary;
- database constraints, service invariants, and authorization agree;
- no later domain has been implemented to simulate completeness;
- current M19 records and clients work through documented compatibility paths;
- migration rehearsal, reconciliation, monitoring, performance, backup/restore, and rollback evidence is accepted;
- contract, unit, integration, database, authorization, concurrency, migration, resilience, and end-to-end tests pass;
- legacy writers are disabled only where target writers and rollback are proven;
- source ownership, version/provenance, and audit remain observable;
- the corresponding canonical [ROADMAP.md](ROADMAP.md) milestone and product/domain-owner sign-off are satisfied.
