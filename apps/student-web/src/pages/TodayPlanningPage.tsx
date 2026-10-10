import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  classifyTaskPresentation,
  formatCurriculumProgress,
  summarizeTaskPresentations,
} from '@konkourx/task-presentation'
import '@konkourx/task-presentation/styles.css'
import {
  PlanningCurriculumField,
  canReplacePlanningCurriculum,
  createEmptyPlanningCurriculumValue,
  planningCurriculumValueFromSnapshots,
  replaceChangedPlanningCurriculum,
  type PlanningCurriculumValue,
} from '@konkourx/curriculum-browser'
import '@konkourx/curriculum-browser/styles.css'
import { AuthApiError, authClient } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ContentState } from '../components/ui/ContentState'
import {
  planningClient,
  type CurrentSessionAction,
  type DailyTask,
  type DailyTaskSkipReason,
  type DailyTaskStatus,
  type FinishStudySessionInput,
  type StudySession,
  type StudySubject,
} from '../planning/planning-client'
import { TaskExecutionPanel } from '../planning/TaskExecutionPanel'
import { useStudyTimer, useStudyTimerElapsed } from '../planning/useStudyTimer'
import { finalStudySessionElapsedMs } from '../planning/study-timer'
import { useTehranTodayKey } from '../planning/useTehranTodayKey'
import { TaskScheduleFields } from '../planning/TaskScheduleFields'
import { prepareTaskContent, taskOccursOnDate } from '../planning/task-content'
import {
  createScheduleDraft,
  formatJalaliDate,
  formatTaskSchedule,
  prepareTaskSchedule,
  scheduleDraftFromTask,
  scheduleHasChanged,
  type TaskScheduleDraft,
} from '../planning/task-scheduling'
import { createStudentCurriculumClient } from '../curriculum/curriculum-client'
import {
  cancelStudyConsequenceMessage,
  executionErrorCodeMessage,
  executionStartDecision,
  formatElapsedStudyTime,
  switchExecutionChoices,
} from '../planning/task-execution'
import {
  canToggleCurriculumExecutionItems,
  curriculumExecutionItems,
  taskCompletionState,
  taskOutcomeErrorCodeMessage,
  type CurriculumExecutionItem,
} from '../planning/task-completion'
import {
  canRecordSolvedTestProgress,
  progressDraftForTask,
  prepareSolvedTestProgress,
  shouldShowOverdueGroup,
  studySessionPanelMode,
  toggleExpandedTask,
  type SolvedTestProgressDraft,
} from '../planning/task-progress'

type StatusFilter = DailyTaskStatus | 'ALL'

const statusLabels: Record<DailyTaskStatus, string> = {
  COMPLETED: 'انجام‌شده',
  PARTIAL: 'بخشی انجام‌شده',
  PENDING: 'در انتظار انجام',
  SKIPPED: 'ردشده',
}

const skipReasonLabels: Record<DailyTaskSkipReason, string> = {
  FORGOT: 'فراموش کردم',
  NO_TIME: 'زمان کافی نداشتم',
  OTHER: 'دلیل دیگر',
  TOO_DIFFICULT: 'بیش از حد دشوار بود',
}

const planningErrorMessage = (error: unknown): string => {
  if (error instanceof TypeError) {
    return 'ارتباط با سرور برقرار نشد. اتصال خود را بررسی و دوباره تلاش کنید.'
  }
  if (!(error instanceof AuthApiError)) {
    return 'خطای پیش‌بینی‌نشده‌ای رخ داد. دوباره تلاش کنید.'
  }

  const executionMessage = executionErrorCodeMessage(error.code)
  if (executionMessage) return executionMessage
  const taskOutcomeMessage = taskOutcomeErrorCodeMessage(error.code)
  if (taskOutcomeMessage) return taskOutcomeMessage

  const messages: Record<string, string> = {
    SUBJECT_ARCHIVED: 'این درس بایگانی شده و برای کار جدید قابل استفاده نیست.',
    SUBJECT_CONFLICT: 'درسی با این نام از قبل وجود دارد.',
    SUBJECT_NOT_FOUND: 'درس انتخاب‌شده دیگر در دسترس نیست.',
    TASK_ACTIVE_SESSION_EXISTS: 'ابتدا مطالعه فعال این کار را پایان دهید، سپس نتیجه کار را ثبت کنید.',
    TASK_NOT_FOUND: 'این کار دیگر در دسترس نیست. فهرست را تازه‌سازی کنید.',
    TASK_ALREADY_EXECUTED: 'برای این کار سابقه اجرا ثبت شده است و زمان‌بندی آن قابل تغییر نیست.',
    TASK_SCHEDULE_INVALID: 'بازه زمانی باید در همان روز، با فاصله‌های ۱۵ دقیقه‌ای و ساعت پایان بعد از شروع باشد.',
    CURRICULUM_EXECUTION_STARTED: 'به‌دلیل شروع اجرای مباحث، ویرایش آن‌ها ممکن نیست.',
    STUDENT_TRACK_NOT_SET: 'برای انتخاب مباحث، ابتدا رشته تحصیلی خود را در پروفایل مشخص کنید.',
    CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK: 'مبحث انتخاب‌شده برای رشته تحصیلی شما مجاز نیست.',
    CURRICULUM_TARGET_NOT_SELECTABLE: 'مورد انتخاب‌شده مبحث قابل انتخاب نیست.',
    CURRICULUM_SELECTOR_LIMIT_EXCEEDED: 'تعداد انتخاب‌ها بیشتر از حد مجاز است. چند انتخاب را حذف کنید.',
    CURRICULUM_SELECTION_EMPTY: 'برای کار درسی حداقل یک مبحث معتبر انتخاب کنید.',
    TASK_STUDY_TARGET_REQUIRED: 'برای کار درسی حداقل یک مبحث لازم است.',
    TASK_GENERAL_TARGET_FORBIDDEN: 'کار عمومی نباید مبحث درسی داشته باشد.',
    TASK_LEGACY_LINK_FORBIDDEN: 'پیوند درس یا مبحث قدیمی برای این نوع کار مجاز نیست.',
    TASK_NOT_PENDING: 'مباحث کار نهایی‌شده قابل ویرایش نیستند.',
    TASK_PROGRESS_NOT_APPLICABLE: 'ثبت تعداد تست فقط برای کار درسیِ در انتظار انجام ممکن است.',
    TASK_PROGRESS_STALE: 'این کار در صفحه دیگری تغییر کرده است. مقدار تازه دریافت شد؛ دوباره بررسی و ثبت کنید.',
    TASK_SOURCE_FORBIDDEN: 'فقط مباحث کار شخصی را می‌توانید ویرایش کنید.',
    TASK_RESCHEDULE_FORBIDDEN: 'تغییر زمان‌بندی کار تعیین‌شده توسط مشاور برای دانش‌آموز مجاز نیست.',
    TASK_UPDATE_FORBIDDEN: 'تغییر محتوای کار تعیین‌شده توسط مشاور مجاز نیست.',
    CURRICULUM_UNAVAILABLE: 'فهرست مباحث در حال حاضر در دسترس نیست. کمی بعد دوباره تلاش کنید.',
    TOPIC_ARCHIVED: 'این مبحث بایگانی شده و برای کار جدید قابل استفاده نیست.',
    TOPIC_NOT_FOUND: 'مبحث انتخاب‌شده دیگر در دسترس نیست.',
    TOPIC_SUBJECT_MISMATCH: 'مبحث انتخاب‌شده به این درس تعلق ندارد.',
    TOPIC_SUBJECT_REQUIRED: 'برای انتخاب مبحث، ابتدا درس آن را انتخاب کنید.',
    VALIDATION_ERROR: 'اطلاعات واردشده معتبر نیست. فیلدها را بررسی کنید.',
  }

  if (messages[error.code]) return messages[error.code]
  return error.status >= 500
    ? 'سرور نتوانست درخواست را انجام دهد. کمی بعد دوباره تلاش کنید.'
    : 'درخواست توسط سرور پذیرفته نشد. اطلاعات صفحه را تازه کنید و دوباره تلاش کنید.'
}

const mergeTasks = (items: DailyTask[]): DailyTask[] => {
  const unique = new Map<string, DailyTask>()
  for (const item of items) unique.set(item.id, item)
  return [...unique.values()]
}

const mergeSubjects = (items: StudySubject[]): StudySubject[] => {
  const unique = new Map<string, StudySubject>()
  for (const item of items) unique.set(item.id, item)
  return [...unique.values()]
}

const loadSubjects = async (): Promise<StudySubject[]> => {
  const subjects: StudySubject[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  do {
    const page = await planningClient.listSubjects(cursor)
    subjects.push(...page.items)
    cursor = page.nextCursor ?? undefined
    if (cursor && seenCursors.has(cursor)) break
    if (cursor) seenCursors.add(cursor)
  } while (cursor)

  return mergeSubjects(subjects)
}

function ActiveStudyExecutionCard({
  activeSession,
  activeTaskTitle,
  busy,
  onCancel,
  onFinish,
  onPause,
  onResume,
}: {
  activeSession: StudySession
  activeTaskTitle: string | null
  busy: boolean
  onCancel(): void
  onFinish(): Promise<void>
  onPause(): Promise<void>
  onResume(): Promise<void>
}) {
  const elapsed = formatElapsedStudyTime(useStudyTimerElapsed(activeSession))
  const isPaused = activeSession.timerState === 'PAUSED'

  return (
    <Card className="active-study-card">
      <div>
        <p className="eyebrow">{isPaused ? 'مطالعه در مکث' : 'مطالعه فعال'}</p>
        <h2>{activeTaskTitle ?? 'مطالعه فعلی'} {isPaused ? 'متوقف شده است' : 'در حال اجراست'}</h2>
        <p>{isPaused ? 'زمان فعال در حالت مکث افزایش نمی‌یابد.' : 'زمان فعال بر پایه وضعیت ثبت‌شده در سرور نمایش داده می‌شود.'}</p>
      </div>
      <strong aria-live="off" className="active-study-card__timer" dir="ltr">{elapsed}</strong>
      <div className="active-study-card__actions">
        <Button
          disabled={busy}
          onClick={() => void (isPaused ? onResume() : onPause())}
        >
          {busy ? 'در حال همگام‌سازی…' : isPaused ? 'ادامه مطالعه' : 'مکث'}
        </Button>
        <Button disabled={busy} onClick={() => void onFinish()} variant="secondary">
          {busy ? 'در حال ثبت…' : 'پایان مطالعه فعال'}
        </Button>
        <Button disabled={busy} onClick={onCancel} variant="ghost">
          لغو این بازه
        </Button>
      </div>
    </Card>
  )
}

const studySessionDateTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function FinishedStudyExecutionCard({
  session,
  taskTitle,
}: {
  session: StudySession
  taskTitle: string | null
}) {
  const elapsedMs = finalStudySessionElapsedMs(session) ?? 0
  return (
    <Card className="finished-study-card">
      <div>
        <p className="eyebrow">جلسه مطالعه پایان یافت</p>
        <h2>{taskTitle ?? 'جلسه مطالعه'} ثبت شد</h2>
        <p>پایان جلسه، وضعیت کار و مباحث آن را به‌صورت خودکار تغییر نداده است.</p>
      </div>
      <div className="finished-study-card__summary">
        <strong dir="ltr">{formatElapsedStudyTime(elapsedMs)}</strong>
        <span>زمان فعال ثبت‌شده</span>
        {session.endedAt && (
          <small>پایان: {studySessionDateTimeFormatter.format(new Date(session.endedAt))}</small>
        )}
      </div>
    </Card>
  )
}

export function TodayPlanningPage({ navigate }: { navigate(path: string): void }) {
  const studyTimer = useStudyTimer()
  const todayKey = useTehranTodayKey()
  const today = new Date()
  const todayLabel = new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Tehran',
    weekday: 'long',
    year: 'numeric',
  }).format(today)
  const numberFormatter = useMemo(() => new Intl.NumberFormat('fa-IR'), [])
  const curriculumClient = useMemo(() => createStudentCurriculumClient(
    authClient.authorizedRequest.bind(authClient),
  ), [])

  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [overdueTasks, setOverdueTasks] = useState<DailyTask[]>([])
  const [subjects, setSubjects] = useState<StudySubject[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [overdueNextCursor, setOverdueNextCursor] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [subjectFilter, setSubjectFilter] = useState('ALL')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLoadingOverdue, setIsLoadingOverdue] = useState(true)
  const [isLoadingMoreOverdue, setIsLoadingMoreOverdue] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [overdueError, setOverdueError] = useState<string | null>(null)
  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set())
  const [reschedulingTaskIds, setReschedulingTaskIds] = useState<Set<string>>(new Set())
  const [scheduleDrafts, setScheduleDrafts] = useState<
    Record<string, TaskScheduleDraft & { scheduledFor: string }>
  >({})
  const [skipReasonDrafts, setSkipReasonDrafts] = useState<
    Record<string, DailyTaskSkipReason | ''>
  >({})

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [taskScheduledFor, setTaskScheduledFor] = useState(todayKey)
  const [description, setDescription] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [taskSchedule, setTaskSchedule] = useState<TaskScheduleDraft>(createScheduleDraft)
  const [contentType, setContentType] = useState<'STUDY' | 'GENERAL' | ''>('')
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [taskCurriculum, setTaskCurriculum] = useState<PlanningCurriculumValue>(() => createEmptyPlanningCurriculumValue())
  const [taskStudyHistory, setTaskStudyHistory] = useState<Record<string, 'LOADING' | 'NONE' | 'PRESENT' | 'ERROR'>>({})
  const [updatingCurriculumTaskIds, setUpdatingCurriculumTaskIds] = useState<Set<string>>(new Set())
  const [updatingExecutionTaskIds, setUpdatingExecutionTaskIds] = useState<Set<string>>(new Set())
  const [savingProgressTaskIds, setSavingProgressTaskIds] = useState<Set<string>>(new Set())
  const [progressDrafts, setProgressDrafts] = useState<Record<string, SolvedTestProgressDraft>>({})
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  const activeSession = studyTimer.activeSession
  const activeTaskTitle = studyTimer.activeTaskTitle
  const executionReady = studyTimer.ready
  const executionBusy = studyTimer.busy
  const executionRevision = studyTimer.revision
  const reconcileStudyTimer = studyTimer.reconcile
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [switchTarget, setSwitchTarget] = useState<{ id: string; title: string } | null>(null)
  const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false)
  const visibleExecutionError = executionError
    ?? (studyTimer.error ? planningErrorMessage(studyTimer.error) : null)

  const currentQueryKey = `${todayKey}:${statusFilter}:${subjectFilter}`
  const currentQueryKeyRef = useRef(currentQueryKey)

  useEffect(() => {
    currentQueryKeyRef.current = currentQueryKey
  }, [currentQueryKey])

  const refreshSubjects = useCallback(async () => {
    setSubjectError(null)
    try {
      setSubjects(await loadSubjects())
    } catch (error) {
      setSubjectError(planningErrorMessage(error))
    }
  }, [])

  const restoreActiveExecution = useCallback(async () => {
    setExecutionError(null)
    await reconcileStudyTimer()
  }, [reconcileStudyTimer])

  useEffect(() => {
    let active = true
    void loadSubjects().then((items) => {
      if (active) setSubjects(items)
    }).catch((error: unknown) => {
      if (active) setSubjectError(planningErrorMessage(error))
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const fetchTasks = async () => {
      await Promise.resolve()
      if (!active) return
      setIsInitialLoading(true)
      setIsLoadingMore(false)
      setListError(null)
      setTasks([])
      setNextCursor(null)

      try {
        const page = await planningClient.listTasks({
          date: todayKey,
          limit: 20,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          subjectId: subjectFilter === 'ALL' ? undefined : subjectFilter,
        })
        if (!active) return
        setTasks(mergeTasks(page.items))
        setNextCursor(page.nextCursor)
      } catch (error) {
        if (active) setListError(planningErrorMessage(error))
      } finally {
        if (active) setIsInitialLoading(false)
      }
    }

    void fetchTasks()

    return () => {
      active = false
    }
  }, [refreshKey, statusFilter, subjectFilter, todayKey])

  useEffect(() => {
    let active = true
    const fetchOverdueTasks = async () => {
      await Promise.resolve()
      if (!active) return
      setIsLoadingOverdue(true)
      setIsLoadingMoreOverdue(false)
      setOverdueError(null)
      setOverdueTasks([])
      setOverdueNextCursor(null)
      try {
        const page = await planningClient.listTasks({
          limit: 20,
          overdueBefore: todayKey,
          status: 'PENDING',
        })
        if (!active) return
        setOverdueTasks(mergeTasks(page.items))
        setOverdueNextCursor(page.nextCursor)
      } catch (error) {
        if (active) setOverdueError(planningErrorMessage(error))
      } finally {
        if (active) setIsLoadingOverdue(false)
      }
    }
    void fetchOverdueTasks()
    return () => { active = false }
  }, [refreshKey, todayKey])

  useEffect(() => {
    let active = true
    const editableTaskIds = mergeTasks([...overdueTasks, ...tasks]).filter((task) => (
      task.contentType === 'STUDY'
      && task.source === 'PERSONAL'
      && task.status === 'PENDING'
      && task.curriculum.completedItemCount === 0
    )).map(({ id }) => id)
    setTaskStudyHistory(Object.fromEntries(editableTaskIds.map((id) => [id, 'LOADING'])))
    for (const taskId of editableTaskIds) {
      void planningClient.hasTaskSessions(taskId).then((hasHistory) => {
        if (!active) return
        setTaskStudyHistory((current) => ({
          ...current,
          [taskId]: hasHistory ? 'PRESENT' : 'NONE',
        }))
      }).catch(() => {
        if (active) setTaskStudyHistory((current) => ({ ...current, [taskId]: 'ERROR' }))
      })
    }
    return () => { active = false }
  }, [tasks, overdueTasks, executionRevision])

  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
  const summary = summarizeTaskPresentations(tasks, todayKey)

  const taskMatchesFilters = (task: DailyTask): boolean =>
    taskOccursOnDate(task.scheduledFor, todayKey) &&
    (statusFilter === 'ALL' || task.status === statusFilter) &&
    (subjectFilter === 'ALL' || task.subjectId === subjectFilter)

  const isOverdueTask = (task: DailyTask): boolean =>
    task.status === 'PENDING' && task.scheduledFor.slice(0, 10) < todayKey

  const replaceTaskFromServer = (updated: DailyTask) => {
    setTasks((current) => {
      if (!taskMatchesFilters(updated)) {
        return current.filter((item) => item.id !== updated.id)
      }
      return current.some((item) => item.id === updated.id)
        ? current.map((item) => item.id === updated.id ? updated : item)
        : mergeTasks([updated, ...current])
    })
    setOverdueTasks((current) => {
      if (!isOverdueTask(updated)) return current.filter((item) => item.id !== updated.id)
      if (current.some((item) => item.id === updated.id)) {
        return current.map((item) => item.id === updated.id ? updated : item)
      }
      return mergeTasks([updated, ...current])
    })
  }

  const reconcileTaskFromServer = async (taskId: string) => {
    try {
      replaceTaskFromServer(await planningClient.getTask(taskId))
    } catch (error) {
      if (error instanceof AuthApiError && error.code === 'TASK_NOT_FOUND') {
        setTasks((current) => current.filter((item) => item.id !== taskId))
        setOverdueTasks((current) => current.filter((item) => item.id !== taskId))
      }
    }
  }

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return
    const queryKey = currentQueryKey
    setIsLoadingMore(true)
    setListError(null)

    try {
      const page = await planningClient.listTasks({
        cursor: nextCursor,
        date: todayKey,
        limit: 20,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        subjectId: subjectFilter === 'ALL' ? undefined : subjectFilter,
      })
      if (currentQueryKeyRef.current !== queryKey) return
      setTasks((current) => mergeTasks([...current, ...page.items]))
      setNextCursor(page.nextCursor)
    } catch (error) {
      if (currentQueryKeyRef.current === queryKey) {
        setListError(planningErrorMessage(error))
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleLoadMoreOverdue = async () => {
    if (!overdueNextCursor || isLoadingMoreOverdue) return
    setIsLoadingMoreOverdue(true)
    setOverdueError(null)
    try {
      const page = await planningClient.listTasks({
        cursor: overdueNextCursor,
        limit: 20,
        overdueBefore: todayKey,
        status: 'PENDING',
      })
      setOverdueTasks((current) => mergeTasks([...current, ...page.items]))
      setOverdueNextCursor(page.nextCursor)
    } catch (error) {
      setOverdueError(planningErrorMessage(error))
    } finally {
      setIsLoadingMoreOverdue(false)
    }
  }

  const handleProgressUpdate = async (task: DailyTask) => {
    const draft = progressDraftForTask(
      progressDrafts[task.id],
      task.actualSolvedTestCount,
      task.updatedAt,
    )
    const prepared = prepareSolvedTestProgress(
      draft.count,
      draft.expectedUpdatedAt,
    )
    if (!prepared.ok) {
      setActionError(prepared.message)
      return
    }
    setActionError(null)
    setSavingProgressTaskIds((current) => new Set(current).add(task.id))
    try {
      const updated = await planningClient.recordTaskProgress(task.id, prepared.value)
      replaceTaskFromServer(updated)
      setProgressDrafts((current) => ({
        ...current,
        [task.id]: {
          count: String(updated.actualSolvedTestCount),
          expectedUpdatedAt: updated.updatedAt,
        },
      }))
    } catch (error) {
      setActionError(planningErrorMessage(error))
      await reconcileTaskFromServer(task.id)
      setProgressDrafts((current) => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    } finally {
      setSavingProgressTaskIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  const handleStatusUpdate = async (
    task: DailyTask,
    status: DailyTaskStatus,
    skipReason?: DailyTaskSkipReason | null,
  ) => {
    setActionError(null)
    setUpdatingTaskIds((current) => new Set(current).add(task.id))

    try {
      const updated = await planningClient.updateTaskStatus(task.id, status, skipReason)
      replaceTaskFromServer(updated)
      setSkipReasonDrafts((current) => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    } catch (error) {
      setActionError(planningErrorMessage(error))
      await reconcileTaskFromServer(task.id)
    } finally {
      setUpdatingTaskIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  const handleCurriculumItemToggle = async (
    task: DailyTask,
    item: CurriculumExecutionItem,
    completed: boolean,
  ) => {
    if (!canToggleCurriculumExecutionItems({
      contentType: task.contentType,
      source: task.source,
      status: task.status,
      totalItemCount: task.curriculum.totalItemCount,
    })
      || updatingCurriculumTaskIds.has(task.id)
      || updatingExecutionTaskIds.has(task.id)
    ) return

    setActionError(null)
    setUpdatingExecutionTaskIds((current) => new Set(current).add(task.id))
    try {
      const updated = await planningClient.toggleTaskCurriculumItem(
        task.id,
        item.id,
        completed,
      )
      replaceTaskFromServer(updated)
    } catch (error) {
      setActionError(planningErrorMessage(error))
      await reconcileTaskFromServer(task.id)
    } finally {
      setUpdatingExecutionTaskIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  const handleExecutionStart = async (
    taskId: string,
    taskTitle: string,
  ): Promise<'STARTED' | 'CONTINUED' | 'SWITCH_PENDING'> => {
    const decision = executionStartDecision(taskId, activeSession)
    if (decision === 'CONTINUE') return 'CONTINUED'
    if (decision === 'SWITCH') {
      setSwitchTarget({ id: taskId, title: taskTitle })
      setCancelConfirmationOpen(false)
      setExecutionError(null)
      return 'SWITCH_PENDING'
    }

    setExecutionError(null)
    try {
      await studyTimer.start(taskId, taskTitle)
      setCancelConfirmationOpen(false)
      return 'STARTED'
    } catch (error) {
      if (error instanceof AuthApiError && error.code === 'ACTIVE_STUDY_SESSION_EXISTS') {
        await restoreActiveExecution()
      }
      throw error
    }
  }

  const handleExecutionFinish = async (
    sessionId: string,
    input: FinishStudySessionInput,
  ): Promise<StudySession> => {
    setExecutionError(null)
    try {
      const session = await studyTimer.finish(sessionId, input)
      setCancelConfirmationOpen(false)
      return session
    } catch (error) {
      if (
        error instanceof AuthApiError
        && (error.code === 'SESSION_ALREADY_FINISHED' || error.code === 'SESSION_NOT_FOUND')
      ) {
        await restoreActiveExecution()
      }
      throw error
    }
  }

  const confirmExecutionCancel = async () => {
    if (!activeSession || executionBusy) return
    setExecutionError(null)
    try {
      await studyTimer.cancel()
      setCancelConfirmationOpen(false)
      setSwitchTarget(null)
    } catch (error) {
      setExecutionError(planningErrorMessage(error))
      if (
        error instanceof AuthApiError
        && (
          error.code === 'SESSION_ALREADY_CANCELLED'
          || error.code === 'SESSION_ALREADY_FINISHED'
          || error.code === 'SESSION_NOT_FOUND'
        )
      ) {
        await restoreActiveExecution()
      }
    }
  }

  const confirmExecutionSwitch = async (currentSessionAction: CurrentSessionAction) => {
    if (!switchTarget || executionBusy) return
    const target = switchTarget
    setExecutionError(null)
    try {
      await studyTimer.switchTask(
        target.id,
        target.title,
        currentSessionAction,
      )
      setCancelConfirmationOpen(false)
      setSwitchTarget(null)
    } catch (error) {
      setExecutionError(planningErrorMessage(error))
    }
  }

  const handleScheduleUpdate = async (task: DailyTask) => {
    const draft = scheduleDrafts[task.id] ?? {
      ...scheduleDraftFromTask(task.startMinuteOfDay, task.endMinuteOfDay),
      scheduledFor: task.scheduledFor.slice(0, 10),
    }
    const schedule = prepareTaskSchedule(draft)
    if (!draft.scheduledFor) return
    if (!schedule.ok) {
      setActionError(schedule.message)
      return
    }
    if (
      draft.scheduledFor === task.scheduledFor.slice(0, 10)
      && !scheduleHasChanged(draft, task.startMinuteOfDay, task.endMinuteOfDay)
    ) return
    setActionError(null)
    setReschedulingTaskIds((current) => new Set(current).add(task.id))

    try {
      const updated = await planningClient.rescheduleTask(task.id, {
        endMinuteOfDay: schedule.value.endMinuteOfDay,
        scheduledFor: draft.scheduledFor,
        startMinuteOfDay: schedule.value.startMinuteOfDay,
      })
      replaceTaskFromServer(updated)
      setScheduleDrafts((current) => {
        const next = { ...current }
        delete next[task.id]
        return next
      })
    } catch (error) {
      setActionError(planningErrorMessage(error))
    } finally {
      setReschedulingTaskIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    const minutes = estimatedMinutes === '' ? null : Number(estimatedMinutes)
    const schedule = prepareTaskSchedule(taskSchedule)

    if (!trimmedTitle) {
      setFormError('عنوان کار را وارد کنید.')
      return
    }
    if (!taskScheduledFor) {
      setFormError('تاریخ کار را انتخاب کنید.')
      return
    }
    if (trimmedTitle.length > 200 || trimmedDescription.length > 2000) {
      setFormError('عنوان یا توضیحات از طول مجاز بیشتر است.')
      return
    }
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)) {
      setFormError('زمان تخمینی باید عددی صحیح بین ۱ تا ۱۴۴۰ دقیقه باشد.')
      return
    }
    if (!schedule.ok) {
      setFormError(schedule.message)
      return
    }
    const taskContent = prepareTaskContent(contentType, taskCurriculum)
    if (!taskContent.ok) {
      setFormError(taskContent.message)
      return
    }

    setIsSubmittingTask(true)
    try {
      const created = await planningClient.createTask({
        contentType: taskContent.contentType,
        ...(taskContent.contentType === 'STUDY'
          ? { curriculumSelection: taskContent.curriculumSelection }
          : {}),
        description: trimmedDescription || null,
        endMinuteOfDay: schedule.value.endMinuteOfDay,
        estimatedMinutes: minutes,
        scheduledFor: taskScheduledFor,
        startMinuteOfDay: schedule.value.startMinuteOfDay,
        subjectId: taskContent.subjectId,
        title: trimmedTitle,
        topicId: taskContent.topicId,
      })
      if (taskMatchesFilters(created)) {
        setTasks((current) => mergeTasks([created, ...current]))
        setFormSuccess('کار تازه به برنامه امروز اضافه شد.')
      } else {
        setFormSuccess('کار ساخته شد و به‌دلیل فیلتر فعلی در فهرست دیده نمی‌شود.')
      }
      setTitle('')
      setDescription('')
      setEstimatedMinutes('')
      setTaskSchedule(createScheduleDraft())
      setTaskScheduledFor(todayKey)
      setContentType('')
      setTaskCurriculum(createEmptyPlanningCurriculumValue())
    } catch (error) {
      setFormError(planningErrorMessage(error))
    } finally {
      setIsSubmittingTask(false)
    }
  }

  const handleCurriculumSelectionChange = async (
    task: DailyTask,
    draft: PlanningCurriculumValue,
  ) => {
    setActionError(null)
    setUpdatingCurriculumTaskIds((current) => new Set(current).add(task.id))
    try {
      const result = await replaceChangedPlanningCurriculum(
        task.curriculum.targets,
        draft,
        curriculumEditContext(task),
        (curriculumSelection) => planningClient.replaceTaskCurriculumSelection(task.id, curriculumSelection),
      )
      if (result.kind === 'REPLACED') {
        setTasks((current) => current.map((item) => item.id === result.value.id ? result.value : item))
      } else if (result.kind === 'READ_ONLY') {
        setActionError('مباحث این کار در حال حاضر فقط قابل مشاهده هستند.')
      }
    } catch (error) {
      setActionError(planningErrorMessage(error))
    } finally {
      setUpdatingCurriculumTaskIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  const curriculumEditContext = (task: DailyTask) => ({
    actor: 'student' as const,
    contentType: task.contentType,
    source: task.source,
    status: task.status,
    completedItemCount: task.curriculum.completedItemCount,
    hasActiveStudySession: activeSession?.dailyTaskId === task.id,
    hasStudyHistory: taskStudyHistory[task.id] !== 'NONE',
  })

  const showOverdueGroup = shouldShowOverdueGroup(
    overdueTasks.length,
    overdueNextCursor,
  )

  return (
    <div className="page-stack planning-page">
      <Card className="planning-hero">
        <div>
          <p className="eyebrow">برنامه روزانه من</p>
          <h2>امروز چه کاری پیش رو داری؟</h2>
          <p>{todayLabel}</p>
        </div>
        <div className="planning-hero__actions">
          <Button onClick={() => navigate('/planning/weekly')} variant="secondary">
            نمای هفتگی
          </Button>
          <Button onClick={() => {
            setIsCreateOpen((current) => !current)
            setFormError(null)
            setFormSuccess(null)
          }}>
            {isCreateOpen ? 'بستن فرم' : 'افزودن کار امروز'}
          </Button>
        </div>
      </Card>

      {!executionReady && (
        <p className="planning-alert" role="status">در حال بازیابی مطالعه فعال…</p>
      )}

      {visibleExecutionError && (
        <div className="planning-alert" role="alert">
          <span>{visibleExecutionError}</span>
          <Button onClick={() => void restoreActiveExecution()} variant="ghost">تلاش دوباره</Button>
        </div>
      )}

      {activeSession && (
        <ActiveStudyExecutionCard
          activeSession={activeSession}
          activeTaskTitle={activeTaskTitle}
          busy={executionBusy}
          key={activeSession.id}
          onCancel={() => {
            setCancelConfirmationOpen(true)
            setSwitchTarget(null)
            setExecutionError(null)
          }}
          onFinish={async () => {
            try {
              await handleExecutionFinish(activeSession.id, {})
            } catch (error) {
              setExecutionError(planningErrorMessage(error))
            }
          }}
          onPause={async () => {
            setExecutionError(null)
            try {
              await studyTimer.pause()
            } catch (error) {
              setExecutionError(planningErrorMessage(error))
            }
          }}
          onResume={async () => {
            setExecutionError(null)
            try {
              await studyTimer.resume()
            } catch (error) {
              setExecutionError(planningErrorMessage(error))
            }
          }}
        />
      )}

      {!activeSession && studyTimer.lastFinishedSession && (
        <FinishedStudyExecutionCard
          session={studyTimer.lastFinishedSession}
          taskTitle={studyTimer.lastFinishedTaskTitle}
        />
      )}

      {cancelConfirmationOpen && activeSession && (
        <Card className="study-switch-card">
          <div>
            <p className="eyebrow">لغو بازه مطالعه</p>
            <h2>این بازه از سابقه حذف نمی‌شود</h2>
            <p>
              {cancelStudyConsequenceMessage}
            </p>
          </div>
          <div className="study-switch-card__actions">
            <Button disabled={executionBusy} onClick={() => void confirmExecutionCancel()}>
              {executionBusy ? 'در حال لغو…' : 'تأیید لغو این بازه'}
            </Button>
            <Button
              disabled={executionBusy}
              onClick={() => setCancelConfirmationOpen(false)}
              variant="ghost"
            >
              ادامه مطالعه فعلی
            </Button>
          </div>
        </Card>
      )}

      {switchTarget && activeSession && (
        <Card className="study-switch-card">
          <div>
            <p className="eyebrow">تغییر مطالعه</p>
            <h2>{activeTaskTitle ?? 'مطالعه فعلی'} اکنون فعال است</h2>
            <p>
              برای شروع «{switchTarget.title}»، انتخاب کنید بازه فعلی ثبت شود یا بدون محاسبه زمان لغو شود.
            </p>
          </div>
          <div className="study-switch-card__actions">
            <Button
              disabled={executionBusy}
              onClick={() => void confirmExecutionSwitch(switchExecutionChoices.FINISH)}
            >
              {executionBusy
                ? 'در حال تغییر…'
                : `پایان ${activeTaskTitle ?? 'مطالعه فعلی'} و شروع ${switchTarget.title}`}
            </Button>
            <Button
              disabled={executionBusy}
              onClick={() => void confirmExecutionSwitch(switchExecutionChoices.CANCEL)}
              variant="secondary"
            >
              {executionBusy
                ? 'در حال تغییر…'
                : `لغو این بازه و شروع ${switchTarget.title}`}
            </Button>
            <Button
              disabled={executionBusy}
              data-choice={switchExecutionChoices.CONTINUE}
              onClick={() => setSwitchTarget(null)}
              variant="ghost"
            >
              ادامه {activeTaskTitle ?? 'مطالعه فعلی'}
            </Button>
          </div>
        </Card>
      )}

      {isCreateOpen && (
        <Card className="planning-create-card" title="کار شخصی تازه">
          <form className="planning-form" onSubmit={handleTaskSubmit}>
            <fieldset className="task-content-type">
              <legend>نوع کار</legend>
              <label><input checked={contentType === 'STUDY'} name="student-task-content-type" onChange={() => { setContentType('STUDY'); setTaskCurriculum(createEmptyPlanningCurriculumValue()) }} type="radio" />درسی</label>
              <label><input checked={contentType === 'GENERAL'} name="student-task-content-type" onChange={() => { setContentType('GENERAL'); setTaskCurriculum(createEmptyPlanningCurriculumValue()) }} type="radio" />عمومی</label>
            </fieldset>
            <label htmlFor="task-title">
              عنوان کار
              <input
                autoFocus
                id="task-title"
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="مثلاً مرور فصل حرکت"
                required
                value={title}
              />
            </label>

            <div className="planning-form__row">
              <label htmlFor="task-date">
                تاریخ انجام
                <input id="task-date" onChange={(event) => setTaskScheduledFor(event.target.value)} required type="date" value={taskScheduledFor} />
                <small>تاریخ شمسی: {formatJalaliDate(taskScheduledFor)}</small>
              </label>
              <label htmlFor="task-minutes">
                مدت تخمینی مطالعه (دقیقه)
                <input
                  id="task-minutes"
                  inputMode="numeric"
                  max={1440}
                  min={1}
                  onChange={(event) => setEstimatedMinutes(event.target.value)}
                  placeholder="مثلاً ۴۵"
                  type="number"
                  value={estimatedMinutes}
                />
              </label>
            </div>

            <TaskScheduleFields
              idPrefix="student-task-schedule"
              onChange={setTaskSchedule}
              value={taskSchedule}
            />

            {contentType === 'STUDY' ? <PlanningCurriculumField
              audience="student"
              client={curriculumClient}
              onChange={setTaskCurriculum}
              value={taskCurriculum}
            /> : null}

            <label htmlFor="task-description">
              توضیحات (اختیاری)
              <textarea
                id="task-description"
                maxLength={2000}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="جزئیات کوتاه این کار"
                rows={3}
                value={description}
              />
            </label>

            {formError && <p className="form-error" role="alert">{formError}</p>}
            {formSuccess && <p className="form-success" role="status">{formSuccess}</p>}
            <div className="planning-form__actions">
              <Button disabled={isSubmittingTask} type="submit">
                {isSubmittingTask ? 'در حال افزودن…' : 'افزودن به امروز'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <section aria-labelledby="today-summary-title">
        <div className="section-heading">
          <div>
            <h2 id="today-summary-title">خلاصه کارهای بارگذاری‌شده</h2>
            <p>{numberFormatter.format(tasks.length)} کار مطابق فیلتر فعلی</p>
          </div>
        </div>
        <div className="summary-grid planning-summary">
          {(['PENDING', 'COMPLETED', 'SKIPPED'] as DailyTaskStatus[]).map((status) => (
            <Card className={`summary-card summary-card--${status.toLowerCase()}`} key={status}>
              <span>{statusLabels[status]}</span>
              <strong>{numberFormatter.format(summary[status])}</strong>
              <small>در صفحه‌های بارگذاری‌شده</small>
            </Card>
          ))}
        </div>
      </section>

      <Card className="planning-list-card">
        <div className="planning-toolbar">
          <div>
            <h2>کارهای امروز</h2>
            <p>فهرست بر اساس روز تقویمی تهران دریافت می‌شود.</p>
          </div>
          <div className="planning-filters" aria-label="فیلتر کارهای امروز">
            <label htmlFor="status-filter">
              وضعیت
              <select
                id="status-filter"
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                value={statusFilter}
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="PENDING">در انتظار انجام</option>
                <option value="COMPLETED">انجام‌شده</option>
                <option value="SKIPPED">ردشده</option>
              </select>
            </label>
            <label htmlFor="subject-filter">
              درس
              <select
                id="subject-filter"
                onChange={(event) => setSubjectFilter(event.target.value)}
                value={subjectFilter}
              >
                <option value="ALL">همه درس‌ها</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}{subject.archivedAt ? ' (بایگانی‌شده)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {subjectError && (
          <div className="planning-alert" role="alert">
            <span>{subjectError}</span>
            <Button onClick={() => void refreshSubjects()} variant="ghost">تلاش دوباره برای درس‌ها</Button>
          </div>
        )}
        {actionError && <div className="planning-alert" role="alert">{actionError}</div>}
        {listError && tasks.length > 0 && <div className="planning-alert" role="alert">{listError}</div>}
        {overdueError && <div className="planning-alert" role="alert">{overdueError}</div>}
        {isLoadingOverdue && (
          <p className="task-group__loading" role="status">در حال دریافت کارهای عقب‌افتاده…</p>
        )}

        {isInitialLoading ? (
          <ContentState
            description="کارهای امروز از فضای امن شما دریافت می‌شوند."
            kind="loading"
            title="در حال دریافت برنامه امروز"
          />
        ) : listError && tasks.length === 0 ? (
          <ContentState
            action={<Button onClick={() => setRefreshKey((current) => current + 1)}>تلاش دوباره</Button>}
            description={listError}
            kind="error"
            title="برنامه امروز دریافت نشد"
          />
        ) : tasks.length === 0 && !showOverdueGroup && !isLoadingOverdue ? (
          <ContentState
            action={<Button onClick={() => setIsCreateOpen(true)}>ساخت اولین کار امروز</Button>}
            description="برای فیلتر فعلی کاری وجود ندارد. می‌توانید یک کار شخصی برای امروز بسازید."
            kind="empty"
            title="فهرست امروز خالی است"
          />
        ) : (
          <div className="task-groups">
            {([
              ...(showOverdueGroup ? [{ id: 'overdue', items: overdueTasks, title: 'ادامه کارهای عقب‌افتاده' }] : []),
              ...(tasks.length > 0 ? [{ id: 'today', items: tasks, title: 'کارهای امروز' }] : []),
            ] as const).map((group) => (
              <section className="task-group" key={group.id}>
                <div className="task-group__heading">
                  <h3>{group.title}</h3>
                  <span>{numberFormatter.format(group.items.length)} کار</span>
                </div>
                <div className="task-list">
            {group.items.map((task) => {
              const subject = task.subjectId ? subjectById.get(task.subjectId) : undefined
              const isUpdating = updatingTaskIds.has(task.id)
              const isUpdatingCurriculum = updatingCurriculumTaskIds.has(task.id)
              const isUpdatingExecution = updatingExecutionTaskIds.has(task.id)
              const taskCurriculumValue = planningCurriculumValueFromSnapshots(task.curriculum.targets)
              const executionItems = curriculumExecutionItems(task.curriculum.targets)
              const completionState = taskCompletionState(task.curriculum)
              const scheduleDraft = scheduleDrafts[task.id] ?? {
                ...scheduleDraftFromTask(task.startMinuteOfDay, task.endMinuteOfDay),
                scheduledFor: task.scheduledFor.slice(0, 10),
              }
              const canToggleExecutionItems = canToggleCurriculumExecutionItems({
                contentType: task.contentType,
                source: task.source,
                status: task.status,
                totalItemCount: task.curriculum.totalItemCount,
              })
              const presentation = classifyTaskPresentation(task, todayKey)
              const presentationClass = presentation.status.toLowerCase().replaceAll('_', '-')
              const isExpanded = expandedTaskId === task.id
              const sessionPanelMode = studySessionPanelMode(task.contentType)

              return (
                <article className={`task-item task-item--${task.status.toLowerCase()} task-presentation--${presentationClass}`} key={task.id}>
                  <button
                    aria-controls={`task-details-${task.id}`}
                    aria-expanded={isExpanded}
                    className="task-item__summary-toggle"
                    onClick={() => setExpandedTaskId((current) => toggleExpandedTask(current, task.id))}
                    type="button"
                  >
                    <span className="task-item__summary-main">
                      <strong>{task.title}</strong>
                      <span className="task-item__summary-meta">
                        <span>{task.source === 'COUNSELOR' ? 'تعیین‌شده توسط مشاور' : 'کار شخصی'}</span>
                        <span>{formatJalaliDate(task.scheduledFor.slice(0, 10))}</span>
                        <span>{formatTaskSchedule(task.startMinuteOfDay, task.endMinuteOfDay)}</span>
                        {task.contentType === 'STUDY' && (
                          <span>{numberFormatter.format(task.actualSolvedTestCount)} تست حل‌شده</span>
                        )}
                        {task.curriculum.totalItemCount > 0 && (
                          <span>{formatCurriculumProgress(task.curriculum.completedItemCount, task.curriculum.totalItemCount)}</span>
                        )}
                      </span>
                    </span>
                    <span className={`task-status task-status--${task.status.toLowerCase()} task-presentation-badge--${presentationClass}`}>
                      {presentation.label}
                    </span>
                    <span aria-hidden="true" className="task-item__chevron">⌄</span>
                  </button>
                  <div
                    aria-hidden={!isExpanded}
                    className={`task-item__collapsible${isExpanded ? ' is-expanded' : ''}`}
                    id={`task-details-${task.id}`}
                    inert={isExpanded ? undefined : true}
                  >
                    <div className="task-item__collapsible-inner">
                  <div className="task-item__main">
                    <div className="task-item__heading">
                      <h3>{task.title}</h3>
                      <span className={`task-status task-status--${task.status.toLowerCase()} task-presentation-badge--${presentationClass}`}>
                        {presentation.label}
                      </span>
                    </div>
                    {presentation.indicatorLabel && (
                      <small className="task-presentation-indicator">{presentation.indicatorLabel}</small>
                    )}
                    <div className="task-meta">
                      <span>{task.contentType === 'STUDY' ? 'درسی' : task.contentType === 'GENERAL' ? 'عمومی' : 'ثبت تاریخی'}</span>
                      {task.subjectId ? <span>{subject?.name ?? 'درس نامشخص'}</span> : null}
                      {task.source === 'COUNSELOR' && (
                        <span className="task-source--counselor">تعیین‌شده توسط مشاور</span>
                      )}
                      <span>{formatJalaliDate(task.scheduledFor.slice(0, 10))}</span>
                      <span>{formatTaskSchedule(task.startMinuteOfDay, task.endMinuteOfDay)}</span>
                      {task.estimatedMinutes !== null && (
                        <span>مدت تخمینی: {numberFormatter.format(task.estimatedMinutes)} دقیقه</span>
                      )}
                      {task.plannedTestCount > 0 && (
                        <span>{numberFormatter.format(task.plannedTestCount)} تست برنامه‌ریزی‌شده</span>
                      )}
                      {task.status === 'SKIPPED' && task.skipReason && (
                        <span className="task-skip-reason-display">
                          دلیل رد کردن: {skipReasonLabels[task.skipReason]}
                        </span>
                      )}
                    </div>
                    {task.description && <p className="task-description">{task.description}</p>}
                    {task.curriculum.totalItemCount > 0 && (
                      <p className="task-curriculum-progress">
                        {formatCurriculumProgress(
                          task.curriculum.completedItemCount,
                          task.curriculum.totalItemCount,
                        )}
                      </p>
                    )}
                    {(task.contentType === 'STUDY' || task.curriculum.targets.length > 0) ? (
                      <PlanningCurriculumField
                        audience="student"
                        client={curriculumClient}
                        minimumOne={task.contentType === 'STUDY'}
                        disabled={!canReplacePlanningCurriculum(curriculumEditContext(task))
                          || updatingCurriculumTaskIds.has(task.id)}
                        disabledReason={task.contentType === null
                              ? 'این کار تاریخی است و مباحث آن فقط نمایش داده می‌شوند.'
                            : task.source !== 'PERSONAL'
                          ? 'مباحث کار تعیین‌شده توسط مشاور فقط خواندنی است.'
                          : task.status !== 'PENDING' || task.curriculum.completedItemCount > 0 || activeSession?.dailyTaskId === task.id || taskStudyHistory[task.id] === 'PRESENT'
                            ? 'به‌دلیل شروع یا نهایی‌شدن کار، مباحث فقط خواندنی هستند.'
                            : taskStudyHistory[task.id] === 'LOADING'
                              ? 'در حال بررسی سابقه مطالعه…'
                            : taskStudyHistory[task.id] === 'ERROR'
                              ? 'سابقه مطالعه قابل بررسی نیست؛ ویرایش مباحث موقتاً غیرفعال است.'
                            : updatingCurriculumTaskIds.has(task.id)
                              ? 'در حال ثبت مباحث…'
                              : undefined}
                        onChange={(draft) => void handleCurriculumSelectionChange(task, draft)}
                        value={taskCurriculumValue}
                      />
                    ) : null}
                    {canToggleExecutionItems && executionItems.length > 0 && (
                      <fieldset
                        aria-busy={isUpdatingExecution}
                        className="task-curriculum-execution"
                        disabled={isUpdating || isUpdatingCurriculum || isUpdatingExecution}
                      >
                        <legend>مباحث انجام‌شده</legend>
                        <p>
                          این فهرست میزان انجام محتوای کار را ثبت می‌کند و از زمان مطالعه مستقل است.
                        </p>
                        <ul>
                          {executionItems.map((item) => (
                            <li key={item.id}>
                              <label htmlFor={`task-curriculum-item-${item.id}`}>
                                <input
                                  checked={item.completedAt !== null}
                                  id={`task-curriculum-item-${item.id}`}
                                  onChange={(event) => void handleCurriculumItemToggle(
                                    task,
                                    item,
                                    event.currentTarget.checked,
                                  )}
                                  type="checkbox"
                                />
                                <span>
                                  <strong>{item.labelSnapshot}</strong>
                                  {item.pathSnapshot.length > 1 && (
                                    <small>{item.pathSnapshot.slice(0, -1).join(' ← ')}</small>
                                  )}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                        {isUpdatingExecution && <small role="status">در حال ثبت تغییر مبحث…</small>}
                      </fieldset>
                    )}
                    {task.source === 'PERSONAL' && (
                      <form
                        className="task-schedule"
                        onSubmit={(event) => {
                          event.preventDefault()
                          void handleScheduleUpdate(task)
                        }}
                      >
                        <label htmlFor={`task-schedule-${task.id}`}>
                          تغییر تاریخ
                          <input
                            id={`task-schedule-${task.id}`}
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
                          disabled={reschedulingTaskIds.has(task.id)}
                          idPrefix={`student-task-${task.id}-schedule`}
                          onChange={(value) => setScheduleDrafts((current) => ({
                            ...current,
                            [task.id]: { ...value, scheduledFor: scheduleDraft.scheduledFor },
                          }))}
                          value={scheduleDraft}
                        />
                        <Button
                          disabled={
                            reschedulingTaskIds.has(task.id)
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
                          {reschedulingTaskIds.has(task.id) ? 'در حال ثبت…' : 'ثبت زمان‌بندی'}
                        </Button>
                      </form>
                    )}
                    {canRecordSolvedTestProgress(task.contentType, task.status) && (
                      <form
                        className="task-progress"
                        onSubmit={(event) => {
                          event.preventDefault()
                          void handleProgressUpdate(task)
                        }}
                      >
                        <label htmlFor={`task-progress-${task.id}`}>
                          تعداد تست حل‌شده
                          <input
                            id={`task-progress-${task.id}`}
                            inputMode="numeric"
                            min="0"
                            onChange={(event) => setProgressDrafts((current) => ({
                              ...current,
                              [task.id]: {
                                ...progressDraftForTask(
                                  current[task.id],
                                  task.actualSolvedTestCount,
                                  task.updatedAt,
                                ),
                                count: event.target.value,
                              },
                            }))}
                            step="1"
                            type="number"
                            value={progressDraftForTask(
                              progressDrafts[task.id],
                              task.actualSolvedTestCount,
                              task.updatedAt,
                            ).count}
                          />
                        </label>
                        <Button
                          disabled={savingProgressTaskIds.has(task.id)}
                          type="submit"
                          variant="secondary"
                        >
                          {savingProgressTaskIds.has(task.id) ? 'در حال ثبت…' : 'ثبت پیشرفت'}
                        </Button>
                        <small>این مقدار مجموع تست‌های حل‌شده برای همین کار است و نتیجه کار را تغییر نمی‌دهد.</small>
                      </form>
                    )}
                    {sessionPanelMode !== 'HIDDEN' && (
                      <TaskExecutionPanel
                        activeSession={activeSession}
                        executionReady={executionReady && !executionBusy}
                        executionRevision={executionRevision}
                        onFinish={handleExecutionFinish}
                        onPause={studyTimer.pause}
                        onResume={studyTimer.resume}
                        onStart={handleExecutionStart}
                        readOnly={sessionPanelMode === 'READ_ONLY'}
                        taskId={task.id}
                        taskStatus={task.status}
                        taskTitle={task.title}
                      />
                    )}
                  </div>
                  {task.status === 'PENDING' && (
                    <div className="task-actions" aria-label={`اقدام‌های ${task.title}`}>
                      <div className="task-completion-action">
                        <Button
                          aria-describedby={!completionState.canComplete
                            ? `task-completion-help-${task.id}`
                            : undefined}
                          disabled={isUpdating
                            || isUpdatingCurriculum
                            || isUpdatingExecution
                            || !completionState.canComplete}
                          onClick={() => void handleStatusUpdate(task, 'COMPLETED')}
                        >
                          {isUpdating ? 'در حال ثبت…' : 'انجام شد'}
                        </Button>
                        {!completionState.canComplete && (
                          <small id={`task-completion-help-${task.id}`}>
                            {completionState.explanation}
                          </small>
                        )}
                      </div>
                      <label className="task-skip-reason" htmlFor={`task-skip-reason-${task.id}`}>
                        دلیل رد کردن (اختیاری)
                        <select
                          disabled={isUpdating || isUpdatingCurriculum || isUpdatingExecution}
                          id={`task-skip-reason-${task.id}`}
                          onChange={(event) => setSkipReasonDrafts((current) => ({
                            ...current,
                            [task.id]: event.target.value as DailyTaskSkipReason | '',
                          }))}
                          value={skipReasonDrafts[task.id] ?? ''}
                        >
                          <option value="">بدون ثبت دلیل</option>
                          {Object.entries(skipReasonLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <Button
                        disabled={isUpdating || isUpdatingCurriculum || isUpdatingExecution}
                        onClick={() => void handleStatusUpdate(
                          task,
                          'SKIPPED',
                          skipReasonDrafts[task.id] || null,
                        )}
                        variant="ghost"
                      >
                        رد کردن
                      </Button>
                    </div>
                  )}
                    </div>
                  </div>
                </article>
              )
            })}
                </div>
                {group.id === 'overdue' && overdueNextCursor && (
                  <div className="load-more">
                    <Button disabled={isLoadingMoreOverdue} onClick={() => void handleLoadMoreOverdue()} variant="secondary">
                      {isLoadingMoreOverdue ? 'در حال دریافت…' : 'نمایش کارهای عقب‌افتاده بیشتر'}
                    </Button>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {nextCursor && !isInitialLoading && tasks.length > 0 && (
          <div className="load-more">
            <Button disabled={isLoadingMore} onClick={() => void handleLoadMore()} variant="secondary">
              {isLoadingMore ? 'در حال دریافت…' : 'نمایش کارهای بیشتر'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
