import { useEffect, useState, type FormEvent } from 'react'
import { BrandLogo } from '@konkourx/brand'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui/Button'

export function LoginPage({ onSuccess }: { onSuccess(): void }) {
  const { error, login, status } = useAuth()
  const [submitting, setSubmitting] = useState(false)

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
    <main className="auth-layout" dir="rtl">
      <section className="brand-panel" aria-label="کنکوریکس دانش‌آموز">
        <BrandLogo context="dark" />
        <p className="eyebrow">Konkourix Student</p>
        <h1>مسیر مطالعه‌ات را با تمرکز ادامه بده.</h1>
        <p>برنامه، هدف‌ها و پیشرفت روزانه‌ات در فضای مستقل دانش‌آموزی.</p>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div>
            <p className="eyebrow">ورود دانش‌آموز</p>
            <h2>خوش برگشتی</h2>
            <p className="muted">ایمیل یا شماره موبایل و رمز عبورت را وارد کن.</p>
          </div>
          <label>ایمیل یا شماره موبایل<input name="identifier" autoComplete="username" required /></label>
          <label>رمز عبور<input name="password" type="password" autoComplete="current-password" required /></label>
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
