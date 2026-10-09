import { useEffect, useMemo, useState } from 'react'
import {
  PlanningCurriculumField,
  canReplacePlanningCurriculum,
  planningCurriculumValueFromSnapshots,
  replaceChangedPlanningCurriculum,
  type PlanningCurriculumValue,
} from '@konkourx/curriculum-browser'
import '@konkourx/curriculum-browser/styles.css'
import { AuthApiError, authClient } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ContentState } from '../components/ui/ContentState'
import { createCounselorCurriculumClient } from '../curriculum/curriculum-client'
import { TaskScheduleFields } from './TaskScheduleFields'
import {
  studentTasksClient,
  type CounselorTaskSkipReason,
  type CounselorVisibleTask,
} from './student-tasks-client'
import { taskContentErrorMessage } from './task-error-messages'
import {
  formatJalaliDate,
  formatTaskSchedule,
  prepareTaskSchedule,
  scheduleDraftFromTask,
  scheduleHasChanged,
  type TaskScheduleDraft,
} from './task-scheduling'
import { mergeVisibleTask } from './task-view'

type StudentTaskListProps = {
  refreshKey: number
  studentId: string
  studentLabel: string
}

const statusLabels: Record<CounselorVisibleTask['status'], string> = {
  COMPLETED: 'انجام‌شده',
  PARTIAL: 'بخشی انجام‌شده',
  PENDING: 'در انتظار',
  SKIPPED: 'ردشده',
}

const sourceLabels: Record<CounselorVisibleTask['source'], string> = {
  COUNSELOR: 'تعیین‌شده توسط مشاور',
  PERSONAL: 'برنامه شخصی دانش‌آموز',
}

const skipReasonLabels: Record<CounselorTaskSkipReason, string> = {
  FORGOT: 'فراموش کرده',
  NO_TIME: 'زمان کافی نداشته',
  OTHER: 'دلیل دیگر',
  TOO_DIFFICULT: 'بیش از حد دشوار بوده',
}

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const completionFormatter = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatScheduledFor = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

const completionLabel = (task: CounselorVisibleTask) => {
  if (task.completedAt) {
    const completedAt = new Date(task.completedAt)
    if (!Number.isNaN(completedAt.getTime())) {
      return `تکمیل در ${completionFormatter.format(completedAt)}`
    }
  }
  if (task.status === 'COMPLETED') return 'انجام‌شده'
  if (task.status === 'SKIPPED') {
    const skippedAt = task.skippedAt ? new Date(task.skippedAt) : null
    const status = skippedAt && !Number.isNaN(skippedAt.getTime())
      ? `ردشده در ${completionFormatter.format(skippedAt)}`
      : 'ردشده'
    return task.skipReason
      ? `${status} · دلیل: ${skipReasonLabels[task.skipReason]}`
      : `${status} · بدون ثبت دلیل`
  }
  return 'در انتظار انجام'
}

const listError = (error: unknown) => {
  if (error instanceof AuthApiError && error.status === 404) {
    return 'تخصیص فعال این دانش‌آموز پیدا نشد یا دسترسی شما تغییر کرده است.'
  }
  return 'دریافت وظایف دانش‌آموز ممکن نشد. دوباره تلاش کنید.'
}

const scheduleError = (error: unknown) => {
  if (error instanceof AuthApiError) {
    if (error.code === 'TASK_ALREADY_EXECUTED') {
      return 'برای این کار سابقه اجرا ثبت شده است و زمان‌بندی آن قابل تغییر نیست.'
    }
    if (error.code === 'TASK_RESCHEDULE_FORBIDDEN') {
      return 'مشاور فقط می‌تواند زمان‌بندی کارهای تعیین‌شده توسط مشاور را تغییر دهد.'
    }
    if (error.code === 'STUDENT_NOT_FOUND') {
      return 'تخصیص فعال این دانش‌آموز پیدا نشد یا دسترسی شما تغییر کرده است.'
    }
    if (error.code === 'TASK_NOT_FOUND') return 'این کار دیگر در دسترس نیست.'
    const message = taskContentErrorMessage(error.code)
    if (message) return message
  }
  return 'تغییر زمان‌بندی کار ممکن نشد. دوباره تلاش کنید.'
}

const curriculumError = (error: unknown) => {
  if (error instanceof AuthApiError) {
    const message = taskContentErrorMessage(error.code)
    if (message) return message
  }
  return 'ویرایش مباحث ممکن نشد. دوباره تلاش کنید.'
}

export function StudentTaskList({ refreshKey, studentId, studentLabel }: StudentTaskListProps) {
  const curriculumClient = useMemo(() => createCounselorCurriculumClient(
    studentId,
    authClient.authorizedRequest.bind(authClient),
  ), [studentId])
  const [tasks, setTasks] = useState<CounselorVisibleTask[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [scheduleDrafts, setScheduleDrafts] = useState<
    Record<string, TaskScheduleDraft & { scheduledFor: string }>
  >({})
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null)
  const [scheduleActionError, setScheduleActionError] = useState<string | null>(null)
  const [updatingCurriculumTaskIds, setUpdatingCurriculumTaskIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let active = true
    studentTasksClient.listTasks(studentId).then((page) => {
      if (!active) return
      setTasks(page.items)
      setNextCursor(page.nextCursor)
      setError(null)
    }).catch((loadError: unknown) => {
      if (!active) return
      setTasks([])
      setNextCursor(null)
      setError(listError(loadError))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [refreshKey, retryKey, studentId])

  const retry = () => {
    setLoading(true)
    setError(null)
    setRetryKey((value) => value + 1)
  }

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const page = await studentTasksClient.listTasks(studentId, nextCursor)
      setTasks((current) => {
        const knownIds = new Set(current.map(({ id }) => id))
        return [...current, ...page.items.filter(({ id }) => !knownIds.has(id))]
      })
      setNextCursor(page.nextCursor)
    } catch (loadError) {
      setError(listError(loadError))
    } finally {
      setLoadingMore(false)
    }
  }

  const reschedule = async (task: CounselorVisibleTask) => {
    const draft = scheduleDrafts[task.id] ?? {
      ...scheduleDraftFromTask(task.startMinuteOfDay, task.endMinuteOfDay),
      scheduledFor: task.scheduledFor.slice(0, 10),
    }
    const schedule = prepareTaskSchedule(draft)
    if (!draft.scheduledFor) return
    if (!schedule.ok) {
      setScheduleActionError(schedule.message)
      return
    }
    if (
      draft.scheduledFor === task.scheduledFor.slice(0, 10)
      && !scheduleHasChanged(draft, task.startMinuteOfDay, task.endMinuteOfDay)
    ) return
    setSchedulingTaskId(task.id)
    setScheduleActionError(null)
    try {
      const updated = await studentTasksClient.reschedule(studentId, task.id, {
        endMinuteOfDay: schedule.value.endMinuteOfDay,
        scheduledFor: draft.scheduledFor,
        startMinuteOfDay: schedule.value.startMinuteOfDay,
      })
      setTasks((current) => current.map((candidate) =>
        candidate.id === updated.id
          ? { ...candidate, ...updated }
          : candidate,
      ))
      setScheduleDrafts((current) => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    } catch (updateError) {
      setScheduleActionError(scheduleError(updateError))
    } finally {
      setSchedulingTaskId(null)
    }
  }

  const replaceCurriculum = async (
    task: CounselorVisibleTask,
    curriculum: PlanningCurriculumValue,
  ) => {
    setUpdatingCurriculumTaskIds((current) => new Set(current).add(task.id))
    setScheduleActionError(null)
    try {
      const result = await replaceChangedPlanningCurriculum(
        task.curriculum.targets,
        curriculum,
        curriculumEditContext(task),
        (curriculumSelection) => studentTasksClient.replaceCurriculumSelection(
          studentId,
          task.id,
          curriculumSelection,
        ),
      )
      if (result.kind === 'REPLACED') {
        setTasks((current) => current.map((candidate) => candidate.id === result.value.id
          ? mergeVisibleTask(candidate, result.value)
          : candidate))
      } else if (result.kind === 'READ_ONLY') {
        setScheduleActionError('مباحث این کار در حال حاضر فقط قابل مشاهده هستند.')
      }
    } catch (updateError) {
      setScheduleActionError(curriculumError(updateError))
    } finally {
      setUpdatingCurriculumTaskIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  const curriculumEditContext = (task: CounselorVisibleTask) => ({
    actor: 'counselor' as const,
    contentType: task.contentType,
    source: task.source,
    status: task.status,
    completedItemCount: task.curriculum.completedItemCount,
    hasActiveStudySession: task.hasActiveStudySession,
    hasStudyHistory: task.studySessionCount > 0,
    hasValidAssessmentAttempt: task.hasValidAssessmentAttempt,
  })

  return (
    <Card className="student-task-list-card" title="وظایف و وضعیت اجرا">
      <p className="student-task-card__intro">
        وظایف دانش‌آموز در این بخش نمایش داده می‌شوند. فقط زمان‌بندی کارهای تعیین‌شده توسط مشاور و فاقد سابقه مطالعه قابل تغییر است.
      </p>

      {scheduleActionError && <p className="form-error" role="alert">{scheduleActionError}</p>}

      {loading ? (
        <ContentState
          description="برنامه ثبت‌شده دانش‌آموز در حال بارگذاری است."
          kind="loading"
          title="در حال دریافت وظایف"
        />
      ) : error && tasks.length === 0 ? (
        <ContentState
          action={<Button onClick={retry}>تلاش دوباره</Button>}
          description={error}
          kind="error"
          title="وظایف در دسترس نیستند"
        />
      ) : tasks.length === 0 ? (
        <ContentState
          description="هنوز وظیفه‌ای در برنامه این دانش‌آموز ثبت نشده است."
          kind="empty"
          title="فهرست وظایف خالی است"
        />
      ) : (
        <>
          <div className="counselor-task-list">
            {tasks.map((task) => {
              const scheduleDraft = scheduleDrafts[task.id] ?? {
                ...scheduleDraftFromTask(task.startMinuteOfDay, task.endMinuteOfDay),
                scheduledFor: task.scheduledFor.slice(0, 10),
              }
              const scheduleLocked = task.completedStudySessionCount > 0
                || task.hasActiveStudySession
                || task.hasValidAssessmentAttempt
              return (
              <article className={`counselor-task counselor-task--${task.status.toLowerCase()}`} key={task.id}>
                <div className="counselor-task__heading">
                  <h3>{task.title}</h3>
                  <span className={`counselor-task__status counselor-task__status--${task.status.toLowerCase()}`}>
                    {statusLabels[task.status]}
                  </span>
                </div>
                {task.description && <p className="counselor-task__description">{task.description}</p>}
                <p className="counselor-task__content-type">نوع کار: {task.contentType === 'STUDY' ? 'درسی' : task.contentType === 'GENERAL' ? 'عمومی' : 'ثبت تاریخی'}</p>
                <div className="counselor-task__meta">
                  <span>{formatScheduledFor(task.scheduledFor)}</span>
                  <span>{formatTaskSchedule(task.startMinuteOfDay, task.endMinuteOfDay)}</span>
                  <span>{sourceLabels[task.source]}</span>
                  <span>{completionLabel(task)}</span>
                  <span>
                    {task.completedStudySessionCount > 0
                      ? `${task.recordedMinutes.toLocaleString('fa-IR')} دقیقه مطالعه ثبت‌شده در ${task.completedStudySessionCount.toLocaleString('fa-IR')} جلسه پایان‌یافته`
                      : 'مطالعه پایان‌یافته‌ای ثبت نشده'}
                  </span>
                  {task.hasActiveStudySession && <span>مطالعه زنده اکنون در حال اجراست</span>}
                  {task.hasValidAssessmentAttempt && <span>این کار نتیجه آزمون معتبر دارد</span>}
                  {task.estimatedMinutes !== null && (
                    <span>مدت تخمینی: {task.estimatedMinutes.toLocaleString('fa-IR')} دقیقه</span>
                  )}
                  {task.plannedTestCount > 0 && (
                    <span>{task.plannedTestCount.toLocaleString('fa-IR')} تست برنامه‌ریزی‌شده</span>
                  )}
                </div>
                {(task.contentType === 'STUDY' || task.curriculum.targets.length > 0) ? (
                  <PlanningCurriculumField
                    audience="counselor"
                    client={curriculumClient}
                    contextLabel={studentLabel}
                    minimumOne={task.contentType === 'STUDY'}
                    disabled={!canReplacePlanningCurriculum(curriculumEditContext(task))
                      || updatingCurriculumTaskIds.has(task.id)}
                    disabledReason={task.contentType === null
                          ? 'این کار تاریخی است و مباحث آن فقط نمایش داده می‌شوند.'
                        : task.source !== 'COUNSELOR'
                      ? 'مباحث برنامه شخصی دانش‌آموز برای مشاور فقط خواندنی است.'
                      : task.status !== 'PENDING'
                        || task.completedStudySessionCount > 0
                        || task.hasActiveStudySession
                        || task.hasValidAssessmentAttempt
                        || task.curriculum.completedItemCount > 0
                        ? 'به‌دلیل شروع یا نهایی‌شدن کار، مباحث فقط خواندنی هستند.'
                        : updatingCurriculumTaskIds.has(task.id)
                          ? 'در حال ثبت مباحث…'
                          : undefined}
                    onChange={(draft) => void replaceCurriculum(task, draft)}
                    value={planningCurriculumValueFromSnapshots(task.curriculum.targets)}
                  />
                ) : null}
                {task.source === 'COUNSELOR' && (
                  <form
                    className="counselor-task__schedule"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void reschedule(task)
                    }}
                  >
                    <label htmlFor={`counselor-task-schedule-${task.id}`}>
                      تغییر تاریخ
                      <input
                        disabled={scheduleLocked}
                        id={`counselor-task-schedule-${task.id}`}
                        onChange={(event) => setScheduleDrafts((current) => ({
                          ...current,
                          [task.id]: { ...scheduleDraft, scheduledFor: event.target.value },
                        }))}
                        type="date"
                        value={scheduleDraft.scheduledFor}
                      />
                      <small>تاریخ شمسی: {formatJalaliDate(scheduleDraft.scheduledFor)}</small>
                    </label>
                    <TaskScheduleFields
                      disabled={scheduleLocked || schedulingTaskId === task.id}
                      idPrefix={`counselor-task-${task.id}-schedule`}
                      onChange={(value) => setScheduleDrafts((current) => ({
                        ...current,
                        [task.id]: { ...value, scheduledFor: scheduleDraft.scheduledFor },
                      }))}
                      value={scheduleDraft}
                    />
                    <Button
                      disabled={
                        scheduleLocked
                        || schedulingTaskId === task.id
                        || (
                          scheduleDraft.scheduledFor === task.scheduledFor.slice(0, 10)
                          && !scheduleHasChanged(
                            scheduleDraft,
                            task.startMinuteOfDay,
                            task.endMinuteOfDay,
                          )
                        )
                      }
                      type="submit"
                      variant="secondary"
                    >
                      {schedulingTaskId === task.id ? 'در حال ثبت…' : 'ثبت زمان‌بندی'}
                    </Button>
                    {scheduleLocked && (
                      <small>به‌دلیل اجرای مطالعه یا آزمون، زمان‌بندی این کار قفل است.</small>
                    )}
                  </form>
                )}
              </article>
              )
            })}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          {nextCursor && (
            <div className="student-task-list__actions">
              <Button disabled={loadingMore} onClick={() => void loadMore()} variant="secondary">
                {loadingMore ? 'در حال دریافت…' : 'نمایش وظایف بیشتر'}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
