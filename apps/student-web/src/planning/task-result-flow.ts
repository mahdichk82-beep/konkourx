import type {
  DailyTask,
  FinishStudySessionInput,
  StudySession,
  UpdateTaskProgressInput,
} from './planning-client'
import { taskCompletionState } from './task-completion.ts'
import { prepareSolvedTestProgress } from './task-progress.ts'

export type ResultDataArea = 'CURRICULUM' | 'SOLVED_TESTS' | 'TASK_OUTCOME'
export type PendingResultEdit = Extract<ResultDataArea, 'CURRICULUM' | 'SOLVED_TESTS'>

export type CurriculumItemChange = {
  completed: boolean
  itemId: string
}

export type TaskResultDraft = {
  curriculumChanges: CurriculumItemChange[]
  outcome: 'COMPLETE' | 'CONTINUE'
  solvedTestCount: string
}

export type FinishSessionPorts = {
  finish(sessionId: string, input: FinishStudySessionInput): Promise<StudySession>
  loadActive(): Promise<StudySession | null>
  loadTaskSessions(taskId: string): Promise<StudySession[]>
}

export type FinishSessionReport =
  | { kind: 'FINISHED'; session: StudySession; source: 'MUTATION' | 'RECONCILIATION' }
  | { error: unknown; kind: 'ACTIVE_RETRYABLE'; session: StudySession }
  | { error: unknown; kind: 'UNKNOWN' }

export type TaskResultPorts = {
  completeTask(taskId: string): Promise<DailyTask>
  reconcileTask(taskId: string): Promise<DailyTask | null>
  recordSolvedTests(taskId: string, input: UpdateTaskProgressInput): Promise<DailyTask>
  toggleCurriculumItem(taskId: string, itemId: string, completed: boolean): Promise<DailyTask>
}

export type TaskResultSaveReport = {
  curriculum: {
    failures: Array<{ error: unknown; itemId: string }>
    failedItemIds: string[]
    savedItemIds: string[]
  }
  outcome: {
    error?: unknown
    kind: 'BLOCKED' | 'COMPLETED' | 'FAILED' | 'KEPT_PENDING' | 'UNKNOWN'
  }
  saved: ResultDataArea[]
  solvedTests: {
    draft?: string
    error?: unknown
    kind: 'FAILED' | 'NOT_REQUESTED' | 'SAVED'
  }
  task: DailyTask
  unsaved: ResultDataArea[]
}

export const finishStudySessionSafely = async (
  request: { input: FinishStudySessionInput; session: StudySession },
  ports: FinishSessionPorts,
): Promise<FinishSessionReport> => {
  try {
    return {
      kind: 'FINISHED',
      session: await ports.finish(request.session.id, request.input),
      source: 'MUTATION',
    }
  } catch (error) {
    const [activeResult, historyResult] = await Promise.allSettled([
      ports.loadActive(),
      request.session.dailyTaskId
        ? ports.loadTaskSessions(request.session.dailyTaskId)
        : Promise.resolve([]),
    ])
    if (historyResult.status === 'fulfilled') {
      const reconciled = historyResult.value.find(({ id }) => id === request.session.id)
      if (reconciled?.endedAt !== null && reconciled?.cancelledAt === null) {
        return { kind: 'FINISHED', session: reconciled, source: 'RECONCILIATION' }
      }
    }
    if (
      activeResult.status === 'fulfilled'
      && activeResult.value?.id === request.session.id
      && activeResult.value.endedAt === null
      && activeResult.value.cancelledAt === null
    ) {
      return { error, kind: 'ACTIVE_RETRYABLE', session: activeResult.value }
    }
    return { error, kind: 'UNKNOWN' }
  }
}

export const saveTaskResult = async (
  task: DailyTask,
  draft: TaskResultDraft,
  ports: TaskResultPorts,
): Promise<TaskResultSaveReport> => {
  let currentTask = task
  const savedItemIds: string[] = []
  const failedItemIds: string[] = []
  const curriculumFailures: Array<{ error: unknown; itemId: string }> = []
  const saved = new Set<ResultDataArea>()
  const unsaved = new Set<ResultDataArea>()

  for (const change of draft.curriculumChanges) {
    if (curriculumItemCompleted(currentTask, change.itemId) === change.completed) {
      savedItemIds.push(change.itemId)
      continue
    }
    try {
      currentTask = await ports.toggleCurriculumItem(
        task.id,
        change.itemId,
        change.completed,
      )
      savedItemIds.push(change.itemId)
    } catch (error) {
      const reconciled = await reconcileTaskSafely(task.id, ports)
      if (reconciled) currentTask = reconciled
      if (curriculumItemCompleted(currentTask, change.itemId) === change.completed) {
        savedItemIds.push(change.itemId)
      } else {
        failedItemIds.push(change.itemId)
        curriculumFailures.push({ error, itemId: change.itemId })
      }
    }
  }

  if (savedItemIds.length > 0) saved.add('CURRICULUM')
  if (failedItemIds.length > 0) unsaved.add('CURRICULUM')

  let solvedTests: TaskResultSaveReport['solvedTests'] = { kind: 'NOT_REQUESTED' }
  const solvedProgress = prepareSolvedTestProgress(draft.solvedTestCount, currentTask.updatedAt)
  if (!solvedProgress.ok) {
    solvedTests = { draft: draft.solvedTestCount, error: solvedProgress.message, kind: 'FAILED' }
    unsaved.add('SOLVED_TESTS')
  } else if (solvedProgress.value.actualSolvedTestCount !== currentTask.actualSolvedTestCount) {
    try {
      currentTask = await ports.recordSolvedTests(task.id, solvedProgress.value)
      solvedTests = { kind: 'SAVED' }
      saved.add('SOLVED_TESTS')
    } catch (error) {
      const reconciled = await reconcileTaskSafely(task.id, ports)
      if (reconciled) currentTask = reconciled
      if (currentTask.actualSolvedTestCount === solvedProgress.value.actualSolvedTestCount) {
        solvedTests = { kind: 'SAVED' }
        saved.add('SOLVED_TESTS')
      } else {
        solvedTests = { draft: draft.solvedTestCount, error, kind: 'FAILED' }
        unsaved.add('SOLVED_TESTS')
      }
    }
  }

  let outcome: TaskResultSaveReport['outcome'] = { kind: 'KEPT_PENDING' }
  if (draft.outcome === 'COMPLETE') {
    if (unsaved.size > 0 || !taskCompletionState(currentTask.curriculum).canComplete) {
      outcome = { kind: 'BLOCKED' }
      unsaved.add('TASK_OUTCOME')
    } else {
      try {
        currentTask = await ports.completeTask(task.id)
        outcome = currentTask.status === 'COMPLETED'
          ? { kind: 'COMPLETED' }
          : { kind: 'FAILED' }
      } catch (error) {
        const reconciled = await reconcileTaskSafely(task.id, ports)
        if (reconciled) {
          currentTask = reconciled
          outcome = currentTask.status === 'COMPLETED'
            ? { kind: 'COMPLETED' }
            : { error, kind: 'FAILED' }
        } else {
          outcome = { error, kind: 'UNKNOWN' }
        }
      }
      if (outcome.kind === 'COMPLETED') {
        saved.add('TASK_OUTCOME')
      } else {
        unsaved.add('TASK_OUTCOME')
      }
    }
  }

  return {
    curriculum: { failedItemIds, failures: curriculumFailures, savedItemIds },
    outcome,
    saved: [...saved],
    solvedTests,
    task: currentTask,
    unsaved: [...unsaved],
  }
}

export const pendingResultEdits = (
  task: DailyTask,
  draft: TaskResultDraft,
): PendingResultEdit[] => {
  const pending: PendingResultEdit[] = []
  if (draft.curriculumChanges.some((change) => (
    curriculumItemCompleted(task, change.itemId) !== change.completed
  ))) {
    pending.push('CURRICULUM')
  }
  const prepared = prepareSolvedTestProgress(draft.solvedTestCount, task.updatedAt)
  if (!prepared.ok || prepared.value.actualSolvedTestCount !== task.actualSolvedTestCount) {
    pending.push('SOLVED_TESTS')
  }
  return pending
}

export const continueLaterDisposition = (
  report: Pick<TaskResultSaveReport, 'saved' | 'unsaved'>,
  pendingEdits: PendingResultEdit[] = [],
): 'CLOSE' | 'CONFIRM_DISCARD' => {
  return report.unsaved.length > 0 || pendingEdits.length > 0
    ? 'CONFIRM_DISCARD'
    : 'CLOSE'
}

const curriculumItemCompleted = (
  task: DailyTask,
  itemId: string,
): boolean | undefined => {
  const item = task.curriculum.targets
    .flatMap(({ items }) => items)
    .find(({ id }) => id === itemId)
  return item ? item.completedAt !== null : undefined
}

const reconcileTaskSafely = async (
  taskId: string,
  ports: TaskResultPorts,
): Promise<DailyTask | null> => {
  try {
    return await ports.reconcileTask(taskId)
  } catch {
    return null
  }
}
