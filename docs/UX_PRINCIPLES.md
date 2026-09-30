# Konkourix UX Principles

**Status:** APPROVED UX DIRECTION
**Last synchronized:** 2026-09-30

Konkourix should feel calm, motivating, simple, and progress-oriented. It must behave like a specialized educational planning ecosystem, not a generic task manager, CRM, administrative dashboard, or data-entry system.

## CURRENT IMPLEMENTED STATE

Both web applications have authenticated shells, Persian/RTL foundations, reusable loading/error states, and light/dark theme foundations. Student planning, task lifecycle, study execution, assessment-attempt tracking, and selected counselor task workflows are implemented. Existing dashboards and several navigation destinations remain incomplete or placeholder. These principles describe approved direction and do not claim full current conformance.

## APPROVED FUTURE STATE

### Product Experience

- Persian-first RTL is the default experience.
- Lead with the student's next meaningful action.
- Show progress and evidence in language students and counselors understand.
- Ask only for information needed at that moment.
- Prefer progressive disclosure over unnecessary density and long forms.
- Keep planning, studying, assessment, reporting, and communication visually and verbally distinct.
- Treat errors and recovery as calm, normal states rather than punishment.
- Preserve accessibility, contrast, focus visibility, and readable RTL behavior.

### Experience by Role

The Student UI is action-oriented before analytics-oriented. It should continually answer: “What should I do now?”, “What did I actually do?”, and “What should improve next?” Immediate work and the current plan come first; analytics sit lower in the hierarchy. The visual tone is calmer and more motivational.

The Counselor UI may be denser and more operational. It prioritizes fast planning, assigned-student context, published-plan state, exceptions, and evidence. Density must support professional work rather than resemble a generic administrative console.

### Planning, Ownership, and Historical Truth

- Student-created tasks and counselor-created tasks have visible provenance.
- A counselor-created task is editable only by a counselor with the required authorization.
- A student may record actual execution that differs from the counselor's plan.
- The original counselor plan remains historically visible when execution differs or a later plan revision is created.
- Actual study evidence and intended plan data must not be silently rewritten into one another.
- A student may create personal tasks.
- A student may create non-curriculum personal or life time blocks, including gym, parties, appointments, school, rest, and similar commitments.
- Life blocks never become Curriculum nodes.
- Personal educational tasks may reference Curriculum; personal/life time blocks do not need to fabricate a Curriculum reference.

### Student Principle: Minimum Data Entry

Students should spend the minimum practical time entering data. Prefer contextual actions with sensible, server-safe defaults over abstract record creation.

Avoid a generic workflow such as:

```text
Create Task
Title
Description
Deadline
Category
Priority
```

Prefer an educational context such as:

```text
Today
10:00–11:00
Biology
Chapter 2
Start Study
```

The student should understand what to do, start quickly, recover safely from stale execution, and add optional feedback without completing a long administrative form. Assessment entry should capture only the facts needed for the current workflow.

### Learning Result, Not Checkbox Completion

When task-level learning feedback is implemented under an approved milestone, it should distinguish completion from learning quality and may include an optional student note or difficulty description. Task-level feedback is not the same record as an individual `StudySession` quality rating, and neither value may be silently derived from the other.

### Counselor Principle: Paper-Speed Planning

Counselor planning should feel like a digital version of professional handwritten exam planning: fast, spatially understandable, and optimized for repeated daily and weekly work rather than repeated form completion.

The experience should favor rapid repetition, keyboard-efficient entry, clear student context, and review before publishing. It may support repeated blocks, copied schedules, fast Curriculum selection, and clear separation between learning tasks and schedule-context blocks when those capabilities are approved and implemented.

Avoid long forms, excessive typing, one-record-at-a-time friction, and generic priority/category fields that do not help educational planning.

### Domain Language

- Use **plan/task** for intended educational work.
- Use **study session** for actual study time.
- Use **assessment attempt** for a completed test, quiz, or exam result.
- Use **practice** for learning exercises without an exam lifecycle.
- Distinguish **external exam report** from a future **Konkourix online exam**.
- Never present an assessment attempt as recorded study time.
- Never imply that finishing a timer automatically completes the educational intention.

### Measurement and Motivation

Raw evidence should be understandable before advanced interpretation is added. Current ratings and attempt counts are facts, not diagnoses, ranks, or AI conclusions. Future insights should explain their basis and support improvement rather than shame, overload, or manipulate the student.

### Visual Direction

The approved visual rules, tokens, role-specific density, theme behavior, illustration limits, and typography licensing boundaries are defined in [BRAND_IDENTITY.md](BRAND_IDENTITY.md) and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

### Product Owner Decision Gate

Any unapproved Student-facing capability, workflow, or major visual or interaction change must be returned to the Product Owner as a Decision Gate before implementation. UX principles do not authorize new product behavior.

## EXPLORATORY / DEFERRED

Exact components, information architecture, copy, animation, responsive behavior, accessibility acceptance criteria, task-revision UX, life-block persistence, and detailed planning interactions require separately approved milestones. Missing details must not be invented during implementation.
