import { useCallback } from 'react'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { useAuth } from './auth/useAuth'
import { AppShell, type NavigationItem } from './components/layout/AppShell'
import { Button } from './components/ui/Button'
import { ContentState } from './components/ui/ContentState'
import { DashboardPage } from './pages/DashboardPage'
import { AssessmentAttemptsPage } from './pages/AssessmentAttemptsPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'
import { SubjectTopicsPage } from './pages/SubjectTopicsPage'
import { TodayPlanningPage } from './pages/TodayPlanningPage'
import { WeeklyPlanningPage } from './pages/WeeklyPlanningPage'
import { useBrowserRouter } from './routing/useBrowserRouter'
import { useTheme } from './theme/useTheme'
import { StudentCurriculumPage } from './curriculum/StudentCurriculumPage'
import './App.css'

const navigation: NavigationItem[] = [
  { icon: 'dashboard', label: 'داشبورد', mobileLabel: 'خانه', path: '/' },
  { icon: 'planning', label: 'برنامه‌ریزی', mobileLabel: 'برنامه', path: '/planning' },
  { icon: 'study', label: 'درس‌ها و مباحث', mobileLabel: 'درس‌ها', path: '/study' },
  { icon: 'study', label: 'برنامهٔ درسی رسمی', mobileLabel: 'مباحث', path: '/curriculum' },
  { icon: 'assessment', label: 'آزمون‌ها', mobileLabel: 'آزمون', path: '/assessments' },
  { icon: 'reports', label: 'گزارش‌ها', mobileLabel: 'گزارش', path: '/reports' },
  { icon: 'settings', label: 'تنظیمات', mobileLabel: 'تنظیمات', path: '/settings' },
]

const routeMeta: Record<string, { description: string; title: string }> = {
  '/': { title: 'داشبورد', description: 'نمای کلی مسیر مطالعه و برنامه روزانه' },
  '/planning': { title: 'برنامه امروز', description: 'ساخت و پیگیری کارهای شخصی امروز' },
  '/planning/weekly': { title: 'برنامه هفتگی', description: 'نمای هفت‌روزه کارهای برنامه‌ریزی‌شده' },
  '/study': { title: 'درس‌ها و مباحث', description: 'ساخت و مدیریت ساختار شخصی مطالعه' },
  '/curriculum': { title: 'مباحث درسی', description: 'مرور و انتخاب از ساختار رسمی برنامهٔ درسی رشتهٔ شما' },
  '/assessments': { title: 'آزمون‌ها', description: 'ثبت و مرور نتیجه خام آزمون‌های پایان‌یافته' },
  '/reports': { title: 'گزارش‌ها', description: 'ساختار آینده برای مرور روند و پیشرفت' },
  '/settings': { title: 'تنظیمات', description: 'ترجیحات پایه محیط دانش‌آموزی' },
}

function AuthenticatedStudentApp({ navigate, path }: { navigate(path: string, replace?: boolean): void; path: string }) {
  const { logout, user } = useAuth()
  const { setTheme, theme } = useTheme()
  const meta = routeMeta[path] ?? { title: 'صفحه پیدا نشد', description: 'این مسیر در پنل دانش‌آموز تعریف نشده است.' }

  const signOut = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', true)
    }
  }

  if (!user) return null

  let content
  if (path === '/') content = <DashboardPage user={user} />
  else if (path === '/planning') content = <TodayPlanningPage navigate={navigate} />
  else if (path === '/planning/weekly') content = <WeeklyPlanningPage navigate={navigate} />
  else if (path === '/study') content = <SubjectTopicsPage />
  else if (path === '/curriculum') content = <StudentCurriculumPage />
  else if (path === '/assessments') content = <AssessmentAttemptsPage />
  else if (path === '/settings') content = <SettingsPage onThemeChange={setTheme} theme={theme} />
  else if (routeMeta[path]) content = <PlaceholderPage title={meta.title} description="این بخش فقط به‌عنوان مسیر و جایگاه قابلیت آینده ایجاد شده و هنوز داده یا عملیات واقعی ندارد." />
  else content = <ContentState kind="error" title="صفحه پیدا نشد" description="نشانی واردشده در پنل دانش‌آموز وجود ندارد." action={<Button onClick={() => navigate('/')}>بازگشت به داشبورد</Button>} />

  return (
    <AppShell
      currentPath={path.startsWith('/planning') ? '/planning' : path}
      navigation={navigation}
      navigate={navigate}
      onLogout={signOut}
      onThemeChange={setTheme}
      pageDescription={meta.description}
      pageTitle={meta.title}
      theme={theme}
      user={user}
    >
      {content}
    </AppShell>
  )
}

function App() {
  const { navigate, path } = useBrowserRouter()
  const completeLogin = useCallback(() => navigate('/', true), [navigate])

  if (path === '/login') return <LoginPage onSuccess={completeLogin} />

  return (
    <ProtectedRoute navigate={navigate}>
      <AuthenticatedStudentApp navigate={navigate} path={path} />
    </ProtectedRoute>
  )
}

export default App
