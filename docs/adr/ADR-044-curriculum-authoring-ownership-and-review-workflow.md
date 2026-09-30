# ADR-044: Curriculum Authoring Ownership and Review Workflow

**Status:** HISTORICAL / SUPERSEDED by Recovery Foundation 1 and 2; not active authority
**Decision date:** 2026-09-18
**Related decisions:** ADR-033, ADR-034
**Related specifications:** Historical support artifacts removed in Recovery Foundation 2; retained Git history is the record.

This ADR is retained as history. Its authoring, review, and import workflow belongs to the rejected runtime direction.

## Context

Konkourix needs a controlled way for educational experts to prepare the Persian source material before it becomes a structured Curriculum Import Manifest. The source includes exact labels, uneven structural depth, source notes, joined text, stars (`⭐`), missing ownership, and other ambiguities that cannot be resolved safely by a parser or by general software administrators.

ADR-033 establishes stable logical identity, version-pinned representations, one canonical parent, and immutable published Curriculum Versions. ADR-034 separates draft editing, import, issue resolution, review, publication, mapping, audit, and permission management. Neither decision by itself identifies who is accountable for a human authoring artifact, what its review proves, or where authoring authority ends and canonical Curriculum governance begins.

Without an explicit authoring workflow, an editor could silently correct source text, an Import Operator could become the de facto educational reviewer, or a Publisher could repair content during publication. Any of those paths would weaken provenance, separation of duties, and published-history guarantees.

## Decision

Konkourix will treat Curriculum authoring as a governed pre-import workflow with explicit accountability, immutable review evidence, and a hard boundary before canonical import.

The authoring artifact is a human-maintained representation of source evidence and reviewed structural proposals. It is not canonical Curriculum, does not allocate canonical Node IDs, and does not approve or publish a Curriculum Version.

The end-to-end workflow is:

```text
Canonical source artifact and reviewed transcription
    -> accountable Content Author prepares authoring artifact
    -> Authoring Reviewer verifies fidelity, coverage, and explicit ambiguity
    -> conversion creates a checksummed Manifest v1
    -> authorized Import Operator imports into a DRAFT CurriculumVersion
    -> Issue Resolver records governed ambiguity decisions
    -> deterministic validation binds the exact draft revision
    -> Curriculum Reviewer decides on that exact validated revision
    -> Publisher performs a separate atomic publication command
```

Each arrow is an evidence boundary. Passing one boundary grants no authority at the next.

## 1. Content Author Ownership

Every authoring document has one accountable Content Author. Collaborators may contribute, but one identified author is responsible for the submitted authoring revision.

The Content Author owns:

- faithful transcription of the approved source into the authoring format;
- preservation of exact Persian, Arabic, and English text, source order, punctuation, digits, diacritics, half-spaces, joined content, notes, and stars;
- stable source-record keys and recoverable source locators;
- explicit proposed type and parent only where source evidence or an authorized decision supports them;
- complete marking of known ambiguity without resolving it by inference;
- whole-source coverage reconciliation for an initial import;
- recording collaborators, preparation time, reason, and source/checksum references;
- returning the document to draft when reviewed content changes.

The Content Author does not own canonical master data after import. They cannot, by authorship alone:

- allocate or select canonical Node IDs;
- assert identity from a label, path, normalized name, or source position;
- approve their own educational ambiguity decision;
- operate an import;
- approve a Curriculum draft;
- publish or alter a published version.

Author ownership is accountability for the authoring evidence, not personal ownership of Curriculum content. The organization retains one governed Canonical Curriculum; private author forks are not canonical releases.

If accountable ownership transfers, the transfer records the prior author, new author, reason, time, document revision/checksum, and unresolved findings. Ownership transfer does not erase prior authorship.

## 2. Structural Editing Rules

Structural editing is a proposal against a draft authoring document or an editable Curriculum draft. It must follow the source-aligned hierarchy and the one-parent rule from ADR-033.

An authorized structural editor may:

- propose one of the approved node types: `CURRICULUM_ROOT`, `FIELD`, `GRADE`, `SUBJECT`, `CHAPTER`, `TOPIC`, `CONCEPT`, or `SUBCONCEPT`;
- assign one defensible canonical parent, except for the approved root;
- preserve source-defined order;
- represent an explicitly omitted intermediate level without synthesizing a placeholder;
- propose a typed non-owning relationship separately from tree parentage;
- add non-authoritative structural evidence for a reviewer.

A structural editor must not:

- invent a subject, level, chapter, topic, concept, sub-concept, parent, label, or relationship;
- make all branches conform to a fixed depth;
- split joined source text or compound labels without an authorized decision;
- merge equal or similar labels by inference;
- use multiple parents to represent multiple topics or tags;
- convert `⭐` into priority, weight, availability, styling, or assessment meaning;
- use source position, path, order, or normalized text as identity;
- edit a published or superseded representation.

Concepts are authored only when the source explicitly contains a teachable or assessable item. Sub-concepts are authored only for explicit children beneath a concept or another sub-concept. An unclear topic/concept/sub-concept distinction is quarantined with `STRUCTURAL_LEVEL_UNRESOLVED`.

Cross-cutting meaning uses typed relationship proposals. Curriculum Import Manifest v1 does not create those relationships automatically; each proposal remains pending until the separate capability-protected relationship workflow approves exact canonical endpoints.

## 3. Review Workflow

Konkourix recognizes two different review gates.

### Authoring Review

Authoring Review occurs before manifest conversion/import. It verifies:

- the exact source artifact and transcription identity/checksums;
- source-record coverage and order;
- text fidelity and Persian content conventions;
- stable source keys and recoverable locators;
- supported proposed types and single-parent structure;
- absence of invented educational content or placeholder nodes;
- explicit quarantine of every known or discovered ambiguity;
- separation of relationship proposals from canonical parentage;
- absence of unresolved placeholders in the authoring worksheet.

An accepted Authoring Review means only `ACCEPTED_FOR_MANIFEST`. It does not mean the content is imported, canonical, structurally valid in the database, approved for publication, or published.

`CHANGES_REQUIRED` and `REJECTED` outcomes retain reviewer, time, findings, reviewed document identity/checksum, and source evidence. Corrections create a new authoring revision and review record; they do not rewrite the prior decision.

An independent Authoring Reviewer is preferred. Where a small-team policy allows the Content Author and Authoring Reviewer to be the same person, the exception requires an explicit reason and durable audit evidence. The exception does not combine Import Operator, Issue Resolver, Curriculum Reviewer, or Publisher authority.

### Curriculum Review

Curriculum Review occurs after import, issue decisions, and deterministic validation. It is the ADR-034 review decision against an exact Curriculum Version draft revision and validation run.

Authoring Review cannot satisfy Curriculum Review. A material import, draft edit, issue-resolution change, relationship change, or validation-input change invalidates the effective Curriculum approval and requires a new validation/review cycle.

## 4. Import Boundary

The accepted machine boundary is the checksummed Curriculum Import Manifest v1. The human authoring YAML/Markdown is never imported directly as canonical data.

Before import, the Import Operator must verify:

- effective `CURRICULUM_IMPORT_OPERATE` authority and an editable target draft;
- accepted Authoring Review evidence;
- exact source artifact and reviewed transcription checksums;
- whole-source reconciliation for an initial import;
- deterministic conversion and a valid manifest checksum chain;
- stable idempotency identity;
- generated validation and ambiguity reports;
- that relationship proposals are not being converted into second parents or automatically approved relationships.

Conversion is mechanical. It maps reviewed authoring fields, calculates record/payload/manifest checksums, and preserves provenance. It cannot choose a type, parent, display correction, relationship, Node ID, or ambiguity disposition.

The Import Operator owns operational correctness of the import, not educational correctness of the source. They may reject an invalid artifact or return it for authoring correction. They may not repair content during conversion, suppress an issue, or reinterpret source evidence to make an import pass.

Import completion means that the manifest was processed and its report retained. It does not imply Authoring Review, issue resolution, Curriculum Review, or publication. Import has no publication side effect.

## 5. Publisher Responsibility

The Publisher is the final lifecycle gate, not a content editor or emergency issue resolver.

Before publishing, the Publisher must verify:

- effective `CURRICULUM_PUBLISH` authority at commit time;
- the exact target Curriculum Version and current draft revision;
- a current deterministic validation run with no unresolved publication blockers;
- a current effective Curriculum Review approval for that same revision and validation run;
- required import, provenance, authoring-review, ambiguity-resolution, and source-reconciliation evidence;
- separation-of-duty requirements or an explicitly authorized and audited exception;
- atomic supersession/current-version behavior and the absence of partial visibility.

The Publisher must not edit labels, structure, order, relationships, mappings, issue dispositions, or provenance as part of publication. If any evidence is missing or questionable, publication stops and the draft returns to the appropriate authoring, issue-resolution, validation, or review step.

Publication freezes the complete snapshot. Publisher authority never permits mutation or deletion of a published or superseded Curriculum Version.

## 6. Ambiguity Handling

Ambiguity remains visible from authoring through import and review.

- Exact `raw_text`, `display_label`, locator, order, source key, and ambiguity markers are preserved.
- Any authoring record with ambiguity markers is quarantined during import and cannot create or update a canonical node automatically.
- A child whose parent is quarantined remains unresolved unless an independently reviewed parent is supported by evidence.
- Stars remain visible and carry `STAR_MARKER_UNRESOLVED` until an authorized decision establishes meaning.
- Source notes and prose relationship statements remain source evidence and do not become nodes or relationships automatically.
- Candidate parents, types, and relationships may be recorded as hints, never as effective decisions.
- Removing a marker from a file is not an ambiguity resolution.

Only an authorized Curriculum Issue Resolver may record an effective resolution, exclusion, classification, or request for more evidence. The original finding and source record remain immutable. Correcting a resolution creates superseding evidence rather than editing the original.

Unresolved blocking ambiguity prevents publication. An explicit exclusion requires rationale, actor, time, scope, and confirmation that exclusion does not manufacture or silently discard educational meaning. Non-blocking limitations remain visible in validation/review evidence.

## 7. Version Changes

Authoring-document revisions and Curriculum Version revisions are distinct.

### Before Import

- A change to source text, display proposal, type, parent, order, marker, provenance, or relationship proposal creates a new authoring revision.
- The prior Authoring Review moves to immutable review history.
- Source-record keys remain stable for the same source identity; order, paths, and labels do not replace them.
- Source/transcription or authoring changes produce new checksums and preflight evidence.
- Changed content must not reuse an idempotency identity as though it were the original manifest.

### After Import, Before Publication

- Material draft changes increment the Curriculum draft revision.
- Prior validation and Curriculum Review evidence becomes stale for publication.
- Import evidence and earlier review decisions remain retained.
- A corrected manifest or issue decision follows the idempotent retry/supersession rules; it does not overwrite the prior run invisibly.

### After Publication

- Published and superseded versions are immutable.
- Any correction begins in a new draft based on the appropriate published version.
- A spelling, metadata, ordering, or non-semantic move may retain a logical Node ID when educational identity is unchanged.
- A semantic change, type change, split, merge, or identity-changing move creates new Node IDs and explicit lineage.
- Historical Tasks, Plans, Questions, Assessments, Progress, and reports remain pinned to their original `(curriculum_version_id, curriculum_node_id)` pair.

No authoring revision or new publication automatically repoints historical records or transfers mastery.

## 8. Audit Requirements

The workflow must preserve durable, append-only evidence sufficient to answer who authored, reviewed, converted, imported, resolved, validated, approved, and published each state.

Audit/evidence includes, as applicable:

- authoring document key and revision/checksum;
- accountable Content Author and collaborators;
- source artifact/transcription names, identifiers, and SHA-256 values;
- preparation time, reason, and ownership transfers;
- whole-source reconciliation reference and counts;
- exact Authoring Reviewer, outcome, findings, exception reason, and reviewed checksum;
- manifest schema version, record checksums, payload checksum, manifest checksum, and idempotency key;
- Import Operator, target draft/version/revision, import outcome, immutable report, and retry linkage;
- ambiguity markers, issue records, resolutions/exclusions, resolver, reason, and supersession chain;
- structural edits and relationship proposals/decisions with before/after evidence;
- validation run, exact draft revision, blockers/warnings, and result;
- Curriculum Review submission and decision;
- Publisher, publication reason, separation-of-duty exception, prior-current version, and atomic outcome.

Repository history, file timestamps, chat, tickets, or editor comments may supplement evidence but do not replace the governed audit trail. Audit and source evidence remain permission-restricted under ADR-034. An actor cannot erase or rewrite evidence of their own actions.

## Alternatives Considered

- **Allow any Admin to author and import directly.** Rejected because global role does not establish educational authority, source fidelity, or separation of duties.
- **Treat authoring review as Curriculum publication approval.** Rejected because it occurs before canonical import, database validation, issue decisions, and exact draft revision binding.
- **Let the Import Operator repair or classify source content.** Rejected because operational import authority is not educational decision authority.
- **Import the human YAML/Markdown directly.** Rejected because the checksummed Manifest v1 is the deterministic machine boundary and must bind exact provenance and idempotency.
- **Let the Publisher fix blockers during publication.** Rejected because publication must be an atomic verification/transition, not an editing session.
- **Use equal labels or normalized paths to resolve identity.** Rejected by ADR-033 and Persian source exactness requirements.
- **Represent multiple topics with multiple parents.** Rejected because canonical tree membership permits one parent; cross-cutting meaning uses typed relationships or downstream many-to-many tags.
- **Use repository pull-request approval as the only audit.** Rejected because source access, identity, capability, import, issue, validation, review, and publication evidence require domain-level traceability.

## Consequences

The workflow makes educational accountability explicit and prevents tooling roles from silently acquiring content authority. Exact source evidence, ambiguity, review state, and canonical lifecycle remain distinguishable. Publication becomes reproducible against a complete chain of source, authoring, manifest, import, validation, review, and publisher evidence.

The process requires more artifacts and review steps. Content corrections take longer, authors need training in the authoring format, and operational teams must retain checksums and reports. Small teams may need explicit separation-of-duty exceptions rather than relying on informal role overlap.

## Migration Impact

This decision is additive and documentation-only at adoption. It changes no M19 table, API, migration, user behavior, or published Curriculum data.

Future implementation may require durable authoring-review metadata, artifact retention, conversion tooling, and links from import evidence to the reviewed authoring revision. Those additions must preserve the existing fourteen-table Phase 20 contract or receive a separately approved schema-contract change; this ADR does not authorize a database table or API change by itself.

Existing Phase 20 manifests/imports remain governed by their checksums and audit evidence. They are not retroactively declared authoring-reviewed without evidence.

## Security Impact

- Source artifacts, transcriptions, authoring notes, ambiguity evidence, and review findings may be more restricted than published Curriculum.
- Authoring identity and review identity must be authenticated or otherwise bound to approved organizational evidence before import.
- Conversion/import tooling must fail closed on checksum, coverage, placeholder, type, parent, order, or ambiguity errors.
- Client/file claims do not grant capabilities; server authorization remains authoritative for import, issue resolution, review, and publication.
- Self-review or combined duties require explicit policy, reason, and audit; they are never inferred from account role.
- Untrusted authoring content must not execute code, inject lifecycle fields, assign server-owned actors, or control canonical IDs.
- Ordinary logs must redact protected source content while governance evidence remains accessible to authorized readers.

## Future Constraints

- `cori.docx` remains the educational source of truth for the initial curriculum; authoring documents cannot override it silently.
- Every authoring revision has an accountable author and immutable review history.
- Authoring Review, import completion, issue resolution, Curriculum Review, and publication remain distinct events.
- Human authoring files are converted to Manifest v1; they are not imported directly as trusted canonical data.
- Conversion is deterministic and cannot infer missing educational structure or identity.
- Canonical nodes have one parent per version; multiple tags/topics never create additional parents.
- Any ambiguity marker remains effective until an authorized resolution or exclusion is recorded.
- Publisher authority cannot edit content, bypass blockers, or mutate published history.
- Authoring or draft changes invalidate downstream checksum/review evidence as applicable.
- Published corrections create a new version and preserve every historical version/node reference.
- Future automation or AI may propose authoring content or findings, but cannot be the accountable author, effective reviewer, issue resolver, or publisher.
