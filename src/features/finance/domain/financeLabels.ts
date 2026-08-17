import type {
  FinanceFilter,
  FinanceKpiKind,
  FinancialAdjustmentType,
  FinancialMovementType,
  FinanceSummary,
} from './financeEntities'

export function movementTypeLabel(type: FinancialMovementType): string {
  switch (type) {
    case 'opening_balance':
      return 'رصيد سابق'
    case 'invoice':
      return 'فاتورة'
    case 'collection':
      return 'تحصيل'
    case 'return_voucher':
      return 'مرتجع'
    case 'debit_adjustment':
      return 'تعديل مدين'
    case 'credit_adjustment':
      return 'تعديل دائن'
  }
}

export function adjustmentTypeLabel(type: FinancialAdjustmentType): string {
  return type === 'debit'
    ? 'إضافة على الذمة (مدين)'
    : 'خصم من الذمة (دائن)'
}

export function money(n: number): string {
  return `${n.toLocaleString('ar-SY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ل.س`
}

export function averageCollection(summary: FinanceSummary): number {
  if (summary.collectionCount === 0) return 0
  return summary.collectionsTotal / summary.collectionCount
}

export function isDebtor(balance: number): boolean {
  return balance > 0.005
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function defaultFinanceFilter(): FinanceFilter {
  const today = todayIsoDate()
  return {
    mainRegionId: null,
    subRegionId: null,
    repId: null,
    pharmacyId: null,
    from: today,
    to: today,
  }
}

export function validateFinanceFilter(filter: FinanceFilter): void {
  if (!filter.from.trim()) throw new Error('تاريخ البداية مطلوب')
  if (!filter.to.trim()) throw new Error('تاريخ النهاية مطلوب')
  if (filter.from > filter.to) {
    throw new Error('تاريخ البداية يجب أن يسبق تاريخ النهاية')
  }
}

export type KpiMeta = {
  kind: FinanceKpiKind
  title: string
  targetTab: 0 | 1 | 2 | 3
}

export function kpiCatalog(summary: FinanceSummary): Array<
  KpiMeta & { value: string }
> {
  return [
    {
      kind: 'sales',
      title: 'إجمالي المبيعات',
      value: money(summary.salesTotal),
      targetTab: 3,
    },
    {
      kind: 'collections',
      title: 'إجمالي التحصيلات',
      value: money(summary.collectionsTotal),
      targetTab: 3,
    },
    {
      kind: 'returns',
      title: 'إجمالي المرتجعات',
      value: money(summary.returnsTotal),
      targetTab: 3,
    },
    {
      kind: 'debts',
      title: 'إجمالي الذمم الحالية',
      value: money(summary.debtsTotal),
      targetTab: 1,
    },
    {
      kind: 'debtors',
      title: 'الصيدليات المدينة',
      value: String(summary.debtorPharmacies),
      targetTab: 1,
    },
    {
      kind: 'settled',
      title: 'المسددة بالكامل',
      value: String(summary.settledPharmacies),
      targetTab: 1,
    },
    {
      kind: 'invoiceCount',
      title: 'عدد الفواتير',
      value: String(summary.invoiceCount),
      targetTab: 3,
    },
    {
      kind: 'collectionCount',
      title: 'عدد التحصيلات',
      value: String(summary.collectionCount),
      targetTab: 3,
    },
    {
      kind: 'returnCount',
      title: 'عدد المرتجعات',
      value: String(summary.returnCount),
      targetTab: 3,
    },
    {
      kind: 'avgCollection',
      title: 'متوسط التحصيل',
      value: money(averageCollection(summary)),
      targetTab: 3,
    },
  ]
}

export const FINANCE_RULE_BANNER =
  'قواعد الحساب: الفواتير المعتمدة تزيد الذمة، والتحصيلات المعتمدة والمرتجعات تخفضها. التحصيل النقدي وحده ينعكس أيضاً على الصندوق. التعديل المالي لا يؤثر على الصندوق.'

export const FINANCE_SUBTITLE =
  'مبيعات، تحصيلات، مرتجعات وكشوف حساب — دفتر الذمم مستقل عن صندوق المستودع'
