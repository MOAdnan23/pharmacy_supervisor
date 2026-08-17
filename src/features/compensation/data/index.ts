import { appConfig } from '../../../core/config'
import type { CompensationDatasource } from './compensationDatasource'
import { compensationMockDatasource } from './compensationMockDatasource'
import { compensationRemoteDatasource } from './compensationRemoteDatasource'

export function getCompensationDatasource(): CompensationDatasource {
  return appConfig.useRemoteCompensation
    ? compensationRemoteDatasource
    : compensationMockDatasource
}
