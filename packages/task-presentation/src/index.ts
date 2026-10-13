export type TaskLifecycleStatus = 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED'

export type TaskPresentationStatus =
  | TaskLifecycleStatus
  | 'MISSED'
  | 'COMPLETED_LATE'

export type TaskPresentationInput = {
  completedAt: string | null
  deadlineMisses?: readonly {
    deadlineAt: string
    recordedAt: string
    scheduledFor: string
  }[]
  scheduledFor: string
  status: TaskLifecycleStatus
}

export type TaskPresentation = {
  indicatorLabel?: string
  isOverdue: boolean
  label: string
  missedDeadlineCount?: number
  status: TaskPresentationStatus
}

export type TehranDaySubscriptionEnvironment<TimerHandle = unknown> = {
  addFocusListener(listener: () => void): () => void
  addVisibilityListener(listener: () => void): () => void
  clearTimer(handle: TimerHandle): void
  isVisible(): boolean
  now(): Date
  setTimer(listener: () => void, delayMs: number): TimerHandle
}

const tehranDateFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Tehran',
  year: 'numeric',
})
const persianNumberFormatter = new Intl.NumberFormat('fa-IR')

const lifecycleLabels: Record<TaskLifecycleStatus, string> = {
  COMPLETED: 'انجام‌شده',
  PARTIAL: 'بخشی انجام‌شده',
  PENDING: 'در انتظار انجام',
  SKIPPED: 'ردشده',
}

const isoDateKey = (value: string): string | null => {
  const match = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(value)
  if (!match) return null
  const key = match[1]!
  const parsed = new Date(`${key}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== key
    ? null
    : key
}

export const tehranDateKey = (date: Date): string => {
  if (Number.isNaN(date.getTime())) return ''
  const parts = tehranDateFormatter.formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => (
    parts.find((candidate) => candidate.type === type)?.value ?? ''
  )
  return `${part('year')}-${part('month')}-${part('day')}`
}

export const formatCurriculumProgress = (completed: number, total: number): string => (
  `${persianNumberFormatter.format(completed)} از ${persianNumberFormatter.format(total)} مبحث تکمیل شده`
)

export const millisecondsUntilNextTehranDay = (date: Date): number => {
  const start = date.getTime()
  const currentKey = tehranDateKey(date)
  if (!currentKey) return 1

  let low = start + 1
  let high = start + (30 * 60 * 60 * 1000)
  while (tehranDateKey(new Date(high)) === currentKey) {
    high += 24 * 60 * 60 * 1000
  }

  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (tehranDateKey(new Date(middle)) === currentKey) low = middle + 1
    else high = middle
  }

  return low - start
}

export const subscribeToTehranDay = <TimerHandle>(
  onDayKey: (dayKey: string) => void,
  environment: TehranDaySubscriptionEnvironment<TimerHandle>,
): (() => void) => {
  let active = true
  let currentKey = ''
  let timer: TimerHandle | undefined

  const refresh = () => {
    if (!active) return
    if (timer !== undefined) environment.clearTimer(timer)
    const now = environment.now()
    const nextKey = tehranDateKey(now)
    if (nextKey && nextKey !== currentKey) {
      currentKey = nextKey
      onDayKey(nextKey)
    }
    timer = environment.setTimer(
      refresh,
      millisecondsUntilNextTehranDay(now) + 1,
    )
  }

  const removeFocusListener = environment.addFocusListener(refresh)
  const removeVisibilityListener = environment.addVisibilityListener(() => {
    if (environment.isVisible()) refresh()
  })
  refresh()

  return () => {
    active = false
    if (timer !== undefined) environment.clearTimer(timer)
    removeFocusListener()
    removeVisibilityListener()
  }
}

export const classifyTaskPresentation = (
  task: TaskPresentationInput,
  todayKey: string,
): TaskPresentation => {
  const scheduledKey = isoDateKey(task.scheduledFor)
  const validTodayKey = isoDateKey(todayKey)
  const missedDeadlineCount = task.deadlineMisses?.length ?? 0
  const durableMissPresentation = missedDeadlineCount > 0
    ? {
        indicatorLabel: 'دارای سابقه انجام‌نشده',
        missedDeadlineCount,
      }
    : {}

  if (task.status === 'PENDING' && scheduledKey && validTodayKey && scheduledKey < validTodayKey) {
    return {
      ...durableMissPresentation,
      isOverdue: true,
      label: 'انجام‌نشده',
      status: 'MISSED',
    }
  }

  if (task.status === 'PARTIAL') {
    const isOverdue = Boolean(scheduledKey && validTodayKey && scheduledKey < validTodayKey)
    return {
      ...(missedDeadlineCount > 0
        ? durableMissPresentation
        : isOverdue ? { indicatorLabel: 'از موعد گذشته' } : {}),
      isOverdue,
      label: lifecycleLabels.PARTIAL,
      status: 'PARTIAL',
    }
  }

  if (task.status === 'COMPLETED' && scheduledKey && task.completedAt) {
    const completedDate = new Date(task.completedAt)
    const completedKey = tehranDateKey(completedDate)
    if (completedKey && completedKey > scheduledKey) {
      return {
        ...durableMissPresentation,
        isOverdue: false,
        label: 'انجام‌شده با تأخیر',
        status: 'COMPLETED_LATE',
      }
    }
  }

  return {
    ...durableMissPresentation,
    isOverdue: false,
    label: lifecycleLabels[task.status],
    status: task.status,
  }
}

export const summarizeTaskPresentations = (
  tasks: readonly TaskPresentationInput[],
  todayKey: string,
): Record<TaskPresentationStatus, number> => (
  tasks.reduce<Record<TaskPresentationStatus, number>>((counts, task) => {
    const { status } = classifyTaskPresentation(task, todayKey)
    counts[status] += 1
    return counts
  }, {
    COMPLETED: 0,
    COMPLETED_LATE: 0,
    MISSED: 0,
    PARTIAL: 0,
    PENDING: 0,
    SKIPPED: 0,
  })
)
