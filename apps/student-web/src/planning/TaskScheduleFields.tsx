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
  const startId = `${idPrefix}-start`
  const endId = `${idPrefix}-end`

  return (
    <fieldset className="task-schedule-fields" disabled={disabled}>
      <legend>زمان‌بندی</legend>
      <label className="task-schedule-fields__toggle" htmlFor={volumetricId}>
        <input
          checked={value.isVolumetric}
          id={volumetricId}
          onChange={(event) => onChange({
            ...value,
            isVolumetric: event.currentTarget.checked,
          })}
          type="checkbox"
        />
        حجمی (بدون ساعت ثابت)
      </label>
      <small>
        زمان ثابت با مدت تخمینی مطالعه متفاوت است.
      </small>
      {!value.isVolumetric && (
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
