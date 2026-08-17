import {
  downloadPdfFile,
  escapeHtml,
  openPdfDocument,
  pdfBrand,
  pdfDocumentStyles,
  wrapPdfDocument,
} from '../../../core/pdf/pdfDocument'
import type { WarehouseItem, WarehouseSummary } from '../domain/warehouseEntities'
import {
  availabilityLabel,
  dosageFormLabel,
  expiryLabel,
  formatIsoDate,
  money,
} from '../domain/warehouseLabels'

function sanitizeFileName(name: string, fallback: string): string {
  const base = name.trim() || fallback
  const cleaned = base.replace(/[<>:"/\\|?*]/g, '-').replace(/\.pdf$/i, '')
  return `${cleaned || fallback}.pdf`
}

function summaryHtml(summary: WarehouseSummary): string {
  return `
    <table class="info-table">
      <tr><td class="lbl">الشركات</td><td>${summary.companyCount}</td>
          <td class="lbl">الأصناف</td><td>${summary.itemCount}</td></tr>
      <tr><td class="lbl">منخفض</td><td>${summary.lowStockCount}</td>
          <td class="lbl">نافد</td><td>${summary.outOfStockCount}</td></tr>
      <tr><td class="lbl">قرب انتهاء</td><td>${summary.nearExpiryCount}</td>
          <td class="lbl">منتهٍ</td><td>${summary.expiredCount}</td></tr>
      <tr><td class="lbl">آخر تحديث</td><td colspan="3">${escapeHtml(summary.lastUpdatedAt.slice(0, 16).replace('T', ' '))}</td></tr>
    </table>
  `
}

function itemsTableHtml(items: WarehouseItem[]): string {
  const rows = items.length
    ? items
        .map(
          (i) => `<tr>
        <td>${escapeHtml(i.companyName)}</td>
        <td>${escapeHtml(i.name)}</td>
        <td>${escapeHtml(i.strength ?? '—')}</td>
        <td>${escapeHtml(dosageFormLabel(i.dosageForm))}</td>
        <td>${escapeHtml(i.scientificName ?? '—')}</td>
        <td>${i.quantity}</td>
        <td>${escapeHtml(money(i.netPrice))}</td>
        <td>${escapeHtml(money(i.sellingPrice))}</td>
        <td>${escapeHtml(i.productionDate ? formatIsoDate(i.productionDate) : '—')}</td>
        <td>${escapeHtml(formatIsoDate(i.expiryDate))}</td>
        <td>${escapeHtml(availabilityLabel(i.availability))}</td>
        <td>${escapeHtml(expiryLabel(i.expiryStatus))}</td>
      </tr>`,
        )
        .join('')
    : '<tr><td colspan="12">لا أصناف</td></tr>'

  return `
    <table class="items">
      <thead>
        <tr>
          <th>الشركة</th>
          <th>الصنف</th>
          <th>العيار</th>
          <th>النوع</th>
          <th>المادة العلمية</th>
          <th>الكمية</th>
          <th>سعر النت</th>
          <th>سعر المبيع</th>
          <th>الإنتاج</th>
          <th>الانتهاء</th>
          <th>المخزون</th>
          <th>الصلاحية</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildBody(
  items: WarehouseItem[],
  summary: WarehouseSummary,
  filterLabel: string,
): string {
  return `
    ${summaryHtml(summary)}
    <p class="doc-subtitle" style="text-align:right;margin:8px 0">النطاق: ${escapeHtml(filterLabel)} — عدد الصفوف: ${items.length}</p>
    ${itemsTableHtml(items)}
    <p class="doc-subtitle" style="text-align:right;margin-top:10px">مصدر البيانات: جرد المفوتر (قراءة فقط للمشرف)</p>
  `
}

function captureHtml(title: string, subtitle: string, bodyHtml: string): string {
  return `
    <style>${pdfDocumentStyles('landscape')}
      body { background:#fff !important; padding:0 !important; }
      .doc { box-shadow:none !important; max-width:100% !important; padding:16px !important; }
      .toolbar, .hint-print { display:none !important; }
    </style>
    <div class="doc" id="pdf-root" dir="rtl">
      <p class="brand-name">${escapeHtml(pdfBrand.warehouseName)}</p>
      <p class="brand-meta">${escapeHtml(pdfBrand.warehouseAddress)}</p>
      <hr class="brand-rule" />
      <p class="doc-title">${escapeHtml(title)}</p>
      <p class="doc-subtitle">${escapeHtml(subtitle)}</p>
      ${bodyHtml}
      <div class="footer">
        <span>${escapeHtml(pdfBrand.printedBy)}</span>
        <span>جرد عرضي (Landscape)</span>
      </div>
    </div>
  `
}

export async function exportWarehousePdf(options: {
  items: WarehouseItem[]
  summary: WarehouseSummary
  filterLabel: string
  fileName?: string
}): Promise<void> {
  const title = 'جرد المستودع'
  const subtitle = `تقرير أصناف — ${new Date().toLocaleDateString('ar-SY')}`
  const bodyHtml = buildBody(options.items, options.summary, options.filterLabel)
  const filename = sanitizeFileName(
    options.fileName ?? `جرد-المستودع-${todayStamp()}`,
    'جرد-المستودع',
  )
  await downloadPdfFile(
    captureHtml(title, subtitle, bodyHtml),
    filename,
    { orientation: 'landscape' },
  )
}

export function printWarehouseReport(options: {
  items: WarehouseItem[]
  summary: WarehouseSummary
  filterLabel: string
}): void {
  const title = 'جرد المستودع'
  const subtitle = `تقرير أصناف — ${new Date().toLocaleDateString('ar-SY')}`
  const bodyHtml = buildBody(options.items, options.summary, options.filterLabel)
  openPdfDocument(
    wrapPdfDocument({
      title,
      subtitle,
      bodyHtml,
      filename: `طباعة-جرد-${todayStamp()}`,
      orientation: 'landscape',
    }),
  )
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}
