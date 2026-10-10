# Konkourix Product Vision

**Status:** LEGACY / SUPERSEDED PRODUCT-VISION SNAPSHOT
**Last synchronized:** 2026-10-02

[PRODUCT_MAP.md](PRODUCT_MAP.md) now defines the canonical product. This file is retained as historical context only and must not be used as a parallel product source of truth. Its narrower exam-preparation framing and any conflicting future-capability statements are superseded by the Product Map. [ROADMAP.md](ROADMAP.md) governs current sequencing.

Konkourix is a specialized exam-preparation ecosystem. Its purpose is to help students carry out and improve exam preparation while giving counselors an efficient way to plan, monitor, and guide that work.

Konkourix is not a generic todo application, generic planner, habit tracker, or generic learning management system. Planning features exist only in service of educational preparation and execution.

## Core Product Loop

```text
Plan -> Execute -> Measure -> Improve
```

- **Plan:** turn curriculum goals into clear educational intentions.
- **Execute:** record the study work that actually happens.
- **Measure:** record study feedback and completed assessment evidence without conflating their domains.
- **Improve:** use evidence to adjust later plans and guidance. Advanced analytics or AI are not required for this loop to be useful.

## User Priorities

### Priority 1 — Students

Help students execute and improve their exam preparation. Student workflows should reduce administrative effort and make the next useful action obvious.

### Priority 2 — Counselors

Help counselors plan efficiently, monitor relevant evidence, and guide students. Counselor tools should increase planning speed without turning counseling into form administration.

### Priority 3 — Educational Content and Online Classes

Educational content, recorded classes, and live classes are future directions. They are not part of the current product baseline.

### Priority 4 — Schools and Organizations

School accounts, organizational dashboards, and additional institutional roles are future directions. They are not part of the current product baseline.

## Post-Exam Direction

Post-exam services are a possible future direction, not a current priority. Core domain boundaries should remain reusable and extensible enough that this direction is not blocked, but no post-exam feature or abstraction should be added speculatively.

## Current Product Boundary

The implemented foundation covers student and counselor web applications, authentication and authorization, planning through `DailyTask`, study execution through `StudySession`, and completed assessment evidence through `AssessmentAttempt`.

The finalized target architecture adds a centrally managed deep curriculum and student-specific progress overlay. These are approved directions but are not implemented by M19. The current user-created student subject/topic foundation is transitional and must not be treated as the canonical curriculum design.

The finalized counselor direction adds counselor-authored, explicitly published, versioned plans whose future blocks can be revised without rewriting historical intention or execution. Students report reality and may add visibly personal tasks; they do not rewrite counselor-authored plans.

Communication is a future bounded capability with three distinct purposes: lightweight general chat, structured ticket/thread work, and governed suggestions. Konkourix does not create a separate chat channel for every task, plan, assessment, or curriculum object.

The following are explicitly **not current**: AI analysis, an analytics platform, ranking, a question bank, online exams, live classes, school management, payments, a marketplace, and a post-exam ecosystem. Their mention in product documents records direction only; it does not authorize implementation.

## Product Guardrails

- Preserve the domain loop and keep planned intent, study execution, and assessment evidence separate.
- Optimize current work for students first and counselors second.
- Use one domain-expert-curated canonical curriculum shared by planning, execution, progress, assessment, future questions, and content. Users and AI do not create or modify its structure.
- Put student customization in progress tracking—mastery, learning status, notes, review needs, strengths, weaknesses, and activity—not in private curriculum trees.
- Treat tasks as planned learning execution units with curriculum context, activity type, planned effort/questions, and an expected learning outcome; actual work remains separate execution evidence.
- Separate learning practice, external-exam performance reporting, and future Konkourix-owned online exams.
- Link future questions to multiple moderated canonical curriculum nodes while preserving question attribution, rights, versioning, and approval.
- Preserve immutable published plan history while allowing counselors to revise future schedules, workload, blocks, and curriculum references.
- Keep general chat, structured tickets, suggestions, audit history, and private counselor notes as different concepts.
- Allow students to register without a counselor; counselor acquisition uses invitation or human-reviewed introduction and never automatic matching.
- Allow future channels and business models without weakening current ownership and authorization boundaries.
- Add future capabilities when their product requirements are approved, not merely to make the architecture look future-ready.

See [DOMAIN_MAP.md](DOMAIN_MAP.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md), [CANONICAL_CURRICULUM_SPECIFICATION.md](CANONICAL_CURRICULUM_SPECIFICATION.md), [PLANNING_ARCHITECTURE.md](PLANNING_ARCHITECTURE.md), and [ROADMAP.md](ROADMAP.md) for the corresponding domain, decision, and delivery baselines.
