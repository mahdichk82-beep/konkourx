import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const canonicalPath = new URL('../../../docs/curriculum/CANONICAL_CURRICULUM.md', import.meta.url)
const sourceLockPath = new URL('../../../docs/CURRICULUM_SOURCE_OF_TRUTH.md', import.meta.url)

const sha256 = (value: string): string =>
  createHash('sha256').update(value.replaceAll('\r\n', '\n')).digest('hex')

const requiredMatch = (value: string, pattern: RegExp, label: string): RegExpMatchArray => {
  const match = value.match(pattern)
  assert.ok(match, `${label} must remain present`)
  return match
}

test('protected curriculum transcription retains its audited source identity and ordering', async () => {
  const [canonical, sourceLock] = await Promise.all([
    readFile(canonicalPath, 'utf8'),
    readFile(sourceLockPath, 'utf8'),
  ])

  assert.match(
    sourceLock,
    /\*\*Audited SHA-256:\*\* `120f2b80c3ccf825dcb24406dcc328d32bbdfba9fb4f747edf258d047678b948`/,
  )

  const highLevel = requiredMatch(
    canonical,
    /## Official high-level curriculum tree[\s\S]*?```text\r?\nCurriculum\r?\n([\s\S]*?)\r?\n```/,
    'official high-level curriculum tree',
  )[1]!
  const highLevelLines = highLevel.split(/\r?\n/)
  const scopeCount = highLevelLines.filter((line) => /^(?:├──|└──) /u.test(line)).length
  const gradeCount = highLevelLines.filter((line) =>
    /^(?:│   |    )(?:├──|└──) (?:دهم:|یازدهم:|دوازدهم:)$/u.test(line),
  ).length

  assert.equal(highLevelLines.length, 90)
  assert.equal(scopeCount, 4)
  assert.equal(gradeCount, 12)
  assert.equal(highLevelLines.length - scopeCount - gradeCount, 74)
  assert.equal(
    sha256(highLevel),
    '901b1c9bfdb19baa79835bd21cd2dcc6cb445a852bd09c564e333a1a804c76c9',
  )

  const detailed = requiredMatch(
    canonical,
    /<!-- SOURCE_TREE_START -->\r?\n([\s\S]*?)\r?\n<!-- SOURCE_TREE_END -->/,
    'detailed source transcription',
  )[1]!

  assert.equal(detailed.split(/\r?\n/).length, 6_588)
  assert.equal(
    sha256(detailed),
    '88864361dc09d6ba47b73b417769c8e01ae6c50db3b13a3396129066a6af3584',
  )
})
