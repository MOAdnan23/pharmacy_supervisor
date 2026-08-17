/**
 * Remote جاهز لاحقاً — VITE_USE_REMOTE_FINANCE=true
 * نفس عقد المفوتر تقريباً: /api/v1/finance/dashboard + adjustments
 */
import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type {
  FinanceBoard,
  FinanceDashboardData,
  FinanceFilter,
  FinancePharmacyOption,
  FinanceRegionOption,
  FinanceRepOption,
  FinancialAdjustmentInput,
} from '../domain/financeEntities'
import { defaultFinanceFilter } from '../domain/financeLabels'
import type { FinanceDatasource } from './financeDatasource'

function filterQuery(filter: FinanceFilter): string {
  const q = new URLSearchParams()
  q.set('from', filter.from)
  q.set('to', filter.to)
  if (filter.mainRegionId) q.set('main_region_id', filter.mainRegionId)
  if (filter.subRegionId) q.set('sub_region_id', filter.subRegionId)
  if (filter.repId) q.set('rep_id', filter.repId)
  if (filter.pharmacyId) q.set('pharmacy_id', filter.pharmacyId)
  return q.toString()
}

export const financeRemoteDatasource: FinanceDatasource = {
  async getBoard(filter = defaultFinanceFilter()) {
    const [dashboardRes, regionsRes, pharmaciesRes, repsRes] =
      await Promise.all([
        httpRequest<{ data?: FinanceDashboardData } & FinanceDashboardData>(
          `${apiEndpoints.finance.dashboard}?${filterQuery(filter)}`,
        ),
        httpRequest<{ data?: FinanceRegionOption[] } | FinanceRegionOption[]>(
          apiEndpoints.finance.regions,
        ),
        httpRequest<
          { data?: FinancePharmacyOption[] } | FinancePharmacyOption[]
        >(apiEndpoints.finance.pharmacies),
        httpRequest<{ data?: FinanceRepOption[] } | FinanceRepOption[]>(
          apiEndpoints.finance.reps,
        ),
      ])

    const dashboard =
      dashboardRes.summary && dashboardRes.pharmacies
        ? dashboardRes
        : dashboardRes.data
    if (!dashboard?.summary) throw new Error('رد لوحة المالية غير مفهوم')

    const regions = Array.isArray(regionsRes)
      ? regionsRes
      : (regionsRes.data ?? [])
    const pharmacies = Array.isArray(pharmaciesRes)
      ? pharmaciesRes
      : (pharmaciesRes.data ?? [])
    const reps = Array.isArray(repsRes) ? repsRes : (repsRes.data ?? [])

    return {
      regions,
      pharmacies,
      reps,
      filter,
      dashboard,
    } satisfies FinanceBoard
  },

  async createAdjustment(input: FinancialAdjustmentInput) {
    await httpRequest(apiEndpoints.finance.adjustments, {
      method: 'POST',
      body: {
        pharmacy_id: input.pharmacyId,
        type: input.type,
        amount: input.amount,
        reason: input.reason,
      },
    })
  },
}
