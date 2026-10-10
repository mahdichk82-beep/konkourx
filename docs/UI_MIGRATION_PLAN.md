# Konkourix UI Migration Plan

**Status:** LEGACY / SUPPORTING TARGET BLUEPRINT; REVALIDATION REQUIRED
**Last synchronized:** 2026-10-02
**Current baseline:** M19 (`76bc4d7`) plus the current documented working state
**Scope:** Migration of Student Web and Counselor Web from the current UI to the approved target UX, plus the dependency-gated future Admin experience

This document preserves an M19-era UI migration proposal. [PRODUCT_MAP.md](PRODUCT_MAP.md) defines behavior, [ROADMAP.md](ROADMAP.md) defines sequence, and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) defines visual rules. Every proposal here requires revalidation against those canonical documents. It does not authorize or specify implementation.

## Sources of Truth

- [UI_AUDIT.md](UI_AUDIT.md)
- [UX_ARCHITECTURE.md](UX_ARCHITECTURE.md)
- [PRODUCT_MAP.md](PRODUCT_MAP.md)
- [ROADMAP.md](ROADMAP.md)
- [TARGET_DATABASE_DESIGN.md](database/TARGET_DATABASE_DESIGN.md)

Where a target workflow is described but its governing ADR or policy remains unresolved, this plan marks the UI as blocked. A convenient frontend default must not resolve a domain decision.

## Classification

| Classification | Meaning in this plan |
| --- | --- |
| **KEEP** | Preserve the current route, page, component, or interaction as a valid foundation. Limited visual and integration updates may still occur. |
| **MODIFY** | Retain the foundation but change its information architecture, semantics, state behavior, accessibility, or domain integration. |
| **REPLACE** | Introduce a target experience because the current surface embodies a transitional or conflicting domain model. Preserve required historical access and evidence. |
| **REMOVE** | Remove the current UI surface or navigation exposure after its replacement is proven. This never means deleting historical data. |
| **NEW** | Add a target capability with no current UI equivalent, only after its domain dependencies and release gates are complete. |

Classifications are migration dispositions, not immediate change instructions. `REPLACE` and `REMOVE` occur only after target reads/writes, compatibility behavior, authorization, recovery, accessibility, and rollback have been accepted.

## Migration Principles

1. **Follow the critical path:** Curriculum -> Progress -> Planning -> Practice -> Question Bank -> Exams -> Analytics.
2. **Keep current users working:** current routes remain available until their target replacement is production-ready and historical records remain resolvable.
3. **Do not expose unfinished navigation:** a target destination appears only when its backend, API, authorization, migration, state, accessibility, and recovery behavior is complete.
4. **Cut over by workflow:** expand, dual-read where explicitly approved, verify, cut over target writes, cut over reads, disable legacy writes, then retire obsolete UI.
5. **Preserve domain separation:** Plan, Task, Study Session, Task Result, Progress, Practice, External Report, and Internal Exam never collapse into a generic activity flow.
6. **Preserve exact historical context:** legacy labels, source kind, curriculum version, plan version, corrections, invalidations, and missing values remain visible without invented mappings.
7. **Keep authority server-side:** route visibility, disabled controls, and client state do not replace relationship, ownership, lifecycle, or capability enforcement.
8. **Migrate the design system incrementally:** do not pause domain delivery for a big-bang visual rewrite, and do not expand duplicated components indefinitely.
9. **Treat accessibility as a phase exit criterion:** WCAG 2.2 AA, Persian/RTL, keyboard, reflow, direct-entry alternatives, and recovery states are part of each workflow.
10. **Do not use UI migration to settle open policy:** final route paths, Progress authority, legacy assessment classification, Daily Reality rules, exam policy, and communication retention remain governed elsewhere.

## Release Pattern for Every Surface

Each route or workflow follows the same controlled sequence:

1. Keep the M19 surface operational.
2. Approve the target route/state design and all relevant policy gates.
3. Deliver authoritative domain/API behavior and migration compatibility.
4. Build the target surface without presenting hidden or partial work as complete.
5. Verify target and legacy reads, authorization, RTL, accessibility, mobile behavior, failure recovery, and rollback.
6. Move new writes to the target workflow under observable release controls.
7. Move the primary navigation/read entry to the target surface.
8. Retain a labelled compatibility view for historical records.
9. Remove obsolete route exposure or components only when no supported workflow depends on them.

## 1. Student Web Migration Plan

### Existing Route Disposition

Final target URL paths remain a route-design decision. The target destination names below describe information architecture, not an approved URL contract.

| Existing route | Current surface | Classification | Target destination and execution rule | Dependency |
| --- | --- | --- | --- | --- |
| `/login` | Student login | **KEEP** | Retain the role-specific entry and session behavior; align it with shared tokens, accessible authentication, and target branding without merging roles. | Design-system release slice; identity behavior remains current |
| `/` | Placeholder Dashboard | **REPLACE** | Become `Today`: active Study Session/Internal Exam recovery, next published learning action, today timeline, follow-up, personal work, and recent evidence in approved priority order. | Phase 3 for target plan/task/result content; Phase 6 for exam recovery; Phase 7 for analytic summaries |
| `/planning` | Daily Task execution and personal Task creation | **MODIFY** | Preserve execution recovery and source labels. Reframe under `Today`/`Plan`, add canonical context, and replace direct completion actions with Task Result. | Phase 3; Curriculum and Progress already complete |
| `/planning/weekly` | Weekly Task grid and personal Task movement | **MODIFY** | Retain week/list concepts, eligible personal movement, evidence locks, and the non-drag alternative. Add published Plan version, source, revision history, and Reality context. | Phase 3 and approved planning lock policy |
| `/study` | Student-owned StudySubject/Topic management | **REPLACE** | Become a read-only Curriculum/Progress experience. Historical legacy labels remain reachable through compatibility context; students never edit canonical structure. | Phase 1 for Curriculum read; Phase 2 for Student Progress overlay |
| `/assessments` | Generic AssessmentAttempt entry/history | **REPLACE** | Become `Practice & Exams`, with separate Practice, External Report, Internal Exam, and explicitly labelled legacy assessment histories. No heuristic reclassification. | Phase 4, Phase 6, ADR-040, ADR-042, and exam policy gates |
| `/reports` | Placeholder Reports | **REMOVE** | Remove as a generic primary destination after Progress and source-preserving reporting own the relevant views. Do not redirect it to a misleading partial dashboard. | Phase 2 for Progress; Phase 7 for cross-domain reporting |
| `/settings` | Profile, theme, password, and sessions | **KEEP** | Preserve functionality and place it under `More`. Existing deep access may remain during transition. Replace native confirmation and align field/state patterns. | Target shell/design-system slice; no educational-domain dependency |
| Unknown route | Localized not-found state | **KEEP** | Retain a safe not-found/recovery state inside the target shell with correct role context. | Target routing foundation |

### Existing Student Page and Component Inventory

| Existing page/component | Classification | Migration disposition |
| --- | --- | --- |
| `App` | **MODIFY** | Replace the flat exact-route composition with an approved target route/state map, capability-gated destinations, page-title/focus behavior, and compatibility entries. Do not finalize paths in this document. |
| `AuthProvider` | **KEEP** | Preserve authenticated-session ownership; adapt only where target recovery/security states require it. |
| `ProtectedRoute` | **KEEP** | Preserve authenticated route protection while ensuring server authorization remains authoritative. |
| `AppShell` | **MODIFY** | Retain RTL desktop/mobile shell foundations; adopt target navigation, `More`, context/version display, skip link, deep-route recovery, and safe mobile layout. |
| `NavIcon` | **MODIFY** | Retain code-native labelled icons; move to a governed shared icon set and expand target domain coverage. |
| `Button` | **KEEP** | Preserve native button semantics, variants, disabled state, and minimum target size; later consume shared semantic tokens and busy/destructive patterns. |
| `Card` | **MODIFY** | Retain the visual surface primitive but make landmark and heading semantics contextual; support denser target workspaces. |
| `ContentState` | **MODIFY** | Extend loading/empty/error handling to stale, partial, skeleton, offline/reconnecting, freshness, and domain-specific recovery states. |
| `LoginPage` | **KEEP** | Preserve role clarity and labelled authentication; migrate brand/tokens and complete accessible-authentication review. |
| `DashboardPage` | **REPLACE** | Replace placeholder cards and disabled actions with the target Today priority model. |
| `TodayPlanningPage` | **MODIFY** | Preserve Task/session execution patterns; remove inline legacy-subject creation from target writes; add canonical Plan/Task context and Task Result. |
| `WeeklyPlanningPage` | **MODIFY** | Preserve workload/week and dual movement interactions; integrate Plan versions, immutable counselor intent, Reality context, and linear mobile representation. |
| `SubjectTopicsPage` | **REPLACE** | Replace editable student taxonomy with Curriculum Explorer plus Progress. Retain legacy data through a labelled read-only compatibility path. |
| `AssessmentAttemptsPage` | **REPLACE** | Stop using a generic entry form for new target evidence. Preserve existing records in legacy assessment history while distinct assessment UIs arrive by phase. |
| `SettingsPage` | **KEEP** | Preserve profile/security/theme workflows under `More`; replace browser confirmation and standardize validation/focus recovery. |
| `PlaceholderPage` | **REMOVE** | Remove after no released route depends on a placeholder. Unfinished destinations must remain hidden instead of using production placeholder pages. |
| `TaskExecutionPanel` | **KEEP** | Preserve server-authoritative active-session recovery, start/finish/cancel, feedback history, and explicit separation from Task status. Integrate source/curriculum evidence without merging lifecycles. |

### New Student Surfaces

| Target surface | Classification | Delivery gate |
| --- | --- | --- |
| Today dashboard and recovery-first next action | **NEW** | Phase 3; exam recovery section joins only in Phase 6 |
| Published Plan and Plan history | **NEW** | Phase 3 |
| Personal Task creation with canonical node selection | **NEW** | Phase 3 after Phase 1/2 completion |
| Task Result and correction history | **NEW** | Phase 3 and Task-status authority decision |
| Daily Reality Schedule editor/publication/history | **NEW** | Phase 3 plus category/recurrence/overlap/privacy decisions |
| Curriculum Explorer with Progress overlay | **NEW** | Phase 2; base read explorer may arrive in Phase 1 |
| Progress detail, review needs, and evidence timeline | **NEW** | Phase 2 and ADR-035 |
| Practice entry/history/corrections | **NEW** | Phase 4 and ADR-040 compatibility policy |
| Practice & Exams chooser | **NEW** | First useful slice in Phase 4; only show enabled choices |
| External Exam Report workflow | **NEW** | Phase 6, ADR-042, and secure evidence storage if uploads are exposed |
| Internal Exam discovery, attempt, recovery, and result | **NEW** | Phase 6 after Question Bank and exam policy gates |
| Messages: Chat, Tickets, Suggestions | **NEW** | Supporting Lane A after Phase 3 and communication policies |
| Counselor relationship/invitation/request/introduction | **NEW** | Supporting Lane A and acquisition policy |
| Source-preserving learning reports | **NEW** | Phase 7 |

### Student Cutover Boundaries

- `/study` legacy writes remain available until canonical selection is supported by every active target workflow that currently depends on StudySubject/Topic and rollback is proven.
- `/assessments` remains the entry/history for M19 evidence until Practice is ready; after Phase 4, it becomes legacy-history only and must not masquerade as External or Internal Exams.
- Existing counselor-created and personal Tasks remain visible as standalone legacy intention. The UI must not display a fabricated Plan version.
- Existing completed Tasks display `Quality not recorded`; Study Session ratings must never fill Task Result quality.
- Existing settings and authentication remain usable throughout all educational-domain cutovers.

## 2. Counselor Web Migration Plan

### Existing Route Disposition

| Existing route | Current surface | Classification | Target destination and execution rule | Dependency |
| --- | --- | --- | --- | --- |
| `/login` | Counselor login | **KEEP** | Preserve separate counselor identity and session entry; align shared tokens/accessibility without merging role experiences. | Design-system release slice |
| `/` | Placeholder Dashboard | **REPLACE** | Become `Overview` with explainable attention, planning, communication, and recent-evidence queues. Sections load independently and never infer “all clear” from failed data. | Phase 3 core; Supporting Lane A communication; Phase 4/6/7 evidence sections |
| `/students` | Assigned-student list | **MODIFY** | Retain relationship-scoped list, paging, empty/error states, and detail entry. Add approved search/filter/attention context and persistent student selection. | Existing relationships; richer context follows Phases 2–3 |
| `/students/:uuid` | Long stacked Student Detail page | **REPLACE** | Become a persistent student workspace with Overview, Reality, Plans, Tasks/Execution, Progress, Practice/Exams, Communication, and protected Private Notes. Show only tabs whose domains are ready. | Phase 2 onward; each tab has its own gate |
| `/planning` | Placeholder Planning | **REPLACE** | Become draft/published/revision queues and the versioned planning workspace. | Phase 3 and planning policy gates |
| `/reports` | Placeholder Reports | **REMOVE** | Remove generic primary navigation. Evidence remains contextual in student workspaces; cross-domain reports arrive through Phase 7 source-preserving views. | Phase 7 for reporting replacement |
| `/settings` | Profile, theme, password, and sessions | **KEEP** | Preserve under `More`; align shared forms, confirmations, and accessibility. | Target shell/design-system slice |
| Unknown route | Localized not-found state | **KEEP** | Retain safe route recovery without leaking student existence. | Target routing foundation |

### Existing Counselor Page and Component Inventory

| Existing page/component | Classification | Migration disposition |
| --- | --- | --- |
| `App` | **MODIFY** | Adopt capability-gated target navigation, nested student workspace state, context preservation, and compatibility routes after route design approval. |
| `AuthProvider` | **KEEP** | Preserve session ownership and role separation. |
| `ProtectedRoute` | **KEEP** | Preserve authenticated routing while maintaining server relationship/capability checks. |
| `AppShell` | **MODIFY** | Retain RTL responsive shell; add Overview/Students/Planning/Inbox/More, persistent student context, breadcrumbs, version state, skip link, and unsaved-draft protection. |
| `NavIcon` | **MODIFY** | Keep labelled SVG approach; centralize and expand semantic coverage. |
| `Button` | **KEEP** | Preserve semantic native control and touch target; align shared variants/states. |
| `Card` | **MODIFY** | Make semantics contextual and support denser planning/evidence workspaces. |
| `ContentState` | **MODIFY** | Add partial/stale/freshness/offline and independently recoverable queue states. |
| `LoginPage` | **KEEP** | Retain counselor-specific authentication and branding context; apply shared accessible design. |
| `DashboardPage` | **REPLACE** | Replace placeholder metrics/actions with the target Overview queue model. |
| `StudentsPage` | **MODIFY** | Preserve authorized list/pagination; add target filtering, context, and workspace handoff. |
| `StudentDetailPage` | **REPLACE** | Replace the long stack with a contextual, tabbed student workspace. Do not expose empty future tabs. |
| `StudentWeeklyPlanning` | **MODIFY** | Preserve readable weekly distribution and workload summary; show target Plan versions/Reality context and retain a legacy Task view. |
| `StudentTaskList` | **MODIFY** | Preserve source/evidence visibility and lock explanations; move target content into Execution and use Plan revisions rather than direct mutation for counselor intention. |
| `StudentTaskForm` | **REPLACE** | Replace immediate counselor Task creation with Plan draft item authoring and atomic publication. Keep legacy workflow only during verified compatibility. |
| `StudentBatchTaskForm` | **REPLACE** | Reuse rapid multi-row entry concepts inside a versioned Plan draft; do not preserve direct batch publication semantics. |
| `SettingsPage` | **KEEP** | Preserve profile/security/theme under `More`; standardize confirmation and validation behavior. |
| `PlaceholderPage` | **REMOVE** | Remove when Planning/Reports placeholders are no longer routed. Hide unfinished capabilities instead. |

### New Counselor Surfaces

| Target surface | Classification | Delivery gate |
| --- | --- | --- |
| Overview attention/planning queues | **NEW** | Phase 3; later sources added only with their phases |
| Persistent student workspace and scoped tabs | **NEW** | Shell after Phase 2; each tab gated independently |
| Student Progress view | **NEW** | Phase 2 and ADR-035 |
| Read-only Daily Reality layer | **NEW** | Phase 3 and Reality policy |
| Plan draft/editor/validation/diff/publication/history | **NEW** | Phase 3 and planning policy gates |
| Task Result and correction-history review | **NEW** | Phase 3 |
| Practice evidence review | **NEW** | Phase 4 |
| Curriculum Explorer and node picker | **NEW** | Phase 1 read; Phase 3 plan selection |
| External Report review | **NEW** | Phase 6 and ADR-042 |
| Internal Exam evidence/result review | **NEW** | Phase 6 and release policy |
| Inbox for Chat and Tickets | **NEW** | Supporting Lane A |
| Suggestions | **NEW** | Supporting Lane A |
| Private Counselor Notes | **NEW** | Supporting Lane A and access/retention policy |
| Plan-versus-execution and evidence reports | **NEW** | Phase 7 |

### Counselor Cutover Boundaries

- Direct single/batch counselor Task creation remains available until Plan drafting, validation, publication, atomic materialization, history, and rollback are proven end to end.
- Direct rescheduling of counselor Tasks must not be carried into the target model. Future change occurs through a Plan Revision; historical/evidence-bearing intention remains immutable.
- A target student workspace may be introduced progressively, but unavailable domains remain absent rather than placeholder tabs.
- Closing or changing a counselor relationship must immediately obey backend access policy; cached workspace content and drafts require explicit safe recovery behavior.
- Private notes never share components, search, notifications, or APIs with student-visible communication.

## 3. Future Admin UI Plan

There is no current Admin frontend to migrate. Every Admin capability is **NEW**. Whether administration is a separate application or a capability-scoped shell is not decided here; implementation must not assume a monolithic `ADMIN` role or unrestricted panel.

| Admin workspace | Classification | Scope | Delivery gate |
| --- | --- | --- | --- |
| Admin shell/workspace switcher | **NEW** | Capability-scoped navigation, queue states, context, and audit-safe high-impact confirmations | First authorized Admin slice; exact application boundary must be approved |
| Curriculum Operations | **NEW** | Versions, draft tree, imports, source records, ambiguity queue, mappings, validation, review, publication, audit | Phase 1, ADR-034 governance, and import/migration policies |
| Question Bank | **NEW** | Submission, editor, educational/answer/rights/curriculum reviews, approval, publication, withdrawal | Phase 5 and media/rights policies |
| Internal Exam Operations | **NEW** | Builder, versions, eligibility, delivery operations, manual evaluation, correction/invalidation | Phase 6 and exam policy gates |
| Communication Operations | **NEW** | Ticket queue, Suggestion review, approved moderation | Supporting Lane A and communication policies |
| Counselor Operations | **NEW** | Invitation/request/introduction review, student conditions, counselor introductions, relationship oversight | Supporting Lane A and acquisition policy |
| Security and Audit | **NEW** | Permission-scoped audit views and exceptional access review | Delivered per domain; no generic global access |
| Reporting operations/freshness | **NEW** | Projection status, freshness, reconciliation visibility where authorized | Phase 7 reporting policy |

### Admin Delivery Rules

- Build the smallest permission-scoped workspace required by the current phase; do not build empty shells for future modules.
- Import completion, draft save, review approval, and publication are visibly different states and actions.
- Rights evidence, answer keys, private notes, and security audit data require narrower capabilities than ordinary administration.
- Published Curriculum, Questions, Exam Versions, Attempts, Evaluations, and historical audit records have no in-place destructive editor.
- High-impact actions show actor, target version, reason, validation/blockers, consequences, and authoritative server result.

## 4. Navigation Changes

### Student Navigation Transition

| Current item | Classification | Target treatment |
| --- | --- | --- |
| Dashboard | **REPLACE** | `Today` |
| Planning | **MODIFY** | `Plan`; contextual execution remains available from Today and Tasks |
| Study/Subjects | **REPLACE** | Curriculum content is surfaced through `Progress` and contextual Curriculum Explorer |
| Assessments | **REPLACE** | `Practice & Exams`, with separate domain choices |
| Reports | **REMOVE** | Progress/reporting moves to `Progress` and later source-preserving Analytics views |
| Settings | **MODIFY** | Move under `More`; preserve deep access during transition |
| Messages | **NEW** | Add only when Chat/Ticket/Suggestion capabilities are ready |
| More | **NEW** | Profile/context control for Reality, counselor relationship, settings, and security; not a sixth bottom-nav item |

Target mobile bottom navigation is Today, Plan, Progress, Practice & Exams, and Messages. Desktop navigation uses the same conceptual hierarchy and may expose `More` content through the profile/context area. Target items appear one coherent release slice at a time; the application must not show a label whose destination is a placeholder.

### Counselor Navigation Transition

| Current item | Classification | Target treatment |
| --- | --- | --- |
| Dashboard | **MODIFY** | Rename/rebuild as `Overview` when real queues exist |
| Students | **KEEP** | Retain as a primary destination and entry to the persistent student workspace |
| Planning | **REPLACE** | Target versioned Planning workspace |
| Reports | **REMOVE** | Replace primary slot with `Inbox`; reports remain contextual or Phase 7 views |
| Settings | **MODIFY** | Move under `More` |
| Inbox | **NEW** | Chat/Tickets after Supporting Lane A gates |
| More | **NEW** | Curriculum, Suggestions, profile, and security |

### Route and Deep-Link Rules

- Existing bookmarks receive an explicit compatibility outcome: retained page, approved redirect, or localized retirement explanation. No silent redirect may change domain meaning.
- Historical links preserve source/version context and never resolve against “latest” by default.
- Student workspace deep links revalidate relationship access and do not reveal whether an unauthorized student record exists.
- Active Study Session and Internal Exam recovery routes take priority over ordinary landing content.
- Unsaved Plan/Reality drafts require a safe navigation decision; browser history remains usable.
- Page title, heading, focus placement, back path, and selected navigation state are part of every route acceptance criterion.

## 5. Component Migration Strategy

### Strategy

1. **Inventory and freeze semantics:** use the component classifications above as the baseline; do not broaden transitional components into new domains.
2. **Harden current foundations:** retain native semantics, labelled controls, focus, reduced motion, Task/session separation, and non-drag alternatives.
3. **Establish shared governance incrementally:** converge duplicated Button, Card, ContentState, navigation, shell, theme, and form-state conventions through approved release slices. Do not require a big-bang shared-package rewrite.
4. **Add domain components in dependency order:** Curriculum and version/provenance components first, then Progress, Planning/Execution, Practice, Question governance, Exams, Communication, and Reporting.
5. **Retire compatibility components last:** remove placeholder and legacy write components only after supported target workflows and historical reads are proven.

### Shared Foundation Disposition

| Component family | Classification | Target responsibility |
| --- | --- | --- |
| Button/control foundation | **KEEP** | Semantic controls, explicit verbs, busy/disabled state, 44px target, destructive consequence treatment |
| Card/surface foundation | **MODIFY** | Contextual semantics and density; cards are not the only layout primitive |
| ContentState | **MODIFY** | Empty/loading/error plus stale, partial, offline, freshness, skeleton, and source-aware recovery |
| Role AppShell | **MODIFY** | Stable role navigation, context header, breadcrumbs, optional inspector, skip link, safe mobile shell |
| Navigation icons | **MODIFY** | Governed icon set with persistent labels and non-color meaning |
| Custom routing hook | **MODIFY** | Target nested/deep state, history, focus/title, recovery, guards, and compatibility behavior; library choice remains undecided |
| Auth/session foundation | **KEEP** | Role-specific authentication/session behavior; accessible recovery and security states |
| Theme foundation | **MODIFY** | Shared semantic tokens and consistent light/dark meaning while keeping role-specific storage/mode behavior where appropriate |
| Native `window.confirm` interactions | **REPLACE** | Accessible consequence-specific dialog/page patterns with focus and pending-state preservation |
| Placeholder component | **REMOVE** | No released route uses a future-capability placeholder |

### New Domain Component Families

| Dependency phase | Components classified **NEW** |
| --- | --- |
| Phase 1 | Curriculum tree/list, breadcrumb, search result path, node/version badge, retired/deprecated state, source provenance, import issue, mapping state, publication review |
| Phase 2 | Progress status/mastery, evidence link/timeline, unknown state, review need, historical-version context |
| Phase 3 | Plan workspace, schedule grid and list, Reality layer, Plan block/item, workload editor, canonical node picker, version diff, publish review, Task card, Task Result, history/audit timeline |
| Phase 4 | Practice chooser, aggregate form, source attribution, curriculum targets, correction/invalidation history |
| Phase 5 | Question editor, answer structure, rights/attribution panel, multi-node classification, moderation checklist, preview, publish/withdraw review |
| Phase 6 | External Report form/evidence status/review; Exam card, preflight, server timer, question navigator, save/reconnect state, submission review, evaluation/result history |
| Supporting Lane A | Conversation, message send/retry, Ticket header/thread/status history, Suggestion timeline, confidential-note surface |
| Phase 7 | Source/freshness disclosure, evidence drill-down, chart with text/table alternative, partial-data warning |

### Component Ownership Rules

- Shared components own presentation and interaction semantics; domain components own domain language and state interpretation.
- A generic status badge may render a semantic state, but domain adapters define whether a record is Draft, Published, Recorded, Invalidated, or Legacy.
- Curriculum, Plan, Question, Exam, and evidence version identifiers are never hidden inside an untyped generic label.
- Shared components do not perform authorization or infer lifecycle transitions.
- Student and Counselor applications may share foundations without forcing identical density or workflow composition.

## 6. Design System Migration

| Area | Current-to-target action | Classification |
| --- | --- | --- |
| Persian/RTL foundation | Preserve `lang`, direction, logical properties, readable Persian hierarchy, and mixed-direction handling; add systematic calendars/numerals/tree/table testing. | **KEEP** |
| Light/dark modes | Preserve user/system preference and semantic consistency; validate every new state in both themes. | **KEEP** |
| Student green primary palette | Move to the approved blue-based brand family; retain green only for an approved semantic purpose such as success. | **REPLACE** |
| Counselor blue palette | Normalize into the future shared semantic/brand tokens after palette and contrast approval. | **MODIFY** |
| Semantic tokens | Add focus, success, warning, danger, information, selected, disabled, overlay, chart, and lifecycle/source tokens. | **NEW** |
| Typography | Define approved Persian font loading, fallback metrics, scale, line length, numerals, and zoom behavior. | **MODIFY** |
| Icons and brand mark | Retain code-native/icon-plus-label direction; approve consistent iconography and the current mark through brand/accessibility review. | **MODIFY** |
| Glass treatment | Keep optional, limited blur only where contrast, focus, performance, and readability remain safe. | **KEEP** |
| Status language | Centralize Draft/Published/Superseded/Recorded/Corrected/Invalidated/Retired/Legacy language and never rely on color alone. | **NEW** |
| Forms | Establish shared field, hint, unit, required/optional, inline error, summary, focus, pending, and preserved-input behavior. | **MODIFY** |
| Confirmation | Replace browser confirmation with accessible, consequence-specific review for high-impact actions. | **REPLACE** |
| Data visualization | Add only with source, units, time range, calculation/freshness, text summary, and table alternative. | **NEW** |
| Motion | Preserve reduced-motion support and use motion only to explain state or transition. | **KEEP** |

### Design-System Delivery Rules

- Exact color, typography, icon, motion, and glass values require the design-token and accessibility review identified by the target UX.
- Token/component migration happens alongside the earliest approved domain surfaces; Phase 0 permits documentation and prototypes, not runtime UI changes.
- During coexistence, current pages may consume new foundations without being falsely presented as target-domain pages.
- Visual consistency never justifies merging Practice, External, Internal Exam, Task Result, Progress, or Session semantics.

## 7. Mobile UX Migration

| Current behavior | Classification | Target migration |
| --- | --- | --- |
| 320px minimum and responsive reflow | **KEEP** | Retain as a floor; validate zoom/reflow rather than treating one width as proof |
| 900px desktop-to-mobile shell change | **MODIFY** | Preserve current useful behavior, but validate breakpoints against target content instead of freezing one global breakpoint |
| Fixed labelled bottom navigation and safe-area padding | **KEEP** | Retain; migrate Student to five items and Counselor to target five items |
| Student six-item bottom navigation | **REPLACE** | Today, Plan, Progress, Practice & Exams, Messages; access More from profile/context |
| Counselor five-item bottom navigation | **MODIFY** | Overview, Students, Planning, Inbox, More |
| Sticky mobile header | **MODIFY** | Keep orientation but preserve student/version/attempt/draft context and unobscured focus at zoom |
| Weekly cards reflowing to one column | **KEEP** | Retain as compatibility behavior; target schedules additionally require a true linear list/form representation |
| Drag plus explicit destination controls | **KEEP** | Continue direct-entry/click/keyboard alternative; dragging remains optional enhancement |
| Long Student Detail stack | **REPLACE** | Context header plus scoped full-page tabs/flows; avoid placing all forms in one mobile document |
| Split authentication layout collapse | **KEEP** | Retain with keyboard, text zoom, and small-height validation |
| Short modal/sheet decisions | **NEW** | Use only for short choices; long forms/history remain full pages |
| Virtual keyboard/orientation/RTL swipe recovery | **NEW** | Preserve input and draft state without obscured actions or accidental loss |
| Internal Exam mobile recovery | **NEW** | Server-authoritative attempt, stable navigation, save uncertainty, reconnect, and explicit submit |

### Mobile Acceptance Requirements

- Primary actions and bottom navigation remain at least 44 by 44 CSS pixels where feasible and keep text labels.
- Sticky headers/actions never cover focused fields, errors, exam options, or zoomed content.
- Plan and Reality grids have direct time entry and a linear representation.
- Curriculum trees have an accessible list/path alternative and usable deep-hierarchy navigation.
- Deep routes retain context and a back path without discarding drafts.
- Real-device checks cover low-width/height, virtual keyboard, orientation change, safe areas, slow/reconnecting network, Persian/Latin mixtures, screen readers, and high zoom/contrast.

## 8. Dependency Order

UI work is released in the following order. Discovery and prototypes may occur earlier, but production implementation may not bypass entry dependencies.

| Order | Roadmap gate | UI migration outcome |
| --- | --- | --- |
| 0 | Phase 0 complete | Approved route/state designs, responsive prototypes, design-token/accessibility direction, test matrices, migration/rollback plans; no runtime UI change |
| 1 | Phase 1 — Curriculum | Read-only consumer Curriculum foundation and permission-scoped Curriculum Operations; legacy Subject/Topic UI remains available |
| 2 | Phase 2 — Progress | Student Progress and counselor Progress view; Curriculum Explorer becomes a useful student learning surface |
| 3 | Phase 3 — Planning/Reality/Task | Target Counselor Planning, Student Plan/Today, Daily Reality, Task Result, Plan history, persistent student workspace; verified cutover from direct counselor Task authoring |
| 4 | Phase 4 — Practice | Practice & Exams chooser with Practice and labelled legacy assessment history; generic new AssessmentAttempt entry retires |
| 5 | Phase 5 — Question Bank | Admin Question governance and eligible governed Practice consumption |
| 6 | Phase 6 — External/Internal Exams | External Report and Internal Exam experiences as separate workflows; complete three-way chooser |
| 7 | Phase 7 — Analytics | Source-preserving Student/Counselor reports, explainable summaries, freshness, and drill-down |
| A | Supporting Lane A after Phase 3 | Messages/Inbox, Tickets, Suggestions, acquisition, and private notes, subject to independent policy gates |

Supporting Lane A may proceed after Phase 3 but cannot consume contracts or release UI that implies later educational domains are complete. Admin modules follow the domain they govern rather than waiting for one monolithic Admin launch.

## 9. Implementation Priority

Priority is subordinate to dependency order. A high-priority blocked page is not permission to begin it early.

| Priority | Work | Reason and exit boundary |
| --- | --- | --- |
| **P0 — Preserve and prepare** | Protect Task/Study Session recovery, auth/settings, legacy evidence visibility, RTL/focus/mobile foundations; approve route/state/token/accessibility plans | Prevent regression and make later cutovers measurable; documentation/prototype work only until Phase 0 exits |
| **P1 — Curriculum consumption/governance** | Curriculum foundations, exact-label/version UI, Admin Curriculum Operations, legacy mapping states | Every later educational write requires canonical version/node context |
| **P2 — Progress** | Student Progress and counselor read view | Required before Planning per mandatory critical path; never infer mastery |
| **P3 — Core product loop** | Today, Plan, Reality, versioned Counselor Planning, Task evolution, Task Result, student workspace | Replaces the largest M19 architectural conflict and completes Plan -> Execute -> report reality |
| **P4 — Practice** | Separate Practice capture/history and legacy assessment compatibility | Begins assessment separation without waiting for Question Bank content |
| **P5 — Governed content** | Question Bank Admin and moderated curriculum tags/rights/versioning | Required before Internal Exam construction |
| **P6 — Exams** | External Report and Internal Exam delivery/evaluation UI | Completes assessment separation after all security/policy gates |
| **P7 — Trustworthy reporting** | Source-labelled timelines, comparisons, accessible analytics | Depends on authoritative source domains; never becomes a write owner |
| **Parallel after P3** | Communication, acquisition, private notes | Independent supporting lane with strict lifecycle/privacy separation |

## 10. Pages Blocked by Backend or Domain Dependencies

| Target page/workflow | Current closest surface | Blocking backend/domain dependency | Blocking decision/policy | Earliest roadmap release |
| --- | --- | --- | --- | --- |
| Curriculum Explorer, published read | `SubjectTopicsPage` | Published Curriculum Versions/Nodes, version-aware reads, legacy mapping states | Curriculum import/mapping/cutover policy | Phase 1 |
| Curriculum Admin workspace | None | Imports, source records/issues, mappings, audit, immutable publication | ADR-034 governance and Curriculum import/publication policy | Phase 1 |
| Student Progress | None | Progress state/events/evidence links and relationship-scoped reads | ADR-035 authority/evidence/mastery/cross-version policy | Phase 2 |
| Counselor Progress tab | None | Same as Student Progress plus relationship authorization | ADR-035 | Phase 2 |
| Student Today | Placeholder Dashboard + `TodayPlanningPage` | Published Plan/Tasks, Task Results, recovery aggregation; later exam/report sources | Planning policy; exam/report policies for later cards | Phase 3 core, enriched later |
| Student Plan/history | Weekly Planning | Plan Versions/Items, materialized Tasks, immutable history and compatibility reads | Planning lock/concurrency/reassignment policy | Phase 3 |
| Personal canonical Task | Personal Task form | Canonical Task fields, exact curriculum pair, ownership rules | Task-status/cutover policy | Phase 3 |
| Task Result | Direct Done/Skip | Task Result aggregate/revisions and correction authorization | Task status authority and skip-reason policy | Phase 3 |
| Daily Reality editor | None | Schedule/version/block persistence and counselor read-only API | Category, recurrence, overlap, exception, retention/privacy rules | Phase 3 |
| Counselor Plan workspace | Single/batch Task forms | Drafts, versions, lineages, atomic materialization, diff/validation APIs | Lock boundary, concurrency, reassignment | Phase 3 |
| Counselor Overview | Placeholder Dashboard | Planning/Task Result queue queries and source-specific partial states | Queue definitions; later communication/report policies | Phase 3 core, enriched later |
| Practice | Generic AssessmentAttempt form | Practice aggregate/revisions/targets and optional provenance | ADR-040 legacy classification/cutover behavior | Phase 4 |
| Question Bank Admin | None | Question/version/options/rights/tags/moderation and protected content APIs | Media storage and operational rights-review policy | Phase 5 |
| External Report | Generic AssessmentAttempt form | Provider/report/revision/section/review storage and APIs | ADR-042; secure evidence storage for uploads | Phase 6 |
| Internal Exam discovery/attempt/results | None | Exam/Question versions, eligibility, attempt, answer, evaluation/result state machines | Timing, retake, accommodation, appeal, scoring, review, release, proctoring/offline policy | Phase 6 |
| Messages/Inbox | None | Separate Chat/Ticket/Suggestion models and authorization | Attachment, edit/delete, moderation, notification, retention policies | Supporting Lane A after Phase 3 |
| Counselor acquisition | None | Invitation/request/introduction/selection lifecycle | Human-review conditions and relationship policy | Supporting Lane A after Phase 3 |
| Private Notes | None | Note/version/access-audit storage and restricted APIs | Access, reassignment, retention/export/deletion policy | Supporting Lane A after Phase 3 |
| Student/Counselor reports | Placeholder Reports | Source-preserving projections and freshness metadata | Calculation version, freshness, retention, access, partial-data policy | Phase 7 |

## Migration Acceptance Checklist

A route or component classification may be considered completed only when the applicable items below are evidenced:

- target domain lifecycle and authorization are enforced by the backend;
- API behavior, idempotency, conflict handling, and compatibility are approved;
- historical M19 records remain readable with source and legacy context;
- no curriculum identity, mastery, plan publication, learning quality, provider, question response, or exam history was invented;
- empty, loading, stale, partial, offline, error, unauthorized, correction, invalidation, and recovery states are designed and tested;
- Persian/RTL content, exact curriculum labels, keyboard, screen reader, focus, zoom, contrast, reduced motion, and mobile alternatives meet acceptance criteria;
- authoritative actions do not show success before server confirmation;
- telemetry/support/reconciliation can distinguish target and legacy workflows without exposing sensitive data;
- rollback behavior preserves target-era writes and does not reactivate incompatible legacy writes silently;
- product/domain owners approve the workflow against the relevant roadmap phase exit criteria.

## End State

The completed migration retains the strongest M19 foundations—role separation, authentication/settings, Study Session recovery, Task/session separation, source labels, evidence-aware movement locks, localized states, RTL, focus, dark mode, and responsive navigation—while retiring transitional product concepts from new work.

Students receive a recovery-first Today experience, immutable counselor Plan visibility, personal Tasks, independent execution/results, canonical Progress, separate Practice/External/Internal assessment paths, and purposeful Communication. Counselors receive persistent student context, versioned paper-speed Planning, Reality context, source-preserving evidence, structured Communication, and confidential notes. Authorized administrators receive only the governed workspaces required by their capabilities.

Legacy StudySubject/Topic, StudyPlan, DailyTask state, StudySession, and AssessmentAttempt history remains resolvable throughout and after UI cutover. Target UX is complete only when that continuity is explicit, tested, and reversible.
