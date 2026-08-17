/**
 * Mock — تقييم من فواتير البيع + فلترة منطقة رئيسية/فرعية ↔ مندوب
 */
import {
  computeBreakdown,
  totalPointsFromBreakdown,
  type CompanyTargetSeed,
  type PharmacySeed,
  type ReturnSeed,
  type SaleInvoiceSeed,
} from '../domain/computeEvaluation'
import type {
  EvaluationBoard,
  EvaluationFilter,
  EvalRepOption,
  SupervisorReview,
} from '../domain/evaluationEntities'
import {
  defaultEvalDates,
  gradeFromPercent,
} from '../domain/evaluationLabels'
import type { EvaluationDatasource } from './evaluationDatasource'

const MAIN_REGIONS = [
  { id: 'mr1', name: 'دمشق' },
  { id: 'mr2', name: 'حلب' },
]

const SUB_REGIONS = [
  { id: 'sr1', mainRegionId: 'mr1', name: 'المزة' },
  { id: 'sr2', mainRegionId: 'mr1', name: 'كفرسوسة' },
  { id: 'sr3', mainRegionId: 'mr1', name: 'المالكي' },
  { id: 'sr4', mainRegionId: 'mr1', name: 'أبو رمانة' },
  { id: 'sr5', mainRegionId: 'mr2', name: 'العزيزية' },
  { id: 'sr6', mainRegionId: 'mr2', name: 'صلاح الدين' },
  { id: 'sr7', mainRegionId: 'mr2', name: 'الجميلية' },
]

const REPS: EvalRepOption[] = [
  {
    id: 'r1',
    name: 'ياسين العمودي',
    mainRegionIds: ['mr1'],
    subRegionIds: ['sr1', 'sr2', 'sr3', 'sr4'],
  },
  {
    id: 'r3',
    name: 'سامر الحسن',
    mainRegionIds: ['mr1'],
    subRegionIds: ['sr2', 'sr3'],
  },
  {
    id: 'r2',
    name: 'محمد الشهري',
    mainRegionIds: ['mr2'],
    subRegionIds: ['sr5', 'sr6', 'sr7'],
  },
]

const PHARMACIES: PharmacySeed[] = [
  { id: 'ph1', name: 'صيدلية النور', mainRegionId: 'mr1', subRegionId: 'sr1', regionLabel: 'دمشق — المزة' },
  { id: 'ph2', name: 'صيدلية الحياة', mainRegionId: 'mr1', subRegionId: 'sr3', regionLabel: 'دمشق — المالكي' },
  { id: 'ph3', name: 'صيدلية الرازي', mainRegionId: 'mr1', subRegionId: 'sr2', regionLabel: 'دمشق — كفرسوسة' },
  { id: 'ph4', name: 'صيدلية الياسمين', mainRegionId: 'mr1', subRegionId: 'sr1', regionLabel: 'دمشق — المزة' },
  { id: 'ph5', name: 'صيدلية الأمل', mainRegionId: 'mr1', subRegionId: 'sr4', regionLabel: 'دمشق — أبو رمانة' },
  { id: 'ph6', name: 'صيدلية الشام', mainRegionId: 'mr1', subRegionId: 'sr2', regionLabel: 'دمشق — كفرسوسة' },
  { id: 'ph10', name: 'صيدلية العزيزية', mainRegionId: 'mr2', subRegionId: 'sr5', regionLabel: 'حلب — العزيزية' },
  { id: 'ph11', name: 'صيدلية صلاح الدين', mainRegionId: 'mr2', subRegionId: 'sr6', regionLabel: 'حلب — صلاح الدين' },
  { id: 'ph12', name: 'صيدلية الجميلية', mainRegionId: 'mr2', subRegionId: 'sr7', regionLabel: 'حلب — الجميلية' },
]

const INVOICES: SaleInvoiceSeed[] = [
  { id: 'INV-1', invoiceNumber: 'INV-2026-0101', repId: 'r1', pharmacyId: 'ph1', pharmacyName: 'صيدلية النور', mainRegionId: 'mr1', subRegionId: 'sr1', regionLabel: 'دمشق — المزة', companyId: 'c1', companyName: 'دمشق فارما', amount: 4200000, date: '2026-08-05' },
  { id: 'INV-2', invoiceNumber: 'INV-2026-0102', repId: 'r1', pharmacyId: 'ph1', pharmacyName: 'صيدلية النور', mainRegionId: 'mr1', subRegionId: 'sr1', regionLabel: 'دمشق — المزة', companyId: 'c1', companyName: 'دمشق فارما', amount: 1800000, date: '2026-08-12' },
  { id: 'INV-3', invoiceNumber: 'INV-2026-0103', repId: 'r1', pharmacyId: 'ph2', pharmacyName: 'صيدلية الحياة', mainRegionId: 'mr1', subRegionId: 'sr3', regionLabel: 'دمشق — المالكي', companyId: 'c2', companyName: 'ابن سينا', amount: 3500000, date: '2026-08-07' },
  { id: 'INV-4', invoiceNumber: 'INV-2026-0104', repId: 'r1', pharmacyId: 'ph3', pharmacyName: 'صيدلية الرازي', mainRegionId: 'mr1', subRegionId: 'sr2', regionLabel: 'دمشق — كفرسوسة', companyId: 'c1', companyName: 'دمشق فارما', amount: 5100000, date: '2026-08-09' },
  { id: 'INV-5', invoiceNumber: 'INV-2026-0105', repId: 'r1', pharmacyId: 'ph3', pharmacyName: 'صيدلية الرازي', mainRegionId: 'mr1', subRegionId: 'sr2', regionLabel: 'دمشق — كفرسوسة', companyId: 'c2', companyName: 'ابن سينا', amount: 2200000, date: '2026-08-14' },
  { id: 'INV-6', invoiceNumber: 'INV-2026-0106', repId: 'r1', pharmacyId: 'ph4', pharmacyName: 'صيدلية الياسمين', mainRegionId: 'mr1', subRegionId: 'sr1', regionLabel: 'دمشق — المزة', companyId: 'c1', companyName: 'دمشق فارما', amount: 2700000, date: '2026-08-11' },
  { id: 'INV-7', invoiceNumber: 'INV-2026-0107', repId: 'r1', pharmacyId: 'ph5', pharmacyName: 'صيدلية الأمل', mainRegionId: 'mr1', subRegionId: 'sr4', regionLabel: 'دمشق — أبو رمانة', companyId: 'c2', companyName: 'ابن سينا', amount: 1500000, date: '2026-08-15' },
  { id: 'INV-8', invoiceNumber: 'INV-2026-0200', repId: 'r2', pharmacyId: 'ph10', pharmacyName: 'صيدلية العزيزية', mainRegionId: 'mr2', subRegionId: 'sr5', regionLabel: 'حلب — العزيزية', companyId: 'c3', companyName: 'حلب ميديكال', amount: 6200000, date: '2026-08-06' },
  { id: 'INV-9', invoiceNumber: 'INV-2026-0201', repId: 'r2', pharmacyId: 'ph10', pharmacyName: 'صيدلية العزيزية', mainRegionId: 'mr2', subRegionId: 'sr5', regionLabel: 'حلب — العزيزية', companyId: 'c3', companyName: 'حلب ميديكال', amount: 2800000, date: '2026-08-13' },
  { id: 'INV-10', invoiceNumber: 'INV-2026-0202', repId: 'r2', pharmacyId: 'ph11', pharmacyName: 'صيدلية صلاح الدين', mainRegionId: 'mr2', subRegionId: 'sr6', regionLabel: 'حلب — صلاح الدين', companyId: 'c2', companyName: 'ابن سينا', amount: 3100000, date: '2026-08-10' },
  { id: 'INV-11', invoiceNumber: 'INV-2026-0203', repId: 'r2', pharmacyId: 'ph12', pharmacyName: 'صيدلية الجميلية', mainRegionId: 'mr2', subRegionId: 'sr7', regionLabel: 'حلب — الجميلية', companyId: 'c3', companyName: 'حلب ميديكال', amount: 1900000, date: '2026-08-16' },
  { id: 'INV-12', invoiceNumber: 'INV-2026-0112', repId: 'r3', pharmacyId: 'ph3', pharmacyName: 'صيدلية الرازي', mainRegionId: 'mr1', subRegionId: 'sr2', regionLabel: 'دمشق — كفرسوسة', companyId: 'c1', companyName: 'دمشق فارما', amount: 2400000, date: '2026-08-10' },
  { id: 'INV-13', invoiceNumber: 'INV-2026-0113', repId: 'r3', pharmacyId: 'ph2', pharmacyName: 'صيدلية الحياة', mainRegionId: 'mr1', subRegionId: 'sr3', regionLabel: 'دمشق — المالكي', companyId: 'c2', companyName: 'ابن سينا', amount: 1800000, date: '2026-08-12' },
]

const RETURNS: ReturnSeed[] = [
  {
    repId: 'r1',
    pharmacyId: 'ph3',
    companyId: 'c1',
    amount: 400000,
    date: '2026-08-13',
    mainRegionId: 'mr1',
    subRegionId: 'sr2',
  },
]

const TARGETS: CompanyTargetSeed[] = [
  { companyId: 'c1', companyName: 'دمشق فارما', targetAmount: 15000000, repId: 'r1' },
  { companyId: 'c2', companyName: 'ابن سينا', targetAmount: 8000000, repId: 'r1' },
  { companyId: 'c3', companyName: 'حلب ميديكال', targetAmount: 12000000, repId: 'r2' },
  { companyId: 'c2', companyName: 'ابن سينا', targetAmount: 5000000, repId: 'r2' },
  { companyId: 'c1', companyName: 'دمشق فارما', targetAmount: 6000000, repId: 'r3' },
  { companyId: 'c2', companyName: 'ابن سينا', targetAmount: 4000000, repId: 'r3' },
]

const reviews = new Map<string, SupervisorReview>()

function reviewKey(f: EvaluationFilter): string {
  return `${f.repId}|${f.from}|${f.to}|${f.mainRegionId ?? 'all'}|${f.subRegionId ?? 'all'}`
}

function inGeoScope(
  mainRegionId: string,
  subRegionId: string,
  filter: EvaluationFilter,
): boolean {
  if (filter.subRegionId) return subRegionId === filter.subRegionId
  if (filter.mainRegionId) return mainRegionId === filter.mainRegionId
  return true
}

function resolveOptions(filter: EvaluationFilter): {
  filter: EvaluationFilter
  mainRegionOptions: { id: string; name: string }[]
  subRegionOptions: { id: string; name: string }[]
  repOptions: EvalRepOption[]
} {
  const dates = defaultEvalDates()
  let mainRegionId = filter.mainRegionId
  let subRegionId = filter.subRegionId
  let repId = filter.repId || REPS[0]!.id

  // المناديب حسب المنطقة المختارة
  let repOptions = REPS.filter((r) => {
    if (subRegionId) return r.subRegionIds.includes(subRegionId)
    if (mainRegionId) return r.mainRegionIds.includes(mainRegionId)
    return true
  })

  if (!repOptions.some((r) => r.id === repId)) {
    repId = repOptions[0]?.id ?? REPS[0]!.id
  }

  const activeRep = REPS.find((r) => r.id === repId) ?? REPS[0]!

  // الفرعية: ضمن الرئيسية إن وُجدت + ضمن مناطق المندوب
  let subRegionOptions = SUB_REGIONS.filter((s) => {
    if (mainRegionId && s.mainRegionId !== mainRegionId) return false
    if (!mainRegionId && !activeRep.subRegionIds.includes(s.id)) return false
    if (mainRegionId && !activeRep.subRegionIds.includes(s.id)) return false
    return true
  }).map((s) => ({ id: s.id, name: s.name }))

  // إن لم تُختر رئيسية بعد: اعرض فرعيات المندوب كلها
  if (!mainRegionId) {
    subRegionOptions = SUB_REGIONS.filter((s) =>
      activeRep.subRegionIds.includes(s.id),
    ).map((s) => ({ id: s.id, name: s.name }))
  }

  if (subRegionId && !subRegionOptions.some((s) => s.id === subRegionId)) {
    subRegionId = null
  }

  // إذا اختيرت فرعية بدون رئيسية — عبّئ الرئيسية تلقائياً
  if (subRegionId && !mainRegionId) {
    mainRegionId =
      SUB_REGIONS.find((s) => s.id === subRegionId)?.mainRegionId ?? null
  }

  // أعد تصفية المناديب بعد تصحيح الفرعية/الرئيسية
  repOptions = REPS.filter((r) => {
    if (subRegionId) return r.subRegionIds.includes(subRegionId)
    if (mainRegionId) return r.mainRegionIds.includes(mainRegionId)
    return true
  })
  if (!repOptions.some((r) => r.id === repId)) {
    repId = repOptions[0]?.id ?? activeRep.id
  }

  const mainRegionOptions = MAIN_REGIONS.map((m) => ({
    id: m.id,
    name: m.name,
  }))

  return {
    filter: {
      repId,
      from: filter.from || dates.from,
      to: filter.to || dates.to,
      mainRegionId,
      subRegionId,
    },
    mainRegionOptions,
    subRegionOptions,
    repOptions: repOptions.map((r) => ({ ...r })),
  }
}

function regionLabelFor(filter: EvaluationFilter): string {
  if (filter.subRegionId) {
    const sub = SUB_REGIONS.find((s) => s.id === filter.subRegionId)
    const main = MAIN_REGIONS.find((m) => m.id === sub?.mainRegionId)
    return `${main?.name ?? ''} — ${sub?.name ?? 'فرعية'}`
  }
  if (filter.mainRegionId) {
    const main = MAIN_REGIONS.find((m) => m.id === filter.mainRegionId)
    return `${main?.name ?? 'رئيسية'} — كل الفرعية`
  }
  return 'كل المناطق'
}

function buildCard(filter: EvaluationFilter) {
  const rep = REPS.find((r) => r.id === filter.repId)
  if (!rep) return null

  const invoices = INVOICES.filter((i) => {
    if (i.repId !== filter.repId) return false
    if (i.date < filter.from || i.date > filter.to) return false
    return inGeoScope(i.mainRegionId, i.subRegionId, filter)
  })

  const returns = RETURNS.filter((r) => {
    if (r.repId !== filter.repId) return false
    if (r.date < filter.from || r.date > filter.to) return false
    return inGeoScope(r.mainRegionId, r.subRegionId, filter)
  })

  const targets = TARGETS.filter((t) => t.repId === filter.repId)
  const pharmaciesInScope = PHARMACIES.filter((p) =>
    inGeoScope(p.mainRegionId, p.subRegionId, filter),
  )

  const breakdown = computeBreakdown({
    invoices,
    returns,
    targets,
    pharmaciesInScope,
  })
  const totalPoints = totalPointsFromBreakdown(breakdown)

  return {
    repId: rep.id,
    repName: rep.name,
    regionLabel: regionLabelFor(filter),
    from: filter.from,
    to: filter.to,
    totalPoints,
    totalPercent: totalPoints,
    autoGrade: gradeFromPercent(totalPoints),
    breakdown,
    supervisorReview: reviews.get(reviewKey(filter)) ?? null,
    salesInvoiceCount: invoices.length,
  }
}

export const evaluationMockDatasource: EvaluationDatasource = {
  async getBoard(filter) {
    const resolved = resolveOptions(filter)
    return {
      filter: resolved.filter,
      mainRegionOptions: resolved.mainRegionOptions,
      subRegionOptions: resolved.subRegionOptions,
      repOptions: resolved.repOptions,
      card: buildCard(resolved.filter),
    } satisfies EvaluationBoard
  },

  async sendSupervisorReview(input) {
    const note = input.note.trim()
    if (!note) throw new Error('ملاحظة التقييم مطلوبة قبل الإرسال للمندوب')
    const key = reviewKey({
      repId: input.repId,
      from: input.from,
      to: input.to,
      mainRegionId: input.mainRegionId,
      subRegionId: input.subRegionId,
    })
    reviews.set(key, {
      grade: input.grade,
      note,
      sentAt: new Date().toISOString(),
      sentBy: 'المشرف',
      deliveredToRep: true,
    })
  },
}
