import type { DragEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { AuthApiError } from '../auth/auth-client'
import { assessmentClient } from '../assessments/assessment-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ContentState } from '../components/ui/ContentState'
import {
  planningClient,
  type DailyTask,
  type DailyTaskSkipReason,
  type DailyTaskStatus,
  type StudySubject,
  type StudyTopic,
} from '../planning/planning-client'
import { addLocalDays, buildWeek, localDateKey, saturdayWeekStart } from '../planning/week'
import {
  movementLockReason,
  replaceTaskDate,
  restoreTask,
  type ExecutionCheck,
  type MovementLockReason,
} from '../planning/weekly-movement'

type WeeklyPlanningPageProps = {
  navigate(path: string): void
}

type Feedback = {
  kind: 'error' | 'success'
  message: string
}

const statusLabels: Record<DailyTaskStatus, string> = {
  COMPLETED: 'انجام‌شده',
  PARTIAL: 'بخشی انجام‌شده',
  PENDING: 'در انتظار',
  SKIPPED: 'ردشده',
}

const skipReasonLabels: Record<DailyTaskSkipReason, string> = {
  FORGOT: 'فراموش کردم',
  NO_TIME: 'زمان کافی نداشتم',
  OTHER: 'دلیل دیگر',
  TOO_DIFFICULT: 'بیش از حد دشوار بود',
}

const lockLabels: Record<MovementLockReason, string> = {
  CHECKING: 'در حال بررسی سابقه اجرا…',
  COUNSELOR: 'تعیین‌شده توسط مشاور · جابه‌جایی قفل است',
  EXECUTED: 'دارای سابقه مطالعه · جابه‌جایی قفل است',
  UNAVAILABLE: 'امکان جابه‌جایی بررسی نشد · قفل موقت',
}

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
})

const movedDateFormatter = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
})

const weekFormatter = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const errorMessage = (error: unknown): string => {
  if (error instanceof AuthApiError && error.code === 'TASK_DATE_RANGE_INVALID') {
    return 'بازه زمانی هفته معتبر نیست.'
  }
  return 'دریافت برنامه هفتگی ممکن نشد. دوباره تلاش کنید.'
}

const movementErrorMessage = (error: unknown): string => {
  if (!(error instanceof AuthApiError)) {
    return 'جابه‌جایی ذخیره نشد و کار به روز قبلی بازگشت. دوباره تلاش کنید.'
  }

  const messages: Record<string, string> = {
    TASK_ALREADY_EXECUTED: 'این کار سابقه اجرای مطالعه یا آزمون دارد؛ جابه‌جایی انجام نشد.',
    TASK_NOT_FOUND: 'این کار دیگر در دسترس نیست؛ جابه‌جایی انجام نشد.',
    TASK_RESCHEDULE_FORBIDDEN: 'اجازه جابه‌جایی این کار را ندارید.',
    VALIDATION_ERROR: 'روز مقصد معتبر نیست؛ جابه‌جایی انجام نشد.',
  }

  return messages[error.code]
    ?? 'جابه‌جایی ذخیره نشد و کار به روز قبلی بازگشت. دوباره تلاش کنید.'
}

const loadTasks = async (from: string, to: string): Promise<DailyTask[]> => {
  const tasks: DailyTask[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  do {
    const page = await planningClient.listTasks({ cursor, from, limit: 100, to })
    tasks.push(...page.items)
    cursor = page.nextCursor ?? undefined
    if (cursor && seenCursors.has(cursor)) break
    if (cursor) seenCursors.add(cursor)
  } while (cursor)

  return tasks
}

const loadSubjects = async (): Promise<StudySubject[]> => {
  const subjects: StudySubject[] = []
  let cursor: string | undefined
  do {
    const page = await planningClient.listSubjects(cursor)
    subjects.push(...page.items)
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return subjects
}

const loadTopics = async (subjectId: string): Promise<StudyTopic[]> => {
  const topics: StudyTopic[] = []
  let cursor: string | undefined
  do {
    const page = await planningClient.listTopics(subjectId, cursor)
    topics.push(...page.items)
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return topics
}

const loadExecutionChecks = async (
  tasks: DailyTask[],
): Promise<Record<string, ExecutionCheck>> => {
  const personalTasks = tasks.filter((task) => task.source === 'PERSONAL')
  const results = await Promise.all(personalTasks.map(async (task) => {
    try {
      const [hasSessions, hasAssessmentAttempts] = await Promise.all([
        planningClient.hasTaskSessions(task.id),
        assessmentClient.hasValidTaskAttempt(task.id),
      ])
      return [task.id, hasSessions || hasAssessmentAttempts ? 'EXECUTED' : 'CLEAR'] as const
    } catch {
      return [task.id, 'UNAVAILABLE'] as const
    }
  }))
  return Object.fromEntries(results)
}

export function WeeklyPlanningPage({ navigate }: WeeklyPlanningPageProps) {
  const [weekStart, setWeekStart] = useState(() => saturdayWeekStart(new Date()))
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [subjects, setSubjects] = useState<StudySubject[]>([])
  const [topics, setTopics] = useState<StudyTopic[]>([])
  const [executionChecks, setExecutionChecks] = useState<Record<string, ExecutionCheck>>({})
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverDayKey, setDragOverDayKey] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const days = useMemo(() => buildWeek(weekStart), [weekStart])
  const from = days[0]?.key ?? localDateKey(weekStart)
  const to = days[6]?.key ?? from
  const todayKey = localDateKey(new Date())
  const queryKey = `${from}:${to}:${retryKey}`
  const loading = loadedKey !== queryKey

  useEffect(() => {
    let active = true

    const fetchWeek = async () => {
      await Promise.resolve()
      if (!active) return
      setFeedback(null)
      setSelectedTaskId(null)
      setDraggedTaskId(null)
      setDragOverDayKey(null)

      try {
        const [taskItems, subjectItems] = await Promise.all([loadTasks(from, to), loadSubjects()])
        const subjectIds = [...new Set(
          taskItems.flatMap((task) => task.subjectId ? [task.subjectId] : []),
        )]
        const [topicGroups, checks] = await Promise.all([
          Promise.all(subjectIds.map((subjectId) => loadTopics(subjectId))),
          loadExecutionChecks(taskItems),
        ])
        if (!active) return
        setTasks(taskItems)
        setSubjects(subjectItems)
        setTopics(topicGroups.flat())
        setExecutionChecks(checks)
        setError(null)
      } catch (loadError: unknown) {
        if (!active) return
        setTasks([])
        setSubjects([])
        setTopics([])
        setExecutionChecks({})
        setError(errorMessage(loadError))
      } finally {
        if (active) setLoadedKey(queryKey)
      }
    }

    void fetchWeek()

    return () => {
      active = false
    }
  }, [from, queryKey, to])

  const subjectNames = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects],
  )
  const topicNames = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic.title])),
    [topics],
  )
  const tasksByDay = useMemo(() => {
    const grouped = new Map(days.map((day) => [day.key, [] as DailyTask[]]))
    for (const task of tasks) grouped.get(task.scheduledFor.slice(0, 10))?.push(task)
    return grouped
  }, [days, tasks])
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const hasUnavailableChecks = Object.values(executionChecks).includes('UNAVAILABLE')
  const plannedMinutes = tasks.reduce(
    (total, task) => total + (task.estimatedMinutes ?? 0),
    0,
  )

  const lockReason = (task: DailyTask): MovementLockReason | null =>
    movementLockReason(task, executionChecks[task.id] ?? 'CHECKING')

  const handleMove = async (taskId: string, scheduledFor: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task || lockReason(task) !== null || savingTaskId !== null) return
    if (task.scheduledFor.slice(0, 10) === scheduledFor) {
      setSelectedTaskId(null)
      return
    }

    setFeedback(null)
    setSavingTaskId(task.id)
    setSelectedTaskId(null)
    setTasks((current) => replaceTaskDate(current, task.id, scheduledFor))

    try {
      const updated = await planningClient.rescheduleTask(task.id, scheduledFor)
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))
      const targetDay = days.find((day) => day.key === scheduledFor)
      setFeedback({
        kind: 'success',
        message: `«${task.title}» به ${targetDay ? movedDateFormatter.format(targetDay.date) : scheduledFor} منتقل شد.`,
      })
    } catch (moveError) {
      setTasks((current) => restoreTask(current, task))
      setFeedback({ kind: 'error', message: movementErrorMessage(moveError) })
    } finally {
      setSavingTaskId(null)
      setDraggedTaskId(null)
      setDragOverDayKey(null)
    }
  }

  const handleDragStart = (event: DragEvent<HTMLElement>, task: DailyTask) => {
    if (lockReason(task) !== null || savingTaskId !== null) {
      event.preventDefault()
      return
    }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.id)
    setFeedback(null)
    setSelectedTaskId(null)
    setDraggedTaskId(task.id)
  }

  const handleDragOver = (event: DragEvent<HTMLElement>, dayKey: string) => {
    if (!draggedTaskId || savingTaskId !== null) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverDayKey(dayKey)
  }

  const handleDrop = (event: DragEvent<HTMLElement>, dayKey: string) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId
    setDragOverDayKey(null)
    if (taskId) void handleMove(taskId, dayKey)
  }

  return (
    <div className="page-stack weekly-planning-page">
      <Card className="weekly-planning-toolbar">
        <div>
          <p className="eyebrow">نمای شنبه تا جمعه</p>
          <h2>{weekFormatter.format(days[0]!.date)} تا {weekFormatter.format(days[6]!.date)}</h2>
          <p>کار شخصی را بکشید و روی روز مقصد رها کنید؛ در موبایل ابتدا کار و سپس روز را انتخاب کنید.</p>
        </div>
        <div className="weekly-planning-toolbar__actions">
          <Button disabled={savingTaskId !== null} onClick={() => setWeekStart(addLocalDays(weekStart, 7))} variant="secondary">هفته بعد</Button>
          <Button disabled={savingTaskId !== null} onClick={() => setWeekStart(saturdayWeekStart(new Date()))} variant="ghost">هفته جاری</Button>
          <Button disabled={savingTaskId !== null} onClick={() => setWeekStart(addLocalDays(weekStart, -7))} variant="secondary">هفته قبل</Button>
          <Button disabled={savingTaskId !== null} onClick={() => navigate('/planning')} variant="ghost">برنامه امروز</Button>
        </div>
      </Card>

      {!loading && !error && (
        <div className="weekly-workload" aria-label="خلاصه بار هفتگی">
          <span><strong>{tasks.length.toLocaleString('fa-IR')}</strong> وظیفه</span>
          <span><strong>{plannedMinutes.toLocaleString('fa-IR')}</strong> دقیقه برنامه‌ریزی‌شده</span>
        </div>
      )}

      {savingTaskId && (
        <div className="weekly-feedback weekly-feedback--saving" role="status">
          در حال ذخیره جابه‌جایی…
        </div>
      )}
      {feedback && (
        <div
          className={`weekly-feedback weekly-feedback--${feedback.kind}`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </div>
      )}
      {!loading && !error && hasUnavailableChecks && (
        <div className="weekly-feedback weekly-feedback--warning" role="alert">
          سابقه اجرای بعضی کارها بررسی نشد؛ برای ایمنی، جابه‌جایی آن‌ها موقتاً قفل است.
        </div>
      )}

      {loading ? (
        <ContentState kind="loading" title="در حال دریافت برنامه هفتگی" description="وظایف و وضعیت امکان جابه‌جایی در حال بارگذاری هستند." />
      ) : error ? (
        <ContentState
          action={<Button onClick={() => setRetryKey((value) => value + 1)}>تلاش دوباره</Button>}
          description={error}
          kind="error"
          title="برنامه هفتگی در دسترس نیست"
        />
      ) : tasks.length === 0 ? (
        <ContentState kind="empty" title="این هفته وظیفه‌ای ندارد" description="برای این بازه هفت‌روزه هنوز کاری برنامه‌ریزی نشده است." />
      ) : (
        <section className="weekly-days" aria-label="روزهای برنامه هفتگی">
          {days.map((day) => {
            const dayTasks = tasksByDay.get(day.key) ?? []
            const isDropTarget = dragOverDayKey === day.key
            return (
              <article
                className={`weekly-day${day.key === todayKey ? ' weekly-day--today' : ''}${isDropTarget ? ' weekly-day--drop-target' : ''}`}
                key={day.key}
                onDragLeave={() => setDragOverDayKey((current) => current === day.key ? null : current)}
                onDragOver={(event) => handleDragOver(event, day.key)}
                onDrop={(event) => handleDrop(event, day.key)}
              >
                <header className="weekly-day__header">
                  <div>
                    <strong>{new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(day.date)}</strong>
                    <span>{dateFormatter.format(day.date)}</span>
                  </div>
                  <small>{dayTasks.length.toLocaleString('fa-IR')} کار</small>
                </header>
                {selectedTask && selectedTask.scheduledFor.slice(0, 10) !== day.key && (
                  <Button
                    className="weekly-day__move-target"
                    disabled={savingTaskId !== null}
                    onClick={() => void handleMove(selectedTask.id, day.key)}
                    variant="secondary"
                  >
                    انتقال به این روز
                  </Button>
                )}
                {dayTasks.length === 0 ? (
                  <p className="weekly-day__empty">کاری ثبت نشده است.</p>
                ) : (
                  <div className="weekly-day__tasks">
                    {dayTasks.map((task) => {
                      const taskLockReason = lockReason(task)
                      const isEligible = taskLockReason === null
                      const isMovable = isEligible && savingTaskId === null
                      const isSelected = selectedTaskId === task.id
                      const isDragging = draggedTaskId === task.id
                      const isSaving = savingTaskId === task.id
                      return (
                        <article
                          aria-busy={isSaving}
                          className={`weekly-task weekly-task--${task.status.toLowerCase()}${isEligible ? ' weekly-task--movable' : ' weekly-task--locked'}${isSelected ? ' weekly-task--selected' : ''}${isDragging ? ' weekly-task--dragging' : ''}${isSaving ? ' weekly-task--saving' : ''}`}
                          draggable={isMovable}
                          key={task.id}
                          onDragEnd={() => {
                            setDraggedTaskId(null)
                            setDragOverDayKey(null)
                          }}
                          onDragStart={(event) => handleDragStart(event, task)}
                        >
                          <div className="weekly-task__heading">
                            <h3>{task.title}</h3>
                            <span>{statusLabels[task.status]}</span>
                          </div>
                          {(task.subjectId || task.topicId) && (
                            <p>
                              {task.subjectId ? subjectNames.get(task.subjectId) ?? 'درس ثبت‌شده' : ''}
                              {task.topicId ? ` · ${topicNames.get(task.topicId) ?? 'مبحث ثبت‌شده'}` : ''}
                            </p>
                          )}
                          <div className="weekly-task__meta">
                            {task.estimatedMinutes !== null && <span>{task.estimatedMinutes.toLocaleString('fa-IR')} دقیقه</span>}
                            {task.plannedTestCount > 0 && <span>{task.plannedTestCount.toLocaleString('fa-IR')} تست</span>}
                            {task.status === 'SKIPPED' && task.skipReason && (
                              <span>دلیل: {skipReasonLabels[task.skipReason]}</span>
                            )}
                            {taskLockReason
                              ? <span className="weekly-task__lock">{lockLabels[taskLockReason]}</span>
                              : <span>قابل جابه‌جایی</span>}
                          </div>
                          {isEligible && (
                            <Button
                              aria-pressed={isSelected}
                              className="weekly-task__move-button"
                              disabled={savingTaskId !== null}
                              onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                              variant="ghost"
                            >
                              {isSaving ? 'در حال ذخیره…' : isSelected ? 'لغو انتخاب' : 'انتخاب روز مقصد'}
                            </Button>
                          )}
                        </article>
                      )
                    })}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
