import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import pg from 'pg'

const databaseUrl = process.env.KONKOURX_TIMESTAMP_INTEGRITY_DATABASE_URL
const integrationTest = databaseUrl === undefined ? test.skip : test
const apiRoot = path.resolve(import.meta.dirname, '..')
const compiled = (relativePath) => import(pathToFileURL(path.join(apiRoot, 'dist', relativePath)).href)

const epochSeconds = (value) => value.getTime() / 1_000

const validateIsolatedDatabaseUrl = (value) => {
  const parsed = new URL(value)
  const database = parsed.pathname.slice(1)

  assert.equal(parsed.hostname, '127.0.0.1', 'timestamp integrity verification requires IPv4 loopback')
  assert.equal(parsed.port || '5432', '5432', 'timestamp integrity verification requires local port 5432')
  assert.match(
    database,
    /^konkourx_planner_e2e_[a-zA-Z0-9_]*$/,
    'timestamp integrity verification requires a disposable Planner E2E database',
  )
  assert.notEqual(database, 'konkourx')

  return database
}

const readFingerprints = async (client) => {
  const result = await client.query(`
    SELECT
      (SELECT md5(COALESCE(string_agg(to_jsonb(row_data)::text, '|' ORDER BY row_data.id), ''))
         FROM daily_tasks AS row_data) AS tasks,
      (SELECT md5(COALESCE(string_agg(to_jsonb(row_data)::text, '|' ORDER BY row_data.id), ''))
         FROM daily_task_deadline_misses AS row_data) AS deadline_misses,
      (SELECT md5(COALESCE(string_agg(to_jsonb(row_data)::text, '|' ORDER BY row_data.id), ''))
         FROM study_sessions AS row_data) AS study_sessions,
      (SELECT md5(COALESCE(string_agg(to_jsonb(row_data)::text, '|' ORDER BY row_data.id), ''))
         FROM auth_sessions AS row_data) AS auth_sessions,
      (SELECT md5(COALESCE(string_agg(to_jsonb(row_data)::text, '|' ORDER BY row_data.id), ''))
         FROM users AS row_data) AS users,
      (SELECT md5(COALESCE(string_agg(to_jsonb(row_data)::text, '|' ORDER BY row_data.id), ''))
         FROM student_profiles AS row_data) AS student_profiles,
      (SELECT md5(COALESCE(string_agg(to_jsonb(row_data)::text, '|' ORDER BY row_data.id), ''))
         FROM daily_task_curriculum_targets AS row_data) AS curriculum_targets,
      (SELECT md5(COALESCE(string_agg(to_jsonb(row_data)::text, '|' ORDER BY row_data.id), ''))
         FROM daily_task_curriculum_items AS row_data) AS curriculum_items,
      (SELECT md5(COALESCE(string_agg(to_jsonb(row_data)::text, '|' ORDER BY row_data.id), ''))
         FROM _prisma_migrations AS row_data) AS migrations
  `)

  return result.rows[0]
}

integrationTest('compiled Prisma preserves PostgreSQL timestamp instants and authorized projections', async (t) => {
  const isolatedDatabase = validateIsolatedDatabaseUrl(databaseUrl)
  const nonUtcDatabaseUrl = new URL(databaseUrl)
  nonUtcDatabaseUrl.searchParams.set(
    'options',
    '-c timezone=Asia/Tehran -c default_transaction_read_only=on',
  )
  process.env.DATABASE_URL = nonUtcDatabaseUrl.toString()
  process.env.PGOPTIONS = '-c timezone=Asia/Tehran'

  const client = new pg.Client({ connectionString: nonUtcDatabaseUrl.toString() })
  await client.connect()

  let app
  let prisma

  try {
    const identityResult = await client.query(`
      SELECT
        current_database() AS database,
        inet_server_addr()::text AS server_address,
        inet_server_port() AS server_port,
        current_setting('TimeZone') AS session_timezone,
        current_setting('default_transaction_read_only') AS transaction_read_only
    `)
    assert.deepEqual(identityResult.rows[0], {
      database: isolatedDatabase,
      server_address: '127.0.0.1/32',
      server_port: 5432,
      session_timezone: 'Asia/Tehran',
      transaction_read_only: 'on',
    })

    const beforeFingerprints = await readFingerprints(client)
    const ledgerResult = await client.query(`
      SELECT
        miss.id,
        miss."dailyTaskId" AS task_id,
        miss."scheduledFor"::text AS scheduled_for,
        miss."deadlineAt" AS deadline_at,
        extract(epoch FROM miss."deadlineAt")::double precision AS deadline_epoch,
        miss."recordedAt" AS recorded_at,
        extract(epoch FROM miss."recordedAt")::double precision AS recorded_epoch,
        extract(epoch FROM task."deadlineEligibilityStartedAt")::double precision AS eligibility_epoch,
        extract(epoch FROM (task."createdAt" AT TIME ZONE 'UTC'))::double precision AS task_created_epoch,
        CASE
          WHEN task."completedAt" IS NULL THEN NULL
          ELSE extract(epoch FROM (task."completedAt" AT TIME ZONE 'UTC'))::double precision
        END AS task_completed_epoch
      FROM daily_task_deadline_misses AS miss
      INNER JOIN daily_tasks AS task ON task.id = miss."dailyTaskId"
      ORDER BY miss."recordedAt", miss.id
      LIMIT 1
    `)
    assert.equal(ledgerResult.rowCount, 1, 'the preserved E2E database must contain deadline evidence')
    const authoritative = ledgerResult.rows[0]

    const sessionResult = await client.query(`
      SELECT
        id,
        extract(epoch FROM ("startedAt" AT TIME ZONE 'UTC'))::double precision AS started_epoch,
        CASE
          WHEN "endedAt" IS NULL THEN NULL
          ELSE extract(epoch FROM ("endedAt" AT TIME ZONE 'UTC'))::double precision
        END AS ended_epoch
      FROM study_sessions
      ORDER BY "createdAt", id
      LIMIT 1
    `)
    assert.equal(sessionResult.rowCount, 1, 'the preserved E2E database must contain a StudySession')
    const authoritativeSession = sessionResult.rows[0]

    ;({ prisma } = await compiled('lib/prisma.js'))

    await t.test('uses a UTC PostgreSQL session in the compiled application client', async () => {
      const settings = await prisma.$queryRawUnsafe(`
        SELECT
          current_setting('TimeZone') AS timezone,
          current_setting('default_transaction_read_only') AS transaction_read_only
      `)
      assert.deepEqual(settings, [{ timezone: 'UTC', transaction_read_only: 'on' }])
    })

    await t.test('preserves non-timezone PGOPTIONS while making UTC authoritative', () => {
      const prismaModuleUrl = pathToFileURL(path.join(apiRoot, 'dist', 'lib', 'prisma.js')).href
      const probe = `
        import { prisma } from ${JSON.stringify(prismaModuleUrl)}
        try {
          const settings = await prisma.$queryRawUnsafe(\`
            SELECT
              current_setting('TimeZone') AS timezone,
              current_setting('default_transaction_read_only') AS transaction_read_only,
              current_setting('statement_timeout') AS statement_timeout
          \`)
          console.log('TIMESTAMP_SETTINGS=' + JSON.stringify(settings))
        } finally {
          await prisma.$disconnect()
        }
      `
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', probe], {
        cwd: apiRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=5s -c timezone=Asia/Tehran',
        },
      })
      assert.equal(result.status, 0, result.stderr)
      const settingsLine = result.stdout
        .split(/\r?\n/)
        .find((line) => line.startsWith('TIMESTAMP_SETTINGS='))
      assert.ok(settingsLine, 'compiled PGOPTIONS probe must report its session settings')
      assert.deepEqual(JSON.parse(settingsLine.slice('TIMESTAMP_SETTINGS='.length)), [{
        statement_timeout: '5s',
        timezone: 'UTC',
        transaction_read_only: 'on',
      }])
    })

    const ledger = await prisma.dailyTaskDeadlineMiss.findUniqueOrThrow({
      where: { id: authoritative.id },
    })
    const taskRecord = await prisma.dailyTask.findUniqueOrThrow({
      where: { id: authoritative.task_id },
      select: {
        completedAt: true,
        createdAt: true,
        deadlineEligibilityStartedAt: true,
        scheduledFor: true,
        studentProfile: { select: { userId: true } },
      },
    })
    const studySession = await prisma.studySession.findUniqueOrThrow({
      where: { id: authoritativeSession.id },
      select: { endedAt: true, startedAt: true },
    })

    await t.test('reads every application TIMESTAMPTZ field as the authoritative PostgreSQL instant', () => {
      assert.equal(epochSeconds(ledger.deadlineAt), authoritative.deadline_epoch)
      assert.equal(epochSeconds(ledger.recordedAt), authoritative.recorded_epoch)
      assert.equal(
        epochSeconds(taskRecord.deadlineEligibilityStartedAt),
        authoritative.eligibility_epoch,
      )
    })

    await t.test('preserves DATE and timestamp-without-time-zone semantics', () => {
      assert.equal(taskRecord.scheduledFor.toISOString(), `${authoritative.scheduled_for}T00:00:00.000Z`)
      assert.equal(epochSeconds(taskRecord.createdAt), authoritative.task_created_epoch)
      assert.equal(
        taskRecord.completedAt === null ? null : epochSeconds(taskRecord.completedAt),
        authoritative.task_completed_epoch,
      )
      assert.equal(epochSeconds(studySession.startedAt), authoritativeSession.started_epoch)
      assert.equal(
        studySession.endedAt === null ? null : epochSeconds(studySession.endedAt),
        authoritativeSession.ended_epoch,
      )
    })

    await t.test('serializes the same instants through an authenticated read-only API request', async () => {
      const [
        { buildApp },
        { createAuthService },
        { signAccessToken },
        { createPrismaAuthStore },
        { env },
        { canonicalCurriculumStore },
        { createPrismaStudentCoreStore },
        { createStudentCoreServices },
      ] = await Promise.all([
        compiled('app.js'),
        compiled('auth/auth-service.js'),
        compiled('auth/access-token.js'),
        compiled('auth/prisma-auth-store.js'),
        compiled('config/env.js'),
        compiled('curriculum/artifact.js'),
        compiled('student-core/prisma-store.js'),
        compiled('student-core/services.js'),
      ])
      const accessToken = {
        audience: env.ACCESS_TOKEN_AUDIENCE,
        issuer: env.ACCESS_TOKEN_ISSUER,
        secret: env.ACCESS_TOKEN_SECRET,
        ttlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
      }
      const auth = createAuthService({
        config: {
          accessToken,
          refreshTokenTtlSeconds: env.REFRESH_TOKEN_TTL_SECONDS,
        },
        store: createPrismaAuthStore(prisma),
      })
      const token = await signAccessToken(
        { role: 'STUDENT', userId: taskRecord.studentProfile.userId },
        accessToken,
      )

      app = buildApp({
        auth,
        curriculum: canonicalCurriculumStore,
        environment: 'test',
        logger: false,
        prisma,
        studentCore: createStudentCoreServices(
          createPrismaStudentCoreStore(prisma),
          undefined,
          canonicalCurriculumStore,
        ),
      })
      const response = await app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: 'GET',
        url: `/api/v1/student/daily-tasks/${authoritative.task_id}`,
      })
      assert.equal(response.statusCode, 200)
      const body = response.json()
      assert.equal(body.success, true)
      const miss = body.data.deadlineMisses.find(
        (item) => item.scheduledFor.slice(0, 10) === authoritative.scheduled_for,
      )
      assert.ok(miss)
      assert.equal(miss.deadlineAt, authoritative.deadline_at.toISOString())
      assert.equal(miss.recordedAt, authoritative.recorded_at.toISOString())
      assert.equal(body.data.scheduledFor, `${authoritative.scheduled_for}T00:00:00.000Z`)
    })

    if (app !== undefined) {
      await app.close()
      app = undefined
    }
    await prisma.$disconnect()
    prisma = undefined

    await t.test('performs no database writes', async () => {
      assert.deepEqual(await readFingerprints(client), beforeFingerprints)
    })

    t.diagnostic(JSON.stringify({
      api: {
        deadlineAt: authoritative.deadline_at.toISOString(),
        recordedAt: authoritative.recorded_at.toISOString(),
        scheduledFor: authoritative.scheduled_for,
      },
      postgres: {
        deadlineAt: authoritative.deadline_at.toISOString(),
        deadlineEpoch: authoritative.deadline_epoch,
        recordedAt: authoritative.recorded_at.toISOString(),
        recordedEpoch: authoritative.recorded_epoch,
      },
    }))
  } finally {
    if (app !== undefined) await app.close()
    if (prisma !== undefined) await prisma.$disconnect()
    await client.end()
  }
})
