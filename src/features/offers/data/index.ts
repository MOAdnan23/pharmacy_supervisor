import { appConfig } from '../../../core/config'
import type { OffersDatasource } from './offersDatasource'
import { offersMockDatasource } from './offersMockDatasource'
import { offersRemoteDatasource } from './offersRemoteDatasource'

export function getOffersDatasource(): OffersDatasource {
  return appConfig.useRemoteOffers
    ? offersRemoteDatasource
    : offersMockDatasource
}
