import type { PlanningCurriculumValue } from '@konkourx/curriculum-browser'

export const taskOccursOnDate = (scheduledFor: string, dateKey: string): boolean =>
  scheduledFor.slice(0, 10) === dateKey

export function prepareTaskContent(
  contentType: 'STUDY' | 'GENERAL' | '',
  value: PlanningCurriculumValue,
) {
  if (!contentType) return { ok: false as const, message: 'نوع کار را انتخاب کنید.' }
  if (contentType === 'GENERAL') {
    return {
      ok: true as const,
      contentType,
      subjectId: null,
      topicId: null,
    }
  }
  if (value.kind !== 'V2' || value.selection.selectors.length === 0) {
    return { ok: false as const, message: 'برای کار درسی حداقل یک مبحث معتبر انتخاب کنید.' }
  }
  return {
    ok: true as const,
    contentType,
    curriculumSelection: value.selection,
    subjectId: null,
    topicId: null,
  }
}
