import type { NotificationsFeed } from '../domain/notificationEntities'

export type NotificationsDatasource = {
  getFeed(): Promise<NotificationsFeed>
  markRead(id: string): Promise<void>
  markAllRead(): Promise<void>
}
