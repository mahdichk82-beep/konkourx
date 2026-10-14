import { useState } from 'react'
import { Button } from '../components/ui/Button'
import type { CounselorVisibleTask } from '../students/student-tasks-client'
import { formatTaskSchedule } from '../students/task-scheduling'
import {
  buildTaskEvidence,
  filterPlanningTasks,
  plannedMinutesForTask,
  taskProgressPercent,
  taskSubjectLabel,
  type PlanningTaskFilter,
} from './planning-ui'

type PlanningTaskRailProps = {
  dateKey: string
  onCreate(): void
  onOpenStudent(): void
  tasks: CounselorVisibleTask[]
  todayKey: string
}

const filters: Array<{ label: string; value: PlanningTaskFilter }> = [
  { label: 'همه', value: 'ALL' },
  { label: 'در انتظار', value: 'PENDING' },
  { label: 'بخشی', value: 'PARTIAL' },
  { label: 'انجام‌شده', value: 'COMPLETED' },
  { label: 'ردشده', value: 'SKIPPED' },
]

export function PlanningTaskRail({ dateKey, onCreate, onOpenStudent, tasks, todayKey }: PlanningTaskRailProps) {
  const [filter, setFilter] = useState<PlanningTaskFilter>('ALL')
  const visibleTasks = filterPlanningTasks(tasks, filter, dateKey)

  return (
    <aside className="planning-task-rail" aria-label="تکلیف‌های روز انتخاب‌شده">
      <div className="planning-panel-heading planning-task-rail__heading">
        <div><h2>تکلیف‌های این روز</h2><p>{visibleTasks.length.toLocaleString('fa-IR')} مورد قابل مشاهده</p></div>
        <button className="planning-overflow-button" onClick={onOpenStudent} type="button" aria-label="بازکردن پرونده و ویرایش تکلیف‌ها">•••</button>
      </div>
      <div className="planning-task-filters" aria-label="فیلتر وضعیت تکلیف">
        {filters.map((item) => (
          <button
            aria-pressed={filter === item.value}
            className={filter === item.value ? 'is-selected' : ''}
            key={item.value}
            onClick={() => setFilter(item.value)}
            type="button"
          >{item.label}</button>
        ))}
      </div>
      {visibleTasks.length === 0 ? (
        <div className="planning-task-rail__empty" role="status">
          <strong>تکلیفی در این وضعیت نیست</strong>
          <p>فیلتر دیگری انتخاب کنید یا یک تکلیف واقعی بسازید.</p>
        </div>
      ) : (
        <div className="planning-task-rail__list">
          {visibleTasks.map((task) => {
            const evidence = buildTaskEvidence(task, todayKey)
            const plannedMinutes = plannedMinutesForTask(task)
            const progressPercent = taskProgressPercent(task)
            return (
              <article className={`planning-task-card planning-status-${task.status.toLowerCase()}`} key={task.id}>
                <div className="planning-task-card__heading">
                  <div>
                    <strong>{task.title}</strong>
                    <small>{taskSubjectLabel(task)}</small>
                  </div>
                  <span>{evidence.statusLabel}</span>
                </div>
                <div className="planning-task-card__schedule">
                  <span>{formatTaskSchedule(task.startMinuteOfDay, task.endMinuteOfDay)}</span>
                  <span>{plannedMinutes > 0 ? `${plannedMinutes.toLocaleString('fa-IR')} دقیقه برنامه` : 'بدون مدت ثابت'}</span>
                </div>
                <div className="planning-task-card__progress">
                  {progressPercent === null ? <span /> : (
                    <div aria-label={`${evidence.actualTimeLabel}؛ ${evidence.plannedTimeLabel}`} role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={progressPercent}>
                      <span style={{ width: `${progressPercent}%` }} />
                    </div>
                  )}
                  <small>{task.recordedMinutes > 0 ? `${task.recordedMinutes.toLocaleString('fa-IR')} دقیقه ثبت‌شده` : 'بدون مطالعه ثبت‌شده'}</small>
                </div>
                <details className="planning-task-card__details">
                  <summary>جزئیات اجرا</summary>
                  {task.description && <p>{task.description}</p>}
                  {evidence.details.length > 0 && <ul>{evidence.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
                  <small>{task.source === 'COUNSELOR' ? 'تعیین‌شده توسط مشاور' : 'برنامه شخصی دانش‌آموز'}</small>
                  <button className="planning-task-card__detail" onClick={onOpenStudent} type="button">مشاهده جزئیات و ویرایش مجاز</button>
                </details>
              </article>
            )
          })}
        </div>
      )}
      <Button className="planning-task-rail__create" onClick={onCreate}>ساخت تکلیف جدید</Button>
    </aside>
  )
}
