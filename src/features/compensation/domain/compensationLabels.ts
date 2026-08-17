import {
  BONUS_ELIGIBILITY_THRESHOLD,
  type SalaryStatus,
} from './compensationEntities'

export function money(n: number): string {
  return `${n.toLocaleString('ar-SY', {
    maximumFractionDigits: 0,
  })} ل.س`
}

export function salaryStatusLabel(status: SalaryStatus): string {
  return status === 'active' ? 'فعّال' : 'موقوف'
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function requirePositiveAmount(amount: number, label = 'المبلغ'): number {
  if (!Number.isFinite(amount)) throw new Error(`${label} مطلوب`)
  if (amount <= 0) throw new Error(`${label} يجب أن يكون أكبر من صفر`)
  return amount
}

export function requireReason(reason: string): string {
  const t = reason.trim()
  if (!t) throw new Error('سبب المكافأة إلزامي')
  return t
}

export function requireStartDate(date: string): string {
  const t = date.trim()
  if (!t) throw new Error('تاريخ البداية مطلوب')
  return t
}

export function formatRepRegions(
  mainRegionLabel: string,
  subRegionLabels: string[],
): string {
  const subs = subRegionLabels.filter(Boolean)
  if (!subs.length) return mainRegionLabel
  return `${mainRegionLabel} — ${subs.join('، ')}`
}

/** بحث باسم المندوب أو المنطقة الرئيسية أو أي فرعية */
export function matchesRepRegionSearch(
  row: {
    repName: string
    mainRegionLabel: string
    subRegionLabels: string[]
    regionLabel: string
  },
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (row.repName.toLowerCase().includes(q)) return true
  if (row.mainRegionLabel.toLowerCase().includes(q)) return true
  if (row.regionLabel.toLowerCase().includes(q)) return true
  return row.subRegionLabels.some((s) => s.toLowerCase().includes(q))
}

export const COMPENSATION_RULES = {
  salaryNote:
    'الراتب الثابت اختياري بالكامل — المشرف يحدد إن أراد صرفه. يُحفظ ويصل للمفوتر، ويُشعر المندوب بالقيمة والتاريخ.',
  bonusNote: `يمكنك منح مكافأة للمؤهلين (تقييم ≥ ${BONUS_ELIGIBILITY_THRESHOLD}%) دفعة واحدة أو اختيار بعضهم، أو البحث واختيار أي مندوب. تُرسل للمفوتر مع إشعار للمندوب.`,
  invoicerNote:
    'الصرف والعمولة النهائية من صلاحيات المفوتر — المشرف يحدد الراتب والمكافآت فقط.',
}
