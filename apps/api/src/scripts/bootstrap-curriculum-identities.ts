import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import legacyArtifactJson from '../curriculum/generated/canonical-curriculum.v1.json' with { type: 'json' }
import { bootstrapCurriculumIdentityRegistry } from '../curriculum/compiler.js'
import type { CurriculumArtifact } from '../curriculum/types.js'

const canonicalSourceUrl = new URL(
  '../../../../docs/curriculum/CANONICAL_CURRICULUM.md',
  import.meta.url,
)
const registryUrl = new URL(
  '../curriculum/generated/canonical-curriculum-identities.v1.json',
  import.meta.url,
)

const source = await readFile(canonicalSourceUrl, 'utf8')
const registry = bootstrapCurriculumIdentityRegistry(
  source,
  legacyArtifactJson as unknown as CurriculumArtifact,
)
await writeFile(registryUrl, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')

process.stdout.write(
  `Wrote ${fileURLToPath(registryUrl)} (${registry.records.length} active identities)\n`,
)
