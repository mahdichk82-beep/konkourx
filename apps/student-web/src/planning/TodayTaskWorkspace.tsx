import type { RefObject, ReactNode } from 'react'
import type { DailyTask, StudySession } from './planning-client'
import { TodayTaskDetail } from './TodayTaskDetail'
import { TodayTaskList } from './TodayTaskList'
import { taskActionModel, todayTaskGroups, type TodayTaskAction } from './today-workspace'

export type TodayTaskWorkspaceProps = {
  activeSession: StudySession | null
  detailHeadingRef?: RefObject<HTMLHeadingElement | null>
  listSurfaceRef?: RefObject<HTMLDivElement | null>
  detailSections?: {
    historyContent?: ReactNode
    planContent?: ReactNode
    resultContent?: ReactNode
    scheduleContent?: ReactNode
    secondaryActionContent?: ReactNode
  }
  isLoadingMoreOverdue: boolean
  numberFormatter: Intl.NumberFormat
  onAction(task: DailyTask, action: TodayTaskAction): void
  onCloseDetail(): void
  onLoadMoreOverdue(): void
  onSelectTask(taskId: string): void
  overdueNextCursor: string | null
  overdueTasks: DailyTask[]
  selectedTask: DailyTask | null
  subjectNames: ReadonlyMap<string, string>
  todayKey: string
  todayTasks: DailyTask[]
}

export function TodayTaskWorkspace({
  activeSession,
  detailHeadingRef,
  detailSections,
  isLoadingMoreOverdue,
  listSurfaceRef,
  numberFormatter,
  onAction,
  onCloseDetail,
  onLoadMoreOverdue,
  onSelectTask,
  overdueNextCursor,
  overdueTasks,
  selectedTask,
  subjectNames,
  todayKey,
  todayTasks,
}: TodayTaskWorkspaceProps) {
  const groups = todayTaskGroups(todayTasks, overdueTasks).filter(({ items }) => items.length > 0)
  const selectedActionModel = selectedTask
    ? taskActionModel(selectedTask, activeSession)
    : null
  return (
    <div className={`today-workspace${selectedTask ? ' has-detail' : ''}`}>
      <div aria-label="فهرست کارهای امروز" className="today-workspace__list" ref={listSurfaceRef} tabIndex={-1}>
        <TodayTaskList
          activeSession={activeSession}
          groups={groups}
          isLoadingMoreOverdue={isLoadingMoreOverdue}
          numberFormatter={numberFormatter}
          onAction={onAction}
          onLoadMoreOverdue={onLoadMoreOverdue}
          onSelectTask={onSelectTask}
          overdueNextCursor={overdueNextCursor}
          selectedTaskId={selectedTask?.id ?? null}
          subjectNames={subjectNames}
          todayKey={todayKey}
        />
      </div>
      <div className="today-workspace__detail">
        {selectedTask && selectedActionModel ? (
          <TodayTaskDetail
            action={selectedActionModel.primary}
            headingRef={detailHeadingRef}
            historyContent={detailSections?.historyContent}
            onBack={onCloseDetail}
            onPrimaryAction={() => onAction(selectedTask, selectedActionModel.primary)}
            onSecondaryAction={(action) => onAction(selectedTask, action)}
            planContent={detailSections?.planContent}
            resultContent={detailSections?.resultContent}
            scheduleContent={detailSections?.scheduleContent}
            secondaryActionContent={detailSections?.secondaryActionContent}
            secondaryActions={selectedActionModel.secondary}
            subjectName={selectedTask.subjectId ? subjectNames.get(selectedTask.subjectId) ?? null : null}
            task={selectedTask}
            todayKey={todayKey}
          />
        ) : (
          <div className="today-workspace__placeholder">
            <p className="eyebrow">فضای کار امروز</p>
            <h2>یک کار را انتخاب کنید</h2>
            <p>جزئیات و اقدام‌های تکمیلی فقط برای همان کار نمایش داده می‌شوند.</p>
          </div>
        )}
      </div>
    </div>
  )
}
