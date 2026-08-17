import { appConfig } from '../../../core/config'
import type { EvaluationDatasource } from './evaluationDatasource'
import { evaluationMockDatasource } from './evaluationMockDatasource'
import { evaluationRemoteDatasource } from './evaluationRemoteDatasource'

export function getEvaluationDatasource(): EvaluationDatasource {
  return appConfig.useRemoteEvaluation
    ? evaluationRemoteDatasource
    : evaluationMockDatasource
}
