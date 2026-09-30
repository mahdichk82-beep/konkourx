# Curriculum Artifact Status

This directory is governed by [CURRICULUM_SOURCE_OF_TRUTH.md](../CURRICULUM_SOURCE_OF_TRUTH.md).

## CURRENT IMPLEMENTED STATE

- `CANONICAL_CURRICULUM.md` is the protected repository transcription of the Product Owner-supplied `cori.docx`.
- The API has a read-only, file-backed Canonical Curriculum runtime generated deterministically from the protected transcription.
- The runtime exposes 4 scopes, 12 scope/grade placements, 74 subject placements, and 67 independent detailed source representations.
- The detailed source block retains 6,588 source entries. Its 5,484 label-bearing entries are exposed as generic source nodes; 1,104 connector-only separator entries are retained through exact source/hash accounting and are not misrepresented as educational nodes.
- The generated deployment artifact is `apps/api/src/curriculum/generated/canonical-curriculum.v1.json`. It includes source hashes, counts, placements, representations, detailed nodes, and a deterministic payload hash, with no timestamp or runtime-generated identity.
- `pnpm --filter api curriculum:build-artifact` is the one-way compiler command. It reads only `CANONICAL_CURRICULUM.md`, never edits it, and has no database access.
- The active API has no Curriculum write, administration, governance, import, taxonomy, content-ingestion, Knowledge Package, or review runtime.
- The historical Prisma governance models and applied tables remain temporarily present because their removal requires a separately approved forward migration.
- **TEMPORARILY RETAINED HISTORICAL SCHEMA — TO BE REMOVED BY FORWARD MIGRATION IN RF4:** these models and tables are inactive historical structure, not the replacement Curriculum design.
- `CURRICULUM_AUDIT_REPORT.json` and `CURRICULUM_FREEZE_MANIFEST.json` are retained historical projection evidence. Their 56-subject projection is not authoritative.
- `INITIAL_IMPORT_AMBIGUITIES.json` is retained as historical source-observation evidence. It does not authorize resolution or import.

The executable import, authoring, governance, taxonomy, Knowledge Package, AI/human review, and pilot machinery formerly associated with this directory was removed in Recovery Foundation 2.

## APPROVED FUTURE STATE

Product records may reference canonical Curriculum nodes only in a later explicitly approved integration milestone. A future Question Bank may reference existing nodes but cannot modify Curriculum authority.

## EXPLORATORY / DEFERRED

No Curriculum persistence, import workflow, publication lifecycle, mapping strategy, or cleanup migration is defined here. The retained historical database schema is not a template for the file-backed runtime. If the Product Owner later approves a source change, technical ID/reference stability must be handled explicitly rather than hidden behind a versioning engine.
