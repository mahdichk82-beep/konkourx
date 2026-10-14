import type { CounselorTask, CounselorVisibleTask } from './student-tasks-client.ts'
import { addLocalDays, localDateKey, saturdayWeekStart } from './week.ts'

export type StudentTaskRangeMode = 'DAY' | 'WEEK'
export type StudentTaskWorkspaceTab = 'TODAY' | 'COMPLETED' | 'UNFINISHED' | 'PARTIAL'

type StudentTaskView = {
  from: string
  tab: StudentTaskWorkspaceTab
  to: string
}

const dateFromKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year!, month! - 1, day!, 12)
}

export const studentTaskDateRange = (
  selectedDateKey: string,
  mode: StudentTaskRangeMode,
): { from: string; to: string } => {
  if (mode === 'DAY') return { from: selectedDateKey, to: selectedDateKey }
  const start = saturdayWeekStart(dateFromKey(selectedDateKey))
  return { from: localDateKey(start), to: localDateKey(addLocalDays(start, 6)) }
}

const hasRecordedProgress = (task: CounselorVisibleTask): boolean => (
  task.recordedMinutes > 0
  || task.actualSolvedTestCount > 0
  || task.curriculum.completedItemCount > 0
  || task.completedStudySessionCount > 0
)

export const filterStudentWorkspaceTasks = (
  tasks: readonly CounselorVisibleTask[],
  view: StudentTaskView,
): CounselorVisibleTask[] => tasks.filter((task) => {
  const scheduledDate = task.scheduledFor.slice(0, 10)
  if (scheduledDate < view.from || scheduledDate > view.to) return false
  if (view.tab === 'TODAY') return true
  if (view.tab === 'COMPLETED') return task.status === 'COMPLETED'
  if (view.tab === 'UNFINISHED') return task.status === 'PENDING' || task.status === 'SKIPPED'
  return task.status === 'PARTIAL' || (task.status === 'PENDING' && hasRecordedProgress(task))
})

/** Mutation responses omit the list-only execution metrics. */
export const mergeVisibleTask = (
  current: CounselorVisibleTask,
  updated: CounselorTask,
): CounselorVisibleTask => ({ ...current, ...updated })
