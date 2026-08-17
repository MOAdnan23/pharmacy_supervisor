/**
 * Mock — راتب ثابت + مكافآت للمؤهلين (≥80%) + إشعارات مندوب/مفوتر
 */
import {
  BONUS_ELIGIBILITY_THRESHOLD,
  type BonusRecord,
  type CompensationAuditEntry,
  type CompensationBoard,
  type CompensationNotice,
  type FixedSalaryRecord,
  type RepCompensationRow,
} from '../domain/compensationEntities'
import {
  formatRepRegions,
  requirePositiveAmount,
  requireReason,
  requireStartDate,
  todayIsoDate,
} from '../domain/compensationLabels'
import type { CompensationDatasource } from './compensationDatasource'

const SUPERVISOR_NAME = 'المشرف'

type RepSeed = {
  id: string
  name: string
  mainRegionLabel: string
  subRegionLabels: string[]
  evaluationPercent: number
  evaluationGradeLabel: string
}

const REPS: RepSeed[] = [
  {
    id: 'r1',
    name: 'ياسين العمودي',
    mainRegionLabel: 'دمشق',
    subRegionLabels: ['المزة', 'كفرسوسة', 'المالكي', 'أبو رمانة'],
    evaluationPercent: 86,
    evaluationGradeLabel: 'ممتاز',
  },
  {
    id: 'r2',
    name: 'محمد الشهري',
    mainRegionLabel: 'حلب',
    subRegionLabels: ['العزيزية', 'صلاح الدين', 'الجميلية'],
    evaluationPercent: 72,
    evaluationGradeLabel: 'جيد جداً',
  },
  {
    id: 'r3',
    name: 'سامر الحسن',
    mainRegionLabel: 'دمشق',
    subRegionLabels: ['كفرسوسة', 'المالكي'],
    evaluationPercent: 91,
    evaluationGradeLabel: 'ممتاز جداً',
  },
]

let salaries: FixedSalaryRecord[] = [
  {
    id: 'SAL-1',
    repId: 'r1',
    repName: 'ياسين العمودي',
    amount: 1500000,
    startDate: '2026-01-01',
    status: 'active',
    notes: 'راتب أساسي',
    updatedAt: '2026-01-01T10:00:00',
    createdBy: SUPERVISOR_NAME,
  },
]

let bonuses: BonusRecord[] = [
  {
    id: 'BON-1',
    repId: 'r3',
    repName: 'سامر الحسن',
    amount: 250000,
    reason: 'أداء متميز — تقييم فوق 90%',
    evaluationPercentAtAward: 91,
    awardedAt: '2026-08-10T14:00:00',
    awardedBy: SUPERVISOR_NAME,
    sentToInvoicer: true,
    notifiedRep: true,
  },
]

let auditLog: CompensationAuditEntry[] = [
  {
    id: 'AUD-1',
    at: '2026-08-10T14:00:00',
    type: 'bonus',
    action: 'award',
    repId: 'r3',
    repName: 'سامر الحسن',
    amount: 250000,
    reason: 'أداء متميز — تقييم فوق 90%',
    actorName: SUPERVISOR_NAME,
  },
  {
    id: 'AUD-2',
    at: '2026-01-01T10:00:00',
    type: 'fixed_salary',
    action: 'create',
    repId: 'r1',
    repName: 'ياسين العمودي',
    amount: 1500000,
    actorName: SUPERVISOR_NAME,
    notes: 'راتب أساسي',
  },
]

let notices: CompensationNotice[] = [
  {
    id: 'N-1',
    audience: 'rep',
    repId: 'r3',
    repName: 'سامر الحسن',
    title: 'إضافة مكافأة',
    body: `أضاف ${SUPERVISOR_NAME} مكافأة بقيمة 250,000 ل.س بسبب: أداء متميز — تقييم فوق 90%.`,
    createdAt: '2026-08-10T14:00:00',
  },
  {
    id: 'N-2',
    audience: 'invoicer',
    repId: 'r3',
    repName: 'سامر الحسن',
    title: 'مكافأة للاحتساب',
    body: 'مكافأة 250,000 ل.س للمندوب سامر الحسن — يُحتسب في كشف الراتب.',
    createdAt: '2026-08-10T14:00:00',
  },
]

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function monthPrefix(): string {
  return todayIsoDate().slice(0, 7)
}

function pushAudit(
  entry: Omit<CompensationAuditEntry, 'id' | 'at' | 'actorName'>,
): void {
  auditLog.unshift({
    id: nextId('AUD'),
    at: nowIso(),
    actorName: SUPERVISOR_NAME,
    ...entry,
  })
}

function pushNotice(n: Omit<CompensationNotice, 'id' | 'createdAt'>): void {
  notices.unshift({
    id: nextId('N'),
    createdAt: nowIso(),
    ...n,
  })
}

function buildRepRows(): RepCompensationRow[] {
  return REPS.map((rep) => {
    const salary = salaries.find(
      (s) => s.repId === rep.id && s.status === 'active',
    )
    const repBonuses = bonuses.filter((b) => b.repId === rep.id)
    const last = [...repBonuses].sort((a, b) =>
      b.awardedAt.localeCompare(a.awardedAt),
    )[0]
    return {
      repId: rep.id,
      repName: rep.name,
      mainRegionLabel: rep.mainRegionLabel,
      subRegionLabels: [...rep.subRegionLabels],
      regionLabel: formatRepRegions(rep.mainRegionLabel, rep.subRegionLabels),
      evaluationPercent: rep.evaluationPercent,
      evaluationGradeLabel: rep.evaluationGradeLabel,
      fixedSalary: salary?.amount ?? null,
      salaryStartDate: salary?.startDate ?? null,
      salaryStatus: salary?.status ?? null,
      lastBonusAmount: last?.amount ?? null,
      lastBonusAt: last?.awardedAt ?? null,
      bonusesCount: repBonuses.length,
      eligibleForBonus: rep.evaluationPercent >= BONUS_ELIGIBILITY_THRESHOLD,
    }
  })
}

function buildBoard(): CompensationBoard {
  const reps = buildRepRows()
  const bonusesThisMonth = bonuses.filter((b) =>
    b.awardedAt.startsWith(monthPrefix()),
  ).length
  return {
    summary: {
      repsCount: reps.length,
      withFixedSalary: reps.filter((r) => r.fixedSalary != null).length,
      eligibleForBonus: reps.filter((r) => r.eligibleForBonus).length,
      bonusesThisMonth,
    },
    reps,
    auditLog: auditLog.map((a) => ({ ...a })),
    recentNotices: notices.slice(0, 12).map((n) => ({ ...n })),
  }
}

export const compensationMockDatasource: CompensationDatasource = {
  async getBoard() {
    return buildBoard()
  },

  async upsertFixedSalary(input) {
    const amount = requirePositiveAmount(input.amount, 'قيمة الراتب')
    const startDate = requireStartDate(input.startDate)
    if (input.endDate && input.endDate < startDate) {
      throw new Error('تاريخ النهاية يجب أن يكون بعد البداية')
    }
    const rep = REPS.find((r) => r.id === input.repId)
    if (!rep) throw new Error('المندوب غير موجود')

    const existing = salaries.find((s) => s.repId === input.repId)
    const isUpdate = Boolean(existing)

    if (existing) {
      existing.amount = amount
      existing.startDate = startDate
      existing.endDate = input.endDate?.trim() || undefined
      existing.notes = input.notes?.trim() || undefined
      existing.status = 'active'
      existing.updatedAt = nowIso()
    } else {
      salaries.unshift({
        id: nextId('SAL'),
        repId: rep.id,
        repName: rep.name,
        amount,
        startDate,
        endDate: input.endDate?.trim() || undefined,
        status: 'active',
        notes: input.notes?.trim() || undefined,
        updatedAt: nowIso(),
        createdBy: SUPERVISOR_NAME,
      })
    }

    pushAudit({
      type: 'fixed_salary',
      action: isUpdate ? 'update' : 'create',
      repId: rep.id,
      repName: rep.name,
      amount,
      notes: input.notes,
    })

    // إشعار المندوب
    pushNotice({
      audience: 'rep',
      repId: rep.id,
      repName: rep.name,
      title: 'اعتماد الراتب الثابت',
      body: `تم اعتماد راتبك الثابت من ${SUPERVISOR_NAME}: ${amount.toLocaleString('ar-SY')} ل.س — بتاريخ ${startDate}.`,
    })

    // للمفوتر
    pushNotice({
      audience: 'invoicer',
      repId: rep.id,
      repName: rep.name,
      title: 'راتب ثابت للاحتساب',
      body: `راتب ثابت ${amount.toLocaleString('ar-SY')} ل.س للمندوب ${rep.name} (بداية ${startDate}) — يُعتمد في كشوف الرواتب.`,
    })

    return 'تم حفظ الراتب الثابت بنجاح'
  },

  async suspendFixedSalary(repId) {
    const row = salaries.find((s) => s.repId === repId)
    if (!row) throw new Error('لا راتب ثابت لهذا المندوب')
    row.status = 'suspended'
    row.updatedAt = nowIso()
    pushAudit({
      type: 'fixed_salary',
      action: 'suspend',
      repId: row.repId,
      repName: row.repName,
      amount: row.amount,
    })
    return 'تم إيقاف الراتب الثابت بنجاح'
  },

  async awardBonus(input) {
    const amount = requirePositiveAmount(input.amount, 'قيمة المكافأة')
    const reason = requireReason(input.reason)
    if (!input.repIds.length) throw new Error('اختر مندوباً واحداً على الأقل')

    for (const repId of input.repIds) {
      const rep = REPS.find((r) => r.id === repId)
      if (!rep) throw new Error('مندوب غير موجود')

      bonuses.unshift({
        id: nextId('BON'),
        repId: rep.id,
        repName: rep.name,
        amount,
        reason,
        evaluationPercentAtAward: rep.evaluationPercent,
        awardedAt: nowIso(),
        awardedBy: SUPERVISOR_NAME,
        sentToInvoicer: true,
        notifiedRep: true,
      })

      pushAudit({
        type: 'bonus',
        action: 'award',
        repId: rep.id,
        repName: rep.name,
        amount,
        reason,
      })

      pushNotice({
        audience: 'rep',
        repId: rep.id,
        repName: rep.name,
        title: 'إضافة مكافأة',
        body: `أضاف ${SUPERVISOR_NAME} مكافأة بقيمة ${amount.toLocaleString('ar-SY')} ل.س. السبب: ${reason}.`,
      })

      pushNotice({
        audience: 'invoicer',
        repId: rep.id,
        repName: rep.name,
        title: 'مكافأة للاحتساب',
        body: `مكافأة ${amount.toLocaleString('ar-SY')} ل.س للمندوب ${rep.name} (تقييم ${rep.evaluationPercent}%) — يُحتسب في كشف الراتب.`,
      })
    }

    return 'تم إرسال المكافأة بنجاح'
  },
}
