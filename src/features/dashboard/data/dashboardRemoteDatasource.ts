import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type { DashboardOverview } from '../domain/dashboard'
import type { DashboardDatasource } from './dashboardDatasource'

/** Remote جاهز لاحقاً — يتوقع JSON بنفس شكل DashboardOverview */
export const dashboardRemoteDatasource: DashboardDatasource = {
  async getOverview() {
    const data = await httpRequest<{
      data?: DashboardOverview
    } & DashboardOverview>(apiEndpoints.dashboard.overview)

    if (data.kpis) return data
    if (data.data?.kpis) return data.data
    throw new Error('رد لوحة التحكم غير مفهوم')
  },
}
