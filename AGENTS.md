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

## Canonical Document Precedence

10. When repository documents conflict, use this order:

    1. `docs/PRODUCT_MAP.md` defines intended product behavior and scope: **what KonkourX is meant to become**.
    2. `docs/ROADMAP.md` defines approved implementation sequencing: **in what order KonkourX should be built**.
    3. `docs/DESIGN_SYSTEM.md` defines approved visual and design-system rules.
    4. `docs/PROJECT_STATE.md` defines what is actually implemented in the repository today.
    5. Technical, API, security, architecture, and Curriculum-specific documents define detailed truth only inside their domains and may not redefine product behavior or roadmap order.

`cori.docx` and `docs/CURRICULUM_SOURCE_OF_TRUTH.md` retain exclusive authority over Curriculum educational content. Historical and supporting product documents do not override the canonical documents above.

## Product Vision Anti-Drift

11. No milestone may redefine Konkourix as only the feature or surface currently implemented. The current implementation scope and the complete approved future product vision must always be documented separately.
12. A capability being deferred does not remove it from the approved future product vision.
13. Approved future product vision is not implementation authorization. Every implementation still requires an explicitly approved milestone and any applicable Student UX Decision Gate.
14. Roadmap position, architecture compatibility, historical code, reference material, or provider research does not authorize implementation or resolve an open Product Owner decision.
15. Do not silently change behavior defined by `docs/PRODUCT_MAP.md` during implementation. New user-facing behavior not already defined there must return to the Product Owner as a Decision Gate before implementation.

## Milestone Closeout

16. Every milestone report must end with all of the following, including `NONE` where applicable:

    - changed files;
    - database and migrations;
    - API changes;
    - UI changes;
    - tests and validation;
    - remaining issues and decision gates;
    - exact `git status --short` output.

Do not continue into another milestone without explicit authorization.
