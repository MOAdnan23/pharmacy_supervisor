/** نسب الشركات والأصناف — UC-84 → UC-96
 * الشركات/الأصناف مصدرها المفوتر عبر الباك؛ المشرف يحدد النسب فقط.
 */

export type RateStatus = 'active' | 'suspended' | 'expired'

/** شركة من كتالوج المفوتر (قراءة فقط هنا) */
export type CatalogCompany = {
  id: string
  name: string
}

/** صنف من كتالوج المفوتر (قراءة فقط هنا) */
export type CatalogProduct = {
  id: string
  name: string
  companyId: string
  companyName: string
}

export type CompanyCommissionRate = {
  id: string
  companyId: string
  companyName: string
  percent: number
  startDate: string
  endDate?: string
  status: RateStatus
  notes?: string
  updatedAt: string
}

export type ProductCommissionRate = {
  id: string
  productId: string
  productName: string
  companyId: string
  companyName: string
  /** نسبة الشركة الأساسية وقت العرض (مرجعية) */
  companyBasePercent: number
  percent: number
  startDate: string
  endDate?: string
  status: RateStatus
  notes?: string
  updatedAt: string
}

export type RateAuditEntry = {
  id: string
  at: string
  userName: string
  companyName: string
  productName?: string
  previousPercent: number | null
  newPercent: number | null
  action: 'create' | 'update' | 'suspend' | 'delete'
  note?: string
}

export type RatesSummary = {
  companiesCount: number
  activeCompanyRates: number
  specialProductRates: number
  lastUpdatedAt: string | null
}

export type RatesBoard = {
  summary: RatesSummary
  /** كتالوج من المفوتر (Mock الآن / API لاحقاً) */
  catalogCompanies: CatalogCompany[]
  catalogProducts: CatalogProduct[]
  companyRates: CompanyCommissionRate[]
  productRates: ProductCommissionRate[]
  auditLog: RateAuditEntry[]
  repOptions: { id: string; name: string }[]
}

export type UpsertCompanyRateInput = {
  id?: string
  companyId: string
  percent: number
  startDate: string
  endDate?: string
  notes?: string
}

export type UpsertProductRateInput = {
  id?: string
  productId: string
  percent: number
  startDate: string
  endDate?: string
  notes?: string
}

export type PreviewCommissionInput = {
  repId: string
  companyId: string
  productId: string
  salesAmount: number
}

export type PreviewCommissionResult = {
  appliedPercent: number
  source: 'product' | 'company' | 'none'
  sourceLabel: string
  estimatedCommission: number
  companyBasePercent: number | null
  productSpecialPercent: number | null
}
