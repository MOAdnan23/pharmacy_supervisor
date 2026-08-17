import type {
  ReviewIncomingInput,
  SaveEvaluationInput,
  PlansBoard,
  UpsertPlanInput,
  WorkPlan,
} from '../domain/planEntities'

export type PlansDatasource = {
  getBoard(): Promise<PlansBoard>
  getById(id: string): Promise<WorkPlan>
  upsertPlan(input: UpsertPlanInput): Promise<WorkPlan>
  reviewIncoming(input: ReviewIncomingInput): Promise<void>
  addNote(id: string, text: string): Promise<void>
  saveEvaluation(input: SaveEvaluationInput): Promise<void>
  archivePlan(id: string): Promise<void>
}
