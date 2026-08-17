/**
 * Remote جاهز لاحقاً — VITE_USE_REMOTE_REPORTS=true
 */
import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type {
  ReportResult,
  ReportsBoard,
  RunReportInput,
} from '../domain/reportEntities'
import type { ReportsDatasource } from './reportsDatasource'

export const reportsRemoteDatasource: ReportsDatasource = {
  async getBoard() {
    const data = await httpRequest<{ data?: ReportsBoard } & ReportsBoard>(
      apiEndpoints.reports.board,
    )
    if (data.reportTypes) return data
    if (data.data?.reportTypes) return data.data
    throw new Error('رد التقارير غير مفهوم')
  },

  async runReport(input: RunReportInput) {
    const data = await httpRequest<{ data?: ReportResult } & ReportResult>(
      apiEndpoints.reports.run,
      {
        method: 'POST',
        body: {
          type_id: input.typeId,
          from: input.filter.from,
          to: input.filter.to,
          main_region_id: input.filter.mainRegionId,
          rep_id: input.filter.repId,
          pharmacy_id: input.filter.pharmacyId,
          company_id: input.filter.companyId,
        },
      },
    )
    if (data.columns && data.rows) return data
    if (data.data?.columns) return data.data
    throw new Error('رد تشغيل التقرير غير مفهوم')
  },
}
