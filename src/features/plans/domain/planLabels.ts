import type {
  EvaluationLevel,
  GoalType,
  PlanSource,
  PlanStatus,
} from './planEntities'

export function planStatusLabel(status: PlanStatus): string {
  switch (status) {
    case 'draft':
      return 'مسودة'
    case 'in_progress':
      return 'قيد التنفيذ'
    case 'completed':
      return 'مكتملة'
    case 'delayed':
      return 'متأخرة'
    case 'pending_approval':
      return 'بانتظار الاعتماد'
    case 'approved':
      return 'معتمدة'
    case 'rejected':
      return 'مرفوضة'
    case 'archived':
      return 'مؤرشفة'
  }
}

export function planStatusTone(status: PlanStatus): string {
  switch (status) {
    case 'in_progress':
    case 'approved':
      return 'ok'
    case 'completed':
      return 'done'
    case 'delayed':
    case 'rejected':
      return 'stop'
    case 'pending_approval':
      return 'warn'
    case 'draft':
      return 'draft'
    default:
      return 'mute'
  }
}

export function planSourceLabel(source: PlanSource): string {
  return source === 'supervisor' ? 'المشرف' : 'المندوب'
}

export function goalTypeLabel(type: GoalType): string {
  switch (type) {
    case 'visits':
      return 'عدد الزيارات'
    case 'pharmacies':
      return 'عدد الصيدليات'
    case 'sales':
      return 'قيمة المبيعات'
    case 'collections':
      return 'قيمة التحصيل'
    case 'companies':
      return 'شركات مستهدفة'
    case 'specific_pharmacies':
      return 'صيدليات محددة'
    case 'specific_products':
      return 'أصناف محددة'
  }
}

/** شرح قصير لطريقة الاحتساب عند إنشاء الهدف */
export function goalTypeHint(type: GoalType): string {
  switch (type) {
    case 'visits':
      return 'كل فاتورة بيع لصيدلية = زيارة واحدة'
    case 'pharmacies':
    case 'specific_pharmacies':
      return 'صيدليات فريدة: نفس الصيدلية تُحسب مرة حتى لو بيعت عدة مرات'
    case 'sales':
      return 'مجموع قيم فواتير البيع ضمن فترة الخطة'
    case 'collections':
      return 'مجموع التحصيلات المرتبطة بالصيدليات ضمن فترة الخطة'
    case 'companies':
      return 'اختر الشركات المستهدفة ثم حدّد القيمة المطلوبة'
    case 'specific_products':
      return 'اضغط على القيمة المطلوبة لاختيار الأصناف مع البحث'
  }
}

export function defaultGoalUnit(type: GoalType): string {
  if (type === 'sales' || type === 'collections') return 'ل.س'
  if (type === 'visits') return 'زيارة'
  if (type === 'pharmacies' || type === 'specific_pharmacies') return 'صيدلية'
  if (type === 'companies') return 'شركة'
  if (type === 'specific_products') return 'صنف'
  return 'هدف'
}

export function evaluationLabel(level: EvaluationLevel): string {
  switch (level) {
    case 'excellent':
      return 'ممتاز'
    case 'very_good':
      return 'جيد جداً'
    case 'good':
      return 'جيد'
    case 'needs_followup':
      return 'يحتاج متابعة'
  }
}

export function goalProgress(achieved: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((achieved / target) * 100))
}

export function requirePlanName(name: string): string {
  const t = name.trim()
  if (!t) throw new Error('اسم الخطة مطلوب ولا يمكن أن يكون فارغاً')
  return t
}

export function validatePlanDates(start: string, end: string): void {
  if (!start.trim()) throw new Error('تاريخ البداية مطلوب')
  if (!end.trim()) throw new Error('تاريخ النهاية مطلوب')
  if (end < start) throw new Error('تاريخ النهاية يجب أن يكون بعد البداية')
}
