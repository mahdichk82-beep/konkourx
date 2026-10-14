import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  PlanningCurriculumField,
  createEmptyPlanningCurriculumValue,
} from '@konkourx/curriculum-browser'
import '@konkourx/curriculum-browser/styles.css'
import { AuthApiError, authClient } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { createCounselorCurriculumClient } from '../curriculum/curriculum-client'
import { studentTasksClient } from '../students/student-tasks-client'
import { taskContentErrorMessage } from '../students/task-error-messages'
import { formatJalaliDate, taskStartTimeOptions } from '../students/task-scheduling'
import {
  createComposerTask,
  deriveTimedWindow,
  durationPresets,
  submitComposerTasks,
  validateComposerTasks,
  withComposerScheduleMode,
  type ComposerTimedPrefill,
  type ComposerTaskDraft,
} from './task-composer'
import { createModalFocusLifecycle } from './modal-focus'

type UnifiedTaskComposerProps = {
  initialDate: string
  initialTimedWindow?: ComposerTimedPrefill
  onClose(): void
  onCreated(): void
  studentId: string
  studentLabel: string
}

const composerError = (error: unknown): string => {
  if (error instanceof AuthApiError) {
    if (error.code === 'STUDENT_NOT_FOUND') {
      return 'تخصیص فعال این دانش‌آموز پیدا نشد. فهرست دانش‌آموزان را دوباره بارگذاری کنید.'
    }
    const contentMessage = taskContentErrorMessage(error.code)
    if (contentMessage) return contentMessage
  }
  if (error instanceof Error && error.message) return error.message
  return 'ثبت تکلیف‌ها ممکن نشد. اطلاعات حفظ شده است؛ دوباره تلاش کنید.'
}

export function UnifiedTaskComposer({
  initialDate,
  initialTimedWindow,
  onClose,
  onCreated,
  studentId,
  studentLabel,
}: UnifiedTaskComposerProps) {
  const curriculumClient = useMemo(() => createCounselorCurriculumClient(
    studentId,
    authClient.authorizedRequest.bind(authClient),
  ), [studentId])
  const nextId = useRef(2)
  const [tasks, setTasks] = useState<ComposerTaskDraft[]>(() => [
    createComposerTask('composer-task-1', initialDate, initialTimedWindow),
  ])
  const [expandedTaskId, setExpandedTaskId] = useState('composer-task-1')
  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const submittingRef = useRef(submitting)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    submittingRef.current = submitting
  }, [submitting])

  useEffect(() => {
    const dialog = dialogRef.current
    const initialFocus = closeButtonRef.current
    if (!dialog || !initialFocus) return
    return createModalFocusLifecycle({
      canEscape: () => !submittingRef.current,
      dialog,
      document: dialog.ownerDocument,
      initialFocus,
      onEscape: () => onCloseRef.current(),
    })
  }, [])

  const updateTask = <K extends keyof ComposerTaskDraft>(
    id: string,
    field: K,
    value: ComposerTaskDraft[K],
  ) => {
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, [field]: value }
      : task))
    setError(null)
    setSuccess(null)
  }

  const selectContentType = (id: string, contentType: 'STUDY' | 'GENERAL') => {
    setTasks((current) => current.map((task) => task.id === id ? {
      ...task,
      contentType,
      curriculum: createEmptyPlanningCurriculumValue(),
      plannedTestCount: '',
    } : task))
    setError(null)
  }

  const selectScheduleMode = (id: string, scheduleMode: ComposerTaskDraft['scheduleMode']) => {
    setTasks((current) => current.map((task) => task.id === id
      ? withComposerScheduleMode(task, scheduleMode)
      : task))
    setError(null)
    setSuccess(null)
  }

  const addTask = () => {
    const id = `composer-task-${nextId.current}`
    nextId.current += 1
    setTasks((current) => [...current, createComposerTask(id, initialDate)])
    setExpandedTaskId(id)
    setReviewing(false)
    setError(null)
    setSuccess(null)
  }

  const removeTask = (id: string) => {
    if (tasks.length === 1) return
    const remaining = tasks.filter((task) => task.id !== id)
    setTasks(remaining)
    if (expandedTaskId === id) setExpandedTaskId(remaining[0]?.id ?? '')
    setReviewing(false)
    setError(null)
  }

  const beginReview = () => {
    const validationError = validateComposerTasks(tasks)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setSuccess(null)
    setReviewing(true)
  }

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    const result = await submitComposerTasks(
      tasks,
      (inputs) => studentTasksClient.createBatch(studentId, inputs),
    )
    if (!result.ok) {
      setError(composerError(result.error))
      setSubmitting(false)
      return
    }
    const created = result.value.created
    const id = `composer-task-${nextId.current}`
    nextId.current += 1
    setTasks([createComposerTask(id, initialDate)])
    setExpandedTaskId(id)
    setReviewing(false)
    setSubmitting(false)
    setSuccess(`${created.toLocaleString('fa-IR')} تکلیف برای ${studentLabel} ثبت شد.`)
    onCreated()
  }

  return createPortal(
    <div className="unified-composer-modal" role="presentation">
      <button className="unified-composer-modal__backdrop" aria-hidden="true" disabled={submitting} onClick={onClose} tabIndex={-1} type="button" />
      <section aria-label="فرم یکپارچه ساخت تکلیف" aria-modal="true" className="unified-composer" ref={dialogRef} role="dialog" tabIndex={-1}>
        <header className="unified-composer__header">
          <div>
            <p className="eyebrow">فرم یکپارچه ساخت تکلیف</p>
            <h2>برنامه‌ریزی برای {studentLabel}</h2>
            <p>یک یا چند تکلیف مستقل برای همین دانش‌آموز بسازید.</p>
          </div>
          <button aria-label="بستن" disabled={submitting} onClick={onClose} ref={closeButtonRef} type="button">×</button>
        </header>

        <div className="unified-composer__scroll-region">
          <div className="unified-composer__steps" aria-label="مراحل ساخت">
            <span className={!reviewing ? 'is-current' : 'is-complete'}><i>۱</i> تنظیم تکلیف‌ها</span>
            <span className={reviewing ? 'is-current' : ''}><i>۲</i> بازبینی و ثبت</span>
          </div>

          {success && <p className="form-success" role="status">{success}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          {reviewing ? (
            <div className="unified-composer-review">
              <div className="unified-composer-review__context">
                <span>دانش‌آموز</span><strong>{studentLabel}</strong>
                <span>تعداد تکلیف</span><strong>{tasks.length.toLocaleString('fa-IR')}</strong>
              </div>
              <div className="unified-composer-review__tasks">
                {tasks.map((task, index) => {
                  const window = task.scheduleMode === 'TIMED'
                    ? deriveTimedWindow(task.startTime, Number(task.durationMinutes))
                    : null
                  return (
                    <article key={task.id}>
                      <span>{(index + 1).toLocaleString('fa-IR')}</span>
                      <div>
                        <strong>{task.title.trim()}</strong>
                        <small>{task.contentType === 'STUDY' ? 'درسی' : 'عمومی'} · {formatJalaliDate(task.scheduledFor)}</small>
                        <small>{window ? `${task.startTime} تا ${window.endTime}` : `حجمی${task.plannedMinutes ? ` · ${Number(task.plannedMinutes).toLocaleString('fa-IR')} دقیقه` : ''}`}</small>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="unified-composer__tasks">
              {tasks.map((task, index) => {
                const timedWindow = task.scheduleMode === 'TIMED'
                  ? deriveTimedWindow(task.startTime, Number(task.durationMinutes))
                  : null
                return (
                  <article className="composer-task" key={task.id}>
                  <div className="composer-task__heading">
                    <button
                      aria-expanded={expandedTaskId === task.id}
                      className="composer-task__toggle"
                      onClick={() => setExpandedTaskId((current) => current === task.id ? '' : task.id)}
                      type="button"
                    >
                      <span>{(index + 1).toLocaleString('fa-IR')}</span>
                      <div>
                        <h3>{task.title.trim() || `تکلیف ${(index + 1).toLocaleString('fa-IR')}`}</h3>
                        <p>{task.scheduleMode === 'TIMED'
                          ? timedWindow ? `${task.startTime} تا ${timedWindow.endTime}` : 'زمان‌دار · زمان تکمیل نشده'
                          : 'حجمی'} · {formatJalaliDate(task.scheduledFor)}</p>
                      </div>
                      <i aria-hidden="true">⌄</i>
                    </button>
                    <Button disabled={tasks.length === 1 || submitting} onClick={() => removeTask(task.id)} variant="ghost">حذف</Button>
                  </div>

                  {expandedTaskId === task.id && <div className="composer-task__body">
                  <fieldset className="composer-choice-row">
                    <legend>نوع کار</legend>
                    <label className={task.contentType === 'STUDY' ? 'is-selected' : ''}>
                      <input checked={task.contentType === 'STUDY'} name={`${task.id}-content`} onChange={() => selectContentType(task.id, 'STUDY')} type="radio" />
                      درسی
                    </label>
                    <label className={task.contentType === 'GENERAL' ? 'is-selected' : ''}>
                      <input checked={task.contentType === 'GENERAL'} name={`${task.id}-content`} onChange={() => selectContentType(task.id, 'GENERAL')} type="radio" />
                      عمومی
                    </label>
                  </fieldset>

                  <div className="composer-task__grid">
                    <label>عنوان تکلیف<input maxLength={200} onChange={(event) => updateTask(task.id, 'title', event.target.value)} placeholder="مثلاً مرور فصل تنظیم عصبی" value={task.title} /></label>
                    <label>تاریخ<input onChange={(event) => updateTask(task.id, 'scheduledFor', event.target.value)} type="date" value={task.scheduledFor} /><small>{formatJalaliDate(task.scheduledFor)}</small></label>
                  </div>

                  {task.contentType === 'STUDY' && (
                    <PlanningCurriculumField
                      audience="counselor"
                      client={curriculumClient}
                      contextLabel={studentLabel}
                      minimumOne
                      onChange={(value) => updateTask(task.id, 'curriculum', value)}
                      value={task.curriculum}
                    />
                  )}

                  <fieldset className="composer-schedule">
                    <legend>شیوه زمان‌بندی</legend>
                    <div className="composer-choice-row">
                      <label className={task.scheduleMode === 'TIMED' ? 'is-selected' : ''}>
                        <input checked={task.scheduleMode === 'TIMED'} name={`${task.id}-schedule`} onChange={() => selectScheduleMode(task.id, 'TIMED')} type="radio" />
                        زمان‌دار · ساعت دقیق
                      </label>
                      <label className={task.scheduleMode === 'VOLUMETRIC' ? 'is-selected' : ''}>
                        <input checked={task.scheduleMode === 'VOLUMETRIC'} name={`${task.id}-schedule`} onChange={() => selectScheduleMode(task.id, 'VOLUMETRIC')} type="radio" />
                        حجمی · بدون ساعت ثابت
                      </label>
                    </div>

                    <div className="composer-duration-presets" aria-label="مدت‌های پیشنهادی">
                      {durationPresets.map((minutes) => {
                        const selected = task.scheduleMode === 'TIMED'
                          ? task.durationMinutes === String(minutes)
                          : task.plannedMinutes === String(minutes)
                        return <button className={selected ? 'is-selected' : ''} key={minutes} onClick={() => updateTask(task.id, task.scheduleMode === 'TIMED' ? 'durationMinutes' : 'plannedMinutes', String(minutes))} type="button">{minutes.toLocaleString('fa-IR')} دقیقه</button>
                      })}
                    </div>

                    {task.scheduleMode === 'TIMED' ? (
                      <div className="composer-task__grid composer-timed-fields">
                        <label>ساعت شروع<select onChange={(event) => updateTask(task.id, 'startTime', event.target.value)} value={task.startTime}><option value="">انتخاب کنید</option>{taskStartTimeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                        <label>مدت زمان (دقیقه)<input min={15} max={1440} onChange={(event) => updateTask(task.id, 'durationMinutes', event.target.value)} step={15} type="number" value={task.durationMinutes} /></label>
                        <label>ساعت پایان<input aria-readonly="true" readOnly value={timedWindow?.endTime ?? '—'} /></label>
                      </div>
                    ) : (
                      <label className="composer-optional-duration">مدت برنامه‌ریزی‌شده (اختیاری)<input min={0} max={1440} onChange={(event) => updateTask(task.id, 'plannedMinutes', event.target.value)} placeholder="بدون الزام" type="number" value={task.plannedMinutes} /><small>این مقدار ساعت شروع یا پایان ایجاد نمی‌کند.</small></label>
                    )}
                  </fieldset>

                  {task.contentType === 'STUDY' && <label className="composer-test-count">تعداد تست برنامه‌ریزی‌شده (اختیاری)<input min={0} onChange={(event) => updateTask(task.id, 'plannedTestCount', event.target.value)} placeholder="۰" type="number" value={task.plannedTestCount} /></label>}

                  <label className="composer-description">توضیحات یا راهنمای مشاور (اختیاری)<textarea maxLength={2000} onChange={(event) => updateTask(task.id, 'description', event.target.value)} rows={3} value={task.description} /></label>
                  </div>}
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <footer className="unified-composer__footer">
          {reviewing ? (
            <>
              <Button disabled={submitting} onClick={() => setReviewing(false)} variant="secondary">بازگشت و ویرایش</Button>
              <Button disabled={submitting} onClick={() => void submit()}>{submitting ? 'در حال ثبت…' : `ثبت ${tasks.length.toLocaleString('fa-IR')} تکلیف`}</Button>
            </>
          ) : (
            <>
              <Button disabled={submitting || tasks.length >= 50} onClick={addTask} variant="secondary">افزودن تکلیف دیگر</Button>
              <Button disabled={submitting} onClick={beginReview}>بازبینی تکلیف‌ها</Button>
            </>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  )
}
