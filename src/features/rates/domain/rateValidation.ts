import type {
  CompanyCommissionRate,
  ProductCommissionRate,
  UpsertCompanyRateInput,
  UpsertProductRateInput,
} from './rateEntities'

function requireDate(value: string, label: string): string {
  const t = value.trim()
  if (!t) throw new Error(`${label} مطلوب`)
  return t
}

function requirePercent(value: number): number {
  if (!Number.isFinite(value)) throw new Error('النسبة مطلوبة')
  if (value < 0 || value > 100) throw new Error('النسبة يجب أن تكون بين 0 و 100')
  return value
}

function rangesOverlap(
  aStart: string,
  aEnd: string | undefined,
  bStart: string,
  bEnd: string | undefined,
): boolean {
  const aE = aEnd && aEnd.trim() ? aEnd : '9999-12-31'
  const bE = bEnd && bEnd.trim() ? bEnd : '9999-12-31'
  return aStart <= bE && bStart <= aE
}

export function validateCompanyRateInput(
  input: UpsertCompanyRateInput,
  existing: CompanyCommissionRate[],
): void {
  if (!input.companyId.trim()) throw new Error('الشركة مطلوبة')
  requirePercent(input.percent)
  const start = requireDate(input.startDate, 'تاريخ البداية')
  const end = input.endDate?.trim() || undefined
  if (end && end < start) {
    throw new Error('تاريخ النهاية يجب أن يكون بعد البداية')
  }

  const clash = existing.find(
    (r) =>
      r.companyId === input.companyId &&
      r.status === 'active' &&
      r.id !== input.id &&
      rangesOverlap(start, end, r.startDate, r.endDate),
  )
  if (clash) {
    throw new Error(
      'لا يمكن وجود نسبتين فعّالتين متداخلتين لنفس الشركة في نفس الفترة',
    )
  }
}

export function validateProductRateInput(
  input: UpsertProductRateInput,
  existing: ProductCommissionRate[],
): void {
  if (!input.productId.trim()) throw new Error('الصنف مطلوب')
  requirePercent(input.percent)
  const start = requireDate(input.startDate, 'تاريخ البداية')
  const end = input.endDate?.trim() || undefined
  if (end && end < start) {
    throw new Error('تاريخ النهاية يجب أن يكون بعد البداية')
  }

  const clash = existing.find(
    (r) =>
      r.productId === input.productId &&
      r.status === 'active' &&
      r.id !== input.id &&
      rangesOverlap(start, end, r.startDate, r.endDate),
  )
  if (clash) {
    throw new Error(
      'لا يمكن وجود نسبتين خاصتين فعّالتين متداخلتين لنفس الصنف في نفس الفترة',
    )
  }
}

/** تاريخ اليوم YYYY-MM-DD */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isRateActiveOn(
  rate: { status: string; startDate: string; endDate?: string },
  onDate: string,
): boolean {
  if (rate.status !== 'active') return false
  if (rate.startDate > onDate) return false
  if (rate.endDate && rate.endDate < onDate) return false
  return true
}
