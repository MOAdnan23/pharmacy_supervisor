import { appConfig } from '../../../core/config'
import type { PermissionsDatasource } from './permissionsDatasource'
import { permissionsMockDatasource } from './permissionsMockDatasource'
import { permissionsRemoteDatasource } from './permissionsRemoteDatasource'

export function getPermissionsDatasource(): PermissionsDatasource {
  return appConfig.useRemotePermissions
    ? permissionsRemoteDatasource
    : permissionsMockDatasource
}
