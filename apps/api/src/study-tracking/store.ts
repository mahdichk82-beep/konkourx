import type {
  CancelStudySessionResult,
  CurrentSessionAction,
  DailyTaskRef,
  FinishStudySessionResult,
  GoalListQuery,
  SessionListQuery,
  StudentGoalRecord,
  StudentProfileRef,
  StudySessionRecord,
  StudySubjectRef,
  StartStudySessionResult,
  SwitchStudySessionResult,
  StudySessionFeedbackInput,
  TimerTransitionResult,
  UpdateStudySessionFeedbackResult,
} from './types.js'

export interface StudyTrackingStore {
  findStudentProfileByUserId(userId: string): Promise<StudentProfileRef | null>
  findSubjectById(profileId: string, id: string): Promise<StudySubjectRef | null>
  findTaskById(profileId: string, id: string): Promise<DailyTaskRef | null>
  listSessions(profileId: string, query?: SessionListQuery): Promise<StudySessionRecord[]>
  findActiveSession(profileId: string): Promise<StudySessionRecord | null>
  findSessionById(profileId: string, id: string): Promise<StudySessionRecord | null>
  createSession(input: Omit<StudySessionRecord, 'id' | 'createdAt' | 'pauses' | 'updatedAt'>): Promise<StudySessionRecord>
  updateSession(profileId: string, id: string, input: Partial<Pick<StudySessionRecord, 'subjectId' | 'dailyTaskId' | 'startedAt' | 'endedAt' | 'notes'>>): Promise<StudySessionRecord | null>
  startTaskSession(
    profileId: string,
    taskId: string,
    startedAt: Date,
  ): Promise<StartStudySessionResult>
  switchTaskSession(
    profileId: string,
    taskId: string,
    transitionAt: Date,
    currentSessionAction: CurrentSessionAction,
  ): Promise<SwitchStudySessionResult>
  finishSession(
    profileId: string,
    id: string,
    endedAt: Date,
    input: StudySessionFeedbackInput & { notes?: string | null },
  ): Promise<FinishStudySessionResult>
  pauseSession(
    profileId: string,
    id: string,
    pausedAt: Date,
    expectedUpdatedAt: Date,
  ): Promise<TimerTransitionResult>
  resumeSession(
    profileId: string,
    id: string,
    resumedAt: Date,
    expectedUpdatedAt: Date,
  ): Promise<TimerTransitionResult>
  cancelSession(
    profileId: string,
    id: string,
    cancelledAt: Date,
  ): Promise<CancelStudySessionResult>
  updateSessionFeedback(
    profileId: string,
    id: string,
    input: StudySessionFeedbackInput,
  ): Promise<UpdateStudySessionFeedbackResult>
  listGoals(profileId: string, query?: GoalListQuery): Promise<StudentGoalRecord[]>
  findGoalById(profileId: string, id: string): Promise<StudentGoalRecord | null>
  createGoal(input: Omit<StudentGoalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentGoalRecord>
  updateGoal(profileId: string, id: string, input: Partial<Pick<StudentGoalRecord, 'subjectId' | 'title' | 'description' | 'targetDate' | 'status' | 'completedAt'>>): Promise<StudentGoalRecord | null>
}
