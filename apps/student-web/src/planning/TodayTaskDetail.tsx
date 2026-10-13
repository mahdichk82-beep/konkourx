import type { ReactNode, RefObject } from 'react'
import { classifyTaskPresentation, formatCurriculumProgress } from '@konkourx/task-presentation'
import { Button } from '../components/ui/Button'
import type { DailyTask } from './planning-client'
import { taskSummaryModel, type TodayTaskAction } from './today-workspace'

const actionLabels: Record<TodayTaskAction, string> = {
  FINISH_AND_RECORD: 'پایان و ثبت نتیجه',
  RECORD_RESULT: 'ثبت نتیجه',
  START_STUDY: 'شروع مطالعه',
  SWITCH_STUDY: 'تغییر مطالعه',
  VIEW_DETAILS: 'مشاهده جزئیات',
}

export type TodayTaskDetailProps = {
  action: TodayTaskAction
  historyContent?: ReactNode
  headingRef?: RefObject<HTMLHeadingElement | null>
  onBack(): void
  onPrimaryAction(): void
  onSecondaryAction(action: TodayTaskAction): void
  planContent?: ReactNode
  resultContent?: ReactNode
  scheduleContent?: ReactNode
  secondaryActionContent?: ReactNode
  secondaryActions: TodayTaskAction[]
  subjectName: string | null
  task: DailyTask
  todayKey: string
}

export function TodayTaskDetail({
  action,
  headingRef,
  historyContent,
  onBack,
  onPrimaryAction,
  onSecondaryAction,
  planContent,
  resultContent,
  scheduleContent,
  secondaryActionContent,
  secondaryActions,
  subjectName,
  task,
  todayKey,
}: TodayTaskDetailProps) {
  const summary = taskSummaryModel(task, subjectName)
  const presentation = classifyTaskPresentation(task, todayKey)
  const presentationClass = presentation.status.toLowerCase().replaceAll('_', '-')
  return (
    <article className="today-task-detail" data-today-task-detail={task.id}>
      <Button aria-label="بازگشت به فهرست کارها" className="today-task-detail__back" onClick={onBack} variant="ghost">
        بازگشت به فهرست
      </Button>
      <header className="today-task-detail__header">
        <div>
          <p className="eyebrow">جزئیات کار</p>
          <h2 id={`today-task-detail-title-${task.id}`} ref={headingRef} tabIndex={-1}>{task.title}</h2>
          {summary.context && <p>{summary.context}</p>}
        </div>
        <span className={`task-status task-presentation-badge--${presentationClass}`}>
          {presentation.label}
        </span>
      </header>
      <div className="today-task-detail__facts">
        <span>{summary.schedule.label}</span>
        <span>{task.source === 'COUNSELOR' ? 'تعیین‌شده توسط مشاور' : 'کار شخصی'}</span>
        {task.estimatedMinutes !== null && <span>زمان برنامه‌ریزی‌شده: {task.estimatedMinutes.toLocaleString('fa-IR')} دقیقه</span>}
        {task.plannedTestCount > 0 && <span>{task.plannedTestCount.toLocaleString('fa-IR')} تست برنامه‌ریزی‌شده</span>}
        {task.contentType === 'STUDY' && <span>{task.actualSolvedTestCount.toLocaleString('fa-IR')} تست حل‌شده</span>}
        {task.curriculum.totalItemCount > 0 && (
          <span>{formatCurriculumProgress(task.curriculum.completedItemCount, task.curriculum.totalItemCount)}</span>
        )}
      </div>
      {presentation.indicatorLabel && <small className="task-presentation-indicator">{presentation.indicatorLabel}</small>}
      {action !== 'VIEW_DETAILS' && (
        <Button
          aria-label={`${actionLabels[action]} برای ${task.title}`}
          className="today-task-detail__primary"
          onClick={onPrimaryAction}
        >
          {actionLabels[action]}
        </Button>
      )}
      {secondaryActions.length > 0 && (
        <div className="today-task-detail__secondary-actions">
          {secondaryActions.map((secondaryAction) => (
            <Button
              aria-label={`${actionLabels[secondaryAction]} برای ${task.title}`}
              key={secondaryAction}
              onClick={() => onSecondaryAction(secondaryAction)}
              variant="secondary"
            >
              {secondaryAction === 'RECORD_RESULT' && task.contentType === 'STUDY'
                ? 'ثبت نتیجه بدون تایمر'
                : actionLabels[secondaryAction]}
            </Button>
          ))}
        </div>
      )}
      {resultContent && <section aria-label="ثبت نتیجه کار" className="today-task-detail__result">{resultContent}</section>}
      {planContent && <details><summary>برنامه و توضیحات</summary><div>{planContent}</div></details>}
      {historyContent && <details><summary>سابقه مطالعه</summary><div>{historyContent}</div></details>}
      {scheduleContent && <details><summary>زمان‌بندی شخصی</summary><div>{scheduleContent}</div></details>}
      {secondaryActionContent && <details><summary>اقدام‌های دیگر</summary><div>{secondaryActionContent}</div></details>}
    </article>
  )
}
