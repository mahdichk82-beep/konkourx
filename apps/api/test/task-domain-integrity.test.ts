import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { canonicalCurriculumStore } from '../src/curriculum/artifact.js'
import { ApiError } from '../src/errors/api-error.js'
import { TaskContentType } from '../src/generated/prisma/enums.js'
import { resolveNewTaskTargets, validateTaskContent } from '../src/task-domain/validation.js'

const nodeIn = (track: 'EXPERIMENTAL' | 'MATHEMATICS' | 'HUMANITIES') => {
  for (const entry of canonicalCurriculumStore.listTrackCatalog(track)) {
    for (const root of canonicalCurriculumStore.listCatalogRoots(track, entry.id)) {
      const id = root.itemKind === 'NODE' ? root.nodeId : root.childNodeIds[0]
      if (id) return id
    }
  }
  throw new Error(`No canonical node in ${track}`)
}
const exact = (curriculumRefId: string) => ({
  referenceKind: 'NODE' as const,
  curriculumRefId,
  selectionMode: 'EXACT' as const,
})
const hasCode = (code: string) => (error: unknown) => error instanceof ApiError && error.code === code

test('nullable task content migration adds only the two-value enum and no data classification', async () => {
  assert.deepEqual(Object.values(TaskContentType), ['STUDY', 'GENERAL'])
  const sql = await readFile(new URL('../../../database/prisma/migrations/20261007010000_add_task_content_type/migration.sql', import.meta.url), 'utf8')
  assert.match(sql, /CREATE TYPE "TaskContentType" AS ENUM \('STUDY', 'GENERAL'\)/)
  assert.match(sql, /ALTER TABLE "daily_tasks" ADD COLUMN "contentType" "TaskContentType";/)
  assert.doesNotMatch(sql, /\b(?:NOT NULL|DEFAULT|UPDATE|DELETE|DROP|TRUNCATE|INSERT)\b/i)
})

test('explicit content types enforce canonical target and legacy-link invariants', () => {
  const valid = [exact(nodeIn('EXPERIMENTAL'))]
  assert.doesNotThrow(() => validateTaskContent(undefined, null, null, []))
  assert.doesNotThrow(() => validateTaskContent('STUDY', null, null, valid))
  assert.doesNotThrow(() => validateTaskContent('GENERAL', null, null, []))
  assert.throws(() => validateTaskContent('STUDY', null, null, []), hasCode('TASK_STUDY_TARGET_REQUIRED'))
  assert.throws(() => validateTaskContent('STUDY', 'legacy-subject', null, valid), hasCode('TASK_LEGACY_LINK_FORBIDDEN'))
  assert.throws(() => validateTaskContent('GENERAL', null, null, valid), hasCode('TASK_GENERAL_TARGET_FORBIDDEN'))
  assert.throws(() => validateTaskContent('GENERAL', null, 'legacy-topic', []), hasCode('TASK_LEGACY_LINK_FORBIDDEN'))
})

test('new targets require Student track and selectable membership', () => {
  const valid = exact(nodeIn('EXPERIMENTAL'))
  assert.equal(resolveNewTaskTargets(canonicalCurriculumStore, 'EXPERIMENTAL', [valid]).length, 1)
  const nestedRoot = canonicalCurriculumStore.listTrackCatalog('EXPERIMENTAL')
    .flatMap((entry) => canonicalCurriculumStore.listCatalogRoots('EXPERIMENTAL', entry.id))
    .flatMap((root) => root.itemKind === 'NODE' ? [root.nodeId] : root.childNodeIds)
    .find((id) => canonicalCurriculumStore.getNode(id).childrenCount > 0)
  if (!nestedRoot) throw new Error('Fixture needs a parent canonical node')
  const descendant = canonicalCurriculumStore.getDirectChildren(nestedRoot)[0]
  if (!descendant) throw new Error('Fixture needs a nested canonical node')
  assert.equal(resolveNewTaskTargets(canonicalCurriculumStore, 'EXPERIMENTAL', [exact(descendant.id)]).length, 1)
  assert.throws(() => resolveNewTaskTargets(canonicalCurriculumStore, null, [valid]), hasCode('STUDENT_TRACK_NOT_SET'))
  const wrongTrack = canonicalCurriculumStore.listTrackCatalog('HUMANITIES')
    .flatMap((entry) => canonicalCurriculumStore.listCatalogRoots('HUMANITIES', entry.id))
    .flatMap((root) => root.itemKind === 'NODE' ? [root.nodeId] : root.childNodeIds)
    .find((id) => !canonicalCurriculumStore.isSelectableNodeInTrack('EXPERIMENTAL', id))
  if (!wrongTrack) throw new Error('Fixture needs track-exclusive node')
  assert.throws(() => resolveNewTaskTargets(canonicalCurriculumStore, 'EXPERIMENTAL', [exact(wrongTrack)]), hasCode('CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK'))
  const group = canonicalCurriculumStore.listTrackCatalog('HUMANITIES')
    .flatMap((entry) => canonicalCurriculumStore.listCatalogRoots('HUMANITIES', entry.id))
    .find((root) => root.itemKind === 'GROUP')
  if (!group) throw new Error('Fixture needs navigation group')
  assert.throws(() => resolveNewTaskTargets(canonicalCurriculumStore, 'HUMANITIES', [exact(group.id)]), hasCode('CURRICULUM_TARGET_NOT_SELECTABLE'))
  assert.throws(() => resolveNewTaskTargets(canonicalCurriculumStore, 'EXPERIMENTAL', [exact('unknown')]), hasCode('CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK'))
  assert.throws(() => resolveNewTaskTargets(canonicalCurriculumStore, 'EXPERIMENTAL', [
    { referenceKind: 'PLACEMENT', curriculumRefId: 'historical-placement', selectionMode: 'EXACT' },
  ]), hasCode('CURRICULUM_TARGET_NOT_SELECTABLE'))
  assert.throws(() => resolveNewTaskTargets(canonicalCurriculumStore, 'EXPERIMENTAL', [valid, valid]), hasCode('CURRICULUM_TARGET_OVERLAP'))
})

test('one invalid replacement target rejects the whole set before resolution', () => {
  const valid = exact(nodeIn('EXPERIMENTAL'))
  assert.throws(() => resolveNewTaskTargets(canonicalCurriculumStore, 'EXPERIMENTAL', [valid, exact('unknown')]), hasCode('CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK'))
  assert.equal(resolveNewTaskTargets(canonicalCurriculumStore, 'EXPERIMENTAL', [valid]).length, 1)
})
