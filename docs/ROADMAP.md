# KonkourX Canonical Roadmap

**Status:** CANONICAL IMPLEMENTATION SEQUENCING
**Product Owner synchronization:** 2026-10-07

This document answers: **In what order should KonkourX be built?**

It is an implementation roadmap, not a product definition, implementation-state inventory, calendar commitment, or standing authorization to build everything it names. Every implementation still requires a separately approved milestone with explicit scope and acceptance criteria.

## Document Authority and Relationships

- [PRODUCT_MAP.md](PRODUCT_MAP.md) defines **what** KonkourX is intended to become and owns product behavior.
- This roadmap defines **when and in what dependency order** approved product areas should be implemented.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) defines visual and experience rules.
- [PROJECT_STATE.md](PROJECT_STATE.md) defines **what is actually implemented now**.
- Technical, API, security, architecture, and Curriculum documents define detail inside their domains without redefining product behavior or roadmap order.
- `cori.docx`, governed by [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md), remains the exclusive educational source of truth for Curriculum content.

When implementation evidence and an older technical direction differ, repository reality and `PROJECT_STATE.md` determine the current state, while `PRODUCT_MAP.md` determines intended product behavior. A Product Map specification being complete does not mean its implementation is complete.

## State Legend

- `DONE / STABILIZED`: implemented, validated, and represented as a reliable checkpoint in `PROJECT_STATE.md`.
- `CURRENT CHECKPOINT`: work already exists or is the one immediate milestone that must be reconciled before later implementation.
- `PLANNED`: approved core implementation direction, not yet authorized merely by appearing here.
- `FUTURE`: approved extensibility or deferred capability, intentionally outside current core sequencing.
- `BLOCKED`: cannot proceed until a named dependency or Product Owner Decision Gate is resolved.

No state is a date promise. Phases may be split into smaller milestones, but their dependency boundaries must be preserved.

## Verified Repository Baseline

### DONE / STABILIZED — Technical and Product Foundations

The following are established implementation facts, not future roadmap work:

- pnpm monorepo with independent Student Web and Counselor Web applications, one Fastify API, PostgreSQL, and Prisma;
- direct Student registration, password authentication, access/refresh session handling, rotation/revocation foundations, logout, password change, `/auth/me`, server-controlled Roles/status, and backend role/ownership checks;
- independent authenticated Student and Counselor application shells;
- Student planning, task provenance/lifecycle, weekly movement foundations, Counselor-created tasks, StudySession execution/recovery, and completed AssessmentAttempt recording;
- assigned-Student Counselor authorization and server-enforced relationship checks;
- file-backed, read-only Canonical Curriculum runtime projected from the protected source transcription;
- retirement of rejected Curriculum governance/Knowledge persistence through forward migrations without rewriting applied history;
- multiple Curriculum targets per `DailyTask`, `NODE` / `PLACEMENT`, `EXACT` / `WHOLE`, overlap validation, immutable historical label/path snapshots, and item-level execution coverage;
- terminal `PARTIAL` execution with completed and remaining Curriculum items preserved and no automatic compensatory Task;
- exact optional same-day scheduling through paired 15-minute-aligned start/end values, including Counselor create/batch/update and Student personal scheduling compatibility;
- nullable `TaskContentType` with `STUDY | GENERAL` for explicit new writes while legacy/null compatibility remains;
- all 22 tracked migration directories applied in the documented local development state;
- established API, frontend, Prisma, migration, container, deployment, security, and recovery validation history recorded in `PROJECT_STATE.md`.

These foundations must be reused. They must not be re-planned as greenfield systems or silently replaced.

### CURRENT IMPLEMENTED STATE — Important Limits

The repository does **not** thereby contain the full Product Map. In particular, complete Admin, Business/Payments, School, Public Web/SEO/CMS, Question Bank, Practice, internal Exam delivery, full Communication/Tickets, Learning Content, or Classroom products are not implemented merely because their architecture is specified.

Current Curriculum runtime and scheduling contracts enable later work; they do not implement full progress, mastery, Question Bank, reporting, or the broader Counselor operational suite. The currently authorized Counselor Planning UX milestone implements only the shared planning workspace, non-mutating timeline with the approved Composer-prefill interval selection, and same-Student unified composer described below. `AssessmentAttempt` is a completed-result foundation, not the future Question Bank/Exam engine.

## Immediate Worktree Reality

### CURRENT CHECKPOINT — Uncommitted Product Work

The working tree intentionally contains unrelated uncommitted Student and Counselor UI work, including:

- shared KonkourX brand components and updated login presentation;
- Student and Counselor shell, header, right-side desktop navigation, mobile hamburger/right drawer, theme, and selected-navigation behavior;
- Student and Counselor dashboard presentation changes;
- Counselor Student-list presentation changes;
- shell-state helpers and focused tests;
- an operational Counselor `PlanningShellPage` shared by global and selected-Student routes, with a non-mutating timeline, the approved Composer-prefill interval selection, and a same-Student unified composer;
- Profile Center and Student-track UX that is technically implemented but still lacks Product Owner Visual PASS; and
- supporting CSS, tokens, Light/Dark, RTL, and responsive changes.

This work is neither discarded nor treated as accepted merely because it exists. The v1 Picker-to-Planning checkpoint is separately committed at `34a6af2e1932c1f171957a83f3d30023f5b07208`; its current Picker interaction is implemented compatibility behavior, not the final Product Owner-approved UX.

### CURRENT CHECKPOINT — Counselor Planning Workspace + Unified Task Composer

The Principal Architect explicitly authorized this focused milestone on 2026-10-10. Its implemented boundary is one shared workspace at `/planning` and `/students/:studentId/planning`, an hourly/optional-quarter-hour presentation of existing scheduling truth, separate VOLUMETRIC presentation, and one-or-many same-Student creation through the existing atomic Batch API. On 2026-10-12, the Product Owner explicitly authorized one corrective scope exception: click/touch/keyboard selection of a same-day, 15-minute-aligned TIMED interval may prefill and open the existing Composer. The timeline still performs no persistence itself, and this exception does not authorize drag/drop, resize, automatic movement, direct Task mutation, new scheduling policy, Student Today redesign, cross-Student assignment, new analytics, new persistence, or changes to authorization/lifecycle semantics. Technical completion does not imply Product Owner Visual PASS.

## Resolved Architecture Gate

### Recursive Subtree Persistence Architecture Decision

**State:** DONE / STABILIZED — **architecture documented; implementation not authorized**

The 2026-10-07 documentation gate selected a versioned additive persistence/resolution contract for recursive subtree selection that:

1. preserves the existing direct-child meaning of every historical `WHOLE` target;
2. represents a complete recursive selectable subtree even when descendants are lazy/paginated and not loaded client-side;
3. avoids naive expansion into hundreds of client-side `EXACT` targets;
4. addresses existing target-count limits explicitly;
5. snapshots saved Task meaning so future Curriculum additions do not enter old Tasks; and
6. keeps invalid navigation wrappers out of persisted Task targets.

The approved contract retains `EXACT`, freezes historical direct-child `WHOLE`, and adds internal `SUBTREE` for future writes. The server resolves terminal selectable nodes from the authoritative catalog and stores normalized intent plus immutable item snapshots. The existing 50-target limit remains a selector-root ceiling; a separate resolved-item bound requires implementation-time capacity evidence. [The governing specification](superpowers/specs/2026-10-07-planning-curriculum-interaction-design.md) defines normalization, wrapper expansion, legacy editing, cardinality, rollout, and atomicity.

This decision authorizes no product code, schema, migration, API, UI, test, package, generated-artifact, or database change. Future implementation requires an explicitly approved milestone and an additive `SUBTREE` enum migration; no historical backfill is allowed.

## Immediate Next Executable Milestone

### Picker-to-Planning Checkpoint Closeout

**State:** DONE / STABILIZED — committed at `34a6af2e1932c1f171957a83f3d30023f5b07208`

The current v1 integration connects canonical Curriculum selections to authorized Student and assigned-Student Counselor Task flows while preserving `EXACT`, direct-child `WHOLE`, snapshot-first history, track authority, and existing edit locks. It does not implement recursive selection, `SUBTREE`, the versioned v2 payload, or the later Browser/Picker split, and its Picker UX is not final.

### Browser / Picker Split

**State:** PLANNED — the next executable product milestone only after explicit authorization

Separate the browse-only `/curriculum` experience from the authorized `STUDY` Task Picker, then implement the approved tri-state recursive behavior through the versioned `SUBTREE` contract. This milestone must retain historical `WHOLE`, use server-authoritative terminal resolution and immutable snapshots, normalize wrappers to valid descendants, and complete tolerant-reader-first rollout and capacity validation.

## Approved Near-Term Product Sequence

| Step | State | Outcome |
|---|---|---|
| 0. Documentation Decision Gate | DONE / STABILIZED | Record the 2026-10-07 Product Owner interaction decisions without product implementation |
| 1. Recursive subtree architecture | DONE / STABILIZED | Versioned `SUBTREE` architecture selected without redefining historical `WHOLE`; implementation remains unauthorized |
| 2. Picker-to-Planning checkpoint closeout | DONE / STABILIZED | Current v1 integration committed at `34a6af2`; its Picker UX is not final and no recursive `SUBTREE` behavior was added |
| 3. Browser / Picker split | NEXT / PLANNED | Keep `/curriculum` browse-only and implement the authorized tri-state recursive Study Task Picker under an explicit milestone |
| 4. Curriculum navigation cleanup | PLANNED | Remove `/study` from primary navigation and keep one `مباحث درسی` destination while preserving legacy data/history |
| 5. Counselor Planning Workspace + Timeline Composer entry | CURRENT CHECKPOINT | Shared global/Student-context workspace and same-Student composer; display existing timed Tasks at exact 15-minute resolution, show untimed Tasks separately, and allow the explicitly authorized click/touch/keyboard TIMED interval selection to prefill the existing Composer; no drag/drop, resize, direct mutation, or move interaction |
| 6. Profile Center redesign | PLANNED | Preserve the approved information architecture and obtain Product Owner Visual PASS |
| 7. Account & Security expansion | PLANNED | Add verified email/phone management, verification/change, recovery/reset, and session/device management after Profile visual closeout |
| 8. Cross-Student Group Assignment | PLANNED | Create independent per-Student Task lifecycles through a bounded atomic command with per-Student Study-track validation |
| 9. Reports and remaining roadmap | PLANNED | Continue dependency-valid roadmap work without deleting broader future phases |
| 10. Assessment UX rewrite | PLANNED | Replace the legacy `/assessments` presentation in a dedicated milestone while preserving valid backend/history |

Each row is a separate milestone or Decision Gate. Listing it here does not authorize implementation or allow steps to be combined silently.

## Final High-Level Phase Sequence

| Phase | State | Implementation outcome |
| --- | --- | --- |
| 1. Foundation / Recovery / Canonicalization | DONE / STABILIZED | Preserve verified runtime, Curriculum, planning, scheduling, migration, and security foundations |
| 2. Visual / Shell Convergence | CURRENT CHECKPOINT | Stabilize the existing uncommitted Student/Counselor visual work |
| 3. Account / Access + Student Operational Core | PLANNED | Complete shared access primitives, then the real Student daily loop |
| 4. Counselor Workspace Core | CURRENT CHECKPOINT | The focused planning workspace/composer milestone is implemented over shared Student/Planning truth; the broader Counselor phase remains planned |
| 5. Admin / Business Foundation | PLANNED | Establish permission-driven operations and commercial configuration primitives |
| 6. Communication / Notifications / Tickets | PLANNED | Add shared private conversation, attention, and formal support engines |
| 7. Question Bank / Practice / Exam | PLANNED | Build the central Question source, then learning Practice, then formal Exam |
| 8. Payment / Commercial Activation | PLANNED | Connect Business configuration to verified purchasing and activation |
| 9. Public Website / Pricing / CMS | PLANNED | Launch the first-class acquisition, publishing, and real-pricing surface |
| 10. Lightweight Learning Content | PLANNED | Deliver shared practical resources before deep LMS behavior |
| 11. School / Organization | PLANNED | Add Organization scope over mature shared engines |
| 12. Classroom | PLANNED core / FUTURE expansion | Start external-first; defer internal video and rich classroom infrastructure |

This sequence covers Product Map Areas 0–6 without pretending that specification completion equals implementation completion.

## Phase 1 — Foundation / Recovery / Canonicalization

**State:** DONE / STABILIZED

This phase preserves the verified repository baseline listed above. Future milestones may extend it through additive, reviewed changes, but must not:

- rewrite applied migration history;
- restore rejected Curriculum governance, Knowledge, taxonomy, or content-production machinery;
- make PostgreSQL authoritative over Canonical Curriculum;
- destructively normalize heterogeneous Curriculum structure;
- collapse Planning, Study execution, and AssessmentAttempt into one lifecycle;
- fabricate exact times for legacy date-only Tasks;
- reinterpret `PARTIAL` or automatically create compensatory work.

Production runtime verification, CI/CD, live deployment, backup/restore rehearsal, and other operational gaps remain incremental readiness work rather than reasons to reclassify the implemented domain foundation as unbuilt.

## Phase 3 — Account / Access + Student Operational Core

**State:** PLANNED after the applicable near-term checkpoints above

Phase 3 is divided into dependency-ordered stages. A milestone may deliver one stage at a time.

### Stage 3A — Account and Effective Access Foundation

Reuse the implemented authentication/session baseline, then add only the shared primitives required by later domains:

1. verify and preserve direct Student-first registration and existing secure session behavior;
2. define the approved Counselor and School/Institute application intake boundary without granting privileged workspaces on submission;
3. introduce fine-grained Permissions and dynamic Role composition without replacing existing server-owned Role checks prematurely;
4. introduce the software-defined Entitlement catalog and canonical Effective Access evaluation:

   ```text
   Role
   + Plan Entitlements
   + Organization Entitlements
   + User Overrides
   + Approved Purchased Rights where applicable
   ```

5. establish the minimum Organization Membership and Organization-scope primitives needed by later School and B2B access, without building the School workspace;
6. support authorized Admin-account provisioning with no public Admin registration;
7. complete scoped recovery, session-revocation, suspension, attribution, and sensitive-access governance only after their Decision Gates are resolved;
8. enforce Identity, ownership, Role, Permission, Entitlement, and Organization scope on the backend, with authorization/IDOR tests.

Plan names are never authorization truth. Admin configuration packages existing capabilities but cannot create software behavior.

### Stage 3B — Student Daily Operational Loop

Build over the implemented `DailyTask`, Curriculum target, exact schedule, StudySession, and AssessmentAttempt foundations:

1. connect the action-first Student Dashboard to real current/next Task and Today Plan data;
2. redesign Today Planning with progressive disclosure while keeping core lifecycle semantics, preserve and polish Weekly Planning, and add the read-only 24×4 Daily Timeline with untimed Tasks shown separately;
3. complete reporting/closure behavior for `COMPLETED` / `PARTIAL` / `SKIPPED`, item-level remainder, Actual Time, one canonical Quality `/5` where defined, and optional Note, without rewriting historical intent;
4. expose trustworthy Task-derived Study history and separately sourced Free Study without double counting;
5. add concise daily/weekly Study summaries and planned-versus-actual evidence from real execution data;
6. add broader Student Analytics only after Planning, Study, and released assessment evidence are stable;
7. add lightweight Focus/Habits/Goals only after the core daily loop works and only through a separately scoped Student UX milestone;
8. integrate Communication and Learning entry points later through Phases 6 and 10 rather than building local substitutes.

The existing completed `AssessmentAttempt` foundation may be surfaced honestly where useful, but full Practice and internal Exam experiences wait for Phase 7.

**Exit checkpoint:** access contracts are backend-authoritative; Student daily action, planning, execution, closure, and Study history form a tested coherent loop; no fake analytics; current data and history are preserved; and `PROJECT_STATE.md` records exact implemented scope.

## Phase 4 — Counselor Workspace Core

**State:** PLANNED after the applicable Phase 3 access and Student-domain checkpoints

Sequence:

1. action-oriented Counselor Dashboard based on real assigned-Student work;
2. assigned/authorized Student list and persistent Student Workspace;
3. authorized Student-specific planning operations using the exact-time contract and the new tri-state recursive Study Task Picker only through its separately approved implementation milestone; the 24×4 Daily Timeline remains a read-only visualization;
4. future-Task create/edit/move behavior under an approved edit-state matrix, while executed history remains immutable;
5. execution reports, `PARTIAL` remainder, Study evidence, and available AssessmentAttempt/Exam evidence from shared source records;
6. real Student and caseload Analytics after source data exists, without opaque risk, mastery, or ranking scores;
7. contextual Messaging, Private Notes, Sessions, and Follow-ups through their shared Phase 6 domains;
8. Counselor Work Queue, Capacity, and human management evidence after operational actions exist.

Counselor UI must not create Counselor-specific copies of Tasks, Study, Curriculum, Questions, Exams, Messages, Tickets, or Student identity. Compensation remains an explicit Counselor-created future Task, never automatic.

**Exit checkpoint:** Counselor can understand and act on authorized Student work through shared truth; planning mutations are server-authorized; history is preserved; responsive/accessibility checks and Counselor tests pass.

## Phase 5 — Admin / Business Foundation

**State:** PLANNED after Stage 3A access primitives

Two related lanes may progress in controlled parallel only after Role, Permission, Entitlement, and Audit contracts are stable.

### Admin Operations Lane

1. permission-driven Admin shell and actionable Dashboard/Operations distinction;
2. User management and authorized recovery/session/suspension operations;
3. Counselor and School/Institute application review and management;
4. Admin-account creation and dynamic Role/Permission management;
5. limited meaningful Audit and governed Break-Glass workflows;
6. entry surfaces for Question moderation, Content management, Support/Tickets, and School oversight as their domains arrive.

### Business Configuration Lane

1. software-defined Entitlement catalog;
2. Product and Plan configuration over existing capabilities;
3. pricing, duration, trial, visibility, display metadata, limits, and Organization packaging;
4. Subscription and one-time Purchase boundaries sufficient for later commercial flows;
5. attributable User and Organization overrides;
6. public-pricing and domain-consumption contracts.

This phase does not process real Payments yet and does not build every future Admin analytic. Ordinary Admin remains Permission-scoped; Super Admin authority remains attributable; passwords remain unreadable; private Chat and Notes remain outside ordinary browsing.

**Exit checkpoint:** Admin and Business configuration are distinct but interoperable; Effective Access consumes real configuration; Audit remains limited; later moderation, Ticket, Payment, Public Website, and School milestones have stable control contracts.

## Phase 6 — Communication / Notifications / Tickets

**State:** PLANNED after Counselor relationship scope and Admin/Permission foundations

Sequence:

1. **Messaging core:** authorized Student ↔ assigned Counselor conversations, approved message types, canonical context references, finite retention, privacy, and backend participant checks;
2. **Notification core:** shared in-app domain-event delivery, read/unread state, real counts, actionable deep links, preferences where scoped, and no access grant through a link;
3. **Ticket core:** central categories/Queues, assignment, referral, escalation, formal Timeline, authorized Ticket communication, resolve/close/reopen, and domain references;
4. **Chat-to-Ticket referral:** explicit selected context only, with source Chat participation never implying Ticket access;
5. **Counselor referral access:** default `NO_ACCESS`; only authorized explicit Ticket-specific grants may provide `VIEW_ONLY` or `PARTICIPATE`;
6. integrate Work Queues, Admin/Support surfaces, Payment issues, and School Organization scope as those owning domains become available.

Ticket authorization and Queue primitives may be developed alongside late Notification work once Permission contracts are stable, but Chat-to-Ticket integration cannot be accepted before both source domains are stable.

Push, Email, SMS, Telegram, Voice Messaging, richer search, and AI assistance remain future unless separately scheduled.

**Exit checkpoint:** Messaging, Notification, and Ticket remain separate tested domains; retention and privacy rules are configured; deep links reauthorize; formal records survive ordinary Chat expiry as defined; no notification or analytic event silently creates a Ticket.

## Phase 7 — Central Question Bank / Practice / Exam

**State:** PLANNED after Curriculum, Effective Access, Admin moderation, and relevant Student foundations

### Stage 7A — Central Question Bank

Implement one canonical Question source first:

1. Question identity/content and approved core Question types;
2. Question ↔ Curriculum many-to-many links with optional non-exclusive Primary Link;
3. Draft, Submitted, Under Review, Needs Changes, Rejected, Approved, and Published lifecycle concepts;
4. human moderation and Permission-controlled approval/publication;
5. historical version/provenance integrity and published eligibility;
6. Entitlement-controlled consumption distinct from broad authoring/submission.

### Stage 7B — Practice

Build learning-oriented Practice over eligible published Questions:

1. shared Practice Session configuration;
2. immediate Correct/Wrong feedback, correct-answer reveal, and real available explanation;
3. `CORRECT` / `WRONG` / `UNANSWERED` outcomes;
4. referenced Wrong, Unanswered, Bookmark, and Review collections;
5. retry as new evidence and trustworthy history;
6. distinct Practice analytics without hidden Mastery.

### Stage 7C — Exam

Build formal assessment only after Question and Practice contracts are stable:

1. shared Exam Definition, audience, availability, duration, attempt, and release policies;
2. immutable Attempt snapshot and historical Question/version context;
3. minimal active Exam UX with Subject-list navigation, current Question/number, options, timer, Previous/Next, and Submit/End;
4. no active correctness, answer, explanation, hint, difficulty, Curriculum assistance, Analytics, or full Question-number grid;
5. controlled result/review release;
6. printable output from the same engine and Question Bank.

Student self-Exam remains Exam and requires applicable Entitlements. Existing `AssessmentAttempt` history must be migrated or integrated explicitly if a future milestone connects it; it must not be silently reinterpreted.

Adaptive/AI selection, advanced printing, A/B/C variants, answer sheets, peer ranking, and hidden proficiency systems remain future.

**Exit checkpoint:** one Question repository serves Practice and Exam; Practice and Exam evidence remain distinct; history and release rules are tested; School and future Teacher reuse require no duplicate engines.

## Phase 8 — Payment / Commercial Activation

**State:** PLANNED after Stage 3A Effective Access and Phase 5 Business configuration

Dependency chain:

```text
Entitlement catalog
→ Product/Plan packaging
→ Order/Purchase
→ Subscription or approved one-time right
→ provider adapter abstraction
→ first approved PSP adapter
→ provider request/redirect/callback
→ backend verification
→ authoritative Payment result
→ server-controlled activation
→ reconciliation
```

Then add approved Card-to-Card/manual review:

```text
WAITING_FOR_RECEIPT → UNDER_REVIEW → APPROVED or REJECTED
```

Required properties include duplicate-safe callbacks, amount/context verification, secret protection, attributable overrides, access-activation recovery, real historical snapshots, and Payment/Subscription/Purchase separation. Frontend success is never Payment truth. Ticket resolution and Notifications never activate access or mutate Payment state.

Paid capabilities may be developed behind controlled test/manual Entitlements before this phase, but real paid activation and public sale cannot launch until verified Payment and reconciliation paths are accepted.

**Exit checkpoint:** provider and manual flows are secure and idempotent; verified Payment and access activation can be reconciled; Payment history remains interpretable; security and failure-path tests pass.

## Phase 9 — Public Website / Pricing / CMS

**State:** PLANNED after stable brand, Student entry, Admin/CMS ownership, and Business configuration

Sequence:

1. public brand shell and responsive marketing navigation;
2. Home, Product, Planning, Counseling, Exam, Question Bank, Learning, and School/Institute explanation pages using honest availability language;
3. Student-first signup/login conversion, with Counselor and School/Institute collaboration as secondary application paths;
4. real Pricing consumed from Business/Product/Plan configuration rather than duplicated hardcoded truth;
5. Blog, Article, FAQ, About, Contact, policy/legal, collaboration, and SEO landing-page families;
6. Permission-driven CMS create/edit/review/publish behavior for ordinary public content;
7. crawlability, stable public links, metadata, sitemap/robots/redirect support, performance, accessibility, and Persian RTL quality;
8. public support entry that remains distinct from authenticated Ticket authority.

Campaign and richer public search remain extensible. A generic no-code site builder is not implied.

**Exit checkpoint:** the Website is a real acquisition/content surface, not one static page; pricing is sourced from Business truth; no private content is indexable; real product screenshots/evidence replace fabricated claims.

## Phase 10 — Lightweight Learning Content

**State:** PLANNED after Effective Access, Admin Content authority, Files/URL delivery, and applicable commercial configuration

Implement the lightweight shared layer first:

1. shared Content identity and practical Article, PDF, File, External Link, and Video Resource types;
2. zero, one, or multiple canonical Curriculum references where genuine;
3. Draft/Published/Archived lifecycle and Permission-driven publication;
4. Free, separately purchased, Plan, Organization, and override-based Effective Access;
5. secure File/URL delivery and Student Resource Library/detail surfaces;
6. Admin management plus Counselor and School reference/reuse without copied Content;
7. real Notifications and simple evidence only where implemented.

Course, Lesson sequencing, progress, completion, Continue Watching, internal hosting, streaming, protected playback, and recorded Course/Class behavior remain future and require later milestones.

**Exit checkpoint:** practical Content can be governed, accessed, and reused through one shared model; viewing never fabricates Curriculum Coverage, Mastery, or Course progress.

## Phase 11 — School / Organization

**State:** PLANNED after Stage 3A Organization foundations and sufficient maturity of the shared engines each School milestone consumes

Sequence:

1. Organization activation from the approved School/Institute application workflow;
2. Membership, Organization lifecycle, and Organization Roles/Permissions;
3. Primary Manager/Education Manager boundaries and Student/staff membership;
4. Classes, Grades, and Groups as Organization structures that do not redefine Curriculum;
5. Organization-scoped Counselor assignment and shared Student/Counselor work;
6. shared Question Bank, Practice, Online/Printable Exam, Learning Content, Messaging, Notifications, and Tickets as each dependency exists;
7. shared lightweight Classroom after Phase 12A exists, without blocking earlier School foundation;
8. source-derived Organization reporting and Entitlement/Permission-scoped PDF/export;
9. Business-configured seats, staff limits, features, and Organization Entitlements.

School adds scope, Membership, Roles, Permissions, and educational structures. It never creates School-specific Identity, Student, Counselor, Planning, Study, Curriculum, Question, Exam, Content, Message, Notification, Ticket, Classroom, or billing engines.

**Exit checkpoint:** tenant isolation and scoped authorization are tested; Membership history is preserved; Organization removal does not delete platform identity; shared-engine reuse is demonstrable; no cross-Organization leakage exists.

## Phase 12 — Classroom

### Stage 12A — Lightweight External-First Classroom

**State:** PLANNED after shared access, Notification, and relevant Organization/audience foundations

Implement one shared Classroom Event domain with title, host, date/time, authorized audience, external meeting URL, Join, event change/cancellation, shared Notifications, and optional calendar presentation. Student, Counselor/authorized host, and School contexts reuse the same event identity.

Audience, Join click, host identity, and event end do not prove Attendance. External-provider delivery does not turn the provider into the source of KonkourX event identity.

### Stage 12B — Internal/Richer Classroom and Video

**State:** FUTURE

Provider APIs, integrated/internal video, WebRTC, Attendance, recording, Classroom Chat, whiteboard, screen sharing, reactions, hand raise, polls, participant controls, internal streaming, class recordings, and Course/homework integration require separate product, technical, privacy, storage, retention, and operational milestones.

A future real recording may become shared Learning Content; it must not create a separate recording-content repository.

## Critical Dependency Graph

```text
Verified Foundation
→ Documentation Decision Gate
→ Recursive Subtree Persistence Architecture Decision
→ Picker-to-Planning Checkpoint Closeout
→ Browser / Picker Split
→ Account/Auth baseline
→ Roles/Permissions
→ Entitlements/Effective Access
→ Admin + Business + Organization-scoping foundations

Canonical Curriculum
├→ Planning/Execution/Study
├→ Question Bank → Practice → Exam
└→ Learning Content

Business Entitlements
→ controlled paid-feature access
→ Payment verification/activation
→ real Public Pricing and production commercialization

Counselor relationship scope
→ Messaging
→ Notifications
→ Chat-to-Ticket referral

Organization + Membership + scoped Roles
→ School Workspace

Notification core + audience/access
→ lightweight Classroom reminders and Join flow
```

The graph describes dependencies, not permission to start every downstream milestone.

## Cross-Cutting Engine Introduction

Cross-cutting capabilities are introduced only when their first real consumer needs them:

| Engine | Earliest dependency-safe phase | Rule |
| --- | --- | --- |
| Identity/Auth/Sessions | Existing foundation; extended in Phase 3 | Preserve server authority and secure recovery/revocation |
| Roles/Permissions | Phase 3A | Required before Admin, Ticket, School, moderation, and sensitive workflows |
| Entitlements/Effective Access | Phase 3A | Required before paid/Organization-gated domain behavior |
| Organization Membership | Phase 3A minimum; expanded in Phase 11 | Do not build full School early |
| Curriculum | Existing foundation | Reuse fixed source-faithful references; no mutation/governance expansion |
| Files/Storage abstraction | First approved Messaging/Learning/Admin file consumer | Add retention/security with the consuming milestone |
| Notifications | Phase 6 | Shared engine; domain events remain owned by source domains |
| Analytics | After each source domain has reliable evidence | Compose truth; never create a second write model or fake zero |
| Audit | Phase 5 minimum | Limited to meaningful/sensitive attributable actions, not every click |
| Payments | Phase 8 | Business owns transaction truth; backend verification required |
| Search | Per public/private domain after authorization and publication rules | No universal search before scope/access contracts |

## Roadmap Decision Gates

Only sequencing-blocking gates are tracked here. Detailed UI and implementation choices remain in their owning milestones.

| Decision Gate | Must be resolved | Blocks |
| --- | --- | --- |
| Exact Permission matrix and sensitive-action reason/Audit requirements | Before each Phase 3A/5/6/7/11 privileged workflow is accepted | Backend authorization and Admin/School/support release |
| Account suspension consequences | Before Phase 5 suspension UI/API | Safe suspension/reactivation behavior |
| OTP, MFA, and external identity-provider selection | Before any such method is scheduled | Only that authentication expansion; existing password core may proceed |
| Counselor/School application fields and review transitions | Before Phase 3A intake and Phase 5 review implementation | Application workflow acceptance |
| Task edit-state and historical-correction matrix | Before Phase 3B/4 functional planning mutation expands | Student/Counselor edit and controlled move acceptance outside the read-only timeline |
| Chat, attachment, Ticket, Notification, and Audit retention policies | Before the affected Phase 6/5 production release | Retention jobs, deletion/archive, and legal/operational acceptance |
| Exam scoring, attempt, result, answer-key, explanation, and review-release policies | Before Phase 7C Exam implementation is finalized | Exam result/review and historical contract |
| Initial PSP and adapter protocol | Before Phase 8 provider implementation | Online Payment launch |
| One-time purchased-right permanence and advanced Subscription transitions | Before selling affected Phase 8 Products | Correct activation/expiry history |
| Organization Membership, multi-Organization, Primary Manager, and School Role matrix | Before Phase 11 membership/management implementation | School authorization and isolation acceptance |
| Internal video/provider, Attendance, recording, privacy, and retention architecture | Before Phase 12B | Any internal/rich Classroom capability; does not block external-link Stage 12A |

Closed Product Map decisions are not gates: Question ↔ Curriculum many-to-many, Student-first registration, approval-gated Counselor/School authority, no public Admin signup, Effective Access separation, external-first lightweight Classroom, School as an Organization layer, Product/Plan/Entitlement/Subscription/Payment separation, provider abstraction, and manual Card-to-Card review remain closed.

## Future-Only Capabilities

The following remain outside core phases until separately approved and scheduled:

- AI/adaptive Practice and adaptive Exam;
- advanced predictive recommendations and automated planning optimization;
- deep LMS, Course/Lesson progress, completion, Continue Watching, and advanced learning analytics;
- internal video hosting/streaming and protected playback;
- WebRTC Classroom, authoritative Attendance, recording, Classroom Chat, whiteboard, screen sharing, and advanced live interactions;
- Voice Messaging and external Push/Email/SMS/Telegram Notification channels;
- Teacher deep workspace and advanced Teacher operations;
- A/B/C printable variants, answer sheets, and richer offline result processing;
- wallet/stored value, credit ledger, coupons/promotions, complex refunds/proration, and advanced renewal automation;
- advanced white-label behavior;
- advanced gamification, social feeds, competition, public ranking, and leaderboards.

Future status preserves the capability in the product vision but is not implementation authorization.

## Milestone Definition Standard

Every future implementation milestone should define:

- objective and owning Product Map section;
- verified starting state and dependencies;
- files/surfaces/domains in scope;
- explicit out-of-scope and future-only behavior;
- backend/data and API changes;
- UI changes and applicable visual reference;
- Role, Permission, Entitlement, ownership, and Organization implications;
- migration, backfill, compatibility, rollback, and history considerations;
- tests and validation proportional to risk;
- Decision Gates that must be closed before work or acceptance;
- measurable exit criteria;
- documentation updates;
- commit/checkpoint expectation.

A milestone must not use roadmap placement as authorization for adjacent work.

## Safe Checkpoints

Future work should pause at these resumable boundaries:

1. **Canonical product documentation finalized:** Product Map and Roadmap reconciled; documentation-only state understood.
2. **Visual shell stabilized:** current Student/Counselor UI accepted, tested, documented, and coherently checkpointed.
3. **Access foundation stabilized:** Permissions, Entitlements, Effective Access, and minimum Organization scope pass authorization/IDOR tests.
4. **Student operational core stabilized:** daily action, Planning/Execution, closure, Study history, and real summaries form one reliable loop.
5. **Counselor core stabilized:** assigned-Student workspace and professional planning operate over shared truth.
6. **Admin/Business foundation stabilized:** permission-driven operations and commercial configuration are separated and attributable.
7. **Communication core stabilized:** Messaging, Notifications, Tickets, referral access, retention, and privacy are independently reliable.
8. **Assessment engine stabilized:** central Questions, Practice, Exam Attempts, release policy, and history are coherent.
9. **Commercial engine stabilized:** online/manual Payment, activation, overrides, and reconciliation are verified.
10. **Public/Content checkpoint:** Public Website and lightweight Learning use real CMS/Business/access truth.
11. **School foundation stabilized:** Organization isolation and shared-engine reuse are verified.
12. **Lightweight Classroom stabilized:** external-first Event/Join/Notification flow works without false Attendance or recording claims.

At every checkpoint: relevant tests pass; documentation is synchronized; migrations are reviewed and clean; historical integrity is preserved; worktree intent is understood; and a coherent commit is expected unless the approved milestone explicitly prohibits committing.

## Continuous Test, Security, and Migration Strategy

Testing is part of every milestone, not one final phase:

- API/domain invariants and strict input validation;
- ownership, Role, Permission, Entitlement, Queue, release-policy, and Organization-scope/IDOR tests;
- Student, Counselor, Admin, and School frontend tests as each surface exists;
- loading, empty, error, retry, partial-data, and no-fabricated-data states;
- responsive RTL, keyboard/focus, contrast, touch-target, Light/Dark, and navigation validation;
- history/integrity tests for Tasks/reports, Study, Questions, Practice, Exam Attempts, Tickets, Payments, Membership, and Audit as applicable;
- migration validation from the full immutable migration history, with forward-only correction and no destructive rewrite;
- Payment signature/protocol, amount/context, callback idempotency, activation, failure, and reconciliation tests;
- build, lint, type-check, Prisma validation, and applicable deployment/static checks.

Do not run a broad migration or data backfill merely because a schema supports it. Every migration requires explicit milestone authority, preflight, rollback/recovery reasoning, and historical compatibility.

## Production Readiness Is Incremental

Each phase must advance only the readiness relevant to its risk:

- environment validation, secrets, HTTPS, cookies, CORS, trusted proxy, and rate limiting with auth/public work;
- Docker, Compose, reverse proxy, deployment health, and observability as runtime surfaces evolve;
- migration runner discipline, backups, restore rehearsal, and rollback evidence before production data changes;
- storage adapters, file validation, access, deletion, and retention before durable Files/attachments/content;
- structured errors, retry/recovery, correlation, and redaction for every new external workflow;
- Payment provider secrets, verification, idempotency, reconciliation, and incident recovery before commercialization;
- Organization isolation and export controls before School release;
- provider, privacy, recording, Attendance, and retention controls before rich Classroom work.

Production hardening is continuous, but unimplemented product domains must not be scaffolded speculatively in the name of readiness.

## History and Source-of-Truth Safety

Every phase must preserve:

- immutable applied migration history and forward corrective migrations;
- source-faithful Curriculum and stable reference/compatibility planning;
- original Task intent, execution/report facts, `PARTIAL` remainder, and actual Study history;
- Question version/provenance meaning used by historical Practice and Exam;
- finalized Exam Attempt answers, timing, scoring basis, and release context;
- Ticket workflow history distinct from platform Audit;
- Product, price, Order, Purchase, Subscription, Payment, activation, and override provenance;
- Organization Membership and meaningful assignment history;
- no silent source-of-truth replacement, destructive normalization, or fabricated backfill.

## Design and UX Delivery Rule

Every UI milestone references `DESIGN_SYSTEM.md` rather than duplicating its tokens here. Where applicable it must preserve:

- Persian-first RTL;
- Light/Dark parity;
- right-side desktop application sidebar;
- mobile hamburger and right-opening drawer;
- no main bottom-navigation replacement;
- approved surface-specific visual references;
- calmer action-first Student hierarchy and denser operational Counselor/Admin hierarchy;
- accessibility and honest loading/empty/error/data states.

Public Website navigation remains a responsive marketing header/menu rather than inheriting the authenticated application sidebar.

## Safe Parallelization

Parallel work is limited to contracts that are already stable:

- after Phase 2, isolated documentation, visual assets, and read-only UX research may proceed without changing domain behavior;
- after Stage 3A stabilizes, selected Student UI and Public Website visual-shell work may proceed in parallel if neither invents access, pricing, or backend behavior;
- Phase 5 Admin Operations and Business Configuration lanes may proceed in parallel only after their shared Permission, Entitlement, Audit, and terminology contracts are fixed;
- within Phase 6, Ticket Queue primitives may develop alongside late Notification work, but referral integration waits for Messaging, Notification, and Ticket authorization contracts;
- public editorial/CMS presentation may progress alongside late Payment work, but real Pricing and conversion cannot ship before Business and Payment truth are ready.

Do not parallelize milestones that mutate the same unstable auth, Task, Question, Payment, Membership, or history contracts.

## Roadmap Anti-Drift Rules

- Do not implement a `FUTURE` capability early because nearby architecture could support it.
- Do not duplicate Student, Counselor, School, Question, Exam, Content, Messaging, Ticket, Classroom, or Business engines.
- Do not hardcode commercial Plan names into authorization.
- Do not build deep LMS behavior before lightweight Learning Content is stable.
- Do not build internal WebRTC/video before external-first Classroom is stable and Stage 12B is approved.
- Do not introduce advanced AI, adaptive behavior, or recommendations before trustworthy source data and explicit human-control rules exist.
- Do not create separate Practice, Exam, Printable, School, or Teacher Question repositories.
- Do not turn Admin or Counselor operations into every-click surveillance or automatic staff scoring.
- Do not display fake analytics, progress, Attendance, Payment, engagement, recommendations, or operational state.
- Do not treat hidden UI, disabled buttons, routes, or client claims as authorization.
- Do not activate commercial access from frontend success, Notification, or Ticket closure.
- Do not mark a Product Map area complete because its specification, placeholder route, schema, or shell exists.
- Do not continue beyond a safe checkpoint without explicit milestone authorization and any required Product Owner Decision Gate.

## Next-Milestone Boundary

The next implementation prompt may address **only the Browser / Picker split** unless the architect explicitly authorizes a different roadmap milestone. It must keep `/curriculum` browse-only, preserve historical `WHOLE`, and implement recursive selection only through the approved versioned `SUBTREE` architecture without claiming Product Owner Visual PASS prematurely.

It must not reinterpret saved targets, backfill historical Tasks, combine later navigation/timeline/Profile work, or begin any later near-term or macro-roadmap milestone unless separately authorized.
