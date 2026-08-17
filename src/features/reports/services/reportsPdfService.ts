import {
  downloadPdfFile,
  escapeHtml,
  openPdfDocument,
  pdfBrand,
  pdfDocumentStyles,
  wrapPdfDocument,
} from '../../../core/pdf/pdfDocument'
import type { ReportResult } from '../domain/reportEntities'

function sanitizeFileName(name: string, fallback: string): string {
  const base = name.trim() || fallback
  const cleaned = base.replace(/[<>:"/\\|?*]/g, '-').replace(/\.pdf$/i, '')
  return `${cleaned || fallback}.pdf`
}

function buildBody(result: ReportResult): string {
  const head = result.columns
    .map((c) => `<th>${escapeHtml(c.label)}</th>`)
    .join('')
  const body = result.rows.length
    ? result.rows
        .map(
          (row) =>
            `<tr>${result.columns
              .map(
                (c) =>
                  `<td>${escapeHtml(String(row[c.key] ?? '—'))}</td>`,
              )
              .join('')}</tr>`,
        )
        .join('')
    : `<tr><td colspan="${result.columns.length}">لا بيانات</td></tr>`

  const totals = result.totals
    ? `<table class="info-table" style="margin-top:12px">${Object.entries(
        result.totals,
      )
        .map(
          ([k, v]) =>
            `<tr><td class="lbl">${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`,
        )
        .join('')}</table>`
    : ''

  return `
    <p class="doc-subtitle" style="text-align:right">عدد الصفوف: ${result.rows.length}</p>
    <table class="items">
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
    ${totals}
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
        <span>تقرير عرضي (Landscape)</span>
      </div>
    </div>
  `
}

export async function exportReportPdf(
  result: ReportResult,
  fileName?: string,
): Promise<void> {
  const filename = sanitizeFileName(
    fileName ?? result.title,
    'تقرير',
  )
  await downloadPdfFile(
    captureHtml(result.title, result.subtitle, buildBody(result)),
    filename,
    { orientation: 'landscape' },
  )
}

export function printReport(result: ReportResult): void {
  openPdfDocument(
    wrapPdfDocument({
      title: result.title,
      subtitle: result.subtitle,
      bodyHtml: buildBody(result),
      filename: `طباعة-${result.title}`,
      orientation: 'landscape',
    }),
  )
}
