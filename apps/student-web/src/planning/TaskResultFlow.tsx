import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import {
  planningClient,
  type DailyTask,
  type FinishStudySessionInput,
  type StudySession,
} from './planning-client'
import { curriculumExecutionItems } from './task-completion'
import { formatElapsedStudyTime } from './task-execution'
import { normalizeStudySessionRating } from './task-execution'
import {
  continueLaterDisposition,
  finishStudySessionSafely,
  pendingResultEdits,
  saveTaskResult,
  type CurriculumItemChange,
  type ResultDataArea,
  type TaskResultSaveReport,
} from './task-result-flow'

export type TaskResultFlowProps = {
  activeSession: StudySession | null
  finishSession(sessionId: string, input: FinishStudySessionInput): Promise<StudySession>
  onDirtyChange(dirty: boolean): void
  onMutationUncertaintyChange(uncertain: boolean): void
  onRequestClose(): void
  onSessionReconcile(): Promise<void>
  onTaskChanged(task: DailyTask): void
  task: DailyTask
}

const areaLabels: Record<ResultDataArea, string> = {
  CURRICULUM: 'پوشش مباحث',
  SOLVED_TESTS: 'تعداد تست حل‌شده',
  TASK_OUTCOME: 'نتیجه نهایی کار',
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

export function TaskResultFlow({
  activeSession,
  finishSession,
  onDirtyChange,
  onMutationUncertaintyChange,
  onRequestClose,
  onSessionReconcile,
  onTaskChanged,
  task,
}: TaskResultFlowProps) {
  const matchingActiveSession = activeSession?.dailyTaskId === task.id ? activeSession : null
  const authoritativeTask = task
  const [curriculumChanges, setCurriculumChanges] = useState<CurriculumItemChange[]>([])
  const [solvedTestCount, setSolvedTestCount] = useState(String(task.actualSolvedTestCount))
  const [outcome, setOutcome] = useState<'COMPLETE' | 'CONTINUE' | ''>('')
  const [notes, setNotes] = useState('')
  const [focusRating, setFocusRating] = useState('')
  const [qualityRating, setQualityRating] = useState('')
  const [finishedSession, setFinishedSession] = useState<StudySession | null>(null)
  const [finishState, setFinishState] = useState<'IDLE' | 'SAVING' | 'RETRYABLE' | 'UNKNOWN'>('IDLE')
  const [saving, setSaving] = useState(false)
  const [completionUncertain, setCompletionUncertain] = useState(false)
  const [report, setReport] = useState<TaskResultSaveReport | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const discardCancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (confirmDiscard) discardCancelRef.current?.focus()
  }, [confirmDiscard])

  const executionItems = useMemo(
    () => curriculumExecutionItems(authoritativeTask.curriculum.targets),
    [authoritativeTask.curriculum.targets],
  )

  const desiredItemState = (itemId: string, completedAt: string | null) => (
    curriculumChanges.find((change) => change.itemId === itemId)?.completed ?? completedAt !== null
  )

  const notifyDraftDirty = (
    nextCurriculumChanges: CurriculumItemChange[],
    nextSolvedTestCount: string,
    nextOutcome: 'COMPLETE' | 'CONTINUE' | '' = outcome,
  ) => {
    onDirtyChange(nextOutcome !== '' || pendingResultEdits(authoritativeTask, {
      curriculumChanges: nextCurriculumChanges,
      outcome: nextOutcome || 'CONTINUE',
      solvedTestCount: nextSolvedTestCount,
    }).length > 0)
  }

  const setItemCompleted = (itemId: string, completed: boolean) => {
    const serverItem = executionItems.find(({ id }) => id === itemId)
    if (!serverItem) return
    const withoutItem = curriculumChanges.filter((change) => change.itemId !== itemId)
    const nextChanges = (serverItem.completedAt !== null) === completed
      ? withoutItem
      : [...withoutItem, { completed, itemId }]
    setCurriculumChanges(nextChanges)
    notifyDraftDirty(nextChanges, solvedTestCount)
    setReport(null)
  }

  const finishActiveSession = async () => {
    if (!matchingActiveSession || finishState === 'SAVING') return
    setFinishState('SAVING')
    setError(null)
    setMessage(null)
    const normalizedFocus = normalizeStudySessionRating(focusRating)
    const normalizedQuality = normalizeStudySessionRating(qualityRating)
    const finishReport = await finishStudySessionSafely({
      input: {
        ...(normalizedFocus === undefined ? {} : { focusRating: normalizedFocus }),
        notes: notes.trim() || null,
        ...(normalizedQuality === undefined ? {} : { studyQualityRating: normalizedQuality }),
      },
      session: matchingActiveSession,
    }, {
      finish: finishSession,
      loadActive: planningClient.getActiveStudySession.bind(planningClient),
      loadTaskSessions,
    })
    if (finishReport.kind === 'FINISHED') {
      onMutationUncertaintyChange(false)
      setFinishedSession(finishReport.session)
      setFinishState('IDLE')
      setMessage(`زمان مطالعه با ${(finishReport.session.durationMinutes ?? 0).toLocaleString('fa-IR')} دقیقه ثبت شد؛ نتیجه کار هنوز جداگانه تعیین می‌شود.`)
      await onSessionReconcile()
      return
    }
    if (finishReport.kind === 'ACTIVE_RETRYABLE') {
      onMutationUncertaintyChange(false)
      setFinishState('RETRYABLE')
      setError('پایان جلسه ثبت نشد و سرور تأیید کرد همین جلسه هنوز فعال است. اکنون می‌توانید دوباره تلاش کنید.')
      return
    }
    setFinishState('UNKNOWN')
    onMutationUncertaintyChange(true)
    setError('نتیجه پایان جلسه هنوز روشن نیست. ابتدا وضعیت سرور را دوباره بررسی کنید؛ درخواست پایان تکرار نشد.')
  }

  const reconcileUnknownFinish = async () => {
    setError(null)
    await onSessionReconcile()
    const [activeResult, historyResult] = await Promise.allSettled([
      planningClient.getActiveStudySession(),
      loadTaskSessions(task.id),
    ])
    if (historyResult.status === 'fulfilled' && matchingActiveSession) {
      const reconciled = historyResult.value.find(({ id }) => id === matchingActiveSession.id)
      if (reconciled?.endedAt && reconciled.cancelledAt === null) {
        onMutationUncertaintyChange(false)
        setFinishedSession(reconciled)
        setFinishState('IDLE')
        setMessage(`زمان مطالعه با ${(reconciled.durationMinutes ?? 0).toLocaleString('fa-IR')} دقیقه ثبت شده بود؛ درخواست پایان تکرار نشد.`)
        return
      }
    }
    if (
      activeResult.status === 'fulfilled'
      && matchingActiveSession
      && activeResult.value?.id === matchingActiveSession.id
      && activeResult.value.endedAt === null
      && activeResult.value.cancelledAt === null
    ) {
      onMutationUncertaintyChange(false)
      setFinishState('RETRYABLE')
      setError('سرور تأیید کرد همین جلسه هنوز فعال است. اکنون تکرار درخواست پایان امن است.')
      return
    }
    setError('وضعیت پایان جلسه هنوز از سرور قابل تشخیص نیست. اتصال را بررسی و دوباره وضعیت را بازیابی کنید.')
  }

  const saveResult = async () => {
    if (!outcome || saving || completionUncertain) return
    if (matchingActiveSession && !finishedSession) {
      setError('ابتدا جلسه فعال همین کار را پایان دهید. تا آن زمان هیچ نتیجه دیگری ثبت نمی‌شود.')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    const nextReport = await saveTaskResult(authoritativeTask, {
      curriculumChanges,
      outcome,
      solvedTestCount,
    }, {
      completeTask: (taskId) => planningClient.updateTaskStatus(taskId, 'COMPLETED'),
      reconcileTask: async (taskId) => {
        try {
          return await planningClient.getTask(taskId)
        } catch {
          return null
        }
      },
      recordSolvedTests: planningClient.recordTaskProgress.bind(planningClient),
      toggleCurriculumItem: planningClient.toggleTaskCurriculumItem.bind(planningClient),
    })
    setReport(nextReport)
    onTaskChanged(nextReport.task)
    setSaving(false)

    if (nextReport.outcome.kind === 'COMPLETED') {
      onMutationUncertaintyChange(false)
      onDirtyChange(false)
      setMessage('پیشرفت و نتیجه نهایی کار با تأیید سرور ثبت شد.')
      return
    }
    if (nextReport.outcome.kind === 'UNKNOWN') {
      onMutationUncertaintyChange(true)
      setCompletionUncertain(true)
      setError('نتیجه درخواست انجام‌شدن کار روشن نیست. پیش از هر تلاش دوباره باید وضعیت کار از سرور خوانده شود.')
      return
    }
    if (outcome === 'COMPLETE') {
      setError('همه بخش‌ها ذخیره نشدند؛ نتیجه نهایی کار ثبت نشده و موارد موفق حفظ شده‌اند.')
      return
    }
    const pending = pendingResultEdits(nextReport.task, {
      curriculumChanges,
      outcome,
      solvedTestCount,
    })
    if (continueLaterDisposition(nextReport, pending) === 'CONFIRM_DISCARD') {
      onDirtyChange(true)
      setConfirmDiscard(true)
      return
    }
    onDirtyChange(false)
    setMessage('پیشرفت ذخیره شد و کار برای ادامه بعدی در انتظار باقی ماند.')
  }

  const reconcileUnknownCompletion = async () => {
    setError(null)
    try {
      const reconciled = await planningClient.getTask(task.id)
      onTaskChanged(reconciled)
      if (reconciled.status === 'COMPLETED') {
        onMutationUncertaintyChange(false)
        onDirtyChange(false)
        setCompletionUncertain(false)
        setReport((current) => current ? {
          ...current,
          outcome: { kind: 'COMPLETED' },
          saved: [...new Set([...current.saved, 'TASK_OUTCOME' as const])],
          task: reconciled,
          unsaved: current.unsaved.filter((area) => area !== 'TASK_OUTCOME'),
        } : current)
        setMessage('سرور تأیید کرد نتیجه نهایی کار قبلاً ثبت شده است؛ درخواست تکرار نشد.')
        return
      }
      if (reconciled.status === 'PENDING') {
        onMutationUncertaintyChange(false)
        setCompletionUncertain(false)
        setReport((current) => current ? {
          ...current,
          outcome: { kind: 'FAILED' },
          task: reconciled,
        } : current)
        setError('سرور تأیید کرد کار هنوز در انتظار است. اکنون تلاش دوباره برای ثبت نتیجه امن است.')
        return
      }
      onMutationUncertaintyChange(false)
      setCompletionUncertain(false)
      setError('وضعیت نهایی کار تغییر کرده است؛ اطلاعات تازه نمایش داده می‌شود و درخواست تکرار نشد.')
    } catch {
      setError('وضعیت کار هنوز از سرور دریافت نشد. درخواست انجام‌شدن تکرار نشد.')
    }
  }

  const savedLabels = report?.saved.map((area) => areaLabels[area]) ?? []
  const unsavedLabels = report?.unsaved.map((area) => areaLabels[area]) ?? []
  const failedCurriculumLabels = report?.curriculum.failedItemIds.map((itemId) => (
    executionItems.find(({ id }) => id === itemId)?.labelSnapshot ?? itemId
  )) ?? []
  const resultFieldsAllowed = authoritativeTask.status === 'PENDING'
    && authoritativeTask.contentType !== null
  const projectedCoverageComplete = authoritativeTask.contentType !== 'STUDY'
    || executionItems.every((item) => desiredItemState(item.id, item.completedAt))
  const completionBlocked = outcome === 'COMPLETE' && !projectedCoverageComplete

  return (
    <div className="task-result-flow">
      {matchingActiveSession && !finishedSession && (
        <section className="task-result-flow__step" aria-labelledby={`finish-session-${task.id}`}>
          <h3 id={`finish-session-${task.id}`}>۱. پایان جلسه مطالعه</h3>
          <p>پایان این جلسه فقط زمان مطالعه را ثبت می‌کند و کار را انجام‌شده نمی‌کند.</p>
          <details>
            <summary>یادداشت و بازخورد اختیاری جلسه</summary>
            <label>یادداشت<textarea maxLength={4000} onChange={(event) => setNotes(event.target.value)} rows={2} value={notes} /></label>
            <div className="task-result-flow__ratings">
              <label>تمرکز<select onChange={(event) => setFocusRating(event.target.value)} value={focusRating}><option value="">بدون امتیاز</option>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label>کیفیت مطالعه<select onChange={(event) => setQualityRating(event.target.value)} value={qualityRating}><option value="">بدون امتیاز</option>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
            </div>
          </details>
          <Button disabled={finishState === 'SAVING' || finishState === 'UNKNOWN'} onClick={() => void finishActiveSession()}>
            {finishState === 'SAVING' ? 'در حال بررسی و ثبت…' : finishState === 'RETRYABLE' ? 'تلاش دوباره برای پایان جلسه' : 'پایان جلسه و ادامه ثبت نتیجه'}
          </Button>
          {finishState === 'UNKNOWN' && (
            <Button onClick={() => void reconcileUnknownFinish()} variant="secondary">بررسی دوباره وضعیت سرور</Button>
          )}
        </section>
      )}

      {finishedSession && (
        <p className="task-result-flow__duration" role="status">
          زمان ثبت‌شده: <strong dir="ltr">{formatElapsedStudyTime(finishedSession.activeElapsedMs)}</strong>
        </p>
      )}

      {resultFieldsAllowed && (!matchingActiveSession || finishedSession) && (
        <section className="task-result-flow__step" aria-labelledby={`record-result-${task.id}`}>
          <h3 id={`record-result-${task.id}`}>{matchingActiveSession ? '۲. ثبت نتیجه واقعی' : 'ثبت نتیجه بدون تایمر'}</h3>
          {authoritativeTask.contentType === 'STUDY' && (
            <>
              {executionItems.length > 0 && (
                <fieldset>
                  <legend>مباحث انجام‌شده</legend>
                  {executionItems.map((item) => (
                    <label className="task-result-flow__check" key={item.id}>
                      <input
                        checked={desiredItemState(item.id, item.completedAt)}
                        onChange={(event) => setItemCompleted(item.id, event.currentTarget.checked)}
                        type="checkbox"
                      />
                      <span>{item.labelSnapshot}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <label htmlFor={`result-tests-${task.id}`}>
                مجموع تست‌های حل‌شده
                <input id={`result-tests-${task.id}`} inputMode="numeric" min="0" onChange={(event) => { const nextValue = event.target.value; setSolvedTestCount(nextValue); notifyDraftDirty(curriculumChanges, nextValue); setReport(null) }} step="1" type="number" value={solvedTestCount} />
              </label>
            </>
          )}
          {authoritativeTask.contentType === 'GENERAL' && (
            <p>برای کار عمومی فقط نتیجه نهایی را تأیید کنید؛ زمان مطالعه، مبحث و تست ثبت نمی‌شود.</p>
          )}
          <fieldset className="task-result-flow__outcome">
            <legend>نتیجه این کار چیست؟</legend>
            <label><input checked={outcome === 'COMPLETE'} name={`result-outcome-${task.id}`} onChange={() => { setOutcome('COMPLETE'); notifyDraftDirty(curriculumChanges, solvedTestCount, 'COMPLETE') }} type="radio" />کار کاملاً انجام شد</label>
            <label><input checked={outcome === 'CONTINUE'} name={`result-outcome-${task.id}`} onChange={() => { setOutcome('CONTINUE'); notifyDraftDirty(curriculumChanges, solvedTestCount, 'CONTINUE') }} type="radio" />بعداً ادامه می‌دهم</label>
          </fieldset>
          {completionBlocked && <p className="form-error">برای انجام‌شده‌کردن کار، ابتدا همه مباحث هدف را علامت بزنید.</p>}
          <Button disabled={!outcome || saving || completionUncertain || completionBlocked} onClick={() => void saveResult()}>
            {saving ? 'در حال ثبت بخش‌ها…' : 'ثبت انتخاب‌ها'}
          </Button>
          {completionUncertain && (
            <Button onClick={() => void reconcileUnknownCompletion()} variant="secondary">بررسی وضعیت کار در سرور</Button>
          )}
        </section>
      )}

      {!resultFieldsAllowed && <p>این کار نهایی شده است و نتیجه آن فقط قابل مشاهده است.</p>}
      {report && (savedLabels.length > 0 || unsavedLabels.length > 0) && (
        <div className="task-result-flow__report" role={unsavedLabels.length > 0 ? 'alert' : 'status'}>
          {savedLabels.length > 0 && <p>ذخیره‌شده: {savedLabels.join('، ')}</p>}
          {unsavedLabels.length > 0 && <p>ذخیره‌نشده: {unsavedLabels.join('، ')}</p>}
          {failedCurriculumLabels.length > 0 && <p>مباحث ناموفق: {failedCurriculumLabels.join('، ')}</p>}
          {report.solvedTests.kind === 'FAILED' && <p>تعداد تست واردشده «{report.solvedTests.draft}» ذخیره نشد؛ مقدار سرور حفظ شده است.</p>}
        </div>
      )}
      {confirmDiscard && (
        <div aria-labelledby={`discard-title-${task.id}`} className="task-result-flow__confirm" role="alertdialog">
          <p id={`discard-title-${task.id}`}>بخش‌های ذخیره‌شده حفظ می‌شوند، اما داده‌های ذخیره‌نشده با بستن این بخش از دست می‌روند. کار همچنان در انتظار می‌ماند.</p>
          <div>
            <button className="button button--secondary" onClick={() => setConfirmDiscard(false)} ref={discardCancelRef} type="button">بازگشت و تلاش دوباره</button>
            <Button onClick={() => { onDirtyChange(false); onRequestClose() }} variant="ghost">کنار گذاشتن داده ذخیره‌نشده و بستن</Button>
          </div>
        </div>
      )}
      {message && <p className="form-success" role="status">{message}</p>}
      {message && !confirmDiscard && !completionUncertain && (
        <Button onClick={() => { onDirtyChange(false); onRequestClose() }} variant="ghost">بستن ثبت نتیجه</Button>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}
