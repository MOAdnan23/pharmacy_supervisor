import type {
  PlansBoard,
  PlansSummary,
  ReviewIncomingInput,
  SaveEvaluationInput,
  UpsertPlanInput,
  WorkPlan,
} from '../domain/planEntities'
import {
  goalProgress,
  requirePlanName,
  validatePlanDates,
} from '../domain/planLabels'
import type { PlansDatasource } from './plansDatasource'

const REP_OPTIONS = [
  { id: 'r1', name: 'ياسين العمودي', region: 'دمشق', pharmacyCount: 14 },
  { id: 'r2', name: 'محمد الشهري', region: 'حلب', pharmacyCount: 9 },
  { id: 'r3', name: 'سامر الحسن', region: 'حمص', pharmacyCount: 11 },
]

const REGION_OPTIONS = ['دمشق', 'ريف دمشق', 'حلب', 'حمص']

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function nowIso(): string {
  return new Date().toISOString()
}

function calcProgress(goals: WorkPlan['goals']): number {
  if (!goals.length) return 0
  const sum = goals.reduce(
    (s, g) => s + goalProgress(g.achievedValue, g.targetValue),
    0,
  )
  return Math.round(sum / goals.length)
}

function withProgress(plan: WorkPlan): WorkPlan {
  const progressPercent = calcProgress(plan.goals)
  let status = plan.status
  if (
    status === 'in_progress' ||
    status === 'approved' ||
    status === 'delayed'
  ) {
    if (progressPercent >= 100) status = 'completed'
    else if (plan.endDate < today() && progressPercent < 100) status = 'delayed'
    else if (status !== 'delayed') status = 'in_progress'
  }
  return { ...plan, progressPercent, status }
}

let plans: WorkPlan[] = [
  withProgress({
    id: 'PLAN-001',
    name: 'خطة تغطية دمشق — آب',
    description: 'رفع الزيارات والتحصيل في دمشق خلال الشهر',
    source: 'supervisor',
    status: 'in_progress',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    regionLabel: 'دمشق',
    repIds: ['r1'],
    repNames: ['ياسين العمودي'],
    goals: [
      {
        id: 'g1',
        type: 'visits',
        label: 'عدد الزيارات',
        targetValue: 40,
        /** مجموع فواتير البيع للصيدليات */
        achievedValue: 9,
        unit: 'زيارة',
      },
      {
        id: 'g2',
        type: 'sales',
        label: 'قيمة المبيعات',
        targetValue: 25000000,
        achievedValue: 18000000,
        unit: 'ل.س',
      },
      {
        id: 'g3',
        type: 'collections',
        label: 'قيمة التحصيل',
        targetValue: 12000000,
        achievedValue: 9500000,
        unit: 'ل.س',
      },
    ],
    notes: [
      {
        id: 'n1',
        authorRole: 'supervisor',
        authorName: 'المشرف',
        text: 'التركيز على صيدليات المزة وكفرسوسة',
        createdAt: '2026-08-02T10:00:00',
      },
      {
        id: 'n2',
        authorRole: 'rep',
        authorName: 'ياسين العمودي',
        text: 'تم تغطية 12 صيدلية في الأسبوع الأول',
        createdAt: '2026-08-08T16:20:00',
      },
    ],
    executionDetails: {
      /** تُشتق الزيارات من فواتير البيع أدناه */
      visits: [
        {
          pharmacyId: 'ph1',
          pharmacyName: 'صيدلية النور — المزة',
          regionLabel: 'دمشق / المزة',
          visitCount: 1,
          lastVisitAt: '2026-08-10',
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph3',
          pharmacyName: 'صيدلية الحياة — المالكي',
          regionLabel: 'دمشق / المالكي',
          visitCount: 2,
          lastVisitAt: '2026-08-13',
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph5',
          pharmacyName: 'صيدلية الياسمين — المزة',
          regionLabel: 'دمشق / المزة',
          visitCount: 4,
          lastVisitAt: '2026-08-14',
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph6',
          pharmacyName: 'صيدلية الرازي — كفرسوسة',
          regionLabel: 'دمشق / كفرسوسة',
          visitCount: 2,
          lastVisitAt: '2026-08-15',
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
      ],
      sales: [
        {
          pharmacyId: 'ph5',
          pharmacyName: 'صيدلية الياسمين — المزة',
          companyName: 'شركة دمشق فارما',
          amount: 5200000,
          invoicesCount: 3,
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph5',
          pharmacyName: 'صيدلية الياسمين — المزة',
          companyName: 'شركة ابن سينا',
          amount: 2100000,
          invoicesCount: 1,
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph3',
          pharmacyName: 'صيدلية الحياة — المالكي',
          companyName: 'شركة حلب ميديكال',
          amount: 4800000,
          invoicesCount: 2,
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph6',
          pharmacyName: 'صيدلية الرازي — كفرسوسة',
          companyName: 'شركة دمشق فارما',
          amount: 3900000,
          invoicesCount: 2,
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph1',
          pharmacyName: 'صيدلية النور — المزة',
          companyName: 'شركة الشام للدواء',
          amount: 2000000,
          invoicesCount: 1,
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
      ],
      collections: [
        {
          pharmacyId: 'ph5',
          pharmacyName: 'صيدلية الياسمين — المزة',
          amount: 3500000,
          method: 'نقدي',
          collectedAt: '2026-08-12',
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph3',
          pharmacyName: 'صيدلية الحياة — المالكي',
          amount: 2800000,
          method: 'تحويل',
          collectedAt: '2026-08-13',
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph6',
          pharmacyName: 'صيدلية الرازي — كفرسوسة',
          amount: 2200000,
          method: 'نقدي',
          collectedAt: '2026-08-14',
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph1',
          pharmacyName: 'صيدلية النور — المزة',
          amount: 1000000,
          method: 'شيك',
          collectedAt: '2026-08-15',
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
      ],
      achievedPharmacies: [
        {
          pharmacyId: 'ph1',
          pharmacyName: 'صيدلية النور — المزة',
          regionLabel: 'دمشق / المزة',
          firstVisitAt: '2026-08-10',
          visitCount: 1,
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph3',
          pharmacyName: 'صيدلية الحياة — المالكي',
          regionLabel: 'دمشق / المالكي',
          firstVisitAt: '2026-08-08',
          visitCount: 2,
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph5',
          pharmacyName: 'صيدلية الياسمين — المزة',
          regionLabel: 'دمشق / المزة',
          firstVisitAt: '2026-08-05',
          visitCount: 4,
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
        {
          pharmacyId: 'ph6',
          pharmacyName: 'صيدلية الرازي — كفرسوسة',
          regionLabel: 'دمشق / كفرسوسة',
          firstVisitAt: '2026-08-09',
          visitCount: 2,
          repId: 'r1',
          repName: 'ياسين العمودي',
        },
      ],
    },
    progressPercent: 0,
    repEvaluations: [],
    createdAt: '2026-07-28',
    updatedAt: '2026-08-14',
  }),
  withProgress({
    id: 'PLAN-002',
    name: 'خطة حلب للمبيعات',
    description: 'مجموعة مندوبين في حلب',
    source: 'supervisor',
    status: 'in_progress',
    startDate: '2026-08-05',
    endDate: '2026-09-05',
    regionLabel: 'حلب',
    repIds: ['r2', 'r3'],
    repNames: ['محمد الشهري', 'سامر الحسن'],
    goals: [
      {
        id: 'g4',
        type: 'pharmacies',
        label: 'عدد الصيدليات',
        targetValue: 30,
        /** صيدليات فريدة ذات فاتورة بيع واحدة على الأقل */
        achievedValue: 3,
        unit: 'صيدلية',
      },
      {
        id: 'g5',
        type: 'sales',
        label: 'قيمة المبيعات',
        targetValue: 40000000,
        achievedValue: 15000000,
        unit: 'ل.س',
      },
    ],
    notes: [],
    executionDetails: {
      visits: [],
      sales: [
        {
          pharmacyId: 'ph10',
          pharmacyName: 'صيدلية العزيزية',
          companyName: 'شركة حلب ميديكال',
          amount: 6200000,
          invoicesCount: 4,
          repId: 'r2',
          repName: 'محمد الشهري',
        },
        {
          pharmacyId: 'ph10',
          pharmacyName: 'صيدلية العزيزية',
          companyName: 'شركة دمشق فارما',
          amount: 2800000,
          invoicesCount: 2,
          repId: 'r2',
          repName: 'محمد الشهري',
        },
        {
          pharmacyId: 'ph11',
          pharmacyName: 'صيدلية صلاح الدين',
          companyName: 'شركة ابن سينا',
          amount: 3500000,
          invoicesCount: 2,
          repId: 'r3',
          repName: 'سامر الحسن',
        },
        {
          pharmacyId: 'ph12',
          pharmacyName: 'صيدلية الجميلية',
          companyName: 'شركة حلب ميديكال',
          amount: 2500000,
          invoicesCount: 1,
          repId: 'r2',
          repName: 'محمد الشهري',
        },
      ],
      collections: [],
      achievedPharmacies: [
        {
          pharmacyId: 'ph10',
          pharmacyName: 'صيدلية العزيزية',
          regionLabel: 'حلب / العزيزية',
          firstVisitAt: '2026-08-06',
          /** 4+2 فواتير = 6 زيارات، وصيدلية واحدة في هدف التغطية */
          visitCount: 6,
          repId: 'r2',
          repName: 'محمد الشهري',
        },
        {
          pharmacyId: 'ph11',
          pharmacyName: 'صيدلية صلاح الدين',
          regionLabel: 'حلب / صلاح الدين',
          firstVisitAt: '2026-08-07',
          visitCount: 2,
          repId: 'r3',
          repName: 'سامر الحسن',
        },
        {
          pharmacyId: 'ph12',
          pharmacyName: 'صيدلية الجميلية',
          regionLabel: 'حلب / الجميلية',
          firstVisitAt: '2026-08-09',
          visitCount: 1,
          repId: 'r2',
          repName: 'محمد الشهري',
        },
      ],
    },
    progressPercent: 0,
    repEvaluations: [],
    createdAt: '2026-08-04',
    updatedAt: '2026-08-12',
  }),
  withProgress({
    id: 'PLAN-003',
    name: 'اقتراح مندوب — تغطية قدسيا',
    description: 'خطة مقترحة من المندوب لاعتماد المشرف',
    source: 'rep',
    status: 'pending_approval',
    startDate: '2026-08-20',
    endDate: '2026-09-20',
    regionLabel: 'ريف دمشق',
    repIds: ['r1'],
    repNames: ['ياسين العمودي'],
    submittedByRepId: 'r1',
    submittedByRepName: 'ياسين العمودي',
    goals: [
      {
        id: 'g6',
        type: 'visits',
        label: 'عدد الزيارات',
        targetValue: 20,
        achievedValue: 0,
        unit: 'زيارة',
      },
      {
        id: 'g7',
        type: 'collections',
        label: 'قيمة التحصيل',
        targetValue: 5000000,
        achievedValue: 0,
        unit: 'ل.س',
      },
    ],
    notes: [
      {
        id: 'n3',
        authorRole: 'rep',
        authorName: 'ياسين العمودي',
        text: 'أقترح التركيز على قدسيا وجرمانا بسبب تأخر التحصيل',
        createdAt: '2026-08-15T09:30:00',
      },
    ],
    progressPercent: 0,
    repEvaluations: [],
    createdAt: '2026-08-15',
    updatedAt: '2026-08-15',
  }),
  withProgress({
    id: 'PLAN-004',
    name: 'خطة تموز المكتملة',
    description: 'أُنجزت وأُرشفت',
    source: 'supervisor',
    status: 'archived',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    regionLabel: 'دمشق',
    repIds: ['r1'],
    repNames: ['ياسين العمودي'],
    goals: [
      {
        id: 'g8',
        type: 'visits',
        label: 'عدد الزيارات',
        targetValue: 35,
        achievedValue: 36,
        unit: 'زيارة',
      },
    ],
    notes: [],
    progressPercent: 100,
    evaluationLevel: 'very_good',
    evaluationNote: 'أداء جيد مع تجاوز هدف الزيارات',
    repEvaluations: [
      {
        repId: 'r1',
        level: 'very_good',
        note: 'التزام ممتاز بالمواعيد',
      },
    ],
    createdAt: '2026-06-28',
    updatedAt: '2026-08-01',
  }),
]

function summaryOf(list: WorkPlan[]): PlansSummary {
  const live = list.map(withProgress)
  const activeLike = live.filter((p) => p.status !== 'archived')
  const assignees = new Set(activeLike.flatMap((p) => p.repIds))
  const progressing = activeLike.filter(
    (p) =>
      p.status === 'in_progress' ||
      p.status === 'approved' ||
      p.status === 'delayed' ||
      p.status === 'completed',
  )
  const avg =
    progressing.length === 0
      ? 0
      : Math.round(
          progressing.reduce((s, p) => s + p.progressPercent, 0) /
            progressing.length,
        )
  return {
    total: activeLike.length,
    inProgress: live.filter((p) => p.status === 'in_progress').length,
    completed: live.filter((p) => p.status === 'completed').length,
    delayed: live.filter((p) => p.status === 'delayed').length,
    avgProgress: avg,
    assignees: assignees.size,
    incoming: live.filter((p) => p.source === 'rep' && p.status === 'pending_approval')
      .length,
    pendingApproval: live.filter((p) => p.status === 'pending_approval').length,
  }
}

function board(): PlansBoard {
  plans = plans.map(withProgress)
  return {
    plans: plans.map((p) => ({
      ...p,
      goals: [...p.goals],
      notes: [...p.notes],
      repIds: [...p.repIds],
      repNames: [...p.repNames],
      repEvaluations: [...p.repEvaluations],
      executionDetails: p.executionDetails
        ? {
            visits: [...p.executionDetails.visits],
            sales: [...p.executionDetails.sales],
            collections: [...p.executionDetails.collections],
            achievedPharmacies: [...p.executionDetails.achievedPharmacies],
          }
        : undefined,
    })),
    summary: summaryOf(plans),
    repOptions: [...REP_OPTIONS],
    regionOptions: [...REGION_OPTIONS],
  }
}

export const plansMockDatasource: PlansDatasource = {
  async getBoard() {
    return board()
  },

  async getById(id) {
    const found = plans.map(withProgress).find((p) => p.id === id)
    if (!found) throw new Error('الخطة غير موجودة')
    return found
  },

  async upsertPlan(input: UpsertPlanInput) {
    const name = requirePlanName(input.name)
    validatePlanDates(input.startDate, input.endDate)
    if (!input.regionLabel.trim()) throw new Error('المنطقة مطلوبة')
    if (!input.repIds.length) throw new Error('حدد مندوباً واحداً على الأقل')
    if (!input.goals.length) throw new Error('أضف هدفاً واحداً على الأقل')
    input.goals.forEach((g, i) => {
      if (!g.label.trim()) throw new Error(`هدف رقم ${i + 1}: العنوان مطلوب`)
      if (!(g.targetValue > 0)) {
        throw new Error(`هدف رقم ${i + 1}: القيمة المطلوبة يجب أن تكون أكبر من صفر`)
      }
    })

    const repNames = input.repIds.map(
      (id) => REP_OPTIONS.find((r) => r.id === id)?.name ?? id,
    )

    if (input.id) {
      const idx = plans.findIndex((p) => p.id === input.id)
      if (idx < 0) throw new Error('الخطة غير موجودة')
      const prev = plans[idx]
      const next: WorkPlan = withProgress({
        ...prev,
        name,
        description: input.description.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        regionLabel: input.regionLabel.trim(),
        repIds: [...input.repIds],
        repNames,
        status: input.status ?? prev.status,
        goals: input.goals.map((g, i) => ({
          id: prev.goals[i]?.id ?? nextId('goal'),
          type: g.type,
          label: g.label.trim(),
          targetValue: g.targetValue,
          achievedValue: prev.goals[i]?.achievedValue ?? 0,
          unit: g.unit,
          note: g.note,
        })),
        updatedAt: today(),
      })
      plans = [...plans.slice(0, idx), next, ...plans.slice(idx + 1)]
      return next
    }

    const created = withProgress({
      id: nextId('PLAN'),
      name,
      description: input.description.trim(),
      source: 'supervisor',
      status: input.status ?? 'in_progress',
      startDate: input.startDate,
      endDate: input.endDate,
      regionLabel: input.regionLabel.trim(),
      repIds: [...input.repIds],
      repNames,
      goals: input.goals.map((g) => ({
        id: nextId('goal'),
        type: g.type,
        label: g.label.trim(),
        targetValue: g.targetValue,
        achievedValue: 0,
        unit: g.unit,
        note: g.note,
      })),
      notes: [],
      progressPercent: 0,
      repEvaluations: [],
      createdAt: today(),
      updatedAt: today(),
    })
    plans = [created, ...plans]
    return created
  },

  async reviewIncoming(input: ReviewIncomingInput) {
    const idx = plans.findIndex((p) => p.id === input.id)
    if (idx < 0) throw new Error('الخطة غير موجودة')
    const current = plans[idx]
    if (current.source !== 'rep' || current.status !== 'pending_approval') {
      throw new Error('هذه الخطة ليست واردة بانتظار الاعتماد')
    }

    let status: WorkPlan['status'] = current.status
    let rejectReason = current.rejectReason
    const notes = [...current.notes]

    if (input.action === 'approve') {
      status = 'in_progress'
      if (input.note?.trim()) {
        notes.push({
          id: nextId('note'),
          authorRole: 'supervisor',
          authorName: 'المشرف',
          text: input.note.trim(),
          createdAt: nowIso(),
        })
      }
    } else if (input.action === 'request_changes') {
      status = 'draft'
      notes.push({
        id: nextId('note'),
        authorRole: 'supervisor',
        authorName: 'المشرف',
        text: input.note?.trim() || 'يُرجى تعديل الخطة وإعادة الإرسال',
        createdAt: nowIso(),
      })
    } else {
      if (!input.rejectReason?.trim()) {
        throw new Error('سبب الرفض مطلوب')
      }
      status = 'rejected'
      rejectReason = input.rejectReason.trim()
      notes.push({
        id: nextId('note'),
        authorRole: 'supervisor',
        authorName: 'المشرف',
        text: `رفض الاعتماد: ${rejectReason}`,
        createdAt: nowIso(),
      })
    }

    plans = [
      ...plans.slice(0, idx),
      withProgress({
        ...current,
        status,
        rejectReason,
        notes,
        updatedAt: today(),
      }),
      ...plans.slice(idx + 1),
    ]
  },

  async addNote(id, text) {
    const trimmed = text.trim()
    if (!trimmed) throw new Error('نص الملاحظة مطلوب')
    const idx = plans.findIndex((p) => p.id === id)
    if (idx < 0) throw new Error('الخطة غير موجودة')
    const current = plans[idx]
    plans = [
      ...plans.slice(0, idx),
      {
        ...current,
        notes: [
          ...current.notes,
          {
            id: nextId('note'),
            authorRole: 'supervisor',
            authorName: 'المشرف',
            text: trimmed,
            createdAt: nowIso(),
          },
        ],
        updatedAt: today(),
      },
      ...plans.slice(idx + 1),
    ]
  },

  async saveEvaluation(input: SaveEvaluationInput) {
    const idx = plans.findIndex((p) => p.id === input.id)
    if (idx < 0) throw new Error('الخطة غير موجودة')
    const current = plans[idx]
    plans = [
      ...plans.slice(0, idx),
      {
        ...current,
        evaluationLevel: input.level,
        evaluationNote: input.note.trim(),
        repEvaluations: input.repEvaluations ?? current.repEvaluations,
        updatedAt: today(),
      },
      ...plans.slice(idx + 1),
    ]
  },

  async archivePlan(id) {
    const idx = plans.findIndex((p) => p.id === id)
    if (idx < 0) throw new Error('الخطة غير موجودة')
    const current = plans[idx]
    if (
      current.status !== 'completed' &&
      current.status !== 'rejected' &&
      current.status !== 'delayed'
    ) {
      throw new Error('لا تُؤرشف إلا الخطط المكتملة أو المرفوضة أو المتأخرة المنتهية')
    }
    plans = [
      ...plans.slice(0, idx),
      { ...current, status: 'archived', updatedAt: today() },
      ...plans.slice(idx + 1),
    ]
  },
}
