import { useMemo, useState, type FormEvent } from 'react'
import {
  PlanningCurriculumField,
  planningDraftToTargetInputs,
  type PlanningTargetDraftItem,
} from '@konkourx/curriculum-browser'
import '@konkourx/curriculum-browser/styles.css'
import { AuthApiError, authClient } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { createCounselorCurriculumClient } from '../curriculum/curriculum-client'
import { studentTasksClient } from './student-tasks-client'
import { taskContentErrorMessage } from './task-error-messages'

type StudentTaskFormProps = {
  onTaskCreated?(): void
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

const createError = (error: unknown) => {
  if (error instanceof AuthApiError) {
    if (error.code === 'STUDENT_NOT_FOUND') {
      return 'تخصیص فعال این دانش‌آموز پیدا نشد. صفحه را دوباره بارگذاری کنید.'
    }
    const message = taskContentErrorMessage(error.code)
    if (message) return message
  }
  return 'ثبت وظیفه ممکن نشد. اطلاعات را بررسی و دوباره تلاش کنید.'
}

export function StudentTaskForm({ onTaskCreated, studentId, studentLabel }: StudentTaskFormProps) {
  const curriculumClient = useMemo(() => createCounselorCurriculumClient(
    studentId,
    authClient.authorizedRequest.bind(authClient),
  ), [studentId])
  const [contentType, setContentType] = useState<'STUDY' | 'GENERAL' | ''>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledFor, setScheduledFor] = useState(localDate)
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [taskCurriculum, setTaskCurriculum] = useState<readonly PlanningTargetDraftItem[]>([])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedTitle = title.trim()
    if (!normalizedTitle || !scheduledFor) {
      setFormError('عنوان و تاریخ وظیفه الزامی است.')
      return
    }
    if (!contentType) {
      setFormError('نوع کار را انتخاب کنید.')
      return
    }
    const curriculumTargets = contentType === 'STUDY' ? planningDraftToTargetInputs(taskCurriculum) : []
    if (contentType === 'STUDY' && (
      curriculumTargets.length === 0
      || curriculumTargets.some(({ referenceKind, selectionMode }) => referenceKind !== 'NODE' || selectionMode !== 'EXACT')
    )) {
      setFormError('برای کار درسی حداقل یک مبحث معتبر انتخاب کنید.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    setSuccess(null)
    try {
      const task = await studentTasksClient.create(studentId, {
        contentType,
        curriculumTargets,
        title: normalizedTitle,
        description: description.trim() || null,
        scheduledFor,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        subjectId: null,
        topicId: null,
      })
      setTitle('')
      setDescription('')
      setEstimatedMinutes('')
      setContentType('')
      setTaskCurriculum([])
      setSuccess(`وظیفه «${task.title}» برای دانش‌آموز ثبت شد.`)
      onTaskCreated?.()
    } catch (error) {
      setFormError(createError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="student-task-card" title="ایجاد وظیفه برای دانش‌آموز">
      <p className="student-task-card__intro">
        وظیفه با منبع مشاور و در وضعیت «در انتظار» ثبت می‌شود و دانش‌آموز آن را در برنامه روز انتخاب‌شده می‌بیند.
      </p>

      <form className="student-task-form" onSubmit={(event) => void submit(event)}>
          <fieldset className="task-content-type">
            <legend>نوع کار</legend>
            <label><input checked={contentType === 'STUDY'} name="counselor-task-content-type" onChange={() => { setContentType('STUDY'); setTaskCurriculum([]) }} type="radio" />درسی</label>
            <label><input checked={contentType === 'GENERAL'} name="counselor-task-content-type" onChange={() => { setContentType('GENERAL'); setTaskCurriculum([]) }} type="radio" />عمومی</label>
          </fieldset>
          <div className="student-task-form__grid">
            <label htmlFor="counselor-task-title">
              عنوان وظیفه
              <input
                id="counselor-task-title"
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="مثلاً مرور فصل ژنتیک"
                required
                value={title}
              />
            </label>
            <label htmlFor="counselor-task-date">
              تاریخ انجام
              <input
                id="counselor-task-date"
                onChange={(event) => setScheduledFor(event.target.value)}
                required
                type="date"
                value={scheduledFor}
              />
            </label>
            <label htmlFor="counselor-task-minutes">
              زمان تخمینی (دقیقه)
              <input
                id="counselor-task-minutes"
                max={1440}
                min={1}
                onChange={(event) => setEstimatedMinutes(event.target.value)}
                placeholder="اختیاری"
                type="number"
                value={estimatedMinutes}
              />
            </label>
          </div>

          {contentType === 'STUDY' ? <PlanningCurriculumField
            audience="counselor"
            client={curriculumClient}
            contextLabel={studentLabel}
            onChange={setTaskCurriculum}
            value={taskCurriculum}
          /> : null}

          <label htmlFor="counselor-task-description">
            توضیحات
            <textarea
              id="counselor-task-description"
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="توضیح تکمیلی برای دانش‌آموز (اختیاری)"
              rows={4}
              value={description}
            />
          </label>

          {formError && <p className="form-error" role="alert">{formError}</p>}
          {success && <p className="form-success" role="status">{success}</p>}

          <div className="student-task-form__actions">
            <Button disabled={submitting} type="submit">
              {submitting ? 'در حال ثبت…' : 'ثبت وظیفه برای دانش‌آموز'}
            </Button>
          </div>
        </form>
    </Card>
  )
}
