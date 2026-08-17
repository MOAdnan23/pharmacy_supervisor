import { describe, expect, it } from 'vitest'
import {
  requireNonEmpty,
  validateBasketDraft,
  validateBasketForActivate,
  validateDates,
  validateFreeItems,
  validatePaidItems,
  validatePercent,
  validateTargeting,
} from './basketValidation'
import type { UpsertBasketInput } from './offerEntities'
import { paidLineTotal } from './offerEntities'
import { offersMockDatasource } from '../data/offersMockDatasource'

const baseTargeting = {
  mode: 'all_reps' as const,
  repIds: [] as string[],
  mainRegionIds: [] as string[],
  subRegionIds: [] as string[],
}

function validPaid() {
  return {
    productId: 'PRD-001',
    productName: 'أوجمنتين',
    companyName: 'شركة دمشق فارما',
    quantity: 2,
    unitPrice: 1000,
    itemDiscountPercent: 0,
    baseOfferPolicy: 'ignore_base' as const,
  }
}

function validDraft(
  overrides: Partial<UpsertBasketInput> = {},
): UpsertBasketInput {
  return {
    name: 'سلة اختبار',
    description: 'وصف',
    notesForRep: '',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    paidItems: [validPaid()],
    freeItems: [],
    basketDiscountPercent: 5,
    targeting: { ...baseTargeting },
    ...overrides,
  }
}

describe('تحقق الحقول الفارغة والأساسية', () => {
  it('يرفض الاسم الفارغ أو المسافات فقط', () => {
    expect(() => requireNonEmpty('', 'اسم السلة')).toThrow(/فارغاً/)
    expect(() => requireNonEmpty('   ', 'اسم السلة')).toThrow(/فارغاً/)
    expect(requireNonEmpty('  عرض  ', 'اسم السلة')).toBe('عرض')
  })

  it('يرفض التواريخ الفارغة والترتيب الخاطئ', () => {
    expect(() => validateDates('', '2026-08-01')).toThrow(/البداية/)
    expect(() => validateDates('2026-08-01', '')).toThrow(/النهاية/)
    expect(() => validateDates('2026-08-10', '2026-08-01')).toThrow(/بعد/)
    expect(() => validateDates('2026-08-01', '2026-08-01')).not.toThrow()
  })

  it('يرفض نسبة خارج 0–100', () => {
    expect(() => validatePercent(-1, 'حسم')).toThrow()
    expect(() => validatePercent(101, 'حسم')).toThrow()
    expect(() => validatePercent(50, 'حسم')).not.toThrow()
  })
})

describe('تحقق الأصناف', () => {
  it('يرفض صنفاً مدفوعاً بدون منتج أو كمية/سعر غير صالح', () => {
    expect(() =>
      validatePaidItems([
        {
          ...validPaid(),
          productId: '',
          productName: '',
        },
      ]),
    ).toThrow(/صالحاً/)

    expect(() =>
      validatePaidItems([{ ...validPaid(), quantity: 0 }]),
    ).toThrow(/الكمية/)

    expect(() =>
      validatePaidItems([{ ...validPaid(), unitPrice: -5 }]),
    ).toThrow(/السعر/)

    expect(() =>
      validatePaidItems([{ ...validPaid(), itemDiscountPercent: 120 }]),
    ).toThrow(/حسم/)
  })

  it('يرفض صنفاً مجانياً بكمية فارغة/صفر', () => {
    expect(() =>
      validateFreeItems([
        {
          productId: 'PRD-1',
          productName: 'مجاني',
          companyName: 'شركة',
          freeQuantity: 0,
        },
      ]),
    ).toThrow(/المجانية/)
  })

  it('يحسب إجمالي السطر مع الحسم', () => {
    expect(
      paidLineTotal({ quantity: 10, unitPrice: 100, itemDiscountPercent: 10 }),
    ).toBe(900)
  })
})

describe('تحقق الاستهداف', () => {
  it('يرفض مندوبين محددين بدون اختيار', () => {
    expect(() =>
      validateTargeting({
        mode: 'selected_reps',
        repIds: [],
        mainRegionIds: [],
        subRegionIds: [],
      }),
    ).toThrow(/مندوباً/)
  })

  it('يرفض مناطق بدون رئيسية/فرعية', () => {
    expect(() =>
      validateTargeting({
        mode: 'regions',
        repIds: [],
        mainRegionIds: [],
        subRegionIds: [],
      }),
    ).toThrow(/منطقة/)
  })

  it('يرفض رئيسية بدون فرعية', () => {
    expect(() =>
      validateTargeting({
        mode: 'regions',
        repIds: [],
        mainRegionIds: ['damascus'],
        subRegionIds: [],
      }),
    ).toThrow(/فرعية/)
  })

  it('يقبل كل المندوبين', () => {
    expect(() => validateTargeting(baseTargeting)).not.toThrow()
  })
})

describe('تحقق المسودة والتفعيل', () => {
  it('يرفض مسودة باسم فارغ', () => {
    expect(() => validateBasketDraft(validDraft({ name: '   ' }))).toThrow(
      /اسم السلة/,
    )
  })

  it('يرفض التفعيل بدون أصناف مدفوعة', () => {
    expect(() =>
      validateBasketForActivate({
        ...validDraft({ paidItems: [], freeItems: [] }),
      }),
    ).toThrow(/غير مكتملة|مدفوعاً/)
  })

  it('يقبل تفعيل سلة مكتملة', () => {
    expect(() =>
      validateBasketForActivate({
        name: 'سلة',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        paidItems: [validPaid()],
        freeItems: [],
        basketDiscountPercent: 0,
        targeting: baseTargeting,
      }),
    ).not.toThrow()
  })
})

describe('Mock datasource — سيناريوهات كاملة', () => {
  it('يرفض إنشاء سلة باسم فارغ', async () => {
    await expect(
      offersMockDatasource.upsertBasket(validDraft({ name: '' })),
    ).rejects.toThrow(/اسم السلة/)
  })

  it('يرفض تواريخ فارغة', async () => {
    await expect(
      offersMockDatasource.upsertBasket(
        validDraft({ startDate: '', endDate: '2026-08-01' }),
      ),
    ).rejects.toThrow(/البداية/)
  })

  it('ينشئ مسودة صالحة ثم يفعّلها', async () => {
    const created = await offersMockDatasource.upsertBasket(
      validDraft({ name: `اختبار-${Date.now()}` }),
    )
    expect(created.status).toBe('draft')
    await offersMockDatasource.activateBasket(created.id)
    const loaded = await offersMockDatasource.getById(created.id)
    expect(loaded.status).toBe('active')
    expect(loaded.activatedAt).toBeTruthy()
  })

  it('يرفض تفعيل سلة بدون استهداف مندوبين عند الوضع المحدد', async () => {
    const created = await offersMockDatasource.upsertBasket(
      validDraft({
        name: `استهداف-${Date.now()}`,
        targeting: {
          mode: 'selected_reps',
          repIds: [],
          mainRegionIds: [],
          subRegionIds: [],
        },
      }),
    )
    await expect(
      offersMockDatasource.activateBasket(created.id),
    ).rejects.toThrow(/مندوباً/)
  })

  it('يوقف ويؤرشف سلة', async () => {
    const board = await offersMockDatasource.getBoard()
    const active = board.baskets.find((b) => b.status === 'active')
    expect(active).toBeTruthy()
    await offersMockDatasource.setStatus(active!.id, 'suspended')
    expect((await offersMockDatasource.getById(active!.id)).status).toBe(
      'suspended',
    )
    await offersMockDatasource.setStatus(active!.id, 'archived')
    expect((await offersMockDatasource.getById(active!.id)).status).toBe(
      'archived',
    )
  })

  it('ينسخ من الأرشيف كمسودة', async () => {
    const board = await offersMockDatasource.getBoard()
    const archived = board.baskets.find((b) => b.status === 'archived')
    expect(archived).toBeTruthy()
    const copy = await offersMockDatasource.duplicateBasket(archived!.id)
    expect(copy.status).toBe('draft')
    expect(copy.name).toContain('نسخة')
  })

  it('يعيد لوحة تحتوي ملخصاً وكتالوجاً ومناطق بفرعيات', async () => {
    const board = await offersMockDatasource.getBoard()
    expect(board.summary.active).toBeGreaterThanOrEqual(0)
    expect(board.catalog.length).toBeGreaterThan(0)
    expect(board.catalog[0].unitPrice).toBeGreaterThan(0)
    expect(board.regionOptions[0].subRegions.length).toBeGreaterThan(0)
  })
})
