import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { derivePersonDisplayName } from '../src/domain/person-profile.js'
import { personProfileSchema } from '../src/schemas/domain.js'

const migrationPath = new URL(
  '../../../database/prisma/migrations/20261005010000_add_person_profile/migration.sql',
  import.meta.url,
)
const schemaPath = new URL('../../../database/prisma/schema.prisma', import.meta.url)

test('person profile schema is optional one-to-one private identity data', async () => {
  const schema = await readFile(schemaPath, 'utf8')

  assert.match(schema, /model User\s*{[\s\S]*?personProfile\s+PersonProfile\?/)
  assert.match(schema, /model PersonProfile\s*{[\s\S]*?userId\s+String\s+@unique\s+@db\.Uuid/)
  for (const field of ['firstName', 'lastName', 'preferredName', 'province', 'city']) {
    assert.match(schema, new RegExp(`\\b${field}\\s+String\\?`))
  }
  for (const forbidden of ['streetAddress', 'address', 'publicDisplayName', 'publicSlug', 'avatarUrl', 'subscription']) {
    assert.doesNotMatch(schema.match(/model PersonProfile\s*{[\s\S]*?\n}/)?.[0] ?? '', new RegExp(`\\b${forbidden}\\b`, 'i'))
  }
})

test('person profile migration creates only additive structure and performs no backfill', async () => {
  const migration = await readFile(migrationPath, 'utf8')

  assert.match(migration, /CREATE TABLE "person_profiles"/)
  assert.match(migration, /CREATE UNIQUE INDEX "person_profiles_userId_key"/)
  assert.doesNotMatch(migration, /^\s*(?:INSERT\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM)\b/im)
  for (const existingTable of [
    'users',
    'student_profiles',
    'counselor_profiles',
    'daily_tasks',
    'study_sessions',
    'assessment_attempts',
  ]) {
    assert.doesNotMatch(migration, new RegExp(`ALTER TABLE "${existingTable}"`, 'i'))
  }
})

test('person profile input trims Persian, Arabic, Latin, spaces, and hyphens without cultural restrictions', () => {
  const result = personProfileSchema.parse({
    firstName: '  علی رضا  ',
    lastName: '  Al-Sayed  ',
    preferredName: '  علي  ',
    province: '  تهران  ',
    city: '  تهران-مرکز  ',
  })

  assert.deepEqual(result, {
    firstName: 'علی رضا',
    lastName: 'Al-Sayed',
    preferredName: 'علي',
    province: 'تهران',
    city: 'تهران-مرکز',
  })
})

test('person profile input converts whitespace-only values to explicit null', () => {
  assert.deepEqual(
    personProfileSchema.parse({ firstName: '   ', city: '\t\n' }),
    { firstName: null, city: null },
  )
})

test('person profile input preserves omitted fields and explicit nulls', () => {
  assert.deepEqual(personProfileSchema.parse({ lastName: null }), { lastName: null })
})

test('person profile input rejects ownership and unrelated private/public fields', () => {
  for (const payload of [
    { firstName: 'A', userId: '10000000-0000-4000-8000-000000000001' },
    { firstName: 'A', bio: 'private biography' },
    { firstName: 'A', publicSlug: 'a' },
    { firstName: 'A', avatarUrl: 'https://example.com/a.png' },
  ]) {
    assert.equal(personProfileSchema.safeParse(payload).success, false)
  }
})

test('person profile input enforces reasonable maximum lengths', () => {
  assert.equal(personProfileSchema.safeParse({ firstName: 'a'.repeat(100) }).success, true)
  assert.equal(personProfileSchema.safeParse({ firstName: 'a'.repeat(101) }).success, false)
  assert.equal(personProfileSchema.safeParse({ province: 'a'.repeat(101) }).success, false)
})

test('display name prefers non-empty preferredName', () => {
  assert.equal(derivePersonDisplayName({
    firstName: 'Ali',
    lastName: 'Ahmadi',
    preferredName: '  Arman  ',
  }), 'Arman')
})

test('display name combines first and last names when preferredName is empty', () => {
  assert.equal(derivePersonDisplayName({
    firstName: '  Ali ',
    lastName: ' Ahmadi  ',
    preferredName: '   ',
  }), 'Ali Ahmadi')
})

test('display name falls back to either single usable name', () => {
  assert.equal(derivePersonDisplayName({ firstName: 'Ali', lastName: null, preferredName: null }), 'Ali')
  assert.equal(derivePersonDisplayName({ firstName: null, lastName: 'Ahmadi', preferredName: null }), 'Ahmadi')
})

test('display name returns null without usable names and never derives a UUID fallback', () => {
  const rawUserId = '10000000-0000-4000-8000-000000000001'
  assert.equal(derivePersonDisplayName(null), null)
  assert.equal(derivePersonDisplayName({ firstName: ' ', lastName: null, preferredName: null }), null)
  const displayName = derivePersonDisplayName({
    firstName: null,
    lastName: null,
    preferredName: null,
  })
  assert.equal(displayName, null)
  assert.notEqual(displayName, rawUserId)
})
