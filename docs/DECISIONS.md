# Konkourix Architectural Decisions

This lightweight decision log records architectural constraints established by the repository and approved project requirements. It should be updated when an architectural decision is explicitly accepted or superseded.

## ADR-001 — Monorepo

**Decision:** Konkourix uses a monorepo with separate student, counselor, and API applications.

**Reason:** Shared domain tooling can coexist while student and counselor entry points remain independent.

**Status:** Accepted

## ADR-002 — Separate Student and Counselor Applications

**Decision:** Student and counselor panels remain separate applications and production domains. Neither application has a role switcher.

**Security implication:** Role and ownership authorization is enforced by the backend; frontend separation alone is not sufficient.

**Status:** Accepted

## ADR-003 — Fastify + TypeScript Backend

**Decision:** Preserve the existing Fastify and TypeScript backend.

**Status:** Accepted

## ADR-004 — PostgreSQL + Prisma

**Decision:** PostgreSQL is the persistent product store, and Prisma is the current ORM and migration system.

**Rule:** Do not replace the ORM or rewrite applied migration history without explicit architectural approval.

**Status:** Accepted

## ADR-005 — Production Containers Without Local Docker Requirement

**Decision:** Production architecture may use Docker and Compose, while ordinary local development must not depend on Docker.

**Context:** The development laptop has approximately an Intel Core i5 11th-generation processor and 8 GB RAM, and Docker is not installed.

**Rule:** Infrastructure configuration can be implemented and statically verified locally, but runtime Docker verification must occur later in an appropriate environment or server and be reported accurately.

**Status:** Accepted

## ADR-006 — Incremental Recovery / No Rewrite

**Decision:** Preserve and repair the existing working architecture incrementally rather than replacing or restarting it.

**Reason:** The repository is the source of truth, and significant verified foundation work already exists.

**Status:** Accepted

## ADR-007 — Backend Authorization Is Authoritative

**Decision:** Student and counselor roles, ownership, and relationship restrictions are enforced server-side.

**Security implication:** Frontend visibility, client state, routes, and client-supplied identifiers never substitute for backend authorization.

**Status:** Accepted

## ADR-008 — Durable Milestone Checkpoints

**Decision:** Each meaningful milestone ends with proportionate tests and verification followed by a focused Git checkpoint when explicitly authorized.

**Status:** Accepted

## ADR-009 — Runtime and Browser Environment Contract

**Decision:** Runtime and browser connectivity are configured through one validated API environment contract and one Vite-safe frontend variable per web application.

**Canonical variables:** The API retains the established `PORT` and `HOST` variables and adds `API_URL`, `STUDENT_APP_URL`, `COUNSELOR_APP_URL`, `CORS_ORIGINS`, `COOKIE_DOMAIN`, and `TRUST_PROXY`. Both web applications use `VITE_API_URL` from their own Vite environment. Public URL values are origins without paths, queries, or fragments, and production public URLs must use HTTPS.

**CORS and browser-origin policy:** `CORS_ORIGINS` is a normalized exact-origin allowlist. Wildcards, malformed values, empty entries, and automatic origin reflection are not permitted. Production validation requires both application origins in the allowlist. Allowed browser origins receive credential support, and browser clients must opt into credentials when calling the API; unknown browser origins are rejected. Requests without an `Origin` header remain available to non-browser clients, health checks, and tests. The same global origin check protects cookie-authenticated refresh and logout requests from untrusted browser origins.

**Refresh cookie policy:** Refresh cookies are `HttpOnly`, `SameSite=Lax`, scoped to `/api/v1/auth`, and `Secure` in production. `COOKIE_DOMAIN` is optional; empty or absent means a host-only API cookie and is the preferred production configuration. A domain attribute is supported only for explicit compatibility needs. Cookie clearing uses the same Domain, Path, Secure, HttpOnly, and SameSite attributes as cookie creation.

**Trusted proxy policy:** Proxy headers are not trusted by default. `TRUST_PROXY=false`, empty, or absent disables proxy trust. Enabling trust requires an explicit IP/CIDR allowlist for the controlled immediate proxy. `true` and numeric hop-count-only values are rejected because they cannot authenticate the immediate peer and can permit forwarded-header spoofing if the API is directly exposed. Even a one-proxy topology must identify the controlled ingress by IP/CIDR and must not leave the API directly reachable by untrusted clients. That topology is not implemented by this milestone.

**Development contract:** The API runs on port 4000, Student Web on 5173, and Counselor Web on 5174. Their explicit example environments keep local development Docker-independent.

**Status:** Accepted

## ADR-010 — Production Container Build Foundation

**Decision:** The API, Student Web, and Counselor Web use production-oriented multi-stage image definitions built from the monorepo root context. Dependency installation uses pnpm 11.24.0 from the root `packageManager` contract, workspace filters, and the frozen lockfile.

**Base runtime policy:** Node 24 on Debian Bookworm Slim is the API build/runtime base because it matches the verified local Node 24 runtime and avoids unnecessary Prisma/OpenSSL/native-module risk. Frontend build stages use the same Node base. Their final static runtimes use the official Nginx 1.28 Alpine image; this Nginx is an unprivileged, container-local file server only and is not the deferred public edge proxy.

**API policy:** TypeScript is compiled during image construction and production starts with `node dist/server.js` as the non-root `node` user. The committed Prisma client source is compiled into `dist`, while production dependencies are installed separately. Image construction never connects to the database or executes migrations. The existing `/health/live` endpoint is checked with Node's built-in `fetch`, avoiding an extra healthcheck package.

**Frontend policy:** Each web image requires the public `VITE_API_URL` build argument and uses the existing Vite production validation/build. Final images contain static `dist` output, run Nginx as the non-root `nginx` user on port 8080, and provide SPA history fallback. They do not run the Vite development server, terminate TLS, route public domains, or proxy API traffic.

**Secrets and operations:** Runtime secrets such as `DATABASE_URL` and `ACCESS_TOKEN_SECRET` are runtime environment inputs only and are not Docker build arguments or image defaults. Real environment files are excluded from the build context. Docker Compose, database orchestration, edge Nginx, TLS, deployment, and migration execution orchestration remain deferred. Local development remains Docker-independent, and actual image build/runtime execution is unverified until a Docker-capable environment is available.

**Status:** Accepted

## ADR-011 — Development Toolchain and Validation Contract

**Decision:** Local development standardizes on Node.js 24.x and pnpm 11.24.0. The verified Node version is recorded in `.node-version`, the supported major is enforced through the root `engines` field, and the exact pnpm version remains declared through `packageManager` and `engines`.

**Workflow policy:** `pnpm install` from the repository root is the canonical dependency installation flow. Existing root `dev`, `build`, `test`, and `typecheck` behavior remains API-scoped for compatibility. Explicit frontend commands and `pnpm validate` provide a discoverable all-workspace validation path without changing application behavior.

**Validation policy:** The canonical gate runs API tests, API type-check and production build, both frontend linters and production builds, and Prisma schema validation. Frontend production builds require an explicit public HTTPS `VITE_API_URL`. Validation neither starts services nor executes migrations.

**Environment and safety policy:** Local runtime values are copied from committed example files into ignored local environment files. Real secrets and environment files remain untracked. Local development uses a locally reachable PostgreSQL service and remains Docker-independent. Workspace-specific TypeScript versions and existing test/lint tools are preserved; this decision does not upgrade dependencies.

**Status:** Accepted

## ADR-012 — Docker Compose Infrastructure Foundation

**Decision:** The production-oriented Compose foundation consists of `api`, `student-web`, `counselor-web`, and `postgres` services built or run from the existing image contracts. All four services join one Compose-managed internal bridge network. No host ports are published; a future explicitly authorized edge ingress can join the private network and publish only the intended public entry points.

**Database and persistence policy:** PostgreSQL uses the official Debian Bookworm image on major version 17 and stores its data in the `postgres-data` named volume. The database exposes port 5432 only as internal service metadata and is reachable by the API through the `postgres` service name. PostgreSQL initialization credentials and the API `DATABASE_URL` are separate external environment inputs so Compose does not manufacture or embed credentials. Migration execution remains an explicit operational step and does not run during image construction or Compose service startup.

**Environment and secret policy:** `.env.production.example` documents the Compose variable contract with non-production placeholders. Actual values are supplied from an ignored runtime `.env` or equivalent environment; `POSTGRES_PASSWORD`, `DATABASE_URL`, and `ACCESS_TOKEN_SECRET` remain runtime-only inputs. `VITE_API_URL` is the sole public frontend build argument. Compose preserves the accepted CORS, cookie, and proxy defaults and does not encode deployed domains or secrets.

**Health and exposure policy:** PostgreSQL readiness uses `pg_isready`, and the API waits for the database health condition before starting. Under Compose, the API image's existing dependency-free health probe targets database-aware `/health`; outside Compose its default remains `/health/live`. The frontend containers need no API startup dependency because their browser bundles call the configured public API origin. No service is publicly reachable until the deferred ingress layer is designed.

**Verification boundary:** Local development remains Docker-independent. Docker Compose execution, public edge Nginx, TLS, deployment, backups, and runtime infrastructure verification remain deferred. The Compose contract is statically verified only because Docker is intentionally unavailable on the development laptop.

**Status:** Accepted

## ADR-013 — Reverse Proxy and Production Edge Foundation

**Decision:** The future public edge uses one Nginx HTTP routing layer with exact host mappings: `app.konkourix.ir` to `student-web:8080`, `counselor.konkourix.ir` to `counselor-web:8080`, and `api.konkourix.ir` to `api:4000`. Unknown hosts terminate at a default server without reaching an application. The configuration names the existing Compose services but is not yet packaged or attached to Compose; runtime integration remains a later explicit step.

**Proxy and browser policy:** The edge preserves request paths and authentication cookies and does not implement CORS or authentication. It overwrites `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto` using edge-observed request data and carries harmless HTTP upgrade headers for future WebSocket compatibility. The API must remain inaccessible to untrusted clients except through the edge and must set `TRUST_PROXY` only to the eventual controlled edge IP or network CIDR. The existing default `TRUST_PROXY=false` remains unchanged until that topology exists.

**Frontend and caching policy:** Browser routes proxy unchanged to each frontend container, whose existing `try_files` rule provides SPA history fallback. Only Vite's content-hashed `/assets/` path receives a one-year browser expiry; other frontend routes use no-cache expiry so HTML and route fallbacks do not become stale. The frontend edge hosts never proxy API traffic.

**Security policy:** The edge removes upstream duplicates and consistently emits `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`, matching the API's existing values. API Content-Security-Policy and Permissions-Policy pass through unchanged. API request bodies are limited to 2 MiB at the edge. This is a baseline only, not a claim of complete production security hardening.

**Verification boundary:** The committed edge listens on HTTP port 80 only. Certificates, TLS listeners, HSTS, DNS, Cloudflare, firewall policy, edge container/Compose integration, deployment, and production availability are deliberately absent. Nginx is unavailable locally, so syntax and runtime execution remain pending in an Nginx-capable environment; local validation is static and Docker-independent.

**Status:** Accepted

## ADR-014 — Production Security and Operational Baseline

**Decision:** Production request logging uses one application-owned structured completion event rather than Fastify's duplicate default request logs. Each event contains timestamp/start time, method, normalized route, status, duration, request ID, and authenticated user ID when available. Raw URLs/query strings, bodies, headers, cookies, tokens, password material, secrets, and database URLs are excluded. Defensive Pino redaction covers common credential fields, and unhandled/lifecycle errors log only validated short error names/codes instead of arbitrary messages or stacks.

**Abuse-control policy:** Public register, login, and refresh routes use bounded per-process, per-IP fixed-window limits with standard 429 responses and `Retry-After`. Logout remains unlimited. This is a single-process baseline only; state resets on restart and is not shared across replicas. Horizontal scaling or materially different traffic requires a reviewed shared limiter or controlled edge policy. Correct client attribution depends on trusting only the explicit controlled edge IP/CIDR.

**Health and error policy:** `/health/live` (and `/api/v1/health/live`) is process liveness without a database query. `/health` (and `/api/v1/health`) is database readiness through `SELECT 1`; no `/ready` alias exists. Health and error responses never include credentials, connection details, stack traces, or raw internal exceptions. Request IDs correlate sanitized client responses with restricted operational logs.

**Storage and recovery policy:** No upload subsystem exists. Any future file feature must add content validation, server-generated names, path containment, non-executable storage/serving, explicit size limits, malware handling, ownership metadata, and restore-tested backups before activation. PostgreSQL backup/restore is design-only: encrypted off-host logical backups, approved retention/RPO/RTO, checksums, least-privilege credentials, age/failure alerting, and periodic isolated restore verification are required before production. A Compose named volume is not a backup.

**Verification boundary:** TLS, DNS, Cloudflare, monitoring services, backup scripts/schedules, restore execution, and deployment remain unimplemented. The production checklist in `docs/SECURITY.md` records required evidence and does not mark those controls complete.

**Status:** Accepted

## ADR-015 — Production Deployment Preparation Contract

**Decision:** The intended production host is a supported Ubuntu LTS VPS with Docker Engine and the Docker Compose plugin installed on the server only. Releases use exact reviewed Git commits under a protected `/opt/konkourix` layout. Runtime configuration lives in a mode-`0600`, server-only environment file outside the checkout and is passed to Compose with an explicit `--env-file`; secrets never enter Git, frontend variables, image build arguments, or operator command lines.

**Release and migration policy:** First installs and updates validate resolved Compose configuration, build from the reviewed source, establish PostgreSQL health, apply reviewed Prisma migrations as an explicit pre-traffic operation, and verify health before public routing. Dockerfiles, Compose startup, and application entrypoints do not run migrations. The current API runtime image deliberately lacks the Prisma CLI and migration files, so a separate reviewed migration runner is a mandatory pre-deployment gate rather than an implicit application responsibility.

**Persistence and rollback policy:** PostgreSQL remains in the Compose-managed named volume; encrypted off-host backups and isolated restore evidence are required before production changes. Releases record the active commit, migration state, and backup identifier. Application rollback selects the prior exact release. Database restore is a deliberate incident operation when an incompatible data change requires it, never an automatic rollback; applied Prisma history is not edited or reversed ad hoc.

**Domain and ingress policy:** The intended HTTPS mappings remain `app.konkourix.ir` to Student Web, `counselor.konkourix.ir` to Counselor Web, and `api.konkourix.ir` to the API. `COOKIE_DOMAIN` remains empty by preference, and `TRUST_PROXY` remains false until a controlled edge address/CIDR is known. Edge packaging/Compose attachment, public ports, DNS, TLS/certificates, firewall implementation, VPS provisioning, deployment execution, and automation remain separate authorized work.

**Verification boundary:** This milestone creates documentation and a production environment template only. It does not access a VPS, install Docker locally, execute Compose, run migrations, change DNS, issue certificates, configure monitoring/backups, or claim production availability. Local development remains Docker-independent.

**Status:** Accepted

## ADR-016 — Authentication Foundation and Application Boundaries

**Decision:** The canonical versioned API prefix is `/api/v1`. Authentication exposes register, login, refresh, logout, and current-user operations below `/api/v1/auth`. Student self-registration always creates a `STUDENT`; the public API accepts no registration role field. Counselor and admin identities remain server-provisioned model-compatible roles.

**Token and session policy:** Access tokens are short-lived signed JWTs returned in the response and held only in each web application's runtime memory. Refresh tokens are opaque random values stored only as SHA-256 representations in server-side `AuthSession` rows and delivered through an `HttpOnly`, `SameSite=Lax` cookie scoped to `/api/v1/auth`; the cookie is `Secure` in production. Refresh rotates the token atomically, reuse revokes the session family, and logout revokes the current server-side session.

**Authorization policy:** Authentication resolves the current user and account status from server storage for every access token; authorization uses that server-resolved role, not browser state or a client-provided role. Reusable `requireAuth` and `requireRole` guards protect explicit `/api/v1/student/*` and `/api/v1/counselor/*` boundaries. Ownership checks remain service/store responsibilities based on authenticated identity.

**Frontend policy:** Student Web and Counselor Web have independent login screens, auth providers, API clients, protected-route shells, and logout flows. Neither provides role selection or switching. Both send credentialed requests, bootstrap from refresh cookies, keep access tokens out of Web Storage, and verify the session against their role-specific backend boundary before rendering protected content.

**Status:** Accepted

## ADR-017 — Independent Application Shells and UI Foundation

**Decision:** Student Web and Counselor Web each own an independent authenticated application shell. Each shell provides its own route map, desktop sidebar, mobile bottom navigation, page header, constrained content area, dashboard foundation, and placeholder destinations. The applications are not merged, and navigation visibility does not grant backend permission.

**Historical routing snapshot:** At this milestone, the shells used the browser History API and the established SPA fallback instead of adding a routing dependency. Student routes were dashboard, planning, study, reports, and settings. Counselor routes were dashboard, students, planning, reports, and settings. Non-dashboard feature routes were explicit empty placeholders until their own milestones were authorized.

**UI policy:** Small `Button`, `Card`, and loading/empty/error-state primitives live inside each application while their visual language may still diverge. The currently empty shared packages are not activated solely for these few primitives; shared extraction requires a stable cross-application contract rather than superficial duplication.

**Responsive and theme policy:** Both applications declare Persian/RTL document defaults, use desktop side navigation above the mobile breakpoint, and use a touch-friendly fixed bottom navigation on smaller screens. Light and dark themes are CSS-variable foundations. Only the non-sensitive per-application theme preference is stored in browser storage; authentication tokens and permission state remain governed by ADR-016.

**Status:** Accepted for the independent-shell boundary. The route inventory is superseded by later implemented milestones and `PROJECT_STATE.md`.

## ADR-018 — Account Settings and Session Revocation Policy

**Decision:** Account settings reuse the established sanitized current-user representation supplied by `/api/v1/auth/me` and the protected role-session boundaries, plus the existing role-specific `/api/v1/me/student-profile` and `/api/v1/me/counselor-profile` contracts. Student settings may edit only `educationLevel` and `schoolName`; counselor settings may edit only `bio` and `specialization`. Strict server schemas and authenticated ownership remain authoritative. User IDs, roles, account status, privileges, and counselor assignments are never editable through these contracts.

**Password policy:** Authenticated password changes require the current password and a new password satisfying the existing 12-character minimum. Current-password verification and replacement hashing use the approved salted scrypt implementation. Password replacement and revocation of all active refresh sessions for that user occur in one database transaction. This includes the current session, so both browser applications discard their in-memory access token and require a new login after success.

**Session policy:** `POST /api/v1/auth/logout-all` derives its target solely from the authenticated server-resolved user and revokes every active refresh session belonging to that user. It accepts no user ID and returns no token or session secrets. Both password change and logout-all clear the current refresh cookie with the established cookie attributes. Existing single-session logout, refresh rotation, reuse handling, short-lived access JWTs, and memory-only access-token storage remain unchanged. Already-issued access JWTs are stateless and remain valid only until their short expiry; refresh is unavailable after revocation.

**Frontend policy:** Student Web and Counselor Web retain independent settings pages, auth providers, API clients, role boundaries, and profile fields. Each page provides its existing theme preference, safe localized states, current-session logout, and confirmed logout-all. No device list is exposed because the current session model only stores raw IP and user-agent metadata; no schema expansion is justified for this milestone.

**Status:** Accepted

## ADR-019 — Active Study Execution Integrity

**Decision:** `StudySession` remains the sole execution record. `DailyTask` represents planned work and may own zero or any number of sequential `StudySession` intervals. A student may have only one live server-timed `StudySession` (`endedAt = null`) at an instant, but may create unlimited sequential sessions across tasks and may return to any still-pending task.

**Switching policy:** Changing tasks closes the current continuous interval and creates a new `StudySession` for the target at the same server transition timestamp. Returning to an earlier task creates another session; it does not resume or mutate its previous interval. A same-target retry reuses the current active session. This is a timer-integrity rule, not a study-plan restriction.

**Concurrency policy:** Start, switch, finish, and terminal linked-task lifecycle mutation serialize on the authenticated student's stable PostgreSQL `StudentProfile` row inside database transactions. Process-memory locks, Redis, and duplicate lifecycle fields are not used.

**Historical-entry policy:** Manual completed historical `StudySession` records remain supported and distinct from live execution. Client-controlled generic routes cannot create or reopen an active session. Execution never automatically completes or skips a `DailyTask`.

**Status:** Accepted

## ADR-020 — Persisted Study Session Cancellation Recovery

**Decision:** `StudySession` remains the sole execution record. Cancellation is represented only by nullable server-owned `cancelledAt`; no status enum or new execution entity is introduced. Active sessions have both `endedAt` and `cancelledAt` null, finished sessions have only `endedAt`, and cancelled sessions have only `cancelledAt`. A database check constraint prevents a session from being both finished and cancelled.

**Recovery policy:** A cancelled live interval remains in history as recovery/audit metadata but has no completed duration and contributes neither recorded minutes nor completed-session count. Cancellation never changes `DailyTask` lifecycle. A student may start another `StudySession`, including for the same task, immediately after cancellation.

**Switching policy:** Switching accepts `FINISH` or `CANCEL` for a different current session and performs that transition plus target start atomically at one server timestamp. Omission remains backward-compatible with `FINISH`; a same-target request reuses the active interval without fragmenting it.

**Planning policy:** Active or finished execution blocks rescheduling, while cancelled-only history does not. Active execution still blocks a terminal task outcome; cancelled history does not. The outcome remains an independent student decision.

**Status:** Accepted

## ADR-021 — Raw Finished Study Session Feedback

**Decision:** `StudySession.focusRating` and `StudySession.studyQualityRating` are optional raw student self-report fields. They live directly on `StudySession`; no feedback, metric, review, or execution entity is introduced.

**Lifecycle policy:** Ratings belong only to finished sessions (`endedAt != null`, `cancelledAt = null`). Active and cancelled sessions have null ratings. Each recorded value is an integer from 1 through 5, enforced at both request and database boundaries, and may be cleared later by the owning student.

**Separation policy:** Feedback does not change `DailyTask` lifecycle, schedule, provenance, or ownership. It is not counselor evaluation, analytics, an aggregate, or a calculated performance score.

**Status:** Accepted

## ADR-022 — Completed Assessment Attempts

**Decision:** `AssessmentAttempt` is the independent student-owned record for one completed assessment submission/result bundle. It is separate from `DailyTask` planned intent and `StudySession` study execution, has no StudySession relation, and stores only completed intervals with raw correct, incorrect, and blank counts. Question count and duration are derived; score, accuracy, percentage, ranking, and other interpretations are not persisted or calculated by this foundation.

**Relationship policy:** An attempt may optionally reference an owned `DailyTask`, subject, and topic. These references are immutable provenance after creation, and a topic requires its matching subject. Attempt creation never changes task lifecycle or `plannedTestCount`. A valid linked attempt blocks rescheduling like finished study execution, while invalidated-only attempt history does not.

**Lifecycle and ownership policy:** There is no live assessment lifecycle, timer, start, finish, pause, resume, or cancellation. The authenticated student owns creation, reading, correction of raw facts, and server-timestamped soft invalidation; normal product APIs do not hard-delete attempts. Counselor access remains mutation-free. Creation, invalidation, and rescheduling serialize on the student's stable PostgreSQL profile row where their ordering affects scheduling integrity.

**Status:** Accepted

## ADR-023 — Official Product Domain Baseline

**Decision:** Konkourix is a specialized exam-preparation ecosystem organized around the loop Plan → Execute → Measure → Improve. The official core domains are Planning (`DailyTask`), Execution (`StudySession`), and Assessment (`AssessmentAttempt`). The earlier generic task-management framing is superseded; task capabilities remain valid only as educational planning capabilities within this domain map.

**Separation policy:** Planned intention, actual study, and completed assessment evidence keep independent meanings and lifecycles. Optional provenance links do not imply dependency: a task may have multiple study sessions or assessment attempts, and approved historical/test-only workflows may record either evidence type without manufacturing the other. No session or attempt automatically decides a task outcome.

**Architecture policy:** The current implementation remains a modular monolith with separate Student Web and Counselor Web applications, one Fastify API, PostgreSQL, and Prisma. Domain boundaries are logical and enforceable without becoming microservices. Later extraction requires evidence. The curriculum statement in this ADR is refined and superseded by ADR-024; the remainder stays accepted.

**Documentation policy (superseded 2026-10-02):** [PRODUCT_MAP.md](PRODUCT_MAP.md) now defines intended product behavior, [ROADMAP.md](ROADMAP.md) defines sequencing, [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) defines visual rules, and [PROJECT_STATE.md](PROJECT_STATE.md) defines implemented reality. `PRODUCT_VISION.md`, `DOMAIN_MAP.md`, `PRODUCT_DECISIONS.md`, `UX_PRINCIPLES.md`, and `FUTURE_EXPANSION.md` are supporting or historical and cannot override the canonical documents.

**Status:** Accepted

## ADR-024 — Canonical Deep Curriculum Architecture

**Decision:** Konkourix uses one centrally managed canonical curriculum tree with semantic depth from رشته through درس, فصل, بخش, مبحث, and مفهوم/ریزمبحث اتمیک. Users reference canonical nodes but do not create, fork, rename, move, or delete curriculum structure. Domain experts manually curate changes through controlled governance.

**Rejected architecture:** User-created student, counselor, teacher, or school curriculum trees. The repository's existing student-owned `StudySubject` and `Topic` behavior is transitional and does not define the target architecture. Reconciliation requires a separately approved data/API/UX migration plan; this ADR changes no current schema or runtime behavior.

**Student-progress policy:** Student customization is a separate Student Topic Progress layer keyed to canonical nodes. It may contain mastery from 1 through 5, status (شروع نشده, در حال یادگیری, نیازمند مرور, مسلط, or ضعیف), notes, review dates, weaknesses, strengths, and last activity. Progress changes never mutate canonical curriculum.

**AI policy:** AI may later consume approved curriculum data for analysis, recommendations, weak-point detection, and learning assistance. AI must not generate or modify the canonical curriculum.

**Planning policy:** `DailyTask` is a planned learning execution unit, not a generic todo or an actual execution record. The target task contract references a canonical curriculum node, activity type, planned duration, planned questions, and expected outcome. Target result feedback records completed/incomplete state and five-level learning quality with optional note/difficulty/problem details. Task-level learning quality is distinct from the implemented interval-level `StudySession.studyQualityRating`.

**Testing policy:** Practice/exercises are learning activities without an exam lifecycle. External exams are provider-owned and produce performance reports only. Internal online exams are future Konkourix-owned delivery flows requiring a canonical-curriculum-linked Question Bank, moderation, Exam Builder, timed delivery, and answer evaluation. These concepts must not share a false lifecycle merely because all may involve questions.

**Question policy:** Future questions reference canonical nodes through an appropriate atomic concept. If teacher contribution is supported, one possible governed workflow is teacher submission followed by admin review before an approved question enters the bank; submission never implies automatic publication. Canonical linkage supports precise search, exam generation, weakness analysis, and targeted practice.

**Expansion policy:** Personal and counselor-created learning tasks remain attributable and distinguishable while referencing the same canonical curriculum. The canonical tree supplies stable references for future counselors, teachers, schools, question banks, online exams, and educational content without redesigning the taxonomy.

**Dependency policy:** Canonical curriculum management precedes Student Topic Progress, which precedes the Question Bank, Online Exam Engine, and Advanced Analytics foundations.

**Status:** Accepted

## ADR-025 — Canonical Curriculum Lifecycle and Legacy Compatibility

**Decision:** Canonical curriculum uses opaque stable logical-node IDs, immutable node revisions, and immutable published curriculum releases. The ordered hierarchy supports Track/Field → Subject → Chapter → Section → Topic → Micro Topic/Atomic Concept. A compatible rename or reorder retains logical identity; a semantic split or merge creates new identities and reviewed lineage. Published nodes are deprecated or retired rather than hard-deleted.

**Governance policy:** Domain experts edit and review draft releases. An authorized admin publishes an internally consistent release after structural and impact validation. Students, counselors, teachers, schools, integrations, and AI cannot mutate canonical curriculum.

**Compatibility policy:** Adoption from `StudySubject` and `Topic` is non-destructive. Legacy identifiers and historical task/session/assessment links remain readable. An explicit reviewed mapping registry supports staged compatibility reads, canonical references for new writes, later disabling of legacy writes, and continued historical reads. Dual writes are not assumed, and no applied migration is rewritten.

**Specification:** [CANONICAL_CURRICULUM_SPECIFICATION.md](CANONICAL_CURRICULUM_SPECIFICATION.md)

**Status:** Accepted target architecture; not implemented

## ADR-026 — Versioned Counselor Planning and Immutable Published Intention

**Decision:** Counselors author plans in draft revisions and explicitly publish immutable plan versions. Future, unexecuted blocks may be moved, copied, replaced, or adjusted in a later revision, including workload, activity, duration, planned questions, expected outcome, and canonical curriculum references. Publishing is atomic from the student's perspective.

**Student and history policy:** Students execute and report reality and may create separately attributed personal tasks. They cannot edit counselor-authored plan content. Published historical intention and linked execution/assessment evidence remain immutable and retain the governing plan/version context. Plan creation, publication, supersession, and material changes require durable audit records.

**Specification:** [PLANNING_ARCHITECTURE.md](PLANNING_ARCHITECTURE.md)

**Status:** Accepted target architecture; not implemented

## ADR-027 — Separate Practice, External Report, and Internal Exam Domains

**Decision:** Practice is daily learning activity without an exam-delivery lifecycle. External Exam Reports record evidence for provider-owned exams such as Ghalamchi, Maz, and Gaj without owning their questions, delivery, scoring, or ranking. Internal Konkourix Exams own a distinct Question Bank → Exam Builder/version → Question Selection → Student Attempt → Answer Evaluation → Result lifecycle.

**Separation policy:** These domains may contribute to shared read/reporting projections but do not share one write lifecycle. None requires a fake `StudySession` or automatically determines task outcome. The implemented generic completed `AssessmentAttempt` remains current behavior and is not declared the final persistence model for all three capabilities.

**Specification:** [ASSESSMENT_ARCHITECTURE.md](ASSESSMENT_ARCHITECTURE.md)

**Status:** Accepted target architecture; partially implemented only as completed-attempt evidence

## ADR-028 — Question Bank Provenance, Moderation, and Multi-Node Curriculum Links

**Decision:** Questions have stable logical identities and immutable approved versions. Submissions record author/source attribution, contributor provenance, and copyright/license metadata. Educational, answer/solution, copyright, and curriculum-link review precede publication. Submission never implies approval, and withdrawal does not corrupt delivered exam history.

**Curriculum policy:** Question and Canonical Curriculum Node have an explicit many-to-many relationship. Every published question has reviewed canonical links precise enough for search, practice, exam construction, and later analysis. The 2026-10-02 Product Map decision makes a Primary Curriculum Link optional for display/grouping. Ancestor storage/derivation, detailed link roles, and linkage revision mechanics remain implementation design concerns.

**Specification:** [QUESTION_BANK_ARCHITECTURE.md](QUESTION_BANK_ARCHITECTURE.md)

**Status:** Accepted target architecture; not implemented

## ADR-029 — Communication Channel Separation

**Decision:** Communication is divided into General Chat, Ticket/Thread, and Suggestions. General Chat is lightweight relationship-scoped conversation. Tickets are structured, resolvable study, plan, report-review, or technical issues. Suggestions are governed curriculum-change, question-submission, or product-improvement workflows.

**Boundary policy:** Konkourix does not create a chat channel for every entity. A communication record may hold a typed contextual reference, but messages do not become authoritative plan changes, curriculum edits, assessment corrections, audit history, or private counselor notes. A unified inbox is a projection and does not merge source models.

**Specification:** [COMMUNICATION_ARCHITECTURE.md](COMMUNICATION_ARCHITECTURE.md)

**Status:** Accepted target architecture; not implemented

## ADR-030 — Student-Counselor Acquisition and Human-Reviewed Introduction

**Decision:** Students may register and use the student product without a counselor. Relationships may begin through a counselor invitation code or through a student counselor request. In the request flow, a Super Admin evaluates the student's stated conditions, introduces suitable counselors, and the student makes the final selection.

**Matching policy:** There is no automatic matching, silent assignment, or ranking-driven placement. Software may assist an authorized admin's review later, but it cannot replace human introduction and student selection. Relationship transitions require actor, time, and reason auditability.

**Specification:** [COUNSELOR_ECOSYSTEM.md](COUNSELOR_ECOSYSTEM.md)

**Status:** Accepted target architecture; relationship storage exists, acquisition workflows do not

## ADR-031 — Private Counselor Notes Authorization Boundary

**Decision:** Private Counselor Notes are confidential records for behavior observations, weaknesses, and reminders. A note is readable only by its owning counselor and specifically authorized admins. Students, other counselors, teachers, and ordinary support roles cannot read it; reassignment does not automatically transfer it.

**Boundary policy:** Private notes are not chat, student-visible feedback, plan content, structured progress facts, or input to automatic matching/adverse automated decisions. Access and exceptional transfer require durable audit. Retention, export, deletion, and exceptional-transfer rules require later approval.

**Specification:** [COUNSELOR_ECOSYSTEM.md](COUNSELOR_ECOSYSTEM.md)

**Status:** Accepted target architecture; not implemented

## ADR-032 — Role-Specific Experience and Visual Direction

**Decision:** Konkourix presents a specialized Konkur ecosystem rather than a generic todo, calendar, CRM, or administrative product. Student experiences prioritize motivation, vitality, progress, and the next meaningful action. Counselor experiences prioritize control, planning speed, monitoring, and analysis.

**Visual policy:** The target identity is blue-based, modern, premium, comfortable, and energetic. Glass UI elements may be used selectively where accessibility, contrast, readability, and performance remain strong. Visual style never substitutes for domain clarity, state feedback, or backend authorization. Exact tokens and components require a later UI specification.

**Status:** Accepted UX direction; not implemented by this documentation decision

## Subsequent Standalone ADRs

Accepted decisions after ADR-032 are maintained as standalone records in [`adr/README.md`](adr/README.md). The current approved batch contains ADR-033, ADR-036, ADR-037, ADR-038, ADR-039, ADR-041, and ADR-043. Numbers omitted from that batch remain reserved and are not renumbered or implicitly approved.
