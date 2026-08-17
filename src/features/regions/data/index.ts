import { appConfig } from '../../../core/config'
import type { RegionsDatasource } from './regionsDatasource'
import { regionsMockDatasource } from './regionsMockDatasource'
import { regionsRemoteDatasource } from './regionsRemoteDatasource'

export function getRegionsDatasource(): RegionsDatasource {
  return appConfig.useRemoteRegions
    ? regionsRemoteDatasource
    : regionsMockDatasource
}
