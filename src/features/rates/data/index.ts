import { appConfig } from '../../../core/config'
import type { RatesDatasource } from './ratesDatasource'
import { ratesMockDatasource } from './ratesMockDatasource'
import { ratesRemoteDatasource } from './ratesRemoteDatasource'

export function getRatesDatasource(): RatesDatasource {
  return appConfig.useRemoteRates
    ? ratesRemoteDatasource
    : ratesMockDatasource
}
