# Konkourix Read-Only UI Audit

**Status:** HISTORICAL IMPLEMENTATION AUDIT SNAPSHOT; documentation only
**Audit date:** 2026-09-17
**Implementation baseline:** M19 (`76bc4d7`) plus the current working tree
**Compared against at the time:** [UX_ARCHITECTURE.md](UX_ARCHITECTURE.md) and [PRODUCT_VISION.md](PRODUCT_VISION.md)

This report preserves a 2026-09-17 static audit and is not current implementation authority. [PROJECT_STATE.md](PROJECT_STATE.md) records current repository state; [PRODUCT_MAP.md](PRODUCT_MAP.md), [ROADMAP.md](ROADMAP.md), and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) govern future behavior, sequence, and visuals. The audit did not modify or execute either application.

## Classification

| Classification | Meaning |
| --- | --- |
| **Keep** | Correct domain/interaction foundation that can remain with limited polish |
| **Modify** | Useful implementation exists, but information architecture, behavior, semantics, or styling must evolve |
| **Replace** | Current surface embodies a transitional or conflicting model; preserve required data/history but replace the experience |
| **New requirement** | Required by target UX but no implemented surface exists |

A classification applies to the user experience, not permission to delete underlying code or data. In particular, replacing legacy subject/topic or assessment UI must preserve historical access as required by the architecture.

## Executive Summary

| Area | Current assessment | Primary classification |
| --- | --- | --- |
| Student routes | Real Planning, Study, Assessment, Settings; placeholder Dashboard/Reports | **Modify** |
| Counselor routes | Real student list/detail/task tools; placeholder Dashboard/Planning/Reports | **Modify** |
| Dashboards | Visually structured but intentionally data-free placeholders | **Replace** |
| Planning | Good M19 Task/Study Session separation; no versioned counselor plans | **Replace** at aggregate level, **Keep/Modify** execution patterns |
| Curriculum | Student-created subjects/topics conflict with canonical read-only curriculum | **Replace** |
| Assessment | Generic completed-attempt entry conflicts with three target domains | **Replace**, retain legacy history |
| Components | Small semantic foundation duplicated across both apps | **Modify** |
| Design system | RTL, focus, dark mode, reduced motion, 44px controls exist; tokens diverge | **Modify** |
| Responsive behavior | Functional breakpoints, safe-area bottom nav, and non-drag weekly movement exist | **Keep/Modify** |
| Target capabilities | Progress, Daily Reality, published plans, Practice, exams, communication, admin workflows absent | **New requirement** |

The strongest reusable implementation is the separation between a Task and its Study Sessions. The largest mismatch is the current user-owned subject/topic and direct counselor-task workflow, which cannot become the target Curriculum and versioned Plan model through cosmetic changes alone.

## 1. Student Web Routes

Source: `apps/student-web/src/App.tsx` and `apps/student-web/src/routing/useBrowserRouter.ts`.

### Implemented Route Inventory

| Route | Current page/behavior | Classification | Target disposition |
| --- | --- | --- | --- |
| `/login` | Persian RTL login with separate student branding, safe auth error, username/password autocomplete | **Keep** | Retain the role-specific entry; align visual tokens, add full accessible-authentication review, and preserve recovery states |
| `/` | Placeholder dashboard with empty summary cards and disabled actions | **Replace** | Become target `Today`: active session/attempt recovery, next action, today timeline, follow-up, and recent evidence |
| `/planning` | Real daily Task list, personal Task form, filters, status changes, rescheduling, live Study Session recovery/start/finish/cancel, session history/feedback | **Modify** | Reframe as Today/Plan execution surface; keep session recovery and explicit Task provenance while replacing checkbox-like result actions with Task Result workflow |
| `/planning/weekly` | Real week grid, workload summary, personal Task movement by drag or explicit destination buttons, execution-aware locks | **Modify** | Keep week/list patterns and non-drag alternative; add published Plan version/source, reality context, history, and target navigation |
| `/study` | Student creates, renames, archives, and restores personal `StudySubject`/`Topic` data | **Replace** | Read-only Canonical Curriculum Explorer with Progress overlay; retain legacy data in a clearly labelled historical compatibility surface |
| `/assessments` | Generic completed `AssessmentAttempt` form/history with Task, subject/topic, timestamps, counts, invalidation | **Replace** | Become `Practice & Exams` with distinct Practice, External Report, Internal Exam, and legacy-assessment histories; do not reclassify old attempts automatically |
| `/reports` | Placeholder | **Replace** | Move target reporting under Progress/learning timeline and later Analytics; do not keep a generic empty top-level report page |
| `/settings` | Real student profile, theme, password, current/all-session logout | **Keep** | Retain under `More`; modify to target shell/tokens and expanded preference/privacy needs when approved |
| Unknown path | Localized not-found state with return action | **Keep** | Retain within the target router and shell |

### Student Route Architecture Findings

- **Modify:** Routing is a custom exact-path browser-history hook. It correctly supports `popstate`, push/replace, and scroll reset, but target nested workspaces, route state, deep links, protected subroutes, and exam recovery need a more explicit route model.
- **Modify:** Desktop and mobile use the same six-item navigation array. Target mobile navigation has five primary destinations and moves settings/reality/counselor/profile to `More`.
- **Replace:** `Dashboard`, `Study`, `Assessments`, and `Reports` labels encode the M19 shape, not target `Today`, `Plan`, `Progress`, `Practice & Exams`, and `Messages` information architecture.
- **New requirement:** Routes/surfaces for Progress, Daily Reality Schedule, Messages, Tickets, Suggestions, counselor relationship, Plan history, and distinct assessment domains do not exist.
- **Keep:** Role separation is explicit: Student Web does not expose Counselor navigation or student-switching controls.

## 2. Counselor Web Routes

Source: `apps/counselor-web/src/App.tsx` and `apps/counselor-web/src/routing/useBrowserRouter.ts`.

### Implemented Route Inventory

| Route | Current page/behavior | Classification | Target disposition |
| --- | --- | --- | --- |
| `/login` | Persian RTL counselor login with distinct branding and role-aware copy | **Keep** | Retain; align shared tokens and accessible-authentication behavior |
| `/` | Placeholder counselor dashboard with empty summary cards and disabled actions | **Replace** | Become target Overview with attention queue, planning queue, unread communication, and recent evidence |
| `/students` | Real paginated assigned-student cards with status, education level, school, and detail navigation | **Modify** | Keep authorized list foundation; add search/filter/attention context and target student workspace entry |
| `/students/:uuid` | Real student profile followed by weekly Task view, Task list, batch Task form, and single Task form in one long page | **Replace** | Become persistent student workspace with Overview, Reality, Plans, Execution, Progress, Assessments, Communication, and protected Private Notes tabs |
| `/planning` | Placeholder | **Replace** | Become counselor Draft/Published/Revision queue and paper-speed planning workspace |
| `/reports` | Placeholder | **Replace** | Become source-preserving evidence/reporting views after Analytics phase; avoid a generic report shell before data exists |
| `/settings` | Real counselor profile, theme, password, and session controls | **Keep** | Retain under `More`; align design system and future privacy/security needs |
| Unknown path | Localized not-found state | **Keep** | Retain within target route architecture |

### Counselor Route Architecture Findings

- **Keep:** Detail routing rejects arbitrary IDs and only recognizes UUID-shaped student routes before the API enforces actual authorization.
- **Modify:** The same custom route hook limitations identified in Student Web apply here; student-workspace tabs, planning versions, inbox routes, and admin-like review contexts require explicit nested routing.
- **Replace:** The `StudentDetailPage` stacks all current capabilities linearly. It lacks persistent student context beyond the page header and cannot scale to the target multi-domain workspace.
- **New requirement:** Inbox, Curriculum Explorer, Suggestions, private notes, Plan drafts/publications, Progress, Practice/Exam evidence, and counselor-request/introduction routes do not exist.
- **Keep:** Student list/detail loading, empty, unauthorized/not-found, pagination, and retry states are useful foundations.

## 3. Existing Pages

### Student Pages

| Page | Evidence and current strengths | Classification | Required change |
| --- | --- | --- | --- |
| `DashboardPage` | Greeting, summary grid, two dashboard regions, explicit placeholders | **Replace** | Use real Today priority ordering; remove milestone/developer copy and disabled fake actions |
| `TodayPlanningPage` | Mature M19 workflow: filtering, pagination, personal Task creation, Task source labels, guarded rescheduling, active-session recovery, switch/cancel consequences, explicit Study/Task separation | **Modify** | Preserve execution/recovery patterns; add published-plan context and canonical selection; replace status buttons with Task Result; remove inline legacy-subject creation |
| `WeeklyPlanningPage` | Saturday–Friday week, workload summary, optimistic movement rollback, drag plus accessible click destination, counselor/execution locks | **Modify** | Recast as Plan view; show Plan version and sources; keep personal movement only; add list alternative and Daily Reality overlay where applicable |
| `SubjectTopicsPage` | Functional two-panel subject/topic management with archive/restore, rename, loading/error/empty states | **Replace** | Canonical curriculum is read-only for students; provide Explorer/Progress and separately preserve legacy labels/history |
| `AssessmentAttemptsPage` | Completed-attempt facts, derived total/duration display, invalidation, clear no-score promise | **Replace** | Preserve as `Legacy assessment history`; create separate Practice/External/Internal experiences rather than extending this form |
| `SettingsPage` | Profile, light/dark, password validation, current/all-session controls, loading/error/success | **Keep** | Move under More; replace native confirm; add consistent field/state components and accessibility review |
| `LoginPage` | Branded RTL split layout, explicit student copy, labelled inputs, error state | **Keep** | Align blue-based identity and shared auth design; add recovery/help only when approved |
| `PlaceholderPage` | Consistent empty-state wrapper | **Modify** | Keep only for controlled development; target navigation must not expose unfinished destinations |

### Counselor Pages and Student Workspace Modules

| Page/module | Evidence and current strengths | Classification | Required change |
| --- | --- | --- | --- |
| `DashboardPage` | Structured placeholder matching current shell | **Replace** | Implement target attention/planning/communication/evidence dashboard; remove milestone copy |
| `StudentsPage` | Paginated authorized list, localized states, student status/facts | **Modify** | Add target filtering/search/context and route into persistent workspace |
| `StudentDetailPage` | Fetches authorized student and composes real modules | **Replace** | Replace long vertical composition with tabbed/contextual student workspace; retain profile facts as Overview content |
| `StudentWeeklyPlanning` | Read-only week distribution with workload totals and source/status labels | **Modify** | Use published Plan Versions plus Daily Reality overlay; retain current legacy Task view as compatibility history |
| `StudentTaskList` | Shows source, execution minutes/session count, active session, assessment presence, lock reason, guarded counselor rescheduling | **Modify** | Preserve source/evidence visibility; move into Execution/legacy Tasks and replace direct rescheduling with Plan revision semantics for target counselor plans |
| `StudentTaskForm` | Real single counselor Task creation with student-owned subject/topic selection | **Replace** | Target counselor work is authored inside Draft Plan Items and published atomically; direct legacy Task creation remains compatibility-only until cutover |
| `StudentBatchTaskForm` | Efficient multi-row creation, planned minutes/tests, up to 50 rows | **Replace** | Reuse paper-speed multi-entry interaction ideas inside a versioned Plan draft; do not retain direct batch publication as independent Tasks |
| `SettingsPage` | Profile/security/theme workflow equivalent to Student Web | **Keep** | Align shared system and move under More |
| `LoginPage` | Distinct counselor copy/branding | **Keep** | Preserve role clarity while aligning brand system |
| `PlaceholderPage` | Shared placeholder behavior | **Modify** | Do not expose unfinished Planning/Reports destinations in target releases |

## 4. Components

### Shared-Looking Components Currently Duplicated

`Button`, `Card`, `ContentState`, `NavIcon`, `AppShell`, routing hooks, auth structures, and theme hooks exist separately in both applications with near-identical implementations.

| Component/pattern | Classification | Audit finding and target action |
| --- | --- | --- |
| `Button` | **Keep** | Semantic native button, variants, disabled state, and 44px minimum are sound. Move toward shared tokens/components and add consistent busy/icon/size/destructive-confirmation patterns without hiding button text. |
| `Card` | **Modify** | Useful surface primitive, but always renders a `<section>` and optional `<h2>`, which may not match every document hierarchy. Make semantics/heading level contextual in the future system. |
| `ContentState` | **Modify** | Strong localized loading/empty/error base with roles and actions. Extend to stale, partial, offline/reconnecting, skeleton, and freshness states; avoid one 220px centered treatment for every context. |
| `NavIcon` | **Modify** | Simple code-native SVG paths and hidden decoration are appropriate. Expand semantic icon coverage and shared ownership; keep labels visible. |
| `AppShell` | **Modify** | RTL sidebar, sticky mobile header, bottom nav, user summary, theme, and main landmark are reusable. Add skip link, target nav, `More`, persistent student/version context, breadcrumbs where needed, and safer responsive context handling. |
| `useBrowserRouter` | **Modify** | Minimal history support works for current routes. Target nested/deep/recovery workflows need explicit route configuration, parameters, state, focus/page-title handling, and navigation guards. |
| `TaskExecutionPanel` | **Keep** | Correctly keeps Study Sessions separate from Task state, supports history/recovery/feedback, and labels focus versus study quality. Modify visual density, component reuse, and target evidence integration. |
| Weekly movement pattern | **Keep** | Drag is supplemented by explicit task selection and destination buttons, and failed optimistic movement rolls back. Reuse for eligible personal Tasks and draft planning, not published counselor content. |
| Student/Counselor status badges | **Modify** | Consistent shape and text exist, but status semantics use page-specific CSS/hard-coded colors. Move to domain/state tokens and never rely on color alone. |
| Native `window.confirm` | **Replace** | Used for topic archive, assessment invalidation, and all-session logout. Replace with accessible, consequence-specific confirmation surfaces that preserve focus and pending state. |

### New Component Requirements

- **New requirement:** Curriculum Tree/List, breadcrumb, node picker, version badge, deprecated/retired state, and Progress overlay.
- **New requirement:** Plan workspace, schedule grid plus list alternative, Reality layer, Plan Item editor, version diff, publication review, and immutable history.
- **New requirement:** Task Result control with Completed/Incomplete/Skipped and labelled five-level learning quality.
- **New requirement:** Practice form/history, External Report evidence/status, and Internal Exam delivery/navigation/result components.
- **New requirement:** Chat, Ticket, Suggestion, unified inbox, and private-note protected surfaces.
- **New requirement:** Admin moderation checklist, attribution/rights panel, import ambiguity queue, audit timeline, and publish confirmation.
- **New requirement:** Accessible dialog/sheet, toast/live feedback policy, stale/partial/offline state, and source/freshness disclosure components.

## 5. Current Navigation

### Student Navigation

Current desktop sidebar and mobile bottom bar contain:

```text
Dashboard | Planning | Study/Subjects | Assessments | Reports | Settings
```

| Finding | Classification | Comparison with target UX |
| --- | --- | --- |
| Persistent labelled desktop sidebar | **Keep** | Matches the target role shell pattern and avoids icon-only navigation |
| Fixed mobile bottom navigation with safe-area padding | **Keep** | Correct mobile foundation |
| Six equally weighted mobile destinations | **Replace** | Target has five: Today, Plan, Progress, Practice & Exams, Messages; More holds settings/reality/profile |
| Dashboard as generic home | **Replace** | Target landing destination is Today and prioritizes recovery/next action |
| Study/Subjects destination | **Replace** | Becomes read-only Curriculum/Progress, not student taxonomy administration |
| Assessments destination | **Replace** | Becomes a container with clearly separated Practice, External, Internal, and legacy histories |
| Reports primary destination | **Replace** | Target reporting is contextual under Progress/Analytics rather than an empty generic page |
| Settings primary destination | **Modify** | Move to More while retaining functionality |
| Header page title/description and theme action | **Modify** | Keep orientation; add version/student/context information and avoid hiding necessary context on mobile |
| No skip-to-content link | **New requirement** | Add keyboard bypass navigation before the sidebar/header |
| No Messages destination | **New requirement** | Add Chat/Ticket/Suggestion hub only when implemented |

### Counselor Navigation

Current desktop sidebar and mobile bottom bar contain:

```text
Dashboard | Students | Planning | Reports | Settings
```

| Finding | Classification | Comparison with target UX |
| --- | --- | --- |
| Five labelled mobile destinations | **Keep** | Correct capacity and labelled-icon pattern |
| Dashboard | **Modify** | Rename/rebuild as Overview with real queues |
| Students | **Keep** | Remains a primary target destination |
| Planning | **Replace** | Placeholder must become versioned draft/publication workspace |
| Reports | **Replace** | Target primary destination is Inbox; reports live contextually and after Analytics |
| Settings | **Modify** | Move to More; More also hosts Curriculum and Suggestions |
| Student detail route highlighted under Students | **Keep** | Correct high-level selection state; add persistent student context and tabs |
| No Inbox or More | **New requirement** | Required by target counselor IA |
| No breadcrumb/context trail | **New requirement** | Needed for student workspace, Plan Version, Curriculum, and evidence drill-down |

### Admin Navigation

- **New requirement:** No Admin frontend or admin route architecture exists.
- Target administration must be permission-scoped workspaces for Curriculum, Question Bank, Internal Exams, Communication Operations, Counselor Operations, and Security/Audit—not one unrestricted panel.

## 6. Current Dashboards

### Student Dashboard

The root page renders a greeting, three `—` summary cards, an empty Today region, and three disabled quick actions. Copy explicitly says future milestones will connect data.

**Classification: Replace.**

Reasons:

- It does not surface an active Study Session even though session recovery exists on `/planning`.
- It does not show the next Task, today timeline, follow-up, messages, or recent evidence.
- Disabled fake actions expose unfinished capability rather than hiding it.
- Weekly progress is promised before the target Progress/Analytics calculation exists.
- The layout shape—greeting/summary/content regions—can inform the replacement, but the information priority and data semantics must change.

### Counselor Dashboard

The root page mirrors the Student placeholder: three `—` cards, an empty activity card, and disabled actions.

**Classification: Replace.**

The target Overview needs explainable attention and planning queues, unread communication, and recent source-labelled evidence. It must not infer that “no loaded data” means no student needs attention.

### Dashboard New Requirements

- **New requirement:** Active Study Session or Internal Exam recovery takes priority on Student Today.
- **New requirement:** Next published counselor item and personal Task follow-up.
- **New requirement:** Counselor queues distinguish draft, publish, stale/missing context, evidence review, and communication.
- **New requirement:** Every summary links to source records and discloses stale/partial/legacy data.
- **New requirement:** No ranking, streak pressure, AI diagnosis, or unapproved risk labels.

## 7. Forms

### Current Form Quality

**Keep:** Most inputs use visible labels, native controls, `required`/length/number limits, disabled/busy states, localized server-safe errors, and success feedback. Password and login fields have appropriate autocomplete. Forms generally preserve controlled values after ordinary errors.

**Modify:** Error messages are usually standalone `role="alert"` paragraphs and are not consistently connected to individual fields with `aria-describedby`/invalid state. Long forms lack an error summary/focus strategy. Native browser confirmation is used for high-impact actions. Unsaved navigation, duplicate submission semantics, and dynamic-row focus behavior are not consistently expressed.

### Student Forms

| Form | Classification | Audit disposition |
| --- | --- | --- |
| Login | **Keep** | Retain labelled, role-specific authentication; complete accessibility/recovery review |
| Personal Task create | **Modify** | Retain low-friction title/workload/note idea; require canonical selection under target policy and remove inline user-created Subject |
| Inline Subject create | **Replace** | Conflicts directly with controlled Canonical Curriculum |
| Personal Task reschedule | **Keep** | Retain for eligible personal Tasks with evidence locks and explicit target state |
| `Done`/`Skip` Task actions | **Replace** | Use Task Result: Completed/Incomplete/Skipped plus required five-level quality for Completed/Incomplete |
| Study Session start/finish/cancel | **Keep** | Strong separation and consequence messaging; retain server-authoritative recovery |
| Study Session focus/quality feedback | **Keep** | Correctly session-scoped and optional; ensure labels remain distinct from Task Result/mastery |
| Subject create/topic create/rename/archive | **Replace** | Remove from target student authoring; provide canonical read/Progress and legacy history |
| Generic AssessmentAttempt create | **Replace** | Separate Practice, External Report, and Internal Exam; keep old records as legacy history |
| Assessment invalidation | **Modify** | Preserve legacy invalidation, replacing native confirm with audited consequence-specific interaction |
| Student profile/theme/password/sessions | **Keep** | Retain under More; align shared form and confirmation behavior |

### Counselor Forms

| Form | Classification | Audit disposition |
| --- | --- | --- |
| Login | **Keep** | Retain distinct counselor entry |
| Single Task create | **Replace** | Target counselor intention is a Draft Plan Item published atomically, not an immediate standalone Task |
| Batch Task create | **Replace** | Reuse rapid multi-row entry concept inside Plan drafting; remove direct batch publication semantics |
| Direct counselor Task reschedule | **Replace** | Target movement happens in a new Plan Revision; historical/evidence-bearing intention remains immutable |
| Counselor profile/theme/password/sessions | **Keep** | Retain under More; use shared form/confirmation system |

### New Forms and Workflows

- **New requirement:** Daily Reality draft/block editor and publication review.
- **New requirement:** Counselor Plan draft, block/item editor, Curriculum picker, version diff, validation, and publication review.
- **New requirement:** Task Result with explicit outcome and labelled five-level learning quality.
- **New requirement:** Progress status/mastery/note workflow only after ADR-035 defines authority.
- **New requirement:** Practice, External Report, Internal Exam, Question moderation/rights/classification, Tickets, Suggestions, and private-note workflows.

## 8. Existing Design System

### Implemented Foundation

Both apps have local CSS variables, light/dark themes, shared-looking Button/Card/ContentState patterns, focus-visible outlines, reduced-motion handling, Persian/RTL document metadata, responsive shell layouts, and native system font fallbacks.

| Design-system area | Classification | Audit finding |
| --- | --- | --- |
| RTL foundation (`lang="fa"`, `dir="rtl"`, logical CSS properties) | **Keep** | Strong baseline; mixed LTR identifiers/times are handled selectively |
| Light/dark theme using `data-theme` and system preference | **Keep** | Separate local-storage keys by app are appropriate; full target contrast testing remains required |
| Focus-visible outline | **Keep** | Visible three-pixel focus base exists |
| Reduced-motion media query | **Keep** | Animation duration is reduced globally; future motion must continue to respect it |
| 44px minimum Button controls | **Keep** | Matches the target touch-control direction |
| Student green palette | **Replace** | Conflicts with approved blue-based Konkourix identity; green may remain a semantic success color rather than the primary brand |
| Counselor blue palette | **Modify** | Directionally aligned with target branding but not yet a shared approved token set |
| Gold `ک` brand mark and gradients | **Modify** | Provides identity but requires formal brand/icon/contrast review across roles and themes |
| Semantic tokens | **Modify** | Current tokens cover surface/text/accent/border/danger only; warning, success, info, selected, disabled, focus, overlays, charts, and domain/version states are partly hard-coded |
| Component implementation | **Modify** | Near-identical components/CSS are duplicated between apps; establish shared governance or synchronized package strategy before expansion |
| Typography | **Modify** | `Vazirmatn, IRANSans, system-ui` is declared but no font asset/import is evident; loading/fallback/metrics need a defined accessible strategy |
| Glass UI | **Keep** | Used sparingly only as mobile header blur; target correctly treats glass as optional |
| Card-heavy visual language | **Modify** | Comfortable and modern, but target workspaces need denser lists/grids/inspectors without turning every region into a large elevated Card |
| Icons | **Modify** | Code-native SVGs are efficient; expand into an accessible, consistent icon set without icon-only meaning |
| Form styling | **Modify** | Consistent local styling exists, but needs shared field, help, error, group, dialog, and validation patterns |
| Status colors | **Modify** | Pending/completed/skipped colors are hard-coded and domain-specific; centralize semantics and pair color with text/icons |
| Confirmation design | **Replace** | Browser `window.confirm` is not sufficient for target consequence, focus, audit, and responsive requirements |

### Product-Vision Fit

- **Keep:** Persian-first, calm, comfortable, role-specific language and separate student/counselor visual moods.
- **Modify:** Student green and task-list emphasis make the experience feel closer to a polished planner than the approved blue-based specialized Konkur ecosystem.
- **Replace:** Developer-facing phrases such as `نسخه پایه داشبورد`, milestone references, and disabled future-action placeholders should never be part of the target production experience.
- **New requirement:** Version/provenance, Curriculum, Progress, Practice/External/Internal, communication, and governance component semantics.

## 9. Responsive Behavior

### Implemented Behavior

| Behavior | Classification | Audit finding |
| --- | --- | --- |
| Minimum viewport width 320px | **Keep** | Explicit baseline exists |
| Desktop 264px sticky sidebar | **Keep** | Stable role navigation foundation |
| Switch to mobile shell at 900px | **Keep** | Sidebar hides, sticky header and fixed bottom navigation appear |
| Safe-area bottom padding/navigation | **Keep** | Uses `env(safe-area-inset-bottom)` and workspace padding |
| Mobile descriptions hidden in sticky header | **Modify** | Reduces clutter, but target context/version/student information must remain available |
| Student six-column mobile nav | **Replace** | Too many primary destinations and conflicts with target five-item navigation |
| Counselor five-column mobile nav | **Modify** | Capacity is right; destinations must change to Overview, Students, Planning, Inbox, More |
| Summary/dashboard grids collapse | **Keep** | Three/two columns become one at target breakpoints |
| Weekly seven-day grids | **Keep** | Seven desktop columns become two then one, avoiding forced tiny mobile columns |
| Drag-and-drop movement | **Keep** | Direct selection/destination-button alternative exists; drag is not the only method |
| Student subject workspace | **Keep** structurally | Two-panel layout collapses at 900px; interaction will be reused for canonical tree/detail, not student editing |
| Counselor student/task forms | **Modify** | Grids collapse correctly, but the very long Student Detail page needs target tabs/context and progressive disclosure |
| Auth split layout | **Keep** | Collapses to one column and shortens brand panel at 760px |
| Touch targets | **Keep** | Buttons and mobile-nav items meet the local 44px/58px targets |
| Orientation/zoom/high-contrast testing | **New requirement** | No explicit evidence from static source |
| Schedule list alternative | **New requirement** | Weekly cards reflow, but future time-based Plan/Reality grids require a true linear list/form alternative |
| Exam reconnect/offline responsive state | **New requirement** | No Internal Exam UI exists |

### Responsive Risks

- The current breakpoint-only approach is sufficient for small M19 pages but will not by itself manage a three-region counselor planning workspace or admin moderation inspectors.
- Fixed bottom navigation and sticky headers need keyboard/zoom testing to ensure they never obscure focused controls or validation.
- Native date/datetime controls mix RTL pages with LTR inputs; calendar, numeral, time-zone, and screen-reader behavior require real-device/browser validation.
- Student and Counselor page CSS is largely duplicated, increasing the risk of responsive fixes diverging.
- The current Student Detail page can become extremely long because weekly view, Task list, batch form, and single form are all rendered together.

## Target Gap Register

| Target capability | Current closest foundation | Classification |
| --- | --- | --- |
| Student Today dashboard | `/planning` execution recovery plus placeholder `/` | **Replace** root; **Keep/Modify** execution modules |
| Counselor Overview | Placeholder `/` plus Students data | **Replace** |
| Canonical Curriculum Explorer | Editable Subject/Topic workspace | **Replace** |
| Student Progress | No UI | **New requirement** |
| Versioned counselor planning | Direct single/batch Task creation and reschedule | **Replace** |
| Daily Reality Schedule | No UI | **New requirement** |
| Task Result/five-level quality | Direct completed/skipped Task status | **Replace** |
| Study Session execution | `TaskExecutionPanel` and active-session cards | **Keep** |
| Practice Activity | Generic AssessmentAttempt form | **New requirement**; do not reuse lifecycle |
| External Exam Reports | Generic AssessmentAttempt form | **New requirement** |
| Internal Online Exams | No UI | **New requirement** |
| Question Bank admin | No admin app/UI | **New requirement** |
| General Chat | No UI | **New requirement** |
| Tickets/Threads | No UI | **New requirement** |
| Suggestions | No UI | **New requirement** |
| Private Counselor Notes | No UI | **New requirement** |
| Source-preserving Analytics | Placeholder Reports | **New requirement** |
| Admin architecture | No app/UI | **New requirement** |

## Recommended Preservation Boundaries

The following current UX behaviors should be preserved during future replacement work:

- server-authoritative active Study Session recovery;
- explicit confirmation that finishing study does not complete a Task;
- Task source labels distinguishing counselor and personal intention;
- evidence-aware locks before Task movement;
- drag plus non-drag weekly movement;
- localized loading/empty/error/success and retry behavior;
- role-separated Student and Counselor applications;
- relationship-scoped student list/detail access;
- Persian/RTL semantics, light/dark mode, visible focus, reduced motion, and safe-area mobile navigation;
- legacy AssessmentAttempt facts and invalidation history, presented explicitly as legacy evidence after target assessment separation.

The following current UX concepts must not guide the target architecture:

- student-authored subject/topic taxonomy;
- immediate counselor Task creation as the final planning model;
- direct checkbox-like completion as the final Task Result;
- one generic Assessment form for all testing activity;
- generic placeholder Dashboard/Reports destinations;
- exposing unfinished navigation with disabled controls;
- treating a long stacked student page as a scalable counselor workspace;
- treating duplicated local CSS/components as a complete design system.

## Implementation Sequence Implication

Any UI replacement must follow the current [ROADMAP.md](ROADMAP.md) and [PRODUCT_MAP.md](PRODUCT_MAP.md). The historical critical path recorded by Roadmap V2 no longer governs sequencing. Existing surfaces remain compatibility UI until the corresponding approved milestone and its domain, API, authorization, state-recovery, accessibility, and acceptance criteria are complete.
