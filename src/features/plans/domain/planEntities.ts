/** خطط العمل — UC-97 → UC-113 */

export type PlanStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'archived'

export type PlanSource = 'supervisor' | 'rep'

export type GoalType =
  | 'visits'
  | 'pharmacies'
  | 'sales'
  | 'collections'
  | 'companies'
  | 'specific_pharmacies'
  | 'specific_products'

export type EvaluationLevel = 'excellent' | 'very_good' | 'good' | 'needs_followup'

export type PlanGoal = {
  id: string
  type: GoalType
  /** يعرض اسم الخطة عادة */
  label: string
  targetValue: number
  achievedValue: number
  /** تُحدَّد تلقائياً حسب النوع (للتوافق مع المندوب/الباك) */
  unit: string
  note?: string
  /** معرفات الشركات / الصيدليات / الأصناف المحددة */
  selectedIds?: string[]
  selectedLabels?: string[]
}

export type PlanCatalogOption = {
  id: string
  name: string
  meta?: string
}

export type PlanRegionNode = {
  mainId: string
  mainName: string
  subs: { id: string; name: string }[]
}

/**
 * صيدلية ضمن تفصيل الزيارات.
 * visitCount = عدد فواتير البيع لهذه الصيدلية (كل فاتورة = زيارة).
 */
export type VisitPharmacyRow = {
  pharmacyId: string
  pharmacyName: string
  regionLabel: string
  /** عدد الزيارات = عدد فواتير البيع */
  visitCount: number
  lastVisitAt: string
  repId: string
  repName: string
}

/** مبيعات لكل صيدلية × شركة — مصدر الزيارات */
export type SalesPharmacyRow = {
  pharmacyId: string
  pharmacyName: string
  companyName: string
  amount: number
  /** كل فاتورة تسجّل زيارة للصيدلية */
  invoicesCount: number
  repId: string
  repName: string
}

/** تحصيل لكل صيدلية */
export type CollectionPharmacyRow = {
  pharmacyId: string
  pharmacyName: string
  amount: number
  method: string
  collectedAt: string
  repId: string
  repName: string
}

/**
 * صيدليات محققة (هدف تغطية).
 * كل صيدلية تُحسب مرة واحدة حتى لو visitCount > 1.
 */
export type AchievedPharmacyRow = {
  pharmacyId: string
  pharmacyName: string
  regionLabel: string
  firstVisitAt: string
  /** مرات البيع/الزيارة — لا ترفع عدّاد هدف الصيدليات */
  visitCount: number
  repId: string
  repName: string
}

export type PlanExecutionDetails = {
  visits: VisitPharmacyRow[]
  sales: SalesPharmacyRow[]
  collections: CollectionPharmacyRow[]
  achievedPharmacies: AchievedPharmacyRow[]
}

export type PlanNote = {
  id: string
  authorRole: 'supervisor' | 'rep'
  authorName: string
  text: string
  createdAt: string
  /** ملاحظة عادية / تقييم خطة / رد على التقييم */
  kind?: 'note' | 'evaluation' | 'evaluation_reply'
  evaluationLevel?: EvaluationLevel
}

export type RepEvaluation = {
  repId: string
  level: EvaluationLevel
  note: string
}

export type WorkPlan = {
  id: string
  name: string
  description: string
  source: PlanSource
  status: PlanStatus
  startDate: string
  endDate: string
  /** نص العرض — قد يكون فارغاً = بدون تقييد منطقة */
  regionLabel: string
  mainRegionId?: string | null
  subRegionId?: string | null
  repIds: string[]
  repNames: string[]
  /** مندوب مقترح إن كانت واردة من مندوب */
  submittedByRepId?: string
  submittedByRepName?: string
  goals: PlanGoal[]
  notes: PlanNote[]
  /** تفاصيل التنفيذ للجداول (زيارات/مبيعات/تحصيل/صيدليات) */
  executionDetails?: PlanExecutionDetails
  progressPercent: number
  evaluationLevel?: EvaluationLevel
  evaluationNote?: string
  repEvaluations: RepEvaluation[]
  rejectReason?: string
  createdAt: string
  updatedAt: string
}

export type PlansSummary = {
  total: number
  inProgress: number
  completed: number
  delayed: number
  avgProgress: number
  assignees: number
  incoming: number
  pendingApproval: number
}

export type PlansBoard = {
  plans: WorkPlan[]
  summary: PlansSummary
  repOptions: {
    id: string
    name: string
    region: string
    pharmacyCount: number
    mainRegionIds: string[]
    subRegionIds: string[]
  }[]
  regionOptions: string[]
  regionTree: PlanRegionNode[]
  companyOptions: PlanCatalogOption[]
  pharmacyOptionsByRep: Record<string, PlanCatalogOption[]>
  productOptions: PlanCatalogOption[]
}

export type UpsertPlanInput = {
  id?: string
  name: string
  description: string
  startDate: string
  endDate: string
  regionLabel: string
  mainRegionId?: string | null
  subRegionId?: string | null
  repIds: string[]
  goals: Omit<PlanGoal, 'id' | 'achievedValue'>[]
  status?: PlanStatus
}

export type ReviewIncomingInput = {
  id: string
  action: 'approve' | 'request_changes' | 'reject'
  note?: string
  rejectReason?: string
}

export type SaveEvaluationInput = {
  id: string
  level: EvaluationLevel
  note: string
  repEvaluations?: RepEvaluation[]
}
