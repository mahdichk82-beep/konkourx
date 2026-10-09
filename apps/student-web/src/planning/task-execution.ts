import type {
  DailyTaskStatus,
  CurrentSessionAction,
  FinishStudySessionInput,
  StudySession,
  StudySessionFeedbackInput,
  SwitchStudySessionResult,
} from './planning-client'

export type TaskExecutionAction = 'START' | 'FINISH' | 'NONE'

export const cancelStudyConsequenceMessage =
  'با لغو، این بازه در زمان مطالعه ثبت‌شده حساب نمی‌شود و وضعیت کار تغییری نمی‌کند.'

export const switchExecutionChoices = {
  CANCEL: 'CANCEL',
  CONTINUE: 'CONTINUE',
  FINISH: 'FINISH',
} as const

export const taskExecutionAction = (
  taskStatus: DailyTaskStatus,
  taskId: string,
  activeSession: StudySession | null,
): TaskExecutionAction => {
  if (activeSession?.dailyTaskId === taskId) return 'FINISH'
  return taskStatus === 'PENDING' ? 'START' : 'NONE'
}

export type ExecutionStartDecision = 'START' | 'CONTINUE' | 'SWITCH'

export const executionStartDecision = (
  taskId: string,
  activeSession: StudySession | null,
): ExecutionStartDecision => {
  if (!activeSession) return 'START'
  return activeSession.dailyTaskId === taskId ? 'CONTINUE' : 'SWITCH'
}

export const elapsedStudyMilliseconds = (
  startedAt: string,
  currentTimeMs: number,
): number => {
  const startTimeMs = new Date(startedAt).getTime()
  if (!Number.isFinite(startTimeMs)) return 0
  return Math.max(0, currentTimeMs - startTimeMs)
}

export const formatElapsedStudyTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export const completedStudySummary = (sessions: StudySession[]) => {
  const completedSessions = sessions.filter(
    (session) => session.cancelledAt === null && session.endedAt !== null,
  )
  return {
    completedSessions,
    recordedMinutes: completedSessions.reduce(
      (total, session) => total + (session.durationMinutes ?? 0),
      0,
    ),
  }
}

export const upsertStudySession = (
  sessions: StudySession[],
  session: StudySession,
): StudySession[] => [session, ...sessions.filter(({ id }) => id !== session.id)]

export const replaceStudySession = (
  sessions: StudySession[],
  session: StudySession,
): StudySession[] => sessions.map((current) => current.id === session.id ? session : current)

export const normalizeStudySessionRating = (
  value: string,
): number | undefined => {
  if (value === '') return undefined
  const rating = Number(value)
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
    ? rating
    : undefined
}

export const studySessionFeedbackLabels = (session: StudySession): string[] => {
  if (studySessionLifecycle(session) !== 'FINISHED') return []
  return [
    session.focusRating === null || session.focusRating === undefined
      ? null
      : `تمرکز: ${session.focusRating.toLocaleString('fa-IR')}/۵`,
    session.studyQualityRating === null || session.studyQualityRating === undefined
      ? null
      : `کیفیت مطالعه: ${session.studyQualityRating.toLocaleString('fa-IR')}/۵`,
  ].filter((label): label is string => label !== null)
}

export const executeStart = (
  taskId: string,
  request: (id: string) => Promise<StudySession>,
): Promise<StudySession> => request(taskId)

export const executeActiveRestore = (
  request: () => Promise<StudySession | null>,
): Promise<StudySession | null> => request()

export const executeFinish = (
  sessionId: string,
  input: FinishStudySessionInput,
  request: (id: string, value: FinishStudySessionInput) => Promise<StudySession>,
): Promise<StudySession> => request(sessionId, input)

export const executeFeedbackUpdate = (
  sessionId: string,
  input: StudySessionFeedbackInput,
  request: (id: string, value: StudySessionFeedbackInput) => Promise<StudySession>,
): Promise<StudySession> => request(sessionId, input)

export const executeCancel = (
  sessionId: string,
  request: (id: string) => Promise<StudySession>,
): Promise<StudySession> => request(sessionId)

export const executeSwitch = (
  taskId: string,
  currentSessionAction: CurrentSessionAction,
  request: (id: string, action: CurrentSessionAction) => Promise<SwitchStudySessionResult>,
): Promise<SwitchStudySessionResult> => request(taskId, currentSessionAction)

export const activeSessionAfterFinish = (
  current: StudySession | null,
  finished: StudySession,
): StudySession | null => current?.id === finished.id ? null : current

export const activeSessionAfterCancel = (
  current: StudySession | null,
  cancelled: StudySession,
): StudySession | null => current?.id === cancelled.id ? null : current

export const studySessionLifecycle = (
  session: StudySession,
): 'ACTIVE' | 'FINISHED' | 'CANCELLED' => {
  if (session.cancelledAt !== null) return 'CANCELLED'
  return session.endedAt === null ? 'ACTIVE' : 'FINISHED'
}

export const activeSessionAfterSwitch = (
  result: SwitchStudySessionResult,
): StudySession => result.activeSession

export const executionErrorCodeMessage = (code: string): string | null => {
  if (code === 'TASK_NOT_FOUND') return 'این کار دیگر در دسترس نیست.'
  if (code === 'SUBJECT_ARCHIVED') {
    return 'درس این کار بایگانی شده و ثبت مطالعه تازه برای آن ممکن نیست.'
  }
  if (code === 'SESSION_TIME_INVALID') return 'زمان پایان باید بعد از زمان شروع باشد.'
  if (code === 'SESSION_ALREADY_FINISHED') return 'این جلسه قبلاً پایان یافته است.'
  if (code === 'SESSION_ALREADY_CANCELLED') return 'این بازه قبلاً لغو شده است.'
  if (code === 'TASK_NOT_EXECUTABLE') return 'فقط کارهای در انتظار قابل شروع هستند.'
  if (code === 'SESSION_NOT_FOUND') return 'این جلسه دیگر در دسترس نیست.'
  if (code === 'SESSION_NOT_FINISHED') return 'بازخورد فقط برای جلسه پایان‌یافته ثبت می‌شود.'
  if (code === 'ACTIVE_STUDY_SESSION_EXISTS') {
    return 'یک مطالعه دیگر در حال اجراست. وضعیت فعال دوباره دریافت شد؛ برای جابه‌جایی از گزینه تغییر مطالعه استفاده کنید.'
  }
  if (code === 'LIVE_SESSION_CONFLICT') {
    return 'وضعیت مطالعه هم‌زمان تغییر کرد. وضعیت تازه را بررسی و دوباره تلاش کنید.'
  }
  if (code === 'SESSION_STATE_STALE') {
    return 'وضعیت تایمر در جای دیگری تغییر کرده است. وضعیت تازه بازیابی شد؛ دوباره تلاش کنید.'
  }
  if (code === 'SESSION_NOT_PAUSED') {
    return 'این جلسه دیگر در حالت مکث نیست. وضعیت تازه بازیابی شد.'
  }
  if (code === 'SESSION_ACTIVE_UPDATE_FORBIDDEN') {
    return 'جلسه فعال فقط از مسیر پایان مطالعه قابل تغییر است.'
  }
  if (code === 'SESSION_CANCELLED_UPDATE_FORBIDDEN') {
    return 'بازه لغوشده از مسیر ویرایش دستی قابل تغییر نیست.'
  }
  return null
}
