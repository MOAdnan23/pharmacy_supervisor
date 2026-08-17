/**
 * إشعارات المشرف داخل المتصفح فقط — UC-124 → UC-130
 * + استلام خطط عمل من المندوب
 */

export type NotificationCategory =
  | 'warehouse'
  | 'finance'
  | 'plan'
  | 'evaluation'
  | 'compensation'
  | 'system'

export type NotificationPriority = 'low' | 'normal' | 'high'

export type SupervisorNotification = {
  id: string
  category: NotificationCategory
  title: string
  body: string
  createdAt: string
  read: boolean
  priority: NotificationPriority
  /** مسار داخلي للتفاصيل إن وُجد */
  linkTo?: string
  /** اسم مرتبط (مندوب / صنف…) */
  relatedLabel?: string
}

export type NotificationsFeed = {
  items: SupervisorNotification[]
  unreadCount: number
  /** لرصد الإشعارات الجديدة أثناء الجلسة */
  newestAt: string | null
}

export type NotificationsSummary = {
  unreadCount: number
  byCategory: Record<NotificationCategory, number>
}
