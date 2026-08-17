import { appConfig } from '../../../core/config'
import type { TargetsDatasource } from './targetsDatasource'
import { targetsMockDatasource } from './targetsMockDatasource'
import { targetsRemoteDatasource } from './targetsRemoteDatasource'

export function getTargetsDatasource(): TargetsDatasource {
  return appConfig.useRemoteTargets
    ? targetsRemoteDatasource
    : targetsMockDatasource
}
