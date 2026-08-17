import { describe, expect, it } from 'vitest'
import {
  totalVisitCount,
  uniquePharmaciesFromVisits,
  uniquePharmacyCount,
  visitsFromSalesInvoices,
} from './planExecutionRules'
import type { SalesPharmacyRow } from './planEntities'

describe('planExecutionRules', () => {
  const sales: SalesPharmacyRow[] = [
    {
      pharmacyId: 'ph1',
      pharmacyName: 'صيدلية أ',
      companyName: 'شركة 1',
      amount: 100,
      invoicesCount: 2,
      repId: 'r1',
      repName: 'مندوب',
    },
    {
      pharmacyId: 'ph1',
      pharmacyName: 'صيدلية أ',
      companyName: 'شركة 2',
      amount: 50,
      invoicesCount: 1,
      repId: 'r1',
      repName: 'مندوب',
    },
    {
      pharmacyId: 'ph2',
      pharmacyName: 'صيدلية ب',
      companyName: 'شركة 1',
      amount: 80,
      invoicesCount: 1,
      repId: 'r1',
      repName: 'مندوب',
    },
  ]

  it('counts each sales invoice as a visit', () => {
    const visits = visitsFromSalesInvoices(sales)
    expect(totalVisitCount(visits)).toBe(4)
    expect(visits.find((v) => v.pharmacyId === 'ph1')?.visitCount).toBe(3)
  })

  it('counts each pharmacy once for coverage goal', () => {
    const visits = visitsFromSalesInvoices(sales)
    expect(uniquePharmacyCount(visits)).toBe(2)
    const unique = uniquePharmaciesFromVisits(visits)
    expect(unique).toHaveLength(2)
    expect(unique.find((p) => p.pharmacyId === 'ph1')?.visitCount).toBe(3)
  })
})
