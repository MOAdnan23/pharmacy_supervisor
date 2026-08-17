/**
 * مزوّد إشعارات الجلسة: استطلاع دوري + توست + صوت قابل للكتم
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getNotificationsDatasource } from './data'
import type { SupervisorNotification } from './domain/notificationEntities'
import { SOUND_MUTE_STORAGE_KEY } from './domain/notificationLabels'
import { playNotificationSound } from './services/notificationSound'

const POLL_MS = 8000

type ToastState = {
  id: string
  title: string
  body: string
  linkTo?: string
} | null

type NotificationsContextValue = {
  items: SupervisorNotification[]
  unreadCount: number
  loading: boolean
  soundMuted: boolean
  toast: ToastState
  toggleSoundMuted: () => void
  dismissToast: () => void
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
)

function readMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const datasource = useMemo(() => getNotificationsDatasource(), [])
  const [items, setItems] = useState<SupervisorNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [soundMuted, setSoundMuted] = useState(readMuted)
  const [toast, setToast] = useState<ToastState>(null)

  const knownIdsRef = useRef<Set<string>>(new Set())
  const primedRef = useRef(false)
  const mutedRef = useRef(soundMuted)
  mutedRef.current = soundMuted

  const applyFeed = useCallback(
    async (announceNew: boolean) => {
      const feed = await datasource.getFeed()
      const incoming = feed.items

      if (!primedRef.current) {
        knownIdsRef.current = new Set(incoming.map((n) => n.id))
        primedRef.current = true
      } else if (announceNew) {
        const fresh = incoming.filter((n) => !knownIdsRef.current.has(n.id))
        for (const n of fresh) knownIdsRef.current.add(n.id)
        if (fresh.length > 0) {
          const latest = fresh[0]
          setToast({
            id: latest.id,
            title: latest.title,
            body: latest.body,
            linkTo: latest.linkTo,
          })
          if (!mutedRef.current) {
            void playNotificationSound()
          }
          if (typeof document !== 'undefined') {
            const base = document.title.replace(/^\(\d+\)\s*/, '')
            document.title = `(${feed.unreadCount}) ${base}`
          }
        }
      } else {
        for (const n of incoming) knownIdsRef.current.add(n.id)
      }

      setItems(incoming)
      setUnreadCount(feed.unreadCount)
      if (feed.unreadCount === 0 && typeof document !== 'undefined') {
        document.title = document.title.replace(/^\(\d+\)\s*/, '')
      }
    },
    [datasource],
  )

  const refresh = useCallback(async () => {
    await applyFeed(false)
  }, [applyFeed])

  useEffect(() => {
    let alive = true
    applyFeed(false)
      .catch(() => {
        /* يُعرض لاحقاً في الصفحة */
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    const timer = window.setInterval(() => {
      void applyFeed(true).catch(() => undefined)
    }, POLL_MS)

    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [applyFeed])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 6500)
    return () => window.clearTimeout(t)
  }, [toast])

  const toggleSoundMuted = useCallback(() => {
    setSoundMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SOUND_MUTE_STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const markRead = useCallback(
    async (id: string) => {
      await datasource.markRead(id)
      await applyFeed(false)
    },
    [datasource, applyFeed],
  )

  const markAllRead = useCallback(async () => {
    await datasource.markAllRead()
    await applyFeed(false)
    if (typeof document !== 'undefined') {
      document.title = document.title.replace(/^\(\d+\)\s*/, '')
    }
  }, [datasource, applyFeed])

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      soundMuted,
      toast,
      toggleSoundMuted,
      dismissToast,
      refresh,
      markRead,
      markAllRead,
    }),
    [
      items,
      unreadCount,
      loading,
      soundMuted,
      toast,
      toggleSoundMuted,
      dismissToast,
      refresh,
      markRead,
      markAllRead,
    ],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications يجب أن يُستخدم داخل NotificationsProvider')
  }
  return ctx
}
