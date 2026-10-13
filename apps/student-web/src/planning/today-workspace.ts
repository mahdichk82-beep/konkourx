import type { DailyTask, StudySession } from './planning-client'
import { formatJalaliDate, formatTaskSchedule } from './task-scheduling.ts'

export type TodayTaskAction =
  | 'FINISH_AND_RECORD'
  | 'RECORD_RESULT'
  | 'START_STUDY'
  | 'SWITCH_STUDY'
  | 'VIEW_DETAILS'

export type TodayTaskActionModel = {
  primary: TodayTaskAction
  secondary: TodayTaskAction[]
}

export type TodayTaskGroup = {
  id: 'overdue' | 'today'
  items: DailyTask[]
}

export type TodayTaskSummaryModel = {
  actualSolvedTestCount: number
  context: string | null
  curriculum: DailyTask['curriculum']
  estimatedMinutes: number | null
  plannedTestCount: number
  schedule: {
    kind: 'DATE_ONLY' | 'TIMED'
    label: string
  }
  source: DailyTask['source']
  status: DailyTask['status']
  title: string
}

export type DetailNavigationState = {
  returnFocusTaskId: string | null
  selectedTaskId: string | null
}

export type DetailNavigationEvent =
  | { taskId: string; type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'FOCUS_RESTORED' }

export const initialDetailNavigationState: DetailNavigationState = {
  returnFocusTaskId: null,
  selectedTaskId: null,
}

export const taskActionModel = (
  task: DailyTask,
  activeSession: StudySession | null,
): TodayTaskActionModel => {
  if (task.status !== 'PENDING' || task.contentType === null) {
    return { primary: 'VIEW_DETAILS', secondary: [] }
  }
  if (task.contentType === 'GENERAL') {
    return { primary: 'RECORD_RESULT', secondary: [] }
  }
  if (activeSession?.dailyTaskId === task.id) {
    return { primary: 'FINISH_AND_RECORD', secondary: [] }
  }
  if (activeSession) {
    return { primary: 'SWITCH_STUDY', secondary: ['RECORD_RESULT'] }
  }
  return { primary: 'START_STUDY', secondary: ['RECORD_RESULT'] }
}

export const todayTaskGroups = (
  todayTasks: DailyTask[],
  overdueTasks: DailyTask[],
): TodayTaskGroup[] => [
  { id: 'today', items: todayTasks },
  { id: 'overdue', items: overdueTasks },
]

export const taskSummaryModel = (
  task: DailyTask,
  subjectName: string | null,
): TodayTaskSummaryModel => {
  const curriculumContext = task.curriculum.targets[0]?.pathSnapshot.join(' / ') ?? null
  const isTimed = task.startMinuteOfDay !== null && task.endMinuteOfDay !== null
  return {
    actualSolvedTestCount: task.actualSolvedTestCount,
    context: subjectName ?? curriculumContext,
    curriculum: task.curriculum,
    estimatedMinutes: task.estimatedMinutes,
    plannedTestCount: task.plannedTestCount,
    schedule: isTimed
      ? {
          kind: 'TIMED',
          label: formatTaskSchedule(task.startMinuteOfDay, task.endMinuteOfDay),
        }
      : {
          kind: 'DATE_ONLY',
          label: `برای ${formatJalaliDate(task.scheduledFor)} · بدون ساعت ثابت`,
        },
    source: task.source,
    status: task.status,
    title: task.title,
  }
}

export const detailNavigationReducer = (
  state: DetailNavigationState,
  event: DetailNavigationEvent,
): DetailNavigationState => {
  if (event.type === 'OPEN') {
    return { returnFocusTaskId: null, selectedTaskId: event.taskId }
  }
  if (event.type === 'CLOSE') {
    return {
      returnFocusTaskId: state.selectedTaskId,
      selectedTaskId: null,
    }
  }
  return { ...state, returnFocusTaskId: null }
}

export const activeTaskMatch = (
  session: StudySession | null,
  loadedTasks: readonly DailyTask[],
): DailyTask | null => {
  if (!session?.dailyTaskId) return null
  return loadedTasks.find(({ id }) => id === session.dailyTaskId) ?? null
}

export const planningTaskPath = (taskId: string): string =>
  `/planning/tasks/${encodeURIComponent(taskId)}`

export const planningTaskIdForPath = (path: string): string | null => {
  const match = /^\/planning\/tasks\/([^/]+)$/.exec(path)
  if (!match?.[1]) return null
  try {
    const taskId = decodeURIComponent(match[1])
    return taskId.length > 0 ? taskId : null
  } catch {
    return null
  }
}

export type LatestTaskRouteLoad<T> =
  | { status: 'LOADED'; taskId: string; value: T }
  | { status: 'STALE' }

export const createLatestTaskRouteLoader = () => {
  let generation = 0

  return {
    invalidate() {
      generation += 1
    },
    async load<T>(
      taskId: string,
      request: (taskId: string) => Promise<T>,
    ): Promise<LatestTaskRouteLoad<T>> {
      const requestGeneration = generation + 1
      generation = requestGeneration
      try {
        const value = await request(taskId)
        return generation === requestGeneration
          ? { status: 'LOADED', taskId, value }
          : { status: 'STALE' }
      } catch (error) {
        if (generation !== requestGeneration) return { status: 'STALE' }
        throw error
      }
    },
  }
}
