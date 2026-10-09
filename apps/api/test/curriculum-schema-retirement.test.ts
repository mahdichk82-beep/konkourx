import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

const repoUrl = new URL('../../../', import.meta.url)
const schemaUrl = new URL('database/prisma/schema.prisma', repoUrl)
const migrationsUrl = new URL('database/prisma/migrations/', repoUrl)
const generatedClientUrl = new URL('apps/api/src/generated/prisma/', repoUrl)
const curriculumRuntimeUrl = new URL('apps/api/src/curriculum/', repoUrl)
const routesUrl = new URL('apps/api/src/routes/', repoUrl)

const retiredModelNames = [
  'CurriculumVersion',
  'CurriculumNodeType',
  'CurriculumNode',
  'CurriculumNodeRevision',
  'CurriculumNodeRelationship',
  'CurriculumImport',
  'CurriculumSourceRecord',
  'CurriculumImportIssue',
  'CurriculumValidationRun',
  'CurriculumReviewDecision',
  'CurriculumAuditLog',
  'CurriculumNodeMapping',
  'LegacyCurriculumMapping',
  'CurriculumCapabilityGrant',
] as const

const historicalMigrations = [
  '20260918010000_add_curriculum_governance_core',
  '20260918010100_add_curriculum_import_mapping',
  '20260918010200_refine_curriculum_mapping_supersession',
  '20260918010300_enforce_curriculum_decision_immutability',
] as const

const readTypeScriptTree = async (directory: URL): Promise<string> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const contents = await Promise.all(entries.map(async (entry) => {
    const entryUrl = new URL(entry.name, directory)
    if (entry.isDirectory()) return readTypeScriptTree(new URL(`${entry.name}/`, directory))
    return entry.name.endsWith('.ts') ? readFile(entryUrl, 'utf8') : ''
  }))
  return contents.join('\n')
}

test('Prisma schema excludes every retired Curriculum governance model and back-relation', async () => {
  const schema = await readFile(schemaUrl, 'utf8')

  for (const modelName of retiredModelNames) {
    assert.doesNotMatch(schema, new RegExp(`\\bmodel\\s+${modelName}\\b`), modelName)
  }
  assert.doesNotMatch(
    schema,
    /\benum\s+(?:Curriculum(?:Version|Node|Import|Source|Issue|Mapping|Validation|Review|Capability|Audit)|LegacyCurriculum)/,
  )
  assert.doesNotMatch(schema, /legacyCurriculumMappings|curriculumCapabilities|curriculumVersions/)
})

test('one forward retirement migration follows the four immutable historical migrations', async () => {
  const entries = await readdir(migrationsUrl, { withFileTypes: true })
  const migrationNames = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

  assert.equal(migrationNames.length, 26)
  for (const historicalMigration of historicalMigrations) {
    assert.ok(migrationNames.includes(historicalMigration), historicalMigration)
  }

  const retirementName = '20260930010000_retire_curriculum_governance_schema'
  assert.ok(migrationNames.includes(retirementName))
  assert.ok(migrationNames.includes('20260930020000_add_planning_curriculum_references'))
  assert.ok(migrationNames.includes('20261001010000_add_daily_task_schedule_window'))
  assert.ok(migrationNames.includes('20261003030000_add_student_profile_track'))
  assert.ok(migrationNames.includes('20261005010000_add_person_profile'))
  assert.ok(migrationNames.includes('20261007195354_add_subtree_curriculum_selection'))
  assert.ok(migrationNames.includes('20261009090000_add_study_timer_lifecycle'))
  const sql = await readFile(new URL(`${retirementName}/migration.sql`, migrationsUrl), 'utf8')
  assert.equal((sql.match(/^DROP TABLE /gm) ?? []).length, 14)
  assert.equal((sql.match(/^DROP TYPE /gm) ?? []).length, 17)
  assert.equal((sql.match(/^DROP FUNCTION /gm) ?? []).length, 10)
  assert.doesNotMatch(
    sql,
    /(?:ALTER|DROP|TRUNCATE) TABLE "(?:users|auth_sessions|student_profiles|counselor_profiles|student_counselor_relationships|study_subjects|study_topics|study_plans|daily_tasks|study_sessions|assessment_attempts|student_goals)"/,
  )
})

test('generated Prisma Client excludes retired persistence models', async () => {
  const generatedClient = await readTypeScriptTree(generatedClientUrl)

  for (const modelName of retiredModelNames) {
    assert.doesNotMatch(generatedClient, new RegExp(`\\b${modelName}\\b`), modelName)
  }
})

test('Canonical Curriculum runtime remains Prisma-independent with no governance route', async () => {
  const [runtime, routes] = await Promise.all([
    readTypeScriptTree(curriculumRuntimeUrl),
    readTypeScriptTree(routesUrl),
  ])

  assert.doesNotMatch(runtime, /generated\/prisma|lib\/prisma|PrismaClient/)
  assert.doesNotMatch(routes, /admin\/curriculum|curriculum\/(?:imports|versions|reviews|capabilities|publish)/)
})
