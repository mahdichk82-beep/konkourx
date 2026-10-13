import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthApiError } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { planningClient, type StudySession } from './planning-client'
import {
  completedStudySummary,
  executeFeedbackUpdate,
  executionErrorCodeMessage,
  formatElapsedStudyTime,
  normalizeStudySessionRating,
  replaceStudySession,
  studySessionFeedbackLabels,
  studySessionLifecycle,
} from './task-execution'

type TaskExecutionPanelProps = {
  executionRevision: number
  readOnly?: boolean
  taskId: string
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

const executionErrorMessage = (error: unknown) => {
  if (error instanceof AuthApiError) {
    const message = executionErrorCodeMessage(error.code)
    if (message) return message
  }
  return 'دریافت یا ثبت بازخورد مطالعه ممکن نشد. دوباره تلاش کنید.'
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
  executionRevision,
  readOnly = false,
  taskId,
}: TaskExecutionPanelProps) {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null)
  const [feedbackFocusRating, setFeedbackFocusRating] = useState('')
  const [feedbackQualityRating, setFeedbackQualityRating] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const requestGeneration = useRef(0)
  const { completedSessions, recordedMinutes } = useMemo(
    () => completedStudySummary(sessions),
    [sessions],
  )

  const refresh = useCallback(async () => {
    const generation = requestGeneration.current + 1
    requestGeneration.current = generation
    setLoading(true)
    setError(null)
    try {
      const nextSessions = await loadTaskSessions(taskId)
      if (requestGeneration.current === generation) setSessions(nextSessions)
    } catch (loadError) {
      if (requestGeneration.current === generation) setError(executionErrorMessage(loadError))
    } finally {
      if (requestGeneration.current === generation) setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    void Promise.resolve().then(refresh)
    return () => { requestGeneration.current += 1 }
  }, [executionRevision, refresh])

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

  if (loading) return <p className="task-execution__state" role="status">در حال دریافت مطالعه‌های ثبت‌شده…</p>
  return (
    <div className="task-execution__panel">
      <div className="task-execution__summary">
        <strong>{recordedMinutes.toLocaleString('fa-IR')} دقیقه</strong>
        <span>مطالعه ثبت‌شده در {completedSessions.length.toLocaleString('fa-IR')} جلسه</span>
      </div>
      {sessions.length === 0 ? (
        <p className="task-execution__state">هنوز جلسه مطالعه‌ای برای این کار ثبت نشده است.</p>
      ) : (
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
                {session.endedAt && <small>پایان: {dateTimeFormatter.format(new Date(session.endedAt))}</small>}
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
                    <RatingControl id={`history-focus-${session.id}`} label="تمرکز" onChange={setFeedbackFocusRating} value={feedbackFocusRating} />
                    <RatingControl id={`history-quality-${session.id}`} label="کیفیت مطالعه" onChange={setFeedbackQualityRating} value={feedbackQualityRating} />
                    <div className="task-execution__actions">
                      <Button disabled={feedbackSubmitting} onClick={() => void saveFeedback(session.id)}>
                        {feedbackSubmitting ? 'در حال ثبت…' : 'ثبت بازخورد'}
                      </Button>
                      <Button disabled={feedbackSubmitting} onClick={() => setEditingFeedbackId(null)} variant="ghost">انصراف</Button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {error && (
        <div className="task-execution__state task-execution__state--error" role="alert">
          <span>{error}</span>
          <Button onClick={() => void refresh()} variant="ghost">تلاش دوباره</Button>
        </div>
      )}
      {success && <p className="form-success" role="status">{success}</p>}
      {readOnly && <p className="task-execution__state">این سابقه تاریخی فقط قابل مشاهده است.</p>}
    </div>
  )
}
