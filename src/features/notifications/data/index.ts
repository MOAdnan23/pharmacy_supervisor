import { appConfig } from '../../../core/config'
import type { NotificationsDatasource } from './notificationsDatasource'
import { notificationsMockDatasource } from './notificationsMockDatasource'
import { notificationsRemoteDatasource } from './notificationsRemoteDatasource'

export function getNotificationsDatasource(): NotificationsDatasource {
  return appConfig.useRemoteNotifications
    ? notificationsRemoteDatasource
    : notificationsMockDatasource
}
