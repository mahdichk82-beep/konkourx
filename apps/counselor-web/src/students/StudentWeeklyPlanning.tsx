import { useEffect, useMemo, useState } from 'react'
import { AuthApiError } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ContentState } from '../components/ui/ContentState'
import {
  studentTasksClient,
  type CounselorTaskSkipReason,
  type CounselorTaskSubject,
  type CounselorTaskTopic,
  type CounselorVisibleTask,
} from './student-tasks-client'
import { addLocalDays, buildWeek, localDateKey, saturdayWeekStart } from './week'

type StudentWeeklyPlanningProps = {
  refreshKey: number
  studentId: string
}

const statusLabels: Record<CounselorVisibleTask['status'], string> = {
  COMPLETED: 'انجام‌شده',
  PARTIAL: 'بخشی انجام‌شده',
  PENDING: 'در انتظار',
  SKIPPED: 'ردشده',
}

const skipReasonLabels: Record<CounselorTaskSkipReason, string> = {
  FORGOT: 'فراموش کرده',
  NO_TIME: 'زمان کافی نداشته',
  OTHER: 'دلیل دیگر',
  TOO_DIFFICULT: 'بیش از حد دشوار بوده',
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
  const [weekStart, setWeekStart] = useState(() => saturdayWeekStart(new Date()))
  const [tasks, setTasks] = useState<CounselorVisibleTask[]>([])
  const [subjects, setSubjects] = useState<CounselorTaskSubject[]>([])
  const [topics, setTopics] = useState<CounselorTaskTopic[]>([])
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const days = useMemo(() => buildWeek(weekStart), [weekStart])
  const from = days[0]?.key ?? localDateKey(weekStart)
  const to = days[6]?.key ?? from
  const todayKey = localDateKey(new Date())
  const queryKey = `${studentId}:${from}:${to}:${refreshKey}:${retryKey}`
  const loading = loadedKey !== queryKey

  useEffect(() => {
    let active = true

    Promise.all([
      loadWeeklyTasks(studentId, from, to),
      studentTasksClient.listSubjects(studentId),
    ]).then(async ([taskItems, subjectItems]) => {
      const availableSubjectIds = new Set(subjectItems.map((subject) => subject.id))
      const subjectIds = [...new Set(
        taskItems.flatMap((task) => task.subjectId && availableSubjectIds.has(task.subjectId)
          ? [task.subjectId]
          : []),
      )]
      const topicGroups = await Promise.all(
        subjectIds.map((subjectId) => studentTasksClient.listTopics(studentId, subjectId)),
      )
      if (!active) return
      setTasks(taskItems)
      setSubjects(subjectItems)
      setTopics(topicGroups.flat())
      setError(null)
    }).catch((loadError: unknown) => {
      if (!active) return
      setTasks([])
      setSubjects([])
      setTopics([])
      setError(weeklyError(loadError))
    }).finally(() => {
      if (active) setLoadedKey(queryKey)
    })

    return () => {
      active = false
    }
  }, [from, queryKey, studentId, to])

  const subjectNames = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects],
  )
  const topicNames = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic.title])),
    [topics],
  )
  const tasksByDay = useMemo(() => {
    const grouped = new Map(days.map((day) => [day.key, [] as CounselorVisibleTask[]]))
    for (const task of tasks) grouped.get(task.scheduledFor.slice(0, 10))?.push(task)
    return grouped
  }, [days, tasks])
  const plannedMinutes = tasks.reduce(
    (total, task) => total + (task.estimatedMinutes ?? 0),
    0,
  )
  const plannedTests = tasks.reduce((total, task) => total + task.plannedTestCount, 0)

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
                  ) : dayTasks.map((task) => (
                    <article className={`student-weekly-task student-weekly-task--${task.status.toLowerCase()}`} key={task.id}>
                      <h3>{task.title}</h3>
                      <span>{statusLabels[task.status]}</span>
                      {task.status === 'SKIPPED' && (
                        <small>
                          {task.skipReason
                            ? `دلیل رد کردن: ${skipReasonLabels[task.skipReason]}`
                            : 'بدون ثبت دلیل رد کردن'}
                        </small>
                      )}
                      {(task.subjectId || task.topicId) && (
                        <p>
                          {task.subjectId ? subjectNames.get(task.subjectId) ?? 'درس ثبت‌شده' : ''}
                          {task.topicId ? ` · ${topicNames.get(task.topicId) ?? 'مبحث ثبت‌شده'}` : ''}
                        </p>
                      )}
                      <small>{task.source === 'COUNSELOR' ? 'تعیین‌شده توسط مشاور' : 'برنامه شخصی دانش‌آموز'}</small>
                    </article>
                  ))}
                </section>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}
