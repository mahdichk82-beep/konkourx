import { useEffect, useMemo, useState } from 'react'
import type { AuthUser } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ContentState } from '../components/ui/ContentState'
import {
  buildDashboardTodaySummary,
  loadDashboardTodayTasks,
} from '../dashboard/dashboard-today'
import { planningClient, type DailyTask } from '../planning/planning-client'
import { formatJalaliDate } from '../planning/task-scheduling'
import { useTehranTodayKey } from '../planning/useTehranTodayKey'

export function DashboardPage({ navigate }: { navigate(path: string): void; user: AuthUser }) {
  const todayKey = useTehranTodayKey()
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const queryKey = `${todayKey}:${refreshKey}`
  const loading = loadedKey !== queryKey
  const todaySummary = useMemo(
    () => buildDashboardTodaySummary(tasks, todayKey),
    [tasks, todayKey],
  )

  useEffect(() => {
    let active = true

    loadDashboardTodayTasks(
      todayKey,
      planningClient.listTasks.bind(planningClient),
    ).then((items) => {
      if (!active) return
      setTasks(items)
      setError(null)
    }).catch(() => {
      if (!active) return
      setTasks([])
      setError('دریافت برنامه امروز ممکن نشد. دوباره تلاش کنید.')
    }).finally(() => {
      if (active) setLoadedKey(queryKey)
    })

    return () => {
      active = false
    }
  }, [queryKey, todayKey])

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1)
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  return (
    <div className="student-dashboard page-stack">
      <section className="student-welcome" aria-labelledby="student-welcome-title">
        <div className="student-welcome__copy">
          <p className="eyebrow">امروز، مسیر تو</p>
          <h2 id="student-welcome-title">سلام؛ از مهم‌ترین کار امروز شروع کنیم.</h2>
          <p>این صفحه قرار است پاسخ روشن «الان چه کار کنم؟» باشد؛ فقط با داده واقعی برنامه تو.</p>
        </div>
        <div className="student-welcome__mark" aria-hidden="true">
          <span className="student-welcome__orbit" />
          <strong>X</strong>
          <small>focus</small>
        </div>
      </section>

      <div className="student-dashboard__layout">
        <Card className="today-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">اولویت اصلی</p>
              <h2>برنامه امروز</h2>
              <p>{formatJalaliDate(todayKey)}</p>
            </div>
            <span className="honesty-badge">داده واقعی برنامه</span>
          </div>

          {loading ? (
            <ContentState
              description="کارهای ثبت‌شده برای امروز در حال دریافت هستند."
              kind="loading"
              title="در حال دریافت برنامه امروز"
            />
          ) : error ? (
            <ContentState
              action={<Button onClick={() => setRefreshKey((value) => value + 1)}>تلاش دوباره</Button>}
              description={error}
              kind="error"
              title="برنامه امروز در دسترس نیست"
            />
          ) : todaySummary.total === 0 ? (
            <div className="today-empty">
              <div className="today-empty__visual" aria-hidden="true">
                <span /><span /><span />
              </div>
              <div className="today-empty__copy">
                <span className="quiet-label">امروز کاری ثبت نشده است</span>
                <h3>برنامه امروز خالی است.</h3>
                <p>برای ساخت یا مرور کارهای برنامه‌ریزی‌شده وارد فضای برنامه امروز شو.</p>
                <Button onClick={() => navigate('/planning')}>رفتن به برنامه امروز <span aria-hidden="true">←</span></Button>
              </div>
            </div>
          ) : (
            <div className="today-dashboard-summary">
              <div className="today-dashboard-summary__total">
                <strong>{todaySummary.total.toLocaleString('fa-IR')}</strong>
                <span>کار ثبت‌شده برای امروز</span>
              </div>
              <div aria-label="وضعیت کارهای امروز" className="today-dashboard-summary__statuses">
                {todaySummary.statuses.map((status) => (
                  <span className={`task-presentation-badge--${status.status.toLowerCase().replaceAll('_', '-')}`} key={status.status}>
                    <strong>{status.count.toLocaleString('fa-IR')}</strong> {status.label}
                  </span>
                ))}
              </div>
              <Button onClick={() => navigate('/planning')}>بازکردن برنامه امروز <span aria-hidden="true">←</span></Button>
            </div>
          )}

          <div className="today-panel__footer">
            <span><i aria-hidden="true" /> برنامه واقعی</span>
            <span><i aria-hidden="true" /> اجرای قابل ثبت</span>
            <span><i aria-hidden="true" /> بدون آمار ساختگی</span>
          </div>
        </Card>

        <aside className="student-dashboard__aside" aria-label="وضعیت اقدام و هفته">
          <Card className="now-card">
            <div className="mini-heading">
              <span className="mini-heading__icon" aria-hidden="true">◉</span>
              <div><p>اکنون / بعدی</p><h2>اقدام جاری</h2></div>
            </div>
            <div className="compact-empty">
              <strong>اقدام جاری در داشبورد در دسترس نیست</strong>
              <p>شروع و ادامه کار فقط از داده واقعی صفحه امروز انجام می‌شود.</p>
            </div>
            <Button onClick={() => navigate('/planning')} variant="secondary">بازکردن برنامه امروز</Button>
          </Card>

          <Card className="week-card">
            <div className="mini-heading">
              <span className="mini-heading__icon mini-heading__icon--violet" aria-hidden="true">⌁</span>
              <div><p>نمای کوتاه</p><h2>این هفته</h2></div>
            </div>
            <p className="week-card__message">مقایسه برنامه و اجرای هفته فقط پس از اتصال داده واقعی نمایش داده می‌شود.</p>
            <button className="text-action" onClick={() => navigate('/planning/weekly')} type="button">مشاهده برنامه هفتگی <span aria-hidden="true">←</span></button>
          </Card>
        </aside>
      </div>

      <section className="student-quick" aria-labelledby="student-quick-title">
        <div className="section-heading section-heading--compact">
          <div><p className="eyebrow">مسیرهای فعال</p><h2 id="student-quick-title">دسترسی سریع</h2></div>
          <p>دسترسی‌های کوچک به قابلیت‌هایی که همین حالا وجود دارند.</p>
        </div>
        <div className="student-quick__grid">
          <button onClick={() => navigate('/planning')} type="button"><span className="quick-glyph" aria-hidden="true">01</span><span><strong>برنامه‌ریزی</strong><small>امروز و نمای هفتگی</small></span><i aria-hidden="true">←</i></button>
          <button onClick={() => navigate('/curriculum')} type="button"><span className="quick-glyph quick-glyph--violet" aria-hidden="true">02</span><span><strong>مباحث درسی</strong><small>مرور ساختار رسمی برنامه درسی</small></span><i aria-hidden="true">←</i></button>
          <button onClick={() => navigate('/assessments')} type="button"><span className="quick-glyph quick-glyph--cyan" aria-hidden="true">03</span><span><strong>آزمون‌های ثبت‌شده</strong><small>مرور نتیجه‌های واقعی</small></span><i aria-hidden="true">←</i></button>
        </div>
      </section>
    </div>
  )
}
