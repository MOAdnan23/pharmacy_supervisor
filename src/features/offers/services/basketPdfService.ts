/**
 * PDF / طباعة سلة ترويجية — بنفس شكل مستندات المفوتر (ترويسة + جدول + ملخص).
 */
import {
  downloadPdfFile,
  escapeHtml,
  formatPdfMoney,
  openPdfDocument,
  pdfDocumentStyles,
  wrapPdfDocument,
  pdfBrand,
} from '../../../core/pdf/pdfDocument'
import type { PromotionalBasket } from '../domain/offerEntities'
import { paidLineTotal } from '../domain/offerEntities'
import {
  basketStatusLabel,
  targetModeLabel,
} from '../pages/offerLabels'

export type BasketPdfContext = {
  basket: PromotionalBasket
  targetNames: string
  /** اسم الملف الذي يختاره المستخدم (بدون أو مع .pdf) */
  fileName?: string
}

function infoRow(label: string, value: string): string {
  return `<tr><td class="lbl">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
}

function buildBody(ctx: BasketPdfContext): string {
  const { basket, targetNames } = ctx
  const paidRows = basket.paidItems
    .map((line) => {
      const total = paidLineTotal(line)
      return `<tr>
        <td>${escapeHtml(line.productName)}</td>
        <td>${escapeHtml(line.companyName)}</td>
        <td>${line.quantity}</td>
        <td>—</td>
        <td>${escapeHtml(formatPdfMoney(line.unitPrice))}</td>
        <td>${line.itemDiscountPercent > 0 ? `${line.itemDiscountPercent}%` : '—'}</td>
        <td>${escapeHtml(formatPdfMoney(total))}</td>
      </tr>`
    })
    .join('')

  const freeRows = basket.freeItems
    .map(
      (line) => `<tr>
        <td>${escapeHtml(line.productName)}</td>
        <td>${escapeHtml(line.companyName)}</td>
        <td>—</td>
        <td>${line.freeQuantity}</td>
        <td>${escapeHtml(formatPdfMoney(0))}</td>
        <td>—</td>
        <td>${escapeHtml(formatPdfMoney(0))}</td>
      </tr>`,
    )
    .join('')

  const subtotal = basket.paidItems.reduce((s, i) => s + paidLineTotal(i), 0)
  const basketDiscount =
    (subtotal * (basket.basketDiscountPercent || 0)) / 100
  const net = Math.max(0, subtotal - basketDiscount)

  const now = new Date()
  const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return `
    <div class="meta-row">
      <span>رقم السلة: ${escapeHtml(basket.id)}</span>
      <span>التاريخ: ${escapeHtml(dateStr)}</span>
    </div>
    <table class="info-table">
      ${infoRow('اسم السلة', basket.name)}
      ${infoRow('الوصف', basket.description || '—')}
      ${infoRow('الحالة', basketStatusLabel(basket.status))}
      ${infoRow('الفترة', `${basket.startDate} → ${basket.endDate}`)}
      ${infoRow('الاستهداف', `${targetModeLabel(basket.targeting.mode)} — ${targetNames || '—'}`)}
      ${infoRow('ملاحظات للمندوب', basket.notesForRep || '—')}
    </table>

    <table class="data-table">
      <thead>
        <tr>
          <th>المادة</th>
          <th>الشركة</th>
          <th>الكمية</th>
          <th>البونص</th>
          <th>السعر</th>
          <th>الحسم %</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${paidRows || '<tr><td colspan="7">لا أصناف مدفوعة</td></tr>'}
        ${freeRows}
      </tbody>
    </table>

    <div class="summary">
      <hr class="divider" />
      <div class="summary-row">
        <span>إجمالي الأصناف</span>
        <span>${escapeHtml(formatPdfMoney(subtotal))}</span>
      </div>
      <div class="summary-row">
        <span>إجمالي الحسم (حسم السلة ${basket.basketDiscountPercent}%)</span>
        <span>${escapeHtml(formatPdfMoney(basketDiscount))}</span>
      </div>
      <div class="summary-row bold">
        <span>صافي السلة</span>
        <span>${escapeHtml(formatPdfMoney(net))}</span>
      </div>
    </div>
  `
}

function sanitizeFileName(raw: string, fallback: string): string {
  const cleaned = raw
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
  const base = cleaned || fallback
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`
}

function documentParts(ctx: BasketPdfContext) {
  return {
    title: 'سلة ترويجية',
    subtitle: `رقم المستند: ${ctx.basket.id}`,
    bodyHtml: buildBody(ctx),
    filename: sanitizeFileName(
      ctx.fileName ?? ctx.basket.name,
      ctx.basket.id,
    ),
  }
}

/** تنزيل ملف PDF إلى الجهاز */
export async function exportBasketPdf(ctx: BasketPdfContext): Promise<void> {
  const parts = documentParts(ctx)
  const captureHtml = `
    <style>${pdfDocumentStyles()}
      body { background:#fff !important; padding:0 !important; }
      .doc { box-shadow:none !important; max-width:100% !important; padding:24px !important; }
      .toolbar, .hint-print { display:none !important; }
    </style>
    <div class="doc" id="pdf-root" dir="rtl">
      <p class="brand-name">${escapeHtml(pdfBrand.warehouseName)}</p>
      <p class="brand-meta">${escapeHtml(pdfBrand.warehouseAddress)}</p>
      <p class="brand-meta">هاتف: ${escapeHtml(pdfBrand.warehousePhone)}</p>
      <hr class="brand-rule" />
      <p class="doc-title">${escapeHtml(parts.title)}</p>
      <p class="doc-subtitle">${escapeHtml(parts.subtitle)}</p>
      ${parts.bodyHtml}
      <div class="footer">
        <span>${escapeHtml(pdfBrand.printedBy)}</span>
        <span>صفحة 1 من 1</span>
      </div>
    </div>
  `
  await downloadPdfFile(captureHtml, parts.filename)
}

/** طباعة النموذج في نافذة منفصلة */
export function printBasket(ctx: BasketPdfContext): void {
  const parts = documentParts(ctx)
  const html = wrapPdfDocument({
    ...parts,
    filename: `طباعة-${ctx.basket.id}`,
  })
  openPdfDocument(html)
}
