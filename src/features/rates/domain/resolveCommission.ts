/**
 * احتساب نسبة العمولة المعتمدة (معاينة تقديرية فقط — UC-94/95)
 */
import type {
  CompanyCommissionRate,
  PreviewCommissionInput,
  PreviewCommissionResult,
  ProductCommissionRate,
} from './rateEntities'
import { isRateActiveOn, todayIsoDate } from './rateValidation'

export function resolveCommissionPreview(
  input: PreviewCommissionInput,
  companyRates: CompanyCommissionRate[],
  productRates: ProductCommissionRate[],
): PreviewCommissionResult {
  if (!Number.isFinite(input.salesAmount) || input.salesAmount < 0) {
    throw new Error('قيمة المبيعات غير صالحة')
  }
  if (!input.companyId) throw new Error('اختر الشركة')
  if (!input.productId) throw new Error('اختر الصنف')

  const on = todayIsoDate()
  const productSpecial = productRates.find(
    (r) =>
      r.productId === input.productId &&
      r.companyId === input.companyId &&
      isRateActiveOn(r, on),
  )
  const companyBase = companyRates.find(
    (r) => r.companyId === input.companyId && isRateActiveOn(r, on),
  )

  if (productSpecial) {
    const pct = productSpecial.percent
    return {
      appliedPercent: pct,
      source: 'product',
      sourceLabel: 'نسبة الصنف الخاصة',
      estimatedCommission: (input.salesAmount * pct) / 100,
      companyBasePercent: companyBase?.percent ?? null,
      productSpecialPercent: pct,
    }
  }

  if (companyBase) {
    const pct = companyBase.percent
    return {
      appliedPercent: pct,
      source: 'company',
      sourceLabel: 'نسبة الشركة الأساسية',
      estimatedCommission: (input.salesAmount * pct) / 100,
      companyBasePercent: pct,
      productSpecialPercent: null,
    }
  }

  return {
    appliedPercent: 0,
    source: 'none',
    sourceLabel: 'لا نسبة فعّالة',
    estimatedCommission: 0,
    companyBasePercent: null,
    productSpecialPercent: null,
  }
}
