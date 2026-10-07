# Assessment Architecture

**Status:** Approved target architecture; not implemented beyond the completed-attempt foundation
**Last synchronized:** 2026-10-07

Konkourix separates practice, external exam reporting, and internal exam delivery. They may contribute evidence to later reporting, but they do not share one write lifecycle.

## 1. Practice

Practice is a daily learning activity using textbooks, help books, teacher material, or approved question-bank content.

- It belongs to learning and execution, not exam delivery.
- It may record planned and actual question counts, source material, curriculum references, time, and student feedback.
- It has no exam publication, timed delivery, submission, proctoring, or answer-evaluation lifecycle.
- Practice may exist with or without a `StudySession`, according to the approved workflow; fake sessions are never manufactured.

## 2. External Exam Report

An external exam is owned and delivered by another provider, such as Ghalamchi, Maz, or Gaj. Konkourix records a report only.

- The provider owns exam content, timing, delivery, scoring, and ranking.
- Konkourix may record provider, exam identity/date, uploaded report evidence, structured counts or percentages, student notes, and authorized counselor review.
- An uploaded image is evidence, not an internal exam definition.
- Corrections and invalidation apply to the report record, not the provider's exam.
- Provider-specific ingestion adapters must not become dependencies of the internal exam engine.

## 3. Internal Konkourix Exam

An internal exam is authored, assembled, delivered, and evaluated by Konkourix. Its domain includes:

```text
Moderated Question Bank
        -> Exam Builder and immutable exam version
        -> Question Selection
        -> Student Exam Attempt
        -> Answer Evaluation
        -> Result
```

Internal exam design must distinguish the exam definition, published exam version, delivery/session state, question presentation, submitted answers, evaluation, and result. A result must remain reproducible against the exact exam and question versions delivered.

## Separation Invariants

- Practice never acquires an internal exam lifecycle merely because questions are counted.
- External reports never create internal exam definitions, delivery sessions, or answer records.
- Internal exam delivery never depends on external provider semantics.
- A shared reporting layer may compare evidence but cannot merge or own the source write models.
- None of the three automatically completes a `DailyTask` or creates a `StudySession`.
- All curriculum references use published canonical curriculum data.

## Current `AssessmentAttempt` Compatibility

The implemented `AssessmentAttempt` stores one completed result bundle with raw counts and timestamps. It remains valid current behavior, but it is not the final write model for all three assessment capabilities. Before expansion, a compatibility decision must determine which existing records can be classified safely, which remain generic legacy evidence, and how their immutable provenance is retained. No discriminator, migration, or inference is authorized here.

The current `/assessments` UI is also legacy, not the final Assessment UX. Its all-in-one form, legacy Subject/Topic selectors, old date-time interaction, old visual language, and simultaneous-input density are classified for a separate future rewrite. Useful backend records and history remain eligible for preservation; this architecture note does not authorize UI or domain implementation.

## Unresolved Implementation Details

- practice persistence and its relationship to planned units;
- external provider identity and import contracts;
- secure report upload/storage architecture;
- internal exam state machine and timing rules;
- answer evaluation and manual-review policy;
- result correction, invalidation, and appeal rules;
- reporting projections across the three domains.
