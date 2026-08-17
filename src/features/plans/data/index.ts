import { appConfig } from '../../../core/config'
import type { PlansDatasource } from './plansDatasource'
import { plansMockDatasource } from './plansMockDatasource'
import { plansRemoteDatasource } from './plansRemoteDatasource'

export function getPlansDatasource(): PlansDatasource {
  return appConfig.useRemotePlans
    ? plansRemoteDatasource
    : plansMockDatasource
}
