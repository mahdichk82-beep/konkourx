import { useEffect, useMemo, useState } from 'react'
import { AuthApiError } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { ContentState } from '../components/ui/ContentState'
import { loadAllStudents, loadPlanningTasks } from '../planning/planning-data'
import { plannedMinutesForTask } from '../planning/planning-ui'
import { PlanningTaskRail } from '../planning/PlanningTaskRail'
import { PlanningTimeline, type PlanningDay } from '../planning/PlanningTimeline'
import { UnifiedTaskComposer } from '../planning/UnifiedTaskComposer'
import type { ComposerTimedPrefill } from '../planning/task-composer'
import '../planning/planning-workspace.css'
import { studentTasksClient, type CounselorVisibleTask } from '../students/student-tasks-client'
import { studentsClient, type CounselorStudent } from '../students/students-client'
import { useTehranTodayKey } from '../students/useTehranTodayKey'
import { addLocalDays, buildWeek, saturdayWeekStart } from '../students/week'

type PlanningShellPageProps = {
  initialStudentId?: string
  navigate(path: string): void
}

const dayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  day: 'numeric',
  month: 'short',
})

const shortDayFormatter = new Intl.DateTimeFormat('fa-IR', { weekday: 'short' })

const weekFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateFromKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year!, month! - 1, day!, 12)
}

const studentListError = (error: unknown): string => {
  if (error instanceof AuthApiError && error.status === 403) {
    return 'حساب شما اجازه مشاهده دانش‌آموزان تخصیص‌یافته را ندارد.'
  }
  return 'دریافت فهرست دانش‌آموزان ممکن نشد. دوباره تلاش کنید.'
}

const taskListError = (error: unknown): string => {
  if (error instanceof AuthApiError && error.status === 404) {
    return 'این دانش‌آموز دیگر به حساب شما تخصیص فعال ندارد.'
  }
  return 'دریافت برنامه این دانش‌آموز ممکن نشد. دوباره تلاش کنید.'
}

const studentLabel = (student: CounselorStudent): string => (
  student.displayName?.trim() || 'دانش‌آموز بدون نام'
)

export function PlanningShellPage({ initialStudentId, navigate }: PlanningShellPageProps) {
  const todayKey = useTehranTodayKey()
  const [students, setStudents] = useState<CounselorStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId ?? null)
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [studentsRetryKey, setStudentsRetryKey] = useState(0)
  const [weekStart, setWeekStart] = useState(() => saturdayWeekStart(dateFromKey(todayKey)))
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey)
  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK'>('WEEK')
  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState<CounselorVisibleTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [tasksRetryKey, setTasksRetryKey] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerTimedPrefill, setComposerTimedPrefill] = useState<ComposerTimedPrefill | undefined>()
  const week = useMemo(() => buildWeek(weekStart), [weekStart])
  const days = useMemo<PlanningDay[]>(() => week.map((day) => ({
    key: day.key,
    label: dayFormatter.format(day.date),
    shortLabel: shortDayFormatter.format(day.date),
  })), [week])
  const from = week[0]?.key ?? todayKey
  const to = week[6]?.key ?? todayKey
  const selectedStudent = students.find(({ id }) => id === selectedStudentId) ?? null

  useEffect(() => {
    let active = true
    setStudentsLoading(true)
    setStudentsError(null)
    loadAllStudents((cursor) => studentsClient.list(cursor)).then((items) => {
      if (!active) return
      setStudents(items)
      if (initialStudentId) {
        if (items.some(({ id }) => id === initialStudentId)) setSelectedStudentId(initialStudentId)
        else {
          setSelectedStudentId(null)
          setStudentsError('این پرونده وجود ندارد یا دیگر به حساب شما تخصیص فعال ندارد.')
        }
      } else {
        setSelectedStudentId((current) => current && items.some(({ id }) => id === current)
          ? current
          : items[0]?.id ?? null)
      }
    }).catch((error: unknown) => {
      if (!active) return
      setStudents([])
      setSelectedStudentId(null)
      setStudentsError(studentListError(error))
    }).finally(() => {
      if (active) setStudentsLoading(false)
    })
    return () => { active = false }
  }, [initialStudentId, studentsRetryKey])

  useEffect(() => {
    if (!selectedStudentId) {
      setTasks([])
      setTasksLoading(false)
      return
    }
    let active = true
    setTasksLoading(true)
    setTasksError(null)
    loadPlanningTasks((cursor) => studentTasksClient.listTasks(
      selectedStudentId,
      cursor,
      { from, to },
    )).then((items) => {
      if (active) setTasks(items)
    }).catch((error: unknown) => {
      if (!active) return
      setTasks([])
      setTasksError(taskListError(error))
    }).finally(() => {
      if (active) setTasksLoading(false)
    })
    return () => { active = false }
  }, [from, refreshKey, selectedStudentId, tasksRetryKey, to])

  useEffect(() => {
    if (days.some(({ key }) => key === selectedDayKey)) return
    setSelectedDayKey(days[0]?.key ?? todayKey)
  }, [days, selectedDayKey, todayKey])

  useEffect(() => {
    if (window.matchMedia('(max-width: 760px)').matches) setViewMode('DAY')
  }, [])

  const selectStudent = (id: string) => {
    setSelectedStudentId(id)
    setTasks([])
    setComposerOpen(false)
    if (initialStudentId) navigate(`/students/${id}/planning`)
  }

  const goToCurrentWeek = () => {
    setWeekStart(saturdayWeekStart(dateFromKey(todayKey)))
    setSelectedDayKey(todayKey)
  }

  const shiftWeek = (daysToAdd: number) => {
    const next = addLocalDays(weekStart, daysToAdd)
    setWeekStart(next)
    setSelectedDayKey(buildWeek(next)[0]?.key ?? todayKey)
  }

  const openBlankComposer = () => {
    setComposerTimedPrefill(undefined)
    setComposerOpen(true)
  }

  const closeComposer = () => {
    setComposerOpen(false)
    setComposerTimedPrefill(undefined)
  }

  const plannedMinutes = tasks.reduce((sum, task) => sum + plannedMinutesForTask(task), 0)
  const actualMinutes = tasks.reduce((sum, task) => sum + Math.max(0, task.recordedMinutes), 0)

  if (studentsLoading) {
    return <ContentState kind="loading" title="در حال آماده‌سازی برنامه‌ریز" description="دانش‌آموزان مجاز در حال دریافت هستند." />
  }

  if (studentsError && students.length === 0) {
    return (
      <ContentState
        action={<Button onClick={() => setStudentsRetryKey((value) => value + 1)}>تلاش دوباره</Button>}
        description={studentsError}
        kind="error"
        title="فضای برنامه‌ریزی در دسترس نیست"
      />
    )
  }

  if (students.length === 0) {
    return <ContentState kind="empty" title="دانش‌آموزی برای برنامه‌ریزی ندارید" description="پس از ایجاد تخصیص فعال، دانش‌آموز در این فضا نمایش داده می‌شود." />
  }

  if (!selectedStudent) {
    return (
      <ContentState
        action={<Button onClick={() => navigate('/planning')}>بازگشت به برنامه‌ریزی</Button>}
        description={studentsError ?? 'دانش‌آموز انتخاب‌شده در فهرست تخصیص‌های فعال شما نیست.'}
        kind="error"
        title="زمینه دانش‌آموز معتبر نیست"
      />
    )
  }

  return (
    <div className="counselor-planning-workspace">
      <section className="planning-context-bar">
        <div className="planning-student-select">
          <span className="planning-student-select__avatar" aria-hidden="true">{studentLabel(selectedStudent).slice(0, 1)}</span>
          <label>
            <span>دانش‌آموز</span>
            <select onChange={(event) => selectStudent(event.target.value)} value={selectedStudent.id}>
              {students.map((student) => <option key={student.id} value={student.id}>{studentLabel(student)}</option>)}
            </select>
          </label>
        </div>
        <div className="planning-week-controls">
          <Button aria-label="هفته بعد" onClick={() => shiftWeek(7)} variant="ghost">‹</Button>
          <strong>{weekFormatter.format(week[0]!.date)} تا {weekFormatter.format(week[6]!.date)}</strong>
          <Button aria-label="هفته قبل" onClick={() => shiftWeek(-7)} variant="ghost">›</Button>
          <Button onClick={goToCurrentWeek} variant="secondary">امروز</Button>
        </div>
        <div className="planning-context-actions">
          <Button onClick={() => navigate(`/students/${selectedStudent.id}`)} variant="ghost">پرونده دانش‌آموز</Button>
          <Button onClick={openBlankComposer}>ساخت تکلیف</Button>
        </div>
      </section>

      <section className="planning-view-toolbar">
        <div className="planning-view-tabs" role="group" aria-label="نوع نمایش برنامه">
          <button aria-pressed={viewMode === 'WEEK'} className={viewMode === 'WEEK' ? 'is-selected' : ''} onClick={() => setViewMode('WEEK')} type="button">نمای هفته</button>
          <button aria-pressed={viewMode === 'DAY'} className={viewMode === 'DAY' ? 'is-selected' : ''} onClick={() => setViewMode('DAY')} type="button">نمای روز</button>
        </div>
        <div className="planning-time-summary" aria-label="خلاصه زمان واقعی هفته">
          <span>برنامه‌ریزی‌شده <strong>{plannedMinutes.toLocaleString('fa-IR')} دقیقه</strong></span>
          <span>مطالعه ثبت‌شده <strong>{actualMinutes.toLocaleString('fa-IR')} دقیقه</strong></span>
        </div>
      </section>

      {tasksLoading ? (
        <ContentState kind="loading" title="در حال دریافت برنامه" description={`تکلیف‌های ${studentLabel(selectedStudent)} در حال بارگذاری است.`} />
      ) : tasksError ? (
        <ContentState
          action={<Button onClick={() => setTasksRetryKey((value) => value + 1)}>تلاش دوباره</Button>}
          description={tasksError}
          kind="error"
          title="برنامه در دسترس نیست"
        />
      ) : (
        <div className="planning-workspace-grid">
          <PlanningTimeline
            days={days}
            expanded={expanded}
            onExpandedChange={setExpanded}
            onSelectedDayChange={setSelectedDayKey}
            onTimeRangeSelected={(selection) => {
              setSelectedDayKey(selection.dateKey)
              setComposerTimedPrefill({
                endMinuteOfDay: selection.endMinuteOfDay,
                startMinuteOfDay: selection.startMinuteOfDay,
              })
              setComposerOpen(true)
            }}
            selectedDayKey={selectedDayKey}
            tasks={tasks}
            viewMode={viewMode}
          />
          <PlanningTaskRail
            dateKey={selectedDayKey}
            onCreate={openBlankComposer}
            onOpenStudent={() => navigate(`/students/${selectedStudent.id}`)}
            tasks={tasks}
            todayKey={todayKey}
          />
        </div>
      )}

      {composerOpen && (
        <UnifiedTaskComposer
          initialDate={selectedDayKey}
          initialTimedWindow={composerTimedPrefill}
          key={`${selectedStudent.id}:${selectedDayKey}:${composerTimedPrefill?.startMinuteOfDay ?? 'blank'}:${composerTimedPrefill?.endMinuteOfDay ?? 'blank'}`}
          onClose={closeComposer}
          onCreated={() => setRefreshKey((value) => value + 1)}
          studentId={selectedStudent.id}
          studentLabel={studentLabel(selectedStudent)}
        />
      )}
    </div>
  )
}
