import {
  downloadPdfFile,
  escapeHtml,
  openPdfDocument,
  pdfBrand,
  pdfDocumentStyles,
  wrapPdfDocument,
} from '../../../core/pdf/pdfDocument'
import type { PharmacyEvalRow, RepEvaluationCard } from '../domain/evaluationEntities'
import { gradeLabel, money } from '../domain/evaluationLabels'

function pharmacyRowsHtml(rows: PharmacyEvalRow[]): string {
  if (!rows.length) return '<tr><td colspan="4">—</td></tr>'
  return rows
    .map(
      (p) => `<tr>
      <td>${escapeHtml(p.pharmacyName)}</td>
      <td>${escapeHtml(p.regionLabel)}</td>
      <td>${p.invoiceCount}</td>
      <td>${escapeHtml(money(p.salesAmount))}</td>
    </tr>`,
    )
    .join('')
}

function buildBody(card: RepEvaluationCard): string {
  const b = card.breakdown
  return `
    <table class="info-table">
      <tr><td class="lbl">المندوب</td><td>${escapeHtml(card.repName)}</td></tr>
      <tr><td class="lbl">المنطقة</td><td>${escapeHtml(card.regionLabel)}</td></tr>
      <tr><td class="lbl">الفترة</td><td>${escapeHtml(`${card.from} → ${card.to}`)}</td></tr>
      <tr><td class="lbl">فواتير البيع</td><td>${card.salesInvoiceCount}</td></tr>
      <tr><td class="lbl">النتيجة</td><td>${card.totalPoints.toFixed(1)} / 100</td></tr>
      <tr><td class="lbl">التقدير التلقائي</td><td>${escapeHtml(gradeLabel(card.autoGrade))}</td></tr>
      ${
        card.supervisorReview
          ? `<tr><td class="lbl">تقييم المشرف</td><td>${escapeHtml(gradeLabel(card.supervisorReview.grade))} — ${escapeHtml(card.supervisorReview.note)}</td></tr>`
          : ''
      }
    </table>
    <table class="items" style="margin-top:14px">
      <thead>
        <tr><th>البند</th><th>النقاط</th><th>الحد</th><th>ملخص</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>التارغت</td>
          <td>${b.target.points.toFixed(1)}</td>
          <td>35</td>
          <td>${b.target.percent.toFixed(1)}%</td>
        </tr>
        <tr>
          <td>التغطية</td>
          <td>${b.coverage.points.toFixed(1)}</td>
          <td>35</td>
          <td>${b.coverage.soldPharmacies} / ${b.coverage.totalPharmacies} صيدلية (${b.coverage.percent.toFixed(1)}%)</td>
        </tr>
        <tr>
          <td>المكررة ≥2</td>
          <td>${b.repeated.points.toFixed(1)}</td>
          <td>20</td>
          <td>${b.repeated.count} صيدلية</td>
        </tr>
        <tr>
          <td>مرة واحدة</td>
          <td>${b.once.points.toFixed(1)}</td>
          <td>10</td>
          <td>${b.once.count} صيدلية</td>
        </tr>
      </tbody>
    </table>

    <h3 style="margin:16px 0 8px">التارغت حسب الشركة</h3>
    <table class="items">
      <thead>
        <tr><th>الشركة</th><th>التارغت</th><th>المحقق</th><th>%</th></tr>
      </thead>
      <tbody>
        ${
          b.target.companies
            .map(
              (c) => `<tr>
          <td>${escapeHtml(c.companyName)}</td>
          <td>${escapeHtml(money(c.targetAmount))}</td>
          <td>${escapeHtml(money(c.achievedAmount))}</td>
          <td>${c.achievementPercent.toFixed(1)}%</td>
        </tr>`,
            )
            .join('') || '<tr><td colspan="4">—</td></tr>'
        }
      </tbody>
    </table>

    <h3 style="margin:16px 0 8px">التغطية — الصيدليات المباعة (${b.coverage.soldPharmacies} / ${b.coverage.totalPharmacies})</h3>
    <table class="items">
      <thead>
        <tr><th>الصيدلية</th><th>المنطقة</th><th>عدد الفواتير</th><th>قيمة المبيعات</th></tr>
      </thead>
      <tbody>${pharmacyRowsHtml(b.coverage.pharmacies)}</tbody>
    </table>

    <h3 style="margin:16px 0 8px">صيدليات مكررة ≥ مرتين (${b.repeated.count})</h3>
    <table class="items">
      <thead>
        <tr><th>الصيدلية</th><th>المنطقة</th><th>عدد الفواتير</th><th>قيمة المبيعات</th></tr>
      </thead>
      <tbody>${pharmacyRowsHtml(b.repeated.pharmacies)}</tbody>
    </table>

    <h3 style="margin:16px 0 8px">صيدليات مرة واحدة (${b.once.count})</h3>
    <table class="items">
      <thead>
        <tr><th>الصيدلية</th><th>المنطقة</th><th>عدد الفواتير</th><th>قيمة المبيعات</th></tr>
      </thead>
      <tbody>${pharmacyRowsHtml(b.once.pharmacies)}</tbody>
    </table>
  `
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

function sanitizeFileName(name: string, fallback: string): string {
  const base = name.trim() || fallback
  const cleaned = base.replace(/[<>:"/\\|?*]/g, '-').replace(/\.pdf$/i, '')
  return `${cleaned || fallback}.pdf`
}

/** تنزيل PDF باسم يختاره المستخدم */
export async function exportEvaluationPdf(
  card: RepEvaluationCard,
  fileName?: string,
): Promise<void> {
  const title = 'تقرير تقييم المندوب'
  const subtitle = card.repName
  const bodyHtml = buildBody(card)
  const filename = sanitizeFileName(
    fileName ?? `تقييم-${card.repName}`,
    `تقييم-${card.repName}`,
  )
  await downloadPdfFile(captureHtml(title, subtitle, bodyHtml), filename)
}

/** طباعة مباشرة */
export function printEvaluationReport(card: RepEvaluationCard): void {
  const title = 'تقرير تقييم المندوب'
  const subtitle = card.repName
  const bodyHtml = buildBody(card)
  openPdfDocument(
    wrapPdfDocument({
      title,
      subtitle,
      bodyHtml,
      filename: `طباعة-تقييم-${card.repName}`,
    }),
  )
}
