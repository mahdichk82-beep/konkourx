import {
  classifyTaskPresentation,
  summarizeTaskPresentations,
  type TaskPresentationStatus,
} from '@konkourx/task-presentation'
import type { DailyTask, TaskListQuery } from '../planning/planning-client.ts'

type TaskPage = {
  items: DailyTask[]
  nextCursor: string | null
}

export type DashboardTodayStatus = {
  count: number
  label: string
  status: TaskPresentationStatus
}

export type DashboardTodaySummary = {
  statuses: DashboardTodayStatus[]
  total: number
}

const statusOrder: readonly TaskPresentationStatus[] = [
  'PENDING',
  'MISSED',
  'PARTIAL',
  'SKIPPED',
  'COMPLETED_LATE',
  'COMPLETED',
]

export const loadDashboardTodayTasks = async (
  todayKey: string,
  fetchPage: (query: TaskListQuery & { date: string; limit: number }) => Promise<TaskPage>,
): Promise<DailyTask[]> => {
  const tasks = new Map<string, DailyTask>()
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  do {
    const page = await fetchPage({ cursor, date: todayKey, limit: 100 })
    for (const task of page.items) tasks.set(task.id, task)
    cursor = page.nextCursor ?? undefined
    if (cursor && seenCursors.has(cursor)) break
    if (cursor) seenCursors.add(cursor)
  } while (cursor)

  return [...tasks.values()]
}

export const buildDashboardTodaySummary = (
  tasks: readonly DailyTask[],
  todayKey: string,
): DashboardTodaySummary => {
  const counts = summarizeTaskPresentations(tasks, todayKey)
  const labels = new Map<TaskPresentationStatus, string>()
  for (const task of tasks) {
    const presentation = classifyTaskPresentation(task, todayKey)
    if (!labels.has(presentation.status)) labels.set(presentation.status, presentation.label)
  }
  return {
    statuses: statusOrder.flatMap((status) => counts[status] > 0
      ? [{
          count: counts[status],
          label: labels.get(status) ?? '',
          status,
        }]
      : []),
    total: tasks.length,
  }
}
