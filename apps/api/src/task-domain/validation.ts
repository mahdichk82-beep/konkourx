import type { CurriculumReadStore } from '../curriculum/store.js'
import type { CurriculumTrackId } from '../curriculum/types.js'
import { ApiError } from '../errors/api-error.js'
import { resolveCurriculumTargets } from '../task-curriculum/resolver.js'
import type { CurriculumTargetInput, ResolvedCurriculumTarget } from '../task-curriculum/types.js'

export type TaskContentType = 'STUDY' | 'GENERAL'

export const assertStudentTrackAtWrite = (
  actual: CurriculumTrackId | null | undefined,
  expected: CurriculumTrackId | null | undefined,
): void => {
  if (!actual) throw new ApiError(409, 'STUDENT_TRACK_NOT_SET', 'Student track is not set')
  if (!expected) throw new ApiError(500, 'TASK_TRACK_AUTHORITY_REQUIRED', 'Task track authority is unavailable')
  if (actual !== expected) {
    throw new ApiError(409, 'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK', 'Curriculum target is not available for the Student track')
  }
}

export const validateTaskContent = (
  contentType: TaskContentType | null | undefined,
  subjectId: string | null,
  topicId: string | null,
  targets: readonly CurriculumTargetInput[],
): void => {
  if (contentType === undefined || contentType === null) return
  if (contentType === 'GENERAL' && targets.length > 0) {
    throw new ApiError(409, 'TASK_GENERAL_TARGET_FORBIDDEN', 'General tasks cannot have Curriculum targets')
  }
  if (contentType === 'STUDY' && targets.length === 0) {
    throw new ApiError(409, 'TASK_STUDY_TARGET_REQUIRED', 'Study tasks require a Curriculum target')
  }
  if (subjectId || topicId) {
    throw new ApiError(409, 'TASK_LEGACY_LINK_FORBIDDEN', 'Explicit task content types cannot use legacy Subject or Topic links')
  }
}

export const resolveNewTaskTargets = (
  curriculum: CurriculumReadStore,
  track: CurriculumTrackId | null,
  targets: readonly CurriculumTargetInput[],
): ResolvedCurriculumTarget[] => {
  if (targets.length === 0) return []
  if (!track) throw new ApiError(409, 'STUDENT_TRACK_NOT_SET', 'Student track is not set')
  for (const target of targets) {
    if (target.referenceKind !== 'NODE' || curriculum.isNavigationGroup(target.curriculumRefId)) {
      throw new ApiError(400, 'CURRICULUM_TARGET_NOT_SELECTABLE', 'Curriculum target is not a selectable node')
    }
    if (!curriculum.isSelectableNodeInTrack(track, target.curriculumRefId)) {
      throw new ApiError(409, 'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK', 'Curriculum target is not available for the Student track')
    }
  }
  return resolveCurriculumTargets(curriculum, targets)
}
