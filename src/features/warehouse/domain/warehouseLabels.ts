import type {
  DosageForm,
  ExpiryStatus,
  ItemNoteType,
  StockAvailability,
  WarehouseItem,
} from './warehouseEntities'
import {
  LOW_STOCK_THRESHOLD,
  NEAR_EXPIRY_DAYS,
} from './warehouseEntities'

export const WAREHOUSE_RULES = {
  sourceNote:
    'بيانات الجرد والشركات والأصناف من تطبيق المفوتر. المشرف يطّلع ويتابع ويضيف ملاحظات رقابية فقط — دون تعديل الكميات أو الأصناف.',
  pdfNote:
    'تصدير PDF بالعرض (Landscape) مع إمكانية اختيار اسم الملف والطباعة. عند كبر الجرد جداً يُفضّل التصفية أولاً أو التصدير من الخادم لاحقاً.',
}

export function money(n: number): string {
  return `${n.toLocaleString('ar-SY', {
    maximumFractionDigits: 0,
  })} ل.س`
}

export function availabilityLabel(v: StockAvailability): string {
  switch (v) {
    case 'available':
      return 'متوفر'
    case 'low_stock':
      return 'منخفض'
    case 'out_of_stock':
      return 'نافد'
  }
}

export function expiryLabel(v: ExpiryStatus): string {
  switch (v) {
    case 'valid':
      return 'صالح'
    case 'near_expiry':
      return 'قريب الانتهاء'
    case 'expired':
      return 'منتهٍ'
  }
}

export function noteTypeLabel(v: ItemNoteType): string {
  switch (v) {
    case 'follow_up':
      return 'متابعة'
    case 'alert':
      return 'تنبيه'
    case 'admin':
      return 'إدارية'
  }
}

export function dosageFormLabel(v?: DosageForm): string {
  switch (v) {
    case 'tablet':
      return 'حب'
    case 'capsule':
      return 'كبسول'
    case 'syrup':
      return 'شراب'
    case 'vial':
      return 'فيال'
    case 'other':
      return 'أخرى'
    default:
      return '—'
  }
}

export function formatIsoDate(iso: string): string {
  return iso.slice(0, 10)
}

export function formatIsoDateTime(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ')
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso.slice(0, 10))
  const b = new Date(toIso.slice(0, 10))
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function computeAvailability(
  quantity: number,
  threshold = LOW_STOCK_THRESHOLD,
): StockAvailability {
  if (quantity <= 0) return 'out_of_stock'
  if (quantity < threshold) return 'low_stock'
  return 'available'
}

export function computeExpiryStatus(
  expiryDate: string,
  today = todayIsoDate(),
): { status: ExpiryStatus; daysToExpiry: number } {
  const days = daysBetween(today, expiryDate)
  if (days < 0) return { status: 'expired', daysToExpiry: days }
  if (days <= NEAR_EXPIRY_DAYS) {
    return { status: 'near_expiry', daysToExpiry: days }
  }
  return { status: 'valid', daysToExpiry: days }
}

export function itemDisplayName(item: Pick<WarehouseItem, 'name' | 'strength'>): string {
  return item.strength ? `${item.name} ${item.strength}` : item.name
}

export function matchesWarehouseSearch(
  item: WarehouseItem,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    item.name.toLowerCase().includes(q) ||
    item.companyName.toLowerCase().includes(q) ||
    (item.scientificName?.toLowerCase().includes(q) ?? false) ||
    (item.strength?.toLowerCase().includes(q) ?? false)
  )
}

export function requireNoteText(text: string): string {
  const t = text.trim()
  if (!t) throw new Error('نص الملاحظة مطلوب')
  if (t.length < 3) throw new Error('الملاحظة قصيرة جداً')
  return t
}
