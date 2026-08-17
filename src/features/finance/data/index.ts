import { appConfig } from '../../../core/config'
import type { FinanceDatasource } from './financeDatasource'
import { financeMockDatasource } from './financeMockDatasource'
import { financeRemoteDatasource } from './financeRemoteDatasource'

export function getFinanceDatasource(): FinanceDatasource {
  return appConfig.useRemoteFinance
    ? financeRemoteDatasource
    : financeMockDatasource
}
