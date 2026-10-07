# Konkourix Product Decisions

**Status:** Current product-architecture decision history
**Last synchronized:** 2026-10-07

This log records product and domain decisions. Existing technical ADRs remain in [DECISIONS.md](DECISIONS.md); they are not replaced by this file.

Status meanings:

- **Accepted:** governs current and future work.
- **Replaced/Superseded:** retained as history but must not guide new work.
- **Deferred:** possible direction with no current implementation authority.

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

**Status:** Accepted principle. The ownership and depth details are superseded by **Canonical Deep Curriculum Architecture** below.

**Decision:** Subjects and topics must provide stable educational meaning for planning, study tracking, assessment, a future question bank, and future analytics. Curriculum design must support تجربی, ریاضی, انسانی, and additional tracks.

**Historical implementation note:** Student-owned subjects/topics are implemented. They are not the approved curriculum architecture and must not guide new curriculum design.

## Decision: Canonical Deep Curriculum Architecture

**Status:** Accepted. Governs future curriculum work.

**Rejected option:** User-created or user-modifiable curriculum structures.

**Decision:** Konkourix uses one centrally managed canonical curriculum tree. Students, counselors, teachers, and schools reference this tree; they do not create private curriculum branches or modify canonical nodes.

Canonical depth:

```text
Curriculum
|-- رشته
|   `-- درس
|       `-- فصل
|           `-- بخش
|               `-- مبحث
|                   `-- مفهوم / ریزمبحث اتمیک
```

Illustrative branch:

```text
Mathematics
`-- Function
    |-- Domain and Range
    |   |-- Domain
    |   `-- Range
    |-- Infinite Functions
    |-- Composite Functions
    `-- Inverse Functions
```

**Governance:** Domain experts manually curate the canonical tree. Canonical changes require controlled editorial review and are not ordinary user actions.

**AI boundary:** AI must not generate, insert, rename, move, or otherwise modify canonical curriculum nodes. A future AI capability may consume approved curriculum data for analysis, recommendations, weak-point detection, and learning assistance.

**Current implementation gap:** The repository currently allows student-owned subject/topic creation and editing. That behavior is transitional relative to this accepted decision. Reconciliation requires a separately designed and authorized implementation/migration; this documentation decision does not change current APIs, schema, or stored data.

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

**Status:** Accepted future requirement; question bank not implemented.

Every future question must reference one or more approved canonical curriculum nodes with enough depth to identify the concepts it assesses. The accepted direction is a many-to-many Question ↔ Curriculum Node relationship.

```text
Question
Subject: Math
Topic: Function
Atomic concept: Infinite Functions
```

This enables precise search, exam generation, weakness analysis, and targeted practice.

A possible governed contribution workflow is:

```text
Teacher submits question
          |
Admin review
          |
Approved question enters bank
```

Submission never makes a question canonical or published automatically. Attribution, author/source provenance, copyright metadata, immutable published versions, and educational/answer/copyright/curriculum-link moderation are required. Whether one node is primary, whether an atomic node is mandatory, and whether ancestors are stored or derived remain explicitly unresolved.

## Decision: Personal Learning Tasks Remain Visible and Attributed

**Status:** Accepted and supported at foundation level.

Students may create their own learning tasks. Authorized counselors can see those tasks, their student-authored provenance, and the learning feedback available under the implemented contract. Counselor-created and student-created tasks remain distinguishable.

The target counselor view may include creator, completion, task-level quality, and student notes. Today, task provenance and counselor visibility exist, while the full task-level quality/result model described above does not.

## Decision: Product Priority Order

**Status:** Accepted.

1. Students: execution and improvement of exam preparation.
2. Counselors: efficient planning, monitoring, and guidance.
3. Educational content and online classes: future.
4. Schools and organizations: future.

Post-exam services are possible later, but are not a current priority. Architecture should avoid blocking them without creating speculative domain models.

## Decision: Deferred Capability Boundary

**Status:** Accepted scope constraint.

AI analysis, an analytics platform, ranking, a question bank, online exams, live classes, school management, a payment system, a marketplace, and a post-exam ecosystem are **not current**. Older documents describing one of these as a possible feature are interpreted as deferred, not as approved work.

## Decision: Canonical Curriculum Lifecycle and Compatibility

**Status:** Accepted target architecture; not implemented.

Canonical curriculum uses stable opaque node identities and immutable published releases. Renames and reordering retain identity when educational meaning remains compatible; semantic splits and merges create new identities with reviewed lineage. Sibling order is explicit. Published nodes are deactivated, deprecated, or retired rather than hard-deleted.

Domain experts prepare and review curriculum changes, and an authorized admin publishes an internally consistent release. Students, counselors, schools, teachers, integrations, and AI have no curriculum mutation authority.

Migration from `StudySubject` and `Topic` is non-destructive. Legacy rows and historical links remain readable while an explicit reviewed mapping registry supports compatibility reads and eventual canonical-only new writes. No automatic destructive merge, history rewrite, or applied-migration rewrite is permitted. See [CANONICAL_CURRICULUM_SPECIFICATION.md](CANONICAL_CURRICULUM_SPECIFICATION.md).

## Decision: Counselor Plans Are Published and Versioned

**Status:** Accepted target architecture; not implemented.

Counselors create plans in draft revisions and explicitly publish immutable versions. A later revision may move future blocks, change future curriculum references, and adjust future workload, activity, duration, questions, or expected outcomes. Earlier published versions remain readable.

Students execute and report reality against published intention. They cannot rewrite counselor-authored plan content. Personal tasks remain allowed and separately attributed. Existing execution and assessment evidence retains its original plan/version context and is never moved or relabeled by a later revision. Plan publication and material changes require durable audit history. See [PLANNING_ARCHITECTURE.md](PLANNING_ARCHITECTURE.md).

## Decision: Assessment Capability Separation

**Status:** Accepted target architecture; only the generic completed-attempt foundation is implemented.

Practice is daily learning activity without an exam lifecycle. External Exam Reports record results for provider-owned exams such as Ghalamchi, Maz, and Gaj without owning their delivery. Internal Konkourix Exams use a moderated question bank, exam builder, immutable exam version, question selection, student attempt, answer evaluation, and result lifecycle.

These capabilities may feed a shared read/reporting layer, but they do not share one write lifecycle and never manufacture study sessions or automatic task outcomes. See [ASSESSMENT_ARCHITECTURE.md](ASSESSMENT_ARCHITECTURE.md).

## Decision: Question Bank Governance and Multi-Node Linkage

**Status:** Accepted target architecture; not implemented.

Questions have stable identities and immutable approved versions. Author/source attribution, submission provenance, copyright or license metadata, and moderated publication eligibility are required. Internal exams reference exact approved question versions.

Questions link to multiple canonical curriculum nodes through explicit moderated relationships. The primary-node rule, atomic-node requirement, ancestor inheritance, and link-role vocabulary remain intentionally unresolved until a later data-design decision. See [QUESTION_BANK_ARCHITECTURE.md](QUESTION_BANK_ARCHITECTURE.md).

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

**Status:** Accepted UX direction; not an implementation specification.

Konkourix must not resemble Todoist, a generic calendar, or a CRM. The student experience is motivating, alive, and progress-oriented. The counselor experience emphasizes control, planning, monitoring, and analysis.

The visual identity is blue-based, modern, premium, comfortable, and energetic. Glass UI elements may be used selectively where they preserve accessibility, contrast, performance, and clarity. Exact components and design tokens require later UX work.

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
