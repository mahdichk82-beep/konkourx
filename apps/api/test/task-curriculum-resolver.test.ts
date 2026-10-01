import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalCurriculumArtifact, canonicalCurriculumStore } from '../src/curriculum/artifact.js'
import { ApiError } from '../src/errors/api-error.js'
import { resolveCurriculumTargets } from '../src/task-curriculum/resolver.js'

const parent = canonicalCurriculumArtifact.nodes.find((node) => node.childrenCount >= 2)
if (!parent) throw new Error('Canonical Curriculum test fixture requires a parent with two children')
const children = canonicalCurriculumStore.getDirectChildren(parent.id)
const leaf = canonicalCurriculumArtifact.nodes.find((node) => node.childrenCount === 0)
if (!leaf) throw new Error('Canonical Curriculum test fixture requires a leaf')
const placement = canonicalCurriculumArtifact.subjectPlacements[0]
if (!placement) throw new Error('Canonical Curriculum test fixture requires a placement')

test('task Curriculum resolver supports multiple targets and exact source snapshots', () => {
  const targets = resolveCurriculumTargets(canonicalCurriculumStore, [
    { referenceKind: 'NODE', curriculumRefId: leaf.id, selectionMode: 'EXACT' },
    { referenceKind: 'PLACEMENT', curriculumRefId: placement.id, selectionMode: 'EXACT' },
  ])

  assert.equal(targets.length, 2)
  assert.equal(targets[0]?.items.length, 1)
  assert.equal(targets[0]?.items[0]?.labelSnapshot, leaf.rawLabel)
  assert.equal(targets[0]?.representationIdSnapshot, leaf.representationId)
  assert.equal(targets[1]?.items[0]?.labelSnapshot, placement.rawLabel)
  assert.equal(targets[1]?.representationIdSnapshot, null)
  assert.deepEqual(targets.flatMap((target) => target.items.map((item) => item.position)), [0, 1])
})

test('WHOLE expands only direct children and falls back to the selected leaf', () => {
  const whole = resolveCurriculumTargets(canonicalCurriculumStore, [
    { referenceKind: 'NODE', curriculumRefId: parent.id, selectionMode: 'WHOLE' },
  ])[0]
  assert.deepEqual(
    whole?.items.map((item) => item.curriculumRefId),
    children.map((child) => child.id),
  )
  assert.equal(whole?.items.length, parent.childrenCount)

  const leafWhole = resolveCurriculumTargets(canonicalCurriculumStore, [
    { referenceKind: 'NODE', curriculumRefId: leaf.id, selectionMode: 'WHOLE' },
  ])[0]
  assert.deepEqual(leafWhole?.items.map((item) => item.curriculumRefId), [leaf.id])
})

test('placement WHOLE, invalid references, duplicates, and overlapping expansion are rejected', () => {
  assert.throws(
    () => resolveCurriculumTargets(canonicalCurriculumStore, [
      { referenceKind: 'PLACEMENT', curriculumRefId: placement.id, selectionMode: 'WHOLE' },
    ]),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_PLACEMENT_WHOLE_UNSUPPORTED',
  )
  assert.throws(
    () => resolveCurriculumTargets(canonicalCurriculumStore, [
      { referenceKind: 'NODE', curriculumRefId: 'unknown', selectionMode: 'EXACT' },
    ]),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_NODE_NOT_FOUND',
  )
  assert.throws(
    () => resolveCurriculumTargets(canonicalCurriculumStore, [
      { referenceKind: 'NODE', curriculumRefId: leaf.id, selectionMode: 'EXACT' },
      { referenceKind: 'NODE', curriculumRefId: leaf.id, selectionMode: 'EXACT' },
    ]),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_TARGET_OVERLAP',
  )
  assert.throws(
    () => resolveCurriculumTargets(canonicalCurriculumStore, [
      { referenceKind: 'NODE', curriculumRefId: parent.id, selectionMode: 'WHOLE' },
      { referenceKind: 'NODE', curriculumRefId: children[0]!.id, selectionMode: 'EXACT' },
    ]),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_TARGET_OVERLAP',
  )
})

