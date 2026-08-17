/**
 * Remote جاهز لاحقاً — VITE_USE_REMOTE_NOTIFICATIONS=true
 */
import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type { NotificationsFeed } from '../domain/notificationEntities'
import type { NotificationsDatasource } from './notificationsDatasource'

export const notificationsRemoteDatasource: NotificationsDatasource = {
  async getFeed() {
    const data = await httpRequest<
      { data?: NotificationsFeed } & NotificationsFeed
    >(apiEndpoints.notifications.feed)
    if (Array.isArray(data.items)) return data
    if (data.data?.items) return data.data
    throw new Error('رد الإشعارات غير مفهوم')
  },

  async markRead(id: string) {
    await httpRequest(apiEndpoints.notifications.markRead(id), {
      method: 'POST',
    })
  },

  async markAllRead() {
    await httpRequest(apiEndpoints.notifications.markAllRead, {
      method: 'POST',
    })
  },
}
