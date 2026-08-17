/**
 * تحقق حقول السلة الترويجية — بما فيها الفارغة وغير الصالحة.
 */
import type {
  BasketTargeting,
  FreeBasketItem,
  PaidBasketItem,
  UpsertBasketInput,
} from './offerEntities'

export type PaidItemInput = Omit<PaidBasketItem, 'id'>
export type FreeItemInput = Omit<FreeBasketItem, 'id'>

export function requireNonEmpty(
  value: string | null | undefined,
  label: string,
): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) throw new Error(`${label} مطلوب ولا يمكن أن يكون فارغاً`)
  return trimmed
}

export function validateDates(startDate: string, endDate: string): void {
  if (!(startDate ?? '').trim()) {
    throw new Error('تاريخ البداية مطلوب ولا يمكن أن يكون فارغاً')
  }
  if (!(endDate ?? '').trim()) {
    throw new Error('تاريخ النهاية مطلوب ولا يمكن أن يكون فارغاً')
  }
  if (endDate < startDate) {
    throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية أو يساويه')
  }
}

export function validatePercent(value: number, label: string): void {
  if (Number.isNaN(value) || value < 0 || value > 100) {
    throw new Error(`${label} يجب أن يكون بين 0 و 100`)
  }
}

export function validatePaidItems(items: PaidItemInput[]): void {
  if (!items.length) return
  items.forEach((item, index) => {
    const n = index + 1
    if (!(item.productId ?? '').trim() || !(item.productName ?? '').trim()) {
      throw new Error(`الصنف المدفوع رقم ${n}: اختر صنفاً صالحاً`)
    }
    if (!(item.companyName ?? '').trim()) {
      throw new Error(`الصنف المدفوع رقم ${n}: الشركة مطلوبة`)
    }
    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      throw new Error(`الصنف المدفوع رقم ${n}: الكمية يجب أن تكون 1 على الأقل`)
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new Error(`الصنف المدفوع رقم ${n}: السعر غير صالح`)
    }
    validatePercent(item.itemDiscountPercent ?? 0, `حسم الصنف رقم ${n}`)
  })
}

export function validateFreeItems(items: FreeItemInput[]): void {
  if (!items.length) return
  items.forEach((item, index) => {
    const n = index + 1
    if (!(item.productId ?? '').trim() || !(item.productName ?? '').trim()) {
      throw new Error(`الصنف المجاني رقم ${n}: اختر صنفاً صالحاً`)
    }
    if (!Number.isFinite(item.freeQuantity) || item.freeQuantity < 1) {
      throw new Error(
        `الصنف المجاني رقم ${n}: الكمية المجانية يجب أن تكون 1 على الأقل`,
      )
    }
  })
}

export function validateTargeting(targeting: BasketTargeting): void {
  if (targeting.mode === 'selected_reps' && targeting.repIds.length === 0) {
    throw new Error('حدد مندوباً واحداً على الأقل — الخانة لا يمكن أن تبقى فارغة')
  }
  if (
    targeting.mode === 'regions' &&
    targeting.mainRegionIds.length === 0 &&
    targeting.subRegionIds.length === 0
  ) {
    throw new Error(
      'حدد منطقة رئيسية أو فرعية — لا يمكن ترك الاستهداف فارغاً',
    )
  }
  if (
    targeting.mode === 'regions' &&
    targeting.mainRegionIds.length > 0 &&
    targeting.subRegionIds.length === 0
  ) {
    throw new Error(
      'بعد اختيار المنطقة الرئيسية يجب اختيار منطقة فرعية واحدة على الأقل',
    )
  }
}

/** تحقق الحفظ كمسودة / تعديل */
export function validateBasketDraft(input: UpsertBasketInput): void {
  requireNonEmpty(input.name, 'اسم السلة')
  validateDates(input.startDate, input.endDate)
  validatePaidItems(input.paidItems)
  validateFreeItems(input.freeItems)
  validatePercent(input.basketDiscountPercent ?? 0, 'حسم السلة')
}

/** تحقق التفعيل (UC-27) — السلة مكتملة */
export function validateBasketForActivate(input: {
  name: string
  startDate: string
  endDate: string
  paidItems: PaidItemInput[]
  freeItems: FreeItemInput[]
  basketDiscountPercent: number
  targeting: BasketTargeting
}): void {
  validateBasketDraft({
    name: input.name,
    description: '',
    notesForRep: '',
    startDate: input.startDate,
    endDate: input.endDate,
    paidItems: input.paidItems,
    freeItems: input.freeItems,
    basketDiscountPercent: input.basketDiscountPercent,
    targeting: input.targeting,
  })
  if (input.paidItems.length === 0 && input.freeItems.length === 0) {
    throw new Error(
      'السلة غير مكتملة — أضف صنفاً مدفوعاً أو مجانياً على الأقل',
    )
  }
  if (input.paidItems.length === 0) {
    throw new Error('أضف صنفاً مدفوعاً واحداً على الأقل قبل التفعيل')
  }
  validateTargeting(input.targeting)
}
