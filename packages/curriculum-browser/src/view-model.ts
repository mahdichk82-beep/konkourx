import type {
  CurriculumCatalogBreadcrumbSegment,
  CurriculumCatalogEntry,
  CurriculumSelectionMode,
} from './types.ts';

export type CurriculumAudience = 'student' | 'counselor';
export type CurriculumErrorKind =
  | 'NO_TRACK'
  | 'INACCESSIBLE_STUDENT'
  | 'NOT_FOUND'
  | 'RECOVERABLE';

export type CurriculumErrorPresentation = {
  kind: CurriculumErrorKind;
  title: string;
  description: string;
};

export function presentCatalog(entries: readonly CurriculumCatalogEntry[]) {
  return entries.map((entry) => ({
    ...entry,
    badge: entry.kind === 'THEMATIC' ? 'نمای موضوعی' : null,
  }));
}

export function presentBreadcrumb(segments: readonly CurriculumCatalogBreadcrumbSegment[]): string {
  return segments
    .filter(({ kind }) => kind !== 'TRACK')
    .map(({ label }) => label)
    .join(' / ');
}

export function ambiguityNotice(entry: CurriculumCatalogEntry): string | null {
  if (entry.ambiguityCodes.includes('BIOLOGY_SEQUENCE_GRADE_ASSIGNMENT_UNRESOLVED')) {
    return 'ساختار اصلی زیست‌شناسی در دسترس است؛ جایگاه پایه‌ای برخی توالی‌ها هنوز نهایی نشده است.';
  }
  return null;
}

export function modeDescription(mode: CurriculumSelectionMode): string {
  return mode === 'EXACT'
    ? 'فقط همین مبحث انتخاب می‌شود.'
    : 'این مبحث و فرزندان مستقیم آن در دامنه انتخاب قرار می‌گیرند.';
}

export function errorPresentation(error: unknown, audience: CurriculumAudience): CurriculumErrorPresentation {
  const response = error as { status?: number; code?: string };
  if (response.status === 409 && response.code === 'STUDENT_TRACK_NOT_SET') {
    return {
      kind: 'NO_TRACK',
      title: 'رشته تحصیلی هنوز مشخص نشده است',
      description: audience === 'student'
        ? 'برای نمایش مباحث درسی، ابتدا رشته تحصیلی را در پروفایل خود مشخص کنید.'
        : 'رشته تحصیلی این دانش‌آموز هنوز در پروفایل او مشخص نشده است.',
    };
  }
  if (audience === 'counselor' && response.status === 404 && response.code === 'STUDENT_NOT_FOUND') {
    return {
      kind: 'INACCESSIBLE_STUDENT',
      title: 'دانش‌آموز در دسترس نیست',
      description: 'این دانش‌آموز یافت نشد یا دیگر در فهرست دانش‌آموزان مجاز شما نیست.',
    };
  }
  if (response.status === 404) {
    return {
      kind: 'NOT_FOUND',
      title: 'مبحث درسی پیدا نشد',
      description: 'این بخش ممکن است جابه‌جا شده باشد. فهرست را دوباره بارگذاری کنید.',
    };
  }
  return {
    kind: 'RECOVERABLE',
    title: 'بارگذاری مباحث انجام نشد',
    description: 'ارتباط برقرار نشد. دوباره تلاش کنید.',
  };
}
