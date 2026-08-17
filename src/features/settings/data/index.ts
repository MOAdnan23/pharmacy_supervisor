import { appConfig } from '../../../core/config'
import type { SettingsDatasource } from './settingsDatasource'
import { settingsMockDatasource } from './settingsMockDatasource'
import { settingsRemoteDatasource } from './settingsRemoteDatasource'

export function getSettingsDatasource(): SettingsDatasource {
  return appConfig.useRemoteSettings
    ? settingsRemoteDatasource
    : settingsMockDatasource
}
