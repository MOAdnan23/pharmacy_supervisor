/**
 * Remote جاهز لاحقاً — يُفعَّل عبر VITE_USE_REMOTE_RATES=true
 * الكتالوج (شركات/أصناف) يأتي من باك المفوتر؛ النسب من API المشرف.
 */
import { apiEndpoints } from '../../../core/api/apiEndpoints'
import { httpRequest } from '../../../core/api/httpClient'
import type {
  PreviewCommissionInput,
  PreviewCommissionResult,
  RatesBoard,
  UpsertCompanyRateInput,
  UpsertProductRateInput,
} from '../domain/rateEntities'
import type { RatesDatasource } from './ratesDatasource'

export const ratesRemoteDatasource: RatesDatasource = {
  async getBoard() {
    const data = await httpRequest<{ data?: RatesBoard } & RatesBoard>(
      apiEndpoints.rates.board,
    )
    if (data.summary && data.companyRates) return data
    if (data.data?.summary) return data.data
    throw new Error('رد نسب الشركات غير مفهوم')
  },

  async upsertCompanyRate(input: UpsertCompanyRateInput) {
    if (input.id) {
      await httpRequest(apiEndpoints.rates.companyRateById(input.id), {
        method: 'PATCH',
        body: input,
      })
      return
    }
    await httpRequest(apiEndpoints.rates.companyRates, {
      method: 'POST',
      body: input,
    })
  },

  async suspendCompanyRate(id: string) {
    await httpRequest(apiEndpoints.rates.suspendCompanyRate(id), {
      method: 'POST',
    })
  },

  async upsertProductRate(input: UpsertProductRateInput) {
    if (input.id) {
      await httpRequest(apiEndpoints.rates.productRateById(input.id), {
        method: 'PATCH',
        body: input,
      })
      return
    }
    await httpRequest(apiEndpoints.rates.productRates, {
      method: 'POST',
      body: input,
    })
  },

  async suspendProductRate(id: string) {
    await httpRequest(apiEndpoints.rates.suspendProductRate(id), {
      method: 'POST',
    })
  },

  async deleteProductRate(id: string) {
    await httpRequest(apiEndpoints.rates.productRateById(id), {
      method: 'DELETE',
    })
  },

  async previewCommission(input: PreviewCommissionInput) {
    const data = await httpRequest<
      { data?: PreviewCommissionResult } & PreviewCommissionResult
    >(apiEndpoints.rates.preview, { method: 'POST', body: input })
    if (typeof data.appliedPercent === 'number') return data
    if (data.data) return data.data
    throw new Error('رد معاينة العمولة غير مفهوم')
  },
}
