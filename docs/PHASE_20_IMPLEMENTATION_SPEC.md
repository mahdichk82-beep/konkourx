# Phase 20 Implementation Specification — Canonical Curriculum Foundation

**Status:** HISTORICAL / SUPERSEDED by Recovery Foundation 1 and 2; not active authority
**Last synchronized:** 2026-09-17
**Starting implementation baseline:** M19 (`76bc4d7`)
**Roadmap alignment:** [ROADMAP_V2.md](ROADMAP_V2.md) Phase 1, after Phase 0 exit criteria

“Phase 20” in this document names the next implementation milestone after M19. It does not introduce a twentieth phase into Roadmap V2 and does not reorder the approved critical path.

This document is retained as a historical implementation record. It does not authorize code, schema, Prisma, migration, API, frontend, test, deployment, import, or database changes. Its rejected governance/import design and removed support artifacts must not guide the replacement runtime.

## Sources of Truth

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DOMAIN_MAP.md](DOMAIN_MAP.md)
- [TARGET_DATABASE_DESIGN.md](database/TARGET_DATABASE_DESIGN.md)
- [ROADMAP_V2.md](ROADMAP_V2.md)
- [UI_MIGRATION_PLAN.md](UI_MIGRATION_PLAN.md)
- [API_MIGRATION_PLAN.md](API_MIGRATION_PLAN.md)
- [BACKEND_DOMAIN_MIGRATION_PLAN.md](BACKEND_DOMAIN_MIGRATION_PLAN.md)
- [API.md](API.md)
- [PROJECT_STATE.md](PROJECT_STATE.md)
- [CANONICAL_CURRICULUM_SPECIFICATION.md](CANONICAL_CURRICULUM_SPECIFICATION.md)
- [CANONICAL_CURRICULUM.md](curriculum/CANONICAL_CURRICULUM.md)
- Curriculum import rules (historical support artifact removed in Recovery Foundation 2)
- ADR-024 and ADR-025 in [DECISIONS.md](DECISIONS.md)
- [ADR-033](adr/ADR-033-curriculum-persistence-and-composite-references.md)
- [ADR-034](adr/ADR-034-curriculum-governance-and-administrative-permissions.md)

The Persian content transcribed from `cori.docx` is the educational source of truth. Architecture may represent its structure and ambiguity; it must not add, correct, merge, or infer educational content.

## 1. Phase Goal

Deliver the first operational Canonical Curriculum boundary in the modular monolith:

- stable logical node identity;
- complete version snapshots with `draft -> in_review -> published -> superseded` lifecycle;
- exact Persian labels, source ordering, provenance, and source-specific ambiguity preservation;
- idempotent import into a draft;
- administrative review, validation, publication, cross-version mapping, legacy mapping, and audit;
- immutable published/superseded versions;
- version-aware published reads for Student, Counselor, and future consumers;
- non-destructive coexistence with `StudySubject` and `Topic`.

The phase succeeds only when an approved initial Curriculum Version is published atomically, old/current versions resolve deterministically, normal users cannot mutate Curriculum, import/reconciliation evidence is accepted, and all M19 workflows still work.

## 2. Entry Criteria and Blocking Decisions

Coding must not begin until all applicable entry criteria are accepted.

| Entry criterion | Why it is required | Current state |
| --- | --- | --- |
| Roadmap V2 Phase 0 exit criteria | Establishes migration rehearsal, rollback, authorization, test, observability, and source inventory standards | Must be verified before authorization |
| ADR-034 | Governs Curriculum capabilities, separation of duties, administrative workflow, and audit | **Accepted architecture; implementation is a hard security prerequisite** |
| Curriculum migration policy | Governs exact legacy mapping, cutover, reconciliation, and rollback | **Not yet accepted; hard blocker** |
| Physical Prisma/PostgreSQL design review | Converts logical entities into constraints/indexes without weakening ADR-033 | Not defined by target logical design |
| Curriculum capability model | Current coarse `ADMIN` role cannot safely represent editor/reviewer/publisher/importer/mapper/auditor | **Hard security prerequisite** |
| Initial-source authority and checksum procedure | Establishes which `cori.docx` artifact/transcription is imported and how exactness is proven | Must be approved operationally |
| Source ambiguity decisions or authorized exclusions | Missing biology ownership, thematic-tree status, joined Arabic text, shared chemistry/bridging material, and `⭐` can block publication | Unresolved issues may be imported/quarantined; blockers must be decided before publish |
| Version/current-release policy | Defines initial version metadata, version label, effective date behavior, and supersession/current selection | Source does not provide official edition metadata |
| Backup/restore and migration rehearsal | Required before additive production persistence | Production execution mechanism remains incomplete |
| Phase-specific API and UX contract review | Exact paths, representations, admin container, responsive/accessibility acceptance | This document defines required behavior, not final contracts |

Unresolved source content is not a reason to guess. The importer and draft review can represent ambiguity, but Phase 20 cannot meet its publication exit criterion while blocking ownership/identity issues remain unresolved or unreviewed.

## 3. Scope

### In Scope

1. Curriculum domain module, service contracts, persistence adapters, validation, and errors.
2. Additive Curriculum tables and database constraints from the approved target design.
3. Controlled Node Type vocabulary reflecting the actual source representation, including source-omitted levels without synthetic placeholders.
4. Draft creation from an initial source or approved published base.
5. Whole-source import with exact text, order, provenance, idempotency, issue quarantine, and immutable reports.
6. Draft-only node/relationship maintenance required to resolve reviewed import issues.
7. Structural, identity, provenance, lineage, mapping, and publication validation.
8. Review and atomic publication with immutable audit.
9. Version-aware published tree/node/path/search reads.
10. Cross-version mapping registry.
11. Legacy `StudySubject`/`Topic` mapping registry and review status, without rewriting legacy rows.
12. Permission-scoped Curriculum administration capabilities and read-only Student/Counselor consumption.
13. Compatibility, reconciliation, observability, migration rehearsal, security, performance, API, UI, and accessibility evidence required by Roadmap V2 Phase 1.

### Source Hierarchy Boundary

The implementation represents only structures found in the approved Persian source/transcription. The initial source model includes:

```text
Curriculum root
`-- Field / major scope
    `-- Grade
        `-- Subject
            `-- Chapter
                `-- Topic
                    `-- Concept
                        `-- Sub-concept, only where explicitly present
```

The source may skip intermediate levels or use `فصل`, `بخش`, `درس`, `گفتار`, `موضوع`, or unlabeled branches. Phase 20 preserves the explicit tree and quarantines uncertain type/parent ownership. It does not force every branch to the same depth and does not synthesize missing nodes.

Cross-grade thematic trees remain separate unresolved source trees until an authorized decision classifies them. Shared/applicability meaning uses reviewed relationships rather than cloned or guessed ownership.

## 4. Delivery Slices

These slices belong to one dependency-gated phase. Their order permits verification and rollback; it does not allow a partial slice to be declared a complete Curriculum product.

| Slice | Deliverable | Completion evidence |
| --- | --- | --- |
| P20.0 — Readiness | ADR-034 implementation design, accepted Curriculum migration policy, physical design, API/UX contracts, source artifact procedure, migration/rollback/test plans | Signed architecture/security/domain review; no runtime change |
| P20.1 — Persistence foundation | Curriculum entities, constraints, indexes, generated client, empty domain store | Migration rehearsal and old-application compatibility |
| P20.2 — Domain core | Lifecycle, stable identity, type/parent/order/relationship validation, immutable publication model | Unit/integration/database invariant tests |
| P20.3 — Import and provenance | Source parser/loader boundary, import runs, source records, issues, idempotency, immutable report | Same-source replay, exact Unicode/order, ambiguity fixtures, failure recovery |
| P20.4 — Administration | Draft/import/review/resolve/map/validate/publish/audit APIs and minimum approved admin surfaces | Capability matrix and end-to-end governance workflow |
| P20.5 — Published consumption | Current/historical version, ordered tree, node/path, search, retired/deprecated context | Student/Counselor read-only authorization, deep-tree performance, RTL/accessibility |
| P20.6 — Legacy mapping compatibility | Mapping inventory/review states and compatibility resolution; no legacy mutation | Reconciliation counts and ambiguous/unmapped/legacy-only display |
| P20.7 — Publish and rollout | Approved initial version, production rehearsal, monitoring, backup/rollback, cohort/read controls | Phase exit report and product/domain sign-off |

## 5. Database Entities Required

Logical names follow the approved target database design. Physical names and Prisma representation are finalized in the prerequisite physical-design review.

| Entity | Phase 20 purpose | Essential fields/relations | Lifecycle/immutability |
| --- | --- | --- | --- |
| `curriculum_versions` | Complete curriculum snapshot and lifecycle | ID, label, status, optional base version, effective/source metadata, review/publication/supersession actor/time | Draft/review may change under rules; published and superseded snapshot is immutable |
| `curriculum_node_types` | Controlled structural vocabulary | Stable code, display metadata, active state, approved parent-policy metadata | Used codes remain stable; deactivation blocks new assignment but preserves history |
| `curriculum_nodes` | Stable logical educational identity | Opaque ID, creation, optional tombstone/identity note | ID/type identity never reused; no normal hard delete after published use |
| `curriculum_node_revisions` | One node representation in one version | Composite version/node pair, type, same-version parent, exact/source label, separate search value, sibling order, availability/deprecation state | Editable only in draft/review rules; all representation freezes at publication |
| `curriculum_node_relationships` | Reviewed non-owning semantics/lineage | Version-pinned source and target, type, status, rationale, approval | Does not create a second canonical parent; approved/published records remain historical |
| `curriculum_imports` | One idempotent authorized import run | Target draft, source artifact/checksum, idempotency key, actor, status, counts, report reference/times | Import never publishes; completed input identity/report/counts are immutable |
| `curriculum_source_records` | Lossless parsed-source provenance | Import, stable source-record key, exact raw text/label, locator, source order, hints/checksum, disposition, matched node | Raw provenance is immutable; disposition changes are audited |
| `curriculum_import_issues` | Quarantined ambiguity/validation problem | Import/source record, code, severity, details, blocking state, resolution actor/time | Finding input remains; resolution is an audited transition |
| `curriculum_node_mappings` | Directional cross-version lineage/continuity | From/to version-node pairs, mapping type, confidence/status, rationale, approval | Approved decision is immutable; correction supersedes it |
| `legacy_curriculum_mappings` | Reviewed M19 Subject/Topic compatibility | Legacy kind/ID, optional canonical pair, state, rationale, reviewer/times | States include unmapped/proposed/confirmed/ambiguous/legacy-only; no legacy row mutation |
| `curriculum_audit_logs` | Governance history | Actor, action, version/node/import/mapping target, reason, before/after/provenance, time | Append-only and more restricted than published consumer reads |

### Mandatory Persistence Constraints

- `(curriculum_version_id, curriculum_node_id)` uniquely identifies a node representation.
- A non-root parent resolves to a node in the same version; each representation has at most one canonical parent.
- Published tree traversal cannot contain cycles, orphans, duplicate logical IDs, or invalid approved type relationships.
- Sibling order is deterministic and scoped to version plus parent; source order is preserved independently of titles.
- Exact display/source text and normalized search text are separate. Unicode normalization must not erase the original imported text/provenance.
- Stable identities are opaque and never derived from label, path, order, grade, source locator, or normalized text.
- All cross-version, legacy, and relationship endpoints store exact version/node pairs.
- Published/superseded content and completed import provenance use restrictive deletion behavior.
- Hard deletion is limited to an unpublished, unreferenced draft record under an approved audited rule; identifiers are never reused.
- Publication state and audit records cannot be partially committed.

The physical design must explicitly resolve ID representation, ordering/index technique, current-published-version uniqueness, immutable enforcement, and efficient deep-tree/search queries. It may refine storage mechanics but not weaken these invariants.

## 6. Backend Domain Requirements

### Module Boundary

A new Canonical Curriculum module owns:

- Curriculum types and lifecycle vocabulary;
- command/query service interfaces;
- validation and publication policies;
- import orchestration and source adapters;
- store interfaces and Prisma persistence;
- mapping and compatibility decisions;
- domain-specific authorization requirements and audit events.

Fastify routes translate HTTP to domain commands/queries. They do not perform tree identity, mapping, publication, or import decisions themselves. The legacy `student-core` module continues owning current Subject/Topic behavior; it may read a compatibility resolver but may not write canonical tables.

### Domain Commands

Phase 20 must support approved forms of these commands:

- create an initial draft or derive a draft from a published version;
- import an exact source artifact into a draft with an idempotency key;
- create/update/move/reorder/deprecate draft representations with reason and provenance;
- add or supersede reviewed non-owning relationships/mappings;
- record import-issue resolution without erasing the issue;
- submit a draft for review and record review outcome;
- validate a draft and produce reproducible blockers/warnings/impact information;
- publish a validated approved draft atomically;
- record/review a legacy mapping decision;
- withdraw availability only if a separately approved operational policy defines it; never delete the snapshot.

### Domain Queries

- current published version metadata;
- explicit published or superseded version metadata;
- ordered roots/children/subtree with version context;
- exact node representation and ancestor path;
- search by derived search data returning exact label and full distinguishing ancestry;
- draft/import/source/issue/validation/mapping/audit administration views under capabilities;
- legacy mapping state and compatibility display resolution.

### Domain Invariants

- An import completes independently of review/publication.
- Saving a draft does not make it consumer-visible.
- Review approval is not publication.
- Publication freezes a complete snapshot and is all-or-nothing.
- A new version does not rewrite or repoint an old version, mapping endpoint, or legacy record.
- Rename/reorder with unchanged educational identity may retain Node ID; split/merge/type or semantic identity change requires new IDs and explicit lineage.
- Similar/normalized names provide candidates only; an authorized mapping decision establishes identity.
- Students, Counselors, integrations, and AI have no mutation path.

## 7. API Requirements

Exact endpoint names remain subject to Phase 20 API contract approval. The contract must nevertheless provide the following boundaries.

### Published Consumer API

| Query | Required response semantics |
| --- | --- |
| Current published version | Exact version ID, label/status/source summary and availability; absence is distinct from failure |
| Explicit version | Resolve that version or a safe unavailable/not-found outcome; never substitute current |
| Roots/children/subtree | Exact source labels, stable Node IDs, version ID, type, order, availability; bounded/paginated query strategy |
| Node/path | Exact pair and ancestry in the requested version; retired/deprecated context retained |
| Search | Search normalization may match, but response contains exact labels, ancestry, version, type, status, and Node ID |

Student and Counselor consumers read only eligible published data. The same logical node in two versions remains distinguishable by the pair. Consumer responses do not expose draft notes, import evidence, issue details, mapping-review notes, or audit payloads.

### Administration API

| Command/query family | Required contract behavior |
| --- | --- |
| Draft versions | Create from approved base/initial source, list/read, preserve concurrency token, never mutate published version |
| Draft Nodes/relationships | Strict allowlist, exact text, explicit parent/order/type/provenance/reason, conflict/cycle/type errors |
| Imports | Idempotency, source checksum, target-draft lock, progress/status, immutable report/counts, recoverable failure |
| Source records/issues | Paginated/filterable exact provenance and ambiguity; authorization-narrower than published reads |
| Issue resolution | Actor/reason/decision, no silent source-text rewrite, revalidation after decision |
| Validation | Deterministic blocker/warning report tied to draft state/version token |
| Review | Explicit submit/review decision; separation from publish |
| Publication | Explicit actor/reason, concurrency check, validated approved state, atomic success, idempotent retry semantics |
| Cross-version mappings | Exact endpoints, typed direction, rationale, approval, supersession rather than overwrite |
| Legacy mappings | StudySubject/Topic identity, state, optional exact canonical pair, reviewer/rationale, no name-only auto-confirm |
| Audit | Permission-scoped, append-only, filterable by actor/action/version/node/import/mapping and time |

### API Error and Concurrency Requirements

- Distinguish validation errors, lifecycle conflict, stale draft/base, blocking ambiguity, duplicate idempotency request, authorization, hidden resource, and unavailable database/import operation.
- Never disclose draft/import/audit existence to unauthorized callers.
- Publication/import retries must not create duplicate versions, nodes, IDs, mappings, or reports.
- Server state is authoritative for lifecycle and publication; client-supplied actor/status/publication timestamps are rejected.
- Every response uses the standard envelope/request ID and safe operational logging.

## 8. Admin Capabilities

Capability names below are conceptual; the approved authorization design may name them differently while preserving separation.

| Capability | Permitted action | Explicitly not implied |
| --- | --- | --- |
| Curriculum view published | Read eligible published/superseded data | Draft, provenance, or audit access |
| Curriculum draft edit | Create/edit draft structure and metadata | Review approval or publication |
| Curriculum import | Start/retry/view authorized imports | Resolve ambiguity or publish |
| Curriculum issue resolve | Record reviewed source ambiguity decision | General draft publication |
| Curriculum review | Review educational/structural validity | Publish unless separately granted |
| Curriculum publish | Execute approved validated publication | Edit published content |
| Curriculum mapping approve | Approve cross-version or legacy mapping decision | Rewrite endpoints or legacy rows |
| Curriculum audit read | Read governance history | Mutate any Curriculum record |

### Minimum Administration Experience

The approved Phase 20 administration surface must provide:

- version list and prominent Draft/In Review/Published/Superseded state;
- published read mode separated from draft edit mode;
- source/import run, checksum, report counts, and failure/retry state;
- exact source record and ambiguity queue without autocorrection;
- tree/list editor with breadcrumbs, source order, type/parent, provenance, mappings, and impact context;
- validation blockers linked to the exact node/source record;
- review decision and publication preview as separate actions;
- publication confirmation with version, actor, reason, counts, blockers/warnings, and consequences;
- immutable historical version and audit inspection;
- keyboard, screen-reader, deep-tree, Persian/RTL, zoom, loading/partial/error, and non-drag alternatives.

The exact Admin application/container remains an architecture decision. A generic `ADMIN` menu or direct database/seed operation does not satisfy these capabilities.

## 9. Import Pipeline

```text
Authorize and register source artifact/checksum
    -> create/select target draft
    -> parse whole approved transcription/source
    -> emit immutable source records in source order
    -> reconcile through source registry and approved prior identity
    -> create/update draft candidates
    -> quarantine ambiguity/rejection
    -> validate structure and provenance
    -> complete immutable import report
    -> human review/resolution
    -> revalidate
    -> separate review and publication
```

### Import Rules

- Process the whole source, including unrecognized or ambiguous content.
- Preserve original labels/text exactly, including Persian/Arabic characters, digits, punctuation, diacritics, English text, joined paragraphs, and `⭐`.
- Store any normalized search representation separately; never replace exact source/display text.
- Preserve sibling/source order independently of path or label.
- Use the stable source registry, provenance, prior parent, neighbors, and approved reconciliation. Normalized names alone never match identity.
- Re-importing the same source into the same draft creates no duplicate logical nodes, source records, or new Node IDs.
- Produce accepted, unchanged, ambiguous, rejected, and deprecated counts plus record-level diagnostics.
- Import cannot publish, resolve ambiguity automatically, synthesize missing hierarchy, or silently split joined source paragraphs.
- Blocking ambiguity prevents publication unless an authorized decision explicitly resolves or excludes it with audit.

### Required Source-Specific Issue Fixtures

Tests and review queues must include at least:

- missing explicit Biology subject boundaries;
- cross-grade thematic Arabic, Persian, English, Experimental Mathematics, and Literary Sciences trees;
- `مهارت‌ها و مباحث پیوندی ⭐` ownership;
- shared Chemistry prose relationship;
- informal standalone field headings;
- joined Arabic paragraph;
- undefined `⭐` marker semantics;
- omitted lower-priority detail and inconsistent/omitted intermediate labels.

These fixtures verify quarantine and exact preservation, not automatic solutions.

## 10. Migration Rules

1. Add new Curriculum persistence only through new migrations; preserve all applied M19 migration files.
2. Inventory `StudySubject`, `Topic`, and every inbound Task/Session/Assessment/Goal reference before schema change.
3. Do not add or backfill canonical pairs on Tasks, Sessions, Assessments, Goals, or StudyPlans in Phase 20.
4. Do not modify, merge, archive, delete, or rename legacy Subject/Topic rows as part of import or mapping.
5. Legacy mappings record reviewed interpretation; mapping state is not a foreign-key rewrite.
6. Import/backfill work is resumable, idempotent, observable, and emits immutable reconciliation evidence.
7. The existing applications and APIs must operate against the expanded database before any target UI/API cutover.
8. Legacy Subject/Topic reads and writes remain available throughout Phase 20 unless a separately approved, fully proven workflow cutover says otherwise.
9. Rollback may hide/disable target Curriculum capability, but it must preserve any target-era audit/import data and keep M19 workflows safe.
10. Initial publication is an explicit authorized operation after review; a migration or seed must not publish Curriculum implicitly.
11. Development fixtures are not production Curriculum authority. `cori.docx` and its reviewed transcription/provenance govern initial content.
12. Published and superseded versions remain queryable indefinitely under current retention decisions.

## 11. Tests Required

### Domain Unit Tests

- version lifecycle and forbidden transitions;
- draft-only mutation and published/superseded immutability;
- stable ID retention for compatible editorial changes and new identity for reviewed semantic replacement/split/merge;
- one parent per representation, same-version parent, root handling, cycle detection, orphan rejection, allowed skipped levels, and type compatibility;
- deterministic sibling ordering and reorder behavior;
- exact version/node pair validation and no latest-version fallback;
- relationship/mapping type, direction, endpoint, supersession, and audit rules;
- publication blocker aggregation and deterministic validation output;
- capability matrix and separation of edit/review/publish/map/audit actions.

### Import Tests

- exact Persian/Arabic/English Unicode, punctuation, diacritics, digits, whitespace policy, joined text, and star preservation;
- whole-source processing and source order;
- same-source/same-draft idempotency and stable registry replay;
- changed artifact/checksum behavior and explicit target draft;
- normalized-name collision does not auto-match;
- ambiguity quarantine, blocking severity, resolution audit, and report reproducibility;
- partial parse/store failure recovery without duplicate or half-complete success;
- source-specific ambiguity fixtures listed above;
- immutable completed import provenance and counts.

### Persistence and Migration Tests

- additive migration applies to an M19 fixture and preserves every current row/count/reference;
- old API/application validation passes against the expanded schema;
- unique composite version/node pair, parent/version integrity, ordering, restrictive deletion, and lifecycle constraints;
- published/superseded update/delete rejection;
- transaction rollback leaves no partially visible publication/version state;
- migration replay/rollback or approved forward-fix rehearsal and reconciliation report;
- production-sized tree/import/search/index and lock-duration tests;
- backup and isolated restore resolve published and legacy data.

### API Contract and Authorization Tests

- published reads for authorized Student/Counselor/Admin consumers;
- no mutation path for Student/Counselor/integration/AI identities;
- each administrative capability allows only its operation;
- unauthorized responses do not disclose draft/import/audit existence;
- strict request schemas reject IDs/status/actor/timestamps owned by server;
- explicit historical version resolution and unavailable-version behavior;
- ordered tree/children/node/path/search representations retain exact version and labels;
- import/publication idempotency, stale concurrency, blocking ambiguity, and safe error codes;
- request ID, error envelope, redacted logging, rate/abuse controls for high-impact operations.

### Compatibility Tests

- mapped, proposed, ambiguous, unmapped, and legacy-only Subject/Topic records display correctly;
- no name-only mapping occurs;
- M19 Tasks, StudySessions, AssessmentAttempts, Goals, and StudyPlans retain original labels/IDs and behavior;
- no current endpoint silently returns canonical identity for an unconfirmed mapping;
- target published reads can be disabled/rolled back without breaking M19 workflows.

### UI and Accessibility Acceptance

- read-only Student/Counselor tree/list, exact labels/order, breadcrumbs, version/status, search ancestry, and historical retired state;
- Admin import/issue/tree/review/publication/audit workflow;
- loading, empty, partial, stale, validation, conflict, unauthorized, failed import, blocked publication, and retry states;
- WCAG 2.2 AA, keyboard, screen reader tree semantics/list alternative, visible focus, zoom/reflow, contrast, reduced motion, and mobile RTL;
- no unfinished target selector is exposed in current Task/Plan/Assessment workflows.

### Operational and Security Tests

- concurrent draft edits and publication conflict handling;
- atomic publication visibility across consumers;
- audit completeness and tamper-resistant append behavior;
- cache/search invalidation keyed by version and no cross-version label leakage;
- sensitive source/provenance/audit access and log redaction;
- monitoring for import failure, publication failure, constraint violation, orphan attempt, latency, and reconciliation mismatch;
- rollback/read-disable drill preserving published/import/audit evidence.

## 12. Observability and Rollout

- Record import run ID, target draft, source checksum, outcome counts, duration, failure category, and request/correlation IDs without logging protected source payloads unnecessarily.
- Record validation and publication outcomes, actor/capability, version, duration, blocker counts, and atomic success/failure through approved audit and operational logs.
- Monitor tree/path/search latency, cache version, database constraint failures, mapping-state counts, unresolved blockers, and legacy compatibility failures.
- Roll out consumer reads only after publication and reconciliation. Cohorts must never see a partial version.
- Keep target operational disable controls distinct from deleting or unpublishing data.
- A rollback plan explains how target-created import, mapping, and audit records remain safe while current clients continue on legacy APIs.

## 13. Exit Criteria

Phase 20 is complete only when all are true:

1. ADR-034's capability model is implemented and the separate Curriculum migration policy, physical schema, API contract, source policy, and rollback plan are approved.
2. At least one approved Curriculum Version is imported, reviewed, validated, and published atomically from the authorized source artifact.
3. Every published node has stable identity, exact label, type, parent/root state, deterministic order, and provenance.
4. Blocking source ambiguities are resolved or explicitly excluded by authorized decision; no importer heuristic supplied educational meaning.
5. Published and superseded versions cannot be mutated and remain queryable by exact version/node pair.
6. Students and Counselors have published read-only access; administrative capabilities are separately enforced and audited.
7. Re-import is idempotent and import/validation/publication reports are reproducible.
8. Legacy mappings distinguish confirmed, proposed, ambiguous, unmapped, and legacy-only records without changing legacy rows.
9. All M19 APIs, frontend workflows, StudySubjects, Topics, Tasks, Sessions, AssessmentAttempts, Goals, and StudyPlans remain operational.
10. Migration, reconciliation, authorization, performance, security, RTL, accessibility, monitoring, backup/restore, and rollback evidence passes.
11. Curriculum/domain experts, product, security, operations, backend, database, API, and UX owners sign off against Roadmap V2 Phase 1.
12. No Phase 2 or later write model has been introduced.

## 14. Explicitly Excluded Features

Phase 20 must not include:

- Student Progress tables, APIs, mastery, statuses, evidence rules, or cross-version transfer;
- canonical backfills or required references on `DailyTask`, `StudySession`, `AssessmentAttempt`, `StudyPlan`, or `StudentGoal`;
- disabling or deleting StudySubject/Topic reads or writes;
- versioned counselor Plans, Daily Reality, Task evolution, Task Results, or five-level task learning quality;
- changes to current Study Session lifecycle/ratings;
- conversion or classification of `AssessmentAttempt`;
- Practice Activity;
- Question Bank, Question media, rights workflow, or item responses;
- External provider/report workflows or evidence upload;
- Internal Exam authoring, delivery, attempts, answers, scoring, or results;
- Communication, Tickets, Suggestions, acquisition workflows, or Private Counselor Notes;
- reporting projections, Analytics, AI, rankings, recommendations, or automated diagnosis;
- generic content, school, subscription, payment, marketplace, or post-exam abstractions;
- invented curriculum labels, levels, parents, relationships, prerequisites, learning objectives, weights, difficulty, aliases, or source corrections;
- automatic mapping by normalized label or automatic Progress transfer;
- a microservice split, new database, or a generic unrestricted Admin panel;
- rewriting applied migrations, destructive cleanup, or hard deletion of published/history-bearing records.

These exclusions protect the dependency order. The next coding phase may begin only after Phase 20 meets every exit criterion and receives explicit authorization.
