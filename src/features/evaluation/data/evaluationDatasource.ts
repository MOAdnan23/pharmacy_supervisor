import type {
  EvaluationBoard,
  EvaluationFilter,
  SendSupervisorReviewInput,
} from '../domain/evaluationEntities'

export type EvaluationDatasource = {
  getBoard(filter: EvaluationFilter): Promise<EvaluationBoard>
  sendSupervisorReview(input: SendSupervisorReviewInput): Promise<void>
}
