import { useEffect, useState } from 'react'
import { AuthApiError } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ContentState } from '../components/ui/ContentState'
import {
  studentsClient,
  type CounselorStudent,
} from './students-client'

type StudentsPageProps = {
  navigate(path: string): void
}

const statusLabel = (status: CounselorStudent['status']) => {
  if (status === 'ACTIVE') return 'فعال'
  if (status === 'SUSPENDED') return 'معلق'
  return 'غیرفعال'
}

const avatarLabel = (name: string | null) => name?.trim().slice(0, 1) || 'د'

const errorMessage = (error: unknown) => {
  if (error instanceof AuthApiError && error.status === 403) {
    return 'حساب شما اجازه مشاهده فهرست دانش‌آموزان را ندارد.'
  }
  return 'دریافت فهرست دانش‌آموزان ممکن نشد. دوباره تلاش کنید.'
}

export function StudentsPage({ navigate }: StudentsPageProps) {
  const [students, setStudents] = useState<CounselorStudent[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await studentsClient.list()
      setStudents(page.items)
      setNextCursor(page.nextCursor)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    studentsClient.list().then((page) => {
      if (!active) return
      setStudents(page.items)
      setNextCursor(page.nextCursor)
    }).catch((loadError: unknown) => {
      if (active) setError(errorMessage(loadError))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const page = await studentsClient.list(nextCursor)
      setStudents((current) => [...current, ...page.items])
      setNextCursor(page.nextCursor)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <ContentState
        kind="loading"
        title="در حال دریافت دانش‌آموزان"
        description="فهرست دانش‌آموزان تخصیص‌یافته در حال بارگذاری است."
      />
    )
  }

  if (error && students.length === 0) {
    return (
      <ContentState
        kind="error"
        title="فهرست دانش‌آموزان در دسترس نیست"
        description={error}
        action={<Button onClick={() => void load()}>تلاش دوباره</Button>}
      />
    )
  }

  if (students.length === 0) {
    return (
      <ContentState
        kind="empty"
        title="دانش‌آموزی تخصیص داده نشده است"
        description="پس از ثبت تخصیص فعال، دانش‌آموز در این فهرست نمایش داده می‌شود."
      />
    )
  }

  return (
    <div className="page-stack students-page">
      <div className="section-heading">
        <div>
          <h2>دانش‌آموزان من</h2>
          <p>فقط پرونده‌های دارای تخصیص فعال به حساب شما نمایش داده می‌شوند.</p>
        </div>
        <span className="students-count">{students.length.toLocaleString('fa-IR')} دانش‌آموز</span>
      </div>

      {error && (
        <div className="students-inline-error" role="alert">
          <span>{error}</span>
          <Button onClick={() => void loadMore()} variant="secondary">تلاش دوباره</Button>
        </div>
      )}

      <div className="students-grid">
        {students.map((student) => (
          <Card className="student-card" key={student.id}>
            <div className="student-card__heading">
              <span className="student-avatar" aria-hidden="true">{avatarLabel(student.displayName)}</span>
              <div>
                <h3>{student.displayName ?? 'نام نمایشی ثبت نشده'}</h3>
                <p>کد پرونده: {student.id.slice(0, 8)}</p>
              </div>
              <span className={`student-status student-status--${student.status.toLowerCase()}`}>
                {statusLabel(student.status)}
              </span>
            </div>
            <dl className="student-card__facts">
              <div><dt>پایه تحصیلی</dt><dd>{student.educationLevel ?? 'ثبت نشده'}</dd></div>
              <div><dt>مدرسه</dt><dd>{student.schoolName ?? 'ثبت نشده'}</dd></div>
            </dl>
            <Button className="student-card__action" onClick={() => navigate(`/students/${student.id}`)} variant="secondary">
              مشاهده پرونده <span aria-hidden="true">←</span>
            </Button>
          </Card>
        ))}
      </div>

      {nextCursor && (
        <div className="students-load-more">
          <Button disabled={loadingMore} onClick={() => void loadMore()} variant="secondary">
            {loadingMore ? 'در حال دریافت…' : 'نمایش دانش‌آموزان بیشتر'}
          </Button>
        </div>
      )}
    </div>
  )
}
