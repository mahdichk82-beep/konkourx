# Konkourix Architecture

**Status:** Current architecture baseline
**Last synchronized:** 2026-10-02

This document defines technical architecture within its domain. [PRODUCT_MAP.md](PRODUCT_MAP.md) defines product behavior, [ROADMAP.md](ROADMAP.md) defines sequencing, and [PROJECT_STATE.md](PROJECT_STATE.md) defines implemented reality. Architecture must not override them.

## Architecture Style

Konkourix begins as a modular monolith in a pnpm monorepo. The API is one deployable Fastify application backed by one PostgreSQL database, while Student Web and Counselor Web are independent browser applications.

Logical domain boundaries should be explicit in code and documentation, but they are not separate microservices today. A domain may be extracted later only when scaling, ownership, reliability, or deployment evidence justifies the operational cost.

## Current System

```text
Student Web ---------+
                     +--> Fastify API --> Prisma --> PostgreSQL
Counselor Web -------+
```

| Layer | Current technology and boundary |
| --- | --- |
| Student frontend | Independent React + TypeScript + Vite application |
| Counselor frontend | Independent React + TypeScript + Vite application |
| Backend | Node.js + TypeScript + Fastify API under `/api/v1` |
| Persistence | PostgreSQL |
| Data access and migrations | Prisma |
| Repository | pnpm monorepo |

The current repository locations are `apps/student-web`, `apps/counselor-web`, `apps/api`, and `database/prisma`. Production container and edge foundations exist, but production runtime verification remains incomplete as documented in [PROJECT_STATE.md](PROJECT_STATE.md).

## Product Domain Boundaries

The core product loop is implemented through three separate domains:

- **Planning:** `DailyTask` records educational intention.
- **Execution:** `StudySession` records actual study intervals.
- **Assessment:** `AssessmentAttempt` records completed assessment submissions.

These entities may retain optional provenance links, but no link changes their meaning. `StudySession` does not decide task completion. `AssessmentAttempt` does not become a study session and does not require one. The authoritative semantics are in [DOMAIN_MAP.md](DOMAIN_MAP.md).

Canonical curriculum is a centrally governed reference domain beneath Planning, Execution, Assessment, student progress, and future content/question capabilities. Users never own or edit curriculum structure. Student customization is stored separately as progress linked to canonical nodes.

Target domain relationship:

```text
                         Canonical Curriculum
                         /    |      |      \
                  Planning  Progress Practice  Assessment
                     |                         /         \
                StudySession        External Reports  Internal Exams
                                                     (future)
```

The diagram shows reference relationships, not service boundaries. The modules remain within the modular monolith unless later evidence justifies extraction.

### Canonical Curriculum Boundary

The canonical tree is centrally managed from رشته through درس, فصل, بخش, مبحث, and مفهوم/ریزمبحث اتمیک. Domain experts curate it manually. Students, counselors, teachers, schools, tasks, progress records, questions, assessments, and content may reference canonical nodes but cannot fork or mutate them.

AI access is read-only at the curriculum boundary. Future AI may consume approved nodes for analysis, recommendations, weak-point detection, and learning assistance; it must not create or modify curriculum structure.

### Student Progress Boundary

Student Topic Progress stores student-specific mastery (1–5), learning status, notes, review dates, weaknesses, strengths, and last activity against canonical nodes. This layer owns personalization. Curriculum owns educational taxonomy.

### Task and Activity Boundary

`DailyTask` is a planned learning execution unit, not a generic todo and not proof that execution occurred. Its target planning contract references a canonical curriculum item, activity type, planned duration, planned questions, and expected outcome. A future task result records completed/incomplete learning feedback and five-level learning quality with optional notes, difficulty, or problem description.

Actual study intervals remain `StudySession` records. Session-level `studyQualityRating` and future task-level learning quality are different facts and must not be copied or inferred automatically.

Student-created personal learning tasks remain allowed and visible to authorized counselors. Personal and counselor-created tasks retain distinct provenance even though both reference the same canonical curriculum.

### Testing and Question Boundaries

- Practice/exercises belong to learning activity and have no exam lifecycle.
- External exams are provider-owned; Konkourix stores performance reports only.
- Internal online exams are future Konkourix-owned delivery flows built on a moderated Question Bank, Exam Builder, timed delivery, and answer evaluation.

Every future question has a many-to-many relationship with canonical Curriculum nodes. Question submission and approval are separate: a user may submit, but educational, solution, copyright, and Curriculum-link review is required before an approved version enters the bank. A Primary Curriculum Link is optional for display/grouping; ancestor storage/derivation and other lower-level linkage mechanics remain implementation design concerns governed by [PRODUCT_MAP.md](PRODUCT_MAP.md).

### Versioned Planning Boundary

Counselor plans use editable drafts and immutable published versions. A counselor may revise future blocks, workload, activity, and curriculum references through a new revision. Students execute and report against the published intention but cannot rewrite counselor-authored content. Historical execution retains the plan/version context that governed it and is never rewritten by a later schedule change.

### Communication Boundary

General Chat, Ticket/Thread, and Suggestions are separate modules with different lifecycles. Contextual references do not create chat per entity. Private Counselor Notes are a fourth, confidential counselor/admin capability and are not surfaced through student communication.

### Counselor Acquisition Boundary

Student registration does not require counselor assignment. Assignment may follow an invitation-code flow or a student request reviewed by a Super Admin. Human review introduces suitable counselors and the student makes the final selection; automatic matching is outside the accepted architecture.

## Application Boundaries

### Student Web

The student application is the primary product surface. It owns student-facing planning, execution, feedback, and completed-attempt interactions while relying on the API for authoritative identity, ownership, and persistence.

### Counselor Web

The counselor application is a separate surface for assigned-student access, planning, monitoring, and future guidance workflows. It does not gain permission from client-side visibility; counselor authorization and active assignments are enforced by the API.

### Fastify API

The API owns authentication, authorization, validation, domain invariants, concurrency boundaries, and persistence orchestration. Browser-supplied roles, owners, creator identities, and lifecycle timestamps are not authoritative where the server owns those facts.

### PostgreSQL and Prisma

PostgreSQL is the authoritative product data store. Prisma is the current ORM and migration system. Applied migration history is preserved; future database change is additive and separately authorized.

## Data and Lifecycle Principles

- Source facts are stored in their owning domain.
- Cross-domain reporting should read and compose those facts without collapsing write models.
- Task outcomes remain explicit planning decisions.
- Server timing and ownership remain authoritative for live study execution.
- Completed assessment facts remain independent from the live study timer lifecycle.
- Soft invalidation or cancellation preserves relevant history rather than silently rewriting it.
- Canonical curriculum facts and student progress facts have different owners and lifecycles.
- External exam reports and internal online exam delivery use separate workflows.
- Published plan versions, draft revisions, actual execution, and audit records have different owners and lifecycles.
- Communication channels and private counselor notes remain separate from operational domain facts.

## Security and Authorization

Student and counselor applications are separate entry points, but separation in the browser is not a security boundary. The Fastify API enforces authenticated role, resource ownership, and student-counselor relationship constraints. See [DECISIONS.md](DECISIONS.md) and [SECURITY.md](SECURITY.md) for the established technical policies.

## Evolution Rules

- Keep the modular monolith until measured needs justify extraction.
- Preserve planning, execution, and assessment boundaries in APIs, persistence, and user language.
- Implement the approved canonical curriculum before student progress, question-bank, online-exam, or advanced analytics foundations.
- Preserve domain-expert curriculum governance and prohibit user or AI curriculum mutation.
- Use canonical node references so schools, teachers, counselors, questions, exams, and educational content can expand without redesigning the core taxonomy.
- Do not introduce generic abstractions solely for SEO, content, schools, payments, marketplaces, or post-exam possibilities.
- Do not let future external-exam import become coupled to a future internal online assessment engine.
- Do not collapse practice, external reports, and internal exams into one write lifecycle.
- Do not implement entity-specific chat or use messages as plan, curriculum, assessment, or audit state.
- Do not destructively replace legacy subject/topic data during canonical curriculum adoption.
- Prefer new modules and explicit integration contracts over rewriting core domains.

## Current-to-Target Gap

The implemented repository still permits student-owned subject/topic creation and editing. It does not yet contain canonical curriculum management, Student Topic Progress, versioned counselor plans, practice-activity storage, task-level learning-result feedback, a question bank, an exam builder, online assessment delivery, separated communication modules, counselor acquisition workflows, or private counselor notes. M19 provides only the completed `AssessmentAttempt` foundation.

These gaps are documented to prevent current storage from being mistaken for the finalized architecture. Closing them requires separately authorized application and data-design work; this documentation synchronization changes no runtime behavior or schema.

## Documentation Authority

Use the documentation set by concern:

- [PRODUCT_MAP.md](PRODUCT_MAP.md): canonical product identity and behavior
- [DOMAIN_MAP.md](DOMAIN_MAP.md): domain meaning and invariants
- [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md): product-architecture decision history
- [DECISIONS.md](DECISIONS.md): technical ADR history
- [API.md](API.md): implemented HTTP contracts
- [PROJECT_STATE.md](PROJECT_STATE.md): verified implementation and operational state
- [ROADMAP.md](ROADMAP.md): completed foundations and deferred directions
- [CANONICAL_CURRICULUM_SPECIFICATION.md](CANONICAL_CURRICULUM_SPECIFICATION.md): canonical hierarchy, governance, releases, and legacy compatibility
- [PLANNING_ARCHITECTURE.md](PLANNING_ARCHITECTURE.md): counselor plan versions, revisions, and historical preservation
- [ASSESSMENT_ARCHITECTURE.md](ASSESSMENT_ARCHITECTURE.md): practice, external reports, and internal exams
- [QUESTION_BANK_ARCHITECTURE.md](QUESTION_BANK_ARCHITECTURE.md): question versioning, rights, moderation, and curriculum linkage
- [COMMUNICATION_ARCHITECTURE.md](COMMUNICATION_ARCHITECTURE.md): chat, tickets, and suggestions
- [COUNSELOR_ECOSYSTEM.md](COUNSELOR_ECOSYSTEM.md): acquisition flows and private counselor notes

When documents appear to conflict, implemented facts in `PROJECT_STATE.md` and `API.md` constrain current behavior; accepted decisions in the domain and decision documents constrain future design. Historical milestone text remains evidence of its time and does not override a later explicitly superseding decision.
