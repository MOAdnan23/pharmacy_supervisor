/**
 * AppShell = الهيكل الثابت للتطبيق بعد الدخول
 */
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { NotificationToast } from '../../features/notifications/components/NotificationToast'
import {
  NotificationsProvider,
  useNotifications,
} from '../../features/notifications/NotificationsContext'
import '../../features/notifications/pages/notifications.css'
import './app-shell.css'

const navItems = [
  { to: '/', label: 'لوحة التحكم', end: true },
  { to: '/users', label: 'إدارة المندوبين', end: false },
  { to: '/regions', label: 'المناطق', end: false },
  { to: '/offers', label: 'العروض والسلال', end: false },
  { to: '/plans', label: 'خطط العمل', end: false },
  { to: '/rates', label: 'نسب الشركات', end: false },
  { to: '/finance', label: 'المالية', end: false },
  { to: '/evaluation', label: 'التقييم', end: false },
  { to: '/compensation', label: 'الرواتب والمكافآت', end: false },
  { to: '/warehouse', label: 'المستودع', end: false },
  { to: '/notifications', label: 'الإشعارات', end: false },
  { to: '/reports', label: 'التقارير', end: false },
  { to: '/settings', label: 'الإعدادات', end: false },
]

function ShellHeaderActions() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadCount, soundMuted, toggleSoundMuted } = useNotifications()

  return (
    <div className="shell-header-actions">
      <button
        type="button"
        className={`shell-mute-btn ${soundMuted ? 'muted' : ''}`}
        onClick={toggleSoundMuted}
        title={soundMuted ? 'تفعيل صوت الإشعارات' : 'كتم صوت الإشعارات'}
      >
        {soundMuted ? 'كتم الصوت' : 'صوت مفعّل'}
      </button>
      <button
        type="button"
        className="shell-bell"
        onClick={() => navigate('/notifications')}
        aria-label="مركز الإشعارات"
        title="مركز الإشعارات"
      >
        <span className="shell-bell-text">إشعارات</span>
        {unreadCount > 0 ? (
          <span className="shell-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className="shell-profile"
        onClick={() => navigate('/settings')}
        title="الإعدادات"
      >
        <span className="shell-profile-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" />
          ) : (
            <span>{(user?.name ?? 'م').slice(0, 1)}</span>
          )}
        </span>
        <span className="shell-profile-name">{user?.name}</span>
      </button>
      <span className="shell-date">{new Date().toLocaleDateString('ar-SY')}</span>
    </div>
  )
}

function ShellInner() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    void logout()
    navigate('/login')
  }

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <img src="/brand-logo.png" alt="" className="shell-brand-logo" />
          <div>
            <strong>نظام المستودعات</strong>
            <span>لوحة المشرف</span>
          </div>
        </div>

        <nav className="shell-nav">
          <p className="shell-nav-title">الرئيسية</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'shell-link active' : 'shell-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="shell-logout" onClick={handleLogout}>
          تسجيل الخروج
        </button>
      </aside>

      <div className="shell-main">
        <header className="shell-header">
          <div className="shell-header-title">
            <img src="/brand-logo.png" alt="" className="shell-header-logo" />
            <div>
              <h2>مرحباً، {user?.name}</h2>
              <p>مشرف النظام — الإدارة العامة</p>
            </div>
          </div>
          <ShellHeaderActions />
        </header>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>

      <NotificationToast />
    </div>
  )
}

export function AppShell() {
  return (
    <NotificationsProvider>
      <ShellInner />
    </NotificationsProvider>
  )
}
