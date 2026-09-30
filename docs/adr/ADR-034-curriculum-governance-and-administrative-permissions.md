# ADR-034: Curriculum Governance and Administrative Permission Model

**Status:** HISTORICAL / SUPERSEDED by Recovery Foundation 1 and 2; not active authority
**Decision date:** 2026-09-17
**Related decisions:** ADR-007, ADR-024, ADR-025, ADR-033

This ADR is retained as history. Its governance and permission model belongs to the rejected runtime direction.

## Context and Problem

Canonical Curriculum is controlled master data shared by Planning, Student Progress, Tasks, Practice, Questions, Exams, and reporting. A curriculum error, unauthorized publication, silent mapping change, or history rewrite could therefore change the educational meaning of many downstream records.

Konkourix currently has only coarse account roles: `STUDENT`, `COUNSELOR`, and `ADMIN`. The `ADMIN` role is sufficient for current relationship administration, but it cannot safely express the distinct authority required to edit a draft, operate an import, resolve source ambiguity, review educational structure, publish an immutable version, approve mappings, inspect audit history, or manage those permissions. Treating every `ADMIN` as a Curriculum superuser would violate least privilege and make separation of duties impossible.

Curriculum governance also has different stages and owners. Import completion is not educational approval. Draft editing is not review. Review approval is not publication. A published correction cannot mutate the prior version. The permission model must preserve these boundaries while remaining practical for a small initial team and extensible to future operational roles.

## Decision

Konkourix will use server-enforced, capability-based authorization for Curriculum administration. Global account role remains an identity/access foundation, but it does not by itself authorize a Curriculum administrative action.

Curriculum capabilities are explicitly assigned, deny by default, and checked against:

- the authenticated actor;
- the requested operation;
- the target resource and Curriculum Version;
- the resource lifecycle state;
- any approved scope or separation-of-duty rule;
- exceptional-access conditions, when applicable.

Students and Counselors are read-only consumers of eligible published Curriculum. Teachers, contributors, ordinary support staff, integrations, and AI receive no mutation authority by implication. Anonymous published access, if ever desired, requires a separate product and security decision.

Functional roles below are permission bundles and governance responsibilities, not required additions to the current `UserRole` enum. One user may hold more than one bundle only through explicit assignment. Possessing one capability never implies another.

## Curriculum Roles

| Functional role | Responsibility | Permitted capability area | Cannot do by role alone |
| --- | --- | --- | --- |
| Published Curriculum Consumer | Use eligible published Curriculum in Student, Counselor, or approved product workflows | Read current and authorized historical published/superseded versions | Read drafts/import evidence/audit; mutate Curriculum |
| Curriculum Editor / Domain Expert | Author and correct educational structure in a draft | Read drafts; create/update/move/order/deprecate draft nodes and relationships with reason/provenance | Approve review, publish, approve mappings, manage permissions |
| Import Operator | Execute and monitor an approved source import into a draft | Register source/checksum, run/retry import, read import status/report and permitted source records | Resolve educational ambiguity, approve imported nodes, publish |
| Curriculum Issue Resolver | Decide quarantined source-structure and import issues within assigned authority | Record resolution, exclusion, classification, or return-for-more-evidence decisions | Rewrite immutable source evidence, publish, grant permissions |
| Curriculum Reviewer | Verify educational correctness, structure, provenance, lineage, mappings, and publication readiness | Read complete draft/review context; approve or reject the reviewed draft state with findings | Edit through the review action, publish unless separately authorized |
| Curriculum Publisher | Perform the final high-impact publication command | Read approved validation/review evidence; publish the exact reviewed draft state; supersede according to policy | Edit content, bypass blockers, manufacture review, mutate published data |
| Curriculum Mapping Reviewer | Approve cross-version and legacy mapping decisions | Review/approve/supersede mapping decisions with rationale and exact endpoints | Rewrite mapping endpoints or legacy/canonical source rows; transfer Progress automatically |
| Curriculum Auditor | Inspect governance history and approved evidence | Read permission-scoped Curriculum audit records and publication/import/mapping history | Mutate Curriculum or permissions |
| Curriculum Permission Administrator | Grant, revoke, scope, and review Curriculum capabilities | Manage explicit capability assignments and exceptional-access policy | Gain Curriculum content permissions automatically; erase access history |

The same person may perform multiple roles in a small team only when an authorized policy explicitly permits the combination. Editor, Reviewer, and Publisher remain separate capabilities even if assigned to one account. Production policy should prefer an independent reviewer; self-review or same-person review/publication requires an explicit exception, reason, and audit rather than occurring implicitly.

## Permission Boundaries

The implementation must preserve at least these conceptual permissions. Physical names and storage are implementation details.

| Permission boundary | Allowed behavior | Boundary conditions |
| --- | --- | --- |
| Published read | Read eligible published/superseded version, node, path, order, and permitted relationships | Never exposes draft notes, import evidence, issue resolution, or audit payloads |
| Draft read | Inspect a draft and its validation state | Does not imply edit or review authority |
| Draft edit | Change only an editable draft with reason/provenance and concurrency validation | Cannot mutate published/superseded versions or server-owned review/publication facts |
| Import operate | Register/run/retry imports against an authorized draft and inspect operational results | Cannot publish or automatically accept ambiguity |
| Import/source evidence read | Read exact source records and reports needed for assigned work | May be narrower than draft read where source material is restricted |
| Issue resolve | Record a governed decision for a quarantined issue | Cannot alter the original source record or silently dismiss a blocker |
| Review decide | Approve, reject, or request changes against an exact draft revision/validation result | Any material draft change invalidates the decision |
| Publish | Publish only the exact approved, valid, current draft state atomically | Cannot override blockers, stale review, or concurrency conflict |
| Mapping approve | Approve or supersede an exact cross-version or legacy mapping decision | No name-only match, endpoint rewrite, historical repointing, or automatic mastery transfer |
| Audit read | Inspect authorized append-only governance history | Does not permit mutation or unrestricted security-log access |
| Permission manage | Grant/revoke a specific capability and approved scope | Grants do not retroactively legitimize past actions; self-escalation is prohibited |

All administrative authorization is enforced by the API/domain boundary on every operation. UI visibility, possession of a route, client-supplied roles, import tooling, database access, or a prior successful request is not authority.

Capability assignments must support revocation and an auditable scope. The initial product may use a global Curriculum scope, but the authorization contract must not prevent later scoping by function, version, source program, or organization. No future scope may weaken published immutability or allow private curriculum forks.

## Draft, Review, and Publish Workflow

```text
Create/derive Draft
    -> authorized edit and/or import
    -> resolve or explicitly exclude permitted issues
    -> deterministic validation
    -> submit exact draft state for review
    -> Reviewer approves or rejects with findings
    -> Publisher verifies current approval and validation
    -> atomic publication
    -> prior/current versions remain queryable
```

Rules:

1. Editors and Import Operators work only in a draft authorized to them.
2. Submission to review identifies the exact draft revision or concurrency token and validation result.
3. Review approval is immutable evidence about that exact state. A material edit, mapping change, import, issue-resolution change, or changed validation input invalidates the approval and requires review again.
4. A rejected or changes-requested submission returns to draft work without deleting the version, findings, or prior audit. `Rejected` is a review decision/event, not permission to rewrite history.
5. Publication is a distinct explicit command. It requires an approved current review, no blocking validation issue, current concurrency state, an authorized Publisher, and an audit reason.
6. Publication is atomic. Partial nodes, relationships, mappings, or consumer visibility cannot appear.
7. Published and superseded snapshots are immutable. Later correction creates a new draft/version and, where applicable, a superseding mapping or lineage record.
8. A Publisher cannot bypass validation or convert an import directly into a published release.

## Import Ownership

An import is an administrative operation owned by the Canonical Curriculum domain, not by the person or tool that runs it.

- The Import Operator supplies an approved source artifact identity, checksum, target draft, and idempotency context.
- The importer preserves exact source records, order, provenance, ambiguity, and immutable outcome counts/report.
- Completion means the source was processed; it does not mean the resulting candidates are educationally accepted, reviewed, or published.
- The Import Operator cannot resolve an educational ambiguity merely by rerunning or changing parser behavior.
- Issue Resolvers and Reviewers make human decisions within their assigned authority. Original source evidence remains unchanged.
- Import tooling and service identities receive only the minimum machine capability required for their operation. They do not inherit a human `ADMIN` session or Publisher authority.
- Failed or retried imports remain auditable and idempotent. An operator cannot erase a failed run to conceal provenance.

Source artifact storage/access may require narrower controls than published Curriculum. This ADR does not authorize object storage, define copyright policy, or make source evidence generally readable.

## Audit Requirements

Curriculum governance audit is append-only and distinct from ordinary application logs and security-monitoring logs.

The Curriculum audit trail must record, as applicable:

- actor and effective capability;
- action and outcome;
- occurred time and request/correlation identity;
- target version, node, relationship, import, issue, source record, mapping, or permission assignment;
- reason and source/provenance;
- before/after values or an integrity-preserving reference to them;
- exact draft revision/validation/review state used for high-impact actions;
- exceptional-access or separation-of-duty exception reason;
- failure/rejection outcome when it forms part of the governance lifecycle.

At minimum, draft mutations, imports/retries, issue decisions, review submissions/decisions, validation results used for publication, publication/supersession, deprecation/retirement, mapping decisions, permission grants/revocations, and exceptional access are auditable.

Unauthorized probes and infrastructure failures belong primarily to security/operational logs, with redaction and retention appropriate to those systems. A Curriculum audit record must not be used as a chat message, editable note, or substitute for an immutable import report.

Audit readers are separately authorized. The system must not permit an actor to erase or rewrite the record of their own action. Retention, export, cryptographic sealing, and external archival mechanics require an operational policy, but future implementation must preserve durable traceability.

## Rejection and Correction Flow

### Draft and Review Rejection

- A Reviewer may approve, reject, or request changes with required findings/reason.
- Rejection preserves the draft, submitted state identity, validation report, reviewer, decision time, and findings.
- The draft returns to editable work only through the defined lifecycle transition. New edits create a new reviewable state; they do not alter the rejected evidence.
- A later approval must identify the corrected state and cannot reuse a stale approval.

### Import or Ambiguity Rejection

- A source candidate may be accepted, rejected, excluded, or left ambiguous according to authorized disposition.
- The raw source record, checksum, locator, and original issue remain immutable.
- Correcting a mistaken resolution creates a superseding decision and audit entry; it does not rewrite the original resolution invisibly.
- Blocking ambiguity continues to block publication until the effective authorized decision resolves or explicitly excludes it.

### Published Correction

- Published content is never corrected in place.
- A correction starts a new draft based on the appropriate published version, passes validation and review again, and publishes as a new immutable version.
- Compatible editorial correction may retain the logical Node ID; semantic change, split, merge, or type change follows ADR-033 identity and lineage rules.
- A mistaken approved mapping is superseded by a new mapping decision. Existing historical references keep their original endpoints.
- Audit correction creates a new audit record; no administrative correction deletes the original event.

## Relationship with the Existing `ADMIN` Role

The current `ADMIN` role remains valid for currently implemented administrative endpoints and behavior. ADR-034 does not silently revoke or broaden those contracts.

For Canonical Curriculum:

- `ADMIN` alone grants no draft, import, issue-resolution, review, publish, mapping, audit, or permission-management capability.
- Existing Admin accounts receive no automatic Curriculum capability during migration.
- Bootstrap assignments require an explicit reviewed process that identifies the initial Permission Administrator and records every initial grant.
- Curriculum route registration or UI visibility must not occur until capability enforcement exists; a temporary `requireRoles('ADMIN')` check is not an acceptable substitute for mutation operations.
- A Permission Administrator does not gain content administration automatically and cannot silently grant themselves additional capability.
- Emergency or break-glass access, if implemented, is time-bounded, reason-required, narrowly scoped, prominently monitored, and auditable. It does not permit published history mutation.

Future global roles may include platform or security administration, but they remain collections of explicit capabilities rather than universal educational authority.

## Alternatives Considered

- **Use the existing `ADMIN` role for every Curriculum action.** Rejected because it violates least privilege, prevents separation of duties, and exposes sensitive source/audit data unnecessarily.
- **Add one new `CURRICULUM_ADMIN` global role.** Rejected as the only authorization mechanism because editing, importing, reviewing, publishing, mapping, auditing, and permission management have different risk.
- **Let Editors publish their own drafts automatically.** Rejected because save/import success is not educational review or controlled publication.
- **Make two distinct people mandatory for every environment and action.** Rejected as an inflexible architecture rule. The system must support separation and require an explicit audited exception when approved policy permits combined duties.
- **Give import jobs Publisher authority.** Rejected because parsers cannot resolve educational ambiguity or approve their own output.
- **Encode permissions only in the Admin UI.** Rejected because the browser is not a security boundary.
- **Allow direct database maintenance as normal governance.** Rejected because it bypasses lifecycle, validation, audit, and immutable publication.

## Consequences

Curriculum operations become explainable, least-privileged, and auditable. A small team can combine explicitly assigned functions while preserving the semantic difference between edit, review, and publication. Future organizations can introduce narrower scopes without changing Curriculum ownership.

The model adds authorization and operational complexity. Capability assignment, revocation, bootstrap, testing, user support, and audit retention require dedicated implementation. Administrative interfaces must show effective authority and lifecycle state clearly. Publication may take longer because review and Publisher authority are explicit.

## Migration Impact

Adoption is additive. Current users, roles, sessions, Admin endpoints, `StudySubject`, `Topic`, and all historical product records remain unchanged.

Before Curriculum mutation APIs are enabled, implementation must add an approved capability-assignment mechanism, bootstrap process, server checks, authorization tests, and audit behavior. No existing `ADMIN` is auto-promoted. Published consumer reads may be made available to eligible authenticated roles only after Curriculum publication and contract approval.

This ADR does not settle the separate legacy Curriculum mapping/cutover/reconciliation/rollback policy. That policy remains a Phase 20 gate and must not be inferred from Curriculum administrative authority.

## Security Impact

- Deny by default and validate capability on every administrative read or command.
- Revalidate capability and exact resource state at high-impact commit time, especially publication and mapping approval.
- Prevent self-escalation, stale grants, confused-deputy service identities, and client-supplied capability claims.
- Restrict drafts, source artifacts, import reports, issue detail, mappings, and audit more narrowly than published Curriculum.
- Use explicit concurrency checks so a review or publication cannot target an unseen changed draft.
- Rate-limit and monitor imports, publication, permission changes, and repeated unauthorized access according to operational policy.
- Redact secrets and sensitive source payloads from ordinary logs while retaining governance evidence securely.
- Authorization failure must not disclose restricted resource existence or content.

## Future Extensibility

- Capability assignments may later support organization, source program, version, or functional scope without creating private canonical curricula.
- Workflow policy may later require two-person approval for selected versions, high-impact mappings, or production environments.
- Delegated school, teacher, partner, or contractor participation requires explicit capabilities and scope; affiliation never implies publication authority.
- Automated validation, import assistance, or AI may propose findings but cannot hold human review/publish authority or mutate published data.
- Curriculum governance capabilities remain separate from Question Bank, Exam, Communication, Counselor Operations, private-note, and Security/Audit capabilities.
- Service extraction, if ever justified, must preserve the same authorization decision, lifecycle, audit, and immutable publication semantics.

## Future Constraints

- Every Curriculum mutation and restricted administrative read is server-authorized by explicit capability and state.
- Existing `ADMIN` is never treated as universal Curriculum authority.
- Draft edit, import, issue resolution, review, publish, mapping approval, audit read, and permission management remain independently grantable.
- Import completion, review approval, and publication are separate events.
- Material changes invalidate prior review approval.
- Published and superseded Curriculum remains immutable regardless of actor capability.
- Permission changes and exceptional access are auditable and cannot be erased by their actor.
- Students, Counselors, ordinary contributors, integrations, and AI cannot mutate Canonical Curriculum.
- This governance model cannot be used to bypass the separate legacy mapping/cutover policy or any later domain's authorization decision.
