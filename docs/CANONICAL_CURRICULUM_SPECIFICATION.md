# Canonical Curriculum Specification

**Status:** HISTORICAL / SUPERSEDED by Recovery Foundation 1 and 2; not active authority
**Last synchronized:** 2026-09-17

This document is retained as historical design context. Its fixed taxonomy, governance, and publication assumptions do not govern current or future implementation. The authoritative educational source and current recovery boundary are defined by [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md), [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md), and [PROJECT_STATE.md](PROJECT_STATE.md).

This specification defines the canonical educational taxonomy that future planning, student progress, questions, internal exams, and analytics will share. It defines domain behavior only. It does not prescribe a database schema, migration, API, or administration interface.

## Purpose and Authority

Konkourix owns one canonical curriculum. Domain experts curate it through an admin-controlled workflow. Students, counselors, teachers, schools, integrations, and AI may reference published curriculum data but cannot create, rename, move, publish, deactivate, or delete canonical nodes.

Canonical curriculum is reference infrastructure for:

- counselor and student planning;
- student-specific progress;
- the moderated question bank;
- internal Konkourix exams;
- future reporting and analytics.

It is not a user folder tree and is not copied per student or counselor.

## Hierarchy

The curriculum is a rooted, ordered tree. The approved semantic levels are:

```text
Track / Field
`-- Subject
    `-- Chapter
        `-- Section
            `-- Topic
                `-- Micro Topic / Atomic Concept
```

The minimum useful example is:

```text
Subject
`-- Chapter
    `-- Section
        `-- Micro Topic
```

Different subjects may omit a nonessential intermediate display level, but they must not invent user-specific node types. A node has one canonical parent within a published curriculum release. Cross-cutting relationships, prerequisites, and question tagging are references, not extra parents in the canonical tree.

## Stable Identity

- Every logical curriculum node receives an opaque, globally unique stable ID.
- Stable IDs are never derived from titles, slugs, position, parent path, language, or school year.
- Renaming, reordering, or correcting metadata does not change the stable ID when the educational meaning remains the same.
- A deleted, merged, or split meaning never causes an old ID to be reused.
- Semantic splits and merges create new logical IDs and explicit predecessor/successor mappings.
- Human-readable codes and slugs may exist for import, search, and administration, but are aliases rather than identity.
- Historical operational records retain the stable node ID and the published release/revision context used when the record was created.

## Versioning and Releases

Curriculum editing and curriculum consumption use different lifecycles:

- A **logical node** supplies stable identity across compatible editorial changes.
- A **node revision** is an immutable representation of a node's title, description, type, parent, ordering, and other approved metadata within a release.
- A **curriculum release** is an immutable, internally consistent snapshot of published node revisions and structure.

Editors work in a draft release. Publishing atomically creates a new immutable release; it never mutates an earlier published release. Consumers normally use the current published release for new references. Historical tasks, executions, assessment evidence, and published questions remain interpretable using their recorded release context.

Editorial corrections that do not change meaning may retain the logical node ID. A semantic replacement, split, or merge requires new logical IDs and explicit lineage. Student progress continuity across such lineage is a separately reviewed policy, never an automatic destructive rewrite.

## Ordering

- Sibling order is explicit and admin-controlled.
- Order is scoped to a parent and a curriculum release.
- Titles and creation timestamps never determine canonical order.
- Reordering in a draft affects only the next published release.
- The persistence technique for efficient reordering is intentionally left to implementation design; consumers depend only on deterministic sibling order.

## Activation and Retirement

Canonical lifecycle states are conceptually:

- **Draft:** editable and invisible to normal product consumers.
- **Active:** published and available for new references.
- **Deprecated:** still readable and historically valid, but discouraged for new references while a successor may be shown.
- **Retired:** unavailable for new references and retained for history.

Published nodes are never hard-deleted through normal operations. Deactivation or retirement does not remove historical links. A retired parent does not silently reparent its descendants; the replacement structure must be reviewed and published explicitly.

## Ownership and Publishing Workflow

The governance roles are conceptual and may be held by the same person only when an approved operational policy permits it:

- **Domain Expert / Editor:** prepares content and structural changes.
- **Reviewer:** verifies educational correctness and structural consistency.
- **Publisher / Authorized Admin:** publishes an approved release.
- **Super Admin:** manages exceptional access and governance, not ordinary educational authorship.

The publication workflow is:

```text
Draft change
    -> Expert review
    -> Structural and reference validation
    -> Approval
    -> Atomic publication
    -> Previous release remains readable
```

Required validation includes unique identity, valid parent/type combinations, absence of cycles, deterministic sibling order, valid predecessor/successor references, and impact review for existing plans, progress, questions, and exams.

Publishing, unpublishing, deprecating, and successor mapping require durable audit records containing actor, time, reason, affected nodes, and release identifiers.

## Consumer Rules

- Planning references canonical nodes; it does not copy or edit curriculum structure.
- Student progress overlays a student and canonical node; it does not modify the node.
- Questions may link to multiple canonical nodes under the Question Bank decision.
- Internal exams consume approved question versions and published curriculum references.
- Analytics reads source facts and curriculum lineage but does not own or rewrite either.
- AI access is read-only and limited to approved published curriculum data.

## Existing Data Compatibility

The current `StudySubject` and `Topic` models are transitional. Their compatibility policy is:

1. Preserve every legacy row and its identifiers during the compatibility period.
2. Build an explicit, reviewable mapping registry from legacy subjects/topics to canonical nodes.
3. Allow mappings to be unmapped, proposed, confirmed, ambiguous, or intentionally retained as legacy-only.
4. Permit one legacy record to map to more than one canonical node only after expert review; never infer destructive merges automatically.
5. Keep historical task, session, assessment, and goal provenance readable even when no canonical mapping can be confirmed.
6. Stop legacy writes only after canonical reads and writes are proven for every affected workflow.
7. Retire legacy creation/editing in stages; do not delete legacy data as part of cutover.

### Read/Write Transition

The target transition is staged:

```text
Inventory and mapping
    -> canonical administration and publication
    -> compatibility reads
    -> canonical references for new writes
    -> legacy writes disabled
    -> legacy data retained for historical reads
```

During compatibility, responses may compose canonical and legacy labels through an explicit adapter. Dual writes are not assumed: if later proposed, they require idempotency, reconciliation, and failure semantics to be approved first. No SQL or physical data model is authorized by this specification.

## Unresolved Implementation Details

- physical table and index design;
- release selection for long-lived drafts;
- exact node-type flexibility by track;
- localization and alternate-title storage;
- efficient ordering representation;
- progress transfer policy for node splits and merges;
- administrative UI and permission granularity;
- import/export formats and external curriculum codes.
