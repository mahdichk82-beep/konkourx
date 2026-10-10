# Question Bank Architecture

**Status:** Supporting target architecture; not implemented
**Last synchronized:** 2026-10-02

[PRODUCT_MAP.md](PRODUCT_MAP.md) governs Question Bank product behavior. This document supplies supporting architecture only and may not override the canonical many-to-many relationship or optional Primary Curriculum Link.

The Question Bank is a moderated content domain built after canonical curriculum and student progress foundations. It is not an open publishing surface.

## Question Identity and Versioning

- A question has a stable logical ID.
- Published question content is immutable and versioned.
- Editing wording, choices, answer keys, solutions, media, or material metadata creates a new reviewable version.
- Internal exams reference the exact approved question version selected for the published exam version.
- Withdrawal prevents new selection but does not corrupt already delivered exams or historical results.

## Attribution and Source

Each submission records structured provenance appropriate to its source:

- submitting account and submission time;
- author or creator attribution when known;
- source type, such as original, licensed, commissioned, or externally referenced;
- source publication/provider and bibliographic details when applicable;
- contributor organization where applicable;
- ownership claimant and verification status.

Displayed attribution is a publication policy distinct from internal provenance. Removing public credit must not erase internal audit history.

## Copyright and Rights Metadata

Before publication, a question requires a reviewed rights basis. Metadata may include:

- copyright owner;
- license or permission basis;
- allowed uses and channels;
- attribution requirements;
- territory or time restrictions;
- source evidence and reviewer;
- takedown, expiry, or dispute state.

Unknown or disputed rights block publication and new exam selection. Copyright metadata is not free-form decoration; it is part of publication eligibility.

## Moderation Workflow

```text
Draft / Submitted
    -> Educational review
    -> Answer and solution verification
    -> Copyright review
    -> Curriculum-link review
    -> Approved
    -> Published
```

Rejected, changes-requested, withdrawn, and retired states remain auditable. Teacher or counselor submission never implies approval. Authorized moderators and publishers are server-enforced roles.

## Curriculum Relationship

The accepted cardinality is:

```text
Question  N <----> N  Canonical Curriculum Node
```

A question may address multiple canonical nodes. Each link is explicit, moderated, version-aware, and independently auditable. Links must be sufficiently precise for search, targeted practice, exam construction, and later weakness analysis. Free-text tags do not replace canonical links.

Published questions cannot depend solely on retired nodes for new selection. Curriculum splits or merges do not silently rewrite historical question links; revised links are reviewed and published with appropriate question or linkage versioning.

## Product Decisions Closed by the Product Map

- Question ↔ Curriculum is many-to-many.
- A Primary Curriculum Link is optional and may be used for display/grouping.
- Linked nodes may span topics, chapters, grades, and valid cross-subject classification.
- Difficulty uses the product vocabulary easy / medium / hard.

## Remaining Implementation Design Questions

The following require scoped technical/product decisions and must not be guessed during implementation:

- whether ancestor links are stored explicitly or derived from the published tree;
- whether prerequisite, supporting, and assessed concepts need distinct link roles;
- whether curriculum-link corrections create a new question version or a separate linkage revision;
- additional format, language, and psychometric metadata beyond the canonical baseline;
- duplicate detection and media storage.
