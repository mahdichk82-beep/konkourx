import { useCallback, useEffect } from 'react'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { useAuth } from './auth/useAuth'
import { AppShell, type NavigationItem } from './components/layout/AppShell'
import { Button } from './components/ui/Button'
import { ContentState } from './components/ui/ContentState'
import { DashboardPage } from './pages/DashboardPage'
import { AssessmentAttemptsPage } from './pages/AssessmentAttemptsPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SubjectTopicsPage } from './pages/SubjectTopicsPage'
import { TodayPlanningPage } from './pages/TodayPlanningPage'
import { WeeklyPlanningPage } from './pages/WeeklyPlanningPage'
import {
  useBrowserRouter,
  type BrowserNavigate,
  type BrowserNavigationBlocker,
} from './routing/useBrowserRouter'
import { useTheme } from './theme/useTheme'
import { StudentCurriculumPage } from './curriculum/StudentCurriculumPage'
import { StudentProfilePage } from './profile/StudentProfilePage'
import { profileSectionForPath } from './profile/profile-state'
import { usePersonProfile } from './profile/usePersonProfile'
import {
  StudyTimerProvider,
} from './planning/StudyTimerContext'
import { useStudyTimer, useStudyTimerElapsed } from './planning/useStudyTimer'
import { formatElapsedStudyTime } from './planning/task-execution'
import { planningTaskIdForPath, planningTaskPath } from './planning/today-workspace'
import './App.css'
import './phase2c.css'

const navigation: NavigationItem[] = [
  { icon: 'dashboard', label: 'داشبورد', mobileLabel: 'خانه', path: '/' },
  { icon: 'planning', label: 'برنامه‌ریزی', mobileLabel: 'برنامه', path: '/planning' },
  { icon: 'study', label: 'مباحث درسی', mobileLabel: 'مباحث', path: '/curriculum' },
  { icon: 'assessment', label: 'آزمون‌ها', mobileLabel: 'آزمون', path: '/assessments' },
  { icon: 'reports', label: 'گزارش‌ها', mobileLabel: 'گزارش', path: '/reports' },
]

const routeMeta: Record<string, { description: string; title: string }> = {
  '/': { title: 'داشبورد', description: 'نمای کلی مسیر مطالعه و برنامه روزانه' },
  '/planning': { title: 'برنامه امروز', description: 'ساخت و پیگیری کارهای شخصی امروز' },
  '/planning/weekly': { title: 'برنامه هفتگی', description: 'نمای هفت‌روزه کارهای برنامه‌ریزی‌شده' },
  '/study': { title: 'درس‌ها و مباحث', description: 'ساخت و مدیریت ساختار شخصی مطالعه' },
  '/curriculum': { title: 'مباحث درسی', description: 'مرور ساختار رسمی برنامهٔ درسی رشتهٔ شما' },
  '/assessments': { title: 'آزمون‌ها', description: 'ثبت و مرور نتیجه خام آزمون‌های پایان‌یافته' },
  '/reports': { title: 'گزارش‌ها', description: 'ساختار آینده برای مرور روند و پیشرفت' },
  '/profile': { title: 'پروفایل من', description: 'مدیریت اطلاعات شخصی و حساب دانش‌آموزی' },
  '/profile/academic': { title: 'اطلاعات تحصیلی', description: 'رشته، پایه و مدرسهٔ مرجع حساب دانش‌آموزی' },
  '/profile/settings': { title: 'تنظیمات', description: 'ترجیحات واقعی محیط دانش‌آموزی' },
  '/profile/security': { title: 'امنیت و حساب', description: 'رمز عبور و نشست‌های ورود' },
}

function ActiveStudyTimerIndicator({ navigate }: { navigate: BrowserNavigate }) {
  const { activeSession } = useStudyTimer()
  if (!activeSession) return null
  return <ActiveStudyTimerIndicatorContent navigate={navigate} session={activeSession} />
}

function ActiveStudyTimerIndicatorContent({
  navigate,
  session,
}: {
  navigate: BrowserNavigate
  session: NonNullable<ReturnType<typeof useStudyTimer>['activeSession']>
}) {
  const elapsedMs = useStudyTimerElapsed(session)
  const stateLabel = session.timerState === 'PAUSED' ? 'مکث مطالعه' : 'مطالعه فعال'
  return (
    <button
      aria-label={`${stateLabel}، ${formatElapsedStudyTime(elapsedMs)}؛ رفتن به کار فعال`}
      className={`active-study-indicator active-study-indicator--${session.timerState.toLowerCase()}`}
      onClick={() => navigate(session.dailyTaskId ? planningTaskPath(session.dailyTaskId) : '/planning')}
      type="button"
    >
      <span aria-hidden="true" className="active-study-indicator__dot" />
      <span>{stateLabel}</span>
      <strong dir="ltr">{formatElapsedStudyTime(elapsedMs)}</strong>
    </button>
  )
}

function AuthenticatedStudentWorkspace({
  navigate,
  path,
  setNavigationBlocker,
}: {
  navigate: BrowserNavigate
  path: string
  setNavigationBlocker(blocker: BrowserNavigationBlocker | null): () => void
}) {
  const { logout, user } = useAuth()
  const { setTheme, theme } = useTheme()
  const personProfile = usePersonProfile()
  const effectivePath = path === '/settings' ? '/profile/settings' : path
  const planningTaskId = planningTaskIdForPath(path)
  const meta = planningTaskId
    ? { title: 'جزئیات کار', description: 'مرور و اجرای کار انتخاب‌شده در فضای برنامه‌ریزی' }
    : routeMeta[effectivePath] ?? { title: 'صفحه پیدا نشد', description: 'این مسیر در پنل دانش‌آموز تعریف نشده است.' }

  useEffect(() => {
    if (path === '/settings') navigate('/profile/settings', true)
  }, [navigate, path])

  const signOut = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', true)
    }
  }

  if (!user) return null

  let content
  if (path === '/') content = <DashboardPage navigate={navigate} user={user} />
  else if (path === '/planning' || planningTaskId) content = (
    <TodayPlanningPage
      navigate={navigate}
      setNavigationBlocker={setNavigationBlocker}
      taskId={planningTaskId}
    />
  )
  else if (path === '/planning/weekly') content = <WeeklyPlanningPage navigate={navigate} />
  else if (path === '/study') content = <SubjectTopicsPage />
  else if (path === '/curriculum') content = <StudentCurriculumPage />
  else if (path === '/assessments') content = <AssessmentAttemptsPage />
  else if (profileSectionForPath(effectivePath) !== null) content = <StudentProfilePage navigate={navigate} onPersonProfileSaved={personProfile.save} onRetryPersonProfile={personProfile.load} onThemeChange={setTheme} path={effectivePath} personProfile={personProfile.profile} personProfileError={personProfile.error} theme={theme} />
  else if (routeMeta[path]) content = <PlaceholderPage title={meta.title} description="این بخش فقط به‌عنوان مسیر و جایگاه قابلیت آینده ایجاد شده و هنوز داده یا عملیات واقعی ندارد." />
  else content = <ContentState kind="error" title="صفحه پیدا نشد" description="نشانی واردشده در پنل دانش‌آموز وجود ندارد." action={<Button onClick={() => navigate('/')}>بازگشت به داشبورد</Button>} />

  return (
    <AppShell
      currentPath={path.startsWith('/planning') ? '/planning' : path}
      headerAccessory={<ActiveStudyTimerIndicator navigate={navigate} />}
      navigation={navigation}
      navigate={navigate}
      onLogout={signOut}
      onThemeChange={setTheme}
      pageDescription={meta.description}
      pageTitle={meta.title}
      theme={theme}
      user={user}
      personProfile={personProfile.profile}
    >
      {content}
    </AppShell>
  )
}

function AuthenticatedStudentApp({
  navigate,
  path,
  setNavigationBlocker,
}: {
  navigate: BrowserNavigate
  path: string
  setNavigationBlocker(blocker: BrowserNavigationBlocker | null): () => void
}) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <StudyTimerProvider>
      <AuthenticatedStudentWorkspace
        navigate={navigate}
        path={path}
        setNavigationBlocker={setNavigationBlocker}
      />
    </StudyTimerProvider>
  )
}

function App() {
  const { navigate, path, setNavigationBlocker } = useBrowserRouter()
  const completeLogin = useCallback(() => navigate('/', true), [navigate])

  if (path === '/login') return <LoginPage onSuccess={completeLogin} />

  return (
    <ProtectedRoute navigate={navigate}>
      <AuthenticatedStudentApp
        navigate={navigate}
        path={path}
        setNavigationBlocker={setNavigationBlocker}
      />
    </ProtectedRoute>
  )
}

export default App
