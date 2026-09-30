# Curriculum Source of Truth

**Status:** APPROVED SOURCE LOCK
**Product Owner decision:** 2026-09-30
**Authoritative educational source:** `cori.docx`
**Audited source path:** `C:\konkourx-source\cori.docx`
**Audited SHA-256:** `120f2b80c3ccf825dcb24406dcc328d32bbdfba9fb4f747edf258d047678b948`

## Authority

`cori.docx` is the authoritative educational curriculum source for Konkourix. Its authored hierarchy, labels, ordering, content, depth, and source-defined organizations are Product Owner-controlled educational truth.

No AI, developer, architect, administrator, reviewer, import process, or implementation process may invent, remove, rewrite, correct, normalize semantically, merge, split, expand, reduce, or scientifically review an educational node without explicit Product Owner approval.

This lock applies even when the source differs from external educational knowledge, appears incomplete, uses unequal depths, or contains more than one way of organizing related material.

## Source-Preservation Rules

- Different source-defined structures may coexist, including grade/book trees and thematic or cross-grade trees.
- The source must not be flattened into an invented fixed-depth taxonomy.
- A missing intermediate level must not be synthesized.
- A source-authored level must not be removed merely because a runtime model does not support it.
- Source order and labels must be preserved unless the Product Owner explicitly approves a change.
- An incomplete source branch must remain visibly incomplete; implementation must not fill it from outside knowledge.
- Structural uncertainty must be reported as a decision gate, not silently resolved.

## Runtime Relationship

Runtime models, generated TypeScript catalogs, database records, manifests, imports, APIs, and UI views are projections of the source. They are not authorities over it. A runtime projection may support only part of the source during a milestone, but it must identify omissions and must never redefine the source.

Product runtime governance and versioning are separate from educational source truth. Runtime controls may manage publication, compatibility, auditability, or deployment of a projection; they may not approve or alter educational content.

The existing 56-subject runtime freeze is a historical projection and is not an authority over the DOCX subject-availability matrix or its authored lower-level structures.

## Product Consumers

- Student and counselor planning consume Curriculum as a shared reference. Those workflows do not edit the canonical hierarchy.
- A future Question Bank may reference existing Curriculum nodes after its own approved review process. It must not alter Curriculum or become a source of Curriculum truth.
- Personal or life time blocks may coexist with planning, but they are not Curriculum nodes.

## Verified Source Relationship

The 2026-09-30 source audit confirmed that `docs/curriculum/CANONICAL_CURRICULUM.md` preserves the DOCX's 74 high-level subject placements and its complete detailed educational sequence in the same order and with the same labels. That Markdown file also contains implementation and governance commentary; such commentary is not educational source content and cannot override this lock.

## State Classification

### CURRENT IMPLEMENTED STATE

The rejected partial runtime projection and Curriculum governance/Knowledge machinery created after the AssessmentAttempt checkpoint has been removed from the active application. A deterministic, file-backed, read-only runtime now projects the protected transcription without changing its educational meaning or using PostgreSQL. The historical Prisma models and database tables remain temporarily retained, unused by this runtime, and do not supersede `cori.docx`.

### APPROVED FUTURE STATE

Konkourix will preserve the authored source and expose fit-for-purpose runtime projections for student/counselor planning, progress measurement, reporting, and future question linking.

### EXPLORATORY / DEFERRED

The replacement runtime data model, projection process, publication controls, and compatibility strategy require separately approved architecture milestones. This source lock does not authorize runtime recovery or database changes.
