/**
 * Mock — يحاكي جرد المفوتر (شركات + أصناف + حركات + ملف جرد مرفوع)
 */
import type {
  AddItemNoteInput,
  ExternalInventoryFile,
  ItemNote,
  WarehouseBoard,
  WarehouseCompany,
  WarehouseItem,
  WarehouseMovement,
} from '../domain/warehouseEntities'
import { LOW_STOCK_THRESHOLD } from '../domain/warehouseEntities'
import {
  WAREHOUSE_RULES,
  computeAvailability,
  computeExpiryStatus,
  requireNoteText,
  todayIsoDate,
} from '../domain/warehouseLabels'
import type { WarehouseDatasource } from './warehouseDatasource'

const SUPERVISOR_NAME = 'المشرف'

type ItemSeed = Omit<
  WarehouseItem,
  'availability' | 'expiryStatus' | 'daysToExpiry' | 'notesCount'
>

const ITEM_SEEDS: ItemSeed[] = [
  {
    id: 'p1',
    name: 'باراسيتامول',
    companyId: 'c1',
    companyName: 'شركة دمشق فارما',
    scientificName: 'Paracetamol',
    strength: '500mg',
    dosageForm: 'tablet',
    quantity: 420,
    alertThreshold: LOW_STOCK_THRESHOLD,
    netPrice: 800,
    sellingPrice: 1200,
    purchaseDate: '2026-05-01',
    productionDate: '2026-03-15',
    expiryDate: '2028-03-15',
    promotionLabel: '10 + 1',
    visibleToRep: true,
    updatedAt: '2026-08-16T09:00:00',
  },
  {
    id: 'p2',
    name: 'أموكسيسيلين',
    companyId: 'c1',
    companyName: 'شركة دمشق فارما',
    scientificName: 'Amoxicillin',
    strength: '500mg',
    dosageForm: 'capsule',
    quantity: 85,
    alertThreshold: LOW_STOCK_THRESHOLD,
    netPrice: 2200,
    sellingPrice: 3100,
    purchaseDate: '2026-04-20',
    productionDate: '2026-02-01',
    expiryDate: '2026-10-20',
    visibleToRep: true,
    updatedAt: '2026-08-15T11:20:00',
  },
  {
    id: 'p3',
    name: 'فيتامين سي فوار',
    companyId: 'c2',
    companyName: 'شركة ابن سينا',
    scientificName: 'Ascorbic acid',
    strength: '1000mg',
    dosageForm: 'tablet',
    quantity: 260,
    alertThreshold: LOW_STOCK_THRESHOLD,
    netPrice: 1500,
    sellingPrice: 2200,
    purchaseDate: '2026-06-10',
    productionDate: '2026-04-01',
    expiryDate: '2027-04-01',
    promotionLabel: '12 + 2',
    visibleToRep: true,
    updatedAt: '2026-08-14T16:00:00',
  },
  {
    id: 'p4',
    name: 'أوميغا 3',
    companyId: 'c2',
    companyName: 'شركة ابن سينا',
    scientificName: 'Omega-3',
    strength: '1000mg',
    dosageForm: 'capsule',
    quantity: 0,
    alertThreshold: LOW_STOCK_THRESHOLD,
    netPrice: 4000,
    sellingPrice: 5600,
    purchaseDate: '2026-03-01',
    productionDate: '2025-11-01',
    expiryDate: '2026-09-01',
    visibleToRep: true,
    updatedAt: '2026-08-12T10:00:00',
  },
  {
    id: 'p5',
    name: 'شراب سعال',
    companyId: 'c3',
    companyName: 'شركة حلب ميديكال',
    scientificName: 'Dextromethorphan',
    dosageForm: 'syrup',
    quantity: 55,
    alertThreshold: LOW_STOCK_THRESHOLD,
    netPrice: 1800,
    sellingPrice: 2500,
    purchaseDate: '2026-05-18',
    productionDate: '2026-01-10',
    expiryDate: '2026-08-25',
    visibleToRep: true,
    updatedAt: '2026-08-16T08:30:00',
  },
  {
    id: 'p6',
    name: 'قطرة عين',
    companyId: 'c4',
    companyName: 'شركة الشام للدواء',
    scientificName: 'Artificial tears',
    dosageForm: 'other',
    quantity: 190,
    alertThreshold: LOW_STOCK_THRESHOLD,
    netPrice: 1200,
    sellingPrice: 1800,
    purchaseDate: '2026-07-01',
    productionDate: '2026-05-01',
    expiryDate: '2027-11-01',
    visibleToRep: true,
    updatedAt: '2026-08-10T13:00:00',
  },
  {
    id: 'p7',
    name: 'إيبوبروفين',
    companyId: 'c1',
    companyName: 'شركة دمشق فارما',
    scientificName: 'Ibuprofen',
    strength: '400mg',
    dosageForm: 'tablet',
    quantity: 310,
    alertThreshold: LOW_STOCK_THRESHOLD,
    netPrice: 900,
    sellingPrice: 1400,
    purchaseDate: '2026-06-22',
    productionDate: '2026-04-12',
    expiryDate: '2028-01-12',
    visibleToRep: true,
    updatedAt: '2026-08-13T09:40:00',
  },
  {
    id: 'p8',
    name: 'أنسولين',
    companyId: 'c3',
    companyName: 'شركة حلب ميديكال',
    scientificName: 'Insulin',
    dosageForm: 'vial',
    quantity: 40,
    alertThreshold: 50,
    netPrice: 12000,
    sellingPrice: 15500,
    purchaseDate: '2026-07-20',
    productionDate: '2026-06-01',
    expiryDate: '2026-11-15',
    visibleToRep: false,
    updatedAt: '2026-08-16T07:15:00',
  },
  {
    id: 'p9',
    name: 'ميتفورمين',
    companyId: 'c2',
    companyName: 'شركة ابن سينا',
    scientificName: 'Metformin',
    strength: '850mg',
    dosageForm: 'tablet',
    quantity: 500,
    alertThreshold: LOW_STOCK_THRESHOLD,
    netPrice: 1100,
    sellingPrice: 1600,
    purchaseDate: '2026-02-14',
    productionDate: '2025-12-01',
    expiryDate: '2027-12-01',
    visibleToRep: true,
    updatedAt: '2026-08-11T12:00:00',
  },
  {
    id: 'p10',
    name: 'سيتريزين',
    companyId: 'c4',
    companyName: 'شركة الشام للدواء',
    scientificName: 'Cetirizine',
    strength: '10mg',
    dosageForm: 'tablet',
    quantity: 18,
    alertThreshold: LOW_STOCK_THRESHOLD,
    netPrice: 700,
    sellingPrice: 1100,
    purchaseDate: '2026-01-08',
    productionDate: '2025-09-01',
    expiryDate: '2026-07-01',
    visibleToRep: true,
    updatedAt: '2026-08-09T15:00:00',
  },
]

let notes: ItemNote[] = [
  {
    id: 'N-1',
    itemId: 'p5',
    itemName: 'شراب سعال',
    companyName: 'شركة حلب ميديكال',
    type: 'alert',
    text: 'قرب انتهاء الصلاحية — يُفضّل تنبيه المفوتر للتصريف.',
    createdAt: '2026-08-14T10:00:00',
    createdBy: SUPERVISOR_NAME,
  },
]

let movements: WarehouseMovement[] = [
  {
    id: 'MOV-1',
    productId: 'p1',
    productName: 'باراسيتامول 500mg',
    type: 'رصيد افتتاحي',
    quantityDelta: 500,
    createdAt: '2026-05-01T09:00:00',
    createdBy: 'المفوتر',
  },
  {
    id: 'MOV-2',
    productId: 'p1',
    productName: 'باراسيتامول 500mg',
    type: 'خصم فاتورة بيع',
    quantityDelta: -80,
    createdAt: '2026-08-05T14:20:00',
    createdBy: 'النظام',
    notes: 'INV-2026-0101',
  },
  {
    id: 'MOV-3',
    productId: 'p4',
    productName: 'أوميغا 3',
    type: 'خصم فاتورة بيع',
    quantityDelta: -40,
    createdAt: '2026-08-12T10:00:00',
    createdBy: 'النظام',
  },
  {
    id: 'MOV-4',
    productId: 'p8',
    productName: 'أنسولين',
    type: 'إضافة إلى الجرد',
    quantityDelta: 40,
    createdAt: '2026-07-20T11:00:00',
    createdBy: 'المفوتر',
  },
]

const externalFiles: ExternalInventoryFile[] = [
  {
    id: 'EF-1',
    fileName: 'جرد-آب-2026.pdf',
    uploadedAt: '2026-08-10T18:00:00',
    uploadedBy: 'المفوتر',
    notes: 'جرد خارجي معتمد ومتاح للمشرف',
  },
  {
    id: 'EF-2',
    fileName: 'جرد-تموز-2026.pdf',
    uploadedAt: '2026-07-28T16:30:00',
    uploadedBy: 'المفوتر',
    notes: 'نسخة أرشيفية',
  },
]

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function hydrateItem(seed: ItemSeed): WarehouseItem {
  const { status, daysToExpiry } = computeExpiryStatus(seed.expiryDate)
  return {
    ...seed,
    availability: computeAvailability(seed.quantity, seed.alertThreshold),
    expiryStatus: status,
    daysToExpiry,
    notesCount: notes.filter((n) => n.itemId === seed.id).length,
  }
}

function buildItems(): WarehouseItem[] {
  return ITEM_SEEDS.map(hydrateItem)
}

function buildCompanies(items: WarehouseItem[]): WarehouseCompany[] {
  const map = new Map<string, WarehouseCompany>()
  for (const item of items) {
    let row = map.get(item.companyId)
    if (!row) {
      row = {
        id: item.companyId,
        name: item.companyName,
        location: item.companyId === 'c3' ? 'حلب' : 'دمشق',
        isActive: true,
        itemCount: 0,
        availableCount: 0,
        lowStockCount: 0,
        nearExpiryCount: 0,
      }
      map.set(item.companyId, row)
    }
    row.itemCount += 1
    if (item.availability === 'available') row.availableCount += 1
    if (
      item.availability === 'low_stock' ||
      item.availability === 'out_of_stock'
    ) {
      row.lowStockCount += 1
    }
    if (item.expiryStatus !== 'valid') row.nearExpiryCount += 1
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'))
}

function buildBoard(): WarehouseBoard {
  const items = buildItems()
  const companies = buildCompanies(items)
  const lastUpdatedAt = items
    .map((i) => i.updatedAt)
    .sort()
    .at(-1) ?? `${todayIsoDate()}T00:00:00`

  return {
    summary: {
      companyCount: companies.length,
      itemCount: items.length,
      lowStockCount: items.filter((i) => i.availability === 'low_stock').length,
      outOfStockCount: items.filter((i) => i.availability === 'out_of_stock')
        .length,
      nearExpiryCount: items.filter((i) => i.expiryStatus === 'near_expiry')
        .length,
      expiredCount: items.filter((i) => i.expiryStatus === 'expired').length,
      lastUpdatedAt,
    },
    items,
    companies,
    movements: [...movements].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
    externalFiles: [...externalFiles],
    notes: [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    dataSourceNote: WAREHOUSE_RULES.sourceNote,
  }
}

export const warehouseMockDatasource: WarehouseDatasource = {
  async getBoard() {
    return buildBoard()
  },

  async addItemNote(input: AddItemNoteInput) {
    const text = requireNoteText(input.text)
    const item = ITEM_SEEDS.find((i) => i.id === input.itemId)
    if (!item) throw new Error('الصنف غير موجود')
    notes.unshift({
      id: nextId('N'),
      itemId: item.id,
      itemName: item.name,
      companyName: item.companyName,
      type: input.type,
      text,
      createdAt: new Date().toISOString(),
      createdBy: SUPERVISOR_NAME,
    })
    return 'تم حفظ الملاحظة بنجاح'
  },
}
