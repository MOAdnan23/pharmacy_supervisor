import { appConfig } from '../../../core/config'
import type { DashboardDatasource } from './dashboardDatasource'
import { dashboardMockDatasource } from './dashboardMockDatasource'
import { dashboardRemoteDatasource } from './dashboardRemoteDatasource'

export function getDashboardDatasource(): DashboardDatasource {
  return appConfig.useRemoteDashboard
    ? dashboardRemoteDatasource
    : dashboardMockDatasource
}
