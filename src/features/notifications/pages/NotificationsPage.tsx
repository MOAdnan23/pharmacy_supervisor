/**
 * مركز الإشعارات — UC-124 → UC-130 + استلام خطط المندوب
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../NotificationsContext'
import type { NotificationCategory } from '../domain/notificationEntities'
import {
  NOTIFICATION_RULES,
  categoryLabel,
  formatNoticeTime,
  matchesNotificationSearch,
  priorityLabel,
} from '../domain/notificationLabels'
import './notifications.css'

type FilterId = 'all' | 'unread' | NotificationCategory

export function NotificationsPage() {
  const {
    items,
    unreadCount,
    loading,
    soundMuted,
    toggleSoundMuted,
    markRead,
    markAllRead,
    refresh,
  } = useNotifications()

  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter === 'unread' && n.read) return false
      if (
        filter !== 'all' &&
        filter !== 'unread' &&
        n.category !== filter
      ) {
        return false
      }
      return matchesNotificationSearch(n, query)
    })
  }, [items, filter, query])

  async function onMarkAll() {
    setBusy(true)
    try {
      await markAllRead()
      setMessage('تم تعليم جميع الإشعارات كمقروءة')
    } finally {
      setBusy(false)
    }
  }

  async function onRefresh() {
    setBusy(true)
    try {
      await refresh()
      setMessage('تم تحديث قائمة الإشعارات')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="ntf-status">جاري تحميل الإشعارات…</p>
  }

  return (
    <div className="ntf-page">
      <header className="ntf-hero">
        <div>
          <h1>مركز الإشعارات</h1>
          <p>{NOTIFICATION_RULES.scopeNote}</p>
        </div>
        <div className="ntf-hero-actions">
          <button
            type="button"
            className={`ntf-btn-ghost ${soundMuted ? 'warn' : 'accent'}`}
            onClick={toggleSoundMuted}
          >
            {soundMuted ? 'الصوت مكتوم' : 'الصوت مفعّل'}
          </button>
          <button
            type="button"
            className="ntf-btn-ghost"
            disabled={busy}
            onClick={() => void onRefresh()}
          >
            تحديث
          </button>
          <button
            type="button"
            className="ntf-btn"
            disabled={busy || unreadCount === 0}
            onClick={() => void onMarkAll()}
          >
            تعليم الكل مقروء
          </button>
        </div>
      </header>

      {message ? <p className="ntf-status ok">{message}</p> : null}

      <div className="ntf-kpis">
        <article className="ntf-kpi">
          <span>الكل</span>
          <strong>{items.length}</strong>
        </article>
        <article className="ntf-kpi highlight">
          <span>غير مقروء</span>
          <strong>{unreadCount}</strong>
        </article>
        <article className="ntf-kpi">
          <span>خطط عمل</span>
          <strong>
            {items.filter((n) => n.category === 'plan' && !n.read).length}
          </strong>
        </article>
        <article className="ntf-kpi">
          <span>مستودع</span>
          <strong>
            {
              items.filter((n) => n.category === 'warehouse' && !n.read)
                .length
            }
          </strong>
        </article>
      </div>

      <div className="ntf-toolbar">
        <div className="ntf-tabs">
          {(
            [
              ['all', 'الكل'],
              ['unread', 'غير مقروء'],
              ['plan', 'خطط'],
              ['warehouse', 'مستودع'],
              ['finance', 'مالية'],
              ['evaluation', 'تقييم'],
              ['compensation', 'رواتب'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={filter === id ? 'active' : ''}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="ntf-search"
          placeholder="بحث في العنوان أو الوصف…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="ntf-list">
        {filtered.length === 0 ? (
          <p className="ntf-empty">لا إشعارات مطابقة</p>
        ) : (
          filtered.map((n) => (
            <article
              key={n.id}
              className={`ntf-card ${n.read ? 'read' : 'unread'} prio-${n.priority}`}
            >
              <div className="ntf-card-top">
                <span className={`ntf-cat cat-${n.category}`}>
                  {categoryLabel(n.category)}
                </span>
                <span className="ntf-meta">
                  {priorityLabel(n.priority)} · {formatNoticeTime(n.createdAt)}
                </span>
              </div>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              {n.relatedLabel ? (
                <small className="ntf-related">{n.relatedLabel}</small>
              ) : null}
              <div className="ntf-card-actions">
                {!n.read ? (
                  <button
                    type="button"
                    className="ntf-btn-ghost"
                    onClick={() => void markRead(n.id)}
                  >
                    تعليم مقروء
                  </button>
                ) : null}
                {n.linkTo ? (
                  <Link
                    className="ntf-link"
                    to={n.linkTo}
                    onClick={() => {
                      if (!n.read) void markRead(n.id)
                    }}
                  >
                    عرض التفاصيل
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
