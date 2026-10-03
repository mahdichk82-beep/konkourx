import type {
  CurriculumCatalogEntryKind,
  CurriculumCatalogManifest,
  CurriculumCatalogManifestEntry,
  CurriculumMountMode,
  CurriculumProvenance,
  CurriculumTrackId,
} from './types.js'

const approved: CurriculumProvenance = {
  kind: 'PRODUCT_OWNER_APPROVAL',
  reference: '2026-10-03 catalog reframe approval',
}

const sources = (representationKeys: readonly string[]): readonly CurriculumProvenance[] =>
  representationKeys.map((reference) => ({ kind: 'SOURCE_REPRESENTATION', reference }))

const entry = (
  key: string,
  title: string,
  kind: CurriculumCatalogEntryKind,
  visibleInTracks: readonly CurriculumTrackId[],
  representationKeys: readonly string[],
  mountMode: CurriculumMountMode = 'ROOTS_AFTER_SOURCE_HEADING',
  extras: Partial<CurriculumCatalogManifestEntry> = {},
): CurriculumCatalogManifestEntry => ({
  key,
  title,
  kind,
  visibleInTracks,
  representationKeys,
  mountMode,
  resolutionStatus: 'RESOLVED',
  ambiguityCodes: [],
  provenance: [...sources(representationKeys), approved],
  ...extras,
})

const allTracks = ['EXPERIMENTAL', 'MATHEMATICS', 'HUMANITIES'] as const

export const curriculumCatalogManifest: CurriculumCatalogManifest = {
  formatVersion: 'konkourx-curriculum-catalog-manifest/v1',
  tracks: [
    {
      id: 'EXPERIMENTAL',
      title: 'علوم تجربی',
      sourceOrder: 1,
      entryKeys: [
        'persian', 'persian-thematic', 'arabic-general', 'arabic-thematic', 'religion',
        'english', 'english-thematic', 'experimental-mathematics',
        'experimental-mathematics-thematic', 'biology', 'experimental-physics', 'chemistry',
      ],
    },
    {
      id: 'MATHEMATICS',
      title: 'ریاضی و فیزیک',
      sourceOrder: 2,
      entryKeys: [
        'persian', 'persian-thematic', 'arabic-general', 'arabic-thematic', 'religion',
        'english', 'english-thematic', 'mathematics', 'calculus', 'geometry',
        'statistics-and-probability', 'discrete-mathematics', 'mathematics-physics', 'chemistry',
      ],
    },
    {
      id: 'HUMANITIES',
      title: 'علوم انسانی',
      sourceOrder: 3,
      entryKeys: [
        'persian', 'persian-thematic', 'humanities-arabic', 'religion', 'english',
        'english-thematic', 'literary-sciences', 'literary-sciences-thematic', 'sociology',
        'humanities-mathematics-statistics', 'economics', 'logic', 'philosophy', 'psychology',
        'history', 'geography',
      ],
    },
  ],
  entries: [
    entry('persian', 'فارسی', 'BOOK_BASED', allTracks, [
      'persian-10', 'persian-11', 'persian-12',
    ]),
    entry('persian-thematic', 'فارسی موضوعی', 'THEMATIC', allTracks, ['persian-thematic']),
    entry('arabic-general', 'عربی', 'BOOK_BASED', ['EXPERIMENTAL', 'MATHEMATICS'], [
      'arabic-10', 'arabic-11', 'arabic-12',
    ]),
    entry('arabic-thematic', 'عربی موضوعی', 'THEMATIC', ['EXPERIMENTAL', 'MATHEMATICS'], [
      'arabic-thematic',
    ]),
    entry('religion', 'دین و زندگی', 'BOOK_BASED', allTracks, [
      'religion-10', 'religion-11', 'religion-12',
    ]),
    entry('english', 'زبان انگلیسی', 'BOOK_BASED', allTracks, [
      'english-10', 'english-11', 'english-12',
    ]),
    entry('english-thematic', 'زبان انگلیسی موضوعی', 'THEMATIC', allTracks, [
      'english-thematic',
    ]),
    entry('experimental-mathematics', 'ریاضی', 'BOOK_BASED', ['EXPERIMENTAL'], [
      'experimental-math-10', 'experimental-math-11', 'experimental-math-12',
    ]),
    entry(
      'experimental-mathematics-thematic',
      'ریاضی موضوعی',
      'THEMATIC',
      ['EXPERIMENTAL'],
      ['experimental-math-thematic'],
    ),
    entry(
      'biology',
      'زیست',
      'BOOK_BASED',
      ['EXPERIMENTAL'],
      ['biology-sequence-1', 'biology-sequence-2', 'biology-sequence-3'],
      'ALL_ROOTS',
      { ambiguityCodes: ['BIOLOGY_SEQUENCE_GRADE_ASSIGNMENT_UNRESOLVED'] },
    ),
    entry('experimental-physics', 'فیزیک تجربی', 'BOOK_BASED', ['EXPERIMENTAL'], [
      'experimental-physics-10', 'experimental-physics-11', 'experimental-physics-12',
    ]),
    entry(
      'chemistry',
      'شیمی',
      'BOOK_BASED',
      ['EXPERIMENTAL', 'MATHEMATICS'],
      ['chemistry-10-primary', 'chemistry-11-primary', 'chemistry-12-primary'],
      'ROOTS_AFTER_SOURCE_HEADING',
      {
        provenance: [
          ...sources(['chemistry-10-primary', 'chemistry-11-primary', 'chemistry-12-primary']),
          {
            kind: 'SOURCE_STATEMENT',
            reference: 'chemistry-secondary-heading: shared between Experimental and Mathematics',
          },
          approved,
        ],
        equivalence: {
          evidenceRepresentationKey: 'chemistry-secondary-heading',
          evidenceRawLabel: 'شیمی دو رشته تجربی وریاضی مشترک است',
          pairs: [
            { canonicalRepresentationKey: 'chemistry-10-primary', comparisonRepresentationKey: 'chemistry-10-secondary' },
            { canonicalRepresentationKey: 'chemistry-11-primary', comparisonRepresentationKey: 'chemistry-11-secondary' },
            { canonicalRepresentationKey: 'chemistry-12-primary', comparisonRepresentationKey: 'chemistry-12-secondary' },
          ],
          mismatchPolicy: 'QUARANTINE',
          mismatchCode: 'CHEMISTRY_EQUIVALENCE_MISMATCH',
        },
      },
    ),
    entry('mathematics', 'ریاضی', 'BOOK_BASED', ['MATHEMATICS'], ['mathematics-10']),
    entry('calculus', 'حسابان', 'BOOK_BASED', ['MATHEMATICS'], ['calculus-1', 'calculus-2']),
    entry('geometry', 'هندسه', 'BOOK_BASED', ['MATHEMATICS'], [
      'geometry-10', 'geometry-11', 'geometry-12',
    ]),
    entry('statistics-and-probability', 'آمار و احتمال', 'BOOK_BASED', ['MATHEMATICS'], [
      'statistics-and-probability',
    ]),
    entry('discrete-mathematics', 'ریاضیات گسسته', 'BOOK_BASED', ['MATHEMATICS'], [
      'discrete-mathematics',
    ]),
    entry('mathematics-physics', 'فیزیک ریاضی', 'BOOK_BASED', ['MATHEMATICS'], [
      'mathematics-physics-10', 'mathematics-physics-11', 'mathematics-physics-12',
    ]),
    entry(
      'humanities-arabic',
      'عربی انسانی',
      'BOOK_BASED',
      ['HUMANITIES'],
      ['arabic-10', 'arabic-11', 'arabic-12'],
      'GROUP_ROOTS_AFTER_SOURCE_HEADING',
      {
        groups: [
          { key: 'grade-10', label: 'دهم', representationKey: 'arabic-10', provenance: [approved] },
          { key: 'grade-11', label: 'یازدهم', representationKey: 'arabic-11', provenance: [approved] },
          { key: 'grade-12', label: 'دوازدهم', representationKey: 'arabic-12', provenance: [approved] },
        ],
      },
    ),
    entry('literary-sciences', 'علوم و فنون ادبی', 'BOOK_BASED', ['HUMANITIES'], [
      'literary-sciences-10', 'literary-sciences-11', 'literary-sciences-12',
    ]),
    entry('literary-sciences-thematic', 'علوم و فنون ادبی موضوعی', 'THEMATIC', ['HUMANITIES'], [
      'literary-sciences-thematic',
    ]),
    entry('sociology', 'جامعه‌شناسی', 'BOOK_BASED', ['HUMANITIES'], [
      'sociology-10', 'sociology-11', 'sociology-12',
    ]),
    entry('humanities-mathematics-statistics', 'ریاضی و آمار', 'BOOK_BASED', ['HUMANITIES'], [
      'humanities-math-statistics-10', 'humanities-math-statistics-11',
      'humanities-math-statistics-12',
    ]),
    entry('economics', 'اقتصاد', 'BOOK_BASED', ['HUMANITIES'], ['economics']),
    entry('logic', 'منطق', 'BOOK_BASED', ['HUMANITIES'], ['logic']),
    entry('philosophy', 'فلسفه', 'BOOK_BASED', ['HUMANITIES'], [
      'philosophy-11', 'philosophy-12',
    ]),
    entry('psychology', 'روان‌شناسی', 'BOOK_BASED', ['HUMANITIES'], ['psychology']),
    entry('history', 'تاریخ', 'BOOK_BASED', ['HUMANITIES'], [
      'history-10', 'history-11', 'history-12',
    ]),
    entry('geography', 'جغرافیا', 'BOOK_BASED', ['HUMANITIES'], [
      'geography-10', 'geography-11', 'geography-12',
    ]),
  ],
  unresolvedInventory: [
    {
      key: 'placement-only-subjects',
      title: 'High-level placements without detailed source trees',
      representationKeys: [],
      resolutionStatus: 'UNRESOLVED',
      ambiguityCodes: ['NO_DETAILED_SOURCE_TREE'],
      provenance: [approved],
    },
    {
      key: 'standalone-source-markers',
      title: 'Standalone track marker representations',
      representationKeys: ['mathematics-track-marker', 'humanities-track-marker'],
      resolutionStatus: 'UNRESOLVED',
      ambiguityCodes: ['NON_EDUCATIONAL_SOURCE_MARKER'],
      provenance: sources(['mathematics-track-marker', 'humanities-track-marker']),
    },
    {
      key: 'chemistry-supplemental-source-material',
      title: 'Chemistry supplemental source material',
      representationKeys: ['chemistry-skills'],
      resolutionStatus: 'AMBIGUOUS',
      ambiguityCodes: ['CHEMISTRY_SUPPLEMENTAL_MOUNT_UNRESOLVED'],
      provenance: sources(['chemistry-skills']),
    },
  ],
}
