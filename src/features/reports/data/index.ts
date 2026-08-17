import { appConfig } from '../../../core/config'
import type { ReportsDatasource } from './reportsDatasource'
import { reportsMockDatasource } from './reportsMockDatasource'
import { reportsRemoteDatasource } from './reportsRemoteDatasource'

export function getReportsDatasource(): ReportsDatasource {
  return appConfig.useRemoteReports
    ? reportsRemoteDatasource
    : reportsMockDatasource
}
