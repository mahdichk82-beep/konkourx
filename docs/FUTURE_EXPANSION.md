# Konkourix Future Expansion

**Status:** LEGACY / EXPLORATORY SUPPORTING NOTES
**Last synchronized:** 2026-10-02

This document preserves historical expansion ideas. Only capabilities included in [PRODUCT_MAP.md](PRODUCT_MAP.md) belong to the approved product vision, and only [ROADMAP.md](ROADMAP.md) defines delivery order. This file is not a product source of truth, feature specification, delivery commitment, or authorization to add entities, APIs, UI, infrastructure, or integrations.

## Expansion Rule

Future capabilities should extend the stable Planning, Execution, Assessment, and curriculum boundaries without rewriting or merging their core meanings. The modular monolith may gain explicit modules first; service extraction is optional and evidence-driven.

All learning-domain expansion uses the centrally managed canonical curriculum. User-owned curriculum branches and AI-authored curriculum are outside the accepted architecture.

## SEO and Public Website

A future public website may provide articles, educational content, landing pages, and organic-search acquisition. Public publishing and SEO concerns should remain separate from authenticated student/counselor workflows and authorization.

## Counselor Ecosystem

Possible future capabilities include counselor registration, public counselor profiles, student acquisition, and a marketplace. Identity verification, commercial rules, discovery, and marketplace governance require separate decisions; none are current.

## Student Acquisition

Students may eventually discover and use Konkourix without first belonging to a counselor relationship. The current student-first product boundary and self-owned records should remain usable without making counselor assignment a universal domain requirement.

## Online Education

Future education capabilities may include live classes, recorded classes, and educational content. Content should reference canonical nodes so learners can connect material to plans, progress, practice, and assessment without content delivery taking ownership of those facts.

## Schools and Organizations

Possible future capabilities include school accounts, school dashboards, teacher roles, and organizational administration. Schools, teachers, and counselors share canonical curriculum references rather than creating incompatible taxonomies. Multi-organization scope and permissions must still be designed explicitly and must not be inferred from the current counselor relationship.

## External Exams

Future external-exam support may accept either report images or structured results with exam name, date, scores, percentages, student notes, and counselor feedback for providers such as قلمچی, گزینه دو, گاج, and ماز. Konkourix reports performance but does not own or deliver these exams. External ingestion and a future internal online assessment engine are distinct modules even if both ultimately produce assessment evidence.

## Question Bank and Internal Exams

A future question bank depends on canonical curriculum and controlled moderation. Questions link to canonical subject/topic/atomic-concept nodes for precise search, exam generation, weakness analysis, and targeted practice. A teacher may submit a question, but only an admin-approved question enters the bank.

Internal online exams are owned by Konkourix and require:

```text
Question Bank
      |
Exam Builder
      |
Timed Online Assessment
      |
Answer Evaluation
```

Practice from textbooks, help books, teachers, or the question bank remains a learning activity without this exam lifecycle.

## Post-Exam Services

Post-exam services are possible but are not a current priority. They should be introduced through new explicit domains when requirements exist, not by stretching `DailyTask`, `StudySession`, or `AssessmentAttempt` beyond their established meanings.

## Explicitly Not Current

- AI analysis
- analytics platform
- ranking
- question bank
- online exams
- live classes
- school management
- payment system
- marketplace
- post-exam ecosystem

Subscriptions are also future roadmap work; their mention does not imply that payment, billing, or entitlement architecture is approved.

## Compatibility, Not Speculation

“Architecture should support expansion” means preserving clear domain boundaries, stable identifiers, canonical curriculum references, backend authorization, and modular ownership. It does not mean building unused abstractions, provider integrations, tenancy models, payment layers, or distributed services now.
