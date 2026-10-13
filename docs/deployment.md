# Production Deployment Preparation

This runbook defines the Phase 0 Milestone 7 deployment contract for a future Ubuntu LTS VPS. It is preparation only: no server was accessed, Docker was not installed locally, no container or migration was run, DNS was not changed, and TLS was not configured.

The current repository is not yet a public deployment bundle. The application images and Compose topology are statically verified, but the HTTP edge is not packaged or attached to Compose, no public ports are published, and the API runtime image intentionally does not contain the Prisma CLI or migration files. Those are pre-launch gates, not steps to bypass.

## Server assumptions

- Use a supported Ubuntu LTS release with security updates applied.
- Create a dedicated, non-root deployment operator with tightly controlled `sudo` access.
- Install Docker Engine and the Docker Compose plugin on the server from an approved source. Docker remains unnecessary on the development laptop.
- Check out an exact reviewed commit or release identifier. Do not deploy an unreviewed moving branch.
- Keep the database, API, and web containers private. Only the future controlled edge may publish approved HTTP/HTTPS ports.
- Send container logs to restricted stdout/stderr collection. Do not log environment files, database URLs, tokens, cookies, or passwords.

## Recommended server layout

```text
/opt/konkourix/
|-- current/                  # exact checked-out application release
|-- releases/                 # optional prior immutable checkouts
|-- config/
|   `-- production.env       # server-only Compose/runtime values; mode 0600
|-- shared/
|   |-- backups/             # protected local staging only; off-host copy required
|   `-- uploads/             # reserved; unused until an upload subsystem exists
`-- logs/                     # optional restricted exports; containers log to stdout/stderr
```

The Compose-managed `postgres-data` named volume is the current persistent database storage. Operators must not manipulate Docker's internal volume directory directly. The backup staging directory is not itself a backup; follow [backup-restore.md](backup-restore.md) and retain encrypted copies off-host. The uploads directory and `UPLOAD_PATH` example are reservations only: the current API has no upload subsystem or upload volume.

The `/opt/konkourix` tree should be owned by the deployment administrator, not made globally writable. Limit `production.env`, backup artifacts, and operational logs to the minimum required accounts. Application containers retain their existing non-root runtime policies.

## Production environment

Copy `.env.production.example` to `/opt/konkourix/config/production.env` on the server, replace every secret placeholder there, and restrict the file to mode `0600`. Never place the populated file in the repository, an image layer, a frontend variable, shell history, or operator documentation.

Invoke Compose with both paths explicitly so configuration does not depend on the operator's current directory:

```sh
docker compose \
  --env-file /opt/konkourix/config/production.env \
  -f /opt/konkourix/current/docker-compose.yml \
  config --quiet
```

The example fixes the intended public values to:

| Public origin | Destination contract |
| --- | --- |
| `https://app.konkourix.ir` | Student Web (`student-web:8080`) |
| `https://counselor.konkourix.ir` | Counselor Web (`counselor-web:8080`) |
| `https://api.konkourix.ir` | API (`api:4000`) |

`VITE_API_URL` is public build-time configuration and is embedded in both browser bundles. `POSTGRES_PASSWORD`, `DATABASE_URL`, and `ACCESS_TOKEN_SECRET` are server-only secrets. `COOKIE_DOMAIN` should remain empty for the preferred host-only API refresh cookie. `TRUST_PROXY=false` is the safe default; before the edge carries traffic, replace it with only the controlled edge source IP/CIDR and verify the API is not directly reachable by untrusted clients.

The current authentication architecture uses `ACCESS_TOKEN_SECRET` for signed access tokens. Refresh tokens are random server-side sessions, so there is no second refresh-token JWT secret to configure.

## Release gates

Before any first launch or update, the operator must record the target Git commit and verify:

1. The release passed the repository validation gate.
2. The production environment file has no placeholder secret values and passes `docker compose ... config --quiet` without rendering or publishing its contents.
3. Images build and start in a Docker-capable staging environment.
4. The PostgreSQL backup and isolated restore evidence required by the backup design exists.
5. Every committed migration was reviewed against the current production data and tested in staging.
6. A reviewed migration runner is available, and its Prisma/database versions match this release.
7. Edge packaging and Compose/network attachment are implemented and syntax-tested.
8. DNS, TLS, firewall, trusted-proxy, and direct-port exposure checks are complete.

The last two gates are intentionally not implemented by this milestone. The documented domains must not receive production traffic until they pass.

## First-install command contract

The future operator workflow is:

1. Create the protected directory layout and clone the repository into `current/`.
2. Check out the exact reviewed commit in detached state and record it as the release identifier.
3. Create `config/production.env` from the committed example on the server and provision unique high-entropy secret values.
4. Validate resolved Compose configuration with the explicit `--env-file` and `-f` paths.
5. Build images with the reviewed source and fresh base images:

   ```sh
   docker compose \
     --env-file /opt/konkourix/config/production.env \
     -f /opt/konkourix/current/docker-compose.yml \
     build --pull
   ```

6. Start PostgreSQL only and wait for its health check:

   ```sh
   docker compose \
     --env-file /opt/konkourix/config/production.env \
     -f /opt/konkourix/current/docker-compose.yml \
     up -d postgres

   docker compose \
     --env-file /opt/konkourix/config/production.env \
     -f /opt/konkourix/current/docker-compose.yml \
     ps postgres
   ```

7. Run the reviewed migration procedure described below and confirm migration status.
8. Start the API and web services, then require healthy status before attaching public traffic:

   ```sh
   docker compose \
     --env-file /opt/konkourix/config/production.env \
     -f /opt/konkourix/current/docker-compose.yml \
     up -d api student-web counselor-web

   docker compose \
     --env-file /opt/konkourix/config/production.env \
     -f /opt/konkourix/current/docker-compose.yml \
     ps
   ```

9. After the future edge/TLS integration exists, verify external HTTPS routes, API liveness/readiness, headers, cookies, CORS, and logs without exposing secrets.

These commands are a contract for a future operator. They were not executed during this milestone.

## Migration strategy

Production migrations are manual, reviewed release operations. They run after a verified backup and PostgreSQL readiness, but before new application traffic or application processes that require the new schema. Neither Dockerfiles, Compose startup, nor application entrypoints may run migrations automatically.

The repository-level Prisma commands that a reviewed runner must execute from the matching release are:

```sh
pnpm --filter api exec prisma migrate status --config ../../prisma.config.ts
pnpm --filter api exec prisma migrate deploy --config ../../prisma.config.ts
pnpm --filter api exec prisma migrate status --config ../../prisma.config.ts
```

The migration runner must receive `DATABASE_URL` through the protected server secret mechanism, use Node 24 and pnpm 11.24.0 with the frozen lockfile, and retain command result evidence without printing the URL. The current production API image cannot serve as this runner because it deliberately excludes the Prisma CLI and migration tree. A separate reviewed migration execution mechanism is therefore required before deployment; this milestone does not add one or claim migrations were executed.

If migration review, backup evidence, execution, or post-migration status fails, stop the release and do not start or route the new application version. Never use `migrate reset`, edit applied migration history, or improvise a reverse migration in production.

## Missed-deadline reconciliation scheduler

Missed Task deadlines are reconciled by the bounded one-shot API command `node dist/scripts/reconcile-task-deadline-misses.js`. It processes at most 100 candidates per batch and 1,000 candidates per invocation, uses database time and the `Asia/Tehran` timezone, and is safe to retry or overlap.

The reviewed systemd units are stored in `infrastructure/systemd/konkourix-deadline-misses.service` and `infrastructure/systemd/konkourix-deadline-misses.timer`. After the additive migration is applied, every API instance runs compatible mutation code, the `konkourix` service account can run the exact Compose command, and one manual command invocation succeeds, an operator may install the units under `/etc/systemd/system`, run `systemd-analyze verify` against both files, reload systemd, and enable the timer. Verify `systemctl list-timers konkourix-deadline-misses.timer` and inspect the service journal after its first run.

Do not enable the timer before schema and application rollout. Repository validation does not activate or prove a production timer; installation, permissions, first execution, monitoring, and alerting remain deployment operations on the target Ubuntu host.

## Update contract

For a future update:

1. Record the running commit, resolved configuration, database migration state, and last verified backup identifier.
2. Fetch the intended source and prepare a separate release checkout at the exact reviewed commit.
3. Run local/staging validation and build the release images before changing live services.
4. Review migration compatibility in both directions and take a verified backup when the release changes data contracts.
5. Apply pending migrations through the controlled procedure before routing traffic to code that requires them.
6. Recreate only the intended application services from the reviewed Compose file.
7. Verify container health, API liveness/readiness, external HTTPS behavior, and sanitized logs before completing the change.

Do not use an unqualified `git pull` on the live checkout as the release record. Do not expose the database or API port to make an update easier.

## Rollback contract

The primary application rollback is the previously recorded exact release commit/image set, not a mutable branch. Keep the prior release metadata until the new version and its data behavior are verified.

- If no incompatible migration ran, restore the prior checkout/images, recreate the affected services, and re-run health and external verification.
- If a forward-compatible migration ran, prefer rolling back application code while retaining the schema, after compatibility was confirmed during review.
- If a destructive or incompatible data change occurred, stop traffic and follow the approved restore procedure. Restoring a database can discard post-backup writes and requires an explicit incident decision; it is never an automatic deployment action.
- Prisma has no automatic down-migration workflow here. Never delete or edit applied migration files to simulate rollback.

Before rollback is considered complete, record the active commit, migration state, health results, data/recovery decision, and incident owner.

## Server operations checklist

Every item remains incomplete until verified on the actual VPS:

- [ ] Supported Ubuntu LTS is patched, time synchronization is correct, and administrative access is restricted.
- [ ] Host firewall policy exposes only approved SSH and future edge HTTP/HTTPS ports; database and application ports remain private.
- [ ] Docker Engine and the Compose plugin are installed on the server, version-recorded, and configured to start safely.
- [ ] `/opt/konkourix` ownership and the `production.env` mode/owner are verified.
- [ ] Unique production secrets are generated on the server and all committed placeholders are replaced.
- [ ] The exact release commit and image/build provenance are recorded.
- [ ] PostgreSQL persistence, available disk space, and least-privilege database access are verified.
- [ ] Encrypted off-host backups are active and a matching isolated restore has succeeded.
- [ ] Migrations are reviewed, staging-tested, applied manually, and rechecked before traffic changes.
- [ ] Edge integration, explicit `TRUST_PROXY`, and direct application/database exposure are verified.
- [ ] DNS points to the controlled edge only.
- [ ] TLS certificates, redirect behavior, HSTS policy, and certificate renewal are configured and tested in their authorized milestone.
- [ ] API and frontend health, browser CORS/cookie behavior, security headers, and sanitized logs are verified.
- [ ] Log access, retention, rotation, alerting, resource monitoring, and backup-freshness alerts are configured.
- [ ] Rollback ownership, prior release availability, and incident communications are verified.

This checklist does not assert that any server, domain, certificate, backup, or production service exists.
