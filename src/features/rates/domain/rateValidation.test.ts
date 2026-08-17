import { describe, expect, it } from 'vitest'
import type {
  CompanyCommissionRate,
  ProductCommissionRate,
} from './rateEntities'
import { resolveCommissionPreview } from './resolveCommission'
import { validateCompanyRateInput } from './rateValidation'

describe('rates domain', () => {
  const companyRates: CompanyCommissionRate[] = [
    {
      id: '1',
      companyId: 'c1',
      companyName: 'شركة',
      percent: 5,
      startDate: '2020-01-01',
      status: 'active',
      updatedAt: '2020-01-01',
    },
  ]

  const productRates: ProductCommissionRate[] = [
    {
      id: 'p1',
      productId: 'prod1',
      productName: 'صنف',
      companyId: 'c1',
      companyName: 'شركة',
      companyBasePercent: 5,
      percent: 8,
      startDate: '2020-01-01',
      status: 'active',
      updatedAt: '2020-01-01',
    },
  ]

  it('prefers product special rate over company rate', () => {
    const result = resolveCommissionPreview(
      {
        repId: 'r1',
        companyId: 'c1',
        productId: 'prod1',
        salesAmount: 10000,
      },
      companyRates,
      productRates,
    )
    expect(result.source).toBe('product')
    expect(result.appliedPercent).toBe(8)
    expect(result.estimatedCommission).toBe(800)
  })

  it('rejects overlapping active company rates', () => {
    expect(() =>
      validateCompanyRateInput(
        {
          companyId: 'c1',
          percent: 6,
          startDate: '2026-01-01',
        },
        companyRates,
      ),
    ).toThrow(/متداخل/)
  })
})
