import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import { createPrismaAuthStore } from '../src/auth/prisma-auth-store.js'

const repoUrl = new URL('../../../', import.meta.url)
const schemaUrl = new URL('database/prisma/schema.prisma', repoUrl)
const migrationUrl = new URL(
  'database/prisma/migrations/20261003030000_add_student_profile_track/migration.sql',
  repoUrl,
)

test('StudentProfile track is a nullable canonical enum with an additive-only migration', async () => {
  const [schema, migration] = await Promise.all([
    readFile(schemaUrl, 'utf8'),
    readFile(migrationUrl, 'utf8'),
  ])

  assert.match(
    schema,
    /enum StudentTrack\s*{\s*EXPERIMENTAL\s+MATHEMATICS\s+HUMANITIES\s*}/,
  )
  assert.match(schema, /model StudentProfile\s*{[\s\S]*?\btrack\s+StudentTrack\?/)

  assert.match(
    migration,
    /CREATE TYPE "StudentTrack" AS ENUM \('EXPERIMENTAL', 'MATHEMATICS', 'HUMANITIES'\)/,
  )
  assert.match(
    migration,
    /ALTER TABLE "student_profiles" ADD COLUMN "track" "StudentTrack"/,
  )
  assert.doesNotMatch(migration, /\bNOT NULL\b|\bDEFAULT\b|\bUPDATE\b|\bINSERT\b|\bDELETE\b|\bDROP\b/i)
})

test('Prisma registration creates a nullable-track StudentProfile atomically', async () => {
  const writes: unknown[] = []
  const timestamp = new Date('2026-10-03T00:00:00.000Z')
  const prisma = {
    user: {
      async create(input: unknown) {
        writes.push(input)
        return {
          id: '10000000-0000-4000-8000-000000000001',
          email: 'student@example.com',
          phone: null,
          passwordHash: 'password-hash',
          role: 'STUDENT',
          status: 'ACTIVE',
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      },
    },
  } as unknown as PrismaClient
  const store = createPrismaAuthStore(prisma)

  await store.createStudentUser({
    email: 'student@example.com',
    passwordHash: 'password-hash',
    phone: null,
    track: 'HUMANITIES',
  })
  await store.createStudentUser({
    email: 'without-track@example.com',
    passwordHash: 'password-hash',
    phone: null,
  })

  assert.deepEqual(writes, [
    {
      data: {
        email: 'student@example.com',
        passwordHash: 'password-hash',
        phone: null,
        role: 'STUDENT',
        studentProfile: { create: { track: 'HUMANITIES' } },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        passwordHash: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    },
    {
      data: {
        email: 'without-track@example.com',
        passwordHash: 'password-hash',
        phone: null,
        role: 'STUDENT',
        studentProfile: { create: { track: null } },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        passwordHash: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    },
  ])
})
