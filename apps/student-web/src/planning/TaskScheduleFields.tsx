import type { TaskScheduleDraft } from './task-scheduling'
import {
  taskEndTimeOptions,
  taskStartTimeOptions,
} from './task-scheduling'

type TaskScheduleFieldsProps = {
  disabled?: boolean
  idPrefix: string
  onChange(draft: TaskScheduleDraft): void
  value: TaskScheduleDraft
}

export function TaskScheduleFields({
  disabled = false,
  idPrefix,
  onChange,
  value,
}: TaskScheduleFieldsProps) {
  const volumetricId = `${idPrefix}-volumetric`
  const timedId = `${idPrefix}-timed`
  const startId = `${idPrefix}-start`
  const endId = `${idPrefix}-end`

  return (
    <fieldset className="task-schedule-fields" disabled={disabled}>
      <legend>زمان‌بندی</legend>
      <div className="task-schedule-fields__modes">
        <label className="task-schedule-fields__toggle" htmlFor={volumetricId}>
          <input checked={value.mode === 'VOLUMETRIC'} id={volumetricId} name={`${idPrefix}-mode`} onChange={() => onChange({ ...value, mode: 'VOLUMETRIC' })} type="radio" />
          حجمی (بدون ساعت ثابت)
        </label>
        <label className="task-schedule-fields__toggle" htmlFor={timedId}>
          <input checked={value.mode === 'TIMED'} id={timedId} name={`${idPrefix}-mode`} onChange={() => onChange({ ...value, mode: 'TIMED' })} type="radio" />
          زمان‌دار (ساعت شروع و پایان)
        </label>
      </div>
      <small>
        زمان ثابت با مدت تخمینی مطالعه متفاوت است.
      </small>
      {value.mode === 'TIMED' && (
        <div className="task-schedule-fields__times">
          <label htmlFor={startId}>
            ساعت شروع
            <select
              id={startId}
              onChange={(event) => onChange({ ...value, startTime: event.target.value })}
              required
              value={value.startTime}
            >
              <option value="">انتخاب کنید</option>
              {taskStartTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label htmlFor={endId}>
            ساعت پایان
            <select
              id={endId}
              onChange={(event) => onChange({ ...value, endTime: event.target.value })}
              required
              value={value.endTime}
            >
              <option value="">انتخاب کنید</option>
              {taskEndTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </fieldset>
  )
}
