import {
  classifyTaskPresentation,
  formatCurriculumProgress,
} from '@konkourx/task-presentation'
import type { CounselorVisibleTask } from '../students/student-tasks-client.ts'

export type PlanningTaskFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED'

export type TaskEvidence = {
  actualTimeLabel: string
  details: string[]
  plannedTimeLabel: string
  statusLabel: string
}

const faNumber = new Intl.NumberFormat('fa-IR')

export const tasksForDate = (
  tasks: readonly CounselorVisibleTask[],
  dateKey: string,
): CounselorVisibleTask[] => tasks.filter((task) => task.scheduledFor.slice(0, 10) === dateKey)

export const filterPlanningTasks = (
  tasks: readonly CounselorVisibleTask[],
  filter: PlanningTaskFilter,
  dateKey: string,
): CounselorVisibleTask[] => tasksForDate(tasks, dateKey).filter((task) => (
  filter === 'ALL' || task.status === filter
))

export const plannedMinutesForTask = (task: CounselorVisibleTask): number => {
  if (task.estimatedMinutes !== null && task.estimatedMinutes > 0) return task.estimatedMinutes
  if (task.startMinuteOfDay !== null && task.endMinuteOfDay !== null) {
    return Math.max(0, task.endMinuteOfDay - task.startMinuteOfDay)
  }
  return 0
}

export const taskSubjectLabel = (task: CounselorVisibleTask): string => {
  const firstTarget = task.curriculum.targets[0]
  if (firstTarget) return firstTarget.pathSnapshot[0] ?? firstTarget.labelSnapshot
  if (task.contentType === 'GENERAL') return 'عمومی'
  if (task.contentType === 'STUDY') return 'درسی'
  return 'تکلیف تاریخی'
}

export const taskProgressPercent = (task: CounselorVisibleTask): number | null => {
  const plannedMinutes = plannedMinutesForTask(task)
  if (plannedMinutes <= 0) return null
  return Math.min(100, Math.round((Math.max(0, task.recordedMinutes) / plannedMinutes) * 100))
}

export const buildTaskEvidence = (
  task: CounselorVisibleTask,
  todayKey: string,
): TaskEvidence => {
  const presentation = classifyTaskPresentation(task, todayKey)
  const scheduledWindow = plannedMinutesForTask(task)
  const plannedTimeLabel = task.estimatedMinutes !== null && task.estimatedMinutes > 0
    ? `زمان برنامه‌ریزی‌شده: ${faNumber.format(task.estimatedMinutes)} دقیقه`
    : scheduledWindow > 0
      ? `بازه برنامه‌ریزی‌شده: ${faNumber.format(scheduledWindow)} دقیقه`
      : 'مدت برنامه‌ریزی‌شده ثبت نشده'
  const actualTimeLabel = task.recordedMinutes > 0
    ? `مطالعه ثبت‌شده: ${faNumber.format(task.recordedMinutes)} دقیقه`
    : 'مطالعه ثبت‌شده‌ای ندارد'
  const details: string[] = []

  if (task.completedStudySessionCount > 0) {
    details.push(`${faNumber.format(task.completedStudySessionCount)} جلسه مطالعه پایان‌یافته`)
  }
  if (task.hasActiveStudySession) details.push('مطالعه اکنون در حال اجراست')
  if (task.hasValidAssessmentAttempt) details.push('نتیجه آزمون معتبر ثبت شده')
  if (task.curriculum.totalItemCount > 0) {
    details.push(formatCurriculumProgress(
      task.curriculum.completedItemCount,
      task.curriculum.totalItemCount,
    ))
  }
  if (task.plannedTestCount > 0) {
    details.push(`${faNumber.format(task.plannedTestCount)} تست برنامه‌ریزی‌شده`)
  }

  return { actualTimeLabel, details, plannedTimeLabel, statusLabel: presentation.label }
}

export const formatTimelineTime = (minuteOfDay: number): string => {
  if (minuteOfDay === 1440) return '۲۴:۰۰'
  const hour = Math.floor(minuteOfDay / 60)
  const minute = minuteOfDay % 60
  return `${faNumber.format(hour).padStart(2, '۰')}:${faNumber.format(minute).padStart(2, '۰')}`
}

export const planningAccent = (id: string): number => {
  let hash = 0
  for (const character of id) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0
  return hash % 4
}
