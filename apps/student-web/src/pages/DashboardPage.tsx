import type { AuthUser } from '../auth/auth-client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const todayLabel = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
}).format(new Date())

export function DashboardPage({ navigate }: { navigate(path: string): void; user: AuthUser }) {
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
              <p>{todayLabel}</p>
            </div>
            <span className="honesty-badge">بدون داده نمایشی</span>
          </div>

          <div className="today-empty">
            <div className="today-empty__visual" aria-hidden="true">
              <span /><span /><span />
            </div>
            <div className="today-empty__copy">
              <span className="quiet-label">برنامه امروز در داشبورد بارگذاری نشده است</span>
              <h3>کارهای واقعی‌ات در فضای برنامه‌ریزی در دسترس‌اند.</h3>
              <p>برای دیدن وظایف امروز، زمان‌بندی و شروع مطالعه وارد صفحه برنامه‌ریزی شو. اینجا هیچ وظیفه یا عددی حدس زده نمی‌شود.</p>
              <Button onClick={() => navigate('/planning')}>رفتن به برنامه امروز <span aria-hidden="true">←</span></Button>
            </div>
          </div>

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
          <button onClick={() => navigate('/study')} type="button"><span className="quick-glyph quick-glyph--violet" aria-hidden="true">02</span><span><strong>درس‌ها و مباحث</strong><small>ساختار شخصی فعلی</small></span><i aria-hidden="true">←</i></button>
          <button onClick={() => navigate('/assessments')} type="button"><span className="quick-glyph quick-glyph--cyan" aria-hidden="true">03</span><span><strong>آزمون‌های ثبت‌شده</strong><small>مرور نتیجه‌های واقعی</small></span><i aria-hidden="true">←</i></button>
        </div>
      </section>
    </div>
  )
}
