# Konkourix Domain Map

**Status:** SUPPORTING TECHNICAL DOMAIN REFERENCE
**Last synchronized:** 2026-10-02

This document records domain semantics and historical target modeling. It does not define product scope or sequencing. [PRODUCT_MAP.md](PRODUCT_MAP.md) governs intended behavior, [ROADMAP.md](ROADMAP.md) governs build order, [PROJECT_STATE.md](PROJECT_STATE.md) governs implemented reality, and [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md) governs Curriculum educational truth. Conflicting product or Curriculum architecture statements below are historical and must not override those documents.

Konkourix organizes its core exam-preparation loop into three distinct domains. These are semantic boundaries inside the current modular monolith, not separate deployed services.

## Domain Summary

| Domain | Responsibility | Main entity | Meaning |
| --- | --- | --- | --- |
| Planning | Create educational intention | `DailyTask` | What should be studied, when, by whom, and in what planned amount |
| Execution | Record actual study work | `StudySession` | One actual study interval |
| Assessment | Record completed assessment evidence | `AssessmentAttempt` | One completed practice test, quiz, mock exam, or external assessment submission |

The canonical Curriculum domain is a shared reference foundation beneath these three operational domains. Student Topic Progress is a student-specific overlay on that reference data; it is not part of the canonical tree.

## Planning Domain

`DailyTask` is not a generic todo. It expresses a planned learning execution unit for a student. The actual work remains a `StudySession` or practice evidence; “execution unit” describes the task's educational intent, not an execution record.

Planning answers: **What should happen?**

Rules:

- A task may be created by the student or an authorized counselor under the implemented provenance rules.
- Authorized counselors may see student-created personal learning tasks; personal and counselor-created sources remain distinguishable.
- Its lifecycle records the student's explicit planning outcome.
- Starting, finishing, cancelling, or reviewing execution does not automatically complete or skip it.
- An assessment attempt does not automatically complete it or rewrite its planned amount.

The target task intention references a canonical curriculum node, activity type, planned duration, planned questions, and expected learning outcome. Its result records completed/incomplete learning feedback, five-level learning quality, and optional notes/difficulty/problem description. These target fields are not all present in the current implementation.

## Execution Domain

`StudySession` records one actual study interval. It does not replace planning and is not a task status.

Execution answers: **What study actually happened?**

Rules:

- A task may have zero, one, or many study sessions.
- A study session may optionally retain task and subject provenance.
- Live, finished, and cancelled execution are represented by the implemented timestamp lifecycle.
- Cancellation preserves recovery/history information; it is not task cancellation.
- Study feedback is a raw student self-report on a finished session, not an assessment score, counselor judgment, or analytics result.

## Assessment Domain

`AssessmentAttempt` represents one completed assessment submission/result bundle. M19 is a general completed-attempt foundation, not a claim that all practice, external-report, or internal-exam workflows are implemented.

Assessment answers: **What assessment was completed, and what were its recorded facts?**

Rules:

- An assessment attempt is neither a `StudySession` nor a `DailyTask`.
- It may optionally retain task, subject, and topic provenance.
- It stores completed-attempt facts; the current foundation does not provide a live exam lifecycle.
- It does not require a study session. Test-only work, historical entry, and external exams must not generate fake study intervals.
- It does not automatically change task lifecycle or planned test count.

### Practice and Exercises

Practice is part of learning and may come from a textbook, help book, teacher material, or future question bank. It is a practice activity with no exam lifecycle. It must not be forced through internal online-exam start/delivery/submission semantics.

### External Exams

External exams such as قلمچی, ماز, گزینه دو, and گاج are owned by their providers. Konkourix records performance reports only, through a future report-image upload or structured entry of exam name, date, scores, percentages, notes, and counselor feedback. M19 does not yet provide this complete workflow.

### Internal Online Exams

Internal exams are future Konkourix-owned assessments. Their delivery domain depends on a moderated Question Bank, Exam Builder, timed Online Assessment, and answer evaluation. This lifecycle is separate from both practice and external-exam reporting.

## Relationship Semantics

```text
DailyTask (planned intention)
  |-- 0..N StudySession       (optional task provenance; actual study)
  `-- 0..N AssessmentAttempt  (optional task provenance; completed assessment)

StudySession and AssessmentAttempt are independent sibling records.
Either may exist without a DailyTask link where the approved workflow permits it.
```

The lines above express optional provenance, not inheritance, containment, or a required execution sequence. In particular, `AssessmentAttempt` never depends on `StudySession`.

## Cross-Domain Flow

```text
Planning intention
      |
      +--> study evidence --------+
      |                            |
      `--> assessment evidence ----+--> later review and improved planning
```

Measurement may combine evidence at a future read/reporting layer, but the underlying records remain separate. A reporting requirement is not permission to merge write models.

## Canonical Deep Curriculum Domain

Konkourix uses one centrally managed canonical curriculum tree. Users reference it but cannot create, rename, move, or delete its nodes.

```text
Curriculum
|-- رشته
|   `-- درس
|       `-- فصل
|           `-- بخش
|               `-- مبحث
|                   `-- مفهوم / ریزمبحث اتمیک
```

Example:

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

Domain experts manually curate this tree through a controlled management workflow. AI may later read canonical data for analysis, recommendations, weak-point detection, and learning assistance, but it must never generate or modify the canonical curriculum.

The canonical tree supplies stable educational references to planning, study tracking, student progress, practice, assessments, future questions, online exams, content, counselors, teachers, and schools. It supports تجربی, ریاضی, انسانی, and additional future tracks without giving each user a private curriculum structure.

### Current Implementation Mismatch

The repository currently has student-owned `StudySubject` and `Topic` records and user-facing creation/editing workflows. They are a transitional implementation foundation, not the accepted canonical architecture. No schema or behavior changes occur in this documentation task; migration and compatibility rules must be designed before implementation.

## Student Topic Progress Layer

Student-specific customization is stored as progress linked to a canonical node:

```text
Canonical Curriculum
        |
        `-- Student Topic Progress
```

The target progress layer contains:

- mastery level from 1 through 5;
- learning status;
- notes;
- review dates;
- weaknesses;
- strengths;
- last activity.

Approved learning statuses are شروع نشده, در حال یادگیری, نیازمند مرور, مسلط, and ضعیف.

```text
Student: Ali
Topic: Infinite Functions
Status: ضعیف (Weak)
Mastery: 2/5
Note: Needs teacher explanation
```

Progress may change per student. The referenced canonical node does not.

## Future Question Bank Linkage

Every future question links to one or more canonical nodes deeply enough to identify the concepts it assesses. For example: Math → Function → Infinite Functions. The accepted relationship is many-to-many so one question may assess multiple concepts and one node may classify many questions. This provides precise search, exam generation, weakness analysis, and targeted practice.

Teacher contribution is not direct publication. The workflow is submission → educational, solution, copyright, and curriculum-link review → approval → published question version. Whether a primary node is required, whether an atomic node is mandatory, and whether ancestor links are stored or derived remain explicit unresolved details in [QUESTION_BANK_ARCHITECTURE.md](QUESTION_BANK_ARCHITECTURE.md).

## Versioned Counselor Planning

Counselor planning is an authored and published domain, not merely task entry. Counselors prepare draft revisions, publish immutable plan versions, and revise future schedule blocks, workload, activity, and curriculum references. Students execute the published intention and report reality; they cannot edit counselor-authored plan content.

Execution and assessment evidence retain the published plan/version context that governed the work. A later plan revision never moves, relabels, or deletes historical evidence. Student-created personal tasks remain a separate attributed source.

## Communication Domain

Communication contains three separate capabilities:

- **General Chat:** lightweight relationship-scoped conversation;
- **Ticket / Thread:** structured, resolvable study, plan, report-review, or technical issues;
- **Suggestion:** governed curriculum, question, or product-improvement submissions.

Contextual links may connect a message, ticket, or suggestion to another domain record, but Konkourix does not create an entity-specific chat for every object. Private Counselor Notes are confidential counselor/admin records and are not a communication channel.

## Counselor Relationship and Private Notes

A student may register without a counselor. Counselor acquisition occurs through an invitation code or through a student request reviewed by a Super Admin, who evaluates conditions and introduces suitable counselors for the student's final selection. There is no automatic matching.

Private Counselor Notes record counselor-only behavior observations, weaknesses, and reminders. They are visible only to the owning counselor and specifically authorized admins. Ending or changing a relationship does not automatically transfer private notes.

## Boundary Invariants

- Planned intention and actual execution are never merged.
- Study and assessment are never merged.
- No execution or assessment event automatically decides a task outcome.
- A test attempt never requires a fake study session.
- Future analytics may read across domains but should not become the owner of their source facts.
- External-exam ingestion and an internal online assessment engine are different capabilities even if both produce assessment evidence.
- Practice activity, external performance reporting, and internal online exam delivery remain separate concepts.
- Published plan versions and historical execution remain immutable; future planning changes create revisions.
- Students never rewrite counselor-authored plan content.
- General chat, tickets, suggestions, private notes, and audit logs remain separate.
- Counselor introduction is human-reviewed and student-selected; there is no automatic matching.
- User-specific progress never modifies the canonical curriculum.
- AI never authors or changes canonical curriculum data.
