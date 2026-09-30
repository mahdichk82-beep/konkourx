# Konkourix Repository Governance

These rules apply to every human or automated implementation agent working in this repository.

## Decision Authority

1. The Product Owner is the final decision-maker for product behavior, educational content, scope, and unresolved product choices.
2. The architect defines the approved scope, constraints, and acceptance conditions of each milestone.
3. Codex implements only the approved milestone scope. A future plan, architecture document, historical checkpoint, or proof of concept is not implementation authorization.
4. Ambiguity means stop and report. Do not invent product behavior, data semantics, permissions, UX, educational structure, or scope.

## Protected Boundaries

5. Do not change Curriculum educational content without explicit Product Owner approval. `cori.docx`, governed by `docs/CURRICULUM_SOURCE_OF_TRUTH.md`, is authoritative; runtime models are projections.
6. Do not add an unapproved Student-facing capability, workflow, or major visual or interaction change. Return it to the Product Owner as a Decision Gate.
7. Do not create or execute a destructive database migration without explicit architect approval. Never rewrite applied migration history.
8. Do not expand product scope because a future architecture document, roadmap entry, historical milestone, or dormant code path mentions a capability.

## Documentation State Labels

9. Product and architecture documentation must distinguish these states explicitly:

   - `CURRENT IMPLEMENTED STATE`
   - `APPROVED FUTURE STATE`
   - `EXPLORATORY / DEFERRED`

Documentation must not present an approved future design as implemented or an exploratory direction as approved.

## Milestone Closeout

10. Every milestone report must end with all of the following, including `NONE` where applicable:

    - changed files;
    - database and migrations;
    - API changes;
    - UI changes;
    - tests and validation;
    - remaining issues and decision gates;
    - exact `git status --short` output.

Do not continue into another milestone without explicit authorization.
