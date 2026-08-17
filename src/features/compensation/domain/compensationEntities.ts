/** الراتب الثابت والمكافآت — UC-135 → UC-141
 * المشرف يحدد فقط؛ المفوتر يحتسب ويصرف لاحقاً.
 * مكافآت المؤهلين: تقييم ≥ 80%.
 */

export type SalaryStatus = 'active' | 'suspended'

export type BonusEligibility = 'eligible' | 'not_eligible'

export type RepCompensationRow = {
  repId: string
  repName: string
  /** المنطقة الرئيسية */
  mainRegionLabel: string
  /** المناطق الفرعية التابعة للمندوب */
  subRegionLabels: string[]
  /** عرض مختصر: رئيسية — فرعيات (للتوافق والقوائم) */
  regionLabel: string
  /** نسبة التقييم الحالية (من 100) — لصلاحية المكافأة */
  evaluationPercent: number
  evaluationGradeLabel: string
  fixedSalary: number | null
  salaryStartDate: string | null
  salaryStatus: SalaryStatus | null
  lastBonusAmount: number | null
  lastBonusAt: string | null
  bonusesCount: number
  eligibleForBonus: boolean
}

export type FixedSalaryRecord = {
  id: string
  repId: string
  repName: string
  amount: number
  startDate: string
  endDate?: string
  status: SalaryStatus
  notes?: string
  updatedAt: string
  createdBy: string
}

export type BonusRecord = {
  id: string
  repId: string
  repName: string
  amount: number
  reason: string
  evaluationPercentAtAward: number
  awardedAt: string
  awardedBy: string
  /** أُرسل للمفوتر للاحتساب */
  sentToInvoicer: boolean
  /** أُرسل إشعار للمندوب */
  notifiedRep: boolean
}

export type CompensationAuditEntry = {
  id: string
  at: string
  type: 'fixed_salary' | 'bonus'
  action: 'create' | 'update' | 'suspend' | 'award'
  repId: string
  repName: string
  amount: number
  reason?: string
  actorName: string
  notes?: string
}

/** إشعار يُحاكى وصوله للمندوب / المفوتر */
export type CompensationNotice = {
  id: string
  audience: 'rep' | 'invoicer'
  repId: string
  repName: string
  title: string
  body: string
  createdAt: string
}

export type CompensationBoard = {
  summary: {
    repsCount: number
    withFixedSalary: number
    eligibleForBonus: number
    bonusesThisMonth: number
  }
  reps: RepCompensationRow[]
  auditLog: CompensationAuditEntry[]
  recentNotices: CompensationNotice[]
}

export type UpsertFixedSalaryInput = {
  repId: string
  amount: number
  startDate: string
  endDate?: string
  notes?: string
}

export type AwardBonusInput = {
  /** مندوب واحد أو عدة مؤهلين (≥ 80%) */
  repIds: string[]
  amount: number
  reason: string
}

/** عتبة أهلية المكافأة من نسبة التقييم */
export const BONUS_ELIGIBILITY_THRESHOLD = 80
