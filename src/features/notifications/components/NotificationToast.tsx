import { Link } from 'react-router-dom'
import { useNotifications } from '../NotificationsContext'
import '../pages/notifications.css'

/** توست عائم عند وصول إشعار جديد — يفتح العنصر المرتبط مباشرة */
export function NotificationToast() {
  const { toast, dismissToast, markRead } = useNotifications()
  if (!toast) return null

  const target = toast.linkTo || '/notifications'

  return (
    <div className="ntf-toast" role="status" aria-live="polite">
      <strong>{toast.title}</strong>
      <p>{toast.body}</p>
      <div className="ntf-toast-actions">
        <Link
          to={target}
          onClick={() => {
            void markRead(toast.id)
            dismissToast()
          }}
        >
          عرض
        </Link>
        <button type="button" onClick={dismissToast}>
          إخفاء
        </button>
      </div>
    </div>
  )
}
