import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import registryJson from '../curriculum/generated/canonical-curriculum-identities.v1.json' with { type: 'json' }
import {
  compileCurriculumCatalog,
  serializeCurriculumCatalogArtifact,
} from '../curriculum/catalog-compiler.js'
import { curriculumCatalogManifest } from '../curriculum/catalog-manifest.js'
import {
  compileCanonicalCurriculum,
  serializeCurriculumArtifact,
} from '../curriculum/compiler.js'
import type { CurriculumIdentityRegistry } from '../curriculum/types.js'

const canonicalSourceUrl = new URL(
  '../../../../docs/curriculum/CANONICAL_CURRICULUM.md',
  import.meta.url,
)
const artifactUrl = new URL(
  '../curriculum/generated/canonical-curriculum.v1.json',
  import.meta.url,
)
const catalogUrl = new URL(
  '../curriculum/generated/canonical-curriculum-catalog.v1.json',
  import.meta.url,
)
const registryUrl = new URL(
  '../curriculum/generated/canonical-curriculum-identities.v1.json',
  import.meta.url,
)

const source = await readFile(canonicalSourceUrl, 'utf8')
const base = compileCanonicalCurriculum(
  source,
  registryJson as unknown as CurriculumIdentityRegistry,
)
const catalog = compileCurriculumCatalog(
  base,
  curriculumCatalogManifest,
  base.identityRegistry,
)
await Promise.all([
  writeFile(artifactUrl, serializeCurriculumArtifact(base.artifact), 'utf8'),
  writeFile(catalogUrl, serializeCurriculumCatalogArtifact(catalog.artifact), 'utf8'),
  writeFile(registryUrl, `${JSON.stringify(catalog.identityRegistry, null, 2)}\n`, 'utf8'),
])

process.stdout.write(
  `Wrote ${fileURLToPath(artifactUrl)}, ${fileURLToPath(catalogUrl)}, and ${fileURLToPath(registryUrl)} (${base.artifact.counts.detailedNodeCount} nodes, ${catalog.artifact.counts.resolvedEntryCount} catalog entries)\n`,
)
