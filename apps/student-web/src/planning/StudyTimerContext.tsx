import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  planningClient,
  type CurrentSessionAction,
  type FinishStudySessionInput,
  type StudySession,
} from './planning-client'
import {
  executeTimerTransition,
  executeWithTimerReconciliation,
  selectNewerStudySession,
  shouldReconcileStudyTimer,
  StudyTimerOperationGate,
} from './study-timer'
import { StudyTimerContext, type StudyTimerContextValue } from './study-timer-context'
const timerBroadcastName = 'konkourx-study-timer'
const timerStorageKey = 'konkourx-study-timer-reconcile'

export function StudyTimerProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<StudySession | null>(null)
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown | null>(null)
  const [lastFinishedSession, setLastFinishedSession] = useState<StudySession | null>(null)
  const [lastFinishedTaskTitle, setLastFinishedTaskTitle] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [revision, setRevision] = useState(0)
  const activeSessionRef = useRef<StudySession | null>(null)
  const busyRef = useRef(false)
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  const reconcileGenerationRef = useRef(0)
  const operationGateRef = useRef(new StudyTimerOperationGate())

  const resolveTaskTitle = useCallback(async (session: StudySession) => {
    if (!session.dailyTaskId) return
    const sessionId = session.id
    try {
      const task = await planningClient.getTask(session.dailyTaskId)
      if (activeSessionRef.current?.id === sessionId) setActiveTaskTitle(task.title)
    } catch {
      // The session remains authoritative when its optional display label is unavailable.
    }
  }, [])

  const commitActiveSession = useCallback((incoming: StudySession | null, knownTitle?: string) => {
    const current = activeSessionRef.current
    const next = current && incoming
      ? selectNewerStudySession(current, incoming)
      : incoming
    if (current && incoming && next === current) return

    const lifecycleChanged = current?.id !== next?.id
      || current?.updatedAt !== next?.updatedAt
      || current?.timerState !== next?.timerState
    activeSessionRef.current = next
    setActiveSession(next)
    if (lifecycleChanged) setRevision((value) => value + 1)

    if (!next) {
      setActiveTaskTitle(null)
    } else {
      setLastFinishedSession(null)
      setLastFinishedTaskTitle(null)
      if (knownTitle !== undefined) {
        setActiveTaskTitle(knownTitle)
      } else if (current?.dailyTaskId !== next.dailyTaskId) {
        setActiveTaskTitle(null)
        void resolveTaskTitle(next)
      }
    }
  }, [resolveTaskTitle])

  const fetchAuthoritativeState = useCallback(async (reportError: boolean) => {
    const generation = ++reconcileGenerationRef.current
    try {
      const session = await planningClient.getActiveStudySession()
      if (generation !== reconcileGenerationRef.current) return
      commitActiveSession(session)
      if (reportError) setError(null)
    } catch (nextError) {
      if (generation === reconcileGenerationRef.current && reportError) setError(nextError)
    } finally {
      if (generation === reconcileGenerationRef.current) setReady(true)
    }
  }, [commitActiveSession])

  const reconcile = useCallback(async () => {
    if (busyRef.current) return
    await fetchAuthoritativeState(true)
  }, [fetchAuthoritativeState])

  const notifyOtherTabs = useCallback(() => {
    broadcastRef.current?.postMessage({ type: 'study-timer-changed' })
    try {
      window.localStorage.setItem(timerStorageKey, `${Date.now()}:${Math.random()}`)
    } catch {
      // BroadcastChannel or focus recovery still provides reconciliation.
    }
  }, [])

  const runMutation = useCallback(async <T,>(
    request: () => Promise<T>,
    apply: (value: T) => void,
  ): Promise<T> => {
    const token = operationGateRef.current.begin()
    if (token === null) throw new Error('STUDY_TIMER_OPERATION_PENDING')
    busyRef.current = true
    setBusy(true)
    setError(null)
    reconcileGenerationRef.current += 1

    try {
      const value = await executeWithTimerReconciliation(request, async () => {
        operationGateRef.current.invalidate()
        await fetchAuthoritativeState(false)
      })
      if (operationGateRef.current.accepts(token)) apply(value)
      operationGateRef.current.finish(token)
      notifyOtherTabs()
      return value
    } catch (nextError) {
      setError(nextError)
      throw nextError
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, [fetchAuthoritativeState, notifyOtherTabs])

  const start = useCallback((taskId: string, taskTitle: string) => runMutation(
    () => planningClient.startTask(taskId),
    (session) => {
      setLastFinishedSession(null)
      setLastFinishedTaskTitle(null)
      commitActiveSession(session, taskTitle)
    },
  ), [commitActiveSession, runMutation])

  const pause = useCallback(async () => {
    const session = activeSessionRef.current
    if (!session) throw new Error('STUDY_TIMER_SESSION_MISSING')
    return runMutation(
      () => executeTimerTransition(
        session,
        planningClient.pauseStudySession.bind(planningClient),
      ),
      (updated) => commitActiveSession(updated),
    )
  }, [commitActiveSession, runMutation])

  const resume = useCallback(async () => {
    const session = activeSessionRef.current
    if (!session) throw new Error('STUDY_TIMER_SESSION_MISSING')
    return runMutation(
      () => executeTimerTransition(
        session,
        planningClient.resumeStudySession.bind(planningClient),
      ),
      (updated) => commitActiveSession(updated),
    )
  }, [commitActiveSession, runMutation])

  const finish = useCallback((sessionId: string, input: FinishStudySessionInput) => runMutation(
    () => planningClient.finishStudySession(sessionId, input),
    (finishedSession) => {
      setLastFinishedSession(finishedSession)
      setLastFinishedTaskTitle(activeTaskTitle)
      if (activeSessionRef.current?.id === sessionId) commitActiveSession(null)
    },
  ), [activeTaskTitle, commitActiveSession, runMutation])

  const cancel = useCallback(() => {
    const session = activeSessionRef.current
    if (!session) return Promise.reject(new Error('STUDY_TIMER_SESSION_MISSING'))
    return runMutation(
      () => planningClient.cancelStudySession(session.id),
      () => commitActiveSession(null),
    )
  }, [commitActiveSession, runMutation])

  const switchTask = useCallback((
    taskId: string,
    taskTitle: string,
    currentSessionAction: CurrentSessionAction,
  ) => runMutation(
    () => planningClient.switchTask(taskId, currentSessionAction),
    (result) => commitActiveSession(result.activeSession, taskTitle),
  ), [commitActiveSession, runMutation])

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchAuthoritativeState(true), 0)
    return () => window.clearTimeout(timer)
  }, [fetchAuthoritativeState])

  useEffect(() => {
    const handleFocus = () => {
      if (shouldReconcileStudyTimer('focus')) void reconcile()
    }
    const handleOnline = () => {
      if (shouldReconcileStudyTimer('online')) void reconcile()
    }
    const handleVisibility = () => {
      if (shouldReconcileStudyTimer('visibilitychange', document.visibilityState)) void reconcile()
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === timerStorageKey && shouldReconcileStudyTimer('broadcast')) void reconcile()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibility)

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(timerBroadcastName)
      channel.addEventListener('message', handleFocus)
      broadcastRef.current = channel
    }

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
      broadcastRef.current?.close()
      broadcastRef.current = null
    }
  }, [reconcile])

  const value = useMemo<StudyTimerContextValue>(() => ({
    activeSession,
    activeTaskTitle,
    busy,
    cancel,
    error,
    finish,
    lastFinishedSession,
    lastFinishedTaskTitle,
    pause,
    ready,
    reconcile,
    resume,
    revision,
    start,
    switchTask,
  }), [
    activeSession,
    activeTaskTitle,
    busy,
    cancel,
    error,
    finish,
    lastFinishedSession,
    lastFinishedTaskTitle,
    pause,
    ready,
    reconcile,
    resume,
    revision,
    start,
    switchTask,
  ])

  return <StudyTimerContext.Provider value={value}>{children}</StudyTimerContext.Provider>
}
