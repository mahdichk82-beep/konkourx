# Planning and Curriculum Interaction Product Decision Gate

**Status:** APPROVED FUTURE STATE — DOCUMENTATION ONLY; IMPLEMENTATION NOT AUTHORIZED

**Date:** 2026-10-07

**Milestone:** Product/UX decision reconciliation plus the recursive Curriculum-subtree persistence architecture gate

This specification records Product Owner decisions. It does not authorize product code, schema, migration, API, UI, test, dependency, generated-artifact, or data changes. [PRODUCT_MAP.md](../../PRODUCT_MAP.md) owns product behavior, [ROADMAP.md](../../ROADMAP.md) owns implementation order, [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) owns visual rules, and [PROJECT_STATE.md](../../PROJECT_STATE.md) owns current repository facts.

Where this specification refines interaction details from the 2026-10-05 identity/profile/task-domain design, this later decision governs the affected future interaction only. It does not replace that specification's compatible identity, privacy, TaskContentType, Student-track, or historical-data boundaries.

## 1. Purpose

Prevent future milestones from polishing or extending UI concepts that the Product Owner has classified for redesign, simplification, retirement, or rewrite. This revision also closes the documentation-only architecture gate for recursive Curriculum-subtree selection without changing historical `WHOLE` meaning. It selects a future contract; it does not authorize its implementation.

## 2. CURRENT IMPLEMENTED STATE

The following statements describe the repository at this decision gate. They are not acceptance of the current UX as final:

- Canonical Curriculum runtime is file-backed and read-only, and Student track is backend-authoritative.
- Student `/planning` and `/planning/weekly` are operational.
- Picker-to-Planning v1 is technically closed and committed at `34a6af2e1932c1f171957a83f3d30023f5b07208`. It retains the current `EXACT`/direct-child `WHOLE` compatibility contract; its Picker UX is not final.
- `/curriculum` currently exposes old selection concepts, including single/multiple selection and `EXACT`/`WHOLE`-derived user-facing scope controls.
- `/study` still exists, is visible in Student navigation, and still supports personal Subject/Topic authoring.
- Counselor `/planning` is a shell/placeholder. Current real Counselor planning operations are in assigned-Student detail forms, lists, and weekly views.
- `TaskContentType` supports `STUDY | GENERAL`; nullable/legacy compatibility remains where the current contracts permit it.
- Task Curriculum requests currently accept at most 50 target roots. The resolver expands `NODE + WHOLE` to immediate children only, rejects overlapping execution items, and has no separate resolved-item count limit.
- `DailyTaskCurriculumTarget` stores selector intent plus root label/path/representation snapshots. `DailyTaskCurriculumItem` stores the immutable resolved checklist with label/path snapshots, global item order, and completion state.
- Target replacement currently re-resolves before one database transaction, then locks and rechecks the Student profile track before replacing target/item rows. Server persistence requires the correct Task source, `PENDING` status, and no completed Curriculum item; current first-party edit UI also blocks when Study-session/history or valid Assessment evidence exists.
- Planning reads publish stored snapshots first and only then attempt optional catalog enrichment. A missing catalog node or missing track cannot erase the historical summary and leaves that selection read-only.
- Existing one-Student batch creation produces multiple independent Tasks for one Student. Cross-Student group assignment does not exist.
- The 24×4 read-only Task timeline described below does not exist.
- Profile Center exists technically. Product Owner Visual PASS is pending.
- Authentication supports login, access/refresh session handling, logout, logout-all, and password change using the current password.
- Verified email/phone management, email/phone change and verification, forgot/reset password, account recovery, session/device listing, and single-session/device revocation are not implemented.
- `/assessments` is a legacy completed-attempt UI, not the final Assessment experience.

## 3. APPROVED FUTURE STATE — Curriculum Browser

The canonical Student-facing Curriculum route is `/curriculum`, with the Persian navigation label `مباحث درسی`.

`/curriculum` is a browse-only explorer for:

- navigating official Curriculum;
- search;
- expand/collapse;
- viewing hierarchy; and
- viewing path and breadcrumb context.

It is not a Task Picker. The normal page has no selected-items tray, Task-selection workflow, single/multiple selection modes, scope/domain selector, `EXACT`/`WHOLE` terminology, `دقیق`, `با زیرمبحث`, `فرزندان مستقیم`, or save-to-Task action.

Official Curriculum browsing must not be duplicated between `درس‌ها و مباحث` and `برنامه درسی رسمی`. The final primary navigation contains only `مباحث درسی` for this purpose.

## 4. APPROVED FUTURE STATE — Legacy `/study`

`/study` is legacy compatibility only. Students should not normally create arbitrary personal Curriculum subjects or topics in the final product.

The transition must:

1. remove `/study` from primary navigation in its approved implementation milestone;
2. preserve legacy Subject/Topic data, history, and compatible reads safely;
3. keep official Curriculum as the canonical academic structure; and
4. avoid presenting user-authored legacy data as official Curriculum.

This decision does not authorize deletion of the route, backend entities, APIs, or historical data.

## 5. APPROVED FUTURE STATE — Study Task Curriculum Picker

Curriculum selection appears only inside authorized `STUDY` Task create/edit flows. It is a tri-state checkbox tree with one shared selection state:

- **Unchecked:** nothing selectable in the branch is selected.
- **Checked:** the complete selectable subtree is selected.
- **Indeterminate / minus:** only part of the selectable subtree is selected.

Checking a parent selects the complete selectable subtree recursively, including descendants not presently loaded by the client. Deselecting a child updates every ancestor to checked, unchecked, or indeterminate as appropriate. Multiple selection is inherent in checkboxes; there is no separate single-selection or multi-selection mode.

Search results and the browsed tree read and mutate the same selection state. A selection changed in either view must be immediately consistent in the other.

Navigation-only wrapper nodes may expose bulk checkbox behavior when useful, but a wrapper that is not a valid Task target must never be persisted as though it were one.

The Picker has no user-facing `دامنه`, `دقیق`, `با زیرمبحث`, `EXACT`, `WHOLE`, or `فرزندان مستقیم` terminology.

## 6. APPROVED FUTURE STATE — Picker Layout

The current large/heavy modal is not the final UX. The final direction is:

- one primary scroll region;
- no nested-scroll maze;
- no large sticky selected-items tray covering content;
- search above the tree;
- compact footer;
- selected-count summary; and
- `انصراف` and `تأیید` actions.

This decision defines interaction structure, not final component styling. Visual execution remains subject to `DESIGN_SYSTEM.md` and Product Owner visual review.

## 7. Historical `WHOLE` Compatibility

Historical `WHOLE` has its existing direct-child meaning. That meaning is immutable for already-saved Tasks.

Future work must not:

- reinterpret historical `WHOLE` as recursive subtree selection;
- silently migrate historical `WHOLE`;
- convert an unchanged historical `WHOLE` target during an unrelated edit; or
- regenerate historical execution meaning from a changed Curriculum branch.

Current `EXACT`/`WHOLE` support remains a factual compatibility contract until a separately approved implementation changes new-write behavior. The new recursive checkbox UX therefore requires a new internal persistence/resolution contract.

## 8. APPROVED FUTURE STATE — Recursive Subtree Persistence Architecture

This section closes the architecture Decision Gate. The selected internal selector model is:

| Selector | Meaning | Write status |
|---|---|---|
| `EXACT` | Exactly one valid canonical node | Retained for historical compatibility and terminal-node selections |
| `WHOLE` | The selected node's immediate children, or the node itself when it has no child | Legacy compatibility only; its meaning never changes |
| `SUBTREE` | The complete recursively resolved set of terminal selectable nodes under one valid canonical root | New future-write selector for the tri-state Picker |

These names are internal API/persistence vocabulary. The normal Picker never exposes them or a scope choice.

### 8.1 Authoritative resolution and terminal coverage

For a canonical node root, the client sends only the root identity and internal selector. It does not load or submit every descendant. The server:

1. derives the Student's authoritative track;
2. validates the root against that track's catalog membership;
3. traverses the authoritative server-side Curriculum recursively;
4. follows only valid selectable descendants;
5. emits a node as an execution item only when it has no selectable child in that authorized subtree; and
6. uses the valid root itself as the leaf fallback when the root has no selectable child.

Intermediate nodes are selection structure, not duplicate execution checklist items. For `SUBTREE(Chapter)` over `Chapter -> Lesson 1 -> A/B` and `Lesson 2 -> C`, the immutable items are `A`, `B`, and `C`, not the chapter and lessons as well. All current catalog-member canonical nodes are selectable; terminal therefore currently means no catalog-member child in the authorized entry/tree context. This rule remains explicit so a future catalog may distinguish navigation from selectable nodes without changing saved Tasks.

Resolution uses one pinned runtime catalog artifact/version for the request. The database transaction locks and rechecks the Student track, rejects a track change, and writes the Task, normalized targets, and resolved items as one unit. Because the checked-in runtime catalog is immutable for the life of the server process, server resolution may be compiled before the database transaction, but the pinned catalog identity and expected track must accompany that compilation. No target or item rows may survive a failed selector, authorization check, capacity check, or transaction.

### 8.2 Compact selection expression and normalization

The client maintains a set-like expression rather than a list of every selected leaf. Both client and server apply the same normalization rules, and the server is authoritative:

- a fully selected non-terminal branch is one `SUBTREE(rootNodeId)`;
- a selected terminal node is one `EXACT(nodeId)`;
- identical selectors collapse to one;
- a descendant selector covered by an ancestor `SUBTREE` is removed;
- the tri-state new-write serializer never emits `EXACT` for a non-terminal branch, although historical/current compatibility reads retain any existing valid `EXACT` node;
- overlapping resolved item identities are deduplicated by canonical reference identity;
- selector input order never affects meaning; and
- target and item order is regenerated from deterministic catalog traversal order, with canonical ID as the final stable tie-breaker.

Search and tree views mutate this same normalized set. A lazy client may calculate visible checked/indeterminate state from the expression and server-supplied ancestry/count metadata, but its loaded descendants never define persisted coverage. Before persistence, the server resolves and normalizes again from the authoritative catalog.

### 8.3 Navigation-only wrappers

Catalog entries and `GROUP` wrappers remain navigation identities, not Task target kinds. A wrapper checkbox is an input convenience only:

- selecting it expands to the wrapper's ordered valid child roots, not every descendant leaf;
- each non-terminal child root becomes `SUBTREE`; a terminal child root becomes `EXACT`;
- the resulting node selectors pass through the same authorization, overlap, normalization, ordering, and capacity rules; and
- only normalized canonical `NODE` selectors and their resolved node items are persisted.

The three current Humanities Arabic `GROUP` wrappers expand to 8, 7, and 4 child roots and resolve to 134, 116, and 73 terminal items respectively. A wrapper ID must never be written to `DailyTaskCurriculumTarget`, even transiently. If future catalog changes make an exposed wrapper exceed the approved selector or execution capacity, catalog/UI release validation must catch that conflict before the checkbox is enabled; the client must not silently truncate it.

### 8.4 Immutable intent and execution snapshots

Every saved selection retains both layers:

1. **Selection intent:** normalized target root, internal selector, position, root label/path snapshot, and representation snapshot.
2. **Immutable execution coverage:** the resolved terminal item IDs, positions, label/path snapshots, and completion state captured at write time.

Execution, partial completion, remaining-work reporting, and historical display read the stored item rows. They never re-resolve a historical target against today's Curriculum. Catalog enrichment remains optional and snapshot-first: a removed, renamed, inaccessible, or unresolved current node cannot erase or rewrite the saved label/path summary. Future Curriculum additions affect only future writes.

The existing target/item table split already models these two layers. A new table, target kind, entry snapshot, or historical backfill is not required for the selected core semantics. A future additive Prisma/PostgreSQL enum change is required to add `SUBTREE` to `CurriculumSelectionMode`, with corresponding generated-client and type/schema updates. Existing rows remain byte/semantically unchanged.

### 8.5 Legacy `WHOLE` editing

Opening an existing Task never rehydrates `WHOLE` as a recursive checked branch. The editor shows its stored historical target and execution snapshots as a legacy read-only summary.

- An unrelated or unchanged save omits Curriculum replacement entirely and preserves the original `WHOLE`, target snapshots, item rows, positions, and completion state exactly.
- There is no automatic conversion, background backfill, or re-resolution.
- A Task containing any legacy `WHOLE` may change Curriculum only through an explicit **replace Curriculum selection** action. Cancellation leaves the legacy set untouched.
- Explicit replacement discards the complete prior selector/item set in the existing all-or-nothing replacement transaction and writes only a newly normalized contract-v2 selection. It does not carry one old `WHOLE` forward alongside new selectors.
- Replacement remains subject to the current actor/source, Task status, execution, Study-history/session, Assessment-evidence, content-type, and Student-track protections. This architecture neither weakens nor silently broadens those edit rules.

### 8.6 API evolution and compatibility

The selected evolution is **a versioned additive write payload**, not an unqualified new enum value in the legacy request:

```text
curriculumSelection: {
  version: 2,
  selectors: [
    { rootKind: NODE, rootId, selector: EXACT | SUBTREE },
    { rootKind: NAVIGATION_GROUP, rootId, selector: SUBTREE }
  ]
}
```

`NAVIGATION_GROUP` is input-only and is normalized away before persistence. Exact field names are implementation detail, but the discriminated version and semantics are required. Existing `curriculumTargets` version-1 requests and `EXACT`/`WHOLE` behavior remain available during compatibility rollout. A request must use exactly one contract; mixed v1/v2 bodies are rejected.

This is the smallest safe additive boundary because the v2 contract changes normalization, wrapper expansion, overlap handling, and legacy replacement behavior together. Merely adding `SUBTREE` to the unversioned v1 enum would make old resubmission and duplicate-rejection semantics ambiguous. The persisted enum still gains `SUBTREE`; therefore rollout must update all readers first so an unknown future selector is rendered from snapshots as read-only, then deploy the additive enum/server support, and only then enable v2 writers. If independently deployed external clients cannot meet that tolerant-reader rollout, a separately versioned read DTO/endpoint is required before writes are enabled.

Create and replacement routes may add this discriminated body without replacing their authorization boundary. The server response continues to expose persisted intent and resolved coverage, but historical readers must not be forced to reinterpret `WHOLE` or regenerate items.

### 8.7 Authorization, atomicity, and future group assignment

Every selector and every wrapper child root must belong to the affected Student's server-derived permitted Curriculum. One invalid selector fails the complete write. Deterministic deduplication happens before persistence; database uniqueness remains a final integrity guard rather than the normal overlap algorithm.

Current finalized/locked protections remain in force: only the authorized actor/source may replace targets, the Task must remain `PENDING`, existing Curriculum execution and the current first-party Study/Assessment edit locks remain protected, and `STUDY`/`GENERAL` invariants still apply.

Future Cross-Student Group Assignment reuses the same v2 expression. The server resolves and validates it independently for every selected Student's authoritative track. Every Student must accept the complete expression and pass capacity/lifecycle checks before one atomic creation command writes independent per-Student Tasks and snapshots; otherwise the command writes none. This does not authorize Group Assignment implementation.

### 8.8 Catalog cardinality and limits

The 2026-10-07 read-only audit used `canonical-curriculum.v1.json` and `canonical-curriculum-catalog.v1.json`: 5,484 nodes, 67 representations, 29 resolved entries, three tracks, and three navigation groups.

| Track | Selectable nodes | Largest current `WHOLE` direct-child expansion | Theoretical current items from 50 non-overlapping `WHOLE` roots | Largest one-node `SUBTREE` | Terminal nodes across track | Theoretical terminal items from the 50 largest disjoint catalog roots |
|---|---:|---:|---:|---:|---:|---:|
| Experimental | 3,057 | 21 | 533 | 97 | 2,456 | 1,325 |
| Mathematics | 2,736 | 21 | 521 | 97 | 2,208 | 1,317 |
| Humanities | 1,934 | 31 | 396 | 60 | 1,536 | 796 |

The largest single subtree is `قواعد` in `arabic-thematic`, with 97 terminal items. Current chapter terminal-size distributions are:

| Track | Chapter count | Min | Median | 90th percentile | Max | Largest example |
|---|---:|---:|---:|---:|---:|---|
| Experimental | 90 | 6 | 13 | 27 | 51 | `فصل ۳ ـ نوسان و امواج` |
| Mathematics | 83 | 3 | 15 | 29 | 38 | `فصل ۱ ـ جبر و معادله` |
| Humanities | 76 | 2 | 9 | 13 | 21 | `فصل ۲ ـ تابع` |

Representative subject-entry sizes show why selector roots and execution items are different capacities:

| Track | Subject entry | Catalog nodes | Root selectors for full entry | Terminal items |
|---|---|---:|---:|---:|
| Experimental | `فیزیک تجربی` | 472 | 11 | 390 |
| Experimental | `زیست` | 400 | 24 | 326 |
| Mathematics | `فیزیک ریاضی` | 508 | 15 | 428 |
| Mathematics | `حسابان` | 286 | 10 | 242 |
| Humanities | `عربی انسانی` | 403 | 19 | 323 |
| Humanities | `ریاضی و آمار` | 198 | 11 | 164 |

The current `.max(50)` API rule limits submitted target roots, not resolved item rows; no independent item cap exists. The maximum root count of any current subject entry is also 50 (`religion`), so 50 remains the approved normalized-selector ceiling for the first implementation. It must be checked both on raw v2 expressions and after wrapper expansion/normalization. It is not an execution-item ceiling.

A separate server-side resolved-item capacity check is required before transaction writes. This document does not lock an arbitrary number because database transaction cost, response size, checklist rendering, completion updates, and group-assignment multiplication have not been capacity-tested. Implementation authorization must provide evidence for the numeric bound. The bound and UI must at minimum remain coherent with every exposed bulk checkbox; today that means 97 items for a node, 134 for a current navigation group, 428 if full-subject bulk selection is exposed, and as many as 1,325 for every valid current Experimental combination allowed by the retained 50-root ceiling. Any lower policy is a Product Owner/architect limit decision, not an accidental validation constant.

### 8.9 Rejected alternatives

- **Redefine `WHOLE` as recursive:** rejected because it changes historical meaning.
- **Client submits every leaf as `EXACT`:** rejected because lazy/paginated state would define persistence, payloads become large, and unloaded descendants could be lost.
- **Resolve `SUBTREE` at read/execution time:** rejected because Curriculum edits would mutate old Tasks.
- **Persist only resolved items:** rejected because selection intent and compact editing/audit context would be lost.
- **Persist a navigation wrapper as a Task target:** rejected because wrappers are not canonical academic targets.
- **Add `SUBTREE` directly to the unversioned v1 payload:** rejected because it cannot safely distinguish v2 normalization and explicit legacy replacement semantics from historical v1 resubmission behavior.

### 8.10 Implementation gate remaining after this decision

The architecture is decided; implementation remains unauthorized. The next implementation plan must cover the additive enum migration, tolerant-reader-first rollout, v2 request/response schemas, deterministic resolver/normalizer tests, pinned-catalog and track recheck, transactional persistence, capacity evidence and bound, legacy edit UX, wrapper serialization, and regression proof that historical `WHOLE` rows and items are unchanged. No backfill or Curriculum-content change is permitted.

## 9. APPROVED FUTURE STATE — 24×4 Daily Timeline

`24 × 4` means 24 hours with four quarter-hours per hour: 96 visual slots and 15-minute resolution. It does not mean 96 database entities.

The v1 surface is a read-only daily timeline that positions existing timed Tasks from their start and end times. It is display-only:

- not draggable;
- not resizable;
- not clickable for editing;
- not used to create Tasks; and
- not used to move Tasks.

Tasks with a date but no precise time appear separately, for example under `کارهای بدون ساعت`. They are never assigned an artificial position on the timeline.

The primary context is Student daily planning. Counselor surfaces may later reuse the same visualization in Student Detail or an operational overview. The current Counselor `/planning` shell is not an interactive scheduler.

## 10. APPROVED FUTURE STATE — Today Planning Presentation

Core Task lifecycle semantics remain. Today Planning is a presentation redesign using progressive disclosure:

1. Before execution, show the Task identity, relevant Curriculum context, scheduled time, and primary start action.
2. During execution, prioritize active state, elapsed time, and the finish action.
3. After execution, reveal only the applicable closure inputs such as Curriculum coverage, one Task-level quality score, and optional note, then the submit action.

The page must not expose every control and form at once. This is not a replacement of backend lifecycle semantics.

## 11. Batch Creation and Cross-Student Group Assignment

The current one-Student batch means multiple independent Tasks for one Student. Wording equivalent to `ایجاد گروهی وظایف` is misleading for that flow. If it remains, future copy should mean `ثبت چند وظیفه برای این دانش‌آموز`.

True cross-Student Group Assignment is a separate future capability:

```text
Students list
→ select N Students
→ issue one assignment command
→ create one independent DailyTask lifecycle per Student
```

For `STUDY` group assignment, the complete Curriculum selection must be valid for every selected Student's authoritative track. The operation should be bounded and atomic: any invalid Student authorization or Study selection prevents partial creation. Exact limits, idempotency, API shape, and audit/provenance remain implementation-stage architecture decisions.

## 12. Profile Center

Profile Center is technically implemented but has not received Product Owner Visual PASS.

The retained information architecture is:

| Student | Counselor |
|---|---|
| اطلاعات شخصی | اطلاعات شخصی |
| اطلاعات تحصیلی | اطلاعات حرفه‌ای |
| تنظیمات | تنظیمات |
| امنیت و حساب | امنیت و حساب |

`امنیت و حساب` remains a required section.

The current presentation requires redesign because it is too similar to the old Settings layout, has weak visual hierarchy and excessive empty space, allows large error states to dominate, still needs account-menu/header spacing polish, and does not yet give Counselor professional identity a sufficiently professional presentation.

## 13. Account and Security Capability Boundary

Frontend controls must represent real backend capability. Do not add inert or fake controls for future account functions.

Current capabilities are login, refresh/session handling, logout, logout-all, and password change using the current password.

After Profile Center visual closeout, the roadmap must separately sequence:

- verified email management, verification, and change;
- verified phone management, verification, and change;
- forgot-password, reset-password, and account recovery;
- session/device list; and
- revocation of a specific session/device.

MFA/2FA remains future-only unless separately approved.

## 14. Assessment UX

The current `/assessments` UX is legacy and not final. Its useful backend/history may be preserved, but the user experience requires a dedicated future rewrite milestone.

Known presentation problems are the giant all-in-one form, legacy Subject/Topic selectors, native/old date-time interaction, old visual language, and too much simultaneous input. This document does not define or authorize the replacement design.

## 15. Product/UI Classification

| Classification | Surfaces |
|---|---|
| KEEP + POLISH | App Shell, Sidebar structure, Header structure, Weekly Planning, core Task lifecycle semantics |
| REDESIGN | Today Planning Task presentation, Curriculum Picker, Profile Center |
| SIMPLIFY HEAVILY | `/curriculum` into a browse-only Curriculum explorer |
| RETIRE FROM PRIMARY UI | `/study` personal Subject/Topic authoring |
| REWRITE LATER | Assessment UX |

Future milestones must not classify a retire/rewrite item as a polish-only task.

## 16. Approved Near-Term Sequence

0. Product/UX Documentation Decision Gate — complete.
1. Recursive subtree persistence architecture without redefining historical `WHOLE` — complete in this documentation revision; implementation not authorized.
2. Safe closeout/reconciliation of the current Picker-to-Planning technical checkpoint — complete at `34a6af2`; no tri-state, `SUBTREE`, or v2 behavior was implemented.
3. Split Browser from Picker and implement the tri-state recursive Picker under an approved implementation milestone.
4. Clean Curriculum navigation, remove `/study` from primary navigation, and use the canonical `مباحث درسی` label.
5. Implement the read-only 24×4 Daily Timeline.
6. Redesign Profile Center and obtain Product Owner Visual PASS.
7. Expand Account & Security with verified email/phone, verification/change, recovery/reset, and session/device management.
8. Implement Cross-Student Group Assignment.
9. Continue Reports and the remaining canonical roadmap according to dependencies.
10. Rewrite Assessment UX in its dedicated milestone.

This sequence does not delete or deauthorize the broader valid future phases in `ROADMAP.md`. Every implementation item still requires an explicit milestone.

## 17. Non-Goals

- No product code or test changes.
- No Prisma, migration, database, seed, or generated-client changes.
- No dependency or package-file changes.
- No Curriculum educational-content changes.
- No deletion of legacy `/study`, Subject/Topic, `PLACEMENT`, `EXACT`, `WHOLE`, stored snapshots, or historical records.
- No recursive-subtree schema, API, resolver, client, migration, generated-client, or database implementation.
- No Profile, Planning, Curriculum, or Assessment redesign implementation.
- No Cross-Student Group Assignment implementation.
