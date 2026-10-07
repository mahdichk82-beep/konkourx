import type { PlanningTargetDraftItem } from '@konkourx/curriculum-browser'

export const taskOccursOnDate = (scheduledFor: string, dateKey: string): boolean =>
  scheduledFor.slice(0, 10) === dateKey

export function prepareTaskContent(
  contentType: 'STUDY' | 'GENERAL' | '',
  selections: readonly PlanningTargetDraftItem[],
) {
  if (!contentType) return { ok: false as const, message: 'نوع کار را انتخاب کنید.' }
  const curriculumTargets = contentType === 'STUDY'
    ? selections.flatMap((item) => item.kind === 'NODE' ? [{
      referenceKind: 'NODE' as const,
      curriculumRefId: item.selection.nodeId,
      selectionMode: item.selection.mode,
    }] : [])
    : []
  if (contentType === 'STUDY' && (
    curriculumTargets.length === 0
    || curriculumTargets.length !== selections.length
    || curriculumTargets.some(({ selectionMode }) => selectionMode !== 'EXACT')
  )) {
    return { ok: false as const, message: 'برای کار درسی حداقل یک مبحث معتبر انتخاب کنید.' }
  }
  return {
    ok: true as const,
    contentType,
    curriculumTargets,
    subjectId: null,
    topicId: null,
  }
}
