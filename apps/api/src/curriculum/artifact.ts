import artifactJson from './generated/canonical-curriculum.v1.json' with { type: 'json' }
import { createCurriculumReadStore } from './store.js'
import type { CurriculumArtifact } from './types.js'

export const canonicalCurriculumArtifact = artifactJson as unknown as CurriculumArtifact
export const canonicalCurriculumStore = createCurriculumReadStore(
  canonicalCurriculumArtifact,
)
