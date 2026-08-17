/**
 * المستودع للمشرف — UC-114 → UC-123
 * بيانات الأصناف/الشركات من المفوتر؛ المشرف قراءة + ملاحظات فقط.
 */

export type StockAvailability = 'available' | 'low_stock' | 'out_of_stock'

export type ExpiryStatus = 'valid' | 'near_expiry' | 'expired'

export type ItemNoteType = 'follow_up' | 'alert' | 'admin'

export type DosageForm = 'tablet' | 'capsule' | 'syrup' | 'vial' | 'other'

export type WarehouseCompany = {
  id: string
  name: string
  location?: string
  contact?: string
  isActive: boolean
  itemCount: number
  availableCount: number
  lowStockCount: number
  nearExpiryCount: number
}

export type WarehouseItem = {
  id: string
  name: string
  companyId: string
  companyName: string
  scientificName?: string
  strength?: string
  dosageForm?: DosageForm
  quantity: number
  /** حد التنبيه للكمية المنخفضة */
  alertThreshold: number
  netPrice: number
  sellingPrice: number
  purchaseDate: string
  productionDate?: string
  expiryDate: string
  promotionLabel?: string
  visibleToRep: boolean
  availability: StockAvailability
  expiryStatus: ExpiryStatus
  daysToExpiry: number
  updatedAt: string
  notesCount: number
}

export type WarehouseMovement = {
  id: string
  productId: string
  productName: string
  type: string
  quantityDelta: number
  createdAt: string
  createdBy: string
  notes?: string
}

export type ExternalInventoryFile = {
  id: string
  fileName: string
  uploadedAt: string
  uploadedBy: string
  notes?: string
  /** في Mock: لا ملف حقيقي — للعرض فقط */
  downloadUrl?: string
}

export type ItemNote = {
  id: string
  itemId: string
  itemName: string
  companyName: string
  type: ItemNoteType
  text: string
  createdAt: string
  createdBy: string
}

export type WarehouseSummary = {
  companyCount: number
  itemCount: number
  lowStockCount: number
  outOfStockCount: number
  nearExpiryCount: number
  expiredCount: number
  lastUpdatedAt: string
}

export type WarehouseBoard = {
  summary: WarehouseSummary
  items: WarehouseItem[]
  companies: WarehouseCompany[]
  movements: WarehouseMovement[]
  externalFiles: ExternalInventoryFile[]
  notes: ItemNote[]
  /** مصدر البيانات — للتوضيح في الواجهة */
  dataSourceNote: string
}

export type AddItemNoteInput = {
  itemId: string
  type: ItemNoteType
  text: string
}

/** مطابق تقريباً لعتبة المفوتر */
export const LOW_STOCK_THRESHOLD = 100
export const NEAR_EXPIRY_DAYS = 90
