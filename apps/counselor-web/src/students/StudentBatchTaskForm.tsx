import { useMemo, useRef, useState, type FormEvent } from 'react'
import {
  PlanningCurriculumField,
  createEmptyPlanningCurriculumValue,
} from '@konkourx/curriculum-browser'
import '@konkourx/curriculum-browser/styles.css'
import { AuthApiError, authClient } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { createCounselorCurriculumClient } from '../curriculum/curriculum-client'
import {
  addBatchTaskRow,
  createBatchTaskRow,
  removeBatchTaskRow,
  submitBatchTaskRows,
  updateBatchTaskRowCurriculum,
  type BatchTaskRow,
} from './batch-task-form'
import { studentTasksClient } from './student-tasks-client'
import { taskContentErrorMessage } from './task-error-messages'

type StudentBatchTaskFormProps = {
  onTasksCreated?(): void
  studentId: string
  studentLabel: string
}

const localDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const batchError = (error: unknown) => {
  if (error instanceof AuthApiError) {
    if (error.code === 'STUDENT_NOT_FOUND') {
      return 'تخصیص فعال این دانش‌آموز پیدا نشد. صفحه را دوباره بارگذاری کنید.'
    }
    const message = taskContentErrorMessage(error.code)
    if (message) return message
    return 'ثبت گروهی وظایف ممکن نشد. اطلاعات را بررسی و دوباره تلاش کنید.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'ثبت گروهی وظایف ممکن نشد. اطلاعات را بررسی و دوباره تلاش کنید.'
}

export function StudentBatchTaskForm({
  onTasksCreated,
  studentId,
  studentLabel,
}: StudentBatchTaskFormProps) {
  const curriculumClient = useMemo(() => createCounselorCurriculumClient(
    studentId,
    authClient.authorizedRequest.bind(authClient),
  ), [studentId])
  const nextRowId = useRef(2)
  const [rows, setRows] = useState<BatchTaskRow[]>(() => [
    createBatchTaskRow('batch-task-1', localDate()),
  ])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const updateRow = <K extends keyof BatchTaskRow>(
    id: string,
    field: K,
    value: BatchTaskRow[K],
  ) => {
    setRows((current) => current.map((row) => (
      row.id === id ? { ...row, [field]: value } : row
    )))
  }

  const selectType = (rowId: string, contentType: BatchTaskRow['contentType']) => {
    setRows((current) => current.map((row) => row.id === rowId
      ? { ...row, contentType, curriculum: createEmptyPlanningCurriculumValue() }
      : row))
    setFormError(null)
  }

  const addRow = () => {
    const id = `batch-task-${nextRowId.current}`
    nextRowId.current += 1
    setRows((current) => addBatchTaskRow(current, createBatchTaskRow(id, localDate())))
    setFormError(null)
    setSuccess(null)
  }

  const removeRow = (id: string) => {
    setRows((current) => removeBatchTaskRow(current, id))
    setFormError(null)
    setSuccess(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setSuccess(null)

    const result = await submitBatchTaskRows(
      rows,
      (tasks) => studentTasksClient.createBatch(studentId, tasks),
    )
    if (!result.ok) {
      setFormError(batchError(result.error))
      setSubmitting(false)
      return
    }

    setRows([createBatchTaskRow(`batch-task-${nextRowId.current}`, localDate())])
    nextRowId.current += 1
    setSuccess(`${result.value.created.toLocaleString('fa-IR')} وظیفه با موفقیت ثبت شد.`)
    setSubmitting(false)
    onTasksCreated?.()
  }

  return (
    <Card className="student-task-card student-batch-card" title="ایجاد گروهی وظایف">
      <p className="student-task-card__intro">
        چند وظیفه مستقل با منبع مشاور و وضعیت «در انتظار» را در یک عملیات ثبت کنید.
      </p>

      <form className="student-task-form" onSubmit={(event) => void submit(event)}>
          <div className="student-batch-rows">
            {rows.map((row, index) => {
              return (
                <section className="student-batch-row" key={row.id}>
                  <div className="student-batch-row__heading">
                    <h3>وظیفه {Number(index + 1).toLocaleString('fa-IR')}</h3>
                    <Button
                      disabled={submitting || rows.length === 1}
                      onClick={() => removeRow(row.id)}
                      type="button"
                      variant="ghost"
                    >
                      حذف ردیف
                    </Button>
                  </div>
                  <fieldset className="task-content-type">
                    <legend>نوع کار</legend>
                    <label><input checked={row.contentType === 'STUDY'} onChange={() => selectType(row.id, 'STUDY')} type="radio" name={`${row.id}-content-type`} />درسی</label>
                    <label><input checked={row.contentType === 'GENERAL'} onChange={() => selectType(row.id, 'GENERAL')} type="radio" name={`${row.id}-content-type`} />عمومی</label>
                  </fieldset>
                  <div className="student-batch-row__grid">
                    <label htmlFor={`${row.id}-title`}>
                      عنوان
                      <input
                        id={`${row.id}-title`}
                        maxLength={200}
                        onChange={(event) => updateRow(row.id, 'title', event.target.value)}
                        required
                        value={row.title}
                      />
                    </label>
                    <label htmlFor={`${row.id}-date`}>
                      تاریخ
                      <input
                        id={`${row.id}-date`}
                        onChange={(event) => updateRow(row.id, 'scheduledFor', event.target.value)}
                        required
                        type="date"
                        value={row.scheduledFor}
                      />
                    </label>
                    <label htmlFor={`${row.id}-minutes`}>
                      زمان برنامه‌ریزی‌شده (دقیقه)
                      <input
                        id={`${row.id}-minutes`}
                        max={1440}
                        min={0}
                        onChange={(event) => updateRow(row.id, 'plannedMinutes', event.target.value)}
                        required
                        type="number"
                        value={row.plannedMinutes}
                      />
                    </label>
                    {row.contentType === 'STUDY' ? <label htmlFor={`${row.id}-tests`}>
                      تعداد تست برنامه‌ریزی‌شده
                      <input
                        id={`${row.id}-tests`}
                        min={0}
                        onChange={(event) => updateRow(row.id, 'plannedTestCount', event.target.value)}
                        required
                        type="number"
                        value={row.plannedTestCount}
                      />
                    </label> : null}
                    <label className="student-batch-row__description" htmlFor={`${row.id}-description`}>
                      توضیحات
                      <textarea
                        id={`${row.id}-description`}
                        maxLength={2000}
                        onChange={(event) => updateRow(row.id, 'description', event.target.value)}
                        rows={2}
                        value={row.description}
                      />
                    </label>
                  </div>
                  {row.contentType === 'STUDY' ? <PlanningCurriculumField
                    audience="counselor"
                    client={curriculumClient}
                    contextLabel={studentLabel}
                    onChange={(curriculum) => setRows((current) => (
                      updateBatchTaskRowCurriculum(current, row.id, curriculum)
                    ))}
                    value={row.curriculum}
                  /> : null}
                </section>
              )
            })}
          </div>

          {formError && <p className="form-error" role="alert">{formError}</p>}
          {success && <p className="form-success" role="status">{success}</p>}

          <div className="student-batch-actions">
            <Button
              disabled={submitting || rows.length >= 50}
              onClick={addRow}
              type="button"
              variant="secondary"
            >
              افزودن ردیف
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? 'در حال ثبت همه وظایف…' : 'ثبت همه وظایف'}
            </Button>
          </div>
        </form>
    </Card>
  )
}
