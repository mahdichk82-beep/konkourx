# Konkourix Project State

This document is the canonical operational memory for resuming work on the Konkourix repository. It records current implemented reality, approved direction, and retained historical checkpoints; it is not a claim of overall product completion.

## Project

Konkourix is a specialized exam-preparation ecosystem with independent public entry points:

- Student application: `app.konkourix.ir`
- Counselor application: `counselor.konkourix.ir`
- API: `api.konkourix.ir`

## Current Phase

**P0.5 — SCHEDULING CONTRACT UNBLOCK FOR COUNSELOR PLANNING** is the current implemented milestone in the working tree. It adds the minimal exact-time persistence and API contract required by the approved Counselor 24×4 planning experience without implementing that UI.

Phase 2 Milestone 19 — AssessmentAttempt Foundation remains the clean runtime comparison baseline at commit `76bc4d77dd015ef458e898d974fa23537de85948`. Historically completed core milestones remain valid. Authentication, independent browser application shells, account settings, student planning and task lifecycle, student-owned subject/topic management, study execution and recovery, completed assessment-attempt recording, assigned-student counselor access, and counselor task creation are verified foundations; later capabilities are not implied complete.

Post-checkpoint curriculum work entered an over-engineered governance and Knowledge direction. Recovery Foundation 2 removes that direction from the active API and package commands. Authored Curriculum data derived from `cori.docx` remains valuable, authoritative, and protected.

Recovery is being performed through forward corrective commits. Applied migration history will not be reset, removed, renamed, or rewritten.

- Phase 0 completion estimate from the last core audit: **50%**
- Current recovery confidence: **HIGH**
- Recovery source-lock date: **2026-09-30**
- Rejected-runtime decoupling date: **2026-09-30**

## Current Architecture Baseline

### CURRENT IMPLEMENTED STATE

- Runtime comparison baseline: `76bc4d77dd015ef458e898d974fa23537de85948` (`feat: add assessment attempt foundation`).
- The active API registers only authenticated read endpoints for Canonical Curriculum scopes, placements, detailed representations, nodes, children, and search.
- Rejected import/bootstrap commands, taxonomy/content/Knowledge Package modules, review runtime, package data, and their behavior tests are removed.
- The runtime is generated from `docs/curriculum/CANONICAL_CURRICULUM.md` into a checked-in deterministic JSON artifact included in the API production image. It contains 4 scopes, 12 scope/grade placements, 74 subject placements, 67 detailed source representations, and 5,484 label-bearing source nodes covering the locked 6,588-entry detailed source block.
- Canonical Curriculum has no database persistence, write/admin API, governance, authoring, import, or publication/version workflow. DailyTask stores validated opaque Curriculum runtime IDs and historical label/path snapshots only; these task references do not make PostgreSQL authoritative over Curriculum.
- A DailyTask may contain multiple `NODE` or `PLACEMENT` targets. `EXACT` selects the referenced item; `WHOLE` on a node expands only direct children (or the leaf itself). `WHOLE` on a placement and duplicate/overlapping item expansion are rejected.
- Task execution items are student-toggleable while the task is pending. Responses expose completed, total, and remaining item counts. Counselor task reads expose this same coverage for actively assigned students.
- `PARTIAL` is a server-timestamped terminal task outcome requiring at least one completed and one unfinished Curriculum item. It preserves unfinished coverage without reopening the task or automatically creating a compensatory task.
- `DailyTask.scheduledFor` remains the calendar date. Nullable `startMinuteOfDay` and `endMinuteOfDay` provide an exact same-day planner window for new tasks; legacy date-only tasks remain valid without fabricated times. API responses derive `miniBoxSpan`, and database/API validation enforces paired, ordered, 15-minute-aligned values within `00:00–24:00`.
- Counselor creation, batch creation, focused rescheduling, and the assigned-task planning update contract support exact time windows. Student personal-task creation and rescheduling remain backward compatible and may also carry the optional exact window.
- The local development database has all 21 tracked migration directories applied. The four additive historical Curriculum migrations remain immutable history, followed by the RF4 retirement migration, task-reference planning migration, and exact schedule-window migration.
- The Prisma schema and generated client no longer expose historical Curriculum governance/import/review/mapping/capability models.
- PostgreSQL contains no Canonical Curriculum persistence and no historical Curriculum governance tables, triggers, functions, or enum types.
- Product loop: **Plan → Execute → Measure → Improve**.
- Planning domain: `DailyTask` records planned educational intention.
- Execution domain: `StudySession` records actual study intervals.
- Assessment domain: `AssessmentAttempt` records completed assessment submissions.
- `StudySession` and `AssessmentAttempt` are independent. Neither automatically completes a task, and an assessment never requires a fake study session.
- Architecture style: modular monolith with Student Web, Counselor Web, one Fastify API, PostgreSQL, and Prisma.
- Student-owned `StudySubject`/`Topic` behavior remains implemented until an approved recovery milestone changes it.

### APPROVED FUTURE STATE

- `cori.docx` is the authoritative educational source. Multiple source-defined organizations and unequal depths are preserved without invented intermediate levels.
- Runtime Curriculum is a projection used for student/counselor planning, progress measurement, reporting, and future question linking; it is not educational authority.
- A future Question Bank remains separate from Curriculum authority.
- Product scope and experience direction are governed by [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md), [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md), [UX_PRINCIPLES.md](UX_PRINCIPLES.md), [BRAND_IDENTITY.md](BRAND_IDENTITY.md), and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- P1 Counselor Planning Experience may now render and edit the approved 96-position daily grid using the exact-time task contract. P0.5 does not implement that frontend.

### EXPLORATORY / DEFERRED

- Additional product-record reference integration remains deferred. Any Product Owner-approved source change requires explicit reference migration and ID-stability planning for stored task references.
- A counselor-created compensatory task from unfinished `PARTIAL` items is approved future behavior but has no automatic task generation or UI in the current milestone.
- Mastery is approved as a future five-level model with separate student self-rating, counselor rating, and system-estimated signals. It has no persistence or UI yet.
- Historical Knowledge Package, scientific review, taxonomy, and content-production designs below are not approved future state.

Historical milestone sections below are preserved as records of their time. When historical text conflicts with the source and scope locks above, the current locks govern.

## Phase 1 Milestone 3 Starting Checkpoint

- HEAD: `b076541e2157ad98af9dea0bf71602cd2d40a6e1`
- Message: `feat: establish application shells and dashboard foundations`

Foundation repair checkpoint:

- Commit: `5fffa805d99e1fc870410c3b5115b2924059399f`
- Message: `fix: repair core foundation data semantics`

Study Tracking recovery checkpoint:

- Commit: `8905e381fdcf820bc058a7acd81fc794c7cbfc08`
- Message: `feat: complete student study tracking recovery`

## Phase 2 Milestone 1 Starting Checkpoint

- HEAD: `11c523d05418a6e3d57039b29f45d5b08e23012c`
- Message: `feat: complete account settings and session management`

## Phase 2 Milestone 2 Starting Checkpoint

- HEAD: `634e99083d24d4e62d941390108d0f17f476a82c`
- Message: `feat: add student today planning`

## Phase 2 Milestone 3 Starting Checkpoint

- HEAD: `1173b57823d4416714ee2736f8a9ca858767b367`
- Message: `feat: add student topic foundation`

## Phase 2 Milestone 4 Starting Checkpoint

- HEAD: `8f9092a18d1a43f70096061b0aa2780dfc31209d`
- Message: `feat: connect tasks to topics`

## Phase 2 Milestone 6 Starting Checkpoint

- HEAD: `b3fa0cfc084bcfe7c3ab9fb8b5daf98f6b952e9b`
- Message: `feat: add task provenance foundation`

## Phase 2 Milestone 7 Starting Checkpoint

- HEAD: `0b6457970ccbd2f126c9f292c434e886645ec436`
- Message: `feat: add counselor task creation`

## Phase 2 Milestone 8 Starting Checkpoint

- HEAD: `196c84b4bd79a72fd2a330b19d9bf2d3ed6a09ea`
- Message: `feat: add counselor task visibility`

## Phase 2 Milestone 9 Starting Checkpoint

- HEAD: `61ba9be74c688baadcd63bc6cbb8986e7487d4cc`
- Message: `feat: add task execution feedback`

## Phase 2 Milestone 10 Starting Checkpoint

- HEAD: `1d5afb64a8435c853c3f8367d5f931ad1fe1f6e9`
- Message: `feat: add weekly planning foundation`

## Phase 2 Milestone 11 Starting Checkpoint

- HEAD: `7577ce6e9a203ce2979c4d933739c730d1d742c3`
- Message: `feat: add task rescheduling permissions`

## Phase 2 Milestone 12 Starting Checkpoint

- HEAD: `07a11f51b6bcbd23653df1c6eb3ec080a3af4d2e`
- Message: `feat: add weekly drag and drop foundation`

## Phase 2 Milestone 13 Starting Checkpoint

- HEAD: `1c84b1d091135ad0c6f53f2487351b6d54eda348`
- Message: `feat: add task lifecycle foundation`

## Phase 2 Milestone 14 Starting Checkpoint

- HEAD: `1c84b1d091135ad0c6f53f2487351b6d54eda348`
- Working tree already contained the intentional, uncommitted Phase 2 Milestone 13 implementation when this milestone began.

## Phase 2 Milestone 15 Starting Checkpoint

- HEAD: `1c84b1d091135ad0c6f53f2487351b6d54eda348`
- Message: `feat: add task lifecycle foundation`
- Working tree already contained the intentional, uncommitted Phase 2 Milestone 13 and Milestone 14 implementations when this milestone began. They were preserved without reset, clean, checkout, migration-history rewrite, or commit.
- Development data preflight found zero active StudySessions and zero students with duplicate active StudySessions.

## Phase 2 Milestone 16 Starting Checkpoint

- HEAD: `7ca90b52291da7805474b5aa8174b4a39e8e6751`
- Message: `feat: complete counselor planning and study execution foundations`
- Starting working tree: **clean**
- Development StudySession lifecycle preflight: **0 active, 0 finished, 0 total**
- The accepted Milestone 15 checkpoint and all 11 existing migrations were preserved without reset, clean, checkout, history rewrite, or commit.

## Phase 2 Milestone 17 Starting Checkpoint

- HEAD: `b8f7593025c432532f368bc3861bc228a39eea92`
- Message: `feat: add study session recovery foundation`
- Starting working tree: **clean**
- Development StudySession lifecycle preflight: **0 total, 0 active, 0 finished, 0 cancelled**
- The accepted Milestone 15/16 checkpoint and all 12 existing migrations were preserved without reset, clean, checkout, history rewrite, or commit.

## Historical Verified Baseline

This earlier Phase 0 snapshot was re-verified on 2026-09-09 after successful local dependency-state recovery. It is retained as history and does not override the current architecture baseline above.

- Working tree before this documentation update: clean
- API tests: **49/49 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- PostgreSQL migration status: **PASS**; 5 migrations found and the database is up to date
- Package manifests and `pnpm-lock.yaml`: unchanged by dependency recovery

## Phase 0 Audit Status

| Area | Status |
| --- | --- |
| Backend foundation | MOSTLY COMPLETE |
| Database foundation | MOSTLY COMPLETE |
| Environment and security | HARDENED BASELINE; PRODUCTION VERIFICATION PENDING |
| Student Web | PRODUCT FOUNDATION IMPLEMENTED; UX INCOMPLETE |
| Counselor Web | PRODUCT FOUNDATION IMPLEMENTED; UX INCOMPLETE |
| Shared packages | SCAFFOLDED ONLY |
| Development workflow | HARDENED; LOCAL VALIDATION COMPLETE |
| Container image definitions | COMPLETE; RUNTIME UNVERIFIED |
| Docker Compose | FOUNDATION COMPLETE; RUNTIME UNVERIFIED |
| Edge Nginx | FOUNDATION COMPLETE; SYNTAX/RUNTIME UNVERIFIED |
| Deployment | PREPARATION COMPLETE; EXECUTION NOT STARTED |
| Backup/Restore | DESIGN COMPLETE; EXECUTION UNVERIFIED |
| CI/CD | NOT STARTED |
| Documentation | ARCHITECTURE BASELINE SYNCHRONIZED; OPERATIONAL DOCUMENTATION ONGOING |

## Completed Phase 0 Milestones

### Milestone 1 — Runtime & Browser Environment Contract

**Status: COMPLETE**

Completed and locally verified on 2026-09-09:

- Central API runtime validation covers public origins, the explicit CORS allowlist, optional cookie domain, and explicit trusted-proxy addresses.
- Production public origins require HTTPS, and both browser application origins must be included in production CORS configuration.
- Student Web and Counselor Web each require their own build-time `VITE_API_URL`; production builds reject non-HTTPS API origins.
- Local ports are explicit: API 4000, Student Web 5173, and Counselor Web 5174.
- Browser CORS is exact-origin and credentialed. Unknown origins are rejected, while requests without an `Origin` header preserve non-browser behavior.
- Refresh cookies are `HttpOnly`, `SameSite=Lax`, limited to `/api/v1/auth`, `Secure` in production, and host-only by default. Logout clears them with matching attributes.
- Proxy headers are ignored by default. Proxy trust accepts only configured IP/CIDR entries and rejects trust-all and hop-count-only values.
- Local development remains Docker-independent. No Docker, Nginx, deployment, database schema, or migration work is part of this milestone.

Intended production browser/runtime values are `API_URL=https://api.konkourix.ir`, `STUDENT_APP_URL=https://app.konkourix.ir`, `COUNSELOR_APP_URL=https://counselor.konkourix.ir`, and a `CORS_ORIGINS` list containing both application origins. Each frontend uses `VITE_API_URL=https://api.konkourix.ir`. `COOKIE_DOMAIN` should remain empty for the preferred host-only API cookie. `TRUST_PROXY` remains disabled until a controlled ingress exists, then must name that proxy by IP/CIDR.

Milestone verification:

- API tests: **61/61 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**

The official Phase 0 completion estimate remains **50%** because the existing project state has no milestone weighting rubric from which to calculate a defensible new percentage. Confidence remains **HIGH** based on the completed validation above.

### Milestone 2 — Production Container Build Foundation

**Status: COMPLETE (STATICALLY VERIFIED; DOCKER EXECUTION PENDING)**

Completed and locally verified on 2026-09-10:

- API, Student Web, and Counselor Web have separate production-oriented multi-stage Dockerfiles using the repository-root build context.
- Image builds use Node 24, pnpm 11.24.0, workspace filters, and `pnpm-lock.yaml` with `--frozen-lockfile`.
- The API final image contains production dependencies and compiled `dist`, starts with `node dist/server.js`, runs as the non-root `node` user, and exposes port 4000.
- The committed Prisma client source is compiled with the API. Image construction neither connects to a database nor generates or executes migrations.
- The API image has a dependency-free Node healthcheck for the existing `/health/live` endpoint.
- Both frontend images require public build-time `VITE_API_URL`, run the existing Vite production build, and serve only static `dist` output through a shared container-local Nginx configuration.
- The frontend static server runs as non-root on port 8080 and provides SPA history fallback. It has no public-domain routing, TLS, API proxy, or cross-service ingress behavior.
- Real environment files, local dependency/output directories, logs, caches, and repository metadata are excluded from Docker build context without excluding workspace manifests, source, or Prisma files.
- Runtime secrets are not build arguments or image defaults. Local development remains Docker-independent.

Milestone verification:

- API tests: **61/61 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Container files and referenced paths: **STATIC REVIEW PASS**
- Docker image build/runtime execution: **NOT RUN; Docker is intentionally unavailable locally**

The official Phase 0 completion estimate remains **50%** because no explicit milestone weighting rubric exists. Confidence remains **HIGH** for the source and static container contract; actual image execution remains pending in a Docker-capable environment.

### Milestone 3 — Development Workflow & Repository Hardening

**Status: COMPLETE**

Completed and locally verified on 2026-09-10:

- Node.js 24.x is the supported local runtime, with verified version 24.19.0 recorded in `.node-version` and the root package engine contract.
- pnpm 11.24.0 remains the only package manager, declared through `packageManager` and `engines`; no dependency versions were changed.
- A root README documents installation, environment setup, local PostgreSQL assumptions, application development commands, and the Docker-independent workflow.
- Existing API-scoped root commands retain their behavior. Explicit frontend development/build commands, aggregate lint/build commands, and the canonical `pnpm validate` gate are available at the root.
- The canonical validation gate covers API tests/type-check/build, both frontend lint/build flows, and Prisma schema validation without starting services or running migrations.
- Root and per-app environment examples remain the source for ignored local configuration. No real environment file or secret was added.
- `.gitignore` now explicitly covers Vite/cache/pnpm-store directories and TypeScript build metadata while continuing to preserve source, Prisma schema/migrations, the lockfile, workspace configuration, and documentation.

Milestone verification:

- API tests: **61/61 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical root validation workflow: **PASS**
- Docker required: **NO**

The official Phase 0 completion estimate remains **50%** because no explicit milestone weighting rubric exists. Confidence remains **HIGH** based on the complete local validation gate.

### Milestone 4 — Docker Compose Infrastructure Foundation

**Status: COMPLETE (STATICALLY VERIFIED; DOCKER EXECUTION PENDING)**

Completed and locally verified on 2026-09-10:

- The root `docker-compose.yml` defines API, Student Web, Counselor Web, and PostgreSQL services using the existing application Dockerfiles and the official PostgreSQL 17 Bookworm image.
- PostgreSQL data persists in the Compose-managed `postgres-data` named volume. No host path or backup behavior is imposed, and the current API has no upload-storage requirement needing a volume.
- All services join a dedicated internal bridge network. No host ports are published, including PostgreSQL 5432; a later edge-ingress milestone must deliberately provide public reachability.
- PostgreSQL credentials, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, public origins, and the public `VITE_API_URL` build input are external environment values. The committed `.env.production.example` contains placeholders only, and deployed `.env` values remain ignored.
- PostgreSQL readiness uses `pg_isready`. The API starts only after PostgreSQL reports healthy and uses its existing Node health probe against database-aware `/health` under Compose.
- Frontend services build with explicit `VITE_API_URL` and continue to serve static output only. They do not proxy the API and have no artificial startup dependency on it.
- Compose neither runs migrations nor embeds database/authentication secrets. Migration execution policy, public Nginx ingress, TLS, deployment, backups, monitoring, and CI/CD remain deferred.
- Local development remains Docker-independent. Compose and container runtime execution were not attempted because Docker is intentionally unavailable locally.

Milestone verification:

- API tests: **61/61 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Compose YAML, interpolation contract, build paths, ports, network, volume, health, and secret handling: **STATIC REVIEW PASS**
- Docker Compose runtime execution: **NOT RUN; Docker is intentionally unavailable locally**

The official Phase 0 completion estimate remains **50%** because no explicit milestone weighting rubric exists. Confidence remains **HIGH** for the validated source and static infrastructure contract; actual Compose execution remains pending in a Docker-capable environment.

### Milestone 5 — Reverse Proxy & Production Edge Foundation

**Status: COMPLETE (STATICALLY VERIFIED; NGINX EXECUTION PENDING)**

Completed and locally verified on 2026-09-10:

- `infrastructure/nginx/` defines an HTTP-only edge configuration with exact virtual hosts for `app.konkourix.ir`, `counselor.konkourix.ir`, and `api.konkourix.ir`. Unknown hosts are rejected by a default server.
- Upstreams use the existing service names and internal ports: Student Web and Counselor Web on 8080 and API on 4000. Request URIs are preserved without application-route rewrites.
- The edge overwrites `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto` and includes harmless HTTP upgrade handling. CORS, authentication, and cookie attributes remain application responsibilities.
- The trusted-proxy contract is unchanged. When the edge is later attached to a controlled network, the API must explicitly trust only its source IP/CIDR and must not be directly exposed to untrusted clients.
- Both frontend hosts proxy all browser paths to their existing static containers, preserving the container-level SPA fallback. Only Vite's hashed `/assets/` path receives long-lived browser expiry; general routes use no-cache expiry.
- The edge provides `nosniff`, frame denial, and no-referrer headers without weakening the API's existing values. API CSP and Permissions-Policy remain untouched, and API request bodies are capped at 2 MiB at the edge.
- TLS listeners, certificates, HSTS, DNS, Cloudflare, deployment, firewall rules, and edge Compose integration are absent and explicitly deferred. The defined domains are intended routing identities, not a claim that DNS or production traffic is active.

Milestone verification:

- API tests: **61/61 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Nginx host/upstream/header/cache/SPA/security structure: **STATIC REVIEW PASS**
- Nginx syntax/runtime execution: **NOT RUN; Nginx and Docker are intentionally unavailable locally**

The official Phase 0 completion estimate remains **50%** because no explicit milestone weighting rubric exists. Confidence remains **HIGH** for the validated source and static edge contract; Nginx syntax and runtime execution remain pending in an appropriate environment.

### Milestone 6 — Production Security & Operational Hardening

**Status: COMPLETE (LOCAL CONTRACT VERIFIED; PRODUCTION OPERATIONS PENDING)**

Completed and locally verified on 2026-09-10:

- API request completion logs now use an explicit safe schema containing request time, method, normalized route, status, duration, request ID, and authenticated user ID when available. Fastify's duplicate default request logs are disabled through its current `LogController` API.
- Pino redaction covers common credential fields. Unhandled and lifecycle error logs omit arbitrary messages/stacks and retain only validated short error names/codes plus request correlation.
- Edge access logs now use an edge-generated request ID and normalized URI without query arguments. Query strings, referrers, cookies, authorization headers, and bodies are not part of the edge log format.
- Bounded in-memory per-IP limits protect public registration, login, and refresh routes with standard 429/`Retry-After` responses. Logout remains available. The per-process/non-distributed limitation is documented for future scaling.
- Existing security headers, exact CORS allowlist, secure refresh-cookie attributes, trusted-proxy allowlist, strict input validation, authorization, scrypt password hashing, and token/session behavior were reviewed and preserved.
- The canonical liveness paths are `/health/live` and `/api/v1/health/live`; readiness paths are `/health` and `/api/v1/health`. No `/ready` alias exists. Readiness checks PostgreSQL without exposing errors or credentials.
- No upload subsystem exists. `docs/SECURITY.md` records mandatory future file validation, path, size, execution, malware, ownership, and backup controls.
- `docs/backup-restore.md` defines future encrypted off-host PostgreSQL backup, retention approval, checksum, alerting, and isolated restore-verification requirements. No backup/restore script, schedule, dump, or restore was executed.
- The production checklist explicitly leaves TLS, DNS, secrets provisioning, migrations, monitoring, backup evidence, restore drills, permissions, deployment, and incident/rollback verification incomplete.

Milestone verification:

- API tests: **63/63 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Secret/schema/migration/dependency/scope review: **PASS**
- Deployment, TLS, monitoring, backup, and restore execution: **NOT RUN; explicitly outside milestone scope**

The official Phase 0 completion estimate remains **50%** because no explicit milestone weighting rubric exists. Confidence remains **HIGH** for the reviewed and locally verified security/operational contract; production controls and recovery execution still require environment-specific evidence.

### Milestone 7 — Production Deployment Preparation

**Status: COMPLETE (DOCUMENTED; DEPLOYMENT NOT EXECUTED)**

Completed and locally verified on 2026-09-10:

- `docs/deployment.md` defines the future Ubuntu LTS VPS assumptions, protected `/opt/konkourix` layout, exact-release workflow, server-only environment handling, first-install/update sequence, health gates, and rollback decisions.
- `.env.production.example` now carries the intended Konkourix HTTPS origins and Compose inputs with secret placeholders only. The populated production file belongs at `/opt/konkourix/config/production.env` with mode `0600`, outside the checkout.
- Public mapping remains `app.konkourix.ir` to Student Web, `counselor.konkourix.ir` to Counselor Web, and `api.konkourix.ir` to the API. These are intended identities, not claims that DNS or TLS is active.
- Production migrations are manual, reviewed, backup-gated, and applied before dependent traffic. They never run from a Dockerfile, Compose startup, or application entrypoint.
- The current API runtime image does not include the Prisma CLI or migration files. A separate reviewed migration runner remains a mandatory pre-deployment gate; this milestone documents that limitation instead of adding unapproved automation.
- Application rollback selects the prior exact release. Database restore is an explicit incident decision for incompatible data changes, not an automatic down migration.
- The server checklist leaves Docker/Compose runtime validation, edge integration, firewall, DNS, TLS, monitoring, backup execution, restore evidence, and actual deployment incomplete until verified in the target environment.
- No VPS was accessed; no Docker installation, Compose execution, migration, deployment, DNS, TLS, Cloudflare, monitoring, or backup operation occurred.

Milestone verification:

- API tests: **63/63 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Environment placeholder, secret, schema, migration, dependency, and scope review: **PASS**
- VPS, Docker/Compose, Nginx, migration, deployment, DNS, and TLS execution: **NOT RUN; explicitly outside milestone scope**

The official Phase 0 completion estimate remains **50%** because no explicit milestone weighting rubric exists. Confidence remains **HIGH** for the reviewed documentation and locally validated repository; deployment/runtime claims still require target-environment evidence.

### Phase 1 Milestone 1 — Authentication Foundation

**Status: COMPLETE**

Completed and locally verified on 2026-09-10:

- Existing `User` and `AuthSession` persistence was retained without schema or migration changes. Users carry server-controlled roles/status, and sessions store hashed refresh-token representations, expiry, revocation, rotation-family, and request metadata.
- Canonical API routes are `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/me`.
- Student registration cannot choose a role. Counselor login uses a server-provisioned counselor identity; `ADMIN` remains available only for model and backend compatibility.
- Short-lived access JWTs are returned to the browser and held only in application memory. Opaque refresh tokens remain in an `HttpOnly`, production-`Secure`, `SameSite=Lax` cookie and are rotated against revocable server-side sessions.
- Reusable authentication and role guards protect explicit `/api/v1/student/session` and `/api/v1/counselor/session` boundaries. Cross-role access is rejected by the API.
- Student Web and Counselor Web now have independent login pages, API clients, in-memory auth state, refresh bootstrap, protected-route foundations, and logout. Neither application has a role selector or role-switching control.
- The backend remains authoritative for identity, current account status, roles, ownership, and student-counselor relationship checks.

Milestone verification:

- API tests: **69/69 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Secret, dependency, schema, migration, and scope review: **PASS**

The official Phase 0 completion estimate remains **50%**. Phase 1 Milestone 1 is **COMPLETE**, and confidence remains **HIGH**.

### Phase 1 Milestone 2 — Base Application Shells & Dashboard Foundation

**Status: COMPLETE**

Completed and locally verified on 2026-09-10:

- Student Web now has an authenticated RTL application shell with a desktop sidebar, mobile bottom navigation, page header, responsive content area, and independent routes for dashboard, planning, study, reports, and settings.
- Counselor Web has its own authenticated RTL application shell with the same structural guarantees and independent routes for dashboard, students, planning, reports, and settings.
- Both dashboards provide role-specific greeting areas, summary-card skeletons, overview empty states, and disabled quick-action placeholders. No product data, analytics, or feature operations are implemented.
- Navigation destinations outside the dashboards and basic theme setting are explicit placeholder states. Unknown routes render a user-friendly error state with a safe dashboard return action.
- Small application-local `Button`, `Card`, and loading/empty/error primitives establish reusable UI structure without activating an immature shared package or adding dependencies.
- Both shells support light and dark CSS-variable themes. Theme preferences use separate, non-sensitive browser-storage keys and do not interact with authentication state.
- Existing authentication clients, providers, refresh behavior, in-memory access-token strategy, role boundaries, and backend permissions are unchanged. Protected-route initialization now renders the reusable loading-state primitive.

Milestone verification:

- API tests: **69/69 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Diff, secret, dependency, schema, migration, infrastructure, auth-regression, and scope review: **PASS**

The official Phase 0 completion estimate remains **50%**. Phase 1 Milestone 2 is **COMPLETE**, and confidence remains **HIGH**.

### Phase 1 Milestone 3 — Account Settings & Session Management Foundation

**Status: COMPLETE**

- The existing sanitized current-user responses and role-specific profile GET/PATCH endpoints remain canonical; no duplicate account endpoint was introduced.
- Student settings edit only the existing `educationLevel` and `schoolName` profile fields. Counselor settings independently edit only the existing `bio` and `specialization` fields.
- Strict backend schemas reject user IDs, roles, status, privileges, and other unapproved fields. Profile ownership is derived from the authenticated server identity, never request input.
- Authenticated password change verifies the current password and uses the established salted scrypt hashing implementation. Password update and revocation of every refresh session for that user are atomic and require reauthentication.
- Authenticated logout-all revokes only the current user's refresh sessions and clears the current refresh cookie. Existing current-session logout, refresh rotation, token-reuse handling, and role boundaries remain active.
- Both independent Persian/RTL settings experiences provide account summaries, role-appropriate profile forms, the existing per-application light/dark theme preference, safe form states, password change, current logout, and confirmed logout-all.
- Access tokens remain memory-only. No database schema, migration, dependency, lockfile, infrastructure, or unrelated product-feature change was required.

Milestone verification:

- API tests: **75/75 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Static scope, secret, authorization, and diff review: **PASS**

The official Phase 0 completion estimate remains **50%**. Phase 1 Milestone 3 is **COMPLETE**, and confidence remains **HIGH**.

### Phase 2 Milestone 1 — Student Today Planning

**Status: COMPLETE**

- Student Web `/planning` is now a real authenticated Persian/RTL daily-planning experience while Counselor Web `/planning` remains an explicit placeholder.
- The page derives the backend `YYYY-MM-DD` date from the browser's local calendar components, avoiding UTC date-shift behavior without adding a calendar dependency or persisted timezone setting.
- Students can view today's persistent tasks, create a personal task for today, mark pending tasks completed or skipped, filter by status and subject, and load additional cursor pages without duplicating appended tasks.
- The focused task form uses only existing fields: required title plus optional subject, description, and estimated minutes. It does not accept ownership, role, creator, plan, or other server-controlled values.
- Students can create a subject inline and have it selected immediately. Archived subjects remain visible for historical filtering but are excluded from new-task selection.
- Student Web uses a separate typed planning client layered on the established authenticated request and refresh mechanism. Access tokens remain memory-only, and the existing backend continues to derive ownership from the authenticated `StudentProfile`.
- Existing subject and daily-task routes, services, schemas, Prisma models, filters, cursor pagination, and completion timestamp semantics were reused without production backend changes.
- Focused backend regression tests now cover task read/update ownership, cross-student subject and study-plan assignment rejection, archived-subject rejection, counselor denial, authenticated filter scope, Prisma ownership predicates, and completion/skip/reopen timestamp behavior.
- No dependency, lockfile, Prisma schema, migration, infrastructure, authentication, or Counselor Web change was required.

Milestone verification:

- API tests: **82/82 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Schema changed: **NO**
- Migration added or run: **NO**

Deferred Phase 2 capabilities include topics, weekly planning, drag-and-drop/manual ordering, free-text search, counselor-authored tasks/plans, and richer task lifecycle/progress data. These require separately designed milestones and are not implied complete by the daily-planning slice.

### Phase 2 Milestone 2 — Student Subject & Topic Foundation

**Status: COMPLETE**

- The existing student-owned `StudySubject` model, authenticated subject APIs, and Student Web auth client remain canonical and are reused without a parallel subject architecture.
- A minimal `Topic` model adds a required `StudySubject` relation, normalized per-subject title uniqueness, timestamps, archive metadata, an indexed subject foreign key, and cascade cleanup with its parent subject.
- The additive `20260910184152_add_student_topic_foundation` migration was applied successfully to the local development database; all 6 migrations are up to date.
- Student-only topic routes support listing and creating topics below an owned subject and getting, renaming, archiving, or restoring an owned topic. No delete route, client-selected owner, counselor mutation path, or task-topic coupling was introduced.
- Topic list/read/update Prisma predicates traverse the subject relation to the authenticated student's `StudentProfile`; parent validation also hides missing and foreign subjects behind the same not-found response.
- Student Web `/study` is now a real Persian/RTL responsive subject/topic workspace with subject list/create, subject selection, topic list/create/rename/archive/restore, and localized loading, empty, error, and success states. Student `/planning` remains intact, and Counselor Web remains unchanged.
- Focused tests cover successful topic creation and normalization, duplicate rejection, foreign-subject list/create denial, foreign-topic update denial, invalid parent subjects, empty titles, counselor denial, archive/rename behavior, and relational ownership predicates in the Prisma store.
- No dependency, lockfile, authentication, infrastructure, Counselor Web, weekly-planning, ordering, search, reporting, or richer progress feature was changed.

Milestone verification:

- API tests: **89/89 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 6 migrations found and the database is up to date
- Schema changed: **YES; additive Topic model only**
- Migration added and run: **YES; local development database only**

Deferred Phase 2 capabilities include weekly planning, drag-and-drop/manual ordering, free-text search, counselor-authored tasks/plans or topics, task-topic linkage, and richer task lifecycle/progress data. They require separately authorized milestones.

### Phase 2 Milestone 3 — Task Topic Integration

**Status: COMPLETE**

- `DailyTask` now has a nullable `topicId` foreign key and optional `Topic` relation. Existing tasks remain valid with `topicId = NULL`, deleting a topic sets linked task topic IDs to null, and the indexed foreign key supports task-topic access without adding analytics fields.
- The additive `20260910220542_connect_tasks_to_topics` migration was applied successfully to the local development database; all 7 migrations are up to date.
- Existing student daily-task create and patch contracts accept optional nullable `topicId`. Task get/list/create/update responses expose the scalar `topicId`, matching the established relationship-ID response pattern without breaking existing clients.
- Backend services require any selected topic to belong to the authenticated student's profile through its subject and to match the task's effective `subjectId`. A topic cannot be supplied without its subject, and archived topics cannot be newly attached.
- Partial task updates validate the combined current and requested relationship state, so changing a subject cannot silently retain an incompatible topic. Status-only updates preserve existing completion timestamp behavior and do not revalidate unchanged historical relationships.
- Student Web `/planning` retains its existing layout and now loads active topics after a subject is selected, clears topic selection when the subject changes, permits no topic, and presents localized loading, empty, and error states. Topic management remains exclusively in `/study`.
- Focused tests cover topic-free and valid-topic task creation, same-student cross-subject mismatch rejection, cross-student topic rejection, valid topic attachment during update, invalid update rejection, route parsing/response behavior, and all existing task ownership, authorization, pagination, filtering, and completion behavior.
- No dependency, lockfile, authentication, infrastructure, Counselor Web, topic analytics, weekly-planning, ordering, search, or counselor-planning feature was changed.

Milestone verification:

- API tests: **93/93 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 7 migrations found and the database is up to date
- Schema changed: **YES; nullable DailyTask topic relation only**
- Migration added and run: **YES; local development database only**

Deferred Phase 2 capabilities include weekly planning, drag-and-drop/manual ordering, free-text search, topic analytics/mastery, counselor-authored tasks/plans, and counselor planning. They require separately authorized milestones.

### Phase 2 Milestone 4 — Counselor Student Access Foundation

**Status: COMPLETE**

- The existing `StudentCounselor` relationship remains the sole assignment authority. No parallel relationship model, Prisma schema change, or migration was added.
- Read-only `GET /api/v1/counselor/students` and `GET /api/v1/counselor/students/:id` routes require an authenticated `COUNSELOR` and derive `counselorId` exclusively from the access-token identity.
- List and detail Prisma predicates require an `ACTIVE` relationship to the authenticated counselor. Missing, inactive, unassigned, and cross-counselor student detail requests share the same not-found response.
- List results use the established bounded cursor-pagination pattern. Responses select only the StudentProfile identifier, nullable display name, education level, school name, and safe account status; authentication identifiers, password hashes, sessions, tokens, and unrelated user data are never selected.
- The current schema has no student display-name field. The API therefore returns `displayName: null`, and Counselor Web presents an explicit localized fallback rather than repurposing or exposing email/phone authentication identifiers.
- Counselor Web `/students` is now a real Persian/RTL responsive list with loading, empty, error, status, and pagination states. `/students/:id` provides a read-only basic profile view and preserves the existing custom History router, shell, session flow, and light/dark themes.
- Student Web is unchanged. Counselor planning, task creation, reports, analytics, messages, and notes remain absent and unauthorized in this milestone.
- Focused tests cover authenticated counselor list isolation, cursor behavior, student/admin/anonymous denial, assigned detail access, unassigned and cross-counselor denial, sensitive-field exclusion, identity-derived service scope, and active-assignment predicates in the Prisma store.

Milestone verification:

- API tests: **99/99 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 7 migrations found and the database is up to date
- Schema changed: **NO**
- Migration added or run: **NO**

Deferred counselor capabilities include planning, task creation, reports, analytics, messaging, and private notes. They require separately authorized milestones.

### Phase 2 Milestone 5B — Task Provenance Foundation

**Status: COMPLETE**

- `DailyTask.studentProfileId` remains the student ownership boundary. Required immutable provenance now records `source` as `PERSONAL` or `COUNSELOR` and `createdByUserId` as a foreign key to the creating `User` without adding a parallel task model or counselor-specific ownership field.
- The additive `20260911025617_add_task_provenance_foundation` migration first adds nullable provenance columns, backfills existing tasks as `PERSONAL` with the owning StudentProfile user's ID, aborts if any row remains unmapped, and only then makes both fields required. The migration was applied successfully to the local development database; all 8 migrations are up to date.
- Before migration, a read-only integrity query confirmed that every existing DailyTask had a valid StudentProfile/User path; the current local database contained no DailyTask rows. Post-migration inspection confirmed both required columns, the creator foreign key with restricted creator deletion, and the creator index.
- Student task creation derives `source: PERSONAL`, `createdByUserId`, and `studentProfileId` exclusively from authenticated server identity. Existing strict create/update schemas reject client-supplied provenance or ownership fields, and the update service never forwards them.
- Task list/get/create/update responses expose only the safe `source` label. Raw creator identity remains internal and is omitted from responses. The Student Web planning client accepts the additive response field without displaying a creator/source indicator, and Counselor Web is unchanged.
- Deterministic development task seeds set provenance only when rows are created; their update path cannot rewrite immutable provenance. Existing StudySession relationships and behavior are unchanged.
- Focused regression tests cover server-assigned personal provenance, authenticated creator assignment, forged source/creator/owner rejection, update immutability, creator-response redaction, seed immutability, and all prior task ownership, role, pagination, filtering, completion timestamp, and StudySession behavior.

Milestone verification:

- API tests: **101/101 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 8 migrations found and the database is up to date
- Schema changed: **YES; required immutable DailyTask provenance only**
- Migration added and run: **YES; local development database only**

Counselor task creation, counselor planning, per-source task permissions, revision handling, and audit history remain deferred. This milestone provides provenance storage only and adds no counselor task route or UI.

### Phase 2 Milestone 6 — Counselor Task Creation Foundation

**Status: COMPLETE**

- `POST /api/v1/counselor/students/:studentProfileId/tasks` creates a canonical `DailyTask` only for a student with an active `StudentCounselor` relationship to the authenticated counselor. The path parameter identifies the target but never grants access by itself.
- Read-only `GET /api/v1/counselor/students/:studentProfileId/subjects` and `GET /api/v1/counselor/students/:studentProfileId/subjects/:subjectId/topics` endpoints provide only active assigned-student resources needed by the constrained selectors in Counselor Web.
- Counselor task creation re-verifies the active assignment, target-owned subject, target-owned topic, subject/topic match, and archive state inside one Prisma transaction before insertion. Unassigned and cross-counselor targets share the established not-found behavior.
- The strict create contract accepts only title, optional description, scheduled date, optional estimated minutes, and optional subject/topic IDs. Study-plan assignment is intentionally excluded because counselor planning does not yet exist.
- The server fixes `studentProfileId` to the assigned target, `createdByUserId` to the authenticated counselor, `source` to `COUNSELOR`, `status` to `PENDING`, `completedAt` to `null`, and `studyPlanId` to `null`. Raw creator identity is omitted from the response.
- Counselor Web student detail now includes a responsive Persian/RTL task form with server-fed subject/topic selectors and explicit loading, empty, error, submitting, and success states. It does not accept arbitrary relationship IDs or add counselor task editing.
- Student Web is unchanged. Its existing daily-task list already consumes canonical `DailyTask` records and safely accepts the `COUNSELOR` source, so counselor-created tasks appear on the selected day without exposing creator identity.
- Focused tests cover assigned creation, unassigned and cross-counselor denial, student and anonymous denial, mass-assignment rejection, foreign subject/topic rejection, archived resource rejection, safe selector scope, provenance correctness, creator redaction, active-assignment Prisma predicates, and transactional creation behavior.

Milestone verification:

- API tests: **112/112 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 8 migrations found and the database is up to date
- Schema changed: **NO**
- Migration added or run: **NO**

Counselor task editing, full counselor planning, revisions, approval workflows, conflict handling, audit history, reports, notifications, and messaging remain deferred and require separately authorized milestones.

### Phase 2 Milestone 7 — Counselor Task Visibility Foundation

**Status: COMPLETE**

- `GET /api/v1/counselor/students/:studentProfileId/tasks` returns a bounded cursor page of canonical `DailyTask` records only when the authenticated counselor has an active `StudentCounselor` relationship with the target student. The path identifier never authorizes access by itself.
- Visibility is scoped by task ownership (`studentProfileId`), not task creator. Assigned counselors therefore see both `PERSONAL` and `COUNSELOR` tasks, including status and completion timestamps when available.
- The Prisma read transaction verifies the active assignment before querying tasks. Its explicit task selection excludes `createdByUserId`, so raw creator identity and internal user identifiers are not fetched for or exposed by the endpoint.
- Unassigned and cross-counselor targets retain the established not-found behavior. Student and anonymous callers are rejected by the existing authenticated counselor route boundary.
- Counselor Web assigned-student detail now includes a read-only Persian/RTL task section with scheduled date, status, safe source label, completion state, optional duration/description, cursor pagination, and localized loading, empty, and error states. It contains no edit, delete, completion, or reassignment control.
- Successful counselor task creation refreshes the read-only task section without changing create authorization or adding shared editing behavior.
- Student Web Today Planning now displays `تعیین‌شده توسط مشاور` for counselor-created tasks. It exposes no counselor ID or creator identity and otherwise preserves the existing planning experience.
- Focused tests cover assigned visibility, personal and counselor-source inclusion, completion data, creator redaction, unassigned and cross-counselor denial, student and anonymous denial, active-assignment Prisma predicates, student ownership filtering, and the absence of creator/source filters in the task query.
- No Prisma schema, migration, dependency, lockfile, authentication, task ownership, StudySession, or infrastructure change was required.

Milestone verification:

- API tests: **116/116 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 8 migrations found and the database is up to date
- Schema changed: **NO**
- Migration added or run: **NO**

Counselor task editing, task revisions, approval workflows, conflict handling, reports, analytics, weekly planning, notifications, and messaging remain deferred and require separately authorized milestones.

### Phase 2 Milestone 8 — Task Execution Feedback Foundation

**Status: COMPLETE**

- Existing `DailyTask` and `StudySession` remain the separate canonical planned-work and actual-effort models. No execution, activity, timer, analytics, or history table was introduced.
- `POST /api/v1/student/daily-tasks/:taskId/sessions` creates a completed StudySession interval for an authenticated student's owned task. The server derives `studentProfileId`, `dailyTaskId`, and nullable `subjectId` from authenticated ownership and the task; the strict body accepts only start/end timestamps and optional notes.
- Task-centric creation supports owned tasks without a subject. For tasks with a subject, the existing subject ownership and archive rules remain active. Foreign tasks share the existing task-not-found behavior.
- Existing `GET /api/v1/student/study-sessions` now accepts an optional owned `dailyTaskId` filter. The query retains both student-profile and task predicates, enabling persistent per-task execution feedback without a parallel read model.
- The existing duration calculation was extracted into one shared helper and remains the rounded difference between `endedAt` and `startedAt`. Both generic and task-centric session creation use the same parsing, ordering validation, persistence, and response transformation.
- Recording a StudySession does not mutate DailyTask status. A task may remain `PENDING`, become `COMPLETED`, or become `SKIPPED` independently from actual recorded effort; no `IN_PROGRESS`, `STARTED`, or `PAUSED` state was added.
- Student Web Today Planning now lets a student expand a task, load its persisted sessions, see total recorded minutes/session count, start a transient in-page study interval, and finish it into a persisted StudySession with optional notes. There is no live timer, Pomodoro, focus mode, or persisted running-session state.
- Counselor Web's existing assigned-student task list now shows only the direct execution feedback needed for each task: recorded minutes and StudySession count. Active assignment checks and creator redaction remain unchanged, and no analytics, scoring, report, or mutation control was added.
- Focused tests cover owned and subjectless task execution, foreign-task denial, student-only/anonymous authorization, forged ownership rejection, derived session ownership/relationships, task-filtered reads, unchanged duration calculation, Prisma ownership predicates, and counselor execution-summary visibility.
- No Prisma schema, migration, dependency, lockfile, authentication, DailyTask lifecycle, or infrastructure change was required.

Milestone verification:

- API tests: **123/123 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 8 migrations found and the database is up to date
- Schema changed: **NO**
- Migration added or run: **NO**

Timers, Pomodoro/focus mode, analytics, reports, mastery, weekly progress, streaks, gamification, notifications, messaging, and execution/task conflict handling remain deferred and require separately authorized milestones.

### Phase 2 Milestone 9 — Weekly Planning Foundation

**Status: COMPLETE**

- `DailyTask` remains the only scheduled-work entity. Weekly planning is an inclusive date-range read over `DailyTask.scheduledFor`; no weekly plan, weekly task, calendar, recurrence, scheduling, or analytics model was introduced.
- Existing `GET /api/v1/student/daily-tasks` and `GET /api/v1/counselor/students/:studentProfileId/tasks` routes now accept paired `from` and `to` query dates. The existing single-day `date` filter remains unchanged and cannot be combined with a range.
- Both range paths validate real `YYYY-MM-DD` values and reject incomplete or reversed ranges. Prisma queries keep the authenticated student's `studentProfileId` predicate or the counselor's active-assignment check plus target ownership predicate.
- Task responses retain existing safe provenance exposure through `source` and continue to omit `createdByUserId`. The counselor path remains visibility-by-student ownership rather than visibility-by-creator.
- Student Web adds `/planning/weekly`, a responsive Persian/RTL Saturday-to-Friday view with previous/next/current-week controls, seven day groups, task status, safe counselor-source labels, subject/topic labels when available, and simple task/minute workload totals. Today Planning links to the weekly view and otherwise keeps its existing creation and execution behavior.
- Counselor Web assigned-student detail adds a read-only Saturday-to-Friday distribution with navigation, status, source, subject/topic labels when available, and simple task/minute totals. It adds no edit, delete, reschedule, or batch-planning controls.
- Week boundaries use the browser's local calendar components with Saturday as day one. API range bounds are stored-date values converted to UTC midnight for inclusive PostgreSQL `date` comparisons; no timezone database, Persian-calendar storage, or recurring schedule engine was added.
- Focused tests cover student-owned weekly ranges, cross-student exclusion, counselor assignment and cross-counselor denial, inclusive date bounds, invalid ranges, creator redaction, and Prisma ownership predicates while retaining all prior task/session authorization tests.
- No Prisma schema, migration, dependency, lockfile, authentication, task lifecycle, StudySession, or infrastructure change was required.

Milestone verification:

- API tests: **126/126 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 8 migrations found and the database is up to date
- Schema changed: **NO**
- Migration added or run: **NO**

Drag-and-drop, task rescheduling, recurring scheduling, automatic scheduling, workload optimization, AI planning, calendar sync, reminders, notifications, reports, and analytics remain deferred and require separately authorized milestones.

### Phase 2 Milestone 10 — Task Rescheduling & Permission Foundation

**Status: COMPLETE**

- `DailyTask` remains the canonical scheduled-work model. Rescheduling changes only `scheduledFor`; ownership, creator provenance, source, lifecycle status, completion timestamp, task content, relationships, and StudySession history are preserved.
- Dedicated strict mutations are `PATCH /api/v1/student/daily-tasks/:id/schedule` and `PATCH /api/v1/counselor/students/:studentProfileId/tasks/:taskId/schedule`. Each accepts only a real `YYYY-MM-DD` `scheduledFor` value. Ownership, source, creator, status, completion, and content fields are rejected as request input.
- Students may reschedule only an owned `PERSONAL` task. Foreign tasks remain hidden behind task-not-found, and `COUNSELOR` tasks reject student schedule changes. The generic student task update no longer accepts `scheduledFor`, preventing a parallel bypass.
- Student status actions remain available for counselor-created tasks, but students cannot alter their planned content through the generic task update contract.
- Counselors may reschedule only a `COUNSELOR` task owned by a student with a currently active assignment to the authenticated counselor. Missing/inactive/cross-counselor assignments retain student-not-found behavior, and personal student tasks reject counselor schedule changes.
- Both Prisma schedule mutations run in transactions and condition the update on the expected owner/source plus `studySessions: { none: {} }`. Any task with recorded StudySessions is rejected rather than silently moved, including when execution races with a schedule request.
- Task responses continue to omit `createdByUserId`. Schedule update data contains only `scheduledFor`, and neither service forwards or rewrites `studentProfileId`, `createdByUserId`, or `source`.
- Student Web Today Planning adds a simple date input only for personal tasks. A successful move away from today removes the task from the current daily list; server-side execution checks remain authoritative.
- Counselor Web assigned-student task detail adds a simple date input only for counselor-source tasks. Known executed tasks are disabled in the UI, while the backend independently enforces active assignment, task ownership/source, and StudySession absence.
- Date behavior reuses the existing convention: browser date inputs submit `YYYY-MM-DD`, and the API validates and converts the stored PostgreSQL `date` value at UTC midnight. No timezone database, Persian-calendar storage, recurrence, or scheduling engine was introduced.
- Focused tests cover owned personal-task moves, foreign/counselor/executed student-task denial, counselor task moves, personal/foreign/inactive-assignment/executed counselor-task denial, strict input rejection, provenance preservation, creator redaction, and transactional Prisma predicates.
- No Prisma schema, migration, dependency, lockfile, authentication, task lifecycle, StudySession, or infrastructure change was required.

Milestone verification:

- API tests: **134/134 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 8 migrations found and the database is up to date
- Schema changed: **NO**
- Migration added or run: **NO**

Drag-and-drop, weekly editing, bulk rescheduling, recurring tasks, automatic or AI scheduling, revisions, audit history, conflict resolution, analytics, and planning optimization remain deferred and require separately authorized milestones.

### Phase 2 Milestone 11 — Weekly Drag & Drop Foundation

**Status: COMPLETE**

- Student Web `/planning/weekly` now supports moving eligible personal task cards between the existing Saturday-to-Friday day groups. Native browser drag-and-drop is supplemented by a task-first/day-second button flow for touch, keyboard, and narrow-screen use.
- Weekly planning remains a view over `DailyTask.scheduledFor`. Movement persists through the existing `PATCH /api/v1/student/daily-tasks/:id/schedule` mutation; no parallel scheduling endpoint, weekly editor model, calendar engine, or ordering system was added.
- The page reuses `GET /api/v1/student/study-sessions?dailyTaskId=...` with a one-item limit to determine whether each personal task has execution history. Counselor-source tasks and tasks with StudySessions are visibly locked. If the execution check fails, movement fails closed and the task remains temporarily locked.
- The UI performs an optimistic day move while the schedule request is pending, disables competing navigation/movement, and exposes saving and success feedback. Any backend rejection restores the complete pre-move task snapshot and reports an error, so the weekly view never retains an unpersisted successful state.
- Frontend eligibility is only a usability layer. The existing schedule mutation remains authoritative for authenticated student ownership, `PERSONAL` source, strict input, and absence of StudySessions. Existing counselor rescheduling permissions and active-assignment enforcement are unchanged.
- Movement changes only the date in local UI state. Generic helpers retain all other task properties during optimistic movement and restore the original object on failure; the backend transaction continues to preserve owner, creator, source, content, status, completion, and execution history.
- Responsive Persian/RTL styles add drop-zone highlighting, draggable/selected/saving card states, locked-task explanations, and light/dark-compatible feedback. Counselor Web remains read-only at the weekly level and was not changed.
- Student Web unit tests cover personal/counselor/executed/unavailable eligibility and verify optimistic movement plus rollback preserve owner and creator provenance and source. The pre-existing API regression suite continues to cover forged ownership, student and counselor source boundaries, StudySession locks, inactive/cross-counselor assignments, and transactional provenance protection.
- No Prisma schema, migration, dependency, lockfile, authentication, API route, task lifecycle, StudySession storage, or infrastructure change was required.

Milestone verification:

- API tests: **134/134 PASS**
- Student Web unit tests: **2/2 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 8 migrations found and the database is up to date
- Schema changed: **NO**
- Migration added or run: **NO**

Calendar engines, hourly scheduling, recurring planning, automatic or AI scheduling, bulk planning, drag history, undo, revisions, audit history, conflict handling, workload optimization, reports, and analytics remain deferred and require separately authorized milestones.

### Phase 2 Milestone 12 — Task Lifecycle Foundation

**Status: COMPLETE**

- `DailyTask` remains canonical planned work and `StudySession` remains canonical actual work. Existing `PENDING`, `COMPLETED`, and `SKIPPED` statuses are unchanged; `PENDING` continues to represent work without a recorded outcome, so no abandoned, in-progress, failed, or cancelled status was introduced.
- `DailyTask` now has nullable `skipReason` and server-controlled `skippedAt` metadata. Stable reason codes are `NO_TIME`, `TOO_DIFFICULT`, `FORGOT`, and `OTHER`; clients localize these codes rather than persisting display text.
- The existing `PATCH /api/v1/student/daily-tasks/:id` mutation accepts optional `skipReason` only together with `status: SKIPPED`. A skip remains valid without a reason. Unknown reasons, reasons paired with another status, and client-supplied `skippedAt` or `completedAt` are rejected by the strict request schema.
- Transitioning to `SKIPPED` clears `completedAt`, stores the optional reason, and assigns `skippedAt` from the server clock. Transitioning to `COMPLETED` assigns `completedAt` from the server clock and clears skip metadata. Transitioning to `PENDING` clears completion and skip metadata. Content-only updates preserve existing lifecycle metadata.
- Student task ownership continues to derive from the authenticated `StudentProfile`, and the owner-scoped store update remains authoritative. Lifecycle mutation cannot rewrite `studentProfileId`, `createdByUserId`, or `source`. Students retain execution-status actions for counselor-created tasks while their counselor-authored planned content remains protected.
- The additive `20260912174015_add_task_lifecycle_foundation` migration creates the skip-reason enum and adds only the two nullable lifecycle columns. Existing task rows remain valid without fabricated historical skip timestamps or reasons. No history, revision, audit, event, analytics, or scoring table was added.
- Student Web Today Planning adds a compact optional Persian skip-reason selector to the existing skip action and displays a localized reason on skipped tasks. Its weekly view also shows the reason when present. The controls remain responsive and use the existing light/dark design tokens.
- Counselor Web remains read-only for lifecycle outcomes. Assigned-student task detail shows the skip timestamp and localized reason (or explicitly notes that no reason was recorded), and the weekly distribution shows the safe reason when present. No counselor lifecycle mutation was added.
- Focused tests cover owned-task skipping with a reason, optional/invalid lifecycle metadata, server-controlled timestamps, foreign-task denial, counselor denial at the student route boundary, counselor-created content protection, completion/reopen clearing rules, provenance/creator preservation, creator redaction, and updated Prisma counselor projections.
- No dependency, lockfile, authentication, StudySession behavior, rescheduling permission, task ownership, infrastructure, analytics, report, AI, revision, or audit-history change was required.

Milestone verification:

- API tests: **135/135 PASS**
- Student Web unit tests: **2/2 PASS**
- API type-check: **PASS**
- API production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 9 migrations found and the database is up to date
- Schema changed: **YES; nullable skip reason and server skip timestamp only**
- Migration added and run: **YES; local development database only**

Analytics, reports, AI recommendations, mastery, scoring, streaks, gamification, revisions, audit history, event sourcing, and lifecycle conflict management remain deferred and require separately authorized milestones.

### Phase 2 Milestone 13 — Counselor Planning Batch Foundation

**Status: COMPLETE**

- `POST /api/v1/counselor/students/:studentProfileId/tasks/batch` creates between 1 and 50 ordinary `DailyTask` records for one assigned student. No batch, group, weekly, template, recurrence, or calendar entity was introduced.
- The endpoint requires an active authenticated counselor, resolves the counselor profile from the authenticated user, and verifies an active `StudentCounselor` assignment before accepting the URL student. `studentProfileId`, `createdByUserId`, and `source` are server-derived and rejected as request fields.
- Every item requires a title and real `YYYY-MM-DD` date. Optional subjects and topics are validated against the assigned student's active resources; a topic must belong to its selected subject. Planned minutes are non-negative and map to the existing `estimatedMinutes`; planned test count is non-negative.
- The full batch is validated before one Prisma transaction performs one `createManyAndReturn` insert. A validation or database failure creates no partial batch.
- Every created record starts as `COUNSELOR` / `PENDING`, with `completedAt`, `skipReason`, and `skippedAt` empty. The task lifecycle and `StudySession` architecture are unchanged, and creator identity remains redacted from responses.
- `DailyTask.plannedTestCount` is the only additive schema field because the existing model had no place to persist the required test-count value. Migration `20260912203000_add_daily_task_planned_test_count` adds the non-negative application-validated integer with a default of zero. No new entity or relationship was added.
- Counselor Web assigned-student planning now includes a responsive Persian multi-row form with subject/topic selection, dates, planned minutes/tests, optional descriptions, add/remove controls, validation, loading, success, and error feedback. Created test counts are visible in existing counselor and student planning views.
- Dependency-free Counselor Web tests cover row validation, add/remove behavior, normalized successful submission, and request-error handling. The canonical validation gate now runs both frontend unit suites.
- API documentation lives in `docs/API.md`; README command and documentation indexes include the counselor test suite and API contract.

Milestone verification:

- API tests: **143/143 PASS**
- Student Web unit tests: **2/2 PASS**
- Counselor Web unit tests: **4/4 PASS**
- API type-check and production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 10 migrations found and the database is up to date
- Schema changed: **YES; `DailyTask.plannedTestCount` only**
- Migration added and run: **YES; local development database only**

Batch editing, batch rescheduling, task groups, planning templates, recurring tasks, calendar engines, AI scheduling, and automatic optimization remain deferred and require separately authorized milestones.

### Phase 2 Milestone 14 — Task Execution Foundation

**Status: COMPLETE**

- `POST /api/v1/student/tasks/:id/start` starts actual execution for an owned `PENDING` task by creating an ordinary active `StudySession`. The server derives `studentProfileId`, `dailyTaskId`, optional `subjectId`, and `startedAt`; request ownership fields and timestamps are not accepted.
- `PATCH /api/v1/student/study-sessions/:id/finish` finishes only an owned active session, assigns `endedAt` from server time, and exposes the calculated duration. Foreign sessions, already-finished sessions, and non-positive server durations are rejected.
- `DailyTask` remains planned work and `StudySession` remains actual work. Starting or finishing a session never completes, skips, reopens, reschedules, or otherwise mutates the linked task. Multiple sessions per task remain supported by the existing many-to-one relation.
- The existing completed-session creation APIs remain available for compatibility. The only schema change makes `StudySession.endedAt` nullable so a server-started active session can be represented; migration `20260912220000_allow_active_study_sessions` adds no table, entity, or relationship.
- Student Today Planning now uses the server-backed start/finish flow, restores active state from persisted sessions, shows loading/success/error feedback, and prevents a new start for completed or skipped tasks. The UI retains the existing responsive Persian design and planner structure.
- Focused backend tests cover start ownership, server-derived linkage/time, pending-only execution, lifecycle separation, finish ownership, repeated finish rejection, invalid duration rejection, duration calculation, and the transactional ownership predicate. Student Web tests cover start availability, start and finish request behavior, session-state replacement, and safe error messages.
- Counselor Web has no execution controls or behavior change. Timer, Pomodoro, reporting, analytics, counselor review, workflow, AI, calendar, and new task/entity work remain absent.

Milestone verification:

- API tests: **150/150 PASS**
- Student Web unit tests: **6/6 PASS**
- Counselor Web unit tests: **4/4 PASS**
- API type-check and production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 11 migrations found and the database is up to date
- Schema changed: **YES; `StudySession.endedAt` is nullable**
- Migration added and run: **YES; local development database only**

Pomodoro/focus timers, automatic task completion, session cancellation, analytics, reports, counselor review dashboards, AI planning, workflow engines, and new task or calendar entities remain deferred and require separately authorized milestones.

### Phase 2 Milestone 15 — Active Study Execution & Seamless Switching Foundation

**Status: COMPLETE**

- The canonical model remains `DailyTask = planned work` and `StudySession = actual execution`. A task retains `0..N` sessions. No execution model, Prisma field, migration, dependency, Redis coordination, or browser-storage authority was added.
- Live start, switch, finish, and linked-task terminal lifecycle changes serialize on the authenticated student's stable PostgreSQL `StudentProfile` row inside transactions. This prevents concurrent API processes from creating overlapping live sessions for one student without restricting sequential sessions or different students.
- Raw start safely reuses an already-active session for the same task and returns `ACTIVE_STUDY_SESSION_EXISTS` for a different active task. `GET /api/v1/student/study-sessions/active` restores authenticated server state. Atomic switch closes a different current interval and starts a fresh target interval at one server timestamp, degrades to start when none is active, and reuses an already-active target.
- Manual historical completed-session creation remains available. Generic creation cannot create an open session, and generic update cannot edit/reopen active execution. Public execution views omit the internal student-profile identifier.
- Starting, switching, and finishing never change `DailyTask.status`. A student cannot change a linked task to `COMPLETED` or `SKIPPED` while its session is active; execution must be finished first and the outcome remains a separate student decision.
- Student Today Planning owns one page-level active execution state, restores it after refresh, renders a display-only elapsed timer from persisted `startedAt`, offers a Persian seamless-switch confirmation, and keeps the existing session history and completed-duration totals. Switching back to a pending task creates a new session.
- Counselor Web remains read-only. Recorded minutes and completed-session counts exclude active sessions, while a separate live indicator prevents a current interval from being presented as completed study.
- Cancellation, pause/resume, Pomodoro, focus modes, feedback ratings, analytics, reports, notifications, offline sync, automatic task outcomes, and new execution entities remain absent.

Milestone verification:

- API tests: **165/165 PASS**
- Student Web unit tests: **13/13 PASS**
- Counselor Web unit tests: **4/4 PASS**
- API type-check and production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 11 migrations found and the database is up to date
- Schema changed for Milestone 15: **NO**
- Migration added or run for Milestone 15: **NO**

### Phase 2 Milestone 16 — Stale Study Session Recovery Foundation

**Status: COMPLETE**

- `DailyTask` remains planned work and `StudySession` remains the sole actual-execution record. No execution entity or status enum was added. Lifecycle is derived from timestamps: active has neither terminal timestamp, finished has only `endedAt`, and cancelled has only `cancelledAt`.
- The only schema field is nullable `StudySession.cancelledAt`. Additive migration `20260913140000_add_study_session_cancellation` also installs `study_sessions_finish_cancel_exclusive`, which prevents both `endedAt` and `cancelledAt` being non-null. Existing data required no backfill or timestamp changes.
- `PATCH /api/v1/student/study-sessions/:id/cancel` accepts a strict empty body, derives ownership from the authenticated student, serializes on the existing PostgreSQL `StudentProfile` row lock, and assigns `cancelledAt` from the server. Cancelled records remain historical but expose null duration and cannot be finished, cancelled again, or generically edited.
- Active-session reads, starts, switches, terminal task mutations, execution summaries, and browser state now require both `endedAt` and `cancelledAt` to be null. Finish rejects cancelled intervals. Manual completed historical entry remains available and cannot assign cancellation metadata or manufacture live execution.
- Atomic switch accepts optional `currentSessionAction: FINISH | CANCEL`, defaulting to `FINISH`. A different current interval is finished or cancelled at the same server transition timestamp used to start the target. No-active switching starts safely, while a same-target request reuses the existing interval.
- Cancellation never changes task status, source, creator, ownership, or any planned content. Active execution continues to block `COMPLETED`/`SKIPPED`; cancelled execution does not. Active or finished history blocks rescheduling, while cancelled-only history does not.
- Student Today Planning provides confirmed cancellation, Finish/Cancel/Continue switching, central active-state clearing/restoration, and a localized cancelled-history indicator with no duration. Counselor Web remains read-only; its completed minutes/count and live indicator exclude cancelled sessions, and only its rescheduling affordance needed compatibility alignment.
- Automatic stale thresholds, automatic finishing/cancellation, pause/resume, Pomodoro, focus/test session models, feedback ratings, analytics, reports, notifications, automatic task outcomes, and new execution entities remain absent.

Milestone verification:

- API tests: **176/176 PASS**
- Student Web unit tests: **16/16 PASS**
- Counselor Web unit tests: **4/4 PASS**
- API type-check and production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 12 migrations found and the database is up to date
- `git diff --check`: **PASS**
- Schema changed for Milestone 16: **YES; nullable `StudySession.cancelledAt` only**
- Migration added and run for Milestone 16: **YES; local development database only**

### Phase 2 Milestone 17 — Study Session Feedback Foundation

**Status: COMPLETE**

- `DailyTask` remains planned work and `StudySession` remains the sole actual-execution record. Optional integer `focusRating` and `studyQualityRating` fields live directly on finished sessions; no feedback, review, metric, score, or execution entity was added.
- Additive migration `20260913200000_add_study_session_feedback` adds only the two nullable columns and database range checks requiring each non-null rating to be from 1 through 5. Existing rows remain null without backfill, and the M16 finish/cancel exclusivity constraint is unchanged.
- `PATCH /api/v1/student/study-sessions/:id/finish` remains server-timed and may atomically store optional notes and ratings. Manual completed historical session creation accepts the same valid optional ratings while continuing to require a closed interval.
- `PATCH /api/v1/student/study-sessions/:id/feedback` accepts at least one strict, nullable rating field so the authenticated owner can add, change, or clear feedback only on a finished, non-cancelled session. Owner-and-lifecycle predicates remain present at the database write boundary.
- Safe session responses expose both ratings as `number | null` and never expose student-profile or creator identities. Generic session updates do not accept rating fields and remain limited to finished, non-cancelled history.
- Student Today Planning offers optional accessible Persian 1–5 focus/quality controls at finish, renders only present ratings in completed history, and provides a small finished-session editor. Cancelled and active intervals show no feedback; the central M15/M16 timer, finish, cancel, and switch state remains authoritative and unchanged.
- Feedback never changes task status, timestamps, schedule, source, creator, ownership, planned content, rescheduling behavior, or switch requirements. Counselor Web remains read-only and required no M17 change because its existing task summaries do not expose individual session detail.
- No analytics, averages, reports, calculated scores, counselor evaluation, Pomodoro, pause/resume, focus/test session model, automatic task outcome, or new entity was introduced.

Milestone verification:

- API tests: **184/184 PASS**
- Student Web unit tests: **19/19 PASS**
- Counselor Web unit tests: **4/4 PASS**
- API type-check and production build: **PASS**
- Student Web lint and production build: **PASS**
- Counselor Web lint and production build: **PASS**
- Prisma schema validation: **PASS**
- Canonical `pnpm.cmd validate`: **PASS**
- Migration status: **PASS**; 13 migrations found and the database is up to date
- Database rating CHECK smoke test: **PASS**; boundaries 1 and 5 accepted, invalid 0 and 6 rejected
- `git diff --check`: **PASS**
- Schema changed for Milestone 17: **YES; nullable `focusRating` and `studyQualityRating` only**
- Migration added and run for Milestone 17: **YES; local development database only**

## Implemented Architecture

Konkourix is a modular monolith in a pnpm monorepo. Student Web and Counselor Web are separate browser applications; core domain logic currently runs in one Fastify API backed by one PostgreSQL database. Current repository structure includes:

- `apps/api`: Node.js, TypeScript, Fastify 5, Prisma 7, PostgreSQL, and Zod
- `apps/student-web`: separate React, TypeScript, and Vite application
- `apps/counselor-web`: separate React, TypeScript, and Vite application
- `packages/api-client`, `packages/shared`, `packages/types`, `packages/ui`, and `packages/validation`: currently placeholder directories
- `database/prisma`: Prisma schema, generated-client configuration, and migrations
- `docs`: project documentation
- `infrastructure/docker`: shared container-only health and static-server configuration
- `infrastructure/nginx`: future HTTP edge routing and upstream configuration

Repository reality takes precedence over aspirational directory layouts or architecture.

## Implemented Backend Capabilities

The following capabilities are present and covered by the current API baseline:

- Process liveness and database readiness endpoints
- Request IDs, a standard API response envelope, centralized error handling, structured Fastify logging, and baseline security headers
- Safe normalized request-completion logging and bounded single-process abuse limits for register/login/refresh
- Users, roles, and account status foundations
- Student registration and login
- Access-token authentication
- Refresh-token sessions with rotation and reuse handling
- Current-session logout, all-session revocation, authenticated password change, and versioned `/auth/me` functionality under `/api/v1`
- Student and counselor profile APIs
- Student-counselor relationship foundation
- Counselor-only read access to actively assigned student lists and basic profiles
- Counselor-only single and atomic batch creation plus controlled rescheduling of counselor-source tasks for actively assigned students with server-owned provenance
- Counselor-only read access to personal and counselor-created tasks owned by actively assigned students, without creator identity exposure
- Student subjects, topics, study plans, and daily tasks with optional validated topic assignment, server-owned provenance, owned date-range reads, and controlled personal-task rescheduling
- Student and assigned-counselor weekly task distribution derived from DailyTask dates without duplicate storage
- Student-owned task lifecycle outcomes with optional localized skip-reason codes and server-controlled completion/skip timestamps
- Study Sessions, including serialized server-started active execution, active-session restoration, atomic task switching, owner-checked finishing, task-linked manual historical recording, and owned task filtering, and Student Goals
- Completed student-owned Assessment Attempts with optional task/subject/topic provenance, raw result correction, derived totals/duration, and soft invalidation, independent of Study Sessions
- Backend role and ownership enforcement foundations; student resources are resolved from the authenticated user's StudentProfile

Study Tracking recovery is committed in `8905e381fdcf820bc058a7acd81fc794c7cbfc08` and retained by the current checkpoint.

## Core Foundation Repairs

Commit `5fffa805d99e1fc870410c3b5115b2924059399f` records four verified repairs:

1. Development seed descendants use the persisted `StudentProfile.id`, not the student User ID.
2. The public daily-task `date` query is mapped to the internal `scheduledFor` filter.
3. Plan and task cursor pagination skips the cursor record while retaining lookahead-row semantics.
4. Student and counselor profile PATCH operations preserve omitted properties; explicit `null` remains supported where the existing schema permits it.

## Database State

- Persistent storage: PostgreSQL
- ORM and migration system: Prisma
- M19 comparison-baseline migrations: 14
- Current tracked migration directories: 18
- Migration status verified on 2026-09-30: all 18 migrations are applied and the local development database is up to date
- The four post-M19 Curriculum migrations are applied history. Recovery must use forward corrective migrations only when separately authorized; it must not rewrite those files.
- Assessment Attempt migration: `20260913230000_add_assessment_attempt_foundation`
- Study Session Feedback migration: `20260913200000_add_study_session_feedback`
- Study Session Cancellation migration: `20260913140000_add_study_session_cancellation`
- Counselor batch planning migration: `20260912203000_add_daily_task_planned_test_count`
- Counselor batch planning migration state: included in the validated Milestone 13–15 checkpoint and applied locally
- Task Execution migration: `20260912220000_allow_active_study_sessions`
- Task Execution migration state: included in the validated Milestone 13–15 checkpoint and applied locally
- Task Lifecycle migration: `20260912174015_add_task_lifecycle_foundation`
- Task Lifecycle migration state: committed and applied locally
- Task Provenance migration: `20260911025617_add_task_provenance_foundation`
- Task Provenance migration state: committed and applied locally
- Task Topic migration: `20260910220542_connect_tasks_to_topics`
- Task Topic migration state: committed and applied locally
- Student Topic migration: `20260910184152_add_student_topic_foundation`
- Student Topic migration state: committed and applied locally
- Study Tracking migration: `20260903002126_add_study_tracking`
- Study Tracking migration state: committed and applied

Never rewrite, rename, delete, or silently replace applied migration history. Use additive migrations only after inspecting schema, migration history, and application usage. Do not store database URLs or credentials in documentation or Git.

## Frontend State

### Student application

- The project exists as an independent React/Vite application.
- Its API origin is supplied by the validated build-time `VITE_API_URL` contract.
- It has an independent student login screen, credentialed auth API client, in-memory access-token state, refresh bootstrap, protected-route shell, and logout.
- It verifies authenticated access against the backend-protected student boundary before rendering protected content.
- Its authenticated shell provides responsive desktop/mobile navigation, page headers, dashboard skeletons, placeholder destinations, reusable states, and light/dark theme foundations.
- Its settings page provides current account information, the existing student profile fields, theme selection, password change, current logout, and logout-all.
- Its planning area provides persistent today-task listing and creation with optional subject/topic assignment, completion and reason-aware skipping, status and subject filters, cursor pagination, inline subject creation, counselor-supplied planned test-count visibility, a safe counselor-source indicator, central server-backed active StudySession restoration/start/finish/seamless switching with a live elapsed display, execution history and feedback, controlled personal-task date changes, and an interactive Saturday-to-Friday view derived from the same tasks.
- Its study page provides persistent student-owned subject listing/creation and topic listing/creation/rename/archive/restore through the authenticated backend contracts. This is implemented reality. Its future relationship to canonical Curriculum requires an approved recovery milestone; historical ADRs do not authorize a replacement UX.
- Its assessment area provides completed-attempt entry and history with raw correct/incorrect/blank counts, derived total/duration, and soft invalidation. It is not a live online exam engine.
- It remains an application foundation rather than a complete student product UI.

### Counselor application

- The project exists as an independent React/Vite application.
- Its API origin is supplied by the validated build-time `VITE_API_URL` contract.
- It has an independent counselor login screen, credentialed auth API client, in-memory access-token state, refresh bootstrap, protected-route shell, and logout.
- It verifies authenticated access against the backend-protected counselor boundary before rendering protected content.
- Its authenticated shell provides responsive desktop/mobile navigation, page headers, dashboard skeletons, placeholder destinations, reusable states, and light/dark theme foundations.
- Its settings page provides current account information, the existing counselor profile fields, theme selection, password change, current logout, and logout-all.
- Its student area provides a persistent assigned-student list and read-only basic profile detail through counselor-scoped backend contracts, with localized loading, empty, error, and pagination states.
- Assigned-student detail provides constrained single and multi-row atomic task creation, a paginated task view with direct execution and read-only lifecycle feedback plus controlled counselor-task date changes, and a read-only Saturday-to-Friday task distribution derived from the same assigned student's tasks. Counselor lifecycle/content editing, bulk rescheduling, templates, analytics, and reports remain absent.
- It remains an application foundation rather than a complete counselor product UI.

Neither application shell should be described as a complete product merely because it builds.

## Development Workflow State

- Existing root `dev`, `build`, `test`, and `typecheck` commands retain their API scope; explicit frontend and aggregate commands supplement them.
- `pnpm validate` is the canonical all-workspace local verification gate and includes the focused Student Web and Counselor Web unit suites.
- Both frontend applications have independent lint, build, and focused unit-test scripts; their build commands include TypeScript project builds.
- Local development uses API port 4000, Student Web port 5173, and Counselor Web port 5174 with explicit environment examples.
- `.node-version` records Node.js 24.19.0, while root package metadata supports Node.js 24.x and pins pnpm 11.24.0.
- Ordinary local development must remain Docker-independent and use Node.js processes with a locally available PostgreSQL instance.

## Infrastructure State

### Implemented configuration

- Production image definitions exist for the API, Student Web, and Counselor Web.
- `infrastructure/docker/` contains the API liveness script and a shared container-local SPA static-server configuration.
- The root `.dockerignore` excludes real environment files and irrelevant local artifacts while preserving required monorepo inputs.
- The root `docker-compose.yml` defines a statically verified API/web/PostgreSQL topology on a private network with named PostgreSQL persistence and no published host ports.
- `.env.production.example` documents the intended public origins and placeholder-only Compose inputs; real runtime values remain server-only, external, and ignored.
- Compose waits for PostgreSQL health before starting the API and configures the API image's existing probe to use database-aware `/health`.
- Compose does not execute Prisma migrations; migration orchestration remains deferred.
- `infrastructure/nginx/` defines statically verified exact-host HTTP edge routing to the three application services, forwarded headers, frontend asset expiry, and baseline response headers.
- The edge is not yet packaged or attached to Compose. It has no TLS, certificate, DNS, Cloudflare, or deployment configuration.
- The frontend image's internal Nginx remains a static file server and supplies SPA history fallback; it does not proxy API traffic.
- `docs/SECURITY.md` records the reviewed production security, logging, error, health, rate-limit, upload, and launch-checklist contracts.
- `docs/backup-restore.md` defines backup/restore design and required evidence; no backup or restore automation exists.
- `docs/deployment.md` defines the future Ubuntu LTS server layout, exact-release and environment workflow, manual migration gate, update sequence, rollback decisions, and incomplete production checklist.
- No deployment scripts are implemented.
- No backup or restore scripts are implemented.
- No CI workflow is implemented.

### Locally runnable

- The current practical development workflow uses Node.js processes and locally available PostgreSQL through repository package scripts.
- Docker is unavailable on the development laptop.
- **Docker is intentionally not required on the development laptop.**

This local constraint does not remove the requirement to implement production-quality Docker/Compose configuration later.

### Production runtime verified

**NO.** Production infrastructure has not been runtime-verified.

The implemented container-image and Compose configuration is statically checked locally. Docker runtime verification must be reported separately and performed in an appropriate environment.

## Known Remaining Foundation Work

- Shared package strategy and implementation
- Docker Compose runtime verification and a reviewed migration execution mechanism
- Nginx syntax/runtime verification, Compose integration, and TLS termination strategy
- Production secret provisioning and target-environment validation
- Deployment execution and any separately authorized automation
- Backup automation and isolated restore execution; upload backup design only if uploads are introduced
- CI/CD validation foundation
- Ongoing product, API, and operational documentation maintenance
- Distributed abuse protection, security monitoring, and environment-specific hardening verification

These items are not authorization to implement all remaining Phase 0 work in one task.

## Known Product Work Not Implemented

This is an implementation-status inventory, not an authorization list. [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md) governs whether an area is in scope; an approved architect milestone is still required before implementation.

- Full student product UI
- Full counselor product UI
- Advanced profile and account-recovery workflows
- Complete task/planning UX beyond the current today/weekly views and subject/topic slices
- Approved runtime projection of the canonical Curriculum and any transition from student-owned subjects/topics
- Curriculum-linked student progress behavior; its exact model is not approved by this document
- Counselor planning revisions and historical visibility for the original counselor plan
- Explicit practice-activity classification and full task-level learning-result feedback
- Fast professional block-planning workflows, repeat/copy operations, and canonical curriculum assignment
- Future Question Bank with authorized submission, admin review, difficulty, and existing-Curriculum linkage; exact link cardinality remains a Product Owner decision
- Live assessment execution, question-level attempts, and exam sessions
- Pomodoro, pause/resume, focus modes, and timer product expansion beyond the live elapsed display
- Goals, habits, and focus capabilities within the approved product scope
- Persian calendar and daily evaluations
- Reports and analytics
- Exams and comparisons
- Messaging and notifications
- Communication, contextual tickets, and messages
- Future admin capabilities
- Private Counselor Notes
- File uploads and storage integration
- Subscriptions and payment readiness
- Production deployment, hardening, and operational verification

The following remain explicitly **not currently implemented**: an approved consumer-integrated canonical Curriculum projection, Curriculum-linked progress, reports/analytics, a Question Bank, online exams, subscriptions, and several communication and administration capabilities. In-scope status does not imply implementation authorization. AI Educational Review, Human Scientific Review Workflow, Knowledge Packages, formula/scientific approval engines, question-pattern or skill taxonomies, curriculum-as-knowledge-graph, and educational content-production machinery are explicitly out of scope.

## Current Safety Rules

- Follow root [AGENTS.md](../AGENTS.md) for decision authority, scope boundaries, and milestone reporting.
- Treat `cori.docx` as authoritative educational truth; do not alter Curriculum content without explicit Product Owner approval.
- Return ambiguous product behavior and unapproved Student-facing UX to the Product Owner as a Decision Gate.
- Never reset or clean a working tree without first reviewing and preserving all tracked and untracked work.
- Never rewrite applied migration history.
- Never store secrets, credentials, tokens, private keys, or real environment values in Git.
- Do not make Docker a requirement for development on the current laptop.
- Backend authorization is authoritative; frontend role hiding is not security.
- Verify each feature end-to-end before marking it complete.
- Use PostgreSQL for real product persistence; mocks are limited to tests or explicit demonstrations.
- End every meaningful milestone with proportionate verification and a focused Git checkpoint.
- Do not continue automatically into another milestone without explicit authorization.

## Phase 2 Milestone 19 — Completed Assessment Attempt Foundation

**Status: COMPLETE**

- `AssessmentAttempt` is the independent, student-owned record for one completed assessment result bundle. It has no relationship to `StudySession` and no live lifecycle, timer, pause, resume, cancellation, or execution lock of its own.
- One additive migration creates `assessment_attempts` with optional `DailyTask`, subject, and topic provenance; required start/end timestamps; raw correct, incorrect, and blank counts; server-owned nullable invalidation metadata; ownership relations; indexes; and database checks for ordered time, non-negative counts, a positive derived question total, and topic-requires-subject consistency.
- Student-only APIs create, list, read, correct, and invalidate owned attempts. Strict request schemas reject ownership and immutable provenance changes. Safe responses omit the internal student profile ID and derive `questionCount` and `durationMinutes` without adding scoring or accuracy.
- Creation never changes `DailyTask` lifecycle or `plannedTestCount`. Valid linked attempts block both student and counselor task rescheduling; invalidated-only attempt history does not. Creation, invalidation, and rescheduling reuse the stable StudentProfile PostgreSQL row-lock boundary.
- Student Web provides a compact RTL completed-attempt form and history with raw counts, derived total/duration, and confirmed soft invalidation. Counselor Web remains mutation-free and only receives the minimal valid-attempt signal needed to disable an impossible reschedule.
- No score, percentage, accuracy, report, analytic, chart, AI interpretation, question bank, question-level answer, exam template, live assessment flow, or automatic task outcome was introduced.

## Historical Post-Checkpoint Curriculum Direction — Superseded

The entries from the 2026-09-17 documentation checkpoint through Knowledge Phase 7.3A are retained as implementation history and recovery evidence. They do not describe approved product direction. Educational structures copied from the authoritative source remain protected; the over-engineered governance, knowledge-package, taxonomy, content-production, and scientific/AI review direction is rejected. No status label inside this historical block overrides [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md) or [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md).

### 2026-09-17 Documentation Design Checkpoint

**Historical status at the time: COMPLETE — DOCUMENTATION ONLY; CURRENT DIRECTION SUPERSEDED**

The target architecture is now formally specified in:

- [CANONICAL_CURRICULUM_SPECIFICATION.md](CANONICAL_CURRICULUM_SPECIFICATION.md)
- [PLANNING_ARCHITECTURE.md](PLANNING_ARCHITECTURE.md)
- [ASSESSMENT_ARCHITECTURE.md](ASSESSMENT_ARCHITECTURE.md)
- [QUESTION_BANK_ARCHITECTURE.md](QUESTION_BANK_ARCHITECTURE.md)
- [COMMUNICATION_ARCHITECTURE.md](COMMUNICATION_ARCHITECTURE.md)
- [COUNSELOR_ECOSYSTEM.md](COUNSELOR_ECOSYSTEM.md)

ADRs 025 through 032 record the accepted lifecycle, compatibility, planning, assessment, question, communication, relationship, private-note, and experience decisions. This checkpoint changes no application code, Prisma schema, migration, API contract, UI, test, dependency, generated client, or database state. It does not authorize implementation. The next implementation proposal must begin with canonical curriculum data/API/UX design and a concrete compatibility plan derived from the approved specification.

### Phase 20.8 — Human Sciences Curriculum Structural Import

**Status: IMPLEMENTED AND VALIDATED; DATABASE EXECUTION BLOCKED BY MISSING SOURCE ARTIFACT**

- A provenance-bound catalog contains 420 nodes: one root, four source scopes, 12 grades, 32 subjects, 86 explicit chapters/sections, and 285 explicit lessons. It contains no concepts or sub-concepts.
- The 20 Human Sciences-specific subjects use their exact official matrix labels and grade ownership. The four selected shared course families are represented once per grade under the shared scope, not cloned under Human Sciences.
- Thirty-six applicability relationships connect the 12 shared subject nodes to the corresponding Mathematics-Physics, Experimental Sciences, and Human Sciences grade nodes without adding canonical parents.
- `نگارش`, `آمادگی دفاعی`, `هویت اجتماعی`, and `سلامت و بهداشت` are not included. Alternate thematic trees and unlabeled lower branches are not inferred or imported.
- The import command performs exact transcription drift checks, builds the checksummed manifest in memory, validates provenance, imports only into an authorized draft, reuses stable source-key matches, creates only missing applicability relationships, runs final validation, emits reports, and never publishes.
- No Prisma schema or migration was required because the implementation uses the existing CurriculumVersion, node, source-record, import, and relationship model. Existing `TOPIC` is the structural code for explicit source `درس`/`Lesson` nodes; lower topic/concept detail remains deferred.
- Focused verification: API type-check passed; all 6 Human Sciences catalog/import tests passed through a compiler-bundled Node test run. The native `tsx` launcher is currently blocked on this Windows host by `uv_os_get_passwd` returning `ENOMEM` before test startup.
- The database import was not executed. The original `cori.docx` required by the provenance contract is absent from the workspace, and no authorized operator/database import context was supplied. Public curriculum API queryability therefore remains pending the normal import, review, and publication workflow.

The historical supporting runbook referenced at the time was removed in Recovery Foundation 2; this entry remains as the implementation record.

### Phase 20.9 — Mathematics & Physics Curriculum Structural Import

**Status: IMPLEMENTED AND VALIDATED; DATABASE EXECUTION NOT AUTHORIZED**

- The Mathematics & Physics catalog reuses the exact stable-key theoretical foundation already used by Human Sciences, including the root, shared scope, all branch/grade skeletons, 12 shared subjects, their explicit structural detail, and 36 applicability relationships.
- Eleven field-specific subjects are represented under their exact source grades: three in Grade 10, four in Grade 11, and four in Grade 12.
- The field-specific source contains 49 explicit chapter/section headings and no explicit `درس` or `Lesson` headings. Lower unlabeled branches were not inferred or promoted, so the Mathematics-specific catalog adds zero lesson-level `TOPIC` nodes and no concepts/sub-concepts.
- The complete import manifest contains 232 nodes: one root, four fields, 12 grades, 23 subjects, 73 chapters, and 119 shared explicit lessons. Of those, 60 records are new Mathematics & Physics content and 172 are stable shared-foundation records.
- Human Sciences and Mathematics & Physics commands now use one structural-import runner, keeping authorization, provenance validation, idempotency, source-key reuse, applicability creation, final validation, reporting, and no-publication behavior identical.
- Focused regression verification passed 12/12 tests across both field catalogs. API type-check and production build passed. No Prisma schema or migration change was required.
- No database import or publication was executed because no authorized draft/version/admin context was supplied. The workspace also still lacks the original reviewed `cori.docx` required by the provenance contract.

The historical supporting runbook referenced at the time was removed in Recovery Foundation 2; this entry remains as the implementation record.

### Phase 20.10 — Experimental Sciences Curriculum Structural Import

**Status: IMPLEMENTED AND VALIDATED; DATABASE EXECUTION NOT AUTHORIZED**

- The Experimental Sciences catalog reuses the exact stable-key theoretical foundation and 36 shared-subject applicability relationships used by the Human Sciences and Mathematics & Physics imports.
- Thirteen field-specific subjects are represented under their exact source grades: four in Grade 10, five in Grade 11, and four in Grade 12. Shared Persian, Arabic/Quran Language, Religion and Life, and English subjects are not cloned.
- The accepted field-specific structure contains 42 explicit chapters: 10 Chemistry, 11 Physics, and 21 Mathematics chapters. It adds no field-specific lesson `TOPIC`, concept, sub-concept, skill, weight, planning, question, or analytics data.
- Biology's three unheaded chapter sequences, absent detailed Geology structure, and the cross-grade Experimental Mathematics thematic tree remain explicitly excluded pending educational-administrator ownership decisions. No parent or missing lesson was inferred.
- The complete valid manifest contains 227 nodes: one root, four fields, 12 grades, 25 subjects, 66 chapters, and 119 shared explicit lessons. Fifty-five records are Experimental Sciences-specific and 172 are reused foundation records.
- The import command uses the shared structural runner and preserves the same authorization, provenance, idempotency, validation, reporting, and no-publication boundaries.
- No database import or publication was executed because the reviewed source artifact, authorized Admin UUID, and draft Curriculum Version were not supplied.

The historical supporting runbook referenced at the time was removed in Recovery Foundation 2; this entry remains as the implementation record.

### Phase 20.11 — Curriculum Freeze and Audit Layer

**Status: IMPLEMENTED AND VALIDATED; CANDIDATE NOT DATABASE-FROZEN OR PUBLISHED**

- A deterministic aggregate combines the stable shared foundation with the Human Sciences, Mathematics & Physics, and Experimental Sciences-specific catalogs without duplicating common records.
- The offline audit validates source-key uniqueness, provenance, parent integrity, allowed structural depth, exact scope/grade ownership, subject ownership, branch isolation, shared-subject applicability, explicit chapter order, and the absence of inferred or unsupported node types.
- The accepted structural candidate contains 535 nodes: four scopes, 12 grades, 56 subjects, 177 chapters/sections, and 285 explicit structural lessons. Twelve subjects are shared, 44 are scope-specific, and 36 applicability relationships connect shared subjects to branch grades.
- Twelve known source limitations remain explicit manual-review items. They are neither silently resolved nor converted into curriculum nodes.
- The checked-in audit report and freeze-candidate manifest pin counts, the full subject list, unresolved review items, and the aggregate catalog SHA-256. Source artifact/transcription checksums and the database Curriculum Version identifier remain null placeholders.
- The audit command is read-only and has no Prisma/database dependency. It cannot import, review, freeze, or publish a Curriculum Version.

The historical freeze runbook and executable audit command were removed in Recovery Foundation 2; retained JSON evidence is explicitly non-authoritative.

### Phase 20.12 — Curriculum Knowledge Graph Foundation

**Status: FOUNDATION IMPLEMENTED; PRODUCTION TAXONOMY EMPTY**

- A persistence-neutral taxonomy domain defines future `TOPIC → SUBTOPIC → CONCEPT → SKILL → QUESTION_PATTERN` knowledge records anchored to exact existing structural Curriculum nodes and Curriculum Versions.
- Knowledge taxonomy kinds are separate from structural Curriculum Node Type codes. Existing structural `TOPIC` nodes remain source-explicit `درس`/`Lesson` records and are not reinterpreted or duplicated.
- The validator enforces registry/version pins, valid structural anchors, subject ownership, strict taxonomy parent types, stable unique taxonomy keys, provenance, and same-subject/same-version parentage.
- The production taxonomy registry and knowledge-node collection are empty. No catalog reference is misrepresented as a database node ID before governed import assigns real identifiers.
- Focused tests cover valid future hierarchy fixtures and rejection of missing anchors, orphan Concepts, duplicate keys, cross-subject ownership, and populated `EMPTY` registries. The frozen structural catalog and its checksum remain unchanged.
- No Prisma schema, migration, database import, API, frontend, question, analytics, planning, or scheduling behavior was added.

The rejected taxonomy design document and runtime were removed in Recovery Foundation 2; this entry remains as the implementation record.

### Phase 20.13 — Curriculum Content Ingestion Foundation

**Status: FOUNDATION IMPLEMENTED; CONTENT AND MAPPINGS EMPTY**

- A persistence-neutral content domain defines controlled source types, explanation/example/exercise/note/definition content kinds, source provenance, and `UNVERIFIED → REVIEWED → APPROVED` verification lifecycle rules.
- Every future Content Item requires its source type/reference, accountable creator, creation timestamp, and verification state. Reviewed or approved items require reviewer evidence.
- Future mappings pin an exact Curriculum Version, existing structural Curriculum node, and existing taxonomy node while enforcing same-subject ownership.
- Validators reject missing provenance, invalid review evidence, duplicate keys, nonexistent targets, version mismatches, and cross-subject mappings.
- Production content and mapping registries remain empty. No textbook, OCR output, question, concept, taxonomy node, or educational content was created.
- The frozen structural checksum and empty taxonomy production state remain unchanged. No Prisma schema, migration, database, API, frontend, scheduling, or analytics behavior was added.

The rejected content-ingestion design document and runtime were removed in Recovery Foundation 2; this entry remains as the implementation record.

### Phase 20.14 — Physics 12 Motion Curriculum Knowledge Pilot

**Status: ISOLATED CODE PILOT IMPLEMENTED; UNVERIFIED AND NOT DATABASE-IMPORTED**

- The pilot is anchored only to Mathematics & Physics `فیزیک ۳` and structural chapter `فصل ۱ ـ حرکت بر خط راست` (`mathematics.g12.physics3.chapter.4278`).
- One `DRAFT` registry entry references the frozen catalog candidate snapshot provisionally. It is not a database Curriculum Version ID.
- Thirty manual taxonomy records exercise the full hierarchy: one Topic, five Subtopics, eight Concepts, eight Skills, and eight Question Pattern classifications.
- Twelve short Persian manual Content Items—Definitions, Explanations, and Examples only—carry `MANUAL_ENTRY` provenance and remain `UNVERIFIED`. No Exercise or Question record exists.
- Twelve non-owning mappings pin each Content Item to the exact structural chapter and one existing pilot Concept or Skill.
- Validation confirms hierarchy, Concept ownership, mapping targets, provenance, version/subject isolation, the 20-item limit, and no impact on the frozen structural checksum.
- No unrelated subject is populated. No PostgreSQL import, Prisma schema, migration, API, frontend, analytics, scheduling, recommendation, or broader Physics ingestion was introduced.

The rejected pilot document, payload, and review support were removed in Recovery Foundation 2; this entry remains as the implementation record.

### Phase 20.15 — Arabic 10 Lesson 1 Cross-Domain Knowledge Pilot

**Status: ISOLATED CODE PILOT IMPLEMENTED; UNVERIFIED AND NOT DATABASE-IMPORTED**

- The pilot reuses canonical shared subject `عربی، زبان قرآن ۱` and explicit structural node `درس ۱ ـ ذاکَ هُوَ الله` (`shared.g10.arabic.lesson.186`). Human Sciences access remains represented by the existing applicability relationship to `human.g10`; no Human-specific subject or lesson clone was created.
- One `DRAFT` registry entry and 27 lesson-scoped taxonomy records cover three Topics, five Subtopics, seven Concepts, seven Skills, and five Question Pattern classification labels.
- Twelve original manual Content Items—four Definitions, three Explanations, four Examples, and one Note—carry `MANUAL_ENTRY` provenance and remain `UNVERIFIED`.
- Twelve mappings pin content to the exact shared structural lesson and an existing Arabic pilot Concept or Skill without changing structural ownership.
- Combined Arabic and Physics registries validate without duplicate keys, version mismatch, or cross-subject ownership conflict. Physics pilot records remain unchanged and the frozen structural checksum is unchanged.
- No Question Bank, question, answer, option, difficulty, analytics, scheduling, planning, frontend, Prisma migration, database import, publication, or broader Arabic ingestion was introduced.

The rejected pilot document, payload, and review support were removed in Recovery Foundation 2; this entry remains as the implementation record.

### Phase 20.16 — Curriculum Scaling Architecture

**Status: DRAFT PACKAGE AND VALIDATION TOOLING IMPLEMENTED; NO IMPORT OR PUBLICATION**

- A persistence-neutral Draft Knowledge Import Package model defines stable package identity, subject, structural scope, Curriculum Version pin, source type, package status, and review metadata.
- Knowledge Expansion Manifest schema version `1.0.0` carries one exact structural anchor, taxonomy nodes, Content Items, and mappings.
- Read-only package validation composes the existing taxonomy and content validators, then enforces package/anchor alignment, source-type consistency, review metadata, and package-scope ownership.
- Package-set validation rejects duplicate package IDs and taxonomy, content, or mapping keys across future packages.
- The existing Physics 12 Motion and Arabic 10 Lesson 1 pilots are registered as two `DRAFT`, `PENDING` review packages without copying or changing pilot records.
- Validation never advances `DRAFT → VALIDATED → REVIEWED → APPROVED`; review and status changes remain explicit future governance actions.
- The registered inventory remains 57 taxonomy nodes, 24 Content Items, and 24 mappings. The frozen structural checksum is unchanged.
- No bulk import, OCR, AI generation, Question Bank, analytics, scheduling, database, migration, API, or frontend behavior was added.

The rejected package/scaling document and runtime were removed in Recovery Foundation 2; this entry remains as the implementation record.

### Phase 20 Authoring Tooling Checkpoints

**Status: PHASE 20.7 AUTHORING VALIDATION AND PHASE 20.8 AUTHORING-TO-MANIFEST CONVERSION IMPLEMENTED; NO IMPORT OR PUBLICATION**

- The authoring validator audits the 25 Experimental Sciences YAML files without changing them. They remain `DRAFT`/`PARTIAL` with zero source records; the current audit has zero validation failures and 125 readiness warnings.
- The offline conversion tool requires reviewed, complete, source-bound authoring evidence and verifies the actual source artifact and transcription checksums before producing a deterministic Curriculum Import Manifest v1. Valid draft authoring is not automatically conversion-ready.
- Ambiguity markers remain explicit, and relationship proposals and editorial/review commentary do not become canonical manifest relationships or content.
- No source artifact has been imported into PostgreSQL, and no Curriculum Version has been created or published by these tooling checkpoints.

### Phase 20.8.2 — Database Migration Rehearsal & Runtime Verification

**Status: PASS; DISPOSABLE DATABASE ONLY, NO SOURCE IMPORT OR PUBLICATION**

- PostgreSQL 17.11 accepted the complete 18-migration history from an empty, isolated local rehearsal database through `prisma migrate deploy`; migration status was up to date and schema comparison reported no drift.
- All fourteen contracted Phase 20 tables and all twelve frozen M19 domain tables were present. The four Phase 20 migrations remain additive, and the fourteen pre-Phase-20 migrations were not rewritten.
- The three database-dependent Curriculum invariant tests passed with zero database-related skips. The complete Curriculum suite passed 135/135, and the full API suite passed 329/329 against the rehearsal schema.
- Synthetic-only runtime checks verified draft creation/read authorization, unauthorized denial, unpublished-draft isolation, audit persistence, lifecycle and identity constraints, same-version parent enforcement, capability controls, import checksum integrity, and explicit legacy mapping integrity.
- No Curriculum import, source record, legacy mapping, source-derived Curriculum Version, or publication was created. The disposable rehearsal database was removed after verification.

### Knowledge Phase 7.1 — First Production Knowledge Package Foundation

**Status: PRODUCTION PACKAGE CANDIDATE IMPLEMENTED; DRAFT, UNREVIEWED, AND NOT PERSISTED**

- The existing Physics 12 Motion pilot remains the unchanged educational payload and evidence fixture. A separate `PRODUCTION_PACKAGE_CANDIDATE` envelope reuses its exact 30 taxonomy nodes, 12 unverified Content Items, and 12 mappings by reference.
- Stable opaque package and revision identities, a positive revision number, deterministic payload/package checksums, and a deterministic readiness report establish correction-safe in-repository revision handling without database persistence.
- Production validation composes the existing package, taxonomy, and content validators and additionally enforces the exact Physics 3 Chapter 1 anchor, frozen candidate snapshot and checksum, pilot payload integrity, key and identity collision checks, `DRAFT`/`PENDING` lifecycle, unverified Content, and absence of a claimed database Curriculum Version UUID.
- Machine structure is `PASS`; educational review is `PENDING`; persistence is `BLOCKED_PENDING_CURRICULUM_VERSION_REBIND`; publication is `NOT_AUTHORIZED`.
- The package remains pinned provisionally to the frozen candidate and explicitly requires an exact Curriculum Version rebind before any future persistence. No database record, structural Curriculum change, Question Bank item, analytics, planning, recommendation, or additional educational material was created.
- Arabic 10 remains an isolated pilot and no Arabic production package was created. The structural checksum remains `ef04a21c556dbc716137d8291c44e933f73fc8fd3c538dc3dfd59a1f560164be`.

The rejected production-package document, payload, and review support were removed in Recovery Foundation 2; this entry remains as the implementation record.

### Knowledge Phase 7.2 — Governed Educational Review Workflow

**Status: REVIEW TOOLING IMPLEMENTED; REAL PHYSICS REVISION REMAINS DRAFT/PENDING**

- A persistence-neutral review-session contract binds human evidence to the exact package ID, revision ID/number, payload and package checksums, subject, structural scope, and provisional Curriculum snapshot.
- Twelve controlled review dimensions, explicit dimension dispositions, targeted findings, reviewer metadata, and `PENDING → IN_REVIEW → CHANGES_REQUESTED | ACCEPTED` validation support human decisions without making them.
- Validation rejects stale identity/checksum evidence, missing mandatory decisions, open blocking findings on acceptance, invalid targets, duplicate decisions, and inconsistent review metadata. A valid accepted decision only makes the exact revision eligible for a later explicit `REVIEWED` transition.
- Review history remains bound to each historical revision. Synthetic tests prove a correction creates a new revision identity/checksum, retains stable package identity, binds its predecessor, and resets to `DRAFT` / `PENDING` without creating a real Revision 2.
- A deterministic Physics review packet and blank JSON template expose all current taxonomy, Content, and mapping identities without reviewer answers. The real Physics candidate remains Revision 1, `DRAFT`, `PENDING`, unpersisted, and rebind-blocked; all 12 Content Items remain `UNVERIFIED`.
- No educational payload, structural Curriculum, pilot data, database schema, Question Bank, analytics, or planning behavior changed.

The rejected Knowledge Package review document and runtime were removed in Recovery Foundation 2; this entry remains as the implementation record.

### Knowledge Phase 7.3A — AI Review Triage & Human Attestation Preparation

**Status: AI EVIDENCE INTAKE AND BLANK HUMAN TRIAGE TOOLING IMPLEMENTED; NO HUMAN ATTESTATION OR PAYLOAD CHANGE**

- The supplied Physics Revision 1 AI-assisted review is retained byte-for-byte as advisory `CHANGES_REQUESTED` evidence with nine findings. Controlled intake metadata classifies it as `AI_ASSISTED`; reviewer provenance is never inferred from its display name.
- AI review cannot satisfy the qualified-human `ACCEPTED` gate or authorize a corrected revision. The real package remains Revision 1, `DRAFT`, and `PENDING` for human review.
- Deterministic triage validation requires a qualified human to bind every `CONFIRM`, `REJECT`, or `MODIFY` decision to the exact AI session, finding, package revision, payload/package checksums, and immutable evidence checksum.
- A deterministic attestation packet and blank JSON input expose all twelve dimensions and all nine AI findings without fabricating a human identity, answer, timestamp, or outcome.
- No Revision 2, educational payload change, Content verification, database persistence, structural Curriculum change, approval, or publication occurred.

The rejected AI-review document, evidence support, and runtime were removed in Recovery Foundation 2; this entry remains as the implementation record.

## Recovery Foundation — Current Next Work

Recovery Foundation 4 leaves core Student/Counselor behavior and the RF3 read-only Canonical Curriculum runtime intact while retiring only the unused historical governance persistence. The protected source transcription and source-fidelity evidence remain in the repository and remain authoritative over the generated projection.

Product-record integration, data mapping, Question Bank linking, source-reference migration planning, and Student/Counselor UX changes require their own explicit milestones. Applied migration history remains immutable.
