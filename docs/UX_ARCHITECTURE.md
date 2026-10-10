# Konkourix Target UX Architecture

**Status:** SUPPORTING / HISTORICAL TARGET UX ARCHITECTURE
**Last synchronized:** 2026-10-02
**Target baseline:** M19 plus approved future domain architecture
**Scope:** Student Web, Counselor Web, and future role-scoped administration experiences

This document preserves detailed target information-architecture and workflow context. It is not a product-definition source, roadmap, component specification, visual-token file, frontend implementation plan, API contract, or authorization mechanism. [PRODUCT_MAP.md](PRODUCT_MAP.md) governs product behavior, [ROADMAP.md](ROADMAP.md) governs sequencing, and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) governs visual rules. Conflicting historical UX details are superseded.

## Sources of Truth

This historical design was informed by:

- [PRODUCT_MAP.md](PRODUCT_MAP.md), with [PRODUCT_VISION.md](PRODUCT_VISION.md) and [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) retained as historical context;
- [UX_PRINCIPLES.md](UX_PRINCIPLES.md);
- [DOMAIN_MAP.md](DOMAIN_MAP.md);
- ADR-024 through ADR-032 in [DECISIONS.md](DECISIONS.md);
- the accepted standalone ADRs in [adr/README.md](adr/README.md);
- [TARGET_DATABASE_DESIGN.md](database/TARGET_DATABASE_DESIGN.md).

When a workflow is described here but its policy remains an ADR decision gate, the experience is directional and must not be implemented by guessing the missing rule. Backend authorization and lifecycle validation remain authoritative regardless of what the interface displays.

The information architectures below are target capability maps, not instructions to expose unfinished navigation. A destination appears to users only after its domain, authorization, API, migration, state, accessibility, and recovery behavior are implemented and approved.

## Experience Model

Konkourix is a specialized Konkur ecosystem organized around:

```text
Plan -> Execute -> Assess -> Improve
```

The interface must preserve these distinctions:

| User concept | Domain meaning | UX rule |
| --- | --- | --- |
| Plan or Task | Educational intention | Show what should happen; never imply that viewing or timing it proves completion |
| Study Session | Actual study interval | Start/finish/cancel independently from Task Result |
| Task Result | Student report about the intended learning unit | Capture completion outcome and five-level learning quality separately from session ratings |
| Practice | Daily learning questions/exercises | No exam-publication, eligibility, or secure-delivery language |
| External Exam Report | Evidence from a provider-owned exam | Report/import workflow only; never present as a Konkourix-delivered attempt |
| Internal Online Exam | Konkourix-owned delivery and scoring | Server-authoritative timed attempt with explicit submission and evaluation states |
| Progress | Student-specific mastery/status overlay | Never alter curriculum or silently infer mastery from one Task, session, or score |
| Curriculum | Immutable published master data | Students and counselors browse/select; only authorized admins edit drafts and publish versions |

Published, corrected, superseded, invalidated, retired, and legacy states must be understandable in user language. The interface must not hide immutable history behind a generic “updated” label.

## 1. Student App Information Architecture

The Student App prioritizes the next meaningful action, today’s reality, understandable progress, and low-friction reporting.

```text
Student App
|-- Today
|   |-- Next learning action
|   |-- Today timeline
|   |-- Active study session
|   `-- Alerts and follow-up
|-- Plan
|   |-- Published counselor plan
|   |-- Personal tasks
|   |-- Week/day views
|   `-- Plan history
|-- Progress
|   |-- Curriculum progress
|   |-- Review needs
|   `-- Learning timeline
|-- Practice & Exams
|   |-- Practice
|   |-- External exam reports
|   |-- Konkourix online exams
|   `-- Legacy assessment history
|-- Messages
|   |-- General chat
|   |-- Tickets
|   `-- Suggestions
`-- More
    |-- Daily Reality Schedule
    |-- Counselor relationship
    |-- Profile and preferences
    `-- Security/session settings
```

### Student Navigation Rules

- `Today` is the default landing destination. It answers “What should I do now?” before showing totals or charts.
- `Plan` clearly distinguishes counselor-published items from student-created personal Tasks through source labels and visual treatment.
- `Progress` is organized by canonical curriculum and evidence, not a user-created subject folder tree.
- `Practice & Exams` is a shared destination only. Its three capabilities remain separate choices, forms, histories, and lifecycles.
- `Messages` may present a unified inbox projection, but Chat, Tickets, and Suggestions retain distinct labels and actions.
- Starting study, recording Practice, submitting a Task Result, and entering an External Exam Report are contextual actions—not permanent top-level destinations.
- Private counselor notes and administrative audit data never appear in the Student App.

## 2. Counselor App Information Architecture

The Counselor App prioritizes student context, paper-speed planning, exceptions, evidence review, and communication.

```text
Counselor App
|-- Overview
|   |-- Planning queue
|   |-- Students needing attention
|   |-- Unread communication
|   `-- Recent evidence
|-- Students
|   `-- Student workspace
|       |-- Overview
|       |-- Reality schedule
|       |-- Plans
|       |-- Tasks and execution
|       |-- Curriculum progress
|       |-- Practice and exams
|       |-- Communication
|       `-- Private notes
|-- Planning
|   |-- Draft plans
|   |-- Published plans
|   `-- Publication/revision queue
|-- Inbox
|   |-- General chat
|   `-- Tickets
`-- More
    |-- Curriculum explorer
    |-- Suggestions
    |-- Profile
    `-- Security/session settings
```

### Counselor Navigation Rules

- A persistent student context identifies whose data is being viewed and the relationship that grants access.
- Switching students clears unsafe draft selections and requires explicit confirmation if unpublished work would be lost.
- The student workspace keeps Planning, Execution, Progress, and Assessment in separate tabs while allowing a summary view to compare them.
- Planning surfaces show `Draft`, `Published`, and `Superseded` states prominently. A saved draft never looks student-visible.
- Evidence review links back to source records. A report card must say whether it came from a Task Result, Study Session, Practice Activity, legacy assessment, External Report, or Internal Exam.
- Private notes are in a separately protected area with an explicit confidentiality label; they never appear in Messages or student-visible feedback.
- Counselor access is not implied by navigation visibility. Relationship and ownership checks remain server-enforced.

## 3. Admin Future Architecture

Administration is a set of permission-scoped workspaces, not one unrestricted “admin panel.” A person sees only modules and actions granted by their role.

```text
Admin Workspaces
|-- Curriculum Operations
|   |-- Versions and publication
|   |-- Tree editor
|   |-- Imports, source records, and ambiguity queue
|   `-- Cross-version and legacy mappings
|-- Question Bank
|   |-- Submission inbox
|   |-- Educational/answer review
|   |-- Rights review
|   |-- Curriculum classification
|   `-- Publication and withdrawal
|-- Internal Exams
|   |-- Exam builder
|   |-- Eligibility and delivery operations
|   |-- Manual evaluation
|   `-- Corrections and invalidations
|-- Communication Operations
|   |-- Ticket queue
|   |-- Suggestion review
|   `-- Moderation, when approved
|-- Counselor Operations
|   |-- Requests and human-reviewed introductions
|   `-- Relationship oversight
`-- Security and Audit
    |-- Authorized audit views
    `-- Exceptional access review
```

### Admin Guardrails

- Curriculum editing always begins in a draft version. Review and publication are separate actions.
- Import completion never implies curriculum publication.
- Question submission, review, approval, and publication are visibly separate stages and capabilities.
- Rights evidence, answer keys, private notes, and security audit data use narrower access than ordinary admin navigation.
- Destructive or history-rewriting controls do not exist for published curriculum, plans, question versions, exam versions, attempts, or finalized evaluations.
- High-impact actions use a review summary showing affected version, actor, reason, validation results, and consequences before confirmation.
- Admin dashboards emphasize work queues, blockers, and auditability—not vanity metrics or unrestricted user browsing.

## 4. Dashboard Layouts

Dashboards answer role-specific questions and use progressive disclosure. They must not become dense collections of every available metric.

### Student Dashboard

```text
+------------------------------------------------------+
| Greeting + date                 Progress context      |
+------------------------------------------------------+
| Next meaningful action [Start / Resume / View]       |
+-------------------------------+----------------------+
| Today timeline                | Follow-up            |
| counselor + personal items    | review / messages    |
| reality context               | incomplete results   |
+-------------------------------+----------------------+
| Recent learning evidence and calm momentum summary   |
+------------------------------------------------------+
```

Priority order:

1. Active Study Session or Internal Exam Attempt requiring safe recovery.
2. Current/next published learning item.
3. Required result/report follow-up.
4. Personal Task and optional learning actions.
5. Progress and history summaries.

Do not use rank, streak loss, shame language, red overload, or unapproved AI diagnosis to manufacture urgency.

### Counselor Dashboard

```text
+------------------------------------------------------+
| Student/period filters        Draft/publish summary   |
+----------------------+-------------------------------+
| Attention queue      | Planning queue                |
| evidence exceptions  | drafts, conflicts, stale     |
| unanswered tickets   | reality context, publish     |
+----------------------+-------------------------------+
| Recent execution, practice, exam, and result evidence|
+------------------------------------------------------+
```

The attention queue surfaces explainable facts such as missing Task Results, a plan with no published successor, or a ticket awaiting reply. It does not label students as weak, lazy, or at risk without an approved, explainable policy.

### Admin Dashboard

Each admin workspace has its own queue: curriculum ambiguities, questions awaiting a review dimension, rights expiry/dispute, exams awaiting manual evaluation, tickets, or suggestions. Counts link to exact records and states. A global overview cannot grant global record access.

### Responsive Layout Rule

Desktop may use two or three coordinated regions. Mobile uses one primary flow with a context header and bottom navigation. Information priority, terminology, and available recovery actions remain consistent across breakpoints.

## 5. Planning Workflow

### Counselor Creates and Publishes a Plan

```text
Choose student
    -> review current published plan and reality snapshot
    -> create draft from current version or empty horizon
    -> place blocks and learning items
    -> select canonical curriculum targets
    -> set workload and expected outcome
    -> validate and review changes
    -> publish atomically
    -> student sees materialized Tasks
```

The planning workspace has two visually distinct layers:

- **Student reality layer:** read-only declared availability/constraints, labelled with snapshot and freshness.
- **Counselor plan layer:** editable draft blocks/items, workload, curriculum, and expected outcomes.

Learning blocks provide rapid curriculum search, planned minutes, planned question count, activity type, and expected outcome. Context blocks are labelled as non-learning and never show Task Result controls.

### Draft and Publication UX

- Autosave may protect an active draft, but the UI must say `Draft—not visible to student`.
- A publication preview summarizes dates, learning items, total workload, curriculum changes, conflicts, and the Daily Reality snapshot used.
- Publication is one explicit action and one atomic visible outcome. Partial publication must never appear.
- Validation errors identify the exact block/item and preserve draft input.
- Concurrent change errors show that the base version changed and require review; silent last-write-wins is prohibited.
- Successful publication links to the immutable published version and the Tasks created from it.

### Revision UX

- `Revise future plan` creates a new draft from the active published version.
- A change view distinguishes moved, modified, added, removed, and unchanged items.
- Historical or evidence-bearing items are locked with an explanation. The precise lock boundary comes from approved policy/server state, not a client-side time assumption.
- Publishing a revision shows which future Tasks will be retained, superseded, or replaced.
- Superseded plans and Tasks remain available in history and are not shown as active work.

### Student Planning UX

- Students read counselor-published intention but cannot move, edit, delete, or change its curriculum/workload.
- Students may create personal learning Tasks with a clear `Personal` source badge and canonical curriculum selection.
- Student execution and result reporting are available from the Task without exposing counselor-edit controls.
- A personal Task never adopts counselor provenance, even when a counselor later discusses it.

## 6. Daily Reality Schedule UX

Daily Reality Schedule is student-owned context and availability. It is neither the counselor plan nor a retrospective activity log.

### Student Flow

1. Open `Daily Reality Schedule` from More or a planning prompt.
2. Select a date/range and explicit time-zone context.
3. Add availability or constraint blocks using the approved controlled categories.
4. Enter an optional label/note only where it adds useful context.
5. Review overlaps, gaps, and validation findings.
6. Publish an immutable snapshot.

The editor supports both direct time entry and an accessible grid. Dragging is an enhancement, never the only method. Recurrence, overlap, and exception behavior must wait for approved policy.

### Counselor Consumption

- Counselors see the applicable published snapshot as a read-only planning layer.
- The snapshot shows `Published by student`, date range, time zone, and freshness.
- Missing, stale, conflicting, or incomplete data is shown as context—not silently treated as free time.
- Counselors may request an update through Communication but cannot edit the schedule.
- A published Plan shows which Reality snapshot it used. Later student updates do not redraw historical Plan context.

### Privacy Rules

- Use the minimum detail needed for planning. Avoid location-like labels by default.
- Clearly explain who can see the schedule before publication.
- Relationship closure removes ordinary future counselor access according to approved retention policy.
- Do not expose reality blocks in public profiles, general analytics, notification previews, or unrelated admin screens.

## 7. Curriculum Explorer UX

The Curriculum Explorer is a shared read experience with role-specific actions.

### Core Explorer

- Exact Persian source labels are displayed without silent spelling, punctuation, marker, or character correction.
- Hierarchy is shown as an expandable tree plus breadcrumbs. Missing source levels are not filled with invented placeholders.
- Search normalization helps discovery but results always display canonical labels and path context.
- Sibling order follows the published curriculum version, not alphabetic sort.
- Deprecated or retired nodes remain visible in historical context and are clearly ineligible for new selection where applicable.
- A version indicator appears when users inspect historical Tasks, plans, questions, progress, or exams. Normal new selection defaults to the current published version without rewriting old references.

### Student Mode

Students browse curriculum with their Progress overlay: learning status, mastery when known, review date, strengths/weaknesses, and recent evidence. Unknown mastery is displayed as `Not rated`, never `0/5`.

### Counselor Mode

Counselors browse within a student workspace and may select eligible nodes for draft Plan Items or personal guidance. Search results include sufficient ancestry to distinguish same-name nodes. Counselors cannot add, rename, move, merge, or retire nodes.

### Curriculum Admin Mode

Authorized admins switch explicitly between published read mode and a draft workspace. Draft changes show source provenance, parent/order, type, mappings, import issues, and impact. Review and publish actions are role-gated and show blocking ambiguity. Published versions are never editable in place.

## 8. Task Result UX

Task cards separate intention, execution, and result:

```text
Task intention
  Curriculum + activity + workload + expected outcome
  Source: Counselor plan v3 / Personal

Execution actions
  Start study | Record practice | View evidence

Result action
  Report outcome
```

### Result Flow

1. Choose `Completed`, `Incomplete`, or `Skipped`.
2. For Completed or Incomplete, select required learning quality:
   - 1 Very weak
   - 2 Weak
   - 3 Average
   - 4 Good
   - 5 Excellent
3. Optionally add a note, perceived difficulty, or problem description.
4. Review and submit.

Skipped work requests an approved reason where policy requires it and does not request a learning-quality rating. The labels must explain that learning quality concerns the whole intended unit; it is not `StudySession` quality and not curriculum mastery.

### Correction and Counselor View

- Submitted results display time, reporter, and correction history.
- `Correct result` creates an audited revision; it does not silently edit the prior report.
- Legacy completed Tasks with no learning quality show `Quality not recorded`, not a fabricated value.
- Counselors may read student results within their active relationship but cannot submit or alter the student's self-report.
- A Task Result never tells the user that Progress, Practice, or an exam score changed automatically.

## 9. Practice/Test Workflow

The word “test” is ambiguous in everyday use. Entry points must ask what actually happened instead of routing everything into one generic assessment form.

```text
What do you want to record or do?

[Practice questions]
Daily exercises or question solving

[Report an external exam]
An exam delivered by another provider

[Take a Konkourix exam]
An eligible online exam delivered here
```

### Practice Flow

1. Start from a Task or choose independent Practice.
2. Select/confirm canonical curriculum target(s).
3. Identify source type and attribution: textbook, help book, teacher material, or eligible Question Bank content.
4. Record time only if known; never require a fake Study Session.
5. Enter aggregate answered/correct/incorrect/blank counts where known, or answer governed Question Bank items directly.
6. Review and record the Practice Activity.

Recorded Practice shows source, curriculum, counts, optional Task/Session provenance, and correction/invalidation history. It does not show exam eligibility, publication, proctoring, secure submission, or ranking language. Recording it does not complete a Task or change mastery automatically.

### Legacy Assessment History

M19 `AssessmentAttempt` entries remain labelled as legacy recorded assessment evidence unless a later approved decision safely classifies them. The UX must not relabel them as Practice, External Reports, or Internal Exams from title/count heuristics.

## 10. External Exam Reporting UX

External Exam Reporting captures evidence from provider-owned exams. Konkourix does not claim ownership of the exam, questions, timing, scoring, or ranking.

### Student Flow

```text
Choose approved provider
    -> identify exam and date
    -> upload evidence when supported
    -> enter supplied totals/percentages/scores
    -> optionally classify sections to curriculum
    -> add student note
    -> review exactly what will be recorded
    -> submit report
```

- Provider selection uses governed provider identities; students do not create a canonical provider by typing a label.
- Fields are labelled according to what the provider supplied. The UI must not imply normalized cross-provider meaning before ADR-042 approves it.
- Uploaded images/documents are presented as evidence, not an online exam or answer sheet owned by Konkourix.
- A structured curriculum link is optional until reviewed and never guessed from a provider section name alone.
- A report may optionally link to a Task, but it never completes that Task automatically.

### Review and Correction

- The student sees `Draft`, `Recorded`, `Corrected`, or `Invalidated` status and the effective revision.
- Corrections create a new revision and show what changed. A mistaken provider/exam identity requires invalidation and replacement rather than hidden mutation.
- Counselor review is separate from the student's submitted evidence and visibly identifies the reviewer and report revision reviewed.
- Counselor feedback does not become a private note, Task Result, or Progress update.

### Safety and Deferred Policy

Evidence upload must not be exposed until secure object storage, malware scanning, file validation, access, retention, and deletion policies are approved. Provider adapters, automatic extraction, score normalization, and legacy attempt classification remain out of scope until ADR-042.

## 11. Internal Exam UX

Internal Exam UX is a controlled, server-authoritative flow distinct from Practice and External Reports.

### Discovery and Eligibility

- Students see only exams they are authorized to discover and attempt.
- Exam cards show title, availability window, duration/timing policy, allowed attempts, result-release policy, and status using the exact published Exam Version.
- An unavailable exam explains the applicable reason without exposing protected exam content or other students' eligibility.

### Preflight and Start

Before starting, show instructions, timing, submission behavior, navigation rules, connectivity/recovery expectations, and approved accommodations. `Start exam` is an explicit server-confirmed action. Opening instructions does not start the timer.

### Attempt Layout

```text
+------------------------------------------------------+
| Exam title/version | Server time remaining | Submit  |
+--------------------+---------------------------------+
| Question navigator | Current question and answers    |
| answered/review    |                                 |
| section state      | Save/recovery state             |
+--------------------+---------------------------------+
```

- Server time and Attempt state are authoritative; the client timer is a synchronized display.
- The interface clearly confirms saved answers and degraded/reconnecting state without promising persistence before server acknowledgement.
- Students may revise answers only while the Attempt is eligible and `In progress`.
- Keyboard, screen-reader, and non-pointer navigation reach every item and answer control.
- Randomized item/option order remains stable for that Attempt.

### Submission and Recovery

- Final submission shows answered, unanswered, and review-marked counts, then asks for explicit confirmation.
- Duplicate submissions are idempotent from the user's perspective and never create a second Attempt.
- Reconnection resumes the same server Attempt and delivery snapshot. Refreshing the page never silently restarts the exam.
- Expired, terminated, or invalidated states explain the state and available next action without revealing security-sensitive detail.
- Closing a browser is not presented as successful submission unless the server confirms it.

### Evaluation and Results

- Submitted Attempts move through `Submitted`, `Evaluating`, optional `Manual review`, and `Evaluated` states.
- Results identify the exact Exam Version and effective Evaluation revision.
- Re-evaluation/correction history remains visible where appropriate; original evaluations are not silently replaced.
- Answer keys and solutions appear only when the published release policy permits them.
- Exam completion does not claim to create study time, complete a Task, or update mastery automatically.

Retakes, accommodations, appeals, proctoring, offline delivery, negative-marking formulas, and manual-marking policy require explicit decisions before their controls are designed.

## 12. Question Bank Admin UX

Question Bank administration is a moderated content workflow, not a direct publishing form.

### Workspace Structure

```text
Submission inbox
    -> Question/version editor
    -> Educational review
    -> Answer and solution verification
    -> Rights and attribution review
    -> Curriculum classification review
    -> Approval
    -> Publication
```

Work queues can filter by stage, assignee, age, source, rights status, curriculum path, and blocking issue. Filters organize work; they do not bypass permissions.

### Question Editor

- Show stable Question identity separately from editable draft Question Version.
- Present stem, format-specific answer structure, answer key, solution, language, and media references in distinct regions.
- Display author/source attribution and rights basis as required publication data, not optional footnotes.
- Preview student presentation without exposing unpublished content to student accounts.
- Saving a draft never implies approval or publication.

### Curriculum Classification

- Search and browse the exact published curriculum version used for classification.
- Allow multiple explicit node tags with ancestry visible.
- Require exactly one primary tag before publication.
- The primary tag is the most specific defensible node present in the source; the UI never invents an atomic node just to satisfy depth.
- Show derived ancestors as inherited context, not independently editable tags.
- Changing published classification creates a new Question Version.

### Review and Publication

- A checklist shows educational, answer/solution, rights, attribution, and curriculum-review completion.
- Approval and publication are distinct actions and may require distinct permissions.
- Unknown, expired, revoked, or disputed rights block publication and new selection with a clear reason.
- Publication preview shows the immutable version, tags, attribution, rights basis, and downstream selection impact.
- Withdrawal/retirement prevents new use while preserving existing Practice and Exam history.
- Contributors and counselors may submit where policy permits but cannot publish by virtue of authorship.

## 13. Communication UX

A unified inbox may summarize activity, but the user always knows which communication mode they are using.

### General Chat

- One lightweight conversation is scoped to the authorized student-counselor relationship, not to every Task or plan.
- Messages are chronological and may include an optional contextual link such as `Regarding Plan v3`.
- A contextual link opens the source record; it does not make the message an authoritative plan change or result correction.
- Ending a relationship changes future access according to approved policy without rewriting conversation history.

### Tickets

- Ticket creation asks for category, subject, issue description, and optional context.
- Tickets show requester, authorized participants, status, threaded messages, and status history.
- Resolve, close, and reopen are explicit workflow actions, not inferred from the last message.
- Study problems, plan discussion, report review, and technical issues use Tickets when structured follow-up is needed.

### Suggestions

- Suggestion intake distinguishes curriculum change, question submission, and product/workflow improvement.
- Status shows intake, review, decision, and feedback progression.
- A curriculum suggestion cannot edit Curriculum. A question suggestion enters Question Bank intake only through an explicit audited transition.
- Reclassification into a Ticket or another workflow is visible and retains the original Suggestion.

### Unified Inbox Rules

- Tabs/filters distinguish `Chat`, `Tickets`, and `Suggestions`; unread counts never merge their status semantics.
- Notifications identify the communication type and avoid exposing sensitive content on lock screens/previews.
- No `Start chat about this` action creates a new entity-specific room. Use contextual linking to the existing relationship chat or create a structured Ticket.
- Attachments, editing, deletion, abuse moderation, retention, and notification policy remain decision gates.
- Private counselor notes are never displayed, searched, notified, or exported through Communication.

## 14. Mobile Navigation

Mobile navigation prioritizes frequent role-specific destinations and keeps contextual actions near the current record.

### Student Mobile

Recommended bottom navigation:

| Destination | Purpose |
| --- | --- |
| Today | Next action, active execution, and today's timeline |
| Plan | Published counselor plan and personal Tasks |
| Progress | Curriculum overlay and learning history |
| Practice & Exams | Separate Practice, External Report, and Internal Exam entry points |
| Messages | Chat, Tickets, and Suggestions |

`More` is accessible from the profile/context control and contains Daily Reality, counselor relationship, preferences, and security. A prominent floating action is permitted only when context makes its meaning unambiguous; a universal generic `+` is discouraged.

### Counselor Mobile

Recommended bottom navigation:

| Destination | Purpose |
| --- | --- |
| Overview | Attention and planning queues |
| Students | Student selection and workspace |
| Planning | Draft/revision/publish workflow |
| Inbox | Chat and Tickets |
| More | Curriculum, Suggestions, profile, and security |

Student identity remains visible in contextual headers throughout a student workspace. Mobile planning must support direct form/time entry and cannot depend on drag-and-drop. Desktop may be more efficient but cannot be the only accessible route to required work.

### Mobile Interaction Rules

- Bottom navigation labels are always visible; icons alone are insufficient.
- Deep routes retain a clear back path without losing unsaved drafts.
- Sticky actions never obscure focused fields, validation messages, exam choices, or browser zoom.
- Sheet/modal use is limited to short decisions. Long forms and review histories use full pages.
- Safe-area, virtual keyboard, RTL swipe expectations, and orientation changes are handled without data loss.

## 15. Desktop Navigation

Desktop uses persistent navigation, clear work context, and optional inspection panels.

### Shared Shell

```text
+----------------+-------------------------------------+
| Primary nav    | Context header                      |
|                +-------------------------------------+
|                | Main workspace          | Inspector |
|                |                         | optional  |
+----------------+-------------------------------------+
```

- Primary navigation is stable by role.
- The context header contains student, date range, curriculum/exam/plan version, and state where relevant.
- The optional inspector shows details, history, or validation without replacing the main workflow.
- Breadcrumbs represent hierarchy and location; browser history remains usable.

### Student Desktop

Use a calm, content-focused width for Today and Progress. Week plans and curriculum trees may expand into wider layouts. The interface does not imitate an enterprise dashboard simply because space is available.

### Counselor Desktop

Keep the selected student and current Plan state persistent. Planning may use a week grid, curriculum picker, and item inspector together, with keyboard-efficient add/copy/move actions and a non-drag alternative. Evidence review may use a source timeline plus details panel.

### Admin Desktop

A role-scoped workspace switcher separates Curriculum, Question Bank, Exam Operations, Communication Operations, Counselor Operations, and Security/Audit. Sensitive modules do not appear based on a generic `ADMIN` label alone; capabilities determine visibility and actions.

## 16. Design System Principles

### Semantic Foundations

- Tokens express purpose—surface, text, border, focus, success, warning, danger, information, selected, disabled—rather than one-off page colors.
- Light and dark themes maintain the same semantic meaning and hierarchy.
- Domain identity may use secondary accents, icons, and labels, but color alone never distinguishes Plan, Session, Practice, External Report, or Internal Exam.
- Published, draft, superseded, invalidated, retired, and legacy states use consistent components and language across apps.

### Component Families

- **Navigation:** role shell, breadcrumbs, context switcher, bottom navigation, tabs.
- **Educational context:** curriculum breadcrumb, node picker, version badge, progress indicator.
- **Planning:** schedule grid, time block, Plan Item, workload editor, publication review, version diff.
- **Execution:** Task card, Study Session controls, Task Result sheet, evidence link.
- **Assessment:** Practice form, external report summary, exam card, question navigator, evaluation/result view.
- **Communication:** conversation, ticket header/thread/status history, suggestion timeline.
- **Governance:** moderation checklist, rights status, provenance panel, audit timeline, publish confirmation.
- **State:** skeleton, empty state, inline validation, recoverable error, stale/offline notice.

### Interaction Principles

- Progressive disclosure replaces long all-purpose forms.
- Primary action labels use explicit verbs: `Publish plan`, `Start study`, `Record practice`, `Submit exam`, `Report outcome`.
- Confirmation is reserved for consequential actions; routine safe changes should not create alert fatigue.
- Optimistic UI is prohibited where it could falsely claim publication, exam submission, answer persistence, payment-like commitment, or history correction.
- Motion explains transition or success and respects reduced-motion preferences. It is never required to perceive status.
- Glass treatment is optional and limited to surfaces where transparency does not reduce contrast, readability, focus visibility, or performance.

### Data Visualization

Charts are secondary to understandable source facts. They include text summaries, units, time range, calculation/source labels, and table alternatives. Do not compare legacy assessment counts, Practice, External Reports, and Internal Exams as equivalent scores without an approved normalization policy.

## 17. Branding Direction

Konkourix should feel focused, energetic, supportive, modern, and premium without becoming ornamental or competitive.

- Blue is the foundational brand family for trust, focus, and educational energy.
- Supporting colors communicate domain/state meaning and must not overpower core content.
- Generous spacing, strong typographic hierarchy, calm surfaces, and purposeful highlights create premium quality.
- Student surfaces feel alive through progress feedback and clear momentum, not streak pressure, confetti saturation, ranking, or fear of failure.
- Counselor surfaces feel controlled and efficient without resembling a CRM or spreadsheet skin.
- Illustrations and empty-state visuals, if introduced, should reflect Iranian students and study context respectfully without stereotypes.
- Persian-first microcopy is direct, humane, encouraging, and educationally precise. Avoid corporate admin language, blame, diagnosis, and ambiguous generic labels such as `Item` or `Record` when a domain term exists.
- The visual identity remains recognizable in both light and dark modes and under high zoom/contrast settings.

Exact palettes, typography families, icons, illustration style, motion curves, and glass recipes require a later design-token and accessibility review.

## 18. Accessibility Rules

The minimum conformance target is [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/), alongside usability testing with Persian/RTL users and users of assistive technology.

### Structure and Input

- Use semantic landmarks, headings, lists, tables, forms, buttons, and links before custom interaction patterns.
- Every workflow is keyboard operable with visible, unobscured focus and logical RTL-aware focus order.
- Dragging, swiping, hover, and fine-pointer interaction always have click/keyboard/direct-entry alternatives.
- Primary mobile controls target at least 44 by 44 CSS pixels where feasible and never rely on tightly packed icon-only targets.
- Labels persist outside placeholders. Required/optional state, format, and units are announced and visible.
- Validation associates errors with fields, provides an error summary for long forms, and moves focus predictably without destroying input.

### Visual and Motion

- Text, controls, focus rings, charts, status badges, and glass surfaces meet applicable contrast requirements in every theme/state.
- Meaning is never conveyed by color, position, animation, or icon alone.
- Text supports zoom and reflow without clipped controls or forced two-dimensional scrolling except genuinely spatial content such as a schedule grid, which must have a list alternative.
- Respect reduced motion, increased contrast, and user text-size preferences.
- Timers and urgent warnings do not flash or create unnecessary motion.

### Persian and RTL

- Layout, reading order, breadcrumbs, directional icons, tables, calendars, number/unit combinations, and mixed Persian/Latin content are tested in RTL.
- Curriculum source labels retain their exact characters; accessible names do not silently normalize them into different educational text.
- Numerals, dates, and times are consistently formatted and announced with their calendar/time-zone context. A specific calendar convention must not be assumed without product approval.

### Complex Workflows

- Schedule and plan grids have a linear list/form representation.
- Curriculum trees expose hierarchy, expansion state, and selected node to assistive technology.
- Five-level ratings use labelled choices, not unlabeled stars alone.
- Exam navigation announces current item, total, answered/review state, saved state, and server time without excessive live-region repetition.
- Charts include equivalent summaries/tables and do not require visual comparison.
- Authentication and security actions avoid inaccessible cognitive tests and follow the approved accessible-authentication policy.

Accessibility is a release criterion for each workflow, not a final visual QA pass.

## 19. Empty, Loading, and Error States

State design must preserve domain truth, recovery, and user confidence. Blank pages, indefinite spinners, and generic `Something went wrong` messages are not acceptable final behavior.

### Global Rules

- Keep the current role, student, date range, version, and unsaved draft context visible when safe.
- Explain what is empty/loading/failed, why it matters, and the next valid action.
- Never replace known content with a spinner during background refresh; show stale data with freshness and retry state where safe.
- Do not claim success until the server confirms authoritative publication, recording, answer save, or submission.
- Preserve entered data after validation and recoverable network errors.
- Authorization errors do not reveal protected record existence or content.
- Correlation/support identifiers may be offered for unexpected failures without exposing stack traces or sensitive internals.

### Required State Matrix

| Surface | Empty state | Loading state | Error/recovery state |
| --- | --- | --- | --- |
| Student Today | Distinguish no published plan, no tasks today, and completed day; suggest only valid actions | Prioritize active-session/attempt recovery check before ordinary cards | Show retry and safe personal action; never imply counselor plan deletion |
| Counselor Overview | Explain no assigned students versus no items needing attention | Load queue sections independently | Keep successful sections; identify failed source without inventing “all clear” |
| Plan workspace | New draft guidance or no published base | Skeleton grid plus version/context label | Preserve draft; focus exact conflict/validation; concurrent base change requires review |
| Plan publication | No changes to publish is informational | Lock duplicate submit and show validation/publication phase | Never show partial version; offer retry only when idempotency is known |
| Daily Reality | Explain purpose, visibility, and student ownership | Preserve selected range | Keep blocks/draft on error; highlight time/overlap issue; counselor sees read-only unavailability |
| Curriculum Explorer | No search match is different from an empty/unpublished version | Tree nodes load with hierarchy context | Keep expanded path; show unavailable historical version without falling back to latest |
| Task Result | No result means `Not reported`, not `Incomplete` | Disable duplicate submit while retaining choices | Preserve outcome/quality/note and explain whether submission was recorded |
| Practice | No history invites Practice without implying obligation | Keep source/curriculum context visible | Preserve counts and source; reconcile duplicate/idempotent record safely |
| External Reports | No reports is neutral | File scan/upload has explicit progress/status | Quarantine unsafe files; retain safe form data; do not create a recorded report on partial failure |
| Internal Exam | No eligible exams is distinct from loading or authorization failure | Preflight and attempt recovery precede exam list | Reconnect to same Attempt; show answer-save uncertainty; never restart timer locally |
| Question review | No assigned queue is different from no submissions | Load content, rights, and reviews independently while blocking publish | Preserve review notes; list blocking dimension; never publish on partial review failure |
| Chat | No messages invites a lightweight greeting | Paginate history without moving reading position unexpectedly | Failed message remains visibly unsent with retry; do not duplicate on retry |
| Tickets | No tickets explains structured use cases | Status/thread load separately | Preserve draft reply; failed status transition does not masquerade as a sent message |
| Suggestions | No suggestions is neutral | Show current review timeline skeleton | Preserve submission; status failure cannot create a second suggestion silently |
| Reports/projections | No source evidence is explicit, not a zero score | Show data freshness and source-loading state | Display partial-data warning; never produce confident conclusions from missing sources |

### Legacy and Compatibility States

- Legacy `StudySubject`, `Topic`, Task status, and `AssessmentAttempt` records receive a clear legacy/provenance label only when that context matters; they remain readable.
- An unmapped legacy curriculum reference displays its preserved original label and `Canonical mapping unavailable` rather than guessing a node.
- Missing historical learning quality displays `Not recorded`.
- A historical record pinned to a retired node/version resolves in that version; the UI must not substitute the current label/path without disclosure.

## Implementation Decision Gates

This architecture does not authorize or define:

- final routes, component APIs, frontend state-management, analytics events, or design tokens;
- Daily Reality categories, recurrence, overlap, exceptions, or retention;
- the counselor-plan historical/future lock boundary, reassignment, or conflict-resolution policy beyond no silent overwrite;
- automated Student Progress/mastery calculation;
- classification of M19 `AssessmentAttempt` records;
- External Exam provider adapters, normalization, extraction, storage, or retention;
- Question/External Report media storage;
- Internal Exam retakes, accommodations, proctoring, appeals, offline delivery, and scoring formulas;
- communication attachments, editing/deletion, abuse controls, notification, and retention policy;
- AI analysis, ranking, gamification, or automated student diagnosis.

Before implementation, each released slice requires approved product scope, route/state design, backend authorization behavior, API contracts, responsive prototypes, Persian/RTL content review, accessibility acceptance criteria, and migration/compatibility behavior.
