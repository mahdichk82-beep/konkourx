# ADR-041: Question Bank Moderation, Versioning, Curriculum Classification, and Rights

**Status:** Accepted target architecture; Primary Link requirement superseded by Product Map; not implemented
**Decision date:** 2026-09-17; supersession synchronized 2026-10-02
**Related decisions:** ADR-025, ADR-028, ADR-033, ADR-039

## Context

The Question Bank will supply governed items for targeted practice and Internal Online Exams. Questions may come from original authors, commissioned contributors, licensed sources, or externally referenced materials. Educational correctness, answer and solution validity, curriculum classification, attribution, and legal rights all affect whether an item may be published.

Question content and Curriculum can evolve independently. An exam result must remain reproducible against the exact content and classifications used when an exam was assembled. The canonical Product Map now closes cardinality as many-to-many and permits an optional Primary Curriculum Link. Ancestor storage/derivation and linkage-version mechanics remain implementation design concerns.

## Decision

A Question has a stable logical identity and one or more immutable Question Versions. Content changes—including wording, choices, answer key, solution, media, language, material scoring metadata, or reviewed curriculum classification—create a new Question Version.

The moderation lifecycle is:

```text
Draft -> Submitted -> In Review -> Approved -> Published
```

`Changes Requested` and `Rejected` return or end a submission without publication. `Withdrawn` and `Retired` stop new use of a published version while preserving prior exam and practice history. Approval confirms review completion; publication is the separate authorized act that makes a version selectable by consumers.

Publication requires:

- educational-content review;
- answer and solution verification;
- source and author attribution review;
- copyright/license review with an affirmative usable rights basis;
- curriculum classification review;
- required audit and provenance records.

Each Question Version has one or more explicit many-to-many links to published canonical Curriculum nodes. Every link pins the applicable Curriculum reference. At most one optional link may be designated `primary` for display/grouping. Every link remains semantically valid, and there is no universal requirement that every subject expose or use a Micro Topic/Atomic Concept. Detailed link roles require later scoped design consistent with [PRODUCT_MAP.md](../PRODUCT_MAP.md).

Ancestor classification is derived from the pinned curriculum version and is not stored as independent authoritative tagging. A curriculum-link correction creates a new Question Version; published version links are never edited in place. Internal Exam Versions pin exact published Question Versions.

Unknown, expired, revoked, or disputed rights block new publication and new exam selection. Withdrawal or rights restriction does not delete delivered content or corrupt attempts; access to retained content follows legal and operational policy.

## Alternatives Considered

- **Keep mutable question rows.** Rejected because answer keys, content, and classification could change beneath delivered exams.
- **Moderate content but not rights metadata.** Rejected because technical publication must not outpace permission to use the material.
- **Use a single curriculum node.** Rejected because questions can assess multiple concepts.
- **Allow multiple tags without a primary link.** Rejected because default classification and composition would become ambiguous.
- **Require an atomic node for every question.** Rejected because the authoritative curriculum does not guarantee that depth for every branch; implementations must not invent missing nodes.
- **Store all ancestors as authoritative tags.** Rejected because redundant ancestry becomes stale and obscures the actual reviewed concepts.
- **Allow trusted contributors to publish directly.** Rejected because submission authority is not educational, answer, curriculum, copyright, or publication authority.

## Consequences

Published questions are reproducible, attributable, rights-aware, and usable across multiple curriculum concepts. Exact version pinning protects historical exams and practice. A primary classification supports deterministic default behavior without denying multi-concept questions.

Every substantive correction requires a new reviewable version, including classification corrections. The workflow has several roles and may slow publication. Rights evidence and source records add operational and storage cost. Deriving ancestors requires access to the pinned curriculum version and careful indexing in read models.

## Migration Impact

The Question Bank is a new additive domain introduced after Canonical Curriculum publication and permission foundations. There is no current question table to convert. Seed, partner, or later imported questions enter through provenance, rights, curriculum-link, and moderation controls; they are not inserted directly as published content.

Practice and Internal Exam adoption follows staged reads and writes. Existing `AssessmentAttempt` data remains aggregate legacy evidence and does not gain synthetic Question records or item-level responses. No existing Study Session, Task, or Assessment Attempt is rewritten.

## Security Impact

Submission, review, approval, publication, withdrawal, and exceptional correction are separate server-enforced capabilities. A contributor cannot approve or publish merely because they authored the content. Separation-of-duty requirements for high-risk sources may be strengthened operationally without changing the domain boundary.

Draft questions, answer keys, solutions, source files, contracts, and rights evidence are restricted content. Student-facing delivery must reveal only what the applicable Practice or Exam policy permits. Media and rich content require malware scanning, type/size validation, safe rendering, and controlled storage. Every moderation transition and content/version change is auditable.

## Future Constraints

- Published Question Versions are immutable and cannot be hard-deleted while referenced by practice, exams, attempts, or results.
- Every published version has at least one curriculum link and exactly one primary link.
- All curriculum links pin the version/node pair; no link silently follows “latest curriculum.”
- Ancestors are derived from the pinned curriculum snapshot, not copied as authoritative tags.
- A Question Version with an invalid rights state cannot be selected for new delivery.
- Internal Exam Versions always pin exact Question Versions, never logical Question IDs alone.
- Difficulty, format, language, psychometrics, duplicate detection, media architecture, and specialized link roles require separate approved decisions.
