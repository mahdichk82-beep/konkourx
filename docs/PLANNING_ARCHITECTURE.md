# Planning Architecture

**Status:** SUPPORTING TARGET ARCHITECTURE; interaction details refined by later canonical decisions
**Last synchronized:** 2026-10-07

This specification defines the target planning model. It preserves `DailyTask` as planned educational intention and `StudySession` as actual execution, but it does not declare the current `StudyPlan` schema to be the final persistence model.

[PRODUCT_MAP.md](PRODUCT_MAP.md) governs product behavior, [ROADMAP.md](ROADMAP.md) governs sequencing, and [2026-10-07-planning-curriculum-interaction-design.md](superpowers/specs/2026-10-07-planning-curriculum-interaction-design.md) records the approved future browse-only Curriculum, tri-state recursive Picker, read-only 24×4 Daily Timeline, and planning-presentation decisions together with historical `WHOLE` compatibility. This supporting architecture does not authorize implementation or override those decisions.

## Core Concepts

- **Plan:** counselor-authored planning aggregate for one student and planning horizon.
- **Draft Revision:** editable counselor workspace that has not been published to the student.
- **Published Plan Version:** immutable snapshot of the plan the student was asked to follow.
- **Schedule Block:** a versioned time allocation. A learning block references canonical curriculum; a context block may represent school, rest, or another non-learning constraint.
- **Planned Learning Unit:** educational intention within a learning block, including activity type, planned duration, planned question count, expected outcome, and canonical curriculum references.
- **Personal Task:** student-authored learning intention, visibly separate from counselor-authored plan content.
- **Execution Evidence:** `StudySession`, practice evidence, or assessment evidence describing what actually occurred.

## Counselor Authority

An actively assigned counselor may:

- create and prepare a plan;
- add, remove, copy, and reorder future schedule blocks in a draft;
- move future blocks between eligible times or days;
- adjust future workload, duration, planned questions, expected outcomes, and activity type;
- change future curriculum references;
- publish a reviewed plan version;
- create a new revision from the current published version.

Publishing is explicit. Saving a draft does not silently change what the student currently sees as the active plan.

## Student Authority

A student may:

- read the active published counselor plan;
- execute its planned learning units;
- report actual study, practice, assessment, completion, learning quality, notes, difficulty, and problems through the appropriate domains;
- create and manage personal learning tasks under the personal-task policy.

A student cannot edit, move, replace, delete, or republish counselor-authored plan content. Reporting reality does not rewrite the original intention. Personal tasks never masquerade as counselor-authored content.

## Versioning and Revision

- A published plan version is immutable.
- Counselor changes after publication occur in a new draft revision.
- Publishing a revision creates a new immutable version and makes it effective from an explicit boundary.
- Earlier published versions remain readable.
- Version lineage records which published version a revision supersedes.
- Unpublished drafts may be edited freely by their authorized counselor without altering student-visible history.
- Concurrent counselor edits require an explicit conflict policy; silent last-write-wins behavior is not acceptable for publication.

Each logical block or learning unit needs lineage across revisions so a moved or adjusted future item can be recognized as a revision of the same intention. A semantically replaced item may instead end one lineage and create another. Exact identifiers are an implementation decision.

## Future Versus Historical Boundaries

- A revision may modify future, unexecuted plan content.
- Past published content remains frozen in its original version.
- Once execution evidence exists, its referenced plan version and planned-unit snapshot remain immutable.
- Moving or replacing a future block does not move, relabel, or delete existing `StudySession` or assessment evidence.
- Late or historical reporting attaches to the version and unit that actually governed the work where known.
- Correction of execution facts follows the owning execution or assessment lifecycle; it never edits the published plan snapshot.

The precise definition of the future-edit boundary—time, local day, explicit lock, or first evidence—must be approved before implementation.

## Publication Rules

Before publication, the system validates:

- active student-counselor assignment;
- canonical curriculum references valid for new use;
- valid time ranges and absence or explicit resolution of conflicting blocks;
- supported activity types and non-negative workload;
- revision base has not changed concurrently;
- clear effective date/time and student visibility.

Publication must be atomic from the student's perspective. A student must not observe a partially published week.

## Audit Requirements

Durable audit history is required for:

- plan creation;
- draft creation and abandonment;
- publication and supersession;
- block addition, removal, movement, and replacement;
- workload, curriculum, activity, and expected-outcome changes;
- actor, timestamp, reason, base version, and affected student;
- exceptional admin intervention.

Audit data is append-only operational evidence. It is not general chat, counselor notes, or a substitute for plan versions.

## Relationship to Current Models

Current `DailyTask` records remain the implemented planning intention and must not be destructively rewritten. Current counselor task creation is a useful foundation but is not equivalent to plan drafting and publication. Current student-owned `StudyPlan` behavior is transitional relative to this target and requires a compatibility design before any schema change.

## Unresolved Implementation Details

- final aggregate and persistence boundaries;
- version and block lineage identifiers;
- publication granularity: day, week, or arbitrary range;
- explicit future-edit lock boundary;
- conflict-resolution UX;
- whether current `DailyTask` becomes a published-unit snapshot or is related to one;
- notification behavior after publication or revision;
- approval rules for counselor reassignment during an active plan.
