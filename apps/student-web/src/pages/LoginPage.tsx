import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'
import { BrandLogo } from '@konkourx/brand'
import { useTheme } from '../theme/useTheme'
import { nextTheme } from '../components/layout/shell-state'

export function LoginPage({ onSuccess }: { onSuccess(): void }) {
  const { error, login, status } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const { setTheme, theme } = useTheme()

  useEffect(() => {
    if (status === 'authenticated') onSuccess()
  }, [onSuccess, status])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      await login(String(form.get('identifier') ?? ''), String(form.get('password') ?? ''))
      onSuccess()
    } catch {
      // The auth provider exposes a safe localized error.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-layout auth-layout--student" dir="rtl">
      <section className="brand-panel" aria-label="کنکوریکس دانش‌آموز">
        <BrandLogo context="dark" />
        <div className="brand-panel__content">
          <p className="eyebrow">فضای دانش‌آموز کنکوریکس</p>
          <h1>هر روز، یک قدم روشن‌تر به سمت هدفت.</h1>
          <p>برنامه‌ریزی، اجرای مطالعه و مسیر پیشرفتت در یک فضای آرام و متمرکز.</p>
          <div className="brand-promise"><span>برنامه روشن</span><span>تمرکز بیشتر</span><span>پیشرفت قابل دیدن</span></div>
        </div>
        <div className="student-login-art" aria-hidden="true">
          <span className="student-login-art__ring student-login-art__ring--outer" />
          <span className="student-login-art__ring student-login-art__ring--inner" />
          <span className="student-login-art__dot" />
          <strong>X</strong>
        </div>
        <div className="brand-signature"><p className="brand-tagline">جایی که موفقیت مهندسی می‌شود</p><p className="brand-secondary-line">آموزش مفهومی؛ مشاوره تخصصی؛ برنامه‌ریزی هدفمند</p></div>
      </section>
      <section className="login-panel">
        <button className="auth-theme-toggle" aria-label={theme === 'light' ? 'فعال‌کردن حالت تاریک' : 'فعال‌کردن حالت روشن'} onClick={() => setTheme(nextTheme(theme))} type="button">{theme === 'light' ? '☾' : '☀'}</button>
        <form className="login-card" onSubmit={submit}>
          <div>
            <p className="eyebrow">ورود دانش‌آموز</p>
            <h2>خوش برگشتی</h2>
            <p className="muted">ایمیل یا شماره موبایل و رمز عبورت را وارد کن.</p>
          </div>
          <label>ایمیل یا شماره موبایل<input name="identifier" autoComplete="username" placeholder="example@email.com" required /></label>
          <label>رمز عبور<input name="password" type="password" autoComplete="current-password" placeholder="••••••••••••" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" disabled={submitting || status === 'initializing'}>
            {submitting ? 'در حال ورود…' : 'ورود به پنل دانش‌آموز'}
          </Button>
          <p className="security-note">نشست ورود با کوکی امن HttpOnly نگهداری می‌شود.</p>
        </form>
      </section>
    </main>
  )
}
