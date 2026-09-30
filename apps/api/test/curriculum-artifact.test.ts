import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { canonicalCurriculumArtifact } from '../src/curriculum/artifact.js'
import {
  compileCanonicalCurriculum,
  serializeCurriculumArtifact,
} from '../src/curriculum/compiler.js'

const canonicalPath = new URL('../../../docs/curriculum/CANONICAL_CURRICULUM.md', import.meta.url)
const artifactPath = new URL(
  '../src/curriculum/generated/canonical-curriculum.v1.json',
  import.meta.url,
)

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex')

const detailedLabels = (markdown: string): string[] => {
  const match = markdown.replaceAll('\r\n', '\n').match(
    /<!-- SOURCE_TREE_START -->\n([\s\S]*?)\n<!-- SOURCE_TREE_END -->/,
  )
  assert.ok(match?.[1])
  return match[1].split('\n').flatMap((sourceText) => {
    if (sourceText.replaceAll('│', '').trim() === '') return []
    let remainder = sourceText
    while (remainder.startsWith('│   ') || remainder.startsWith('    ')) {
      remainder = remainder.slice(4)
    }
    if (remainder.startsWith('├── ') || remainder.startsWith('└── ')) {
      remainder = remainder.slice(4)
    }
    return [remainder]
  })
}

test('canonical artifact generation is byte-for-byte deterministic', async () => {
  const [source, checkedInArtifact] = await Promise.all([
    readFile(canonicalPath, 'utf8'),
    readFile(artifactPath, 'utf8'),
  ])
  const first = serializeCurriculumArtifact(compileCanonicalCurriculum(source))
  const second = serializeCurriculumArtifact(compileCanonicalCurriculum(source))

  assert.equal(first, second)
  assert.equal(first, checkedInArtifact)
  assert.equal(
    sha256(checkedInArtifact),
    '60f3d3f454bf39f5dcd0a3c098d5dc2ed8dc6de741579eab52efcf34f4ba9374',
  )
  assert.equal(
    canonicalCurriculumArtifact.payloadSha256,
    '681bf26a3f328d54b26885a8b3e0a099fc1f55ab0d708d92b371fc61b1e22ea6',
  )
})

test('artifact preserves locked counts, source identity, labels, and source order', async () => {
  const source = await readFile(canonicalPath, 'utf8')
  const labels = detailedLabels(source)

  assert.deepEqual(canonicalCurriculumArtifact.counts, {
    scopeCount: 4,
    gradePlacementCount: 12,
    subjectPlacementCount: 74,
    representationCount: 67,
    detailedEntryCount: 6_588,
    detailedNodeCount: 5_484,
  })
  assert.equal(
    canonicalCurriculumArtifact.source.authoritativeDocxSha256,
    '120f2b80c3ccf825dcb24406dcc328d32bbdfba9fb4f747edf258d047678b948',
  )
  assert.equal(
    canonicalCurriculumArtifact.source.canonicalMarkdownSha256,
    '1576b4f886e13b2829f8e373b6d11ca126837766504a187114e2584c24ea933d',
  )
  assert.deepEqual(
    canonicalCurriculumArtifact.nodes.map((node) => node.rawLabel),
    labels,
  )
  assert.deepEqual(
    canonicalCurriculumArtifact.nodes.map((node) => node.sourceOrder),
    labels.map((_, index) => index + 1),
  )
})

test('artifact node IDs and parent references form valid acyclic representation trees', () => {
  const nodesById = new Map(canonicalCurriculumArtifact.nodes.map((node) => [node.id, node]))
  assert.equal(nodesById.size, canonicalCurriculumArtifact.nodes.length)

  for (const node of canonicalCurriculumArtifact.nodes) {
    if (!node.parentId) continue
    const parent = nodesById.get(node.parentId)
    assert.ok(parent, `missing parent for ${node.sourceLocator}`)
    assert.equal(parent.representationId, node.representationId)

    const seen = new Set([node.id])
    let ancestor = parent
    while (ancestor) {
      assert.equal(seen.has(ancestor.id), false, `cycle at ${node.sourceLocator}`)
      seen.add(ancestor.id)
      ancestor = ancestor.parentId ? nodesById.get(ancestor.parentId) : undefined
    }
  }
})
test('ambiguous and thematic source structures remain independent and uninterpreted', () => {
  const headings = canonicalCurriculumArtifact.representations.map(
    (representation) => representation.sourceHeading,
  )
  for (const thematicHeading of [
    'کوریکولوم موضوعی عربی متوسطه دوم',
    'کوریکولوم موضوعی فارسی متوسطه دوم',
    'زبان انگلیسی کنکور (موضوعی)',
    'ریاضی تجربی ـ کوریکولوم موضوعی',
    'علوم فنون موضوعی',
  ]) {
    assert.equal(headings.filter((heading) => heading === thematicHeading).length, 1)
  }

  assert.deepEqual(headings.slice(15, 18), [
    'فصل ۱ ـ دنیای زنده',
    'فصل ۱ ـ تنظیم عصبی',
    'فصل ۱ ـ مولکول‌های اطلاعاتی',
  ])
  assert.equal(new Set(canonicalCurriculumArtifact.representations.slice(15, 18).map(
    (representation) => representation.id,
  )).size, 3)

  assert.ok(canonicalCurriculumArtifact.nodes.some(
    (node) => node.rawLabel.includes('عربی در ادبیات فارسی│   ├── فهم و ترجمه متن'),
  ))

  const markedNodes = canonicalCurriculumArtifact.nodes.filter(
    (node) => node.sourceMarker === '⭐',
  )
  assert.ok(markedNodes.length > 0)
  for (const node of markedNodes) {
    assert.ok(node.rawLabel.includes('⭐'))
    assert.equal('difficulty' in node, false)
    assert.equal('priority' in node, false)
    assert.equal('required' in node, false)
  }
})
