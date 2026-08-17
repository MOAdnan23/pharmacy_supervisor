/**
 * Remote جاهز لاحقاً — VITE_USE_REMOTE_EVALUATION=true
 */
import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type {
  EvaluationBoard,
  EvaluationFilter,
  SendSupervisorReviewInput,
} from '../domain/evaluationEntities'
import type { EvaluationDatasource } from './evaluationDatasource'

function filterQuery(filter: EvaluationFilter): string {
  const q = new URLSearchParams()
  q.set('rep_id', filter.repId)
  q.set('from', filter.from)
  q.set('to', filter.to)
  if (filter.mainRegionId) q.set('main_region_id', filter.mainRegionId)
  if (filter.subRegionId) q.set('sub_region_id', filter.subRegionId)
  return q.toString()
}

export const evaluationRemoteDatasource: EvaluationDatasource = {
  async getBoard(filter) {
    const data = await httpRequest<{ data?: EvaluationBoard } & EvaluationBoard>(
      `${apiEndpoints.evaluation.board}?${filterQuery(filter)}`,
    )
    if (data.repOptions && data.filter) return data
    if (data.data?.repOptions) return data.data
    throw new Error('رد التقييم غير مفهوم')
  },

  async sendSupervisorReview(input: SendSupervisorReviewInput) {
    await httpRequest(apiEndpoints.evaluation.sendReview, {
      method: 'POST',
      body: {
        rep_id: input.repId,
        from: input.from,
        to: input.to,
        main_region_id: input.mainRegionId,
        sub_region_id: input.subRegionId,
        grade: input.grade,
        note: input.note,
      },
    })
  },
}
