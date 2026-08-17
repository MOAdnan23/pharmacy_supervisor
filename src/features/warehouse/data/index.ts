import { appConfig } from '../../../core/config'
import type { WarehouseDatasource } from './warehouseDatasource'
import { warehouseMockDatasource } from './warehouseMockDatasource'
import { warehouseRemoteDatasource } from './warehouseRemoteDatasource'

export function getWarehouseDatasource(): WarehouseDatasource {
  return appConfig.useRemoteWarehouse
    ? warehouseRemoteDatasource
    : warehouseMockDatasource
}
