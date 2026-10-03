# Curriculum Catalog Reframe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic, file-backed `TRACK → SUBJECT/VIEW → ARBITRARY TREE` catalog overlay while preserving every current Curriculum ID, legacy API, stored task reference, and direct-child `WHOLE` behavior.

**Architecture:** Keep `canonical-curriculum.v1.json` as the compatibility projection and compose it with a generated catalog overlay. A checked-in explicit manifest controls all track/entry/tree mounting; a generated identity registry decouples IDs from whole-source hashes and tombstones removed identities. New authenticated APIs are entry- and track-scoped, while existing representation APIs remain compatibility reads.

**Tech Stack:** TypeScript 7, Node.js 24, Fastify 5, Zod 4, Node test runner through `tsx`, checked-in JSON artifacts, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-10-03-curriculum-catalog-reframe-design.md`

## Global Constraints

- Do not edit `docs/curriculum/CANONICAL_CURRICULUM.md` or any educational label/content.
- Do not edit `docs/PRODUCT_MAP.md`, `docs/ROADMAP.md`, or `docs/DESIGN_SYSTEM.md`.
- Protected starting SHA-256 values are Product Map `01E421F451977C3CFA12511A76FAE9B3168CE3CCB44C96B800E5F617FD96440D`, Roadmap `0184921A286CC74E528E0702FC07798E9B1A0206608CC8720FF063BA835F9511`, and Design System `6CD69E51729B817A506728248D1B810EC88CA97DE6CE49FD4B18BB8CE95001D5`.
- Do not modify Student Web or Counselor Web.
- Do not modify `database/prisma/schema.prisma` (starting SHA-256 `B2494A77E89914ABA073D510AE6029427A35F451D7A72DB8E727ED13AD54891D`), generated Prisma code, migrations, or database state.
- Do not add dependencies.
- Do not add a `CATALOG_ENTRY`, track, representation, or navigation-group task target. Task reference kinds remain exactly `NODE | PLACEMENT`.
- Request-supplied track is filtering context, never user-to-track authorization in this milestone.
- Preserve all 5,641 existing scope/grade/placement/representation/node IDs. Stop if this cannot be achieved without rewriting stored references or adding a migration.
- Tombstoned IDs are never reused; an identical returning concept gets a new generation and ID.
- Use failing tests before each production behavior change. Do not commit; the milestone explicitly requires `NOT COMMITTED`.
- Preserve all unrelated tracked and untracked user work in the dirty checkout.

## Review Focus

- A valid catalog entry requested through the wrong track must return catalog-scoped not-found and must not leak its data; Task 5 tests this.
- A navigation-group ID submitted as a `NODE` target must remain invalid and must not create a new target kind; Task 6 verifies this through the existing resolver boundary.
- A removed identity that later returns with an identical fingerprint must receive a new ID while its prior tombstone remains; Task 1 tests this.
- Chemistry tree mismatch must quarantine Chemistry without aborting the rest of catalog compilation; Task 3 tests this.
- Track search must exclude unresolved, duplicate-only, compatibility-only, and otherwise unmounted representations; Task 4 tests this.

---

### Task 0: Execution preflight and clean behavioral baseline

**Files:**
- Read only: repository status, package scripts, protected boundaries

**Interfaces:**
- Consumes: current dirty worktree at branch `main`, current API test command
- Produces: recorded baseline status and a verified starting API suite

- [ ] **Step 1: Re-read the spec and repository governance**

Read `AGENTS.md` and the approved spec. Confirm the milestone still authorizes only API/runtime/compiler/tests and limited technical documentation.

- [ ] **Step 2: Record branch, HEAD, and dirty state**

Run: `git branch --show-current; git rev-parse HEAD; git status --short`

Expected: branch and HEAD are recorded; every pre-existing dirty path is retained for final comparison.

- [ ] **Step 3: Verify protected hashes before implementation**

Run: `Get-FileHash -Algorithm SHA256 docs/PRODUCT_MAP.md,docs/ROADMAP.md,docs/DESIGN_SYSTEM.md,database/prisma/schema.prisma`

Expected: the hashes match Global Constraints.

- [ ] **Step 4: Run the complete API baseline**

Run: `pnpm.cmd --filter api test`

Expected: PASS. If it fails before implementation, stop and report the exact failures rather than attributing them to this milestone.

---

### Task 1: Stable identity registry lifecycle

**Files:**
- Create: `apps/api/src/curriculum/identity-registry.ts`
- Create: `apps/api/test/curriculum-identity-registry.test.ts`
- Modify: `apps/api/src/curriculum/types.ts`

**Interfaces:**
- Consumes: identity candidates with entity kind, ID prefix, logical key, and structural fingerprint
- Produces: `reconcileCurriculumIdentityRegistry(previous, candidates, managedKinds): CurriculumIdentityResolution`, plus registry/candidate types

- [ ] **Step 1: Write failing registry lifecycle tests**

Create tests named:

```ts
test('preserves an active identity across unrelated additions')
test('retires a changed fingerprint and assigns a new ID')
test('tombstones removed identities without touching unmanaged kinds')
test('never reuses a tombstoned ID when an identical concept returns')
test('produces deterministic IDs and rejects duplicate keys or IDs')
```

Assert exact `ACTIVE`/`RETIRED` records, generations, preserved IDs, and inequality between retired and returning IDs.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-identity-registry.test.ts`

Expected: FAIL because `identity-registry.ts` and its exported interfaces do not exist.

- [ ] **Step 3: Add registry types**

In `types.ts`, define:

```ts
type CurriculumIdentityKind =
  | 'SCOPE' | 'GRADE' | 'PLACEMENT' | 'REPRESENTATION' | 'NODE'
  | 'CATALOG_ENTRY' | 'CATALOG_GROUP'
type CurriculumIdentityStatus = 'ACTIVE' | 'RETIRED'
type CurriculumIdentityCandidate = {
  kind: CurriculumIdentityKind
  prefix: string
  logicalKey: string
  fingerprint: string
}
type CurriculumIdentityRecord = CurriculumIdentityCandidate & {
  id: string
  generation: number
  status: CurriculumIdentityStatus
}
type CurriculumIdentityRegistry = {
  formatVersion: 'konkourx-curriculum-identities/v1'
  records: readonly CurriculumIdentityRecord[]
  payloadSha256: string
}
type CurriculumIdentityResolution = {
  registry: CurriculumIdentityRegistry
  idsByLogicalKey: ReadonlyMap<string, string>
}
```

- [ ] **Step 4: Implement registry reconciliation**

Implement:

```ts
reconcileCurriculumIdentityRegistry(
  previous: CurriculumIdentityRegistry,
  candidates: readonly CurriculumIdentityCandidate[],
  managedKinds: ReadonlySet<CurriculumIdentityKind>,
): CurriculumIdentityResolution
```

Use deterministic SHA-256 allocation from namespace, logical key, fingerprint, and generation. Preserve unmanaged records unchanged; retain every tombstone; reject duplicate active keys and any ID collision.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-identity-registry.test.ts`

Expected: all registry lifecycle tests PASS.

---

### Task 2: Bootstrap current IDs and refactor the base compiler

**Files:**
- Create: `apps/api/src/curriculum/representation-definitions.ts`
- Create: `apps/api/src/scripts/bootstrap-curriculum-identities.ts`
- Create: `apps/api/src/curriculum/generated/canonical-curriculum-identities.v1.json`
- Modify: `apps/api/src/curriculum/compiler.ts`
- Modify: `apps/api/src/curriculum/types.ts`
- Modify: `apps/api/test/curriculum-artifact.test.ts`
- Modify: `apps/api/package.json`

**Interfaces:**
- Consumes: protected Markdown, existing base artifact, registry reconciliation from Task 1
- Produces: `compileCanonicalCurriculum(source, registry): CurriculumBaseCompilation`, `bootstrapCurriculumIdentityRegistry(source, legacyArtifact): CurriculumIdentityRegistry`, stable representation keys, and a generated bootstrap registry

```ts
type CurriculumBaseCompilation = {
  artifact: CurriculumArtifact
  identityRegistry: CurriculumIdentityRegistry
  representationIdsByKey: ReadonlyMap<string, string>
  nodeIdsByKey: ReadonlyMap<string, string>
}
```

- [ ] **Step 1: Write failing current-ID preservation tests**

Extend `curriculum-artifact.test.ts` with tests that assert:

```ts
test('bootstraps exactly 5641 existing identities from the current artifact')
test('registry-backed compilation preserves every current ID')
test('registry-backed base serialization remains byte-for-byte identical')
test('representation keys are unique and cover all 67 source trees')
```

Compare ordered ID arrays for scopes, grades, placements, representations, and nodes—not only counts or a sample.

- [ ] **Step 2: Run the artifact test and verify RED**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-artifact.test.ts`

Expected: FAIL because registry-backed compiler/bootstrap functions and stable representation definitions do not exist.

- [ ] **Step 3: Replace positional representation starts with explicit definitions**

Create `representation-definitions.ts` exporting all 67 `{ key, startEntry }` records in current source order. Preserve the existing boundary values exactly; keys describe source-backed representations and do not become user-facing titles.

- [ ] **Step 4: Refactor compiler parsing to structural keys before IDs**

Keep source-hash and count locks. Build internal keys for scopes, grades, placements, representations, and nodes without using whole-source hash or absolute line number as logical identity. Use representation key, source-authored ancestry, and same-label sibling occurrence for node identity.

- [ ] **Step 5: Implement bootstrap and registry-backed materialization**

Expose:

```ts
bootstrapCurriculumIdentityRegistry(
  sourceMarkdown: string,
  legacyArtifact: CurriculumArtifact,
): CurriculumIdentityRegistry

compileCanonicalCurriculum(
  sourceMarkdown: string,
  registry: CurriculumIdentityRegistry,
): CurriculumBaseCompilation
```

Bootstrap must verify matching counts, labels, source order, locators, and parent order before assigning each legacy ID to its new structural key. Compilation reconciles only base entity kinds and returns the materialized artifact, updated registry, and representation/node key maps needed by the catalog compiler.

- [ ] **Step 6: Add and run the bootstrap script**

Add package script `curriculum:bootstrap-identities` and generate `canonical-curriculum-identities.v1.json` from the protected source plus existing artifact.

Run: `pnpm.cmd --filter api curriculum:bootstrap-identities`

Expected: one registry with 5,641 active base records and no retired records; the existing base artifact is not changed.

- [ ] **Step 7: Run artifact and registry tests**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-identity-registry.test.ts test/curriculum-artifact.test.ts`

Expected: PASS, including exact preservation of all current IDs and byte-for-byte base artifact output.

---

### Task 3: Explicit catalog manifest and generated overlay

**Files:**
- Create: `apps/api/src/curriculum/catalog-manifest.ts`
- Create: `apps/api/src/curriculum/catalog-compiler.ts`
- Create: `apps/api/src/curriculum/generated/canonical-curriculum-catalog.v1.json`
- Create: `apps/api/test/curriculum-catalog-artifact.test.ts`
- Modify: `apps/api/src/curriculum/types.ts`
- Modify: `apps/api/src/scripts/build-curriculum-artifact.ts`
- Modify: `apps/api/package.json`

**Interfaces:**
- Consumes: `CurriculumBaseCompilation`, explicit representation keys, and the base registry
- Produces: `compileCurriculumCatalog(base, manifest, registry): CurriculumCatalogCompilation`, catalog overlay types, updated registry, and deterministic catalog serialization

```ts
type CurriculumCatalogCompilation = {
  artifact: CurriculumCatalogArtifact
  identityRegistry: CurriculumIdentityRegistry
}
```

- [ ] **Step 1: Write failing catalog inventory tests**

Assert exact ordered catalog titles:

```ts
EXPERIMENTAL: [
  'فارسی', 'فارسی موضوعی', 'عربی', 'عربی موضوعی', 'دین و زندگی',
  'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'ریاضی', 'ریاضی موضوعی',
  'زیست', 'فیزیک تجربی', 'شیمی',
]
MATHEMATICS: [
  'فارسی', 'فارسی موضوعی', 'عربی', 'عربی موضوعی', 'دین و زندگی',
  'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'ریاضی', 'حسابان', 'هندسه',
  'آمار و احتمال', 'ریاضیات گسسته', 'فیزیک ریاضی', 'شیمی',
]
HUMANITIES: [
  'فارسی', 'فارسی موضوعی', 'عربی انسانی', 'دین و زندگی',
  'زبان انگلیسی', 'زبان انگلیسی موضوعی', 'علوم و فنون ادبی',
  'علوم و فنون ادبی موضوعی', 'جامعه‌شناسی', 'ریاضی و آمار',
  'اقتصاد', 'منطق', 'فلسفه', 'روان‌شناسی', 'تاریخ', 'جغرافیا',
]
```

Also assert that shared entries have the same catalog ID and representation/node IDs in every permitted track; Humanities Arabic has a different entry ID from general Arabic; Experimental and Mathematics Physics entries are distinct.

- [ ] **Step 2: Write failing hierarchy and ambiguity tests**

Add tests named:

```ts
test('Humanities Arabic uses three non-selectable grade groups over canonical lessons')
test('Biology is resolved while sequence-to-grade assignments remain ambiguous')
test('placement-only and ownership-ambiguous representations stay outside resolved catalogs')
test('thematic entries are sibling entries rather than a navigation branch')
test('Chemistry shares one identity only when evidence and structure agree')
test('Chemistry mismatch is quarantined without aborting other catalogs')
```

The mismatch test supplies a cloned comparison representation with one structural difference and expects an unresolved Chemistry inventory record while unrelated resolved entries remain present.

- [ ] **Step 3: Run catalog artifact tests and verify RED**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-catalog-artifact.test.ts`

Expected: FAIL because manifest/compiler/overlay types do not exist.

- [ ] **Step 4: Define catalog types and the explicit manifest**

Add `CurriculumTrackId`, track, entry, root-item, provenance, ambiguity, overlay, and manifest types. Implement `catalog-manifest.ts` as the sole mapping authority. Use `BOOK_BASED | THEMATIC`; represent sharing only through `visibleInTracks`.

Manifest mount modes are explicit:

```ts
type CurriculumMountMode =
  | 'ALL_ROOTS'
  | 'ROOTS_AFTER_SOURCE_HEADING'
  | 'GROUP_ROOTS_AFTER_SOURCE_HEADING'
```

Group labels are approved navigation metadata and groups are always `selectable: false`.

- [ ] **Step 5: Implement catalog compilation and validation**

Implement:

```ts
compileCurriculumCatalog(
  base: CurriculumBaseCompilation,
  manifest: CurriculumCatalogManifest,
  registry: CurriculumIdentityRegistry,
): CurriculumCatalogCompilation
```

Validate referenced representations, roots, unique entry identities, visibility, node membership, group non-selectability, source evidence, and sharing claims. Reconcile only `CATALOG_ENTRY` and `CATALOG_GROUP` identities. Produce a complete unresolved inventory without converting ambiguous representations into catalog entries.

- [ ] **Step 6: Implement Chemistry validation policy**

Require both the explicit shared-Chemistry source evidence and structural equality of the paired grade trees. On mismatch, omit Chemistry from resolved catalogs and emit `CHEMISTRY_EQUIVALENCE_MISMATCH`; do not throw unless the manifest policy is explicitly `FATAL`.

- [ ] **Step 7: Extend artifact building and generate the overlay**

Update `curriculum:build-artifact` to read the registry, compile the base, compile the catalog, then write the unchanged base artifact, catalog overlay, and updated registry. Add counts and SHA-256 identities for base payload, manifest, registry, and catalog payload.

- [ ] **Step 8: Run catalog and base artifact tests**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-artifact.test.ts test/curriculum-catalog-artifact.test.ts`

Expected: PASS; base artifact remains byte-for-byte unchanged and catalog output is deterministic.

---

### Task 4: Catalog read store, roots, breadcrumbs, children, and search

**Files:**
- Create: `apps/api/src/curriculum/catalog-store.ts`
- Create: `apps/api/test/curriculum-catalog-store.test.ts`
- Modify: `apps/api/src/curriculum/store.ts`
- Modify: `apps/api/src/curriculum/artifact.ts`
- Modify: `apps/api/src/curriculum/types.ts`

**Interfaces:**
- Consumes: base artifact plus catalog overlay
- Produces: catalog methods on `CurriculumReadStore` while preserving every existing method

```ts
listTracks(): readonly CurriculumTrack[]
listTrackCatalog(track: CurriculumTrackId): readonly CurriculumCatalogEntry[]
getTrackCatalogEntry(track: CurriculumTrackId, entryId: string): CurriculumCatalogEntry
listCatalogRoots(track: CurriculumTrackId, entryId: string): readonly CurriculumCatalogRootItem[]
getCatalogNode(track: CurriculumTrackId, entryId: string, nodeId: string): CurriculumCatalogNodeView
listCatalogChildren(track: CurriculumTrackId, entryId: string, nodeId: string, page): CurriculumPage<CurriculumCatalogNodeView>
searchTrack(query: CurriculumTrackSearchQuery): CurriculumPage<CurriculumCatalogSearchResult>
```

- [ ] **Step 1: Write failing store filtering tests**

Test all three exact inventory lists, same IDs for shared entries, distinct Arabic/Physics identities, and catalog-scoped not-found when a valid entry is requested through a disallowed track.

- [ ] **Step 2: Write failing tree/path tests**

Assert Humanities Arabic roots are three non-selectable groups with canonical lesson child IDs; canonical node views include track/entry/group breadcrumb segments; node children preserve direct-child order and arbitrary depth.

- [ ] **Step 3: Write failing search tests**

Assert deterministic normalized search is limited to mounted resolved nodes for the requested track, includes entry-scoped breadcrumbs, and excludes Chemistry duplicate-only representations, standalone markers, Chemistry skills, and other unresolved/unmounted nodes.

- [ ] **Step 4: Run store tests and verify RED**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-catalog-store.test.ts`

Expected: FAIL because catalog store APIs do not exist.

- [ ] **Step 5: Implement immutable catalog indexes**

Build maps for track entries, entry membership, mounted roots, group membership, descendants, and normalized labels. Validate overlay/base payload linkage during store construction and deep-freeze both inputs.

- [ ] **Step 6: Implement entry-scoped tree views and search**

Construct breadcrumbs from track title, entry title, optional group label, and canonical ancestor labels. Search returns one entry-scoped result per mounted node and never falls back to the global representation set.

- [ ] **Step 7: Compose catalog methods into the existing store**

Load the generated overlay in `artifact.ts`; update `createCurriculumReadStore(base, catalog)` while preserving existing scope/placement/representation/node methods and error codes.

- [ ] **Step 8: Run store and task resolver tests**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-store.test.ts test/curriculum-catalog-store.test.ts test/task-curriculum-resolver.test.ts`

Expected: PASS; legacy store behavior and direct-child task resolution remain unchanged.

---

### Task 5: Track-scoped authenticated HTTP contract

**Files:**
- Modify: `apps/api/src/schemas/curriculum.ts`
- Modify: `apps/api/src/routes/curriculum.ts`
- Modify: `apps/api/test/curriculum-routes.test.ts`

**Interfaces:**
- Consumes: Task 4 store methods and existing authentication/RBAC middleware
- Produces: the seven primary catalog routes from the approved spec

- [ ] **Step 1: Write failing route and authentication tests**

For each new endpoint, assert anonymous requests return `401 TOKEN_MISSING` and existing Student, Counselor, and Admin tokens can read it. Explicitly assert the same Student test token can request each track as filtering context; do not describe this as profile-based authorization.

- [ ] **Step 2: Write failing filtering and validation tests**

Assert:

- exact per-track catalogs;
- shared IDs are unchanged between allowed tracks;
- Humanities Arabic is unavailable through Experimental/Mathematics routes;
- a valid Mathematics-only entry requested under Experimental returns catalog-scoped `404`;
- malformed track, entry, node, pagination, and query values return `400 VALIDATION_ERROR`;
- track-scoped search contains no nodes outside resolved entries in that track.

- [ ] **Step 3: Run route tests and verify RED**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-routes.test.ts`

Expected: FAIL with new routes returning 404.

- [ ] **Step 4: Add strict route schemas**

Add enum track params, `ce_<32 hex>` catalog entry IDs, canonical node IDs, and bounded pagination/search schemas. Keep legacy schemas unchanged.

- [ ] **Step 5: Register primary catalog routes**

Implement:

```text
GET /curriculum/tracks
GET /curriculum/tracks/:track/catalog
GET /curriculum/tracks/:track/catalog/:entryId
GET /curriculum/tracks/:track/catalog/:entryId/roots
GET /curriculum/tracks/:track/catalog/:entryId/nodes/:nodeId
GET /curriculum/tracks/:track/catalog/:entryId/nodes/:nodeId/children
GET /curriculum/tracks/:track/search
```

Reuse the existing authentication/role pre-handler and success envelope. Do not add permissions or profile lookups.

- [ ] **Step 6: Run route tests and verify GREEN**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-routes.test.ts`

Expected: PASS for both primary catalog and legacy endpoints.

---

### Task 6: Task-target and historical compatibility regression gate

**Files:**
- Modify only if a missing assertion is needed: `apps/api/test/task-curriculum-resolver.test.ts`
- Verify: `apps/api/test/task-curriculum-lifecycle.test.ts`
- Verify: `apps/api/test/planning-curriculum-persistence.test.ts`
- Verify: `apps/api/src/task-curriculum/types.ts`
- Verify: `database/prisma/schema.prisma`

**Interfaces:**
- Consumes: existing `CurriculumReferenceKind = 'NODE' | 'PLACEMENT'`
- Produces: evidence that catalog navigation does not alter stored target semantics

- [ ] **Step 1: Add the missing navigation-group rejection assertion if not already covered**

Submit a generated `CATALOG_GROUP` ID as `referenceKind: 'NODE'` and assert `CURRICULUM_NODE_NOT_FOUND`. Do not add a production task type or special group error.

- [ ] **Step 2: Run focused task compatibility tests**

Run: `pnpm.cmd --filter api exec tsx --test test/task-curriculum-resolver.test.ts test/task-curriculum-lifecycle.test.ts test/planning-curriculum-persistence.test.ts`

Expected: PASS for `NODE EXACT`, direct-child `NODE WHOLE`, leaf fallback, `PLACEMENT EXACT`, rejected `PLACEMENT WHOLE`, immutable snapshots, and persistence behavior.

- [ ] **Step 3: Confirm schema and migrations are untouched**

Run: `Get-FileHash -Algorithm SHA256 database/prisma/schema.prisma; git status --short -- database/prisma`

Expected: schema hash matches Global Constraints and no new/modified migration path was introduced by this milestone.

---

### Task 7: Deterministic generation and runtime artifact loading

**Files:**
- Modify: `apps/api/src/scripts/build-curriculum-artifact.ts`
- Modify: `apps/api/src/curriculum/artifact.ts`
- Modify: `apps/api/test/curriculum-artifact.test.ts`
- Modify: `apps/api/test/curriculum-catalog-artifact.test.ts`
- Regenerate: `apps/api/src/curriculum/generated/canonical-curriculum.v1.json`
- Regenerate: `apps/api/src/curriculum/generated/canonical-curriculum-catalog.v1.json`
- Regenerate: `apps/api/src/curriculum/generated/canonical-curriculum-identities.v1.json`

**Interfaces:**
- Consumes: Tasks 1–3 compiler/registry/catalog functions
- Produces: checked-in deterministic artifacts loaded by `canonicalCurriculumStore`

- [ ] **Step 1: Write failing generated-file determinism assertions**

Compile twice from the same source/manifest/registry and assert identical serialized base, catalog, and registry bytes. Assert checked-in bytes equal generated bytes and base artifact SHA remains the pre-milestone value.

- [ ] **Step 2: Run artifact tests and verify RED**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-artifact.test.ts test/curriculum-catalog-artifact.test.ts`

Expected: FAIL until all generated files and loader wiring match.

- [ ] **Step 3: Finalize the build script and regenerate once**

Ensure writes occur only after all parsing, identity, manifest, equivalence, and payload validations succeed. Then run: `pnpm.cmd --filter api curriculum:build-artifact`.

- [ ] **Step 4: Run the build command a second time**

Run: `pnpm.cmd --filter api curriculum:build-artifact`

Expected: generated-file hashes remain identical; no tombstone generation or ID churn occurs on the second run.

- [ ] **Step 5: Run artifact tests and verify GREEN**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-artifact.test.ts test/curriculum-catalog-artifact.test.ts`

Expected: PASS, including 5,641 exact current IDs and byte-for-byte determinism.

---

### Task 8: Implemented-contract documentation and final verification

**Files:**
- Modify: `docs/API.md`
- Modify: `docs/PROJECT_STATE.md`
- Verify unchanged: `docs/PRODUCT_MAP.md`
- Verify unchanged: `docs/ROADMAP.md`
- Verify unchanged: `docs/DESIGN_SYSTEM.md`

**Interfaces:**
- Consumes: verified runtime/API behavior from Tasks 1–7
- Produces: accurate `CURRENT IMPLEMENTED STATE` documentation and complete milestone evidence

- [ ] **Step 1: Update API documentation**

Document primary track-scoped routes, exact filtering-context boundary, entry/root/group/node responses, ambiguity behavior, compatibility routes, and unchanged task target types. Include the future non-implementation Question Bank many-to-many/human-tagging/no-inference compatibility statement only as `APPROVED FUTURE STATE`.

- [ ] **Step 2: Update Project State**

Record the additive catalog overlay, manifest, registry, ID preservation, resolved Biology/internal ambiguity, Humanities Arabic mount metadata, Chemistry equivalence/quarantine rule, zero DB/frontend changes, and test results under `CURRENT IMPLEMENTED STATE`. Retain the `StudentProfile.track` enforcement gate under future/deferred state.

- [ ] **Step 3: Run all focused Curriculum and Task tests**

Run: `pnpm.cmd --filter api exec tsx --test test/curriculum-*.test.ts test/task-curriculum-*.test.ts test/planning-curriculum-persistence.test.ts`

Expected: PASS.

- [ ] **Step 4: Run the complete API suite**

Run: `pnpm.cmd --filter api test`

Expected: all API tests PASS with zero failures.

- [ ] **Step 5: Run API typecheck**

Run: `pnpm.cmd --filter api typecheck`

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 6: Verify deterministic generation after the full suite**

Run: `pnpm.cmd --filter api curriculum:build-artifact`, followed by the two artifact test files.

Expected: PASS and no generated-byte changes.

- [ ] **Step 7: Verify protected boundaries**

Run the protected-file hash command from Task 0.

Expected: all four hashes still match Global Constraints. Confirm no milestone-authored changes under `apps/student-web`, `apps/counselor-web`, or `database/prisma` and no new migration.

- [ ] **Step 8: Run whitespace validation**

Run: `git diff --check`

Expected: exit code 0 and no whitespace errors.

- [ ] **Step 9: Capture exact closeout evidence**

Run:

```powershell
git diff --stat
git status --short
git branch --show-current
git rev-parse HEAD
```

Use the exact outputs in the required 41-section milestone report. Report all unresolved inventory items and the remaining authoritative `StudentProfile.track` gate. State `DATABASE CHANGES: NONE`, `MIGRATIONS: NONE`, `FRONTEND CHANGES: NONE`, and `COMMIT STATUS: NOT COMMITTED` only after verification confirms them.
