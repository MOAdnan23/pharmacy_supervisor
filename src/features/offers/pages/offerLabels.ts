import type { BasketStatus, TargetMode } from '../domain/offerEntities'

export function basketStatusLabel(status: BasketStatus): string {
  switch (status) {
    case 'draft':
      return 'مسودة'
    case 'active':
      return 'فعّالة'
    case 'suspended':
      return 'موقوفة'
    case 'expired':
      return 'منتهية'
    case 'archived':
      return 'مؤرشفة'
  }
}

export function basketStatusClass(status: BasketStatus): string {
  if (status === 'active') return 'ok'
  if (status === 'draft') return 'draft'
  if (status === 'expired' || status === 'archived') return 'mute'
  return 'stop'
}

export function targetModeLabel(mode: TargetMode): string {
  if (mode === 'all_reps') return 'كل المندوبين'
  if (mode === 'selected_reps') return 'مندوبون محددون'
  return 'مناطق محددة'
}
