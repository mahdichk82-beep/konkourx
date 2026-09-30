import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  compileCanonicalCurriculum,
  serializeCurriculumArtifact,
} from '../curriculum/compiler.js'

const canonicalSourceUrl = new URL(
  '../../../../docs/curriculum/CANONICAL_CURRICULUM.md',
  import.meta.url,
)
const artifactUrl = new URL(
  '../curriculum/generated/canonical-curriculum.v1.json',
  import.meta.url,
)

const source = await readFile(canonicalSourceUrl, 'utf8')
const artifact = compileCanonicalCurriculum(source)
await writeFile(artifactUrl, serializeCurriculumArtifact(artifact), 'utf8')

process.stdout.write(
  `Wrote ${fileURLToPath(artifactUrl)} (${artifact.counts.subjectPlacementCount} placements, ${artifact.counts.representationCount} representations, ${artifact.counts.detailedNodeCount} nodes)\n`,
)
