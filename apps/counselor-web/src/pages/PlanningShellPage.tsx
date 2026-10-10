import { Card } from '../components/ui/Card'
import { ContentState } from '../components/ui/ContentState'

const todayLabel = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
}).format(new Date())

export function PlanningShellPage() {
  return (
    <div className="page-stack planning-shell-page">
      <Card className="planning-shell-toolbar">
        <div>
          <p className="eyebrow">آماده برای برنامه‌ریز روزانه</p>
          <h2>برنامه روز دانش‌آموز</h2>
          <p>ساختار زمان‌بندی دقیق ۱۵ دقیقه‌ای آماده است؛ ابزار تعاملی انتخاب و ویرایش هنوز فعال نشده.</p>
        </div>
        <div className="planning-date-chip"><span>امروز</span><strong>{todayLabel}</strong></div>
      </Card>
      <Card className="planner-workspace-shell">
        <div className="planner-workspace-shell__header">
          <div><h2>فضای برنامه‌ریزی</h2><p>۲۴ ساعت · چهار بازه ۱۵ دقیقه‌ای در هر ساعت</p></div>
          <span className="status-pill status-pill--info">پوسته نمایشی</span>
        </div>
        <div className="planner-placeholder-grid" aria-hidden="true">
          <div className="planner-placeholder-grid__times"><span>۰۸:۰۰</span><span>۱۲:۰۰</span><span>۱۶:۰۰</span><span>۲۰:۰۰</span></div>
          <div className="planner-placeholder-grid__canvas"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        </div>
        <ContentState kind="empty" title="برنامه‌ریز تعاملی هنوز فعال نشده است" description="این صفحه فقط ساختار فضای کار را نشان می‌دهد. انتخاب دانش‌آموز، ویرایش بازه‌های زمانی و ساخت برنامه هنوز در دسترس نیستند." />
      </Card>
    </div>
  )
}
