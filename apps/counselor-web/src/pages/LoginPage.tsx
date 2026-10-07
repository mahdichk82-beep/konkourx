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
  useEffect(() => { if (status === 'authenticated') onSuccess() }, [onSuccess, status])
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
    <main className="auth-layout auth-layout--counselor" dir="rtl">
      <section className="brand-panel" aria-label="کنکوریکس مشاور">
        <BrandLogo context="dark" />
        <div className="brand-panel__content"><p className="eyebrow">فضای حرفه‌ای مشاور</p><h1>تصمیم روشن؛ پیگیری منظم.</h1><p>دانش‌آموزان، برنامه‌ها و شواهد واقعی اجرا را در یک محیط آرام و عملیاتی دنبال کنید.</p><div className="brand-promise"><span>تمرکز بر اقدام</span><span>دید یکپارچه</span><span>پیگیری روشن</span></div></div>
        <div className="counselor-login-art" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="brand-signature"><p className="brand-tagline">جایی که موفقیت مهندسی می‌شود</p><p className="brand-secondary-line">آموزش مفهومی؛ مشاوره تخصصی؛ برنامه‌ریزی هدفمند</p></div>
      </section>
      <section className="login-panel">
        <button className="auth-theme-toggle" aria-label={theme === 'light' ? 'فعال‌کردن حالت تاریک' : 'فعال‌کردن حالت روشن'} onClick={() => setTheme(nextTheme(theme))} type="button">{theme === 'light' ? '☾' : '☀'}</button>
        <form className="login-card" onSubmit={submit}>
          <div><p className="eyebrow">ورود مشاور</p><h2>به پنل مشاور وارد شوید</h2><p className="muted">ایمیل یا شماره موبایل و رمز عبور حساب مشاور را وارد کنید.</p></div>
          <label>ایمیل یا شماره موبایل<input name="identifier" autoComplete="username" placeholder="example@email.com" required /></label>
          <label>رمز عبور<input name="password" type="password" autoComplete="current-password" placeholder="••••••••••••" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" disabled={submitting || status === 'initializing'}>{submitting ? 'در حال ورود…' : 'ورود به پنل مشاور'}</Button>
          <p className="security-note">دسترسی مشاور در سرور بررسی می‌شود.</p>
        </form>
      </section>
    </main>
  )
}
