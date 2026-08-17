/** تقييم أداء المندوب — UC-72 → UC-83
 * الاحتساب تلقائي من فواتير البيع (+ خصم المرتجعات من التارغت).
 * المشرف يراجع ويضيف تقييماً يُرسل للمندوب.
 */

export type EvaluationGrade =
  | 'excellent_plus'
  | 'excellent'
  | 'very_good'
  | 'good'
  | 'average'
  | 'bad'

export type EvaluationFilter = {
  repId: string
  from: string
  to: string
  /** منطقة رئيسية — null = كل المناطق الرئيسية */
  mainRegionId: string | null
  /** منطقة فرعية — null = كل الفرعية ضمن الرئيسية (أو الكل) */
  subRegionId: string | null
}

export type EvalRegionOption = {
  id: string
  name: string
}

export type EvalRepOption = {
  id: string
  name: string
  mainRegionIds: string[]
  subRegionIds: string[]
}

export type PharmacyEvalRow = {
  pharmacyId: string
  pharmacyName: string
  regionLabel: string
  invoiceCount: number
  salesAmount: number
  /** فواتير هذه الصيدلية (رقم + تاريخ + قيمة) */
  invoices: Array<{
    invoiceId: string
    invoiceNumber: string
    date: string
    amount: number
  }>
}

/** فاتورة بيع ضمن تفاصيل تارغت شركة */
export type CompanySaleInvoiceRow = {
  invoiceId: string
  invoiceNumber: string
  date: string
  pharmacyId: string
  pharmacyName: string
  regionLabel: string
  amount: number
}

export type CompanyTargetRow = {
  companyId: string
  companyName: string
  targetAmount: number
  achievedAmount: number
  achievementPercent: number
  points: number
  maxPoints: number
  /** فواتير البيع للشركة: صيدلية + رقم الفاتورة + التاريخ + القيمة */
  invoices: CompanySaleInvoiceRow[]
}

export type ScoreBreakdown = {
  target: {
    maxPoints: 35
    points: number
    percent: number
    companies: CompanyTargetRow[]
  }
  coverage: {
    maxPoints: 35
    points: number
    percent: number
    totalPharmacies: number
    soldPharmacies: number
    pharmacies: PharmacyEvalRow[]
  }
  repeated: {
    maxPoints: 20
    points: number
    percent: number
    count: number
    pharmacies: PharmacyEvalRow[]
  }
  once: {
    maxPoints: 10
    points: number
    percent: number
    count: number
    pharmacies: PharmacyEvalRow[]
  }
}

export type SupervisorReview = {
  grade: EvaluationGrade
  note: string
  sentAt: string
  sentBy: string
  deliveredToRep: boolean
}

export type RepEvaluationCard = {
  repId: string
  repName: string
  regionLabel: string
  from: string
  to: string
  totalPoints: number
  totalPercent: number
  autoGrade: EvaluationGrade
  breakdown: ScoreBreakdown
  supervisorReview: SupervisorReview | null
  salesInvoiceCount: number
}

export type EvaluationBoard = {
  filter: EvaluationFilter
  mainRegionOptions: EvalRegionOption[]
  subRegionOptions: EvalRegionOption[]
  repOptions: EvalRepOption[]
  card: RepEvaluationCard | null
}

export type SendSupervisorReviewInput = {
  repId: string
  from: string
  to: string
  mainRegionId: string | null
  subRegionId: string | null
  grade: EvaluationGrade
  note: string
}
