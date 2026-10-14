import { useEffect, useState } from 'react'
import { AuthApiError } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ContentState } from '../components/ui/ContentState'
import {
  studentsClient,
  type CounselorStudent,
} from './students-client'
import { StudentTaskList } from './StudentTaskList'
import { StudentWeeklyPlanning } from './StudentWeeklyPlanning'

type StudentDetailPageProps = {
  navigate(path: string): void
  studentId: string
}

const statusLabel = (status: CounselorStudent['status']) => {
  if (status === 'ACTIVE') return 'فعال'
  if (status === 'SUSPENDED') return 'معلق'
  return 'غیرفعال'
}

const detailError = (error: unknown) => {
  if (error instanceof AuthApiError && error.status === 404) {
    return 'این پرونده وجود ندارد یا به حساب مشاور شما تخصیص داده نشده است.'
  }
  return 'دریافت اطلاعات دانش‌آموز ممکن نشد. دوباره تلاش کنید.'
}

export function StudentDetailPage({ navigate, studentId }: StudentDetailPageProps) {
  const [student, setStudent] = useState<CounselorStudent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setStudent(await studentsClient.get(studentId))
    } catch (loadError) {
      setStudent(null)
      setError(detailError(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    studentsClient.get(studentId).then((result) => {
      if (active) setStudent(result)
    }).catch((loadError: unknown) => {
      if (!active) return
      setStudent(null)
      setError(detailError(loadError))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [studentId])

  if (loading) {
    return (
      <ContentState
        kind="loading"
        title="در حال دریافت پروفایل"
        description="اطلاعات پایه دانش‌آموز در حال بارگذاری است."
      />
    )
  }

  if (error || !student) {
    return (
      <ContentState
        kind="error"
        title="پروفایل دانش‌آموز در دسترس نیست"
        description={error ?? 'اطلاعات این دانش‌آموز پیدا نشد.'}
        action={
          <div className="student-detail__actions">
            <Button onClick={() => navigate('/students')} variant="secondary">بازگشت به فهرست</Button>
            <Button onClick={() => void load()}>تلاش دوباره</Button>
          </div>
        }
      />
    )
  }

  return (
    <div className="page-stack student-detail">
      <Card className="student-profile-card student-profile-card--compact">
        <div className="student-profile-card__main">
          <div className="student-profile-card__heading">
            <span className="student-avatar" aria-hidden="true">{student.displayName?.trim().slice(0, 1) || 'د'}</span>
            <div>
              <p className="eyebrow">فضای دانش‌آموز</p>
              <h2>{student.displayName?.trim() || 'نام نمایشی ثبت نشده'}</h2>
              <div className="student-profile-card__summary">
                <span className={`student-status student-status--${student.status.toLowerCase()}`}>
                  حساب {statusLabel(student.status)}
                </span>
                <span>{student.educationLevel ?? 'پایه تحصیلی ثبت نشده'}</span>
                <span>{student.schoolName ?? 'مدرسه ثبت نشده'}</span>
              </div>
            </div>
          </div>
          <div className="student-detail__toolbar">
            <Button onClick={() => navigate(`/students/${student.id}/planning`)}>برنامه‌ریزی دانش‌آموز</Button>
            <Button onClick={() => navigate('/students')} variant="ghost">بازگشت به فهرست</Button>
          </div>
        </div>
        <details className="student-profile-card__details">
          <summary>جزئیات پرونده</summary>
          <dl className="student-profile-facts">
            <div><dt>کد پرونده</dt><dd>{student.id}</dd></div>
            <div><dt>پایه تحصیلی</dt><dd>{student.educationLevel ?? 'ثبت نشده'}</dd></div>
            <div><dt>مدرسه</dt><dd>{student.schoolName ?? 'ثبت نشده'}</dd></div>
            <div><dt>وضعیت حساب</dt><dd>{statusLabel(student.status)}</dd></div>
          </dl>
        </details>
      </Card>
      <StudentTaskList
        key={student.id}
        refreshKey={0}
        studentId={student.id}
        studentLabel={student.displayName ?? 'دانش‌آموز بدون نام'}
      />
      <details className="student-overview-details">
        <summary>نمای هفتگی فشرده</summary>
        <div className="student-overview-details__content">
          <StudentWeeklyPlanning refreshKey={0} studentId={student.id} />
        </div>
      </details>
    </div>
  )
}
