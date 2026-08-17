/** المالية وذمم الصيدليات — مطابقة لوحدة المفوتر (UC-55→70 / UC-430→450) */

export type FinancialMovementType =
  | 'opening_balance'
  | 'invoice'
  | 'collection'
  | 'return_voucher'
  | 'debit_adjustment'
  | 'credit_adjustment'

export type FinancialAdjustmentType = 'debit' | 'credit'

export type FinanceFilter = {
  mainRegionId: string | null
  subRegionId: string | null
  repId: string | null
  pharmacyId: string | null
  from: string
  to: string
}

export type FinanceRegionOption = {
  id: string
  name: string
  subRegions: { id: string; name: string }[]
}

export type FinancePharmacyOption = {
  id: string
  name: string
  mainRegionId: string
  subRegionId: string
  address: string
  currentBalance: number
  repNames: string[]
}

export type FinanceRepOption = {
  id: string
  name: string
}

export type FinancialMovement = {
  id: string
  type: FinancialMovementType
  referenceNumber: string
  pharmacyId: string
  pharmacyName: string
  repId?: string
  repName?: string
  date: string
  debit: number
  credit: number
  balanceAfter: number
  address?: string
  notes?: string
}

export type PharmacyFinanceRow = {
  pharmacyId: string
  pharmacyName: string
  regionLabel: string
  address: string
  repNames: string[]
  sales: number
  collections: number
  returns: number
  adjustments: number
  currentBalance: number
  invoiceCount: number
  collectionCount: number
  returnCount: number
  lastInvoiceAt?: string
  lastCollectionAt?: string
  lastReturnAt?: string
}

export type RepFinanceRow = {
  repId: string
  repName: string
  sales: number
  collections: number
  returns: number
  debts: number
  pharmacyCount: number
}

export type FinanceSummary = {
  salesTotal: number
  collectionsTotal: number
  returnsTotal: number
  debtsTotal: number
  debtorPharmacies: number
  settledPharmacies: number
  invoiceCount: number
  collectionCount: number
  returnCount: number
}

export type FinanceDashboardData = {
  summary: FinanceSummary
  pharmacies: PharmacyFinanceRow[]
  reps: RepFinanceRow[]
  movements: FinancialMovement[]
}

export type FinanceBoard = {
  regions: FinanceRegionOption[]
  pharmacies: FinancePharmacyOption[]
  reps: FinanceRepOption[]
  filter: FinanceFilter
  dashboard: FinanceDashboardData
}

export type FinancialAdjustmentInput = {
  pharmacyId: string
  type: FinancialAdjustmentType
  amount: number
  reason: string
}

export type FinanceKpiKind =
  | 'sales'
  | 'collections'
  | 'returns'
  | 'debts'
  | 'debtors'
  | 'settled'
  | 'invoiceCount'
  | 'collectionCount'
  | 'returnCount'
  | 'avgCollection'
