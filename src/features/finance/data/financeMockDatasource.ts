import type {
  FinanceBoard,
  FinanceDashboardData,
  FinanceFilter,
  FinancePharmacyOption,
  FinanceRegionOption,
  FinanceRepOption,
  FinancialAdjustmentInput,
  FinancialMovement,
  PharmacyFinanceRow,
  RepFinanceRow,
} from '../domain/financeEntities'
import {
  defaultFinanceFilter,
  isDebtor,
  validateFinanceFilter,
} from '../domain/financeLabels'
import type { FinanceDatasource } from './financeDatasource'

const REGIONS: FinanceRegionOption[] = [
  {
    id: 'mr1',
    name: 'دمشق',
    subRegions: [
      { id: 'sr1', name: 'المزة' },
      { id: 'sr2', name: 'كفرسوسة' },
      { id: 'sr3', name: 'المالكي' },
    ],
  },
  {
    id: 'mr2',
    name: 'حلب',
    subRegions: [
      { id: 'sr4', name: 'العزيزية' },
      { id: 'sr5', name: 'الجميلية' },
    ],
  },
]

const REPS: FinanceRepOption[] = [
  { id: 'r1', name: 'ياسين العمودي' },
  { id: 'r2', name: 'محمد الشهري' },
  { id: 'r3', name: 'سامر الحسن' },
]

let pharmacies: FinancePharmacyOption[] = [
  {
    id: 'ph1',
    name: 'صيدلية النور',
    mainRegionId: 'mr1',
    subRegionId: 'sr1',
    address: 'المزة، شارع الجلاء',
    currentBalance: 55000,
    repNames: ['ياسين العمودي'],
  },
  {
    id: 'ph2',
    name: 'صيدلية الحياة',
    mainRegionId: 'mr1',
    subRegionId: 'sr3',
    address: 'المالكي، ساحة الروضة',
    currentBalance: 0,
    repNames: ['ياسين العمودي'],
  },
  {
    id: 'ph3',
    name: 'صيدلية الرازي',
    mainRegionId: 'mr1',
    subRegionId: 'sr2',
    address: 'كفرسوسة، شارع الزهور',
    currentBalance: 120000,
    repNames: ['ياسين العمودي', 'سامر الحسن'],
  },
  {
    id: 'ph4',
    name: 'صيدلية العزيزية',
    mainRegionId: 'mr2',
    subRegionId: 'sr4',
    address: 'العزيزية، شارع النيل',
    currentBalance: 88000,
    repNames: ['محمد الشهري'],
  },
  {
    id: 'ph5',
    name: 'صيدلية الجميلية',
    mainRegionId: 'mr2',
    subRegionId: 'sr5',
    address: 'الجميلية، سوق الذهب',
    currentBalance: 0,
    repNames: ['محمد الشهري'],
  },
]

type SeedMove = Omit<FinancialMovement, 'balanceAfter'> & {
  balanceAfter?: number
}

/** حركات خام (بدون رصيد سابق محسوب) */
let seedMoves: SeedMove[] = [
  {
    id: 'INV-101',
    type: 'invoice',
    referenceNumber: 'INV-2026-0101',
    pharmacyId: 'ph1',
    pharmacyName: 'صيدلية النور',
    repId: 'r1',
    repName: 'ياسين العمودي',
    date: '2026-08-10',
    debit: 45000,
    credit: 0,
  },
  {
    id: 'COL-40',
    type: 'collection',
    referenceNumber: 'COL-0040',
    pharmacyId: 'ph1',
    pharmacyName: 'صيدلية النور',
    repId: 'r1',
    repName: 'ياسين العمودي',
    date: '2026-08-12',
    debit: 0,
    credit: 20000,
  },
  {
    id: 'INV-102',
    type: 'invoice',
    referenceNumber: 'INV-2026-0102',
    pharmacyId: 'ph1',
    pharmacyName: 'صيدلية النور',
    repId: 'r1',
    repName: 'ياسين العمودي',
    date: '2026-08-15',
    debit: 30000,
    credit: 0,
  },
  {
    id: 'INV-110',
    type: 'invoice',
    referenceNumber: 'INV-2026-0110',
    pharmacyId: 'ph2',
    pharmacyName: 'صيدلية الحياة',
    repId: 'r1',
    repName: 'ياسين العمودي',
    date: '2026-08-08',
    debit: 25000,
    credit: 0,
  },
  {
    id: 'COL-41',
    type: 'collection',
    referenceNumber: 'COL-0041',
    pharmacyId: 'ph2',
    pharmacyName: 'صيدلية الحياة',
    repId: 'r1',
    repName: 'ياسين العمودي',
    date: '2026-08-14',
    debit: 0,
    credit: 25000,
  },
  {
    id: 'INV-120',
    type: 'invoice',
    referenceNumber: 'INV-2026-0120',
    pharmacyId: 'ph3',
    pharmacyName: 'صيدلية الرازي',
    repId: 'r1',
    repName: 'ياسين العمودي',
    date: '2026-08-11',
    debit: 80000,
    credit: 0,
  },
  {
    id: 'RET-5',
    type: 'return_voucher',
    referenceNumber: 'RET-0005',
    pharmacyId: 'ph3',
    pharmacyName: 'صيدلية الرازي',
    repId: 'r1',
    repName: 'ياسين العمودي',
    date: '2026-08-13',
    debit: 0,
    credit: 10000,
  },
  {
    id: 'COL-42',
    type: 'collection',
    referenceNumber: 'COL-0042',
    pharmacyId: 'ph3',
    pharmacyName: 'صيدلية الرازي',
    repId: 'r3',
    repName: 'سامر الحسن',
    date: '2026-08-16',
    debit: 0,
    credit: 15000,
  },
  {
    id: 'INV-200',
    type: 'invoice',
    referenceNumber: 'INV-2026-0200',
    pharmacyId: 'ph4',
    pharmacyName: 'صيدلية العزيزية',
    repId: 'r2',
    repName: 'محمد الشهري',
    date: '2026-08-09',
    debit: 100000,
    credit: 0,
  },
  {
    id: 'COL-50',
    type: 'collection',
    referenceNumber: 'COL-0050',
    pharmacyId: 'ph4',
    pharmacyName: 'صيدلية العزيزية',
    repId: 'r2',
    repName: 'محمد الشهري',
    date: '2026-08-16',
    debit: 0,
    credit: 12000,
  },
  {
    id: 'INV-210',
    type: 'invoice',
    referenceNumber: 'INV-2026-0210',
    pharmacyId: 'ph5',
    pharmacyName: 'صيدلية الجميلية',
    repId: 'r2',
    repName: 'محمد الشهري',
    date: '2026-08-07',
    debit: 40000,
    credit: 0,
  },
  {
    id: 'COL-51',
    type: 'collection',
    referenceNumber: 'COL-0051',
    pharmacyId: 'ph5',
    pharmacyName: 'صيدلية الجميلية',
    repId: 'r2',
    repName: 'محمد الشهري',
    date: '2026-08-15',
    debit: 0,
    credit: 40000,
  },
]

let adjCounter = 1

function regionLabel(mainId: string, subId: string): string {
  const main = REGIONS.find((r) => r.id === mainId)
  const sub = main?.subRegions.find((s) => s.id === subId)
  return `${main?.name ?? '—'} — ${sub?.name ?? '—'}`
}

function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to
}

function buildDashboard(filter: FinanceFilter): FinanceDashboardData {
  validateFinanceFilter(filter)

  let selected = pharmacies.filter((p) => {
    if (filter.mainRegionId && p.mainRegionId !== filter.mainRegionId)
      return false
    if (filter.subRegionId && p.subRegionId !== filter.subRegionId) return false
    if (filter.pharmacyId && p.id !== filter.pharmacyId) return false
    return true
  })

  let allRaw = seedMoves.filter((m) =>
    selected.some((p) => p.id === m.pharmacyId),
  )
  if (filter.repId) {
    allRaw = allRaw.filter((m) => m.repId === filter.repId)
    const ids = new Set(allRaw.map((m) => m.pharmacyId))
    selected = selected.filter((p) => ids.has(p.id))
  }

  const periodRaw = allRaw.filter((m) => inRange(m.date, filter.from, filter.to))

  const pharmacyRows: PharmacyFinanceRow[] = selected.map((pharmacy) => {
    const events = periodRaw.filter((m) => m.pharmacyId === pharmacy.id)
    const ledger = allRaw.filter((m) => m.pharmacyId === pharmacy.id)
    const sales = events
      .filter((m) => m.type === 'invoice')
      .reduce((s, m) => s + m.debit, 0)
    const collections = events
      .filter((m) => m.type === 'collection')
      .reduce((s, m) => s + m.credit, 0)
    const returns = events
      .filter((m) => m.type === 'return_voucher')
      .reduce((s, m) => s + m.credit, 0)
    const adjustments = events
      .filter(
        (m) =>
          m.type === 'debit_adjustment' || m.type === 'credit_adjustment',
      )
      .reduce((s, m) => s + m.debit - m.credit, 0)

    const invoices = events.filter((m) => m.type === 'invoice')
    const paid = events.filter((m) => m.type === 'collection')
    const returned = events.filter((m) => m.type === 'return_voucher')

    const currentBalance = filter.repId
      ? ledger.reduce((s, m) => s + m.debit - m.credit, 0)
      : pharmacy.currentBalance

    const repNames = filter.repId
      ? [
          ...new Set(
            ledger
              .map((m) => m.repName)
              .filter((n): n is string => Boolean(n?.trim())),
          ),
        ]
      : pharmacy.repNames

    return {
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      regionLabel: regionLabel(pharmacy.mainRegionId, pharmacy.subRegionId),
      address: pharmacy.address,
      repNames,
      sales,
      collections,
      returns,
      adjustments,
      currentBalance,
      invoiceCount: invoices.length,
      collectionCount: paid.length,
      returnCount: returned.length,
      lastInvoiceAt: invoices.map((m) => m.date).sort().at(-1),
      lastCollectionAt: paid.map((m) => m.date).sort().at(-1),
      lastReturnAt: returned.map((m) => m.date).sort().at(-1),
    }
  })

  const movements: FinancialMovement[] = []
  for (const pharmacy of selected) {
    const ledger = allRaw
      .filter((m) => m.pharmacyId === pharmacy.id)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

    const before = ledger.filter((m) => m.date < filter.from)
    let opening = before.reduce((s, m) => s + m.debit - m.credit, 0)
    if (!filter.repId) {
      const periodDelta = ledger
        .filter((m) => m.date >= filter.from)
        .reduce((s, m) => s + m.debit - m.credit, 0)
      opening = pharmacy.currentBalance - periodDelta
    }

    let running = opening
    if (opening !== 0 || ledger.some((m) => inRange(m.date, filter.from, filter.to))) {
      movements.push({
        id: `OPEN-${pharmacy.id}-${filter.from}`,
        type: 'opening_balance',
        referenceNumber: '—',
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        date: filter.from,
        debit: opening > 0 ? opening : 0,
        credit: opening < 0 ? Math.abs(opening) : 0,
        balanceAfter: opening,
        address: pharmacy.address,
      })
    }

    for (const m of ledger) {
      if (!inRange(m.date, filter.from, filter.to)) continue
      running += m.debit - m.credit
      movements.push({
        ...m,
        balanceAfter: running,
        address: pharmacy.address,
      })
    }
  }

  movements.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.pharmacyName.localeCompare(b.pharmacyName, 'ar'),
  )

  const repMap = new Map<string, RepFinanceRow>()
  for (const m of periodRaw) {
    if (!m.repId || !m.repName) continue
    const prev = repMap.get(m.repId) ?? {
      repId: m.repId,
      repName: m.repName,
      sales: 0,
      collections: 0,
      returns: 0,
      debts: 0,
      pharmacyCount: 0,
    }
    if (m.type === 'invoice') prev.sales += m.debit
    if (m.type === 'collection') prev.collections += m.credit
    if (m.type === 'return_voucher') prev.returns += m.credit
    repMap.set(m.repId, prev)
  }
  for (const row of repMap.values()) {
    const phIds = new Set(
      periodRaw.filter((m) => m.repId === row.repId).map((m) => m.pharmacyId),
    )
    row.pharmacyCount = phIds.size
    row.debts = pharmacyRows
      .filter((p) => phIds.has(p.pharmacyId) && isDebtor(p.currentBalance))
      .reduce((s, p) => s + p.currentBalance, 0)
  }

  const debtorPharmacies = pharmacyRows.filter((p) =>
    isDebtor(p.currentBalance),
  ).length

  return {
    summary: {
      salesTotal: pharmacyRows.reduce((s, p) => s + p.sales, 0),
      collectionsTotal: pharmacyRows.reduce((s, p) => s + p.collections, 0),
      returnsTotal: pharmacyRows.reduce((s, p) => s + p.returns, 0),
      debtsTotal: pharmacyRows
        .filter((p) => isDebtor(p.currentBalance))
        .reduce((s, p) => s + p.currentBalance, 0),
      debtorPharmacies,
      settledPharmacies: pharmacyRows.length - debtorPharmacies,
      invoiceCount: pharmacyRows.reduce((s, p) => s + p.invoiceCount, 0),
      collectionCount: pharmacyRows.reduce((s, p) => s + p.collectionCount, 0),
      returnCount: pharmacyRows.reduce((s, p) => s + p.returnCount, 0),
    },
    pharmacies: pharmacyRows,
    reps: [...repMap.values()].sort((a, b) =>
      a.repName.localeCompare(b.repName, 'ar'),
    ),
    movements,
  }
}

function board(filter: FinanceFilter): FinanceBoard {
  return {
    regions: REGIONS.map((r) => ({
      ...r,
      subRegions: r.subRegions.map((s) => ({ ...s })),
    })),
    pharmacies: pharmacies.map((p) => ({ ...p, repNames: [...p.repNames] })),
    reps: REPS.map((r) => ({ ...r })),
    filter: { ...filter },
    dashboard: buildDashboard(filter),
  }
}

export const financeMockDatasource: FinanceDatasource = {
  async getBoard(filter = defaultFinanceFilter()) {
    return board(filter)
  },

  async createAdjustment(input: FinancialAdjustmentInput) {
    const reason = input.reason.trim()
    if (!reason) throw new Error('سبب التعديل مطلوب')
    if (!Number.isFinite(input.amount) || input.amount === 0) {
      throw new Error('أدخل مبلغاً صالحاً (أي رقم غير صفر يحدده المشرف)')
    }
    const amount = Math.abs(input.amount)
    const pharmacy = pharmacies.find((p) => p.id === input.pharmacyId)
    if (!pharmacy) throw new Error('الصيدلية غير موجودة')

    const id = `ADJ-${adjCounter++}`
    const today = new Date().toISOString().slice(0, 10)
    const debit = input.type === 'debit' ? amount : 0
    const credit = input.type === 'credit' ? amount : 0
    pharmacy.currentBalance += debit - credit
    const region = REGIONS.find((r) => r.id === pharmacy.mainRegionId)
    const sub = region?.subRegions.find((s) => s.id === pharmacy.subRegionId)
    seedMoves.push({
      id,
      type: input.type === 'debit' ? 'debit_adjustment' : 'credit_adjustment',
      referenceNumber: id,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      date: today,
      debit,
      credit,
      address: pharmacy.address,
      notes: `${reason} · موقع الصيدلية: ${region?.name ?? ''} — ${sub?.name ?? ''} · ${pharmacy.address} · يُشعر المندوب والمفوتر`,
      repId: pharmacy.repNames[0] ? REPS.find((r) => r.name === pharmacy.repNames[0])?.id : undefined,
      repName: pharmacy.repNames[0],
    })
  },
}
