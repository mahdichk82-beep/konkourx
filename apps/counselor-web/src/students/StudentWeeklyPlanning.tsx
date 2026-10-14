import { useEffect, useMemo, useState } from 'react'
import {
  buildCompactTaskSummary,
  calendarDateKey,
  summarizeTaskPresentations,
} from '@konkourx/task-presentation'
import '@konkourx/task-presentation/styles.css'
import { AuthApiError } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ContentState } from '../components/ui/ContentState'
import {
  studentTasksClient,
  type CounselorVisibleTask,
} from './student-tasks-client'
import { addLocalDays, buildWeek, localDateKey, saturdayWeekStart } from './week'
import { useTehranTodayKey } from './useTehranTodayKey'

type StudentWeeklyPlanningProps = {
  refreshKey: number
  studentId: string
}

const weekFormatter = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dayFormatter = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'short',
  weekday: 'long',
})

const weeklyError = (error: unknown): string => {
  if (error instanceof AuthApiError && error.status === 404) {
    return 'تخصیص فعال این دانش‌آموز پیدا نشد یا دسترسی شما تغییر کرده است.'
  }
  return 'دریافت توزیع هفتگی وظایف ممکن نشد. دوباره تلاش کنید.'
}

const loadWeeklyTasks = async (
  studentId: string,
  from: string,
  to: string,
): Promise<CounselorVisibleTask[]> => {
  const tasks: CounselorVisibleTask[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  do {
    const page = await studentTasksClient.listTasks(studentId, cursor, { from, to })
    tasks.push(...page.items)
    cursor = page.nextCursor ?? undefined
    if (cursor && seenCursors.has(cursor)) break
    if (cursor) seenCursors.add(cursor)
  } while (cursor)

  return tasks
}

export function StudentWeeklyPlanning({ refreshKey, studentId }: StudentWeeklyPlanningProps) {
  const todayKey = useTehranTodayKey()
  const [weekStart, setWeekStart] = useState(() => saturdayWeekStart(new Date()))
  const [tasks, setTasks] = useState<CounselorVisibleTask[]>([])
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const days = useMemo(() => buildWeek(weekStart), [weekStart])
  const from = days[0]?.key ?? localDateKey(weekStart)
  const to = days[6]?.key ?? from
  const queryKey = `${studentId}:${from}:${to}:${refreshKey}:${retryKey}`
  const loading = loadedKey !== queryKey

  useEffect(() => {
    let active = true

    loadWeeklyTasks(studentId, from, to).then((taskItems) => {
      if (!active) return
      setTasks(taskItems)
      setError(null)
    }).catch((loadError: unknown) => {
      if (!active) return
      setTasks([])
      setError(weeklyError(loadError))
    }).finally(() => {
      if (active) setLoadedKey(queryKey)
    })

    return () => {
      active = false
    }
  }, [from, queryKey, studentId, to])

  const tasksByDay = useMemo(() => {
    const grouped = new Map(days.map((day) => [day.key, [] as CounselorVisibleTask[]]))
    for (const task of tasks) {
      const scheduledKey = calendarDateKey(task.scheduledFor)
      if (scheduledKey) grouped.get(scheduledKey)?.push(task)
    }
    return grouped
  }, [days, tasks])
  const plannedMinutes = tasks.reduce(
    (total, task) => total + (task.estimatedMinutes ?? 0),
    0,
  )
  const plannedTests = tasks.reduce((total, task) => total + task.plannedTestCount, 0)
  const actualSolvedTests = tasks.reduce((total, task) => total + task.actualSolvedTestCount, 0)
  const presentationSummary = summarizeTaskPresentations(tasks, todayKey)

  return (
    <Card className="student-weekly-card" title="توزیع هفتگی وظایف">
      <div className="student-weekly-toolbar">
        <div>
          <strong>{weekFormatter.format(days[0]!.date)} تا {weekFormatter.format(days[6]!.date)}</strong>
          <p>نمای فقط‌خواندنی شنبه تا جمعه، بر پایه تاریخ وظایف ثبت‌شده.</p>
        </div>
        <div className="student-weekly-toolbar__actions">
          <Button onClick={() => setWeekStart(addLocalDays(weekStart, 7))} variant="secondary">هفته بعد</Button>
          <Button onClick={() => setWeekStart(saturdayWeekStart(new Date()))} variant="ghost">هفته جاری</Button>
          <Button onClick={() => setWeekStart(addLocalDays(weekStart, -7))} variant="secondary">هفته قبل</Button>
        </div>
      </div>

      {loading ? (
        <ContentState kind="loading" title="در حال دریافت هفته" description="توزیع وظایف در حال بارگذاری است." />
      ) : error ? (
        <ContentState
          action={<Button onClick={() => setRetryKey((value) => value + 1)}>تلاش دوباره</Button>}
          description={error}
          kind="error"
          title="نمای هفتگی در دسترس نیست"
        />
      ) : tasks.length === 0 ? (
        <ContentState kind="empty" title="این هفته وظیفه‌ای ندارد" description="برای این دانش‌آموز در بازه انتخاب‌شده کاری ثبت نشده است." />
      ) : (
        <>
          <div className="student-weekly-summary">
            <span>{tasks.length.toLocaleString('fa-IR')} وظیفه</span>
            <span>{plannedMinutes.toLocaleString('fa-IR')} دقیقه برنامه‌ریزی‌شده</span>
            <span>{plannedTests.toLocaleString('fa-IR')} تست برنامه‌ریزی‌شده</span>
            <span>{actualSolvedTests.toLocaleString('fa-IR')} تست حل‌شده</span>
            {presentationSummary.MISSED > 0 && (
              <span>{presentationSummary.MISSED.toLocaleString('fa-IR')} انجام‌نشده</span>
            )}
            {presentationSummary.COMPLETED_LATE > 0 && (
              <span>{presentationSummary.COMPLETED_LATE.toLocaleString('fa-IR')} انجام‌شده با تأخیر</span>
            )}
          </div>
          <div className="student-weekly-days">
            {days.map((day) => {
              const dayTasks = tasksByDay.get(day.key) ?? []
              return (
                <section className={`student-weekly-day${day.key === todayKey ? ' student-weekly-day--today' : ''}`} key={day.key}>
                  <header>
                    <strong>{dayFormatter.format(day.date)}</strong>
                    <small>{dayTasks.length.toLocaleString('fa-IR')} کار</small>
                  </header>
                  {dayTasks.length === 0 ? (
                    <p className="student-weekly-day__empty">بدون وظیفه</p>
                  ) : dayTasks.map((task) => {
                    const summary = buildCompactTaskSummary(task, todayKey)
                    const presentationClass = summary.presentation.status.toLowerCase().replaceAll('_', '-')
                    return (
                    <article className={`student-weekly-task student-weekly-task--${task.status.toLowerCase()} task-presentation--${presentationClass}`} key={task.id}>
                      <h3>{summary.title}</h3>
                      <span className={`task-presentation-badge--${presentationClass}`}>
                        {summary.presentation.label}
                      </span>
                      {summary.presentation.indicatorLabel && (
                        <small className="task-presentation-indicator">
                          {summary.presentation.indicatorLabel}
                        </small>
                      )}
                      {summary.plannedLabel && <small>{summary.plannedLabel}</small>}
                      {summary.progress && (
                        <span className="student-weekly-task__progress">
                          <progress aria-label={summary.progress.label} max={100} value={summary.progress.value} />
                          <small>{summary.progress.label}</small>
                        </span>
                      )}
                    </article>
                    )
                  })}
                </section>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}
