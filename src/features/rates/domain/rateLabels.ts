import type { RateStatus } from './rateEntities'

export function rateStatusLabel(status: RateStatus): string {
  switch (status) {
    case 'active':
      return 'فعّالة'
    case 'suspended':
      return 'موقوفة'
    case 'expired':
      return 'منتهية'
  }
}

export function rateStatusTone(status: RateStatus): string {
  switch (status) {
    case 'active':
      return 'ok'
    case 'suspended':
      return 'warn'
    case 'expired':
      return 'mute'
  }
}

export function auditActionLabel(
  action: 'create' | 'update' | 'suspend' | 'delete',
): string {
  switch (action) {
    case 'create':
      return 'إضافة'
    case 'update':
      return 'تعديل'
    case 'suspend':
      return 'إيقاف'
    case 'delete':
      return 'حذف'
  }
}

export const RATE_PRIORITY_RULE =
  'أولوية الاحتساب: نسبة الصنف الخاصة إن وُجدت، وإلا نسبة الشركة الأساسية.'

export const CATALOG_SOURCE_NOTE =
  'الشركات والأصناف مصدرها المفوتر عبر الباك — هنا تحديد النسب فقط.'
