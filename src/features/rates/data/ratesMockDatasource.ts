/**
 * Mock — كتالوج الشركات/الأصناف يحاكي ما سيأتي من المفوتر عبر الباك لاحقاً.
 * النسب يديرها المشرف هنا فقط.
 */
import type {
  CatalogCompany,
  CatalogProduct,
  CompanyCommissionRate,
  PreviewCommissionInput,
  ProductCommissionRate,
  RateAuditEntry,
  RateStatus,
  RatesBoard,
  RatesSummary,
  UpsertCompanyRateInput,
  UpsertProductRateInput,
} from '../domain/rateEntities'
import {
  todayIsoDate,
  validateCompanyRateInput,
  validateProductRateInput,
} from '../domain/rateValidation'
import { resolveCommissionPreview } from '../domain/resolveCommission'
import type { RatesDatasource } from './ratesDatasource'

/** كتالوج مقروء فقط — مصدره المفوتر في الإنتاج */
const CATALOG_COMPANIES: CatalogCompany[] = [
  { id: 'c1', name: 'شركة دمشق فارما' },
  { id: 'c2', name: 'شركة ابن سينا' },
  { id: 'c3', name: 'شركة حلب ميديكال' },
  { id: 'c4', name: 'شركة الشام للدواء' },
]

const CATALOG_PRODUCTS: CatalogProduct[] = [
  { id: 'p1', name: 'باراسيتامول 500', companyId: 'c1', companyName: 'شركة دمشق فارما' },
  { id: 'p2', name: 'أموكسيسيلين 500', companyId: 'c1', companyName: 'شركة دمشق فارما' },
  { id: 'p3', name: 'فيتامين سي فوار', companyId: 'c2', companyName: 'شركة ابن سينا' },
  { id: 'p4', name: 'أوميغا 3', companyId: 'c2', companyName: 'شركة ابن سينا' },
  { id: 'p5', name: 'شراب سعال', companyId: 'c3', companyName: 'شركة حلب ميديكال' },
  { id: 'p6', name: 'قطرة عين', companyId: 'c4', companyName: 'شركة الشام للدواء' },
]

const REP_OPTIONS = [
  { id: 'r1', name: 'ياسين العمودي' },
  { id: 'r2', name: 'محمد الشهري' },
  { id: 'r3', name: 'سامر الحسن' },
]

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function refreshStatuses(
  rates: Array<{ status: RateStatus; startDate: string; endDate?: string }>,
): void {
  const today = todayIsoDate()
  for (const r of rates) {
    if (r.status === 'suspended') continue
    if (r.endDate && r.endDate < today) r.status = 'expired'
    else if (r.startDate <= today) r.status = 'active'
  }
}

function companyBasePercent(companyId: string): number {
  const today = todayIsoDate()
  const rate = companyRates.find(
    (r) =>
      r.companyId === companyId &&
      r.status === 'active' &&
      r.startDate <= today &&
      (!r.endDate || r.endDate >= today),
  )
  return rate?.percent ?? 0
}

function buildSummary(): RatesSummary {
  refreshStatuses(companyRates)
  refreshStatuses(productRates)
  const last = [...auditLog].sort((a, b) => b.at.localeCompare(a.at))[0]
  return {
    companiesCount: CATALOG_COMPANIES.length,
    activeCompanyRates: companyRates.filter((r) => r.status === 'active').length,
    specialProductRates: productRates.filter((r) => r.status === 'active').length,
    lastUpdatedAt: last?.at ?? null,
  }
}

function pushAudit(
  partial: Omit<RateAuditEntry, 'id' | 'at' | 'userName'>,
): void {
  auditLog.unshift({
    id: nextId('AUD'),
    at: nowIso(),
    userName: 'المشرف',
    ...partial,
  })
}

let companyRates: CompanyCommissionRate[] = [
  {
    id: 'CR-1',
    companyId: 'c1',
    companyName: 'شركة دمشق فارما',
    percent: 5,
    startDate: '2026-01-01',
    status: 'active',
    notes: 'نسبة أساسية',
    updatedAt: '2026-07-01T10:00:00',
  },
  {
    id: 'CR-2',
    companyId: 'c2',
    companyName: 'شركة ابن سينا',
    percent: 4.5,
    startDate: '2026-02-01',
    status: 'active',
    updatedAt: '2026-07-10T12:00:00',
  },
  {
    id: 'CR-3',
    companyId: 'c3',
    companyName: 'شركة حلب ميديكال',
    percent: 6,
    startDate: '2025-06-01',
    endDate: '2026-06-30',
    status: 'expired',
    updatedAt: '2026-06-30T18:00:00',
  },
]

let productRates: ProductCommissionRate[] = [
  {
    id: 'PR-1',
    productId: 'p1',
    productName: 'باراسيتامول 500',
    companyId: 'c1',
    companyName: 'شركة دمشق فارما',
    companyBasePercent: 5,
    percent: 7,
    startDate: '2026-03-01',
    status: 'active',
    notes: 'حملة موسمية',
    updatedAt: '2026-03-01T09:00:00',
  },
]

let auditLog: RateAuditEntry[] = [
  {
    id: 'AUD-1',
    at: '2026-03-01T09:00:00',
    userName: 'المشرف',
    companyName: 'شركة دمشق فارما',
    productName: 'باراسيتامول 500',
    previousPercent: null,
    newPercent: 7,
    action: 'create',
    note: 'نسبة خاصة',
  },
  {
    id: 'AUD-2',
    at: '2026-02-01T12:00:00',
    userName: 'المشرف',
    companyName: 'شركة ابن سينا',
    previousPercent: null,
    newPercent: 4.5,
    action: 'create',
  },
]

function snapshotBoard(): RatesBoard {
  refreshStatuses(companyRates)
  refreshStatuses(productRates)
  return {
    summary: buildSummary(),
    catalogCompanies: CATALOG_COMPANIES.map((c) => ({ ...c })),
    catalogProducts: CATALOG_PRODUCTS.map((p) => ({ ...p })),
    companyRates: companyRates.map((r) => ({ ...r })),
    productRates: productRates.map((r) => ({
      ...r,
      companyBasePercent: companyBasePercent(r.companyId),
    })),
    auditLog: auditLog.map((a) => ({ ...a })),
    repOptions: REP_OPTIONS.map((r) => ({ ...r })),
  }
}

export const ratesMockDatasource: RatesDatasource = {
  async getBoard() {
    return snapshotBoard()
  },

  async upsertCompanyRate(input: UpsertCompanyRateInput) {
    validateCompanyRateInput(input, companyRates)
    const company = CATALOG_COMPANIES.find((c) => c.id === input.companyId)
    if (!company) throw new Error('الشركة غير موجودة في كتالوج المفوتر')

    if (input.id) {
      const idx = companyRates.findIndex((r) => r.id === input.id)
      if (idx < 0) throw new Error('النسبة غير موجودة')
      const prev = companyRates[idx]
      companyRates[idx] = {
        ...prev,
        companyId: company.id,
        companyName: company.name,
        percent: input.percent,
        startDate: input.startDate.trim(),
        endDate: input.endDate?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        status: 'active',
        updatedAt: nowIso(),
      }
      pushAudit({
        companyName: company.name,
        previousPercent: prev.percent,
        newPercent: input.percent,
        action: 'update',
        note: input.notes,
      })
    } else {
      companyRates.unshift({
        id: nextId('CR'),
        companyId: company.id,
        companyName: company.name,
        percent: input.percent,
        startDate: input.startDate.trim(),
        endDate: input.endDate?.trim() || undefined,
        status: 'active',
        notes: input.notes?.trim() || undefined,
        updatedAt: nowIso(),
      })
      pushAudit({
        companyName: company.name,
        previousPercent: null,
        newPercent: input.percent,
        action: 'create',
        note: input.notes,
      })
    }
  },

  async suspendCompanyRate(id: string) {
    const row = companyRates.find((r) => r.id === id)
    if (!row) throw new Error('النسبة غير موجودة')
    const prev = row.percent
    row.status = 'suspended'
    row.updatedAt = nowIso()
    pushAudit({
      companyName: row.companyName,
      previousPercent: prev,
      newPercent: prev,
      action: 'suspend',
    })
  },

  async upsertProductRate(input: UpsertProductRateInput) {
    validateProductRateInput(input, productRates)
    const product = CATALOG_PRODUCTS.find((p) => p.id === input.productId)
    if (!product) throw new Error('الصنف غير موجود في كتالوج المفوتر')

    const base = companyBasePercent(product.companyId)

    if (input.id) {
      const idx = productRates.findIndex((r) => r.id === input.id)
      if (idx < 0) throw new Error('النسبة الخاصة غير موجودة')
      const prev = productRates[idx]
      productRates[idx] = {
        ...prev,
        productId: product.id,
        productName: product.name,
        companyId: product.companyId,
        companyName: product.companyName,
        companyBasePercent: base,
        percent: input.percent,
        startDate: input.startDate.trim(),
        endDate: input.endDate?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        status: 'active',
        updatedAt: nowIso(),
      }
      pushAudit({
        companyName: product.companyName,
        productName: product.name,
        previousPercent: prev.percent,
        newPercent: input.percent,
        action: 'update',
        note: input.notes,
      })
    } else {
      productRates.unshift({
        id: nextId('PR'),
        productId: product.id,
        productName: product.name,
        companyId: product.companyId,
        companyName: product.companyName,
        companyBasePercent: base,
        percent: input.percent,
        startDate: input.startDate.trim(),
        endDate: input.endDate?.trim() || undefined,
        status: 'active',
        notes: input.notes?.trim() || undefined,
        updatedAt: nowIso(),
      })
      pushAudit({
        companyName: product.companyName,
        productName: product.name,
        previousPercent: null,
        newPercent: input.percent,
        action: 'create',
        note: input.notes,
      })
    }
  },

  async suspendProductRate(id: string) {
    const row = productRates.find((r) => r.id === id)
    if (!row) throw new Error('النسبة الخاصة غير موجودة')
    row.status = 'suspended'
    row.updatedAt = nowIso()
    pushAudit({
      companyName: row.companyName,
      productName: row.productName,
      previousPercent: row.percent,
      newPercent: row.percent,
      action: 'suspend',
    })
  },

  async deleteProductRate(id: string) {
    const idx = productRates.findIndex((r) => r.id === id)
    if (idx < 0) throw new Error('النسبة الخاصة غير موجودة')
    const [removed] = productRates.splice(idx, 1)
    pushAudit({
      companyName: removed.companyName,
      productName: removed.productName,
      previousPercent: removed.percent,
      newPercent: null,
      action: 'delete',
    })
  },

  async previewCommission(input: PreviewCommissionInput) {
    return resolveCommissionPreview(input, companyRates, productRates)
  },
}
