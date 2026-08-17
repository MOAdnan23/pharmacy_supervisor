/**
 * إشعارات داخلية — محاكاة وصول إشعار جديد أثناء الجلسة
 */
import type {
  NotificationsFeed,
  SupervisorNotification,
} from '../domain/notificationEntities'
import type { NotificationsDatasource } from './notificationsDatasource'

let items: SupervisorNotification[] = [
  {
    id: 'nt-1',
    category: 'plan',
    title: 'استلام خطة عمل من المندوب',
    body: 'أرسل المندوب ياسين العمودي خطة عمل جديدة بانتظار مراجعتك واعتمادها.',
    createdAt: '2026-08-17T00:40:00',
    read: false,
    priority: 'high',
    linkTo: '/plans/PLAN-003',
    relatedLabel: 'ياسين العمودي',
  },
  {
    id: 'nt-2',
    category: 'warehouse',
    title: 'صنف قابل للنفاد',
    body: 'كمية «أموكسيسيلين 500mg» انخفضت دون حد التنبيه (85 وحدة).',
    createdAt: '2026-08-16T18:20:00',
    read: false,
    priority: 'high',
    linkTo: '/warehouse?item=p2&tab=low',
    relatedLabel: 'أموكسيسيلين',
  },
  {
    id: 'nt-3',
    category: 'warehouse',
    title: 'قرب انتهاء صلاحية',
    body: 'صنف «شراب سعال» يقترب من انتهاء الصلاحية — يُفضّل المتابعة.',
    createdAt: '2026-08-16T15:10:00',
    read: false,
    priority: 'normal',
    linkTo: '/warehouse?item=p5&tab=expiry',
    relatedLabel: 'شراب سعال',
  },
  {
    id: 'nt-4',
    category: 'finance',
    title: 'ذمم متأخرة',
    body: 'صيدلية النور تجاوزت مدة الاستحقاق — الرصيد مرتفع نسبياً.',
    createdAt: '2026-08-16T12:00:00',
    read: true,
    priority: 'high',
    linkTo: '/finance?pharmacyId=ph1',
    relatedLabel: 'صيدلية النور',
  },
  {
    id: 'nt-5',
    category: 'finance',
    title: 'انخفاض التحصيل',
    body: 'نسبة التحصيل لهذا الأسبوع أقل من متوسط المبيعات مقارنة بالفترة السابقة.',
    createdAt: '2026-08-15T20:30:00',
    read: true,
    priority: 'normal',
    linkTo: '/finance',
  },
  {
    id: 'nt-6',
    category: 'evaluation',
    title: 'تقييم مندوب مرتفع',
    body: 'تقييم سامر الحسن تجاوز 50 نقطة — النتيجة الحالية ضمن المستوى الممتاز.',
    createdAt: '2026-08-15T11:00:00',
    read: true,
    priority: 'low',
    linkTo: '/evaluation?repId=r3',
    relatedLabel: 'سامر الحسن',
  },
  {
    id: 'nt-7',
    category: 'plan',
    title: 'تحقيق هدف في خطة العمل',
    body: 'المندوب محمد الشهري حقق هدف المبيعات الشهري ضمن خطته الحالية.',
    createdAt: '2026-08-14T16:45:00',
    read: true,
    priority: 'normal',
    linkTo: '/plans/PLAN-002',
    relatedLabel: 'محمد الشهري',
  },
  {
    id: 'nt-8',
    category: 'compensation',
    title: 'تأكيد إرسال مكافأة للمفوتر',
    body: 'تم تسجيل مكافأة للمندوب سامر الحسن وإشعار المفوتر للاحتساب.',
    createdAt: '2026-08-10T14:05:00',
    read: true,
    priority: 'low',
    linkTo: '/compensation?repId=r3',
    relatedLabel: 'سامر الحسن',
  },
]

let liveInjected = false
let sessionStartedAt = Date.now()

function nextId(): string {
  return `nt-${Date.now().toString(36)}`
}

function maybeInjectLiveNotice(): void {
  if (liveInjected) return
  if (Date.now() - sessionStartedAt < 12_000) return
  liveInjected = true
  items = [
    {
      id: nextId(),
      category: 'plan',
      title: 'استلام خطة عمل من المندوب',
      body: 'وصلت للتو خطة محدّثة من المندوب ياسين العمودي — بانتظار المراجعة.',
      createdAt: new Date().toISOString(),
      read: false,
      priority: 'high',
      linkTo: '/plans/PLAN-003',
      relatedLabel: 'ياسين العمودي',
    },
    ...items,
  ]
}

function buildFeed(): NotificationsFeed {
  maybeInjectLiveNotice()
  const sorted = [...items].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  return {
    items: sorted,
    unreadCount: sorted.filter((n) => !n.read).length,
    newestAt: sorted[0]?.createdAt ?? null,
  }
}

export const notificationsMockDatasource: NotificationsDatasource = {
  async getFeed() {
    return buildFeed()
  },

  async markRead(id: string) {
    const row = items.find((n) => n.id === id)
    if (row) row.read = true
  },

  async markAllRead() {
    for (const n of items) n.read = true
  },
}
