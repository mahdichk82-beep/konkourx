import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthApiError } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import {
  planningClient,
  type DailyTaskStatus,
  type FinishStudySessionInput,
  type StudySession,
} from './planning-client'
import {
  completedStudySummary,
  executeFeedbackUpdate,
  executeFinish,
  executionErrorCodeMessage,
  formatElapsedStudyTime,
  normalizeStudySessionRating,
  replaceStudySession,
  studySessionFeedbackLabels,
  studySessionLifecycle,
  taskExecutionAction,
  upsertStudySession,
} from './task-execution'
import { useStudyTimerElapsed } from './useStudyTimer'
import { additionalSessionLabel } from './study-timer'

type TaskExecutionPanelProps = {
  taskId: string
  taskStatus: DailyTaskStatus
  taskTitle: string
  activeSession: StudySession | null
  executionReady: boolean
  executionRevision: number
  onFinish(sessionId: string, input: FinishStudySessionInput): Promise<StudySession>
  onPause(): Promise<StudySession>
  onResume(): Promise<StudySession>
  onStart(taskId: string, taskTitle: string): Promise<'STARTED' | 'CONTINUED' | 'SWITCH_PENDING'>
  readOnly?: boolean
}

type RatingControlProps = {
  id: string
  label: string
  onChange(value: string): void
  value: string
}

const RatingControl = ({ id, label, onChange, value }: RatingControlProps) => (
  <label className="task-execution__rating" htmlFor={id}>
    <span>{label}</span>
    <select id={id} onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">بدون امتیاز</option>
      {[1, 2, 3, 4, 5].map((rating) => (
        <option key={rating} value={rating}>{rating.toLocaleString('fa-IR')}</option>
      ))}
    </select>
    <small>۱ = کم، ۵ = عالی</small>
  </label>
)

const dateTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function ActiveSessionTiming({ session }: { session: StudySession }) {
  const elapsedMs = useStudyTimerElapsed(session)
  return (
    <div className="task-execution__timer-summary">
      <strong dir="ltr">{formatElapsedStudyTime(elapsedMs)}</strong>
      <span>{session.timerState === 'PAUSED' ? 'زمان فعال · در مکث' : 'زمان فعال · در حال اجرا'}</span>
    </div>
  )
}

const executionErrorMessage = (error: unknown) => {
  if (error instanceof AuthApiError) {
    const message = executionErrorCodeMessage(error.code)
    if (message) return message
  }
  return 'ثبت یا دریافت مطالعه ممکن نشد. دوباره تلاش کنید.'
}

const loadTaskSessions = async (taskId: string): Promise<StudySession[]> => {
  const sessions: StudySession[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  do {
    const page = await planningClient.listTaskSessions(taskId, cursor)
    sessions.push(...page.items)
    cursor = page.nextCursor ?? undefined
    if (cursor && seenCursors.has(cursor)) break
    if (cursor) seenCursors.add(cursor)
  } while (cursor)

  return sessions
}

export function TaskExecutionPanel({
  activeSession,
  executionReady,
  executionRevision,
  onFinish,
  onPause,
  onResume,
  onStart,
  readOnly = false,
  taskId,
  taskStatus,
  taskTitle,
}: TaskExecutionPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [notes, setNotes] = useState('')
  const [focusRating, setFocusRating] = useState('')
  const [studyQualityRating, setStudyQualityRating] = useState('')
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null)
  const [feedbackFocusRating, setFeedbackFocusRating] = useState('')
  const [feedbackQualityRating, setFeedbackQualityRating] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { completedSessions, recordedMinutes } = useMemo(
    () => completedStudySummary(sessions),
    [sessions],
  )
  const taskActiveSession = activeSession?.dailyTaskId === taskId ? activeSession : null
  const action = readOnly ? null : taskExecutionAction(taskStatus, taskId, activeSession)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSessions(await loadTaskSessions(taskId))
      setLoaded(true)
    } catch (loadError) {
      setError(executionErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    if (loaded) void Promise.resolve().then(refresh)
  }, [executionRevision, loaded, refresh])

  const toggle = () => {
    const nextExpanded = !expanded
    setExpanded(nextExpanded)
    setSuccess(null)
    if (nextExpanded && !loaded && !loading) void refresh()
  }

  const start = async () => {
    if (submitting || taskStatus !== 'PENDING' || !executionReady) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await onStart(taskId, taskTitle)
      if (result === 'STARTED') {
        setSuccess(`مطالعه «${taskTitle}» شروع شد. وضعیت کار جداگانه باقی ماند.`)
      } else if (result === 'CONTINUED') {
        setSuccess(`مطالعه «${taskTitle}» از قبل فعال است و ادامه دارد.`)
      }
    } catch (startError) {
      setError(executionErrorMessage(startError))
    } finally {
      setSubmitting(false)
    }
  }

  const finish = async () => {
    if (!taskActiveSession || submitting) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const normalizedFocusRating = normalizeStudySessionRating(focusRating)
      const normalizedQualityRating = normalizeStudySessionRating(studyQualityRating)
      const session = await executeFinish(
        taskActiveSession.id,
        {
          ...(normalizedFocusRating === undefined ? {} : { focusRating: normalizedFocusRating }),
          notes: notes.trim() || null,
          ...(normalizedQualityRating === undefined
            ? {}
            : { studyQualityRating: normalizedQualityRating }),
        },
        onFinish,
      )
      setSessions((current) => upsertStudySession(current, session))
      setLoaded(true)
      setNotes('')
      setFocusRating('')
      setStudyQualityRating('')
      setSuccess(`مطالعه «${taskTitle}» با ${(session.durationMinutes ?? 0).toLocaleString('fa-IR')} دقیقه ثبت شد. وضعیت کار جداگانه باقی ماند.`)
    } catch (submitError) {
      setError(executionErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  const pauseOrResume = async () => {
    if (!taskActiveSession || submitting || !executionReady) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const session = taskActiveSession.timerState === 'PAUSED'
        ? await onResume()
        : await onPause()
      setSessions((current) => upsertStudySession(current, session))
      setLoaded(true)
    } catch (transitionError) {
      setError(executionErrorMessage(transitionError))
    } finally {
      setSubmitting(false)
    }
  }

  const beginFeedbackEdit = (session: StudySession) => {
    setEditingFeedbackId(session.id)
    setFeedbackFocusRating(session.focusRating?.toString() ?? '')
    setFeedbackQualityRating(session.studyQualityRating?.toString() ?? '')
    setError(null)
    setSuccess(null)
  }

  const saveFeedback = async (sessionId: string) => {
    if (feedbackSubmitting) return
    setFeedbackSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const session = await executeFeedbackUpdate(
        sessionId,
        {
          focusRating: normalizeStudySessionRating(feedbackFocusRating) ?? null,
          studyQualityRating: normalizeStudySessionRating(feedbackQualityRating) ?? null,
        },
        planningClient.updateStudySessionFeedback.bind(planningClient),
      )
      setSessions((current) => replaceStudySession(current, session))
      setEditingFeedbackId(null)
      setSuccess('بازخورد جلسه ثبت شد.')
    } catch (feedbackError) {
      setError(executionErrorMessage(feedbackError))
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  return (
    <div className="task-execution">
      <Button onClick={toggle} variant="secondary">
        {expanded
          ? 'بستن سابقه مطالعه'
          : readOnly ? 'مشاهده سابقه مطالعه' : 'ثبت و مشاهده مطالعه'}
      </Button>

      {expanded && (
        <div className="task-execution__panel">
          {loading ? (
            <p className="task-execution__state" role="status">در حال دریافت مطالعه‌های ثبت‌شده…</p>
          ) : error && !loaded ? (
            <div className="task-execution__state task-execution__state--error" role="alert">
              <span>{error}</span>
              <Button onClick={() => void refresh()} variant="ghost">تلاش دوباره</Button>
            </div>
          ) : (
            <>
              <div className="task-execution__summary">
                <strong>{recordedMinutes.toLocaleString('fa-IR')} دقیقه</strong>
                <span>مطالعه ثبت‌شده در {completedSessions.length.toLocaleString('fa-IR')} جلسه</span>
                {completedSessions[0]?.endedAt && (
                  <small>آخرین ثبت: {dateTimeFormatter.format(new Date(completedSessions[0].endedAt))}</small>
                )}
              </div>

              {sessions.length > 0 && (
                <ul className="task-execution__history" aria-label="سابقه بازه‌های مطالعه">
                  {sessions.map((session) => {
                    const lifecycle = studySessionLifecycle(session)
                    const feedbackLabels = studySessionFeedbackLabels(session)
                    return (
                      <li key={session.id}>
                        <div className="task-execution__history-row">
                          <span>{dateTimeFormatter.format(new Date(session.startedAt))}</span>
                          {lifecycle === 'CANCELLED' ? (
                            <strong className="task-execution__cancelled">لغوشده</strong>
                          ) : lifecycle === 'ACTIVE' ? (
                            <strong>{session.timerState === 'PAUSED' ? 'در مکث' : 'در حال اجرا'}</strong>
                          ) : (
                            <strong dir="ltr">{formatElapsedStudyTime(session.activeElapsedMs)}</strong>
                          )}
                        </div>
                        {session.endedAt && (
                          <small>پایان: {dateTimeFormatter.format(new Date(session.endedAt))}</small>
                        )}
                        {feedbackLabels.length > 0 && (
                          <div className="task-execution__feedback-summary">
                            {feedbackLabels.map((label) => <span key={label}>{label}</span>)}
                          </div>
                        )}
                        {!readOnly && lifecycle === 'FINISHED' && editingFeedbackId !== session.id && (
                          <Button onClick={() => beginFeedbackEdit(session)} variant="ghost">
                            {feedbackLabels.length > 0 ? 'ویرایش بازخورد' : 'ثبت بازخورد'}
                          </Button>
                        )}
                        {lifecycle === 'FINISHED' && editingFeedbackId === session.id && (
                          <div className="task-execution__feedback-editor">
                            <RatingControl
                              id={`history-focus-${session.id}`}
                              label="تمرکز"
                              onChange={setFeedbackFocusRating}
                              value={feedbackFocusRating}
                            />
                            <RatingControl
                              id={`history-quality-${session.id}`}
                              label="کیفیت مطالعه"
                              onChange={setFeedbackQualityRating}
                              value={feedbackQualityRating}
                            />
                            <div className="task-execution__actions">
                              <Button disabled={feedbackSubmitting} onClick={() => void saveFeedback(session.id)}>
                                {feedbackSubmitting ? 'در حال ثبت…' : 'ثبت بازخورد'}
                              </Button>
                              <Button disabled={feedbackSubmitting} onClick={() => setEditingFeedbackId(null)} variant="ghost">
                                انصراف
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}

              {action === 'FINISH' && taskActiveSession ? (
                <div className="task-execution__active">
                  <p>شروع ثبت‌شده: {dateTimeFormatter.format(new Date(taskActiveSession.startedAt))}</p>
                  <ActiveSessionTiming session={taskActiveSession} />
                  <label htmlFor={`session-notes-${taskId}`}>
                    یادداشت (اختیاری)
                    <textarea
                      id={`session-notes-${taskId}`}
                      maxLength={4000}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="مثلاً فصل‌ها یا تمرین‌های مطالعه‌شده"
                      rows={2}
                      value={notes}
                    />
                  </label>
                  <div className="task-execution__ratings" aria-label="بازخورد اختیاری جلسه">
                    <RatingControl
                      id={`session-focus-${taskId}`}
                      label="تمرکز"
                      onChange={setFocusRating}
                      value={focusRating}
                    />
                    <RatingControl
                      id={`session-quality-${taskId}`}
                      label="کیفیت مطالعه"
                      onChange={setStudyQualityRating}
                      value={studyQualityRating}
                    />
                  </div>
                  <div className="task-execution__actions">
                    <Button
                      disabled={submitting || !executionReady}
                      onClick={() => void pauseOrResume()}
                      variant="secondary"
                    >
                      {taskActiveSession.timerState === 'PAUSED' ? 'ادامه مطالعه' : 'مکث'}
                    </Button>
                    <Button disabled={submitting || !executionReady} onClick={() => void finish()}>
                      {submitting ? 'در حال ثبت…' : 'پایان و ثبت مطالعه'}
                    </Button>
                  </div>
                </div>
              ) : action === 'START' ? (
                <div className="task-execution__start">
                  <p>
                    {activeSession
                      ? 'با انتخاب این کار، ابتدا برای تغییر مطالعه تأیید می‌گیرید.'
                      : 'شروع و پایان مطالعه یک جلسه واقعی می‌سازند و وضعیت کار را تغییر نمی‌دهند.'}
                  </p>
                  <Button disabled={submitting || !executionReady} onClick={() => void start()}>
                    {submitting
                      ? 'در حال شروع…'
                      : activeSession
                        ? 'تغییر مطالعه به این کار'
                        : additionalSessionLabel(sessions)}
                  </Button>
                </div>
              ) : readOnly ? (
                <p className="task-execution__state">این سابقه تاریخی فقط قابل مشاهده است.</p>
              ) : (
                <p className="task-execution__state">برای این وضعیت امکان شروع جلسه تازه وجود ندارد.</p>
              )}

              {error && <p className="form-error" role="alert">{error}</p>}
              {success && <p className="form-success" role="status">{success}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
