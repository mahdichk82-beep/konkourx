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
    <div className="counselor-dashboard page-stack">
      <section className="counselor-context" aria-labelledby="counselor-context-title">
        <div>
          <p className="eyebrow">مرکز کار امروز</p>
          <h2 id="counselor-context-title">توجه را روی دانش‌آموز و اقدام بعدی نگه دارید.</h2>
          <p>این داشبورد فقط شواهد واقعی و کار قابل انجام را نمایش می‌دهد.</p>
        </div>
        <div className="context-date"><span>امروز</span><strong>{todayLabel}</strong></div>
      </section>

      <div className="counselor-dashboard__layout">
        <Card className="attention-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">اولویت عملیاتی</p>
              <h2>نیازمند توجه</h2>
              <p>دانش‌آموزان یا شواهدی که به اقدام مشاور نیاز دارند.</p>
            </div>
            <span className="honesty-badge honesty-badge--professional">داده عملیاتی متصل نیست</span>
          </div>

          <div className="attention-empty">
            <div className="attention-empty__signal" aria-hidden="true"><span /><span /><span /></div>
            <div>
              <h3>مورد قابل اتکایی برای اولویت‌بندی در دسترس نیست.</h3>
              <p>تا زمانی که شواهد اجرا، پیگیری یا گزارش واقعی به داشبورد متصل نشود، هیچ هشدار، ریسک یا شمارنده‌ای نمایش داده نمی‌شود.</p>
            </div>
          </div>

          <div className="attention-panel__footer">
            <span>منبع آینده: شواهد واقعی اجرا</span>
            <Button onClick={() => navigate('/students')} variant="secondary">مشاهده دانش‌آموزان</Button>
          </div>
        </Card>

        <aside className="operations-stack" aria-label="صف کار و برنامه‌ریزی">
          <Card className="work-queue-card">
            <div className="operational-heading"><span aria-hidden="true">01</span><div><p>صف کار</p><h2>اقدام‌های مشاور</h2></div></div>
            <div className="compact-empty compact-empty--lined"><strong>صف کار هنوز داده‌ای ندارد</strong><p>تعداد یا اولویت ساختگی نمایش داده نمی‌شود.</p></div>
          </Card>

          <Card className="planning-entry-card">
            <div className="operational-heading"><span aria-hidden="true">02</span><div><p>برنامه‌ریزی</p><h2>فضای برنامه‌ریز</h2></div></div>
            <p>ساختار حرفه‌ای برنامه‌ریز آماده نمایش است؛ ویرایش تعاملی هنوز فعال نشده.</p>
            <Button onClick={() => navigate('/planning')}>ورود به فضای برنامه‌ریزی <span aria-hidden="true">←</span></Button>
          </Card>
        </aside>
      </div>

      <section className="counselor-workspace-links" aria-labelledby="counselor-links-title">
        <div className="section-heading section-heading--compact">
          <div><p className="eyebrow">فضای عملیاتی</p><h2 id="counselor-links-title">مسیرهای موجود</h2></div>
          <p>فقط قابلیت‌هایی که در همین نسخه مسیر واقعی دارند.</p>
        </div>
        <div className="counselor-workspace-links__grid">
          <button onClick={() => navigate('/students')} type="button"><span className="workspace-link__index">A</span><span><strong>دانش‌آموزان من</strong><small>فهرست واقعی و پرونده‌های تخصیص‌یافته</small></span><i aria-hidden="true">←</i></button>
          <button onClick={() => navigate('/planning')} type="button"><span className="workspace-link__index">B</span><span><strong>برنامه‌ریزی</strong><small>پوسته صادقانه فضای برنامه‌ریز</small></span><i aria-hidden="true">←</i></button>
          <button onClick={() => navigate('/settings')} type="button"><span className="workspace-link__index">C</span><span><strong>تنظیمات حساب</strong><small>ترجیحات واقعی محیط کار</small></span><i aria-hidden="true">←</i></button>
        </div>
      </section>
    </div>
  )
}
