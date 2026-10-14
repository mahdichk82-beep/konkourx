import type { FormEvent } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
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
import type {
  BrowserNavigate,
  BrowserNavigationAttempt,
  BrowserNavigationBlocker,
} from '../routing/useBrowserRouter'
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
import { TaskResultFlow } from '../planning/TaskResultFlow'
import { TodayTaskWorkspace } from '../planning/TodayTaskWorkspace'
import { useStudyTimer, useStudyTimerElapsed } from '../planning/useStudyTimer'
import { finalStudySessionElapsedMs } from '../planning/study-timer'
import { useTehranTodayKey } from '../planning/useTehranTodayKey'
import { TaskScheduleFields } from '../planning/TaskScheduleFields'
import {
  prepareTaskContent,
  taskOccursBeforeDate,
  taskOccursOnDate,
} from '../planning/task-content'
import {
  createScheduleDraft,
  formatJalaliDate,
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
  taskOutcomeErrorCodeMessage,
} from '../planning/task-completion'
import {
  overdueLoadRequestKey,
  shouldApplyOverdueLoadMoreResponse,
  shouldShowOverdueGroup,
  studySessionPanelMode,
} from '../planning/task-progress'
import {
  createLatestTaskRouteLoader,
  detailNavigationReducer,
  initialDetailNavigationState,
  planningTaskIdForPath,
  planningTaskPath,
  type TodayTaskAction,
} from '../planning/today-workspace'

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
  onResult,
  onPause,
  onResume,
}: {
  activeSession: StudySession
  activeTaskTitle: string | null
  busy: boolean
  onCancel(): void
  onResult(): Promise<void>
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
        <Button disabled={busy} onClick={() => void onResult()} variant="secondary">
          {busy ? 'در حال ثبت…' : 'پایان و ثبت نتیجه'}
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

export function TodayPlanningPage({
  navigate,
  setNavigationBlocker,
  taskId,
}: {
  navigate: BrowserNavigate
  setNavigationBlocker(blocker: BrowserNavigationBlocker | null): () => void
  taskId: string | null
}) {
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
  const [detailNavigation, dispatchDetailNavigation] = useReducer(
    detailNavigationReducer,
    initialDetailNavigationState,
  )
  const [selectedExternalTask, setSelectedExternalTask] = useState<DailyTask | null>(null)
  const [routeTaskLoad, setRouteTaskLoad] = useState<{
    error: string | null
    status: 'LOADING' | 'READY'
    taskId: string
  } | null>(null)
  const [routeTaskRetryKey, setRouteTaskRetryKey] = useState(0)
  const [resultTaskId, setResultTaskId] = useState<string | null>(null)
  const [dirtyResultTaskId, setDirtyResultTaskId] = useState<string | null>(null)
  const [uncertainResultTaskId, setUncertainResultTaskId] = useState<string | null>(null)
  const [pendingDetailNavigation, setPendingDetailNavigation] = useState<
    { showResult?: boolean; taskId: string; type: 'OPEN' } | { type: 'CLOSE' } | null
  >(null)
  const [pendingRouteNavigation, setPendingRouteNavigation] = useState<
    BrowserNavigationAttempt | null
  >(null)
  const allowNextNavigationRef = useRef(false)
  const routeTaskLoaderRef = useRef(createLatestTaskRouteLoader())
  const detailHeadingRef = useRef<HTMLHeadingElement>(null)
  const listSurfaceRef = useRef<HTMLDivElement>(null)

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
  const overdueQueryKey = overdueLoadRequestKey(todayKey, refreshKey)
  const overdueQueryKeyRef = useRef(overdueQueryKey)

  useEffect(() => {
    currentQueryKeyRef.current = currentQueryKey
  }, [currentQueryKey])

  useLayoutEffect(() => {
    overdueQueryKeyRef.current = overdueQueryKey
  }, [overdueQueryKey])

  useEffect(() => {
    if (detailNavigation.selectedTaskId) {
      detailHeadingRef.current?.focus()
      return
    }
    if (!detailNavigation.returnFocusTaskId) return
    const taskControl = document.querySelector<HTMLElement>(
      `[data-task-focus-id="${CSS.escape(detailNavigation.returnFocusTaskId)}"]`,
    )
    if (taskControl) taskControl.focus()
    else listSurfaceRef.current?.focus()
  }, [detailNavigation.returnFocusTaskId, detailNavigation.selectedTaskId])

  useEffect(() => {
    const loader = routeTaskLoaderRef.current
    if (!taskId) {
      loader.invalidate()
      setRouteTaskLoad(null)
      setSelectedExternalTask(null)
      setResultTaskId(null)
      dispatchDetailNavigation({ type: 'CLOSE' })
      return
    }

    setRouteTaskLoad({ error: null, status: 'LOADING', taskId })
    setSelectedExternalTask((current) => current?.id === taskId ? current : null)
    void loader.load(taskId, () => planningClient.getTask(taskId)).then((result) => {
      if (result.status === 'STALE') return
      setSelectedExternalTask(result.value)
      setRouteTaskLoad({ error: null, status: 'READY', taskId: result.taskId })
      setResultTaskId((current) => current === taskId ? current : null)
      dispatchDetailNavigation({ taskId: result.taskId, type: 'OPEN' })
    }).catch((error: unknown) => {
      setSelectedExternalTask(null)
      setRouteTaskLoad({ error: planningErrorMessage(error), status: 'READY', taskId })
    })

    return () => loader.invalidate()
  }, [routeTaskRetryKey, taskId])

  useEffect(() => setNavigationBlocker((attempt) => {
    if (allowNextNavigationRef.current) {
      allowNextNavigationRef.current = false
      return false
    }
    const nextTaskId = planningTaskIdForPath(attempt.nextPath)
    if (nextTaskId === taskId || (!dirtyResultTaskId && !uncertainResultTaskId)) return false
    setPendingRouteNavigation(attempt)
    return true
  }), [dirtyResultTaskId, setNavigationBlocker, taskId, uncertainResultTaskId])

  useEffect(() => {
    if (!dirtyResultTaskId && !uncertainResultTaskId) return
    const protectDraft = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', protectDraft)
    return () => window.removeEventListener('beforeunload', protectDraft)
  }, [dirtyResultTaskId, uncertainResultTaskId])

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
    const editableTaskIds = mergeTasks([
      ...overdueTasks,
      ...tasks,
      ...(selectedExternalTask ? [selectedExternalTask] : []),
    ]).filter((task) => (
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
  }, [tasks, overdueTasks, selectedExternalTask, executionRevision])

  const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name]))
  const summary = summarizeTaskPresentations(tasks, todayKey)

  const taskMatchesFilters = (task: DailyTask): boolean =>
    taskOccursOnDate(task.scheduledFor, todayKey) &&
    (statusFilter === 'ALL' || task.status === statusFilter) &&
    (subjectFilter === 'ALL' || task.subjectId === subjectFilter)

  const isOverdueTask = (task: DailyTask): boolean =>
    task.status === 'PENDING' && taskOccursBeforeDate(task.scheduledFor, todayKey)

  const replaceTaskFromServer = (updated: DailyTask) => {
    setSelectedExternalTask((current) => (
      current?.id === updated.id || taskId === updated.id
        ? updated
        : current
    ))
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

  const reconcileTaskFromServer = async (taskId: string): Promise<DailyTask | null> => {
    try {
      const updated = await planningClient.getTask(taskId)
      replaceTaskFromServer(updated)
      return updated
    } catch (error) {
      if (error instanceof AuthApiError && error.code === 'TASK_NOT_FOUND') {
        setTasks((current) => current.filter((item) => item.id !== taskId))
        setOverdueTasks((current) => current.filter((item) => item.id !== taskId))
        setSelectedExternalTask((current) => current?.id === taskId ? null : current)
      }
      return null
    }
  }

  const selectedTask = taskId
    && routeTaskLoad?.status === 'READY'
    && !routeTaskLoad.error
    && routeTaskLoad.taskId === taskId
    && detailNavigation.selectedTaskId === taskId
    && selectedExternalTask?.id === taskId
      ? selectedExternalTask
      : null

  const completeDetailNavigation = (
    navigation: { showResult?: boolean; taskId: string; type: 'OPEN' } | { type: 'CLOSE' },
  ) => {
    setActionError(null)
    setResultTaskId(navigation.type === 'OPEN' && navigation.showResult ? navigation.taskId : null)
    if (navigation.type === 'OPEN') {
      navigate(planningTaskPath(navigation.taskId), false, { preserveScroll: true })
    } else {
      navigate('/planning', false, { preserveScroll: true })
    }
  }

  const requestDetailNavigation = (
    navigation: { showResult?: boolean; taskId: string; type: 'OPEN' } | { type: 'CLOSE' },
  ) => {
    const destinationTaskId = navigation.type === 'OPEN' ? navigation.taskId : null
    if (
      (uncertainResultTaskId && uncertainResultTaskId !== destinationTaskId)
      || (dirtyResultTaskId && dirtyResultTaskId !== destinationTaskId)
    ) {
      setPendingDetailNavigation(navigation)
      return
    }
    completeDetailNavigation(navigation)
  }

  const openTaskDetail = (taskId: string) => {
    requestDetailNavigation({ taskId, type: 'OPEN' })
  }

  const openTaskResult = (taskId: string) => {
    if (
      (uncertainResultTaskId && uncertainResultTaskId !== taskId)
      || (dirtyResultTaskId && dirtyResultTaskId !== taskId)
    ) {
      setPendingDetailNavigation({ showResult: true, taskId, type: 'OPEN' })
      return
    }
    completeDetailNavigation({ showResult: true, taskId, type: 'OPEN' })
  }

  const openActiveTaskDetail = async () => {
    if (!activeSession?.dailyTaskId) {
      setActionError('کار مرتبط با مطالعه فعال در دسترس نیست.')
      return
    }
    openTaskResult(activeSession.dailyTaskId)
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
    const requestKey = overdueQueryKey
    setIsLoadingMoreOverdue(true)
    setOverdueError(null)
    try {
      const page = await planningClient.listTasks({
        cursor: overdueNextCursor,
        limit: 20,
        overdueBefore: todayKey,
        status: 'PENDING',
      })
      if (!shouldApplyOverdueLoadMoreResponse(requestKey, overdueQueryKeyRef.current)) return
      setOverdueTasks((current) => mergeTasks([...current, ...page.items]))
      setOverdueNextCursor(page.nextCursor)
    } catch (error) {
      if (shouldApplyOverdueLoadMoreResponse(requestKey, overdueQueryKeyRef.current)) {
        setOverdueError(planningErrorMessage(error))
      }
    } finally {
      if (shouldApplyOverdueLoadMoreResponse(requestKey, overdueQueryKeyRef.current)) {
        setIsLoadingMoreOverdue(false)
      }
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

  const handleWorkspaceAction = (task: DailyTask, action: TodayTaskAction) => {
    if (action === 'START_STUDY' || action === 'SWITCH_STUDY') {
      void handleExecutionStart(task.id, task.title).catch((error: unknown) => {
        setExecutionError(planningErrorMessage(error))
      })
      return
    }
    if (action === 'RECORD_RESULT' || action === 'FINISH_AND_RECORD') {
      openTaskResult(task.id)
      return
    }
    openTaskDetail(task.id)
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
        replaceTaskFromServer(result.value)
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

  const selectedScheduleDraft = selectedTask ? scheduleDrafts[selectedTask.id] ?? {
    ...scheduleDraftFromTask(selectedTask.startMinuteOfDay, selectedTask.endMinuteOfDay),
    scheduledFor: selectedTask.scheduledFor.slice(0, 10),
  } : null
  const selectedSessionPanelMode = selectedTask
    ? studySessionPanelMode(selectedTask.contentType)
    : 'HIDDEN'
  const selectedIsUpdating = selectedTask ? updatingTaskIds.has(selectedTask.id) : false
  const selectedIsUpdatingCurriculum = selectedTask
    ? updatingCurriculumTaskIds.has(selectedTask.id)
    : false

  const detailSections = selectedTask ? {
    historyContent: selectedSessionPanelMode !== 'HIDDEN' ? (
      <TaskExecutionPanel
        executionRevision={executionRevision}
        key={selectedTask.id}
        readOnly={selectedSessionPanelMode === 'READ_ONLY' || selectedTask.status !== 'PENDING'}
        taskId={selectedTask.id}
      />
    ) : undefined,
    planContent: (
      <div className="today-task-detail__section-stack">
        {selectedTask.description && <p>{selectedTask.description}</p>}
        {(selectedTask.contentType === 'STUDY' || selectedTask.curriculum.targets.length > 0) && (
          <PlanningCurriculumField
            audience="student"
            client={curriculumClient}
            disabled={!canReplacePlanningCurriculum(curriculumEditContext(selectedTask))
              || selectedIsUpdatingCurriculum}
            disabledReason={selectedTask.contentType === null
              ? 'این کار تاریخی است و مباحث آن فقط نمایش داده می‌شوند.'
              : selectedTask.source !== 'PERSONAL'
                ? 'مباحث کار تعیین‌شده توسط مشاور فقط خواندنی است.'
                : selectedTask.status !== 'PENDING'
                  || selectedTask.curriculum.completedItemCount > 0
                  || activeSession?.dailyTaskId === selectedTask.id
                  || taskStudyHistory[selectedTask.id] === 'PRESENT'
                  ? 'به‌دلیل شروع یا نهایی‌شدن کار، مباحث فقط خواندنی هستند.'
                  : taskStudyHistory[selectedTask.id] === 'LOADING'
                    ? 'در حال بررسی سابقه مطالعه…'
                    : taskStudyHistory[selectedTask.id] === 'ERROR'
                      ? 'سابقه مطالعه قابل بررسی نیست؛ ویرایش مباحث موقتاً غیرفعال است.'
                      : selectedIsUpdatingCurriculum
                        ? 'در حال ثبت مباحث…'
                        : undefined}
            minimumOne={selectedTask.contentType === 'STUDY'}
            onChange={(draft) => void handleCurriculumSelectionChange(selectedTask, draft)}
            value={planningCurriculumValueFromSnapshots(selectedTask.curriculum.targets)}
          />
        )}
      </div>
    ),
    resultContent: resultTaskId === selectedTask.id ? (
      <TaskResultFlow
        activeSession={activeSession}
        finishSession={handleExecutionFinish}
        key={selectedTask.id}
        onDirtyChange={(dirty) => setDirtyResultTaskId(dirty ? selectedTask.id : null)}
        onMutationUncertaintyChange={(uncertain) => {
          setUncertainResultTaskId(uncertain ? selectedTask.id : null)
        }}
        onRequestClose={() => {
          setDirtyResultTaskId(null)
          setUncertainResultTaskId(null)
          allowNextNavigationRef.current = true
          completeDetailNavigation({ type: 'CLOSE' })
        }}
        onSessionReconcile={restoreActiveExecution}
        onTaskChanged={replaceTaskFromServer}
        task={selectedTask}
      />
    ) : undefined,
    scheduleContent: selectedTask.source === 'PERSONAL'
      && selectedTask.status === 'PENDING'
      && selectedScheduleDraft ? (
      <form className="task-schedule" onSubmit={(event) => {
        event.preventDefault()
        void handleScheduleUpdate(selectedTask)
      }}>
        <label htmlFor={`task-schedule-${selectedTask.id}`}>
          تغییر تاریخ
          <input
            id={`task-schedule-${selectedTask.id}`}
            onChange={(event) => setScheduleDrafts((current) => ({
              ...current,
              [selectedTask.id]: { ...selectedScheduleDraft, scheduledFor: event.target.value },
            }))}
            type="date"
            value={selectedScheduleDraft.scheduledFor}
          />
          <small>تاریخ شمسی: {formatJalaliDate(selectedScheduleDraft.scheduledFor)}</small>
        </label>
        <TaskScheduleFields
          disabled={reschedulingTaskIds.has(selectedTask.id)}
          idPrefix={`student-task-${selectedTask.id}-schedule`}
          onChange={(value) => setScheduleDrafts((current) => ({
            ...current,
            [selectedTask.id]: { ...value, scheduledFor: selectedScheduleDraft.scheduledFor },
          }))}
          value={selectedScheduleDraft}
        />
        <Button disabled={reschedulingTaskIds.has(selectedTask.id)} type="submit" variant="secondary">
          {reschedulingTaskIds.has(selectedTask.id) ? 'در حال ثبت…' : 'ثبت زمان‌بندی'}
        </Button>
      </form>
    ) : undefined,
    secondaryActionContent: selectedTask.status === 'PENDING' ? (
      <div className="task-actions" aria-label={`اقدام‌های ${selectedTask.title}`}>
        <label className="task-skip-reason" htmlFor={`task-skip-reason-${selectedTask.id}`}>
          دلیل رد کردن (اختیاری)
          <select
            disabled={selectedIsUpdating || selectedIsUpdatingCurriculum}
            id={`task-skip-reason-${selectedTask.id}`}
            onChange={(event) => setSkipReasonDrafts((current) => ({
              ...current,
              [selectedTask.id]: event.target.value as DailyTaskSkipReason | '',
            }))}
            value={skipReasonDrafts[selectedTask.id] ?? ''}
          >
            <option value="">بدون ثبت دلیل</option>
            {Object.entries(skipReasonLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <Button
          disabled={selectedIsUpdating || selectedIsUpdatingCurriculum}
          onClick={() => void handleStatusUpdate(
            selectedTask,
            'SKIPPED',
            skipReasonDrafts[selectedTask.id] || null,
          )}
          variant="ghost"
        >
          رد کردن
        </Button>
      </div>
    ) : selectedTask.status === 'SKIPPED' && selectedTask.skipReason ? (
      <p>دلیل رد کردن: {skipReasonLabels[selectedTask.skipReason]}</p>
    ) : undefined,
  } : undefined

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
          onResult={openActiveTaskDetail}
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
                <option value="PARTIAL">بخشی انجام‌شده</option>
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
        {(pendingDetailNavigation || pendingRouteNavigation) && (
          <div aria-labelledby="discard-navigation-title" className="task-result-flow__confirm" role="alertdialog">
            <p id="discard-navigation-title">
              {uncertainResultTaskId
                ? 'نتیجه یکی از درخواست‌ها هنوز از سرور مشخص نشده است. پیش از خروج، وضعیت سرور را در همین بخش بررسی کنید تا هیچ جهش تکراری انجام نشود.'
                : 'اطلاعات ذخیره‌شده حفظ می‌شوند؛ اما تغییرات محلی ذخیره‌نشده با خروج از ثبت نتیجه از دست می‌روند.'}
            </p>
            <div>
              <Button autoFocus onClick={() => {
                setPendingDetailNavigation(null)
                setPendingRouteNavigation(null)
                window.requestAnimationFrame(() => detailHeadingRef.current?.focus())
              }} variant="secondary">بازگشت و حفظ تغییرات</Button>
              {!uncertainResultTaskId && (
                <Button onClick={() => {
                  const navigation = pendingDetailNavigation
                  const routeNavigation = pendingRouteNavigation
                  setDirtyResultTaskId(null)
                  setPendingDetailNavigation(null)
                  setPendingRouteNavigation(null)
                  if (routeNavigation) routeNavigation.proceed()
                  else if (navigation) {
                    allowNextNavigationRef.current = true
                    completeDetailNavigation(navigation)
                  }
                }} variant="ghost">کنار گذاشتن تغییرات ذخیره‌نشده</Button>
              )}
            </div>
          </div>
        )}

        {taskId && (
          !routeTaskLoad
          || routeTaskLoad.taskId !== taskId
          || routeTaskLoad.status === 'LOADING'
        ) ? (
          <ContentState
            description="جزئیات همان کار، مستقل از روز برنامه‌ریزی‌شده، در حال دریافت است."
            kind="loading"
            title="در حال دریافت کار"
          />
        ) : taskId && routeTaskLoad?.error ? (
          <ContentState
            action={(
              <div className="task-actions">
                <Button onClick={() => setRouteTaskRetryKey((current) => current + 1)}>تلاش دوباره</Button>
                <Button onClick={() => navigate('/planning')} variant="secondary">بازگشت به برنامه امروز</Button>
              </div>
            )}
            description={routeTaskLoad.error}
            kind="error"
            title="این کار در دسترس نیست"
          />
        ) : isInitialLoading && !taskId ? (
          <ContentState
            description="کارهای امروز از فضای امن شما دریافت می‌شوند."
            kind="loading"
            title="در حال دریافت برنامه امروز"
          />
        ) : listError && tasks.length === 0 && !taskId ? (
          <ContentState
            action={<Button onClick={() => setRefreshKey((current) => current + 1)}>تلاش دوباره</Button>}
            description={listError}
            kind="error"
            title="برنامه امروز دریافت نشد"
          />
        ) : tasks.length === 0 && !showOverdueGroup && !isLoadingOverdue && !taskId ? (
          <ContentState
            action={<Button onClick={() => setIsCreateOpen(true)}>ساخت اولین کار امروز</Button>}
            description="برای فیلتر فعلی کاری وجود ندارد. می‌توانید یک کار شخصی برای امروز بسازید."
            kind="empty"
            title="فهرست امروز خالی است"
          />
        ) : (
          <TodayTaskWorkspace
            activeSession={activeSession}
            detailHeadingRef={detailHeadingRef}
            detailSections={detailSections}
            isLoadingMoreOverdue={isLoadingMoreOverdue}
            listSurfaceRef={listSurfaceRef}
            numberFormatter={numberFormatter}
            onAction={handleWorkspaceAction}
            onCloseDetail={() => requestDetailNavigation({ type: 'CLOSE' })}
            onLoadMoreOverdue={() => void handleLoadMoreOverdue()}
            onSelectTask={openTaskDetail}
            overdueNextCursor={overdueNextCursor}
            overdueTasks={showOverdueGroup ? overdueTasks : []}
            selectedTask={selectedTask}
            subjectNames={subjectNames}
            todayKey={todayKey}
            todayTasks={tasks}
          />
        )}
        {!isInitialLoading && tasks.length > 0 && (
          <div aria-label="خلاصه کارهای بارگذاری‌شده" className="planning-loaded-summary">
            <span>{numberFormatter.format(tasks.length)} کار مطابق فیلتر</span>
            {(['PENDING', 'COMPLETED', 'PARTIAL', 'SKIPPED'] as DailyTaskStatus[]).map((status) => (
              <span key={status}>{statusLabels[status]}: <strong>{numberFormatter.format(summary[status])}</strong></span>
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
