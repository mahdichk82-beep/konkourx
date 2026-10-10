# Konkourix Product Decisions

**Status:** SUPPORTING HISTORICAL DECISION RECORD
**Last synchronized:** 2026-10-07

This log preserves product and domain decision history. It is not the primary current product-definition source. [PRODUCT_MAP.md](PRODUCT_MAP.md) defines current intended product behavior, and [ROADMAP.md](ROADMAP.md) defines implementation sequencing. Where historical entries below conflict with either canonical document, the canonical documents govern. New consolidated product truth belongs in `PRODUCT_MAP.md`, while this file may retain the decision history that led to it.

Existing technical ADRs remain in [DECISIONS.md](DECISIONS.md); they are not replaced by this file. Curriculum educational truth remains governed by [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md).

Status meanings:

- **Accepted:** governs current and future work.
- **Replaced/Superseded:** retained as history but must not guide new work.
- **Deferred:** possible direction with no current implementation authority.

## Decision: Product Master Blueprint and Anti-Drift

**Status:** Accepted principle; consolidated into [PRODUCT_MAP.md](PRODUCT_MAP.md), which now governs product behavior.

**Decision:** Konkourix is a comprehensive Persian educational SaaS / EdTech platform, not merely a planner, counseling CRM, Question Bank, content website, or virtual classroom. Its product family includes Public Web, Student Web/App, Counselor Web, future School Web, future Admin, API, Content/SEO, and a future Classroom provider layer.

The current implementation priority is Student + Counselor + Planning. Current priority and current implementation do not redefine the whole product. A deferred capability remains in the approved future vision when [PRODUCT_MAP.md](PRODUCT_MAP.md) says it does, while future vision never authorizes implementation by itself.

**Consequence:** Product and architecture documentation must distinguish `CURRENT IMPLEMENTED STATE`, `APPROVED FUTURE STATE`, and `EXPLORATORY / DEFERRED`. Every implementation still requires an approved milestone, architect-defined scope and acceptance conditions, and applicable Product Owner or Student UX Decision Gates.

## Decision: Public Web Is a Product Surface

**Status:** Accepted future product direction; not implemented by this documentation milestone.

**Decision:** Public Web is the platform's acquisition, educational publishing, product-education, trust, and conversion layer. It is not a static brochure. Public SEO content and authenticated learning content are related but distinct, and both use the same Konkourix brand family as the applications.

**Deferred details:** Exact information architecture, CMS model, editorial roles, content workflow, SEO implementation, pricing presentation, and conversion journeys require separate milestones.

## Decision: Planning vs Execution Separation

**Status:** Accepted. The old assumption is replaced.

**Old assumption:** Konkourix should be modeled primarily as a task-management system.

**Rejected because:** Konkourix is an exam-preparation execution platform and ecosystem. Generic task semantics hide the difference between educational intention and actual work.

**Decision:** Separate planned intention from actual execution. `DailyTask` owns planned educational work; `StudySession` owns actual study intervals.

**Consequence:** Existing task-oriented foundations are interpreted within the Planning domain, not as the whole product. Future sessions must not revive the generic task-management assumption.

## Decision: StudySession

**Status:** Accepted.

**Decision:** `StudySession` represents an actual study interval. `DailyTask` represents planned work. Never merge them.

**Consequences:**

- A task may have zero, one, or many study sessions.
- A session may preserve an optional task link as provenance.
- Starting, finishing, switching, cancelling, or rating a session never automatically completes or skips a task.
- Returning to a task creates another actual interval; it does not convert execution into task state.

## Decision: AssessmentAttempt

**Status:** Accepted.

**Rejected option:** Add test-result data to `StudySession`.

**Rejected because:** Studying and assessment are different domains with different meaning and lifecycle.

**Decision:** `AssessmentAttempt` records one completed assessment submission. It is neither a `StudySession` nor a task.

Current optional provenance model:

```text
DailyTask
  |-- StudySession
  `-- AssessmentAttempt
```

The diagram does not imply that either child is required or that the two records depend on one another.

## Decision: No Fake Study Sessions

**Status:** Accepted.

**Decision:** A test attempt does not require a `StudySession`.

**Reason:** Students may only solve tests, enter historical results, or take exams outside Konkourix. Manufacturing a study interval would corrupt execution data and make later measurement unreliable.

## Decision: External Exams

**Status:** Deferred direction. Refined by **Practice, External Exams, and Internal Exams Are Separate** below.

Future external-exam support may include providers such as قلمچی, گزینه دو, گاج, and ماز. Possible inputs include an uploaded report image, manually entered percentages or counts, student notes, and counselor analysis.

**Decision:** Treat external-exam ingestion as a future source of assessment evidence. Do not confuse or tightly couple it with a future internal assessment engine.

**Current limit:** The implemented `AssessmentAttempt` foundation records completed raw counts and timestamps. Report-image upload, percentage interpretation, provider adapters, counselor analysis, and internal exam delivery are not current.

## Decision: Curriculum Is Strategic Infrastructure

**Status:** Accepted principle. Source ownership and structural rules are governed by **Source-Faithful Canonical Curriculum** below.

**Decision:** Canonical Curriculum supplies stable educational references for planning, progress measurement, reporting, and future Question Bank linking. Its authored organizations and labels come only from the protected Product Owner source.

**Historical implementation note:** Student-owned subjects/topics are implemented. They are not the approved curriculum architecture and must not guide new curriculum design.

## Decision: Source-Faithful Canonical Curriculum

**Status:** Accepted. Replaces the historical fixed-depth “Canonical Deep Curriculum Architecture” direction.

**Rejected options:** User-created or user-modifiable canonical Curriculum, an invented fixed-depth tree, synthesized intermediate levels, Curriculum-as-knowledge-graph, and scientific/AI educational governance.

**Decision:** `cori.docx`, governed by [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md), is authoritative. Its authored hierarchy, labels, order, unequal depths, incomplete branches, and multiple source-defined organizations must be preserved without semantic normalization, merge, split, expansion, reduction, or invented structure. Runtime models are projections and never educational authority.

Students, Counselors, teachers, Schools, Administrators, AI, and implementation processes may reference Curriculum but cannot change its educational content without explicit Product Owner approval. A Product Owner-approved source change requires explicit reference migration and ID-stability planning.

**Current implementation:** A deterministic, file-backed, read-only runtime projects the protected transcription. It has no Curriculum database persistence, write/admin API, authoring, review, or publication workflow. DailyTask stores validated opaque runtime references and historical display snapshots only.

**Current compatibility gap:** Student-owned subjects/topics still exist as implemented historical behavior. Any reconciliation with Canonical Curriculum requires a separately approved, non-destructive milestone; this decision changes no API, schema, migration, or stored data.

## Decision: Student Progress Is an Overlay

**Status:** Accepted target architecture; not implemented.

**Decision:** Student customization belongs in a student-specific progress layer keyed to canonical curriculum nodes. It never changes the canonical curriculum.

```text
Canonical Curriculum
        |
        `-- Student Topic Progress
```

The future progress layer may record separate student self-rating, counselor rating, system-estimated mastery, learning status, notes, review dates, weaknesses, strengths, and last activity. Approved status vocabulary:

- شروع نشده
- در حال یادگیری
- نیازمند مرور
- مسلط
- ضعیف

Each mastery signal uses an integer scale from 1 through 5. The raw signals must not be collapsed into one field; a future UI may derive a Current Mastery display.

Example:

```text
Student: Ali
Topic: Infinite Functions
Status: ضعیف (Weak)
Mastery: 2/5
Note: Needs teacher explanation
```

Progress is student-owned learning state, not curriculum ownership. The exact storage model, history rules, and calculation policy require a future implementation decision.

## Decision: Tasks Are Planned Learning Execution Units

**Status:** Accepted target direction; partially implemented.

**Decision:** A task is a planned learning execution unit, not a generic todo and not the actual execution record. `DailyTask` remains in the Planning domain; `StudySession` continues to record what actually happened.

A complete target task intention may reference one or more canonical Curriculum items and includes:

- canonical Curriculum selection(s);
- activity type;
- planned duration;
- planned question count;
- expected learning outcome.

Curriculum checklist completion records coverage, not mastery. The future student result may also include learning quality on a five-level scale and an optional student note, difficulty, or problem description.

| Level | Learning quality |
| --- | --- |
| 1 | Very weak |
| 2 | Weak |
| 3 | Average |
| 4 | Good |
| 5 | Excellent |

```text
Task: Study Infinite Functions
Completed: Yes
Quality: 2/5
Note: Concept understood but exercises are difficult
```

**Separation rule:** Task-level learning quality describes the outcome of the planned learning unit. Existing `StudySession.studyQualityRating` describes one actual interval. One must not be silently copied to or inferred from the other.

**Current implemented state:** `DailyTask` supports multiple validated Canonical Curriculum targets, direct execution checklist items, historical display snapshots, and terminal `PARTIAL` outcomes. Explicit activity type, expected outcome, task-level learning-quality feedback, mastery persistence, and their UI remain future work.

## Decision: Practice, External Exams, and Internal Exams Are Separate

**Status:** Accepted domain direction; M19 implements only the completed-attempt foundation.

### Practice and Exercises

Practice is part of learning. It may use textbook exercises, help books, teacher material, or a future question bank. It is recorded as a practice activity and has no exam lifecycle. “Practice activity” is a domain concept; its future persistence mapping is not decided by this documentation update.

### External Exams

External exams such as قلمچی, ماز, گزینه دو, and گاج are not owned or delivered by Konkourix. Konkourix records performance reports only. A future student workflow may upload a report image or enter structured results including exam name, date, scores, percentages, and notes; counselor feedback may be added through an authorized counselor workflow.

The current `AssessmentAttempt` foundation does not yet implement report uploads, provider integration, percentages/scores, student notes, or counselor feedback.

### Internal Online Exams

Internal online exams are owned and delivered by Konkourix. They are future work and require a moderated question bank, exam builder, timed delivery, and answer evaluation.

```text
Question Bank
      |
Exam Builder
      |
Online Assessment
```

External reporting must not be coupled to the internal delivery lifecycle merely because both yield assessment evidence.

## Decision: Question Bank Uses Canonical Curriculum

**Status:** Accepted future requirement; cardinality decided many-to-many; Question Bank not implemented.

Every future official question links to the approved Canonical Curriculum through a moderated many-to-many relationship that cannot alter Curriculum authority. One question may link to multiple topics, chapters, grades, and—where educationally valid—subjects. An optional Primary Curriculum Link may support display/grouping while all links remain semantically valid.

The linkage supports precise search, exam generation, weakness analysis, and targeted practice without making Question Bank authoritative over Curriculum.

A possible governed contribution workflow is:

```text
Teacher submits question
          |
Admin review
          |
Approved question enters bank
```

Submission never makes a question canonical or published automatically. Difficulty, explanation, attribution, author/source provenance, history, copyright metadata where appropriate, and educational/answer/copyright/curriculum-link moderation belong to the approved future direction. Detailed storage/derivation and moderation implementation still require scoped technical design, but cardinality is closed.

## Decision: Personal Learning Tasks Remain Visible and Attributed

**Status:** Accepted and supported at foundation level.

Students may create their own learning tasks. Authorized counselors can see those tasks, their student-authored provenance, and the learning feedback available under the implemented contract. Counselor-created and student-created tasks remain distinguishable.

The target counselor view may include creator, completion, task-level quality, and student notes. Today, task provenance and counselor visibility exist, while the full task-level quality/result model described above does not.

## Decision: Implementation Priority Is Not Product Definition

**Status:** Accepted.

The current implementation priority is Student + Counselor + Planning. The current roadmap sequence is maintained in [ROADMAP.md](ROADMAP.md) and may change through an approved decision.

Public Web/SEO, Question Bank and online exams, learning/content, School/Institute, Admin/CMS/business operations, subscriptions/payments, recorded education, and provider-abstracted live classrooms remain visible future product domains. Their later sequence does not make them less central to the complete product vision and does not authorize speculative models now.

## Decision: Deferred Capability Boundary

**Status:** Accepted scope constraint.

Question Bank, online exams, richer learning, live classrooms, School management, Admin/CMS expansion, subscriptions/payments, recorded courses/classes, and broader educational services are **not current**, but they remain approved future product domains under [PRODUCT_MAP.md](PRODUCT_MAP.md). Deferral removes implementation authority, not product-vision membership.

AI analysis, rankings, marketplaces, post-exam ecosystems, and other capabilities not explicitly approved by the scope lock remain exploratory or outside current approval. Historical documents cannot elevate them.

## Decision: Canonical Curriculum Lifecycle and Compatibility

**Status:** Partially superseded by the 2026-09-30 source lock and recovered runtime; future product-reference compatibility remains unresolved.

The historical proposal for a database-managed Curriculum lifecycle, editable releases, and domain-expert publication does not govern the current file-backed runtime. `cori.docx` remains authoritative, and no role may rename, reorder, split, merge, retire, or otherwise change educational content without explicit Product Owner approval.

Product runtime versioning may later manage deployment, compatibility, and auditability of source-faithful projections, but it cannot approve or alter educational truth. Stable-reference behavior for Product Owner-approved source changes remains a future architecture Decision Gate.

Any future migration from `StudySubject` and `Topic` must be non-destructive. Legacy rows and historical links remain readable, and no automatic destructive merge, history rewrite, or applied-migration rewrite is permitted. [CANONICAL_CURRICULUM_SPECIFICATION.md](CANONICAL_CURRICULUM_SPECIFICATION.md) is historical architecture input only where it conflicts with the current source lock or recovered runtime.

## Decision: Counselor Plans Are Published and Versioned

**Status:** Accepted target architecture; not implemented.

Counselors create plans in draft revisions and explicitly publish immutable versions. A later revision may move future blocks, change future curriculum references, and adjust future workload, activity, duration, questions, or expected outcomes. Earlier published versions remain readable.

Students execute and report reality against published intention. They cannot rewrite counselor-authored plan content. Personal tasks remain allowed and separately attributed. Existing execution and assessment evidence retains its original plan/version context and is never moved or relabeled by a later revision. Plan publication and material changes require durable audit history. See [PLANNING_ARCHITECTURE.md](PLANNING_ARCHITECTURE.md).

## Decision: Assessment Capability Separation

**Status:** Accepted target architecture; only the generic completed-attempt foundation is implemented.

Practice is daily learning activity without an exam lifecycle. External Exam Reports record results for provider-owned exams such as Ghalamchi, Maz, and Gaj without owning their delivery. Internal Konkourix Exams use a moderated question bank, exam builder, immutable exam version, question selection, student attempt, answer evaluation, and result lifecycle.

These capabilities may feed a shared read/reporting layer, but they do not share one write lifecycle and never manufacture study sessions or automatic task outcomes. See [ASSESSMENT_ARCHITECTURE.md](ASSESSMENT_ARCHITECTURE.md).

## Decision: Question Bank Governance and Curriculum Linkage

**Status:** Accepted governance direction; many-to-many cardinality decided 2026-10-02; not implemented.

Questions have stable identities and immutable approved versions. Author/source attribution, submission provenance, copyright or license metadata, and moderated publication eligibility are required. Internal exams reference exact approved question versions.

Questions link to Canonical Curriculum through explicit moderated many-to-many relationships. An optional Primary Curriculum Link may support display/grouping. Detailed storage/derivation, link-role, and moderation mechanics remain implementation design concerns; they must preserve the decided product behavior. Any conflicting cardinality claim in [QUESTION_BANK_ARCHITECTURE.md](QUESTION_BANK_ARCHITECTURE.md) is historical.

## Decision: Learning and Live Classroom Capability Boundaries

**Status:** Accepted future direction; not implemented.

The learning platform may support articles, lessons, documents/resources, video, recorded classes, and courses or learning collections. Public educational publishing and authenticated learning delivery are related but distinct. This decision preserves capability without approving a deep LMS architecture.

Current Classroom direction is lightweight: session title, host, date/time, audience, external meeting URL, and Join Class. Example providers include Google Meet and Skyroom.

**Architecture boundary:** Classroom begins provider-abstracted. Core Student, Counselor, Curriculum, and Planning models must not couple to a selected vendor. Internal video/WebRTC, attendance, recording, whiteboard, Classroom Chat, and richer learning integration remain future capabilities and are not authorized here.

## Decision: School and Admin Remain Future Surfaces

**Status:** Accepted future direction; not implemented.

School/Institute is an Organization and an organizational layer over the shared Student, Counselor, Question Bank, Exam, Content, and Communication engines. It may contain managers, Counselors, teachers, Students, classes, grades, and groups, with organization permissions, reporting, content, exams, session links, and Plan Entitlements. Shared engines must not be duplicated for School.

Future Admin/CMS/business capability includes permission-driven user and application administration, operations queues, content/blog publishing, Question Bank review, Plans/Entitlements, payments, notifications, moderation, Audit, and future course/live-class administration.

Reference images establish design direction only. This decision authorizes no School or Admin UI, data model, API, migration, or workflow.

## Decision: Commercial Model and Payments

**Status:** Accepted future direction; not implemented.

Product, Plan, Entitlement, Subscription, and Payment are separate concepts. Admin may configure commercial packaging, pricing, trials, and numeric limits for implemented capabilities without code changes; new software capabilities still require development.

Effective access combines Role, Plan Entitlements, Organization Entitlements, and User Overrides. Question Bank and Student Exam Builder are Paid/Entitled capabilities.

Payment is provider-abstracted. A materially different provider API normally requires a developer-written adapter; authorized Admin configuration applies after the adapter exists. Backend verification—not frontend callback success—authorizes Payment success and purchase/Subscription/Entitlement activation.

Card-to-Card is a manual payment method with receipt/reference submission, Finance/Admin review, `APPROVED` / `REJECTED` outcome, and activation after approval.

## Decision: Communication Is Separated by Purpose

**Status:** Accepted target architecture; not implemented.

General Chat supports lightweight relationship-scoped conversation. Ticket/Thread supports structured study problems, plan discussion, report review, and technical issues. Suggestions support governed curriculum changes, question submissions, and product improvements.

Konkourix does not create entity-based chat for every object. Contextual links do not transfer domain ownership to communication, and messages never become authoritative plan, curriculum, assessment, audit, or private-note state. See [COMMUNICATION_ARCHITECTURE.md](COMMUNICATION_ARCHITECTURE.md).

## Decision: Student-Counselor Acquisition Is Explicit and Human Reviewed

**Status:** Accepted target architecture; partially implemented only at the relationship foundation.

Students may register freely without a counselor. A relationship may be established through a counselor invitation code or through a student request reviewed by a Super Admin. In the reviewed flow, the admin evaluates student conditions, introduces suitable counselors, and the student makes the final selection.

There is no automatic matching, silent assignment, or ranking-driven placement. See [COUNSELOR_ECOSYSTEM.md](COUNSELOR_ECOSYSTEM.md).

## Decision: Private Counselor Notes Are Confidential

**Status:** Accepted target architecture; not implemented.

Private Counselor Notes may record behavior observations, weaknesses, and reminders. They are visible only to the owning counselor and specifically authorized admins. Students and other counselors cannot read them, and reassignment does not automatically transfer them.

Private notes are not chat, student feedback, plan content, progress facts, or automatic-matching input. Access and exceptional transfer require audit. See [COUNSELOR_ECOSYSTEM.md](COUNSELOR_ECOSYSTEM.md).

## Decision: Role-Specific Product Experience and Visual Direction

**Status:** Accepted UX and visual-governance direction; scoped implementation specification remains milestone-bound.

Konkourix must not resemble Todoist, a generic calendar, or a CRM. The student experience is motivating, alive, and progress-oriented. The counselor experience emphasizes control, planning, monitoring, and analysis.

Product Owner-approved Konkourix reference images are the visual specification, not loose inspiration. Implementations converge toward their composition, density, hierarchy, card system, right-side navigation, top bars, chart presentation, X/wordmark presence, blue/violet/cyan accents, premium light mode, professional navy dark mode, and responsive quality. They interpret rather than mechanically copy pixels and must not replace the approved direction with generic developer-designed dashboards.

Mobile primary navigation uses a hamburger and right-side drawer, not a main bottom-navigation replacement. External educational platforms may inform capability and information-architecture research, but they are not the visual identity source.

## Decision: Curriculum Browser, Study Task Picker, and Legacy Study UI

**Status:** APPROVED FUTURE STATE; documentation only. Current compatibility behavior remains implemented until separately authorized milestones change it.

`/curriculum` is the canonical `مباحث درسی` route and becomes browse-only: official Curriculum navigation, search, expand/collapse, hierarchy, and breadcrumb/path context. It is not a Task Picker and has no selected-items tray, single/multiple mode, scope selector, `EXACT`/`WHOLE` terminology, or save-to-Task action.

Curriculum selection exists only inside authorized `STUDY` Task create/edit flows. The Picker is a tri-state checkbox tree. Parent selection recursively covers the complete selectable subtree, child changes update all ancestors, and search/tree use one selection state. Navigation wrappers may offer bulk behavior but never become invalid Task targets.

`/study` is legacy compatibility only and will leave primary navigation in its approved milestone. Legacy Subject/Topic data and history remain preserved. The final primary Curriculum navigation has only `مباحث درسی`.

## Decision: Historical WHOLE and Recursive Subtree Persistence

**Status:** CURRENT compatibility semantics preserved; APPROVED FUTURE STATE architecture; implementation not authorized.

Existing `WHOLE` keeps its historical direct-child meaning for saved Tasks. It is never reinterpreted as recursive, silently migrated, or converted by an unrelated edit.

The approved future contract retains internal `EXACT` and legacy `WHOLE`, and adds internal `SUBTREE` through a versioned additive write payload. The client submits compact roots; the server validates the Student's authoritative track, normalizes overlaps deterministically, recursively resolves terminal selectable nodes, and atomically saves both selector intent and immutable execution-item snapshots. Navigation-only wrappers expand to valid child-node selectors and never become persisted targets.

Unchanged legacy edits omit Curriculum replacement and preserve `WHOLE` and its stored item set exactly. An explicit replacement discards the complete legacy set and writes only a new-contract selection under the existing edit locks. The existing target/item tables are sufficient, but future implementation requires an additive `SUBTREE` enum migration and tolerant-reader-first rollout; it requires no backfill. The 50-target limit remains a normalized selector-root ceiling, not an item limit. A separate resolved-item capacity bound must be justified by implementation-time evidence. [The governing architecture specification](superpowers/specs/2026-10-07-planning-curriculum-interaction-design.md) records normalization, cardinality, compatibility, and atomicity details.

## Decision: Planning Surface Classification and 24×4 Timeline

**Status:** APPROVED FUTURE STATE; implementation requires separate milestones.

Core Task lifecycle semantics and Weekly Planning are KEEP + POLISH. Today Planning presentation and the Curriculum Picker are REDESIGN. `/curriculum` is SIMPLIFY HEAVILY. `/study` is RETIRE FROM PRIMARY UI. Assessment UX is REWRITE LATER.

Today Planning uses progressive disclosure: pre-execution identity/time/start, active execution state/elapsed time/finish, then applicable closure inputs and submit. It does not expose every control and form simultaneously.

`24 × 4` means 96 visual 15-minute slots, not database entities. V1 is a read-only daily timeline of existing timed Tasks. It is not draggable, resizable, clickable for editing, or used to create or move Tasks. Date-only Tasks appear separately under an untimed area. Student daily planning is the primary context; Counselor surfaces may later reuse the visualization, but the current Counselor `/planning` shell is not an interactive scheduler.

## Decision: Batch, Group Assignment, Profile, Account, and Assessment Boundaries

**Status:** APPROVED product boundary; future implementation remains milestone-gated.

Current batch creation means multiple independent Tasks for one Student, not cross-Student group assignment. True Group Assignment starts from a Student list, selects multiple Students, validates `STUDY` Curriculum against every authoritative Student track, and atomically creates independent `DailyTask` lifecycles.

Profile Center is technically implemented but lacks Product Owner Visual PASS. Its Student sections remain `اطلاعات شخصی`, `اطلاعات تحصیلی`, `تنظیمات`, and `امنیت و حساب`; Counselor sections remain `اطلاعات شخصی`, `اطلاعات حرفه‌ای`, `تنظیمات`, and `امنیت و حساب`. The current visual presentation is classified for redesign.

Current Account/Security capabilities are login, refresh/session handling, logout, logout-all, and current-password change. Verified email/phone management, verification/change, recovery/reset, session/device listing, and specific-session/device revocation are future milestones after Profile visual closeout. MFA/2FA is future-only unless separately approved. Frontends must not show fake controls for absent backend capability.

The current `/assessments` UX is legacy. Useful backend/history remains eligible for preservation, but the giant all-in-one form, legacy Subject/Topic selectors, native/old date-time UX, old visual language, and simultaneous-input density require a dedicated later rewrite.

## Decision: DailyTask Curriculum Coverage

**Status:** CURRENT IMPLEMENTED STATE.

- One DailyTask may reference multiple Canonical Curriculum targets while freeform tasks remain valid without any Curriculum reference.
- Target reference kinds are `NODE` and `PLACEMENT`; selection modes are `EXACT` and `WHOLE`.
- `NODE + EXACT` produces one execution checklist item. `NODE + WHOLE` produces only the selected node's direct children, or the selected node itself when it is a leaf. It never recursively flattens the subtree.
- `PLACEMENT` supports `EXACT` only. No placement-to-representation mapping is inferred.
- Duplicate or overlapping selections that produce the same execution item are rejected rather than silently changing intent.
- Persisted task references store opaque runtime IDs and historical label/path snapshots. They do not create Curriculum nodes or make the database authoritative over Curriculum.
- Planning targets may change only while the task is pending and no Curriculum item is complete. Students cannot edit counselor-created planning targets; they may update their own execution checklist.

## Decision: PARTIAL Is a Closed Task Outcome

**Status:** CURRENT IMPLEMENTED STATE.

For Curriculum-backed tasks, `COMPLETED` requires all planned checklist items, `PARTIAL` requires at least one completed and at least one unfinished item, and `SKIPPED` requires zero completed items. Checkbox changes do not transition status automatically; the student explicitly closes the task through the existing lifecycle operation. `PARTIAL` is terminal, preserves both completed and remaining coverage, does not reopen the original task, and never creates a make-up task automatically.

**APPROVED FUTURE STATE:** An authorized counselor may later create a separate compensatory task from remaining items. No button, automatic task generation, or compensatory workflow is currently implemented.

## Decision: Planning Time Grid

**Status:** APPROVED FUTURE STATE; no UI change in this documentation milestone.

The planning day uses 24 hours with four quarter-hours each. Tasks may span hour boundaries; `15:45–17:00` occupies five visual slots. Slots are a display representation, not database rows or lifecycle entities. The v1 Daily Timeline is read-only, uses existing start/end times, and excludes drag/drop, resize, click-to-edit, creation, and movement. Date-only Tasks remain separately listed rather than artificially positioned.

## Decision: Mastery Signals Remain Separate

**Status:** APPROVED FUTURE STATE; no persistence or UI implemented.

Mastery uses a five-level scale. Student self-rating, counselor rating, and system-estimated mastery from assessment/performance remain separate signals and must not be collapsed into one raw field. A future UI may derive a Current Mastery display from those signals under a separately approved design. Task completion and Curriculum checklist coverage do not imply mastery.
