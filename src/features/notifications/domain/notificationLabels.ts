import type {
  NotificationCategory,
  NotificationPriority,
  SupervisorNotification,
} from './notificationEntities'

export const NOTIFICATION_RULES = {
  scopeNote: 'تصلك الإشعارات أثناء فتح لوحة المشرف، مع إمكانية كتم صوت التنبيه.',
  soundNote: 'عند وصول إشعار جديد يظهر تنبيه مع صوت — يمكن كتم الصوت من الهيدر.',
}

export function categoryLabel(c: NotificationCategory): string {
  switch (c) {
    case 'warehouse':
      return 'مستودع'
    case 'finance':
      return 'مالية'
    case 'plan':
      return 'خطة عمل'
    case 'evaluation':
      return 'تقييم'
    case 'compensation':
      return 'رواتب / مكافآت'
    case 'system':
      return 'نظام'
  }
}

export function priorityLabel(p: NotificationPriority): string {
  switch (p) {
    case 'high':
      return 'عالية'
    case 'normal':
      return 'عادية'
    case 'low':
      return 'منخفضة'
  }
}

export function formatNoticeTime(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ')
}

export function matchesNotificationSearch(
  n: SupervisorNotification,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    n.title.toLowerCase().includes(q) ||
    n.body.toLowerCase().includes(q) ||
    (n.relatedLabel?.toLowerCase().includes(q) ?? false) ||
    categoryLabel(n.category).includes(query.trim())
  )
}

export const SOUND_MUTE_STORAGE_KEY = 'supervisor.notifications.soundMuted'
