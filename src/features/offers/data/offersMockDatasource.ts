import type {
  BasketStatus,
  CatalogProduct,
  OffersBoard,
  OffersSummary,
  PromotionalBasket,
  RegionOption,
  UpsertBasketInput,
} from '../domain/offerEntities'
import {
  validateBasketDraft,
  validateBasketForActivate,
} from '../domain/basketValidation'
import type { OffersDatasource } from './offersDatasource'

const CATALOG: CatalogProduct[] = [
  {
    id: 'PRD-001',
    name: 'أوجمنتين 1غ',
    companyName: 'شركة دمشق فارما',
    unitPrice: 18500,
    baseOfferLabel: '12+2',
  },
  {
    id: 'PRD-002',
    name: 'بنادول إكسترا',
    companyName: 'شركة دمشق فارما',
    unitPrice: 4200,
    baseOfferLabel: '10+1',
  },
  {
    id: 'PRD-003',
    name: 'كونكور 5مغ',
    companyName: 'شركة حلب ميديكال',
    unitPrice: 12500,
  },
  {
    id: 'PRD-004',
    name: 'ليبيتور 20مغ',
    companyName: 'شركة حلب ميديكال',
    unitPrice: 22000,
    baseOfferLabel: '6+1',
  },
  {
    id: 'PRD-006',
    name: 'بروفين 600',
    companyName: 'شركة ابن سينا',
    unitPrice: 3500,
  },
  {
    id: 'PRD-008',
    name: 'أموكسيسيلين 500',
    companyName: 'شركة الشام للدواء',
    unitPrice: 7800,
    baseOfferLabel: '20+2',
  },
]

const REP_OPTIONS = [
  { id: 'r1', name: 'ياسين العمودي' },
  { id: 'r2', name: 'محمد الشهري' },
  { id: 'r3', name: 'سامر الحسن' },
]

const REGION_OPTIONS: RegionOption[] = [
  {
    id: 'damascus',
    name: 'دمشق',
    subRegions: [
      { id: 'mazzeh', name: 'المزة' },
      { id: 'kafrsouseh', name: 'كفرسوسة' },
      { id: 'malki', name: 'المالكي' },
    ],
  },
  {
    id: 'rif-dimashq',
    name: 'ريف دمشق',
    subRegions: [
      { id: 'jaramana', name: 'جرمانا' },
      { id: 'qadsaya', name: 'قدسيا' },
    ],
  },
  {
    id: 'aleppo',
    name: 'حلب',
    subRegions: [
      { id: 'aziziyah', name: 'العزيزية' },
      { id: 'salahuddin', name: 'صلاح الدين' },
    ],
  },
]

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function normalizeStatus(b: PromotionalBasket): PromotionalBasket {
  if (
    b.status === 'archived' ||
    b.status === 'draft' ||
    b.status === 'suspended'
  ) {
    return b
  }
  if (b.endDate && b.endDate < today() && b.status === 'active') {
    return { ...b, status: 'expired' }
  }
  return b
}

function cloneTargeting(t: UpsertBasketInput['targeting']) {
  return {
    mode: t.mode,
    repIds: [...t.repIds],
    mainRegionIds: [...t.mainRegionIds],
    subRegionIds: [...t.subRegionIds],
  }
}

function withIds(input: UpsertBasketInput): PromotionalBasket {
  validateBasketDraft(input)
  const id = input.id ?? nextId('BASKET')
  return {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    notesForRep: input.notesForRep.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status ?? 'draft',
    paidItems: input.paidItems.map((p) => ({
      ...p,
      id: nextId('paid'),
    })),
    freeItems: input.freeItems.map((f) => ({
      ...f,
      id: nextId('free'),
    })),
    basketDiscountPercent: input.basketDiscountPercent,
    targeting: cloneTargeting(input.targeting),
    usageCount: 0,
    linkedOrdersCount: 0,
    createdAt: today(),
  }
}

function validateForActivate(b: PromotionalBasket) {
  validateBasketForActivate({
    name: b.name,
    startDate: b.startDate,
    endDate: b.endDate,
    paidItems: b.paidItems,
    freeItems: b.freeItems,
    basketDiscountPercent: b.basketDiscountPercent,
    targeting: b.targeting,
  })
}

let baskets: PromotionalBasket[] = [
  normalizeStatus({
    id: 'PROMO-001',
    name: 'عرض الشتاء — مسكنات',
    description: 'سلة ترويجية من المشرف (ليست عرضاً أساسياً من الجرد)',
    notesForRep: 'يُفضَّل تقديمها مع زيارة صيدليات دمشق',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    status: 'active',
    paidItems: [
      {
        id: 'p1',
        productId: 'PRD-002',
        productName: 'بنادول إكسترا',
        companyName: 'شركة دمشق فارما',
        quantity: 10,
        unitPrice: 4200,
        itemDiscountPercent: 5,
        baseOfferPolicy: 'ignore_base',
        baseOfferLabel: '10+1',
      },
      {
        id: 'p2',
        productId: 'PRD-006',
        productName: 'بروفين 600',
        companyName: 'شركة ابن سينا',
        quantity: 5,
        unitPrice: 3500,
        itemDiscountPercent: 10,
        baseOfferPolicy: 'ignore_base',
      },
    ],
    freeItems: [
      {
        id: 'f1',
        productId: 'PRD-006',
        productName: 'بروفين 600',
        companyName: 'شركة ابن سينا',
        freeQuantity: 1,
      },
    ],
    basketDiscountPercent: 0,
    targeting: {
      mode: 'all_reps',
      repIds: [],
      mainRegionIds: [],
      subRegionIds: [],
    },
    usageCount: 12,
    linkedOrdersCount: 8,
    createdAt: '2026-07-20',
    activatedAt: '2026-08-01',
  }),
  normalizeStatus({
    id: 'PROMO-002',
    name: 'عرض المضادات الحيوية',
    description: 'أوجمنتين + أموكسيسيلين بحسم وعرض مجاني',
    notesForRep: 'للصيدليات ذات الحركة العالية فقط',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'active',
    paidItems: [
      {
        id: 'p3',
        productId: 'PRD-001',
        productName: 'أوجمنتين 1غ',
        companyName: 'شركة دمشق فارما',
        quantity: 12,
        unitPrice: 18500,
        itemDiscountPercent: 0,
        baseOfferPolicy: 'use_base',
        baseOfferLabel: '12+2',
      },
      {
        id: 'p4',
        productId: 'PRD-008',
        productName: 'أموكسيسيلين 500',
        companyName: 'شركة الشام للدواء',
        quantity: 20,
        unitPrice: 7800,
        itemDiscountPercent: 3,
        baseOfferPolicy: 'ignore_base',
        baseOfferLabel: '20+2',
      },
    ],
    freeItems: [
      {
        id: 'f2',
        productId: 'PRD-001',
        productName: 'أوجمنتين 1غ',
        companyName: 'شركة دمشق فارما',
        freeQuantity: 2,
      },
    ],
    basketDiscountPercent: 2,
    targeting: {
      mode: 'selected_reps',
      repIds: ['r1', 'r2'],
      mainRegionIds: [],
      subRegionIds: [],
    },
    usageCount: 5,
    linkedOrdersCount: 4,
    createdAt: '2026-07-25',
    activatedAt: '2026-08-01',
  }),
  normalizeStatus({
    id: 'PROMO-003',
    name: 'عرض الضغط والكوليسترول',
    description: 'كونكور + ليبيتور',
    notesForRep: '',
    startDate: '2026-08-10',
    endDate: '2026-10-10',
    status: 'draft',
    paidItems: [
      {
        id: 'p5',
        productId: 'PRD-003',
        productName: 'كونكور 5مغ',
        companyName: 'شركة حلب ميديكال',
        quantity: 6,
        unitPrice: 12500,
        itemDiscountPercent: 0,
        baseOfferPolicy: 'ignore_base',
      },
      {
        id: 'p6',
        productId: 'PRD-004',
        productName: 'ليبيتور 20مغ',
        companyName: 'شركة حلب ميديكال',
        quantity: 6,
        unitPrice: 22000,
        itemDiscountPercent: 8,
        baseOfferPolicy: 'use_base',
        baseOfferLabel: '6+1',
      },
    ],
    freeItems: [],
    basketDiscountPercent: 1,
    targeting: {
      mode: 'regions',
      repIds: [],
      mainRegionIds: ['aleppo'],
      subRegionIds: ['aziziyah'],
    },
    usageCount: 0,
    linkedOrdersCount: 0,
    createdAt: '2026-08-10',
  }),
  normalizeStatus({
    id: 'PROMO-004',
    name: 'عرض موسمي متوقف',
    description: 'غير متاح حالياً',
    notesForRep: '',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    status: 'archived',
    paidItems: [
      {
        id: 'p7',
        productId: 'PRD-006',
        productName: 'بروفين 600',
        companyName: 'شركة ابن سينا',
        quantity: 10,
        unitPrice: 3500,
        itemDiscountPercent: 0,
        baseOfferPolicy: 'ignore_base',
      },
    ],
    freeItems: [
      {
        id: 'f3',
        productId: 'PRD-006',
        productName: 'بروفين 600',
        companyName: 'شركة ابن سينا',
        freeQuantity: 1,
      },
    ],
    basketDiscountPercent: 0,
    targeting: {
      mode: 'all_reps',
      repIds: [],
      mainRegionIds: [],
      subRegionIds: [],
    },
    usageCount: 20,
    linkedOrdersCount: 15,
    createdAt: '2026-05-15',
    activatedAt: '2026-06-01',
  }),
]

function summaryOf(list: PromotionalBasket[]): OffersSummary {
  const live = list.map(normalizeStatus)
  return {
    active: live.filter((b) => b.status === 'active').length,
    suspended: live.filter((b) => b.status === 'suspended').length,
    expired: live.filter((b) => b.status === 'expired').length,
    activeBaskets: live.filter((b) => b.status === 'active').length,
    sentToReps: live.filter(
      (b) => b.status === 'active' && Boolean(b.activatedAt),
    ).length,
  }
}

function board(): OffersBoard {
  baskets = baskets.map(normalizeStatus)
  return {
    baskets: baskets.map((b) => ({
      ...b,
      paidItems: [...b.paidItems],
      freeItems: [...b.freeItems],
      targeting: cloneTargeting(b.targeting),
    })),
    summary: summaryOf(baskets),
    catalog: [...CATALOG],
    repOptions: [...REP_OPTIONS],
    regionOptions: REGION_OPTIONS.map((r) => ({
      ...r,
      subRegions: [...r.subRegions],
    })),
  }
}

export const offersMockDatasource: OffersDatasource = {
  async getBoard() {
    return board()
  },

  async getById(id: string) {
    const found = baskets.map(normalizeStatus).find((b) => b.id === id)
    if (!found) throw new Error('السلة غير موجودة')
    return found
  },

  async upsertBasket(input: UpsertBasketInput) {
    validateBasketDraft(input)
    const name = input.name.trim()

    if (input.id) {
      const idx = baskets.findIndex((b) => b.id === input.id)
      if (idx < 0) throw new Error('السلة غير موجودة')
      const prev = baskets[idx]
      const next: PromotionalBasket = {
        ...prev,
        name,
        description: input.description.trim(),
        notesForRep: input.notesForRep.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status ?? prev.status,
        paidItems: input.paidItems.map((p) => ({
          ...p,
          id: nextId('paid'),
        })),
        freeItems: input.freeItems.map((f) => ({
          ...f,
          id: nextId('free'),
        })),
        basketDiscountPercent: input.basketDiscountPercent,
        targeting: cloneTargeting(input.targeting),
      }
      baskets = [
        ...baskets.slice(0, idx),
        normalizeStatus(next),
        ...baskets.slice(idx + 1),
      ]
      return baskets[idx]
    }

    const created = withIds({ ...input, status: input.status ?? 'draft' })
    baskets = [created, ...baskets]
    return created
  },

  async setStatus(id: string, status: BasketStatus) {
    const idx = baskets.findIndex((b) => b.id === id)
    if (idx < 0) throw new Error('السلة غير موجودة')
    baskets = [
      ...baskets.slice(0, idx),
      { ...baskets[idx], status },
      ...baskets.slice(idx + 1),
    ]
  },

  async activateBasket(id: string) {
    const idx = baskets.findIndex((b) => b.id === id)
    if (idx < 0) throw new Error('السلة غير موجودة')
    const current = normalizeStatus(baskets[idx])
    validateForActivate(current)
    baskets = [
      ...baskets.slice(0, idx),
      {
        ...current,
        status: 'active',
        activatedAt: today(),
      },
      ...baskets.slice(idx + 1),
    ]
  },

  async duplicateBasket(id: string) {
    const src = baskets.find((b) => b.id === id)
    if (!src) throw new Error('السلة غير موجودة')
    const copy = withIds({
      name: `${src.name} (نسخة)`,
      description: src.description,
      notesForRep: src.notesForRep,
      startDate: today(),
      endDate: src.endDate < today() ? today() : src.endDate,
      status: 'draft',
      paidItems: src.paidItems.map(({ id: _id, ...rest }) => rest),
      freeItems: src.freeItems.map(({ id: _id, ...rest }) => rest),
      basketDiscountPercent: src.basketDiscountPercent,
      targeting: cloneTargeting(src.targeting),
    })
    baskets = [copy, ...baskets]
    return copy
  },
}
