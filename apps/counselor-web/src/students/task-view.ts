import type { CounselorTask, CounselorVisibleTask } from './student-tasks-client.ts'

/** Mutation responses omit the list-only execution metrics. */
export const mergeVisibleTask = (
  current: CounselorVisibleTask,
  updated: CounselorTask,
): CounselorVisibleTask => ({ ...current, ...updated })
