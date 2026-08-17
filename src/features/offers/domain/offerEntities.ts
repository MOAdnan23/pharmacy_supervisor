/** السلال الترويجية — UC-20 → UC-33 (المشرف) */

export type BasketStatus =
  | 'draft'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'archived'

/** التعامل مع العرض الأساسي للصنف عند إضافته للسلة (UC-22) */
export type BaseOfferPolicy = 'use_base' | 'ignore_base'

export type TargetMode = 'all_reps' | 'selected_reps' | 'regions'

export type PaidBasketItem = {
  id: string
  productId: string
  productName: string
  companyName: string
  quantity: number
  /** سعر الوحدة داخل السلة (قابل للتعديل من المشرف) */
  unitPrice: number
  /** حسم على هذا الصنف داخل السلة فقط (UC-24) */
  itemDiscountPercent: number
  /** هل نستخدم العرض الأساسي إن وُجد أم نتجاهله */
  baseOfferPolicy: BaseOfferPolicy
  /** وصف العرض الأساسي إن وُجد (للعرض فقط) */
  baseOfferLabel?: string
}

export type FreeBasketItem = {
  id: string
  productId: string
  productName: string
  companyName: string
  freeQuantity: number
}

export type BasketTargeting = {
  mode: TargetMode
  repIds: string[]
  /** مناطق رئيسية مختارة */
  mainRegionIds: string[]
  /** مناطق فرعية مختارة بعد الرئيسية */
  subRegionIds: string[]
}

export type PromotionalBasket = {
  id: string
  name: string
  description: string
  notesForRep: string
  startDate: string
  endDate: string
  status: BasketStatus
  paidItems: PaidBasketItem[]
  freeItems: FreeBasketItem[]
  /** حسم % على السلة فقط (= ما يُطبَّق على الفاتورة الناتجة) */
  basketDiscountPercent: number
  targeting: BasketTargeting
  /** إحصائيات عرض (Mock) */
  usageCount: number
  linkedOrdersCount: number
  createdAt: string
  activatedAt?: string
}

export type OffersSummary = {
  active: number
  suspended: number
  expired: number
  activeBaskets: number
  sentToReps: number
}

export type CatalogProduct = {
  id: string
  name: string
  companyName: string
  unitPrice: number
  /** إن وُجد عرض أساسي من المفوتر */
  baseOfferLabel?: string
}

export type RegionOption = {
  id: string
  name: string
  subRegions: { id: string; name: string }[]
}

export type OffersBoard = {
  baskets: PromotionalBasket[]
  summary: OffersSummary
  catalog: CatalogProduct[]
  repOptions: { id: string; name: string }[]
  regionOptions: RegionOption[]
}

export type UpsertBasketInput = {
  id?: string
  name: string
  description: string
  notesForRep: string
  startDate: string
  endDate: string
  status?: BasketStatus
  paidItems: Omit<PaidBasketItem, 'id'>[]
  freeItems: Omit<FreeBasketItem, 'id'>[]
  basketDiscountPercent: number
  targeting: BasketTargeting
}

export function paidLineTotal(item: {
  quantity: number
  unitPrice: number
  itemDiscountPercent: number
}): number {
  const gross = item.quantity * item.unitPrice
  const discount = (gross * (item.itemDiscountPercent || 0)) / 100
  return Math.max(0, gross - discount)
}
