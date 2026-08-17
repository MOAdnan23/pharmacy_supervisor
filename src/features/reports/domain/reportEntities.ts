/**
 * مركز التقارير — أنواع متعددة + فلاتر + PDF/طباعة
 */

export type ReportTypeId =
  | 'sales'
  | 'collections'
  | 'receivables'
  | 'regions'
  | 'pharmacies'
  | 'reps'
  | 'evaluation'
  | 'targets'
  | 'commissions'
  | 'warehouse_stock'
  | 'warehouse_low'
  | 'warehouse_expiry'

export type ReportFilter = {
  from: string
  to: string
  mainRegionId: string | null
  repId: string | null
  pharmacyId: string | null
  companyId: string | null
}

export type ReportOption = {
  id: string
  name: string
}

export type ReportColumn = {
  key: string
  label: string
}

export type ReportRow = Record<string, string | number>

export type ReportResult = {
  typeId: ReportTypeId
  title: string
  subtitle: string
  generatedAt: string
  columns: ReportColumn[]
  rows: ReportRow[]
  totals?: Record<string, string | number>
}

export type ReportsBoard = {
  filter: ReportFilter
  reportTypes: Array<{ id: ReportTypeId; label: string; group: string }>
  regionOptions: ReportOption[]
  repOptions: ReportOption[]
  pharmacyOptions: ReportOption[]
  companyOptions: ReportOption[]
}

export type RunReportInput = {
  typeId: ReportTypeId
  filter: ReportFilter
}
