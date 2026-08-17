import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type {
  PlansBoard,
  ReviewIncomingInput,
  SaveEvaluationInput,
  UpsertPlanInput,
  WorkPlan,
} from '../domain/planEntities'
import type { PlansDatasource } from './plansDatasource'

export const plansRemoteDatasource: PlansDatasource = {
  async getBoard() {
    const data = await httpRequest<{ data?: PlansBoard } & PlansBoard>(
      apiEndpoints.plans.board,
    )
    if (data.plans && data.summary) return data
    if (data.data?.plans) return data.data
    throw new Error('رد خطط العمل غير مفهوم من الخادم')
  },

  async getById(id) {
    const data = await httpRequest<
      { plan?: WorkPlan; data?: WorkPlan } & WorkPlan
    >(apiEndpoints.plans.byId(id))
    if (data.id && data.name) return data
    if (data.plan) return data.plan
    if (data.data) return data.data
    throw new Error('رد تفاصيل الخطة غير مفهوم')
  },

  async upsertPlan(input: UpsertPlanInput) {
    if (input.id) {
      const data = await httpRequest<{ plan?: WorkPlan } & WorkPlan>(
        apiEndpoints.plans.byId(input.id),
        { method: 'PATCH', body: input },
      )
      return data.plan ?? data
    }
    const data = await httpRequest<{ plan?: WorkPlan } & WorkPlan>(
      apiEndpoints.plans.list,
      { method: 'POST', body: input },
    )
    return data.plan ?? data
  },

  async reviewIncoming(input: ReviewIncomingInput) {
    await httpRequest(apiEndpoints.plans.review(input.id), {
      method: 'POST',
      body: input,
    })
  },

  async addNote(id, text) {
    await httpRequest(apiEndpoints.plans.notes(id), {
      method: 'POST',
      body: { text },
    })
  },

  async saveEvaluation(input: SaveEvaluationInput) {
    await httpRequest(apiEndpoints.plans.evaluate(input.id), {
      method: 'POST',
      body: input,
    })
  },

  async archivePlan(id) {
    await httpRequest(apiEndpoints.plans.archive(id), { method: 'POST' })
  },
}
