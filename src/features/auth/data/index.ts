import { appConfig } from '../../../core/config'
import type { AuthDatasource } from './authDatasource'
import { authMockDatasource } from './authMockDatasource'
import { authRemoteDatasource } from './authRemoteDatasource'

/** يختار Mock أو Remote حسب الإعداد */
export function getAuthDatasource(): AuthDatasource {
  return appConfig.useRemoteAuth ? authRemoteDatasource : authMockDatasource
}
