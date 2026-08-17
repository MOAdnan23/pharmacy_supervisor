import { appConfig } from '../../../core/config'
import type { UsersDatasource } from './usersDatasource'
import { usersMockDatasource } from './usersMockDatasource'
import { usersRemoteDatasource } from './usersRemoteDatasource'

export function getUsersDatasource(): UsersDatasource {
  return appConfig.useRemoteUsers ? usersRemoteDatasource : usersMockDatasource
}
