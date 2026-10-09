import { createContext } from 'react'
import type {
  CurrentSessionAction,
  FinishStudySessionInput,
  StudySession,
  SwitchStudySessionResult,
} from './planning-client'

export type StudyTimerContextValue = {
  activeSession: StudySession | null
  activeTaskTitle: string | null
  busy: boolean
  error: unknown | null
  lastFinishedSession: StudySession | null
  lastFinishedTaskTitle: string | null
  ready: boolean
  revision: number
  cancel(): Promise<StudySession>
  finish(sessionId: string, input: FinishStudySessionInput): Promise<StudySession>
  pause(): Promise<StudySession>
  reconcile(): Promise<void>
  resume(): Promise<StudySession>
  start(taskId: string, taskTitle: string): Promise<StudySession>
  switchTask(
    taskId: string,
    taskTitle: string,
    currentSessionAction: CurrentSessionAction,
  ): Promise<SwitchStudySessionResult>
}

export const StudyTimerContext = createContext<StudyTimerContextValue | null>(null)
