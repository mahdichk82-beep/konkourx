import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { prepareTaskContent, taskOccursOnDate } from '../planning/task-content'
import { createStudentCurriculumClient } from '../curriculum/curriculum-client'
import {
  activeSessionAfterCancel,
  activeSessionAfterFinish,
  activeSessionAfterSwitch,
  cancelStudyConsequenceMessage,
  elapsedStudyMilliseconds,
  executeActiveRestore,
  executeCancel,
  executeSwitch,
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

type StatusFilter = DailyTaskStatus | 'ALL'

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

const localDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
    TASK_ALREADY_EXECUTED: 'برای این کار سابقه مطالعه ثبت شده است و تاریخ آن قابل تغییر نیست.',
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
    TASK_SOURCE_FORBIDDEN: 'فقط مباحث کار شخصی را می‌توانید ویرایش کنید.',
    TASK_RESCHEDULE_FORBIDDEN: 'تغییر تاریخ کار تعیین‌شده توسط مشاور برای دانش‌آموز مجاز نیست.',
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
}: {
  activeSession: StudySession
  activeTaskTitle: string | null
  busy: boolean
  onCancel(): void
  onFinish(): Promise<void>
}) {
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTimeMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [activeSession.id])

  const elapsed = formatElapsedStudyTime(
    elapsedStudyMilliseconds(activeSession.startedAt, currentTimeMs),
  )

  return (
    <Card className="active-study-card">
      <div>
        <p className="eyebrow">مطالعه فعال</p>
        <h2>{activeTaskTitle ?? 'مطالعه فعلی'} در حال اجراست</h2>
        <p>زمان سپری‌شده از شروع ثبت‌شده در سرور</p>
      </div>
      <strong className="active-study-card__timer" dir="ltr">{elapsed}</strong>
      <div className="active-study-card__actions">
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

export function TodayPlanningPage({ navigate }: { navigate(path: string): void }) {
  const today = new Date()
  const todayKey = localDateKey(today)
  const todayLabel = new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(today)
  const numberFormatter = useMemo(() => new Intl.NumberFormat('fa-IR'), [])
  const curriculumClient = useMemo(() => createStudentCurriculumClient(
    authClient.authorizedRequest.bind(authClient),
  ), [])

  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [subjects, setSubjects] = useState<StudySubject[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [subjectFilter, setSubjectFilter] = useState('ALL')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set())
  const [reschedulingTaskIds, setReschedulingTaskIds] = useState<Set<string>>(new Set())
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({})
  const [skipReasonDrafts, setSkipReasonDrafts] = useState<
    Record<string, DailyTaskSkipReason | ''>
  >({})

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [taskScheduledFor, setTaskScheduledFor] = useState(todayKey)
  const [description, setDescription] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [contentType, setContentType] = useState<'STUDY' | 'GENERAL' | ''>('')
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [taskCurriculum, setTaskCurriculum] = useState<PlanningCurriculumValue>(() => createEmptyPlanningCurriculumValue())
  const [taskStudyHistory, setTaskStudyHistory] = useState<Record<string, 'LOADING' | 'NONE' | 'PRESENT' | 'ERROR'>>({})
  const [updatingCurriculumTaskIds, setUpdatingCurriculumTaskIds] = useState<Set<string>>(new Set())
  const [updatingExecutionTaskIds, setUpdatingExecutionTaskIds] = useState<Set<string>>(new Set())

  const [activeSession, setActiveSession] = useState<StudySession | null>(null)
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null)
  const [executionReady, setExecutionReady] = useState(false)
  const [executionBusy, setExecutionBusy] = useState(false)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [executionRevision, setExecutionRevision] = useState(0)
  const [switchTarget, setSwitchTarget] = useState<{ id: string; title: string } | null>(null)
  const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false)

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
    try {
      const session = await executeActiveRestore(
        planningClient.getActiveStudySession.bind(planningClient),
      )
      setActiveSession(session)
      setCancelConfirmationOpen(false)
      setActiveTaskTitle(null)
      if (session?.dailyTaskId) {
        try {
          const activeTask = await planningClient.getTask(session.dailyTaskId)
          setActiveTaskTitle(activeTask.title)
        } catch {
          // The session remains authoritative even if its optional task label is unavailable.
        }
      }
    } catch (error) {
      setExecutionError(planningErrorMessage(error))
    } finally {
      setExecutionReady(true)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(restoreActiveExecution)
  }, [restoreActiveExecution])

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
    const editableTaskIds = tasks.filter((task) => (
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
  }, [tasks, executionRevision])

  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
  const summary = tasks.reduce(
    (counts, task) => ({ ...counts, [task.status]: counts[task.status] + 1 }),
    { COMPLETED: 0, PARTIAL: 0, PENDING: 0, SKIPPED: 0 },
  )

  const taskMatchesFilters = (task: DailyTask): boolean =>
    taskOccursOnDate(task.scheduledFor, todayKey) &&
    (statusFilter === 'ALL' || task.status === statusFilter) &&
    (subjectFilter === 'ALL' || task.subjectId === subjectFilter)

  const replaceTaskFromServer = (updated: DailyTask) => {
    setTasks((current) => {
      if (!taskMatchesFilters(updated)) {
        return current.filter((item) => item.id !== updated.id)
      }
      return current.map((item) => item.id === updated.id ? updated : item)
    })
  }

  const reconcileTaskFromServer = async (taskId: string) => {
    try {
      replaceTaskFromServer(await planningClient.getTask(taskId))
    } catch (error) {
      if (error instanceof AuthApiError && error.code === 'TASK_NOT_FOUND') {
        setTasks((current) => current.filter((item) => item.id !== taskId))
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

    setExecutionBusy(true)
    setExecutionError(null)
    try {
      const session = await planningClient.startTask(taskId)
      setActiveSession(session)
      setActiveTaskTitle(taskTitle)
      setCancelConfirmationOpen(false)
      setExecutionRevision((current) => current + 1)
      return 'STARTED'
    } catch (error) {
      if (error instanceof AuthApiError && error.code === 'ACTIVE_STUDY_SESSION_EXISTS') {
        await restoreActiveExecution()
      }
      throw error
    } finally {
      setExecutionBusy(false)
    }
  }

  const handleExecutionFinish = async (
    sessionId: string,
    input: FinishStudySessionInput,
  ): Promise<StudySession> => {
    setExecutionBusy(true)
    setExecutionError(null)
    try {
      const session = await planningClient.finishStudySession(sessionId, input)
      setActiveSession((current) => activeSessionAfterFinish(current, session))
      setActiveTaskTitle((current) => activeSession?.id === sessionId ? null : current)
      setCancelConfirmationOpen(false)
      setExecutionRevision((current) => current + 1)
      return session
    } catch (error) {
      if (
        error instanceof AuthApiError
        && (error.code === 'SESSION_ALREADY_FINISHED' || error.code === 'SESSION_NOT_FOUND')
      ) {
        await restoreActiveExecution()
      }
      throw error
    } finally {
      setExecutionBusy(false)
    }
  }

  const confirmExecutionCancel = async () => {
    if (!activeSession || executionBusy) return
    const sessionId = activeSession.id
    setExecutionBusy(true)
    setExecutionError(null)
    try {
      const session = await executeCancel(
        sessionId,
        planningClient.cancelStudySession.bind(planningClient),
      )
      setActiveSession((current) => activeSessionAfterCancel(current, session))
      setActiveTaskTitle((current) => activeSession?.id === sessionId ? null : current)
      setCancelConfirmationOpen(false)
      setSwitchTarget(null)
      setExecutionRevision((current) => current + 1)
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
    } finally {
      setExecutionBusy(false)
    }
  }

  const confirmExecutionSwitch = async (currentSessionAction: CurrentSessionAction) => {
    if (!switchTarget || executionBusy) return
    const target = switchTarget
    setExecutionBusy(true)
    setExecutionError(null)
    try {
      const result = await executeSwitch(
        target.id,
        currentSessionAction,
        planningClient.switchTask.bind(planningClient),
      )
      setActiveSession(activeSessionAfterSwitch(result))
      setActiveTaskTitle(target.title)
      setCancelConfirmationOpen(false)
      setSwitchTarget(null)
      setExecutionRevision((current) => current + 1)
    } catch (error) {
      setExecutionError(planningErrorMessage(error))
    } finally {
      setExecutionBusy(false)
    }
  }

  const handleScheduleUpdate = async (task: DailyTask) => {
    const scheduledFor = scheduleDrafts[task.id] ?? task.scheduledFor.slice(0, 10)
    if (!scheduledFor || scheduledFor === task.scheduledFor.slice(0, 10)) return
    setActionError(null)
    setReschedulingTaskIds((current) => new Set(current).add(task.id))

    try {
      const updated = await planningClient.rescheduleTask(task.id, scheduledFor)
      setTasks((current) => updated.scheduledFor.slice(0, 10) === todayKey
        ? current.map((item) => item.id === updated.id ? updated : item)
        : current.filter((item) => item.id !== updated.id))
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
        estimatedMinutes: minutes,
        scheduledFor: taskScheduledFor,
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

      {executionError && (
        <div className="planning-alert" role="alert">
          <span>{executionError}</span>
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
              </label>
              <label htmlFor="task-minutes">
                زمان تخمینی (دقیقه)
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
            <p>فهرست بر اساس روز محلی دستگاه شما دریافت می‌شود.</p>
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
                <option value="PENDING">در انتظار</option>
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
        ) : tasks.length === 0 ? (
          <ContentState
            action={<Button onClick={() => setIsCreateOpen(true)}>ساخت اولین کار امروز</Button>}
            description="برای فیلتر فعلی کاری وجود ندارد. می‌توانید یک کار شخصی برای امروز بسازید."
            kind="empty"
            title="فهرست امروز خالی است"
          />
        ) : (
          <div className="task-list">
            {tasks.map((task) => {
              const subject = task.subjectId ? subjectById.get(task.subjectId) : undefined
              const isUpdating = updatingTaskIds.has(task.id)
              const isUpdatingCurriculum = updatingCurriculumTaskIds.has(task.id)
              const isUpdatingExecution = updatingExecutionTaskIds.has(task.id)
              const taskCurriculumValue = planningCurriculumValueFromSnapshots(task.curriculum.targets)
              const executionItems = curriculumExecutionItems(task.curriculum.targets)
              const completionState = taskCompletionState(task.curriculum)
              const canToggleExecutionItems = canToggleCurriculumExecutionItems({
                contentType: task.contentType,
                source: task.source,
                status: task.status,
                totalItemCount: task.curriculum.totalItemCount,
              })

              return (
                <article className={`task-item task-item--${task.status.toLowerCase()}`} key={task.id}>
                  <div className="task-item__main">
                    <div className="task-item__heading">
                      <h3>{task.title}</h3>
                      <span className={`task-status task-status--${task.status.toLowerCase()}`}>
                        {statusLabels[task.status]}
                      </span>
                    </div>
                    <div className="task-meta">
                      <span>{task.contentType === 'STUDY' ? 'درسی' : task.contentType === 'GENERAL' ? 'عمومی' : 'ثبت تاریخی'}</span>
                      {task.subjectId ? <span>{subject?.name ?? 'درس نامشخص'}</span> : null}
                      {task.source === 'COUNSELOR' && (
                        <span className="task-source--counselor">تعیین‌شده توسط مشاور</span>
                      )}
                      {task.estimatedMinutes !== null && (
                        <span>{numberFormatter.format(task.estimatedMinutes)} دقیقه</span>
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
                          {' '}{numberFormatter.format(task.curriculum.completedItemCount)} از{' '}
                          {numberFormatter.format(task.curriculum.totalItemCount)} مورد تکمیل شده است.
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
                              [task.id]: event.target.value,
                            }))}
                            type="date"
                            value={scheduleDrafts[task.id] ?? task.scheduledFor.slice(0, 10)}
                          />
                        </label>
                        <Button
                          disabled={
                            reschedulingTaskIds.has(task.id)
                            || (scheduleDrafts[task.id] ?? task.scheduledFor.slice(0, 10)) === task.scheduledFor.slice(0, 10)
                          }
                          type="submit"
                          variant="secondary"
                        >
                          {reschedulingTaskIds.has(task.id) ? 'در حال جابه‌جایی…' : 'ثبت تاریخ جدید'}
                        </Button>
                      </form>
                    )}
                    <TaskExecutionPanel
                      activeSession={activeSession}
                      executionReady={executionReady && !executionBusy}
                      executionRevision={executionRevision}
                      onFinish={handleExecutionFinish}
                      onStart={handleExecutionStart}
                      taskId={task.id}
                      taskStatus={task.status}
                      taskTitle={task.title}
                    />
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
                </article>
              )
            })}
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
