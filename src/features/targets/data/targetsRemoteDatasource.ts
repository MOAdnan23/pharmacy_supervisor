import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type {
  CompanyTargetStatus,
  SetRepTargetInput,
  TargetsBoard,
  UpsertCompanyTargetInput,
} from '../domain/targetEntities'
import type { TargetsDatasource } from './targetsDatasource'

/**
 * Remote جاهز لاحقاً — لن يُستدعى ما دام useRemoteTargets = false.
 */
export const targetsRemoteDatasource: TargetsDatasource = {
  async getBoard() {
    const data = await httpRequest<{ data?: TargetsBoard } & TargetsBoard>(
      apiEndpoints.targets.board,
    )
    if (data.repTargets && data.companyTargets) return data
    if (data.data?.repTargets) return data.data
    throw new Error('رد التارغت غير مفهوم')
  },

  async setRepTarget(input: SetRepTargetInput) {
    await httpRequest(apiEndpoints.targets.repTargets, {
      method: 'POST',
      body: input,
    })
  },

  async upsertCompanyTarget(input: UpsertCompanyTargetInput) {
    if (input.id) {
      await httpRequest(apiEndpoints.targets.companyById(input.id), {
        method: 'PATCH',
        body: input,
      })
      return
    }
    await httpRequest(apiEndpoints.targets.companyTargets, {
      method: 'POST',
      body: input,
    })
  },

  async setCompanyTargetStatus(id: string, status: CompanyTargetStatus) {
    await httpRequest(apiEndpoints.targets.companyStatus(id), {
      method: 'POST',
      body: { status },
    })
  },
}
