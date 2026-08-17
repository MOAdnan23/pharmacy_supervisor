/**
 * PDF كشوف المالية — بنفس أسلوب مستندات المفوتر
 */
import {
  downloadPdfFile,
  escapeHtml,
  formatPdfMoney,
  openPdfDocument,
  pdfBrand,
  pdfDocumentStyles,
  wrapPdfDocument,
} from '../../../core/pdf/pdfDocument'
import type {
  FinanceDashboardData,
  FinanceFilter,
  FinancialMovement,
  PharmacyFinanceRow,
} from '../domain/financeEntities'
import { isDebtor, money, movementTypeLabel } from '../domain/financeLabels'

function infoRow(label: string, value: string): string {
  return `<tr><td class="lbl">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
}

function captureHtml(title: string, subtitle: string, bodyHtml: string): string {
  return `
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
      <p class="doc-title">${escapeHtml(title)}</p>
      <p class="doc-subtitle">${escapeHtml(subtitle)}</p>
      ${bodyHtml}
      <div class="footer">
        <span>${escapeHtml(pdfBrand.printedBy)}</span>
        <span>صفحة 1 من 1</span>
      </div>
    </div>
  `
}

export async function exportPharmacyStatementPdf(opts: {
  pharmacy: PharmacyFinanceRow
  movements: FinancialMovement[]
  filter: FinanceFilter
  repName?: string
  print?: boolean
  fileName?: string
}): Promise<void> {
  const { pharmacy, movements, filter, repName, print, fileName } = opts
  const title = repName
    ? `كشف حساب صيدلية — للمندوب ${repName}`
    : 'كشف حساب صيدلية'
  const subtitle = pharmacy.pharmacyName
  const filename = `${fileName ?? `كشف-${pharmacy.pharmacyName}`}.pdf`.replace(
    /\.pdf\.pdf$/i,
    '.pdf',
  )

  const rows = movements
    .map(
      (m) => `<tr>
      <td>${escapeHtml(m.date)}</td>
      <td>${escapeHtml(movementTypeLabel(m.type))}</td>
      <td>${escapeHtml(m.referenceNumber)}</td>
      <td>${m.debit ? escapeHtml(formatPdfMoney(m.debit)) : '—'}</td>
      <td>${m.credit ? escapeHtml(formatPdfMoney(m.credit)) : '—'}</td>
      <td>${escapeHtml(formatPdfMoney(m.balanceAfter))}</td>
      <td>${escapeHtml(m.repName ?? '—')}</td>
    </tr>`,
    )
    .join('')

  const bodyHtml = `
    <table class="info-table">
      ${infoRow('الصيدلية', pharmacy.pharmacyName)}
      ${infoRow('المنطقة', pharmacy.regionLabel)}
      ${infoRow('العنوان', pharmacy.address)}
      ${infoRow('الفترة', `${filter.from} → ${filter.to}`)}
      ${repName ? infoRow('المندوب', repName) : ''}
    </table>
    <div class="meta-row">
      <span>المبيعات: ${escapeHtml(money(pharmacy.sales))}</span>
      <span>التحصيلات: ${escapeHtml(money(pharmacy.collections))}</span>
      <span>المرتجعات: ${escapeHtml(money(pharmacy.returns))}</span>
      <span>${repName ? 'رصيد التعامل' : 'الرصيد الحالي'}: ${escapeHtml(money(pharmacy.currentBalance))}</span>
    </div>
    <table class="items">
      <thead>
        <tr>
          <th>التاريخ</th><th>الحركة</th><th>رقم العملية</th>
          <th>مدين</th><th>دائن</th><th>الرصيد</th><th>المندوب</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="7">لا حركات</td></tr>'}</tbody>
    </table>
    <p style="margin-top:12px;font-weight:700">الرصيد النهائي: ${escapeHtml(money(pharmacy.currentBalance))}</p>
  `

  if (print) {
    openPdfDocument(
      wrapPdfDocument({ title, subtitle, bodyHtml, filename }),
    )
    return
  }
  await downloadPdfFile(captureHtml(title, subtitle, bodyHtml), filename)
}

export async function exportRegionStatementPdf(opts: {
  dashboard: FinanceDashboardData
  filter: FinanceFilter
  regionLabel: string
  repName?: string
  fileName?: string
}): Promise<void> {
  const { dashboard, filter, regionLabel, repName, fileName } = opts
  const title = repName
    ? `كشف المنطقة للمندوب — ${repName}`
    : 'كشف حساب المنطقة'
  const subtitle = `${regionLabel} · ${filter.from} → ${filter.to}`
  const filename = `${fileName ?? 'كشف-المنطقة'}.pdf`.replace(
    /\.pdf\.pdf$/i,
    '.pdf',
  )

  const rows = dashboard.pharmacies
    .map((p) => {
      const status = isDebtor(p.currentBalance) ? 'مدينة' : 'مسددة'
      return `<tr>
        <td>${escapeHtml(p.pharmacyName)}</td>
        <td>${escapeHtml(p.address)}</td>
        <td>${escapeHtml(p.lastInvoiceAt ?? '—')}</td>
        <td>${escapeHtml(p.lastCollectionAt ?? '—')}</td>
        <td>${escapeHtml(p.lastReturnAt ?? '—')}</td>
        <td>${escapeHtml(formatPdfMoney(p.sales))}</td>
        <td>${escapeHtml(formatPdfMoney(p.collections))}</td>
        <td>${escapeHtml(formatPdfMoney(p.returns))}</td>
        <td>${escapeHtml(formatPdfMoney(p.currentBalance))}</td>
        <td>${status}</td>
      </tr>`
    })
    .join('')

  const bodyHtml = `
    <table class="info-table">
      ${infoRow('المنطقة', regionLabel)}
      ${infoRow('الفترة', `${filter.from} → ${filter.to}`)}
      ${repName ? infoRow('المندوب', repName) : ''}
    </table>
    <div class="meta-row">
      <span>إجمالي المبيعات: ${escapeHtml(money(dashboard.summary.salesTotal))}</span>
      <span>التحصيلات: ${escapeHtml(money(dashboard.summary.collectionsTotal))}</span>
      <span>المرتجعات: ${escapeHtml(money(dashboard.summary.returnsTotal))}</span>
      <span>الذمم: ${escapeHtml(money(dashboard.summary.debtsTotal))}</span>
    </div>
    <table class="items">
      <thead>
        <tr>
          <th>الصيدلية</th><th>العنوان</th><th>آخر فاتورة</th>
          <th>آخر دفعة</th><th>آخر مرتجع</th><th>المبيعات</th>
          <th>التحصيلات</th><th>المرتجعات</th><th>الرصيد</th><th>الحالة</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="10">لا بيانات</td></tr>'}</tbody>
    </table>
  `

  await downloadPdfFile(captureHtml(title, subtitle, bodyHtml), filename)
}
