export type TaskScheduleDraft = {
  mode: 'VOLUMETRIC' | 'TIMED'
  startTime: string
  endTime: string
}

export type TaskScheduleValue = {
  startMinuteOfDay: number | null
  endMinuteOfDay: number | null
}

export type PreparedTaskSchedule =
  | { ok: true; value: TaskScheduleValue }
  | { ok: false; message: string }

export type TimeOption = {
  label: string
  value: string
}

const MINUTES_PER_DAY = 24 * 60
const STEP = 15

const twoDigits = new Intl.NumberFormat('fa-IR', {
  minimumIntegerDigits: 2,
  useGrouping: false,
})

const formatMinuteValue = (minuteOfDay: number): string => {
  if (minuteOfDay === MINUTES_PER_DAY) return `۲۴:۰۰`
  const hours = Math.floor(minuteOfDay / 60)
  const minutes = minuteOfDay % 60
  return `${twoDigits.format(hours)}:${twoDigits.format(minutes)}`
}

const timeValue = (minuteOfDay: number): string => {
  if (minuteOfDay === MINUTES_PER_DAY) return '24:00'
  const hours = Math.floor(minuteOfDay / 60)
  const minutes = minuteOfDay % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const createTimeOptions = (first: number, last: number): TimeOption[] => {
  const options: TimeOption[] = []
  for (let minute = first; minute <= last; minute += STEP) {
    options.push({ label: formatMinuteValue(minute), value: timeValue(minute) })
  }
  return options
}

export const taskStartTimeOptions = createTimeOptions(0, MINUTES_PER_DAY - STEP)
export const taskEndTimeOptions = createTimeOptions(STEP, MINUTES_PER_DAY)

export const createScheduleDraft = (): TaskScheduleDraft => ({
  mode: 'VOLUMETRIC',
  startTime: '',
  endTime: '',
})

const parseTimeValue = (value: string, allowEndOfDay: boolean): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (allowEndOfDay && hours === 24 && minutes === 0) return MINUTES_PER_DAY
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  const minuteOfDay = hours * 60 + minutes
  return minuteOfDay % STEP === 0 ? minuteOfDay : null
}

export const prepareTaskSchedule = (
  draft: TaskScheduleDraft,
): PreparedTaskSchedule => {
  if (draft.mode === 'VOLUMETRIC') {
    return {
      ok: true,
      value: { startMinuteOfDay: null, endMinuteOfDay: null },
    }
  }

  const startMinuteOfDay = parseTimeValue(draft.startTime, false)
  const endMinuteOfDay = parseTimeValue(draft.endTime, true)
  if (startMinuteOfDay === null || endMinuteOfDay === null) {
    return {
      ok: false,
      message: 'برای کار زمان‌دار، ساعت شروع و پایان معتبر با فاصله‌های ۱۵ دقیقه‌ای انتخاب کنید.',
    }
  }
  if (endMinuteOfDay <= startMinuteOfDay) {
    return {
      ok: false,
      message: 'ساعت پایان باید بعد از ساعت شروع و در همان روز باشد.',
    }
  }

  return {
    ok: true,
    value: { startMinuteOfDay, endMinuteOfDay },
  }
}

export const scheduleDraftFromTask = (
  startMinuteOfDay: number | null,
  endMinuteOfDay: number | null,
): TaskScheduleDraft => {
  const fallback = createScheduleDraft()
  if (
    startMinuteOfDay === null
    || endMinuteOfDay === null
    || startMinuteOfDay < 0
    || startMinuteOfDay >= MINUTES_PER_DAY
    || endMinuteOfDay <= 0
    || endMinuteOfDay > MINUTES_PER_DAY
  ) {
    return fallback
  }
  return {
    mode: 'TIMED',
    startTime: timeValue(startMinuteOfDay),
    endTime: timeValue(endMinuteOfDay),
  }
}

export const scheduleHasChanged = (
  draft: TaskScheduleDraft,
  startMinuteOfDay: number | null,
  endMinuteOfDay: number | null,
): boolean => {
  const prepared = prepareTaskSchedule(draft)
  if (!prepared.ok) return true
  return prepared.value.startMinuteOfDay !== startMinuteOfDay
    || prepared.value.endMinuteOfDay !== endMinuteOfDay
}

export const formatTaskSchedule = (
  startMinuteOfDay: number | null,
  endMinuteOfDay: number | null,
): string => {
  if (startMinuteOfDay === null && endMinuteOfDay === null) {
    return 'حجمی (بدون ساعت ثابت)'
  }
  if (startMinuteOfDay === null || endMinuteOfDay === null) {
    return 'زمان ثابت ثبت‌شده نامعتبر است'
  }
  return `ساعت ثابت ${formatMinuteValue(startMinuteOfDay)} تا ${formatMinuteValue(endMinuteOfDay)}`
}

const jalaliDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export const formatJalaliDate = (dateOnly: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly)
  if (!match) return dateOnly
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (
    date.getFullYear() !== Number(match[1])
    || date.getMonth() !== Number(match[2]) - 1
    || date.getDate() !== Number(match[3])
  ) return dateOnly
  return jalaliDateFormatter.format(date)
}
