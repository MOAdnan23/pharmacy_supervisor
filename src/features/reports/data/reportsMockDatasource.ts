/**
 * بيانات تقارير مجمّعة للعرض — تُستبدل لاحقاً بـ API
 */
import type {
  ReportFilter,
  ReportResult,
  ReportRow,
  ReportTypeId,
  ReportsBoard,
  RunReportInput,
} from '../domain/reportEntities'
import {
  defaultReportFilter,
  money,
  reportTypeLabel,
} from '../domain/reportLabels'
import type { ReportsDatasource } from './reportsDatasource'

const REGIONS = [
  { id: 'mr1', name: 'دمشق' },
  { id: 'mr2', name: 'حلب' },
]

const REPS = [
  { id: 'r1', name: 'ياسين العمودي', regionId: 'mr1' },
  { id: 'r2', name: 'محمد الشهري', regionId: 'mr2' },
  { id: 'r3', name: 'سامر الحسن', regionId: 'mr1' },
]

const PHARMACIES = [
  { id: 'ph1', name: 'صيدلية النور', regionId: 'mr1', repId: 'r1', balance: 55000 },
  { id: 'ph2', name: 'صيدلية الحياة', regionId: 'mr1', repId: 'r1', balance: 0 },
  { id: 'ph3', name: 'صيدلية الرازي', regionId: 'mr1', repId: 'r3', balance: 120000 },
  { id: 'ph4', name: 'صيدلية العزيزية', regionId: 'mr2', repId: 'r2', balance: 88000 },
  { id: 'ph5', name: 'صيدلية صلاح الدين', regionId: 'mr2', repId: 'r2', balance: 42000 },
]

const COMPANIES = [
  { id: 'c1', name: 'شركة دمشق فارما' },
  { id: 'c2', name: 'شركة ابن سينا' },
  { id: 'c3', name: 'شركة حلب ميديكال' },
]

type SaleRow = {
  date: string
  pharmacyId: string
  repId: string
  companyId: string
  regionId: string
  amount: number
  type: 'sale' | 'collection'
}

const MOVEMENTS: SaleRow[] = [
  { date: '2026-08-05', pharmacyId: 'ph1', repId: 'r1', companyId: 'c1', regionId: 'mr1', amount: 4200000, type: 'sale' },
  { date: '2026-08-06', pharmacyId: 'ph4', repId: 'r2', companyId: 'c3', regionId: 'mr2', amount: 6200000, type: 'sale' },
  { date: '2026-08-07', pharmacyId: 'ph2', repId: 'r1', companyId: 'c2', regionId: 'mr1', amount: 3500000, type: 'sale' },
  { date: '2026-08-08', pharmacyId: 'ph1', repId: 'r1', companyId: 'c1', regionId: 'mr1', amount: 1500000, type: 'collection' },
  { date: '2026-08-09', pharmacyId: 'ph3', repId: 'r3', companyId: 'c1', regionId: 'mr1', amount: 5100000, type: 'sale' },
  { date: '2026-08-10', pharmacyId: 'ph5', repId: 'r2', companyId: 'c2', regionId: 'mr2', amount: 3100000, type: 'sale' },
  { date: '2026-08-11', pharmacyId: 'ph4', repId: 'r2', companyId: 'c3', regionId: 'mr2', amount: 2000000, type: 'collection' },
  { date: '2026-08-12', pharmacyId: 'ph3', repId: 'r3', companyId: 'c2', regionId: 'mr1', amount: 1800000, type: 'sale' },
  { date: '2026-08-13', pharmacyId: 'ph1', repId: 'r1', companyId: 'c1', regionId: 'mr1', amount: 900000, type: 'collection' },
  { date: '2026-08-14', pharmacyId: 'ph5', repId: 'r2', companyId: 'c3', regionId: 'mr2', amount: 1100000, type: 'collection' },
  { date: '2026-08-15', pharmacyId: 'ph2', repId: 'r1', companyId: 'c2', regionId: 'mr1', amount: 2700000, type: 'sale' },
]

const STOCK = [
  { id: 'p1', name: 'باراسيتامول 500', companyId: 'c1', qty: 420, expiry: '2028-03-15', status: 'متوفر' },
  { id: 'p2', name: 'أموكسيسيلين 500', companyId: 'c1', qty: 85, expiry: '2026-10-20', status: 'منخفض' },
  { id: 'p3', name: 'فيتامين سي', companyId: 'c2', qty: 260, expiry: '2027-04-01', status: 'متوفر' },
  { id: 'p4', name: 'أوميغا 3', companyId: 'c2', qty: 0, expiry: '2026-09-01', status: 'نافد' },
  { id: 'p5', name: 'شراب سعال', companyId: 'c3', qty: 55, expiry: '2026-08-25', status: 'منخفض' },
  { id: 'p6', name: 'قطرة عين', companyId: 'c3', qty: 190, expiry: '2027-11-01', status: 'متوفر' },
]

const EVALS = [
  { repId: 'r1', percent: 86, grade: 'ممتاز' },
  { repId: 'r2', percent: 72, grade: 'جيد جداً' },
  { repId: 'r3', percent: 91, grade: 'ممتاز جداً' },
]

const TARGETS = [
  { repId: 'r1', companyId: 'c1', target: 15000000, achieved: 12600000 },
  { repId: 'r1', companyId: 'c2', target: 8000000, achieved: 6200000 },
  { repId: 'r2', companyId: 'c3', target: 12000000, achieved: 9300000 },
  { repId: 'r3', companyId: 'c1', target: 6000000, achieved: 5100000 },
]

const COMMISSIONS = [
  { repId: 'r1', companyId: 'c1', percent: 4.5, base: 12600000 },
  { repId: 'r1', companyId: 'c2', percent: 3.5, base: 6200000 },
  { repId: 'r2', companyId: 'c3', percent: 4.0, base: 9300000 },
  { repId: 'r3', companyId: 'c1', percent: 4.5, base: 5100000 },
]

const REPORT_TYPES: ReportsBoard['reportTypes'] = [
  { id: 'sales', label: 'المبيعات', group: 'مالية' },
  { id: 'collections', label: 'التحصيلات', group: 'مالية' },
  { id: 'receivables', label: 'الذمم', group: 'مالية' },
  { id: 'regions', label: 'المناطق', group: 'توزيع' },
  { id: 'pharmacies', label: 'الصيدليات', group: 'توزيع' },
  { id: 'reps', label: 'المندوبون', group: 'توزيع' },
  { id: 'evaluation', label: 'التقييم', group: 'أداء' },
  { id: 'targets', label: 'التارغت', group: 'أداء' },
  { id: 'commissions', label: 'العمولات', group: 'أداء' },
  { id: 'warehouse_stock', label: 'جرد المستودع', group: 'مستودع' },
  { id: 'warehouse_low', label: 'قابلة للنفاد', group: 'مستودع' },
  { id: 'warehouse_expiry', label: 'تواريخ الصلاحية', group: 'مستودع' },
]

function nameOf(
  list: Array<{ id: string; name: string }>,
  id: string | null | undefined,
): string {
  if (!id) return '—'
  return list.find((x) => x.id === id)?.name ?? id
}

function inFilter(m: SaleRow, f: ReportFilter): boolean {
  if (m.date < f.from || m.date > f.to) return false
  if (f.mainRegionId && m.regionId !== f.mainRegionId) return false
  if (f.repId && m.repId !== f.repId) return false
  if (f.pharmacyId && m.pharmacyId !== f.pharmacyId) return false
  if (f.companyId && m.companyId !== f.companyId) return false
  return true
}

function filterSubtitle(f: ReportFilter): string {
  const bits = [`الفترة: ${f.from} → ${f.to}`]
  if (f.mainRegionId) bits.push(`المنطقة: ${nameOf(REGIONS, f.mainRegionId)}`)
  if (f.repId) bits.push(`المندوب: ${nameOf(REPS, f.repId)}`)
  if (f.pharmacyId) bits.push(`الصيدلية: ${nameOf(PHARMACIES, f.pharmacyId)}`)
  if (f.companyId) bits.push(`الشركة: ${nameOf(COMPANIES, f.companyId)}`)
  return bits.join(' · ')
}

function baseResult(
  typeId: ReportTypeId,
  filter: ReportFilter,
  columns: ReportResult['columns'],
  rows: ReportRow[],
  totals?: ReportResult['totals'],
): ReportResult {
  return {
    typeId,
    title: `تقرير ${reportTypeLabel(typeId)}`,
    subtitle: filterSubtitle(filter),
    generatedAt: new Date().toISOString(),
    columns,
    rows,
    totals,
  }
}

function runSales(filter: ReportFilter): ReportResult {
  const rows = MOVEMENTS.filter((m) => m.type === 'sale' && inFilter(m, filter)).map(
    (m) => ({
      date: m.date,
      pharmacy: nameOf(PHARMACIES, m.pharmacyId),
      rep: nameOf(REPS, m.repId),
      company: nameOf(COMPANIES, m.companyId),
      region: nameOf(REGIONS, m.regionId),
      amount: money(m.amount),
      amountRaw: m.amount,
    }),
  )
  const total = rows.reduce((s, r) => s + Number(r.amountRaw), 0)
  return baseResult(
    'sales',
    filter,
    [
      { key: 'date', label: 'التاريخ' },
      { key: 'pharmacy', label: 'الصيدلية' },
      { key: 'rep', label: 'المندوب' },
      { key: 'company', label: 'الشركة' },
      { key: 'region', label: 'المنطقة' },
      { key: 'amount', label: 'المبلغ' },
    ],
    rows.map(({ amountRaw: _, ...rest }) => rest),
    { 'إجمالي المبيعات': money(total), 'عدد الفواتير': rows.length },
  )
}

function runCollections(filter: ReportFilter): ReportResult {
  const rows = MOVEMENTS.filter(
    (m) => m.type === 'collection' && inFilter(m, filter),
  ).map((m) => ({
    date: m.date,
    pharmacy: nameOf(PHARMACIES, m.pharmacyId),
    rep: nameOf(REPS, m.repId),
    region: nameOf(REGIONS, m.regionId),
    amount: money(m.amount),
    amountRaw: m.amount,
  }))
  const total = rows.reduce((s, r) => s + Number(r.amountRaw), 0)
  return baseResult(
    'collections',
    filter,
    [
      { key: 'date', label: 'التاريخ' },
      { key: 'pharmacy', label: 'الصيدلية' },
      { key: 'rep', label: 'المندوب' },
      { key: 'region', label: 'المنطقة' },
      { key: 'amount', label: 'المبلغ' },
    ],
    rows.map(({ amountRaw: _, ...rest }) => rest),
    { 'إجمالي التحصيل': money(total), 'عدد العمليات': rows.length },
  )
}

function runReceivables(filter: ReportFilter): ReportResult {
  const rows = PHARMACIES.filter((p) => {
    if (filter.mainRegionId && p.regionId !== filter.mainRegionId) return false
    if (filter.pharmacyId && p.id !== filter.pharmacyId) return false
    if (filter.repId && p.repId !== filter.repId) return false
    return p.balance > 0
  }).map((p) => ({
    pharmacy: p.name,
    region: nameOf(REGIONS, p.regionId),
    rep: nameOf(REPS, p.repId),
    balance: money(p.balance),
    balanceRaw: p.balance,
  }))
  const total = rows.reduce((s, r) => s + Number(r.balanceRaw), 0)
  return baseResult(
    'receivables',
    filter,
    [
      { key: 'pharmacy', label: 'الصيدلية' },
      { key: 'region', label: 'المنطقة' },
      { key: 'rep', label: 'المندوب' },
      { key: 'balance', label: 'الرصيد' },
    ],
    rows.map(({ balanceRaw: _, ...rest }) => rest),
    { 'إجمالي الذمم': money(total), 'عدد الصيدليات': rows.length },
  )
}

function runRegions(filter: ReportFilter): ReportResult {
  const sales = MOVEMENTS.filter((m) => m.type === 'sale' && inFilter(m, filter))
  const rows = REGIONS.filter(
    (r) => !filter.mainRegionId || r.id === filter.mainRegionId,
  ).map((r) => {
    const regionSales = sales.filter((m) => m.regionId === r.id)
    const amount = regionSales.reduce((s, m) => s + m.amount, 0)
    return {
      region: r.name,
      invoices: regionSales.length,
      sales: money(amount),
      pharmacies: PHARMACIES.filter((p) => p.regionId === r.id).length,
    }
  })
  return baseResult(
    'regions',
    filter,
    [
      { key: 'region', label: 'المنطقة' },
      { key: 'pharmacies', label: 'الصيدليات' },
      { key: 'invoices', label: 'فواتير البيع' },
      { key: 'sales', label: 'المبيعات' },
    ],
    rows,
  )
}

function runPharmacies(filter: ReportFilter): ReportResult {
  const sales = MOVEMENTS.filter((m) => m.type === 'sale' && inFilter(m, filter))
  const rows = PHARMACIES.filter((p) => {
    if (filter.mainRegionId && p.regionId !== filter.mainRegionId) return false
    if (filter.pharmacyId && p.id !== filter.pharmacyId) return false
    if (filter.repId && p.repId !== filter.repId) return false
    return true
  }).map((p) => {
    const amount = sales
      .filter((m) => m.pharmacyId === p.id)
      .reduce((s, m) => s + m.amount, 0)
    return {
      pharmacy: p.name,
      region: nameOf(REGIONS, p.regionId),
      rep: nameOf(REPS, p.repId),
      sales: money(amount),
      balance: money(p.balance),
    }
  })
  return baseResult(
    'pharmacies',
    filter,
    [
      { key: 'pharmacy', label: 'الصيدلية' },
      { key: 'region', label: 'المنطقة' },
      { key: 'rep', label: 'المندوب' },
      { key: 'sales', label: 'المبيعات' },
      { key: 'balance', label: 'الذمة' },
    ],
    rows,
  )
}

function runReps(filter: ReportFilter): ReportResult {
  const sales = MOVEMENTS.filter((m) => m.type === 'sale' && inFilter(m, filter))
  const collections = MOVEMENTS.filter(
    (m) => m.type === 'collection' && inFilter(m, filter),
  )
  const rows = REPS.filter((r) => {
    if (filter.repId && r.id !== filter.repId) return false
    if (filter.mainRegionId && r.regionId !== filter.mainRegionId) return false
    return true
  }).map((r) => {
    const s = sales.filter((m) => m.repId === r.id).reduce((a, m) => a + m.amount, 0)
    const c = collections
      .filter((m) => m.repId === r.id)
      .reduce((a, m) => a + m.amount, 0)
    return {
      rep: r.name,
      region: nameOf(REGIONS, r.regionId),
      sales: money(s),
      collections: money(c),
      pharmacies: PHARMACIES.filter((p) => p.repId === r.id).length,
    }
  })
  return baseResult(
    'reps',
    filter,
    [
      { key: 'rep', label: 'المندوب' },
      { key: 'region', label: 'المنطقة' },
      { key: 'pharmacies', label: 'الصيدليات' },
      { key: 'sales', label: 'المبيعات' },
      { key: 'collections', label: 'التحصيل' },
    ],
    rows,
  )
}

function runEvaluation(filter: ReportFilter): ReportResult {
  const rows = EVALS.filter((e) => !filter.repId || e.repId === filter.repId).map(
    (e) => ({
      rep: nameOf(REPS, e.repId),
      percent: `${e.percent}%`,
      grade: e.grade,
      region: nameOf(REGIONS, REPS.find((r) => r.id === e.repId)?.regionId),
    }),
  )
  return baseResult(
    'evaluation',
    filter,
    [
      { key: 'rep', label: 'المندوب' },
      { key: 'region', label: 'المنطقة' },
      { key: 'percent', label: 'النسبة' },
      { key: 'grade', label: 'التقدير' },
    ],
    rows,
  )
}

function runTargets(filter: ReportFilter): ReportResult {
  const rows = TARGETS.filter((t) => {
    if (filter.repId && t.repId !== filter.repId) return false
    if (filter.companyId && t.companyId !== filter.companyId) return false
    return true
  }).map((t) => ({
    rep: nameOf(REPS, t.repId),
    company: nameOf(COMPANIES, t.companyId),
    target: money(t.target),
    achieved: money(t.achieved),
    percent: `${Math.round((t.achieved / t.target) * 100)}%`,
  }))
  return baseResult(
    'targets',
    filter,
    [
      { key: 'rep', label: 'المندوب' },
      { key: 'company', label: 'الشركة' },
      { key: 'target', label: 'التارغت' },
      { key: 'achieved', label: 'المحقق' },
      { key: 'percent', label: 'الإنجاز' },
    ],
    rows,
  )
}

function runCommissions(filter: ReportFilter): ReportResult {
  const rows = COMMISSIONS.filter((c) => {
    if (filter.repId && c.repId !== filter.repId) return false
    if (filter.companyId && c.companyId !== filter.companyId) return false
    return true
  }).map((c) => {
    const value = Math.round((c.base * c.percent) / 100)
    return {
      rep: nameOf(REPS, c.repId),
      company: nameOf(COMPANIES, c.companyId),
      percent: `${c.percent}%`,
      base: money(c.base),
      commission: money(value),
      valueRaw: value,
    }
  })
  const total = rows.reduce((s, r) => s + Number(r.valueRaw), 0)
  return baseResult(
    'commissions',
    filter,
    [
      { key: 'rep', label: 'المندوب' },
      { key: 'company', label: 'الشركة' },
      { key: 'percent', label: 'النسبة' },
      { key: 'base', label: 'الأساس' },
      { key: 'commission', label: 'العمولة' },
    ],
    rows.map(({ valueRaw: _, ...rest }) => rest),
    { 'إجمالي العمولات': money(total) },
  )
}

function runWarehouse(
  typeId: 'warehouse_stock' | 'warehouse_low' | 'warehouse_expiry',
  filter: ReportFilter,
): ReportResult {
  let items = STOCK.filter((s) => {
    if (filter.companyId && s.companyId !== filter.companyId) return false
    return true
  })
  if (typeId === 'warehouse_low') {
    items = items.filter((s) => s.qty < 100)
  }
  if (typeId === 'warehouse_expiry') {
    items = items.filter((s) => s.expiry <= '2026-12-31')
  }
  const rows = items.map((s) => ({
    product: s.name,
    company: nameOf(COMPANIES, s.companyId),
    qty: s.qty,
    expiry: s.expiry,
    status: s.status,
  }))
  return baseResult(
    typeId,
    filter,
    [
      { key: 'product', label: 'الصنف' },
      { key: 'company', label: 'الشركة' },
      { key: 'qty', label: 'الكمية' },
      { key: 'expiry', label: 'الصلاحية' },
      { key: 'status', label: 'الحالة' },
    ],
    rows,
    { 'عدد الأصناف': rows.length },
  )
}

function runReportByType(typeId: ReportTypeId, filter: ReportFilter): ReportResult {
  switch (typeId) {
    case 'sales':
      return runSales(filter)
    case 'collections':
      return runCollections(filter)
    case 'receivables':
      return runReceivables(filter)
    case 'regions':
      return runRegions(filter)
    case 'pharmacies':
      return runPharmacies(filter)
    case 'reps':
      return runReps(filter)
    case 'evaluation':
      return runEvaluation(filter)
    case 'targets':
      return runTargets(filter)
    case 'commissions':
      return runCommissions(filter)
    case 'warehouse_stock':
    case 'warehouse_low':
    case 'warehouse_expiry':
      return runWarehouse(typeId, filter)
  }
}

export const reportsMockDatasource: ReportsDatasource = {
  async getBoard() {
    return {
      filter: defaultReportFilter(),
      reportTypes: REPORT_TYPES,
      regionOptions: REGIONS,
      repOptions: REPS.map(({ id, name }) => ({ id, name })),
      pharmacyOptions: PHARMACIES.map(({ id, name }) => ({ id, name })),
      companyOptions: COMPANIES,
    }
  },

  async runReport(input: RunReportInput) {
    return runReportByType(input.typeId, input.filter)
  },
}
