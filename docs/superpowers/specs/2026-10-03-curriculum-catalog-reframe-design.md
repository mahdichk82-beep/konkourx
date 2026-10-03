# Curriculum Catalog Reframe Design

**Status:** APPROVED DESIGN — implementation pending
**Date:** 2026-10-03
**Milestone:** Curriculum Catalog Reframe — Track → Subject/View → Tree

## Purpose

Add the runtime contract required for a future shared Curriculum Browser/Picker without building that UI. The canonical navigation model is:

```text
TRACK
→ SUBJECT / SUBJECT VIEW
→ ARBITRARY CANONICAL TREE
```

The implementation remains file-backed and read-only. It preserves the protected educational source, all current runtime identifiers, stored task references, legacy Curriculum reads, and the existing `NODE` / `PLACEMENT` task-target contract.

## Governing decisions

- Tracks are `EXPERIMENTAL`, `MATHEMATICS`, and `HUMANITIES`.
- Subject and Subject View entries are sibling navigation items. `THEMATIC` is entry metadata, not a navigation branch.
- One explicitly shared entry may be mounted in multiple track catalogs with the same entry, representation, and node identities.
- Track-specific entries remain distinct even when some labels resemble shared content.
- A Subject/View may own a heterogeneous, arbitrarily deep forest. No fixed Grade → Chapter → Lesson schema is imposed.
- A thematic view has no inferred semantic mapping to a book-based view.
- `عربی انسانی` is a resolved, Humanities-only Subject/View using the approved `دهم/یازدهم/دوازدهم → درس → زیرواحد` navigation structure.
- `زیست` is a resolved Experimental entry. Its uncertain sequence-to-grade assignments remain explicit ambiguity metadata rather than blocking the entry.
- Catalog entries and navigation groups are not task targets. Existing canonical nodes remain selectable through `referenceKind: NODE`.
- Request-supplied track is filtering context only. This milestone does not claim Student-to-track authorization because `StudentProfile` has no authoritative track field.

## Existing runtime retained

The current generated Curriculum projection remains the compatibility base:

- four source scopes;
- twelve grade placements;
- 74 subject placements;
- 67 independent detailed representations;
- 5,484 canonical source nodes;
- existing scope, grade, placement, representation, and node IDs;
- existing authenticated scope, placement, representation, node, children, and legacy read behavior;
- task resolution for `NODE + EXACT`, direct-child `NODE + WHOLE`, `PLACEMENT + EXACT`, and rejected `PLACEMENT + WHOLE`.

The existing `canonical-curriculum.v1.json` artifact remains the base projection. A separate generated catalog overlay is composed with it by the read store. This keeps the change additive and avoids making representation IDs the primary picker contract.

## Runtime model

### Track

```ts
type CurriculumTrack = {
  id: 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES'
  title: string
  sourceOrder: number
}
```

Track codes are stable product identifiers and are not derived from a source hash.

### Catalog entry

```ts
type CurriculumCatalogEntry = {
  id: string
  title: string
  kind: 'BOOK_BASED' | 'THEMATIC'
  visibleInTracks: readonly CurriculumTrackId[]
  representationIds: readonly string[]
  rootItems: readonly CurriculumCatalogRootItem[]
  nodeCount: number
  resolutionStatus: 'RESOLVED' | 'AMBIGUOUS' | 'UNRESOLVED'
  ambiguityCodes: readonly string[]
  provenance: readonly CurriculumProvenance[]
}
```

Sharing is represented by `visibleInTracks`, independently of whether an entry is book-based or thematic. A shared entry has one catalog ID and one tree identity.

Only resolved entries are returned in normal track catalog lists. An entry such as Biology may be `RESOLVED` while carrying internal representation ambiguity metadata. Fully ambiguous or unresolved candidates remain in the generated inventory and compatibility representation APIs but are not silently mounted into a normal track catalog.

### Catalog navigation items

Catalog roots may be either canonical nodes or non-selectable navigation groups:

```ts
type CurriculumCatalogRootItem =
  | {
      itemKind: 'NODE'
      nodeId: string
    }
  | {
      itemKind: 'GROUP'
      id: string
      label: string
      selectable: false
      childNodeIds: readonly string[]
      provenance: readonly CurriculumProvenance[]
    }
```

Navigation groups are catalog mount metadata. They may express an approved grade grouping when no corresponding canonical node exists. They never create synthetic educational Curriculum nodes and cannot be submitted to task APIs.

Humanities Arabic uses three non-selectable grade groups. Each group mounts existing canonical lesson nodes from the corresponding source-backed Arabic representation. Lesson descendants remain the existing canonical nodes and parent/child relationships.

Biology is mounted as a resolved entry using its three existing representations. The compiler does not fabricate grade wrapper nodes or guess sequence-to-grade assignment. The roots retain explicit ambiguity metadata until those assignments are approved.

### Entry-scoped node views

The base canonical node stays unchanged. The catalog store produces an entry-scoped view containing:

- canonical node ID and raw label;
- entry ID and track context;
- direct canonical children;
- entry-scoped breadcrumb/path;
- representation provenance;
- ambiguity metadata where applicable.

The same shared canonical node therefore keeps one identity while receiving the correct track and entry breadcrumb in each filtered catalog response.

## Explicit catalog manifest

A checked-in manifest is the only authority for catalog mounting. It records:

- entry identity key and title;
- kind;
- allowed tracks;
- representation keys;
- root or navigation-group mounting rules;
- source evidence;
- explicit sharing evidence;
- ambiguity status and codes;
- optional equivalence validation policy.

The compiler must not derive catalog membership from label similarity, adjacency, or an assumed grade schema.

Representation boundaries gain stable internal keys alongside the existing source start positions. Catalog manifest entries refer to these keys instead of public representation IDs or mutable source line numbers.

The initial manifest covers the source-backed shared book families, approved thematic views, Experimental Mathematics/Biology/Physics, Mathematics-specific Mathematics/Calculus/Geometry/Statistics/Discrete/Physics, Humanities subject families, and Chemistry only under the validated equivalence rule below. Placement-only subjects without detailed trees remain inventory items rather than fabricated trees.

## Chemistry equivalence

Chemistry may use one canonical catalog entry visible in Experimental and Mathematics only when both conditions hold:

1. explicit source/manifest evidence says the curriculum is shared; and
2. the candidate representation trees are structurally equivalent.

The catalog manifest uses a quarantine-on-mismatch policy. If equivalence fails, the compiler records Chemistry as ambiguous/unresolved and omits it from resolved track catalogs while preserving all underlying representations and IDs. A mismatch does not fail the complete Curriculum build unless a future manifest explicitly declares equivalence to be a fatal invariant.

When equivalence passes, one representation set becomes the catalog tree. The duplicate source representations remain available through compatibility APIs and retain their existing IDs so historical references continue to resolve.

## Stable identity registry

A generated, checked-in identity registry separates logical identity from artifact/source version. It covers existing scopes, grades, placements, representations, and nodes, plus new catalog entries and navigation groups.

Each registry record contains an entity kind, structural identity key, structural fingerprint, assigned ID, generation, and `ACTIVE` or `RETIRED` status.

### Bootstrap

The first registry is bootstrapped from the checked-in artifact. Compilation must reproduce all 5,641 existing scope, grade, placement, representation, and node IDs exactly. No database reference rewrite is required.

### Matching

Structural keys use explicit representation keys, source-authored labels, ancestor structure, and same-label sibling occurrence where needed. They do not include the whole-source hash or absolute source line number. Consequently an unrelated source addition does not renumber existing concepts.

The default safe policy treats a changed label or changed logical structural path as a new identity unless a separately approved continuity mapping says otherwise. The prior identity is retired.

### New, removed, and returning concepts

- New concepts receive deterministic new IDs.
- Missing active concepts become tombstones.
- Tombstoned IDs are never assigned to another logical concept.
- If an identical concept disappears and later returns, it receives a new generation and a new ID; the prior tombstone remains. No resurrection policy is introduced in this milestone.

The registry is generated by tooling; thousands of IDs are not manually maintained. Source hashes and payload hashes remain artifact provenance and do not participate in logical identity.

## Generated artifacts

The build produces:

1. the existing deterministic base Curriculum artifact with its current IDs preserved;
2. a deterministic catalog overlay containing tracks, resolved entries, mount metadata, ambiguity inventory, catalog counts, manifest identity, registry identity, and base-artifact identity;
3. the updated identity registry, including active and retired records.

The production build continues to enforce the locked canonical Markdown and detailed-tree hashes. Synthetic identity lifecycle tests exercise source-change behavior through pure registry/compiler fixtures rather than editing protected educational content.

## Primary catalog API

All routes remain authenticated for the existing `STUDENT`, `COUNSELOR`, and `ADMIN` roles.

```text
GET /api/v1/curriculum/tracks
GET /api/v1/curriculum/tracks/:track/catalog
GET /api/v1/curriculum/tracks/:track/catalog/:entryId
GET /api/v1/curriculum/tracks/:track/catalog/:entryId/roots
GET /api/v1/curriculum/tracks/:track/catalog/:entryId/nodes/:nodeId
GET /api/v1/curriculum/tracks/:track/catalog/:entryId/nodes/:nodeId/children
GET /api/v1/curriculum/tracks/:track/search?q=...
```

The API verifies that the entry is visible in the requested track and that requested nodes belong to that entry. A valid entry from another track is treated as unavailable in the requested catalog. Search considers only nodes mounted by resolved entries in that track and returns entry-scoped breadcrumbs. Shared entries and nodes retain identical IDs across permitted tracks.

Track context is filtering only. No test or documentation may claim account-to-track authorization until an authoritative `StudentProfile.track` exists.

Representation IDs may appear as provenance but are not primary navigation identifiers.

## Compatibility APIs

The existing authenticated endpoints remain functional:

```text
GET /api/v1/curriculum/scopes
GET /api/v1/curriculum/placements
GET /api/v1/curriculum/representations
GET /api/v1/curriculum/nodes/:id
GET /api/v1/curriculum/nodes/:id/children
GET /api/v1/curriculum/search?q=...
```

The global search endpoint remains a compatibility/debug read. New picker consumers use the track-scoped search route.

No Curriculum write API, catalog write API, authoring workflow, publication workflow, or new authorization concept is added.

## Task compatibility

The task target union remains exactly:

```ts
type CurriculumReferenceKind = 'NODE' | 'PLACEMENT'
```

No `CATALOG_ENTRY`, navigation-group, representation, or track target is introduced.

Existing behavior remains:

- `NODE + EXACT` selects one canonical node;
- `NODE + WHOLE` expands only direct canonical children, with leaf fallback;
- `PLACEMENT + EXACT` remains valid for stored and transitional flows;
- `PLACEMENT + WHOLE` remains rejected;
- existing immutable task label/path snapshots are not rewritten;
- no historical database references are migrated or deleted.

## Future Question Bank compatibility

This milestone does not implement Question Bank behavior. The future compatibility contract is `Question ↔ CurriculumNode` many-to-many. Human Admin/Author/Moderator workflows may tag one Question to book-based nodes, thematic nodes, nodes from multiple grades, or multiple relevant Curriculum locations. The system does not infer semantic equivalence or automatically map between book-based and thematic trees.

## Error behavior

- Unknown or malformed track codes return the established validation/not-found style without exposing another catalog.
- An entry not visible in the requested track returns a catalog-scoped not-found response.
- A node not mounted in the requested entry returns an entry-scoped not-found response.
- Invalid pagination and search input continue using `VALIDATION_ERROR`.
- Ambiguity is represented in catalog metadata and generated inventory, not converted into invented educational structure.

## Validation and tests

Implementation follows test-first development. Coverage includes:

1. manifest validation and catalog generation;
2. Experimental, Mathematics, and Humanities catalog inventories;
3. no cross-track leakage in track-filtered responses;
4. shared entry identity retained across permitted tracks;
5. Humanities Arabic as a distinct Humanities-only entry with non-selectable grade groups and canonical lesson nodes;
6. Experimental Biology resolved with internal sequence-to-grade ambiguity metadata;
7. distinct track-specific Physics entries;
8. Chemistry shared equivalence success and quarantine-on-mismatch;
9. arbitrary depth and direct children;
10. entry-scoped breadcrumbs and ancestry;
11. track-scoped search and entry membership;
12. authentication on every new endpoint;
13. byte-for-byte deterministic generation;
14. preservation of all 5,641 current IDs;
15. unrelated-change stability;
16. changed/new/removed identity behavior;
17. tombstone non-reuse and new identity on reappearance;
18. ambiguity quarantine;
19. legacy Curriculum endpoint compatibility;
20. existing Task Curriculum tests and `NODE EXACT` / direct-child `WHOLE` behavior.

Verification commands include the focused tests during red/green cycles, the complete API suite, `pnpm.cmd --filter api typecheck`, deterministic artifact regeneration checks, and `git diff --check`.

## Documentation and scope boundaries

Implementation updates only the current API/runtime documentation required to describe the shipped contract, principally `docs/API.md`, `docs/PROJECT_STATE.md`, and a focused technical Curriculum inventory/provenance document if necessary.

The milestone does not modify:

- `docs/PRODUCT_MAP.md`;
- `docs/ROADMAP.md`;
- `docs/DESIGN_SYSTEM.md`;
- Student Web or Counselor Web;
- Prisma schema or generated Prisma client;
- migration history or database state;
- educational labels or hierarchy in `cori.docx` or the protected canonical transcription;
- Question Bank or Planning UI.

## Remaining gate

Final Student/Counselor track enforcement requires an authoritative `StudentProfile.track` and a separately approved persistence/authorization milestone. Student access will resolve the track from the authenticated Student's profile. Counselor access will resolve it from the selected authorized/assigned Student's profile. Until that contract exists, track supplied to the catalog routes is temporary filtering context only.
