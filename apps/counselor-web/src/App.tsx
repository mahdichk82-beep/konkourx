import { useCallback } from 'react'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { useAuth } from './auth/useAuth'
import { AppShell, type NavigationItem } from './components/layout/AppShell'
import { Button } from './components/ui/Button'
import { ContentState } from './components/ui/ContentState'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'
import { useBrowserRouter } from './routing/useBrowserRouter'
import { StudentDetailPage } from './students/StudentDetailPage'
import { StudentsPage } from './students/StudentsPage'
import { useTheme } from './theme/useTheme'
import { CounselorCurriculumPage } from './curriculum/CounselorCurriculumPage'
import './App.css'

const navigation: NavigationItem[] = [
  { icon: 'dashboard', label: 'داشبورد', mobileLabel: 'خانه', path: '/' },
  { icon: 'students', label: 'دانش‌آموزان', mobileLabel: 'دانش‌آموز', path: '/students' },
  { icon: 'planning', label: 'برنامه‌ریزی', mobileLabel: 'برنامه', path: '/planning' },
  { icon: 'reports', label: 'گزارش‌ها', mobileLabel: 'گزارش', path: '/reports' },
  { icon: 'settings', label: 'تنظیمات', mobileLabel: 'تنظیمات', path: '/settings' },
]

const routeMeta: Record<string, { description: string; title: string }> = {
  '/': { title: 'داشبورد', description: 'نمای کلی فضای کاری و دانش‌آموزان' },
  '/students': { title: 'دانش‌آموزان', description: 'فهرست دانش‌آموزان تخصیص‌یافته به حساب مشاور' },
  '/planning': { title: 'برنامه‌ریزی', description: 'ساختار آینده برای بررسی برنامه‌های دانش‌آموزان' },
  '/reports': { title: 'گزارش‌ها', description: 'ساختار آینده برای مرور گزارش‌های مشاوره' },
  '/settings': { title: 'تنظیمات', description: 'ترجیحات پایه محیط مشاور' },
}

function AuthenticatedCounselorApp({ navigate, path }: { navigate(path: string, replace?: boolean): void; path: string }) {
  const { logout, user } = useAuth()
  const { setTheme, theme } = useTheme()
  const studentDetailMatch = path.match(/^\/students\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i)
  const studentCurriculumMatch = path.match(/^\/students\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/curriculum$/i)
  const studentId = studentDetailMatch?.[1] ?? studentCurriculumMatch?.[1] ?? null
  const meta = studentCurriculumMatch
    ? { title: 'مباحث درسی دانش‌آموز', description: 'مرور و انتخاب از برنامهٔ درسی رسمی بر پایهٔ رشتهٔ ثبت‌شدهٔ دانش‌آموز' }
    : studentId
    ? { title: 'پروفایل دانش‌آموز', description: 'اطلاعات پایه و ایجاد وظیفه برای دانش‌آموز تخصیص‌یافته' }
    : routeMeta[path] ?? { title: 'صفحه پیدا نشد', description: 'این مسیر در پنل مشاور تعریف نشده است.' }
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
  else if (path === '/students') content = <StudentsPage navigate={navigate} />
  else if (studentCurriculumMatch && studentId) content = <CounselorCurriculumPage key={studentId} navigate={navigate} studentId={studentId} />
  else if (studentId) content = <StudentDetailPage key={studentId} navigate={navigate} studentId={studentId} />
  else if (path === '/settings') content = <SettingsPage onThemeChange={setTheme} theme={theme} />
  else if (routeMeta[path]) content = <PlaceholderPage title={meta.title} description="این بخش فقط به‌عنوان مسیر و جایگاه قابلیت آینده ایجاد شده و هنوز داده یا عملیات واقعی ندارد." />
  else content = <ContentState kind="error" title="صفحه پیدا نشد" description="نشانی واردشده در پنل مشاور وجود ندارد." action={<Button onClick={() => navigate('/')}>بازگشت به داشبورد</Button>} />

  return (
    <AppShell currentPath={studentId ? '/students' : path} navigation={navigation} navigate={navigate} onLogout={signOut} onThemeChange={setTheme} pageDescription={meta.description} pageTitle={meta.title} theme={theme} user={user}>
      {content}
    </AppShell>
  )
}

function App() {
  const { navigate, path } = useBrowserRouter()
  const completeLogin = useCallback(() => navigate('/', true), [navigate])
  if (path === '/login') return <LoginPage onSuccess={completeLogin} />
  return <ProtectedRoute navigate={navigate}><AuthenticatedCounselorApp navigate={navigate} path={path} /></ProtectedRoute>
}

export default App
