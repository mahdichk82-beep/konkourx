# Identity, Profile, Professional Profile, School, and Task Domain Design

**Status:** SUPPORTING APPROVED DESIGN — partially implemented; later interaction decisions govern where noted

**Date:** 2026-10-05

**Milestone:** Identity / Profile / Professional Profile / School / Task Type

**Committed checkpoint inspected:** `81c428c6c8cf82917fc4bbcd97bb6ffafc7dfbc9`

This document separates the implementation state at its inspected checkpoint from the approved future domain state. It proposes additive, compatibility-safe domain boundaries only. It does not authorize implementation, schema changes, migrations, API changes, UI changes, data backfills, or canonical-document reconciliation.

**2026-10-07 interaction refinement:** [2026-10-07-planning-curriculum-interaction-design.md](2026-10-07-planning-curriculum-interaction-design.md) governs the later browse-only `/curriculum`, tri-state recursive Study Task Picker, historical `WHOLE` preservation, 24×4 read-only Daily Timeline, Profile visual status, Batch/Group distinction, Account/Security capability boundary, and Assessment UX classification. The identity, privacy, Student-track, TaskContentType, and historical-data boundaries here remain compatible supporting design.

## 1. Purpose

Define a durable boundary between authentication identity, private personal data, role-specific profile data, public professional identity, future organization membership, and task content type. The design must support a private Student experience, a public-by-explicit-publication professional identity for Counselors and future Teachers, canonical Curriculum-backed Study tasks, Curriculum-free General tasks, independent per-Student task lifecycles, and reports based only on verified data.

Success means that a future implementation can add these capabilities without exposing private data, guessing historical meaning, rewriting Curriculum identities, or coupling public professional identity permanently to the Counselor role.

## 2. Locked product decisions

The following decisions are requirements, not alternatives:

- `User` remains the authentication and account identity. It owns credentials, email/phone login identifiers, role, account status, and account timestamps—not biography, academic data, residence, school data, or public professional content.
- Student profile data is private. There is no public Student profile.
- `StudentProfile.track` is authoritative for Student and Counselor-bound Curriculum access. Track changes only through Student academic information; Planning, task creation, and Curriculum Browser expose no track selector.
- Counselor private profile data and public professional profile data are separate privacy domains.
- A public professional profile is an explicit whitelist and may serve Counselor directory/profile, a future Teacher directory/profile, article bylines, and SEO author pages.
- Teacher and Article implementation are out of scope. The design must preserve a clean extension path without adding Teacher or Article tables now.
- School is an Organization-domain concept, not a user-profile field or a permanent manager-name string.
- Profile is opened from the header identity/avatar trigger, not a sidebar navigation item. Subscription is absent until Billing exists.
- Task content type is persisted explicitly for new writes as `STUDY | GENERAL`. Historical tasks are not guessed or destructively backfilled.
- New Study tasks require one or more canonical Curriculum `NODE` targets and leave legacy Subject/Topic null. `PLACEMENT` remains compatibility-only.
- General tasks have no Curriculum targets. Title is required; description is supported but remains database-optional.
- `/curriculum` is the canonical user-facing “مباحث درسی” surface. `/study` and arbitrary Subject/Topic authoring are legacy compatibility concerns.
- Single-Student and cross-Student creation are different UI entry points over one task engine. Every Student receives an independent task row and lifecycle.
- The first recurrence capability should prefer finite repeat-by-expansion over a permanent recurrence engine.
- Reports remain navigation-level product surfaces, but only verified metrics may be shown. Exam redesign is separate.

## 3. Current-state constraints

### CURRENT IMPLEMENTED STATE

- `User` stores email, phone, password hash, role, status, timestamps, and sessions.
- `StudentProfile` stores nullable `track`, `educationLevel`, and `schoolName`.
- `CounselorProfile` stores nullable `bio` and `specialization`.
- No canonical first name, last name, preferred display name, or avatar reference is stored.
- Assigned-Student reads currently return no real display name.
- `DailyTask` has no content-type discriminator. A task can have zero Curriculum targets and nullable legacy Subject/Topic references.
- Curriculum task targets remain `NODE | PLACEMENT` with `EXACT | WHOLE`; `WHOLE` expands direct children.
- Date, paired exact start/end minutes, estimated minutes, and 15-minute validation exist in the backend.
- Current Counselor batch creation creates several independent tasks for one Student. It is not cross-Student assignment.
- No recurrence rule or series entity exists.
- `/reports` is a placeholder in both web applications. Existing task/session records can support a limited real v1 report after aggregation rules are defined.
- Billing/subscription, School organization, public professional directory, Teacher, and Article domains are not implemented.

### APPROVED FUTURE STATE

The models and contracts below describe the intended target boundary. The NOW/NEXT/FUTURE labels in this specification are sequencing recommendations for later approved milestones; they do not describe current implementation.

### EXPLORATORY / DEFERRED

Persistent recurrence (`TaskSeries`), Teacher, Articles, School organization/membership, Billing, media storage, public credentials, and advanced reporting remain deferred. Their compatibility boundaries are documented here, but their product behavior and implementation are not approved by this design artifact.

## 4. Identity domain model

The recommended model separates four responsibilities:

```text
User (authentication/account)
├── PersonProfile (private cross-role personal identity)
├── StudentProfile (private Student academic/role data)
├── CounselorProfile (private Counselor role data)
└── ProfessionalProfile (explicitly published professional identity)
```

`PersonProfile` is recommended instead of a generic `UserProfile`. “User profile” is easily confused with the Profile Center UI and tends to accumulate unrelated role data. `PersonProfile` has one narrow purpose: private personal identity shared by roles.

If a concrete private-profile workflow later needs residence context, `PersonProfile` may own coarse private `province` and `city` values. Exact personal street/address storage is not justified without a concrete product use case and must not be introduced speculatively. `ProfessionalProfile.publicCity` is an independently entered, explicitly public value; private province/city values are never copied into it automatically.

Proposed persistent concepts:

| Concept | Purpose | Owner and cardinality | Classification | Phase |
|---|---|---|---|---|
| `User` | Authentication, login identifiers, authorization role/status | One account; existing model | PRIVATE + INTERNAL | CURRENT |
| `PersonProfile` | Private person name and future private avatar reference | `User 1 → 0..1 PersonProfile`; owned by the account | PRIVATE | NOW |
| `StudentProfile` | Student academic and Student-role data | `User 1 → 0..1 StudentProfile`; existing role profile | PRIVATE | CURRENT; additive UX NEXT |
| `CounselorProfile` | Counselor-only private role details | `User 1 → 0..1 CounselorProfile`; existing role profile | PRIVATE | CURRENT |
| `ProfessionalProfile` | Explicit public professional identity | `User 1 → 0..1 ProfessionalProfile`; not owned by `CounselorProfile` | PUBLIC whitelist + INTERNAL publication data | NEXT |
| `ProfessionalProfileSpecialty` | Ordered public specialties, only if multiple structured specialties ship | `ProfessionalProfile 1 → 0..N` | PUBLIC when parent is published | NEXT, conditional |
| `ProfessionalProfileLink` | Validated ordered public links, only when link UX ships | `ProfessionalProfile 1 → 0..N` | PUBLIC when parent is published | FUTURE |
| `School` | Organization identity | Independent Organization-domain aggregate | mixed; explicit projection | FUTURE |
| `SchoolMember` | User-to-School membership and organization role | `School N ↔ N User` through membership | INTERNAL; membership may be disclosed only by policy | FUTURE |
| `DailyTask.contentType` | Explicit task content meaning | One nullable value per existing task; required for new canonical writes | INTERNAL/private task data | NOW |
| `TaskSeries` | Durable recurrence intent only if series operations become necessary | One series may generate many independent `DailyTask` rows | PRIVATE + INTERNAL | FUTURE, conditional |

No Teacher, Article, Billing, avatar-asset, credential, or SEO-content table is justified in the first implementation slice merely because future features may use one.

## 5. Student private profile

`StudentProfile` remains a private role extension. It owns:

- authoritative nullable `track` for existing-account compatibility;
- education level;
- current free-text school name until a real School domain exists;
- Student-specific fields added by separately approved milestones.

Shared personal names belong to `PersonProfile`, not `StudentProfile`, because names are person identity and may be needed consistently across roles. Account email/phone remain on `User`. Student academic data must never be returned by a public profile endpoint.

`track` remains nullable for historical accounts. Student-bound Curriculum reads derive it from the authenticated Student profile. Counselor-bound Curriculum reads derive it from the selected actively assigned Student. Absence produces the existing intentional “track not set” state; no request field, default, or inferred track substitutes for it.

## 6. Counselor private profile

`CounselorProfile` remains a private role extension. Existing `bio` and `specialization` are treated as private by default because they were not created under a public publication contract. A later migration may rename or deprecate ambiguous fields, but must not automatically publish or copy them.

Private Counselor concepts may include role-internal biography, specialization notes, private contact information, residence, and operational details. Their presence in a Counselor-facing form does not make them publishable. Shared private names live in `PersonProfile`; login email/phone remain on `User`.

## 7. Public `ProfessionalProfile`

`ProfessionalProfile` is a separate optional aggregate linked directly to `User`, not a projection of the whole private profile and not a child that can only belong to `CounselorProfile`.

It is opt-in and defaults to a non-public state. Creating a `CounselorProfile` does not create, populate, or publish a `ProfessionalProfile`. A professional profile begins as `DRAFT` or otherwise unpublished and becomes publicly readable only through an explicit publication action under the workflow approved for the future ProfessionalProfile milestone.

Conservative conceptual fields are:

```text
id                     stable professional-profile identity
userId                 unique owner link; never part of public DTO
publicDisplayName      required before publication
slug                   unique public locator
professionalTitle      optional public title
biography              optional public biography
publicCity             optional deliberately public location label
avatarRef              optional explicitly public media reference
publicationStatus      DRAFT | PUBLISHED | UNPUBLISHED
seoTitle               optional; only if SEO surface ships
seoDescription         optional; only if SEO surface ships
publishedAt            publication audit timestamp
createdAt / updatedAt  internal lifecycle timestamps
```

Specialties should be structured and ordered only when the directory/filtering UX needs multiple values. Credentials require their own evidence, verification, and ordering policy; they should not be added as an unvalidated free-form public claim in the first profile slice. Public links likewise wait for a validated link policy.

Publishing is opt-in. Creating or updating private Counselor data never creates, updates, or republishes a `ProfessionalProfile`. Unpublishing removes it from public reads without deleting private or authorship history.

The later publication workflow may permit Counselor self-publication or may require Admin/moderator approval; that choice remains open. Under either workflow, public APIs return only explicitly published whitelist fields.

## 8. Future Teacher compatibility

`ProfessionalProfile.userId` points to `User`, not to `CounselorProfile`. This permits a future professional role such as Teacher to use the same public identity without duplicating display name, slug, biography, or author identity.

Current publication authorization may require a Counselor account because that is the only active professional role. That is an application policy, not a relational ownership constraint. Adding Teacher later requires its own role/profile milestone and publication eligibility rule; this spec adds neither.

If a person eventually holds several professional capabilities, one public professional identity should normally represent that person. Role-specific directory facets can be added separately rather than cloning public profiles.

## 9. School / Organization architecture

### NOW

- Keep `StudentProfile.schoolName` as private, user-entered academic information.
- Do not interpret matching strings as the same School.
- Do not create a manager-name field or fabricate organization membership.

### NEXT

- No School persistence is required until a real organization workflow is approved.
- Define the product authority for creating/verifying Schools before adding a table.

### FUTURE

A `School` aggregate may own official/display name, type, province, city, address, contact information, description, and organization status. Each field receives an explicit privacy classification; address/contact are not public by default.

`SchoolMember` links `School` to `User` with an organization role such as `MANAGER` or `COUNSELOR`, membership status, and lifecycle timestamps. A manager is therefore an accountable User relationship, not a permanent arbitrary name string. Public School presentation, if ever needed, uses a separate whitelist projection.

No automatic conversion from `StudentProfile.schoolName` to a `School` or membership is allowed. A future linking flow must be explicit and independently verified.

## 10. Profile Center UX / domain mapping

Profile Center is a header-owned account surface, not a sidebar destination.

| Student section / source | Counselor section / source |
|---|---|
| اطلاعات شخصی — `PersonProfile`; login identifier summary from `User` | اطلاعات شخصی — `PersonProfile`; login identifier summary from `User` |
| اطلاعات تحصیلی — `StudentProfile`, including authoritative track | اطلاعات حرفه‌ای — private `CounselorProfile` role data |
| تنظیمات — client/account preferences with explicit persistence boundary | تنظیمات — same boundary |
| امنیت و حساب — password/session/account actions on `User`/auth services | امنیت و حساب — same boundary |

Mobile/tablet keeps hamburger on the right, page context centered, and a circular profile trigger on the left outside the drawer. Desktop uses a clickable identity area in the header. The compact account menu links to the applicable sections and logout. It does not duplicate profile fields in the menu itself.

The architecture reserves a Subscription area, but the product does not expose it until real Billing/entitlement data exists. It must not show fabricated plan, status, expiration, entitlement, or payment-history values. The only exception is a separately approved, explicitly labeled “coming soon” UX that makes no entitlement claim.

## 11. Privacy classification matrix

Definitions:

- **PRIVATE:** personal data available only to the subject and explicitly authorized product actors for a defined workflow.
- **INTERNAL:** operational identifiers, authorization relationships, moderation state, and service metadata not intended for public disclosure.
- **PUBLIC:** fields deliberately entered/approved for publication and emitted by a public whitelist projection.

| Concept / data | PRIVATE | INTERNAL | PUBLIC |
|---|---:|---:|---:|
| Account email, phone, credentials, sessions | Yes | Account operations only | Never |
| User ID, role, status | Not normally user-visible as profile content | Yes | Never by default |
| Person first/last/preferred name | Yes | Authorized identity display | Never automatically |
| Person private avatar reference | Yes | Authorized identity display | Never automatically |
| Private province/city | Yes | Authorized profile workflows only | Never automatically; public city is entered separately |
| Student track, level, school text | Yes | Authorized Student/Counselor workflows | Never |
| Counselor private bio/specialization/contact/location | Yes | Authorized Counselor operations | Never automatically |
| Professional owner `userId`, draft status, moderation/audit | Owner-visible as applicable | Yes | Never |
| Professional public display name/slug/title/bio/specialties/public city/public links/public avatar | Draft is private | Publication operations | Yes, only while published |
| School membership and organization role | Member/authorized organization users | Yes | Only under a later explicit policy |
| School address/contact | Yes by default | Organization operations | Only explicitly approved fields |
| Tasks, Curriculum targets, sessions, assessments, reports | Yes | Authorized Student/Counselor workflows | Never |

Authorization to view a Student for counseling does not convert Student data to PUBLIC. It is a scoped PRIVATE-data relationship enforced through active assignment.

## 12. Public API projection rules

Public reads must be safe by construction:

1. Query the `ProfessionalProfile` public projection directly and require `publicationStatus = PUBLISHED`.
2. Select an explicit allowlist of public columns. Do not load a broad `User + PersonProfile + CounselorProfile` graph and remove fields in frontend code.
3. Never return owner `userId`, email, phone, account status, private names, private avatar, private Counselor fields, or publication/moderation metadata.
4. Resolve public profiles by public profile ID or slug. Public clients do not need account IDs.
5. Directory and detail endpoints use the same projection function/DTO.
6. Article bylines reference the same public projection.
7. Draft and unpublished profiles return not-found semantics publicly, regardless of whether an owning account exists.
8. Any administrative projection is a separate authenticated contract and must not reuse the public DTO as proof that private access is safe.

## 13. Display-name ownership recommendation

Use three distinct concepts:

- `PersonProfile.firstName` and `lastName`: private personal identity.
- `PersonProfile.preferredName`: optional private in-product display preference.
- `ProfessionalProfile.publicDisplayName`: independently chosen, explicitly public professional name.

Do not place these on `User`, and do not derive the public name automatically from private fields. Authorized internal display follows: private preferred name → private first/last name → role label/login identifier fallback. Public display uses only `ProfessionalProfile.publicDisplayName`.

Existing accounts migrate with nullable name fields. The system must keep current safe fallbacks such as “دانش‌آموز بدون نام”; it must not expose UUIDs as human identity.

## 14. Avatar ownership / reference recommendation

Avatar binary storage, upload, transformation, and moderation are outside this design. When an asset service exists:

- `PersonProfile.avatarRef` may reference a private/account avatar used in authenticated UI.
- `ProfessionalProfile.avatarRef` is a separate explicitly public reference.
- The same asset may be selected for both, but publication requires an explicit action; no automatic copy occurs.
- `User` does not own avatar data.
- Until an asset contract exists, initials or role-safe visual fallbacks remain preferable to adding an unusable database column.

Therefore name persistence belongs NOW, while avatar reference persistence belongs NEXT with the media boundary that can enforce access.

## 15. Article / SEO authorship relationship

Future authorship uses one canonical relationship:

```text
Article.authorProfessionalProfileId
→ ProfessionalProfile.id
→ owning User / eligible professional role
```

There is no separate `ArticleAuthorProfile`. Article bylines and directory/profile links resolve the same published public identity. Article history must remain attributable if a profile is later unpublished; public rendering policy for that case belongs to the Article milestone. SEO metadata belongs to the public profile only when the public page ships and must not pull private account fields.

## 16. `TaskContentType` model

Add a conceptual persisted enum:

```text
TaskContentType = STUDY | GENERAL
DailyTask.contentType: TaskContentType?
```

The database field is nullable for historical compatibility. New canonical API writes require an explicit non-null value at the application boundary. Null means **historical/unclassified**, not General and not Study.

Content type is orthogonal to `source` (`PERSONAL | COUNSELOR`) and `status` (`PENDING | COMPLETED | PARTIAL | SKIPPED`). It describes what the task is about, not who created it or its execution outcome.

## 17. STUDY invariants

For the checkpoint implementation designed here:

- `contentType = STUDY` is explicit.
- There are 1–50 Curriculum targets under the current API limit.
- Every new target uses `referenceKind = NODE`.
- Each target uses `selectionMode = EXACT | WHOLE` under current direct-child `WHOLE` semantics.
- Every node is validated in the authoritative Student track/catalog context.
- `subjectId` and `topicId` are null.
- Catalog entry, grade group, track, and representation ID are never task targets.
- Track is derived from the authenticated Student or selected assigned Student; it is not accepted as authoritative task input.
- Snapshots and expanded execution items continue to be persisted as today.

`PLACEMENT` remains readable/executable for legacy records but is rejected for new canonical Study creation. No automatic `PLACEMENT → NODE` mapping occurs.

These target-count and selection-mode bullets do not define the approved future recursive Picker persistence model. The 2026-10-07 architecture Decision Gate preserves historical `WHOLE`, handles target limits explicitly, and selects a new snapshot-safe recursive-subtree contract. That contract remains documentation-only until a separately authorized implementation milestone.

## 18. GENERAL invariants

For every new General write:

- `contentType = GENERAL` is explicit.
- Title is required.
- Description is supported and nullable.
- Curriculum target input must be empty.
- `subjectId` and `topicId` are null for new canonical writes.
- Track is irrelevant and is neither requested nor persisted for task classification.
- Date-only, exact-time, estimated-duration, ownership, source, and status behavior use the shared task engine.

The backend rejects a General task that carries Curriculum targets; it does not silently drop or attach them. A Study task with no target is likewise rejected. “آزمون حضوری” may be a General task label without implying Assessment/Exam-domain integration.

## 19. Historical task compatibility

Existing rows receive `contentType = null`. They remain fully readable, schedulable, executable, and reportable under existing authorization and lifecycle rules.

The system must not infer:

- zero targets → General;
- Subject/Topic → Study;
- PLACEMENT → Study or NODE;
- title keywords → either type.

Historical task responses expose nullable content type and preserve existing legacy fields, targets, items, snapshots, sessions, assessment links, and outcome timestamps. A later deliberate classification action may set a type only when a human or explicit source policy provides evidence. Such classification must be audited and must not remap Curriculum.

Edits that do not change content meaning—status, execution, allowed scheduling changes—do not force classification. A future content conversion is a separate command with explicit validation, not an incidental PATCH side effect.

## 20. Legacy Subject / Topic policy

`StudySubject`, `Topic`, and their nullable references remain stored and readable for history, filters, sessions, assessments, and compatibility clients. Existing compatibility APIs remain until a separate retirement review proves they are no longer needed.

New canonical Study and General writes set both references to null. New user-facing task forms do not offer legacy Subject/Topic selection or creation. Historical displays may show legacy labels and archived states. No Subject/Topic is converted to a Curriculum node, and no canonical Curriculum node is created from user-authored legacy data.

## 21. Curriculum navigation transition

`/curriculum` becomes the single canonical user-facing “مباحث درسی” route. It continues to use authoritative profile-derived track and canonical catalog navigation.

`/study` becomes a legacy compatibility path. Transition order:

1. remove legacy Subject/Topic authoring from new-write Planning UX;
2. update navigation and dashboard links to one “مباحث درسی” item pointing to `/curriculum`;
3. preserve `/study` temporarily for explicit compatibility access or redirect it to `/curriculum` after historical-management needs are reviewed;
4. retain legacy backend entities and APIs;
5. route missing Curriculum content to a separate report/admin correction workflow in a later milestone.

The transition must not present user-authored Subject/Topic as canonical educational content.

## 22. Single-Student planning boundary

Single-Student Counselor creation remains under:

```text
دانش‌آموزان → Student detail → برنامه / وظایف → ایجاد کار
```

The command carries an explicit task template: content type, title, optional description, one date, optional exact-time pair, optional estimated duration, and type-valid Curriculum targets. Student identity is selected by the route/context and verified through active Counselor assignment. Track is derived by the backend only for Study target validation.

Student personal creation uses the same invariant service with the authenticated Student profile and `source = PERSONAL`. Counselor creation uses `source = COUNSELOR`. Both create one `DailyTask` with one independent lifecycle.

## 23. Multi-Student assignment boundary

True group assignment is a new command, distinct from the existing one-Student/many-task batch endpoint:

```text
POST /counselor/task-assignments/group
studentProfileIds: unique non-empty list
task: one explicit canonical task template
```

The service must:

- verify the Counselor has an active assignment to every selected Student;
- for Study assignments, validate the complete canonical target set against every selected Student’s authoritative track/catalog membership;
- validate authorization and Curriculum membership independently for each selected Student;
- permit General group tasks without consulting StudentTrack because General tasks carry no Curriculum targets;
- fail the command without creating tasks if any selected Student or Study target is invalid;
- create one independent `DailyTask` row per Student in a transaction;
- return the created task identity for each Student;
- never create a shared completion/status record.

Creation is atomic and never partially succeeds: if any selected Student cannot receive the Study target set, the service creates none of the tasks. After successful creation, every Student’s task has its own status, execution, scheduling, session, and completion lifecycle.

The initial synchronous endpoint should have a measured operational size limit. A group-operation record is not required merely to share lifecycle; if later audit, retry idempotency, or bulk cancellation requires durable command provenance, it may be added as metadata only, never as the task outcome owner.

The existing `/counselor/students/:studentProfileId/tasks/batch` keeps its current compatibility meaning: multiple independent tasks for one Student.

## 24. Exact-time scheduling

Keep the existing model:

- `scheduledFor` is the task date;
- `startMinuteOfDay` and `endMinuteOfDay` are either both null or both present;
- values align to 15-minute boundaries;
- end is after start on the same task date;
- `estimatedMinutes` is independent of the exact-time window.

Future forms may expose day-only or exact-range modes without changing the model. Rescheduling and group/repeat creation must use the same central validation. Recurrence does not change exact-time semantics: every expanded task receives the same validated time window unless a later design explicitly supports per-occurrence overrides.

## 25. Repeat-by-expansion design

### Recommended first version

Repeat-by-expansion is a creation command, not a stored recurrence engine. The user supplies a finite date range and selected weekdays (or an explicit finite date set) plus one canonical task template. The backend expands the rule deterministically, validates the resulting non-empty finite dates, enforces an operational maximum, and creates one independent `DailyTask` per date transactionally.

Examples:

- “مدرسه، شنبه تا چهارشنبه، X تا Y” creates one General task per matching date.
- A repeated Study template creates one Study task per matching date, each with its own copied target snapshots/items and independent status.
- Combining cross-Student assignment and repeat expansion produces one task per Student per occurrence; the command validates the complete product before writing.

No rule is stored as authoritative recurrence state. Editing or completing one occurrence affects only that task. The UI must call this “create repeated tasks” rather than promise a permanently linked series. Previewed dates and the final created count must be visible before confirmation.

## 26. Future recurrence / `TaskSeries` boundary

A persistent `TaskSeries` belongs to FUTURE only if the product needs operations that repeat-by-expansion cannot honestly support, such as:

- edit this and future occurrences;
- pause/resume a rule;
- exceptions and skipped dates;
- indefinite generation horizon;
- per-occurrence override tracking;
- series-level audit or ownership changes.

At that point, a series owns recurrence intent and generates independent `DailyTask` instances. Tasks still own status, completion, sessions, and Curriculum execution. A series must never become a shared completion record. Existing expanded tasks are not retroactively grouped or inferred into a series.

## 27. Reports v1 valid metrics

Reports v1 is a derived read model; it does not change task history. Within an explicit date window it may show:

- task counts grouped by `PENDING`, `COMPLETED`, `PARTIAL`, and `SKIPPED`;
- daily and weekly status distributions;
- total planned minutes from non-null `estimatedMinutes`, with coverage indicating how many tasks supplied a value;
- actual StudySession time from sessions with `endedAt != null` and `cancelledAt = null`;
- planned-versus-actual minutes as two factual totals, not an adherence score;
- per-day planned and actual minute trends;
- canonical Curriculum execution-item totals/completion for tasks that have such items;
- Counselor views of the same metrics for actively assigned Students, individually and as factual attention filters such as “has pending tasks,” without a risk score.

Task status metrics use `scheduledFor` in the requested window. For the current Iranian product, all report date bucketing and aggregation use the `Asia/Tehran` product timezone and a Saturday-through-Friday week. Server UTC boundaries must not define report days or weeks. Per-user and multi-timezone reporting are explicitly deferred. Task-linked actual time may be compared to that task’s plan; unlinked valid sessions may be reported separately but not attributed to a task or subject.

## 28. Explicitly invalid / fake metrics

Reports v1 must not present:

- risk scores or “needs attention” predictions without an approved model and evidence;
- authoritative adherence percentages without a defined denominator, missing-duration policy, and rescheduling policy;
- “missed” counts inferred from `PENDING` alone;
- canonical subject performance inferred from legacy Subject/Topic, labels, or a multi-target task;
- exam trends before the Assessment/Exam redesign defines valid attempts and reporting semantics;
- planned minutes where null values are silently treated as fully planned zeroes;
- actual study time from active, cancelled, negative, or otherwise invalid sessions;
- public or cross-Student comparisons not explicitly authorized.

## 29. Database changes likely required — design only

### NOW candidates

- Add `PersonProfile` with nullable private name fields and unique `userId`. Do not backfill guessed names.
- Add nullable `DailyTask.contentType` using `STUDY | GENERAL`.

### NEXT candidates

- Add `ProfessionalProfile` when public professional profile publication is an approved milestone.
- Add specialty/link child tables only when their real UI/filtering contracts ship.
- Add a private/public avatar reference only with a real media-reference contract.

### FUTURE candidates

- Add `School` and `SchoolMember` only with an organization milestone.
- Add `TaskSeries` only when durable recurrence behavior is approved.
- Add group-command provenance only when idempotency/audit requirements justify persistence.

No existing model, field, target row, snapshot, session, assessment attempt, or migration history is deleted or rewritten.

## 30. API changes likely required — design only

- Private authenticated PersonProfile read/update contract with role-appropriate field validation.
- Student Profile Center read/update continues to use authoritative `StudentProfile`, including track.
- Counselor private profile read/update remains separate from ProfessionalProfile draft/update/publish actions.
- Explicit public ProfessionalProfile list/detail endpoints that return only the public whitelist.
- Task create contracts accept and require explicit `contentType` after the compatibility rollout; validation enforces Study/General invariants.
- Task reads return `contentType: STUDY | GENERAL | null`.
- Cross-Student group assignment command separate from current per-Student batch.
- Finite repeat-expansion command or schedule expansion option that returns independent created tasks.
- Reports v1 aggregate reads for Student self and assigned-Student Counselor views.

No task write accepts authoritative track, catalog entry, grade group, or representation ID. No public profile endpoint returns private data and relies on frontend redaction.

## 31. Frontend-only changes

After corresponding domain/API milestones exist:

- move Profile Center access to the header avatar/identity trigger and remove Profile/Settings as sidebar navigation where applicable;
- split current Settings content into the locked Student/Counselor sections;
- keep subscription hidden until Billing exists;
- add safe name fallbacks and never show raw UUID as identity;
- converge Curriculum navigation on `/curriculum` and remove legacy authoring from new-write UX;
- require explicit “درسی / غیردرسی” choice in task creation;
- show canonical picker only for Study and enforce no targets for General;
- expose existing day-only/exact-time modes;
- add Students-list selection for cross-Student assignment;
- present repeat expansion as a finite preview of independent tasks;
- replace Reports placeholders only when real aggregate endpoints exist.

These are not authorized implementation changes in this design milestone.

## 32. Migration strategy

Use additive migrations and rolling-compatible contracts:

1. Add `PersonProfile` without moving or deleting `User`, `StudentProfile`, or `CounselorProfile` data. Existing accounts have no PersonProfile or nullable name fields and continue using safe fallbacks.
2. Add nullable `DailyTask.contentType`. Existing tasks remain null; run no classification update.
3. Deploy reads that understand null and writes that can accept explicit type while old clients remain compatible for a short rollout window.
4. Update all first-party task creation clients to send explicit type and obey type invariants.
5. Enforce explicit type for new canonical API writes at the application layer. Keep the database nullable indefinitely unless every historical row is explicitly classified under a separately approved policy.
6. Do not alter existing Subject/Topic, NODE/PLACEMENT, snapshots, sessions, assessment links, or status history.
7. Introduce ProfessionalProfile later with no automatic copy from private Counselor fields.
8. Introduce School/organization models later with no automatic `schoolName` matching.

Every migration must be reversible at the schema level and must preserve existing reads during deployment. No applied migration is rewritten.

## 33. Backward compatibility strategy

- Historical task DTOs expose nullable content type.
- Existing lifecycle, execution, schedule, Subject/Topic, PLACEMENT, and snapshot reads remain available.
- Existing one-Student batch keeps its route and meaning.
- Existing Student/Counselor profile routes remain valid while PersonProfile adds a separate private identity boundary.
- Missing names use human-safe labels, not UUIDs.
- `/study` remains available or redirects only after its compatibility use is reviewed.
- Existing Curriculum identities and stored references are unchanged.
- Existing Student track authority remains profile-derived.
- Public ProfessionalProfile is opt-in; absence does not affect authenticated Counselor work.

Compatibility endpoints may be deprecated only through a later measured retirement plan. Their existence does not authorize new legacy authoring UX.

## 34. Rollout sequencing

This design's original sequencing recommendation is superseded. [ROADMAP.md](../../ROADMAP.md) is the sole current implementation-sequencing authority, including the recursive-subtree persistence Decision Gate, safe Picker-to-Planning closeout, Browser/Picker split, Profile visual closeout, Account/Security expansion, Cross-Student Group Assignment, Reports continuation, and later Assessment UX rewrite. No item in this supporting design authorizes implementation automatically.

## 35. NOW / NEXT / FUTURE matrix

| Capability | CURRENT IMPLEMENTED STATE | NOW — first approved slices | NEXT | FUTURE |
|---|---|---|---|---|
| Account identity | `User` auth/account | Keep boundary unchanged | — | — |
| Private personal identity | No canonical name/avatar | `PersonProfile` with nullable names | private avatar ref with media contract | richer verified identity only if needed |
| Student academic profile | track/level/schoolName | expose track only in academic Profile Center | refine fields under Student milestone | explicit School link |
| Counselor private profile | bio/specialization | keep private, clarify UX | refine/deprecate ambiguous fields safely | additional private professional operations |
| Public professional identity | absent | design only | `ProfessionalProfile` publication + whitelist API | Teacher/directory/links/credentials |
| School organization | free-text Student schoolName | preserve as private text | define authority if scheduled | `School` + `SchoolMember` |
| Task content type | inferred/absent | nullable persisted type; explicit new writes | deliberate classification tools if approved | — |
| Study task | canonical targets supported | require explicit STUDY + 1..N NODE | richer planner UX | — |
| General task | zero-target task possible | require explicit GENERAL + no targets | richer templates | — |
| Cross-Student assignment | absent | design/API milestone after type foundation | synchronous bounded group command | async bulk only if scale requires |
| Repeated tasks | absent | finite repeat-by-expansion | group + repeat composition | `TaskSeries` only if durable series operations needed |
| Reports | placeholders | define truthful v1 metrics | aggregate APIs/UI | advanced metrics after evidence |
| Subscription | absent | hidden | Billing design | real subscription only with Billing |
| Teacher/Article/Exam redesign | absent/separate | non-goal | separate designs | implementation by approved roadmap |

## 36. Non-goals

- No implementation, Prisma edit, migration, API, UI, or test change is authorized by this design specification.
- No Teacher role/table, Article table, Billing/subscription state, Exam redesign, media storage, or upload design.
- No public Student profile.
- No automatic publication of private Counselor data.
- No arbitrary user-authored canonical Curriculum.
- No deletion of Subject/Topic or compatibility APIs.
- No new Curriculum target kind and no `PLACEMENT → NODE` conversion.
- No historical TaskContentType guessing or destructive backfill.
- No shared task completion/status for group assignment.
- No permanent recurrence engine in the first repeat implementation.
- No fake report metrics, prediction, or risk score.
- No canonical document changes as part of this review artifact.

## 37. Risks

- A broad profile query reused publicly could leak account or private Counselor data. Mitigation: separate table boundary, explicit server-side projection, and public projection tests.
- Ambiguous existing Counselor bio/specialization may be mistaken as public. Mitigation: classify them private and require explicit public entry/publication.
- Requiring content type before all clients are updated could break writes. Mitigation: staged rollout with a temporary compatibility window and application-layer cutover.
- Guessing historical task type could corrupt reporting and UX. Mitigation: nullable historical state and no automated backfill.
- Study group assignment can leak or misuse cross-track nodes. Mitigation: validate every Student through the assigned Student’s authoritative track and reject the complete command on mismatch.
- Group/repeat commands can create accidental duplicates on retry. Mitigation: define request idempotency in the implementation milestone before enabling large commands.
- Repeat expansion can create excessive rows. Mitigation: finite range, preview, measured maximum, and transactional creation.
- Planned-versus-actual reporting can imply accuracy when duration coverage is incomplete. Mitigation: show coverage and factual totals rather than an adherence score.
- Free-text school names may later be mistaken for canonical organizations. Mitigation: never auto-link; require explicit verified School association.
- Public slug changes can break SEO links. Mitigation: resolve slug lifecycle before public launch.

## 38. Open questions

Only these decisions remain genuinely unresolved and must be settled in their respective future milestones:

1. **Public-profile publication authority:** Is Counselor self-publication sufficient, or is Admin/moderator approval required before `PUBLISHED`?
2. **Public slug lifecycle:** Are slugs immutable after first publication, or may they change with retained redirects?
3. **Group/repeat idempotency retention:** What retry key lifetime and audit retention are required for bulk creation commands?
4. **School authority:** Who may create, verify, merge, or deactivate a future canonical School?

These questions do not block review of the domain boundaries. They block only the later milestones that depend on their answers.
