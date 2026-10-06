import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  AuthApiError,
  authClient,
  type PersonProfile,
  type PersonProfileInput,
  type StudentProfile,
  type StudentTrack,
} from '../auth/auth-client.ts'
import { useAuth } from '../auth/useAuth.ts'
import { Button } from '../components/ui/Button.tsx'
import type { Theme } from '../theme/useTheme.ts'
import { STUDENT_TRACK_OPTIONS, deriveDisplayName, deriveInitials, profileSectionForPath, shouldLoadProfileSection } from './profile-state.ts'
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
  { id: 'academic', label: 'اطلاعات تحصیلی', path: '/profile/academic' },
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

export function StudentProfilePage({ navigate, onPersonProfileSaved, onRetryPersonProfile, onThemeChange, path, personProfile, personProfileError, theme }: Props) {
  const { changePassword, logout, logoutAll, user } = useAuth()
  const activeSection = profileSectionForPath(path)
  const [personalError, setPersonalError] = useState<string | null>(null)
  const [personalMessage, setPersonalMessage] = useState<string | null>(null)
  const [personalSubmitting, setPersonalSubmitting] = useState(false)
  const [academicProfile, setAcademicProfile] = useState<StudentProfile | null>()
  const [track, setTrack] = useState<StudentTrack | ''>('')
  const [educationLevel, setEducationLevel] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [academicError, setAcademicError] = useState<string | null>(null)
  const [academicMessage, setAcademicMessage] = useState<string | null>(null)
  const [academicSubmitting, setAcademicSubmitting] = useState(false)
  const academicRequestInFlight = useRef(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionSubmitting, setSessionSubmitting] = useState<'current' | 'all' | null>(null)

  const applyAcademicProfile = (profile: StudentProfile | null) => {
    setAcademicProfile(profile)
    setTrack(profile?.track ?? '')
    setEducationLevel(profile?.educationLevel ?? '')
    setSchoolName(profile?.schoolName ?? '')
  }

  const loadAcademicProfile = async () => {
    if (academicRequestInFlight.current) return
    academicRequestInFlight.current = true
    setAcademicError(null)
    try {
      applyAcademicProfile(await authClient.getStudentProfile())
    } catch {
      setAcademicError('اطلاعات تحصیلی دریافت نشد. اتصال خود را بررسی و دوباره تلاش کنید.')
    } finally {
      academicRequestInFlight.current = false
    }
  }

  useEffect(() => {
    if (!shouldLoadProfileSection(activeSection, 'academic', academicProfile !== undefined, academicRequestInFlight.current)) return
    academicRequestInFlight.current = true
    void authClient.getStudentProfile()
      .then(applyAcademicProfile)
      .catch(() => setAcademicError('اطلاعات تحصیلی دریافت نشد. اتصال خود را بررسی و دوباره تلاش کنید.'))
      .finally(() => { academicRequestInFlight.current = false })
  }, [activeSection, academicProfile])

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

  const saveAcademic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAcademicSubmitting(true)
    setAcademicError(null)
    setAcademicMessage(null)
    try {
      const updated = await authClient.updateStudentProfile({
        educationLevel: nullableText(educationLevel), schoolName: nullableText(schoolName), track: track || null,
      })
      applyAcademicProfile(updated)
      setAcademicMessage('اطلاعات تحصیلی با موفقیت ذخیره شد.')
    } catch {
      setAcademicError('ذخیره اطلاعات تحصیلی انجام نشد. ورودی‌ها را بررسی و دوباره تلاش کنید.')
    } finally {
      setAcademicSubmitting(false)
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
    if (scope === 'all' && !window.confirm('همه نشست‌ها در تمام دستگاه‌ها بسته شوند؟ برای ادامه باید دوباره وارد شوی.')) return
    setSessionSubmitting(scope)
    setSessionError(null)
    try {
      await (scope === 'all' ? logoutAll() : logout())
    } catch {
      setSessionError(scope === 'all' ? 'بستن همه نشست‌ها انجام نشد. دوباره تلاش کن.' : 'خروج از حساب انجام نشد. دوباره تلاش کن.')
      setSessionSubmitting(null)
    }
  }

  if (!user) return null

  const accountIdentity = user.email ?? user.phone ?? 'شناسه ورود ثبت نشده'
  const displayName = deriveDisplayName(personProfile)
  const initials = deriveInitials(displayName)

  return (
    <div className="profile-center">
      <header className="profile-identity">
        <ProfileAvatar initials={initials} />
        <div className="profile-identity__copy"><h2>{displayName ?? accountIdentity}</h2><p>دانش‌آموز کنکوریکس</p>{displayName && <span dir="ltr">{accountIdentity}</span>}</div>
      </header>
      <nav className="profile-tabs" aria-label="بخش‌های پروفایل">
        {sections.map((section) => <a aria-current={activeSection === section.id ? 'page' : undefined} className={activeSection === section.id ? 'profile-tab profile-tab--active' : 'profile-tab'} href={section.path} key={section.id} onClick={(event) => { event.preventDefault(); navigate(section.path) }}>{section.label}</a>)}
      </nav>
      <section className="profile-panel">
        {activeSection === 'personal' && <div className="profile-section" key={personProfile?.updatedAt ?? 'empty'}>
          <header className="profile-section__heading"><h2>اطلاعات شخصی</h2><p>اطلاعات خصوصی هویت شما در محیط کنکوریکس.</p></header>
          <dl className="profile-readonly"><div><dt>ایمیل</dt><dd dir="ltr">{user.email ?? 'ثبت نشده'}</dd></div>{user.phone && <div><dt>شماره همراه</dt><dd dir="ltr">{user.phone}</dd></div>}</dl>
          {personProfile === undefined && !personProfileError ? <InlineState kind="loading" title="در حال دریافت اطلاعات شخصی" description="اطلاعات پروفایل در حال بارگذاری است." /> : personProfileError && personProfile === undefined ? <InlineState kind="error" title="دریافت اطلاعات شخصی ناموفق بود" description={personProfileError} onRetry={() => void onRetryPersonProfile()} /> : <form className="settings-form profile-form" onSubmit={savePersonal}>
            <div className="profile-form__grid"><label htmlFor="student-first-name">نام<input defaultValue={personProfile?.firstName ?? ''} id="student-first-name" maxLength={100} name="firstName" /></label><label htmlFor="student-last-name">نام خانوادگی<input defaultValue={personProfile?.lastName ?? ''} id="student-last-name" maxLength={100} name="lastName" /></label><label htmlFor="student-preferred-name">نام دلخواه<input defaultValue={personProfile?.preferredName ?? ''} id="student-preferred-name" maxLength={100} name="preferredName" /></label><label htmlFor="student-province">استان<input defaultValue={personProfile?.province ?? ''} id="student-province" maxLength={100} name="province" /></label><label htmlFor="student-city">شهر<input defaultValue={personProfile?.city ?? ''} id="student-city" maxLength={100} name="city" /></label></div>
            {personalError && <p className="form-error" role="alert">{personalError}</p>}{personalMessage && <p className="form-success" role="status">{personalMessage}</p>}<div className="profile-form__actions"><Button type="submit" disabled={personalSubmitting}>{personalSubmitting ? 'در حال ذخیره…' : 'ذخیره اطلاعات شخصی'}</Button></div>
          </form>}
        </div>}

        {activeSection === 'academic' && <div className="profile-section">
          <header className="profile-section__heading"><h2>اطلاعات تحصیلی</h2><p>رشته تحصیلی مرجع مباحث درسی و برنامه‌ریزی مطالعاتی تو است.</p></header>
          {academicProfile === undefined && !academicError ? <InlineState kind="loading" title="در حال دریافت اطلاعات تحصیلی" description="اطلاعات تحصیلی در حال بارگذاری است." /> : academicError && academicProfile === undefined ? <InlineState kind="error" title="دریافت اطلاعات تحصیلی ناموفق بود" description={academicError} onRetry={() => void loadAcademicProfile()} /> : <form className="settings-form profile-form" onSubmit={saveAcademic}>
            {!track && <div className="track-notice" role="status"><strong>رشته تحصیلی هنوز مشخص نشده است.</strong><p>با انتخاب رشته، مباحث درسی مرتبط و برنامه‌ریزی درسی مبتنی بر همان رشته در دسترس قرار می‌گیرد.</p></div>}
            <div className="profile-form__grid"><label className="profile-field--primary" htmlFor="student-track">رشته تحصیلی<select id="student-track" value={track} onChange={(event) => setTrack(event.target.value as StudentTrack | '')}><option value="">بدون رشته</option>{STUDENT_TRACK_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select><small>این انتخاب زمینه برنامهٔ درسی و برنامه‌ریزی مطالعه را تعیین می‌کند.</small></label><label htmlFor="student-education-level">پایه یا مقطع تحصیلی<input id="student-education-level" maxLength={100} value={educationLevel} onChange={(event) => setEducationLevel(event.target.value)} /></label><label htmlFor="student-school-name">نام مدرسه<input id="student-school-name" maxLength={200} value={schoolName} onChange={(event) => setSchoolName(event.target.value)} /></label></div>
            {academicError && <p className="form-error" role="alert">{academicError}</p>}{academicMessage && <p className="form-success" role="status">{academicMessage}</p>}<div className="profile-form__actions"><Button type="submit" disabled={academicSubmitting}>{academicSubmitting ? 'در حال ذخیره…' : 'ذخیره اطلاعات تحصیلی'}</Button></div>
          </form>}
        </div>}

        {activeSection === 'settings' && <div className="profile-section"><header className="profile-section__heading"><h2>تنظیمات</h2><p>ترجیحات واقعی همین مرورگر.</p></header><div className="profile-setting-row"><div><h3>ظاهر برنامه</h3><p>حالت روشن یا تاریک فقط برای همین مرورگر ذخیره می‌شود.</p></div><div className="theme-options" role="group" aria-label="انتخاب حالت نمایش"><Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => onThemeChange('light')}>روشن</Button><Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => onThemeChange('dark')}>تاریک</Button></div></div></div>}

        {activeSection === 'security' && <div className="profile-section"><header className="profile-section__heading"><h2>امنیت و حساب</h2><p>اطلاعات ورود، رمز عبور و نشست‌های فعال.</p></header><div className="profile-security"><section className="profile-subsection"><h3>اطلاعات حساب</h3><dl className="profile-account-grid"><div><dt>ایمیل</dt><dd dir="ltr">{user.email ?? 'ثبت نشده'}</dd></div>{user.phone && <div><dt>شماره همراه</dt><dd dir="ltr">{user.phone}</dd></div>}<div><dt>وضعیت حساب</dt><dd>{user.status === 'ACTIVE' ? 'فعال' : 'غیرفعال'}</dd></div></dl></section><section className="profile-subsection"><h3>رمز عبور</h3><p>رمز جدید باید دست‌کم ۱۲ نویسه باشد. پس از تغییر، همه نشست‌ها بسته می‌شوند.</p><form className="settings-form profile-password-form" onSubmit={submitPassword}><label htmlFor="student-current-password">رمز عبور فعلی<input id="student-current-password" name="currentPassword" type="password" autoComplete="current-password" required /></label><label htmlFor="student-new-password">رمز عبور جدید<input id="student-new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} required /></label><label htmlFor="student-password-confirmation">تکرار رمز عبور جدید<input id="student-password-confirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} required /></label>{passwordError && <p className="form-error" role="alert">{passwordError}</p>}<div className="profile-form__actions"><Button type="submit" disabled={passwordSubmitting}>{passwordSubmitting ? 'در حال تغییر…' : 'تغییر رمز عبور'}</Button></div></form></section><section className="profile-subsection"><h3>نشست‌های ورود</h3><p>می‌توانی از همین دستگاه خارج شوی یا همه نشست‌های حسابت را در تمام دستگاه‌ها ببندی.</p>{sessionError && <p className="form-error" role="alert">{sessionError}</p>}<div className="security-actions"><Button variant="secondary" disabled={sessionSubmitting !== null} onClick={() => void endSession('current')}>{sessionSubmitting === 'current' ? 'در حال خروج…' : 'خروج از این نشست'}</Button><Button variant="danger" disabled={sessionSubmitting !== null} onClick={() => void endSession('all')}>{sessionSubmitting === 'all' ? 'در حال بستن نشست‌ها…' : 'خروج از همه دستگاه‌ها'}</Button></div></section></div></div>}
      </section>
    </div>
  )
}
