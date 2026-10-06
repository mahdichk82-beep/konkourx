import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AuthApiError, authClient, type CounselorProfile, type PersonProfile, type PersonProfileInput } from '../auth/auth-client.ts'
import { useAuth } from '../auth/useAuth.ts'
import { Button } from '../components/ui/Button.tsx'
import type { Theme } from '../theme/useTheme.ts'
import { deriveDisplayName, deriveInitials, profileSectionForPath, shouldLoadProfileSection } from './profile-state.ts'
import './profile.css'

type Props = {
  navigate(path: string): void
  onPersonProfileSaved(input: PersonProfileInput): Promise<PersonProfile>
  onRetryPersonProfile(): Promise<void>
  onThemeChange(theme: Theme): void
  path: string
  personProfile: PersonProfile | null | undefined
  personProfileError: string | null
  theme: Theme
}

const nullableText = (value: string): string | null => value.trim() || null

const sections = [
  { id: 'personal', label: 'اطلاعات شخصی', path: '/profile' },
  { id: 'professional', label: 'اطلاعات حرفه‌ای', path: '/profile/professional' },
  { id: 'settings', label: 'تنظیمات', path: '/profile/settings' },
  { id: 'security', label: 'امنیت و حساب', path: '/profile/security' },
] as const

function ProfileAvatar({ initials }: { initials: string | null }) {
  return <span className="profile-identity__avatar" aria-hidden="true">{initials ?? <svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>}</span>
}

function InlineState({ description, kind, onRetry, title }: { description: string; kind: 'error' | 'loading'; onRetry?: () => void; title: string }) {
  const className = kind === 'error' ? 'profile-inline-state profile-inline-state--error' : 'profile-inline-state profile-inline-state--loading'
  return <div className={className} role={kind === 'error' ? 'alert' : 'status'}><span className="profile-inline-state__icon" aria-hidden="true">{kind === 'error' ? '!' : '…'}</span><div><strong>{title}</strong><p>{description}</p></div>{onRetry && <Button variant="secondary" onClick={onRetry}>تلاش دوباره</Button>}</div>
}

export function CounselorProfilePage({ navigate, onPersonProfileSaved, onRetryPersonProfile, onThemeChange, path, personProfile, personProfileError, theme }: Props) {
  const { changePassword, logout, logoutAll, user } = useAuth()
  const activeSection = profileSectionForPath(path)
  const [personalError, setPersonalError] = useState<string | null>(null)
  const [personalMessage, setPersonalMessage] = useState<string | null>(null)
  const [personalSubmitting, setPersonalSubmitting] = useState(false)
  const [professionalProfile, setProfessionalProfile] = useState<CounselorProfile | null>()
  const [specialization, setSpecialization] = useState('')
  const [bio, setBio] = useState('')
  const [professionalError, setProfessionalError] = useState<string | null>(null)
  const [professionalMessage, setProfessionalMessage] = useState<string | null>(null)
  const [professionalSubmitting, setProfessionalSubmitting] = useState(false)
  const professionalRequestInFlight = useRef(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionSubmitting, setSessionSubmitting] = useState<'current' | 'all' | null>(null)

  const applyProfessionalProfile = (profile: CounselorProfile | null) => {
    setProfessionalProfile(profile)
    setSpecialization(profile?.specialization ?? '')
    setBio(profile?.bio ?? '')
  }

  const loadProfessionalProfile = async () => {
    if (professionalRequestInFlight.current) return
    professionalRequestInFlight.current = true
    setProfessionalError(null)
    try {
      applyProfessionalProfile(await authClient.getCounselorProfile())
    } catch {
      setProfessionalError('اطلاعات حرفه‌ای دریافت نشد. اتصال خود را بررسی و دوباره تلاش کنید.')
    } finally {
      professionalRequestInFlight.current = false
    }
  }

  useEffect(() => {
    if (!shouldLoadProfileSection(activeSection, 'professional', professionalProfile !== undefined, professionalRequestInFlight.current)) return
    professionalRequestInFlight.current = true
    void authClient.getCounselorProfile()
      .then(applyProfessionalProfile)
      .catch(() => setProfessionalError('اطلاعات حرفه‌ای دریافت نشد. اتصال خود را بررسی و دوباره تلاش کنید.'))
      .finally(() => { professionalRequestInFlight.current = false })
  }, [activeSection, professionalProfile])

  const savePersonal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setPersonalSubmitting(true)
    setPersonalError(null)
    setPersonalMessage(null)
    try {
      await onPersonProfileSaved({
        city: nullableText(String(data.get('city') ?? '')),
        firstName: nullableText(String(data.get('firstName') ?? '')),
        lastName: nullableText(String(data.get('lastName') ?? '')),
        preferredName: nullableText(String(data.get('preferredName') ?? '')),
        province: nullableText(String(data.get('province') ?? '')),
      })
      setPersonalMessage('اطلاعات شخصی با موفقیت ذخیره شد.')
    } catch {
      setPersonalError('ذخیره اطلاعات شخصی انجام نشد. ورودی‌ها را بررسی و دوباره تلاش کنید.')
    } finally {
      setPersonalSubmitting(false)
    }
  }

  const saveProfessional = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfessionalSubmitting(true)
    setProfessionalError(null)
    setProfessionalMessage(null)
    try {
      const updated = await authClient.updateCounselorProfile({ bio: nullableText(bio), specialization: nullableText(specialization) })
      applyProfessionalProfile(updated)
      setProfessionalMessage('اطلاعات حرفه‌ای با موفقیت ذخیره شد.')
    } catch {
      setProfessionalError('ذخیره اطلاعات حرفه‌ای انجام نشد. ورودی‌ها را بررسی و دوباره تلاش کنید.')
    } finally {
      setProfessionalSubmitting(false)
    }
  }

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const currentPassword = String(data.get('currentPassword') ?? '')
    const newPassword = String(data.get('newPassword') ?? '')
    if (newPassword !== String(data.get('passwordConfirmation') ?? '')) {
      setPasswordError('تکرار رمز عبور با رمز جدید یکسان نیست.')
      return
    }
    setPasswordSubmitting(true)
    setPasswordError(null)
    try {
      await changePassword(currentPassword, newPassword)
    } catch (error) {
      setPasswordError(error instanceof AuthApiError && error.code === 'CURRENT_PASSWORD_INVALID' ? 'رمز عبور فعلی درست نیست.' : 'تغییر رمز عبور انجام نشد. دوباره تلاش کنید.')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const endSession = async (scope: 'current' | 'all') => {
    if (scope === 'all' && !window.confirm('همه نشست‌ها در تمام دستگاه‌ها بسته شوند؟ برای ادامه باید دوباره وارد شوید.')) return
    setSessionSubmitting(scope)
    setSessionError(null)
    try {
      await (scope === 'all' ? logoutAll() : logout())
    } catch {
      setSessionError(scope === 'all' ? 'بستن همه نشست‌ها انجام نشد. دوباره تلاش کنید.' : 'خروج از حساب انجام نشد. دوباره تلاش کنید.')
      setSessionSubmitting(null)
    }
  }

  if (!user) return null

  const accountIdentity = user.email ?? user.phone ?? 'شناسه ورود ثبت نشده'
  const displayName = deriveDisplayName(personProfile)
  const initials = deriveInitials(displayName)

  return <div className="profile-center">
    <header className="profile-identity"><ProfileAvatar initials={initials} /><div className="profile-identity__copy"><h2>{displayName ?? accountIdentity}</h2><p>مشاور کنکوریکس</p>{displayName && <span dir="ltr">{accountIdentity}</span>}</div></header>
    <nav className="profile-tabs" aria-label="بخش‌های پروفایل">{sections.map((section) => <a aria-current={activeSection === section.id ? 'page' : undefined} className={activeSection === section.id ? 'profile-tab profile-tab--active' : 'profile-tab'} href={section.path} key={section.id} onClick={(event) => { event.preventDefault(); navigate(section.path) }}>{section.label}</a>)}</nav>
    <section className="profile-panel">
      {activeSection === 'personal' && <div className="profile-section" key={personProfile?.updatedAt ?? 'empty'}><header className="profile-section__heading"><h2>اطلاعات شخصی</h2><p>اطلاعات خصوصی هویت شما در محیط کاری کنکوریکس.</p></header><dl className="profile-readonly"><div><dt>ایمیل</dt><dd dir="ltr">{user.email ?? 'ثبت نشده'}</dd></div>{user.phone && <div><dt>شماره همراه</dt><dd dir="ltr">{user.phone}</dd></div>}</dl>{personProfile === undefined && !personProfileError ? <InlineState kind="loading" title="در حال دریافت اطلاعات شخصی" description="اطلاعات پروفایل در حال بارگذاری است." /> : personProfileError && personProfile === undefined ? <InlineState kind="error" title="دریافت اطلاعات شخصی ناموفق بود" description={personProfileError} onRetry={() => void onRetryPersonProfile()} /> : <form className="settings-form profile-form" onSubmit={savePersonal}><div className="profile-form__grid"><label htmlFor="counselor-first-name">نام<input defaultValue={personProfile?.firstName ?? ''} id="counselor-first-name" maxLength={100} name="firstName" /></label><label htmlFor="counselor-last-name">نام خانوادگی<input defaultValue={personProfile?.lastName ?? ''} id="counselor-last-name" maxLength={100} name="lastName" /></label><label htmlFor="counselor-preferred-name">نام دلخواه<input defaultValue={personProfile?.preferredName ?? ''} id="counselor-preferred-name" maxLength={100} name="preferredName" /></label><label htmlFor="counselor-province">استان<input defaultValue={personProfile?.province ?? ''} id="counselor-province" maxLength={100} name="province" /></label><label htmlFor="counselor-city">شهر<input defaultValue={personProfile?.city ?? ''} id="counselor-city" maxLength={100} name="city" /></label></div>{personalError && <p className="form-error" role="alert">{personalError}</p>}{personalMessage && <p className="form-success" role="status">{personalMessage}</p>}<div className="profile-form__actions"><Button type="submit" disabled={personalSubmitting}>{personalSubmitting ? 'در حال ذخیره…' : 'ذخیره اطلاعات شخصی'}</Button></div></form>}</div>}

      {activeSection === 'professional' && <div className="profile-section"><header className="profile-section__heading"><h2>اطلاعات حرفه‌ای خصوصی</h2><p>این اطلاعات فقط برای استفاده داخلی حساب مشاور نگهداری می‌شود.</p></header>{professionalProfile === undefined && !professionalError ? <InlineState kind="loading" title="در حال دریافت اطلاعات حرفه‌ای" description="اطلاعات حساب مشاور در حال بارگذاری است." /> : professionalError && professionalProfile === undefined ? <InlineState kind="error" title="دریافت اطلاعات حرفه‌ای ناموفق بود" description={professionalError} onRetry={() => void loadProfessionalProfile()} /> : <form className="settings-form profile-form" onSubmit={saveProfessional}><label htmlFor="counselor-specialization">حوزه تخصص<input id="counselor-specialization" maxLength={200} value={specialization} onChange={(event) => setSpecialization(event.target.value)} /></label><label htmlFor="counselor-bio">معرفی کوتاه<textarea id="counselor-bio" maxLength={2000} rows={5} value={bio} onChange={(event) => setBio(event.target.value)} /></label>{professionalError && <p className="form-error" role="alert">{professionalError}</p>}{professionalMessage && <p className="form-success" role="status">{professionalMessage}</p>}<div className="profile-form__actions"><Button type="submit" disabled={professionalSubmitting}>{professionalSubmitting ? 'در حال ذخیره…' : 'ذخیره اطلاعات حرفه‌ای'}</Button></div></form>}</div>}

      {activeSection === 'settings' && <div className="profile-section"><header className="profile-section__heading"><h2>تنظیمات</h2><p>ترجیحات واقعی همین مرورگر.</p></header><div className="profile-setting-row"><div><h3>ظاهر برنامه</h3><p>حالت روشن یا تاریک فقط برای همین مرورگر ذخیره می‌شود.</p></div><div className="theme-options" role="group" aria-label="انتخاب حالت نمایش"><Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => onThemeChange('light')}>روشن</Button><Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => onThemeChange('dark')}>تاریک</Button></div></div></div>}

      {activeSection === 'security' && <div className="profile-section"><header className="profile-section__heading"><h2>امنیت و حساب</h2><p>اطلاعات ورود، رمز عبور و نشست‌های فعال.</p></header><div className="profile-security"><section className="profile-subsection"><h3>اطلاعات حساب</h3><dl className="profile-account-grid"><div><dt>ایمیل</dt><dd dir="ltr">{user.email ?? 'ثبت نشده'}</dd></div>{user.phone && <div><dt>شماره همراه</dt><dd dir="ltr">{user.phone}</dd></div>}<div><dt>وضعیت حساب</dt><dd>{user.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}</dd></div></dl></section><section className="profile-subsection"><h3>رمز عبور</h3><p>رمز جدید باید دست‌کم ۱۲ نویسه باشد. پس از تغییر، همه نشست‌ها بسته می‌شوند.</p><form className="settings-form profile-password-form" onSubmit={submitPassword}><label htmlFor="counselor-current-password">رمز عبور فعلی<input id="counselor-current-password" name="currentPassword" type="password" autoComplete="current-password" required /></label><label htmlFor="counselor-new-password">رمز عبور جدید<input id="counselor-new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} required /></label><label htmlFor="counselor-password-confirmation">تکرار رمز عبور جدید<input id="counselor-password-confirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} required /></label>{passwordError && <p className="form-error" role="alert">{passwordError}</p>}<div className="profile-form__actions"><Button type="submit" disabled={passwordSubmitting}>{passwordSubmitting ? 'در حال تغییر…' : 'تغییر رمز عبور'}</Button></div></form></section><section className="profile-subsection"><h3>نشست‌های ورود</h3><p>می‌توانید از همین دستگاه خارج شوید یا همه نشست‌های حسابتان را در تمام دستگاه‌ها ببندید.</p>{sessionError && <p className="form-error" role="alert">{sessionError}</p>}<div className="security-actions"><Button variant="secondary" disabled={sessionSubmitting !== null} onClick={() => void endSession('current')}>{sessionSubmitting === 'current' ? 'در حال خروج…' : 'خروج از این نشست'}</Button><Button variant="danger" disabled={sessionSubmitting !== null} onClick={() => void endSession('all')}>{sessionSubmitting === 'all' ? 'در حال بستن نشست‌ها…' : 'خروج از همه دستگاه‌ها'}</Button></div></section></div></div>}
    </section>
  </div>
}
