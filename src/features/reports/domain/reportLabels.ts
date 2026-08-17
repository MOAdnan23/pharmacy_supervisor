import type { ReportFilter, ReportTypeId } from './reportEntities'

export function reportTypeLabel(id: ReportTypeId): string {
  switch (id) {
    case 'sales':
      return 'المبيعات'
    case 'collections':
      return 'التحصيلات'
    case 'receivables':
      return 'الذمم'
    case 'regions':
      return 'المناطق'
    case 'pharmacies':
      return 'الصيدليات'
    case 'reps':
      return 'المندوبون'
    case 'evaluation':
      return 'التقييم'
    case 'targets':
      return 'التارغت'
    case 'commissions':
      return 'العمولات'
    case 'warehouse_stock':
      return 'جرد المستودع'
    case 'warehouse_low':
      return 'أصناف قابلة للنفاد'
    case 'warehouse_expiry':
      return 'تواريخ الصلاحية'
  }
}

export function money(n: number): string {
  return `${n.toLocaleString('ar-SY', { maximumFractionDigits: 0 })} ل.س`
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function defaultReportFilter(): ReportFilter {
  const to = todayIsoDate()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 30)
  return {
    from: fromDate.toISOString().slice(0, 10),
    to,
    mainRegionId: null,
    repId: null,
    pharmacyId: null,
    companyId: null,
  }
}

export function formatFilterSummary(filter: ReportFilter): string {
  const parts = [`من ${filter.from}`, `إلى ${filter.to}`]
  if (filter.mainRegionId) parts.push(`منطقة: ${filter.mainRegionId}`)
  if (filter.repId) parts.push(`مندوب: ${filter.repId}`)
  if (filter.pharmacyId) parts.push(`صيدلية: ${filter.pharmacyId}`)
  if (filter.companyId) parts.push(`شركة: ${filter.companyId}`)
  return parts.join(' · ')
}
