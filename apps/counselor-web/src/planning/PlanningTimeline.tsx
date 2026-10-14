import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import type { CounselorVisibleTask } from '../students/student-tasks-client'
import {
  advanceTimelineSelection,
  layoutTimedTasks,
  timelineHeight,
  timelineSlotFromOffset,
  type TimelineSelection,
} from './planning-timeline'
import { formatTimelineTime, planningAccent, tasksForDate } from './planning-ui'

export type PlanningDay = {
  key: string
  label: string
  shortLabel: string
}

type PlanningTimelineProps = {
  days: PlanningDay[]
  expanded: boolean
  onExpandedChange(expanded: boolean): void
  onSelectedDayChange(dateKey: string): void
  onTimeRangeSelected(selection: TimelineSelection & { endMinuteOfDay: number }): void
  selectedDayKey: string
  tasks: CounselorVisibleTask[]
  viewMode: 'DAY' | 'WEEK'
}

const hours = Array.from({ length: 24 }, (_, hour) => hour)

export function PlanningTimeline({
  days,
  expanded,
  onExpandedChange,
  onSelectedDayChange,
  onTimeRangeSelected,
  selectedDayKey,
  tasks,
  viewMode,
}: PlanningTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<TimelineSelection | null>(null)
  const [keyboardMinute, setKeyboardMinute] = useState(8 * 60)
  const visibleDays = viewMode === 'DAY'
    ? days.filter(({ key }) => key === selectedDayKey)
    : days
  const visibleTasks = viewMode === 'DAY'
    ? tasksForDate(tasks, selectedDayKey)
    : tasks.filter((task) => days.some(({ key }) => key === task.scheduledFor.slice(0, 10)))
  const volumetricTasks = visibleTasks.filter((task) => (
    task.startMinuteOfDay === null && task.endMinuteOfDay === null
  ))
  const height = timelineHeight(expanded)

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    scroller.scrollTop = (7 / 24) * height
  }, [expanded, height])

  const selectSlot = (dateKey: string, minute: number) => {
    const next = advanceTimelineSelection(selection, dateKey, minute)
    onSelectedDayChange(dateKey)
    setKeyboardMinute(next.endMinuteOfDay === null ? next.startMinuteOfDay : minute)
    if (next.endMinuteOfDay !== null) {
      setSelection(null)
      onTimeRangeSelected(next as TimelineSelection & { endMinuteOfDay: number })
      return
    }
    setSelection(next)
  }

  const selectFromPointer = (event: MouseEvent<HTMLDivElement>, dateKey: string) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    selectSlot(dateKey, timelineSlotFromOffset(event.clientY - bounds.top, bounds.height))
  }

  const selectFromKeyboard = (event: KeyboardEvent<HTMLDivElement>, dateKey: string) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const direction = event.key === 'ArrowUp' ? -15 : 15
      const maximum = selection?.dateKey === dateKey && selection.endMinuteOfDay === null ? 1440 : 1425
      setKeyboardMinute((current) => Math.min(maximum, Math.max(0, current + direction)))
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const maximum = selection?.dateKey === dateKey && selection.endMinuteOfDay === null ? 1440 : 1425
      setKeyboardMinute(event.key === 'Home' ? 0 : maximum)
      return
    }
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    selectSlot(dateKey, keyboardMinute)
  }

  return (
    <section className="planning-timeline-card" aria-label="تقویم زمان‌بندی دانش‌آموز">
      <div className="planning-panel-heading">
        <div>
          <p className="eyebrow">تقویم برنامه‌ریزی</p>
          <h2>{viewMode === 'DAY' ? 'برنامه روز' : 'برنامه هفتگی'}</h2>
          <p>برای ساخت تکلیف زمان‌دار، ابتدا شروع و سپس پایان را انتخاب کنید.</p>
        </div>
        <div className="planning-timeline-actions">
          {selection && <button className="planning-selection-cancel" onClick={() => setSelection(null)} type="button">لغو انتخاب</button>}
          <label className="planning-density-toggle">
            <input
              checked={expanded}
              onChange={(event) => onExpandedChange(event.target.checked)}
              type="checkbox"
            />
            تقسیم‌های ۱۵ دقیقه‌ای
          </label>
        </div>
      </div>

      {selection && (
        <p className="planning-selection-status" role="status">
          شروع {formatTimelineTime(selection.startMinuteOfDay)} انتخاب شد؛ زمان پایان را انتخاب کنید.
        </p>
      )}

      <div className="planning-day-picker" aria-label="انتخاب روز">
        {days.map((day) => (
          <button
            aria-pressed={day.key === selectedDayKey}
            className={day.key === selectedDayKey ? 'is-selected' : ''}
            key={day.key}
            onClick={() => onSelectedDayChange(day.key)}
            type="button"
          >
            <strong>{day.shortLabel}</strong>
            <small>{day.label}</small>
          </button>
        ))}
      </div>

      <div className={`planning-timeline-scroll planning-timeline-scroll--${viewMode.toLowerCase()}${expanded ? ' is-expanded' : ''}`} ref={scrollRef}>
        <div
          className={`planning-timeline-grid planning-timeline-grid--${viewMode.toLowerCase()}`}
          style={{ '--planning-timeline-height': `${height}px` } as CSSProperties}
        >
          <div className="planning-time-axis" aria-hidden="true">
            {hours.map((hour) => (
              <span key={hour} style={{ top: `${(hour / 24) * height}px` }}>
                {formatTimelineTime(hour * 60)}
              </span>
            ))}
          </div>
          <div className={`planning-day-columns planning-day-columns--${viewMode.toLowerCase()}`}>
            {visibleDays.map((day) => {
              const dayTasks = tasksForDate(tasks, day.key)
              const positioned = layoutTimedTasks(dayTasks, expanded)
              return (
                <section className="planning-day-column" key={day.key} aria-label={day.label}>
                  <header><strong>{day.shortLabel}</strong><small>{day.label}</small></header>
                  <div className="planning-day-column__canvas">
                    {hours.map((hour) => <i aria-hidden="true" key={hour} style={{ top: `${(hour / 24) * height}px` }} />)}
                    <div
                      aria-label={`${day.label}؛ با کلیدهای بالا و پایین زمان را جابه‌جا و با Enter یا فاصله انتخاب کنید`}
                      className="planning-time-selector"
                      onClick={(event) => selectFromPointer(event, day.key)}
                      onFocus={() => {
                        onSelectedDayChange(day.key)
                        setKeyboardMinute(selection?.dateKey === day.key ? selection.startMinuteOfDay : 8 * 60)
                      }}
                      onKeyDown={(event) => selectFromKeyboard(event, day.key)}
                      role="button"
                      tabIndex={0}
                    >
                      <span
                        aria-hidden="true"
                        className="planning-keyboard-cursor"
                        style={{ top: `${(keyboardMinute / 1440) * height}px` }}
                      />
                    </div>
                    {selection?.dateKey === day.key && (
                      <span
                        aria-hidden="true"
                        className="planning-selection-preview"
                        style={{
                          height: `${(((selection.endMinuteOfDay ?? selection.startMinuteOfDay + 15) - selection.startMinuteOfDay) / 1440) * height}px`,
                          top: `${(selection.startMinuteOfDay / 1440) * height}px`,
                        }}
                      />
                    )}
                    {positioned.map(({ conflict, height: taskHeight, lane, laneCount, task, top }) => {
                      const style = {
                        height: `${taskHeight}px`,
                        insetInlineStart: `calc(${(lane / laneCount) * 100}% + 3px)`,
                        top: `${top}px`,
                        width: `calc(${100 / laneCount}% - 6px)`,
                      }
                      return (
                        <article
                          className={`planning-timed-block planning-accent-${planningAccent(task.id)} planning-status-${task.status.toLowerCase()}${conflict ? ' has-conflict' : ''}`}
                          key={task.id}
                          style={style}
                          title={`${task.title} · ${formatTimelineTime(task.startMinuteOfDay!)} تا ${formatTimelineTime(task.endMinuteOfDay!)}`}
                        >
                          <strong>{task.title}</strong>
                          <small>{formatTimelineTime(task.startMinuteOfDay!)}–{formatTimelineTime(task.endMinuteOfDay!)}</small>
                          {conflict && <span>هم‌پوشانی زمانی</span>}
                        </article>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>

      <section className="planning-volumetric" aria-label="کارهای حجمی بدون ساعت ثابت">
        <div>
          <h3>کارهای حجمی</h3>
          <p>این کارها ساعت ساختگی ندارند و بیرون از خط زمان نمایش داده می‌شوند.</p>
        </div>
        {volumetricTasks.length === 0 ? (
          <p className="planning-volumetric__empty">در این بازه کار حجمی ثبت نشده است.</p>
        ) : (
          <div className="planning-volumetric__list">
            {volumetricTasks.map((task) => (
              <article className={`planning-accent-${planningAccent(task.id)}`} key={task.id}>
                <strong>{task.title}</strong>
                <small>{task.scheduledFor.slice(0, 10)}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
