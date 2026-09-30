# ADR-033: Curriculum Persistence and Composite Reference Contract

**Status:** HISTORICAL / SUPERSEDED by Recovery Foundation 1 and 2; not active authority
**Decision date:** 2026-09-17
**Related decisions:** ADR-024, ADR-025, ADR-028

This ADR is retained as history. Its persistence/versioning design must not be treated as the replacement Curriculum architecture.

## Context

Konkourix currently stores student-owned `StudySubject` and `Topic` records. Those records are useful transitional data, but they are not controlled master curriculum and cannot provide a shared identity for counselor planning, student progress, practice, questions, internal exams, and analytics.

The approved curriculum architecture separates stable educational identity from the representation of that identity in an immutable published curriculum version. Historical product records must resolve exactly as they did when created, even after a title, parent, order, activation state, split, or merge changes in a later curriculum version. A node identifier without its governing version is therefore insufficient as an operational reference.

## Decision

Canonical Curriculum is a centrally governed domain with these persistence concepts:

- `CurriculumVersion` represents a complete, internally consistent curriculum snapshot. Draft and review versions may change; published and superseded versions are immutable.
- `CurriculumNode` supplies an opaque, globally unique logical identity that may continue across editorial revisions when the educational meaning remains the same.
- Version-scoped node records hold the label, type, parent, sibling order, activation state, and other representation valid in one `CurriculumVersion`.
- Version-scoped relationships hold non-tree semantics such as predecessor, successor, prerequisite, equivalence, split, or merge. They do not introduce a second canonical parent.
- Titles, normalized titles, slugs, paths, source row positions, and parent/title combinations are attributes or lookup aids, never identity.

Every persisted reference from Tasks, Study Plans, Student Progress, Practice, Questions, External Exam evidence, Internal Exams, and later reporting facts must pin the pair:

```text
curriculum_version_id + curriculum_node_id
```

The pair must resolve to a node representation that belongs to that version. Product domains must not store only `curriculum_node_id`, silently resolve it against the latest version, or use a version-scoped row identifier without retaining logical node identity. New user activity normally selects from the current published version; it never upgrades an existing reference automatically.

Only authorized Curriculum administrators may create, revise, review, publish, deprecate, retire, or map canonical data. Students and counselors are read-only consumers. All curriculum mutations and publication actions cross the Curriculum Domain boundary and are auditable.

## Alternatives Considered

- **Keep one mutable curriculum tree.** Rejected because edits would reinterpret historical plans, questions, and progress.
- **Assign entirely new node identities in every release.** Rejected because compatible renames and reorderings would lose stable educational identity and make longitudinal analysis needlessly ambiguous.
- **Store only the logical node ID in consumer domains.** Rejected because the exact historical label, path, and status could not be reproduced deterministically.
- **Use names, normalized names, or paths as keys.** Rejected because Persian labels are not guaranteed unique or stable and normalization may collapse distinct source records.
- **Copy curriculum structures into each product domain.** Rejected because divergent taxonomies would emerge and governance would be duplicated.

## Consequences

Historical references remain reproducible and old curriculum versions remain queryable. Compatible editorial changes retain logical identity, while semantic splits and merges remain explicit rather than silently rewriting evidence. All educational domains share one governed vocabulary.

The model costs additional storage and joins. Consumers must understand both logical node identity and version context. Publication validation, lineage management, and caching are more complex than a mutable tree. Cross-version analytics must use explicit lineage and cannot assume that equal labels mean equal concepts.

## Migration Impact

Adoption is additive and staged. Existing `StudySubject`, `Topic`, `DailyTask`, `StudySession`, `AssessmentAttempt`, and `StudentGoal` records remain intact. No applied migration is rewritten and no legacy reference is destructively converted.

Future migration work may add canonical tables, source/provenance records, reviewed legacy mappings, and nullable composite references to consumer records. Compatibility reads may combine canonical and legacy display data through an adapter. Canonical references become mandatory only for new writes after each affected workflow is proven. Unmapped or ambiguous legacy records remain valid legacy history; the system must not invent canonical links to complete a backfill.

## Security Impact

Curriculum read and mutation permissions are separate. Normal product users may read only published curriculum data that is eligible for consumption. Drafts, review notes, provenance evidence, import reports, and rights-limited source material require narrower administrative access.

Publishing, superseding, deprecating, retirement, lineage changes, imports, and mapping approvals require server-enforced authorization and append-only audit records with actor, time, reason, and affected version/node identifiers. Client-supplied curriculum pairs must be validated for existence, pair integrity, publication state, and eligibility for new use.

## Future Constraints

- Published and superseded curriculum versions must never be updated in place or hard-deleted through normal operations.
- Every new educational domain reference must store the version/node pair; “latest curriculum” is not a valid historical foreign reference.
- Semantic split and merge operations must create explicit lineage and must not transfer student mastery automatically.
- Canonical tree membership has one parent per node representation per version; cross-cutting meaning uses typed relationships or classification links.
- Import matching must use stable source identity and provenance, not normalized labels alone.
- Caches, search indexes, exports, analytics, and APIs must preserve version context even when displaying current labels.
