import { classifyTaskPresentation, formatCurriculumProgress } from '@konkourx/task-presentation'
import { Button } from '../components/ui/Button'
import type { DailyTask, StudySession } from './planning-client'
import {
  taskActionModel,
  taskSummaryModel,
  type TodayTaskAction,
  type TodayTaskGroup,
} from './today-workspace'

const actionLabels: Record<TodayTaskAction, string> = {
  FINISH_AND_RECORD: 'پایان و ثبت نتیجه',
  RECORD_RESULT: 'ثبت نتیجه',
  START_STUDY: 'شروع مطالعه',
  SWITCH_STUDY: 'تغییر مطالعه',
  VIEW_DETAILS: 'مشاهده جزئیات',
}

const groupLabels: Record<TodayTaskGroup['id'], string> = {
  overdue: 'ادامه کارهای عقب‌افتاده',
  today: 'کارهای امروز',
}

export type TodayTaskListProps = {
  activeSession: StudySession | null
  groups: TodayTaskGroup[]
  isLoadingMoreOverdue: boolean
  numberFormatter: Intl.NumberFormat
  onAction(task: DailyTask, action: TodayTaskAction): void
  onLoadMoreOverdue(): void
  onSelectTask(taskId: string): void
  overdueNextCursor: string | null
  selectedTaskId: string | null
  subjectNames: ReadonlyMap<string, string>
  todayKey: string
}

export function TodayTaskList({
  activeSession,
  groups,
  isLoadingMoreOverdue,
  numberFormatter,
  onAction,
  onLoadMoreOverdue,
  onSelectTask,
  overdueNextCursor,
  selectedTaskId,
  subjectNames,
  todayKey,
}: TodayTaskListProps) {
  return (
    <div className="today-task-list" data-today-task-list>
      {groups.map((group) => (
        <section aria-labelledby={`today-task-group-${group.id}`} className="today-task-group" key={group.id}>
          <div className="today-task-group__heading">
            <h3 id={`today-task-group-${group.id}`}>{groupLabels[group.id]}</h3>
            <span>{numberFormatter.format(group.items.length)} کار</span>
          </div>
          <div className="today-task-rail">
            {group.items.map((task) => {
              const action = taskActionModel(task, activeSession)
              const summary = taskSummaryModel(
                task,
                task.subjectId ? subjectNames.get(task.subjectId) ?? null : null,
              )
              const presentation = classifyTaskPresentation(task, todayKey)
              const presentationClass = presentation.status.toLowerCase().replaceAll('_', '-')
              return (
                <article
                  className={`today-task-row task-presentation--${presentationClass}${selectedTaskId === task.id ? ' is-selected' : ''}`}
                  key={task.id}
                >
                  <button
                    aria-current={selectedTaskId === task.id ? 'true' : undefined}
                    className="today-task-row__summary"
                    data-task-focus-id={task.id}
                    onClick={() => onSelectTask(task.id)}
                    type="button"
                  >
                    <span className="today-task-row__identity">
                      <strong>{summary.title}</strong>
                      {summary.context && <small>{summary.context}</small>}
                    </span>
                    <span className={`task-status task-presentation-badge--${presentationClass}`}>
                      {presentation.label}
                    </span>
                    <span className="today-task-row__facts">
                      <span>{summary.schedule.label}</span>
                      {summary.estimatedMinutes !== null && (
                        <span>برنامه: {numberFormatter.format(summary.estimatedMinutes)} دقیقه</span>
                      )}
                      {task.contentType === 'STUDY' && (
                        <span>{numberFormatter.format(summary.actualSolvedTestCount)} تست حل‌شده</span>
                      )}
                      {summary.curriculum.totalItemCount > 0 && (
                        <span>{formatCurriculumProgress(
                          summary.curriculum.completedItemCount,
                          summary.curriculum.totalItemCount,
                        )}</span>
                      )}
                    </span>
                  </button>
                  <Button
                    aria-label={`${actionLabels[action.primary]} برای ${task.title}`}
                    onClick={() => onAction(task, action.primary)}
                    variant={action.primary === 'VIEW_DETAILS' ? 'secondary' : undefined}
                  >
                    {actionLabels[action.primary]}
                  </Button>
                </article>
              )
            })}
          </div>
          {group.id === 'overdue' && overdueNextCursor && (
            <div className="load-more">
              <Button disabled={isLoadingMoreOverdue} onClick={onLoadMoreOverdue} variant="secondary">
                {isLoadingMoreOverdue ? 'در حال دریافت…' : 'نمایش کارهای عقب‌افتاده بیشتر'}
              </Button>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
