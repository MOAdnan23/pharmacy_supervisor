/**
 * هوية مستندات PDF/الطباعة — مطابقة لـ AppPdfTheme في المفوتر.
 */
export const pdfBrand = {
  warehouseName: 'المستودع الدوائي',
  warehouseAddress: 'دمشق — المنطقة الصناعية، شارع المستودعات',
  warehousePhone: '011-2345678',
  printedBy: 'طُبع بواسطة لوحة المشرف',
} as const

export type PdfOrientation = 'portrait' | 'landscape'

/** أنماط CSS مطابقة لشكل فاتورة/مستند المفوتر (A4، RTL، Tahoma) */
export function pdfDocumentStyles(
  orientation: PdfOrientation = 'portrait',
): string {
  const pageSize =
    orientation === 'landscape' ? 'A4 landscape' : 'A4'
  const docMax = orientation === 'landscape' ? '277mm' : '190mm'
  return `
    @page { size: ${pageSize}; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Tahoma, 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
      direction: rtl;
      font-size: 12px;
      line-height: 1.45;
      background: #fff;
    }
    .doc { max-width: ${docMax}; margin: 0 auto; padding: 8px 4px 24px; }
    .brand-name {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      color: #0f172a;
    }
    .brand-meta {
      text-align: center;
      font-size: 9px;
      color: #475569;
      margin: 2px 0 0;
    }
    .brand-rule {
      height: 1.2px;
      background: #455a64;
      margin: 10px 0;
      border: 0;
    }
    .doc-title {
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      margin: 0;
    }
    .doc-subtitle {
      text-align: center;
      font-size: 9px;
      color: #475569;
      margin: 3px 0 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin: 14px 0 8px;
      font-size: 11px;
    }
    .info-table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; }
    .info-table td { padding: 3px 0; vertical-align: top; font-size: 11px; }
    .info-table .lbl {
      width: 110px;
      font-weight: 700;
      white-space: nowrap;
      padding-left: 8px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9px;
    }
    .data-table th {
      background: #d1d5db;
      font-weight: 700;
      padding: 6px 5px;
      border: 1px solid #9ca3af;
      text-align: right;
    }
    .data-table td {
      padding: 5px;
      border: 1px solid #d1d5db;
      text-align: right;
    }
    .summary { margin-top: 10px; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 11px;
    }
    .summary-row.bold { font-weight: 700; }
    .divider {
      border: 0;
      border-top: 1px solid #94a3b8;
      margin: 8px 0;
    }
    .box {
      margin-top: 12px;
      padding: 12px;
      border: 1px solid #9ca3af;
      border-radius: 4px;
    }
    .box h4 {
      margin: 0 0 8px;
      font-size: 12px;
    }
    .footer {
      margin-top: 28px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #64748b;
    }
    .hint-print {
      display: none;
    }
    .items {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: ${orientation === 'landscape' ? '8.5px' : '10px'};
    }
    .items th {
      background: #d1d5db;
      font-weight: 700;
      padding: 5px 4px;
      border: 1px solid #9ca3af;
      text-align: right;
      white-space: nowrap;
    }
    .items td {
      padding: 4px;
      border: 1px solid #d1d5db;
      text-align: right;
    }
    @media screen {
      body { background: #e2e8f0; padding: 16px; }
      .doc {
        background: #fff;
        padding: 28px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
      }
      .toolbar {
        max-width: ${docMax};
        margin: 0 auto 12px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      .toolbar button {
        font-family: Tahoma, sans-serif;
        border: 0;
        border-radius: 8px;
        padding: 8px 14px;
        font-weight: 700;
        cursor: pointer;
      }
      .toolbar .primary { background: #0b1f3a; color: #fff; }
      .toolbar .ghost { background: #e2e8f0; color: #0b1f3a; }
      .hint-print {
        display: block;
        max-width: ${docMax};
        margin: 0 auto 10px;
        font-size: 12px;
        color: #334155;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 8px;
        padding: 8px 12px;
      }
    }
    @media print {
      .toolbar, .hint-print { display: none !important; }
      body { background: #fff; padding: 0; }
      .doc { box-shadow: none; padding: 0; }
    }
  `
}

export function formatPdfMoney(value: number): string {
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ل.س`
}

export function wrapPdfDocument(options: {
  title: string
  subtitle?: string
  bodyHtml: string
  filename: string
  /** محتوى المستند فقط للطباعة أو للالتقاط */
  forCapture?: boolean
  orientation?: PdfOrientation
}): string {
  const orientation = options.orientation ?? 'portrait'
  const toolbar = options.forCapture
    ? ''
    : `<div class="toolbar">
    <button class="ghost" type="button" onclick="window.close()">إغلاق</button>
    <button class="primary" type="button" onclick="window.print()">طباعة</button>
  </div>`

  const autoPrint = options.forCapture
    ? ''
    : `<script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 250);
    });
  </script>`

  const hint =
    options.forCapture || orientation !== 'landscape'
      ? ''
      : `<p class="hint-print">يُفضّل اختيار اتجاه الصفحة «عرضي / Landscape» في إعدادات الطباعة إن لم يُطبَّق تلقائياً.</p>`

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(options.filename)}</title>
  <style>${pdfDocumentStyles(orientation)}</style>
</head>
<body>
  ${toolbar}
  ${hint}
  <div class="doc" id="pdf-root">
    <p class="brand-name">${escapeHtml(pdfBrand.warehouseName)}</p>
    <p class="brand-meta">${escapeHtml(pdfBrand.warehouseAddress)}</p>
    <p class="brand-meta">هاتف: ${escapeHtml(pdfBrand.warehousePhone)}</p>
    <hr class="brand-rule" />
    <p class="doc-title">${escapeHtml(options.title)}</p>
    ${
      options.subtitle
        ? `<p class="doc-subtitle">${escapeHtml(options.subtitle)}</p>`
        : ''
    }
    ${options.bodyHtml}
    <div class="footer">
      <span>${escapeHtml(pdfBrand.printedBy)}</span>
      <span>صفحة 1 من 1</span>
    </div>
  </div>
  ${autoPrint}
</body>
</html>`
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function openPdfDocument(html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'width=960,height=1000')

  if (!win) {
    URL.revokeObjectURL(url)
    throw new Error('تعذّر فتح نافذة الطباعة — اسمح بالنوافذ المنبثقة للموقع')
  }

  const revoke = () => URL.revokeObjectURL(url)
  win.addEventListener('load', revoke)
  setTimeout(revoke, 60_000)
}

/**
 * يحفظ ملف PDF فعلياً على الجهاز (تنزيل).
 * يستخدم نفس شكل HTML لمستندات المفوتر مع دعم العربية عبر تصيير المتصفح.
 */
export async function downloadPdfFile(
  html: string,
  filename: string,
  options?: { orientation?: PdfOrientation },
): Promise<void> {
  const orientation = options?.orientation ?? 'portrait'
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const host = document.createElement('div')
  // عرض تقريبي لـ A4 (عمودي 794px / عرضي 1123px عند 96dpi)
  const hostWidth = orientation === 'landscape' ? 1123 : 794
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${hostWidth}px;background:#fff;z-index:-1;`
  host.innerHTML = html
  document.body.appendChild(host)

  const root =
    (host.querySelector('#pdf-root') as HTMLElement | null) ??
    (host.firstElementChild as HTMLElement | null)

  if (!root) {
    host.remove()
    throw new Error('تعذّر تجهيز محتوى PDF')
  }

  try {
    const canvas = await html2canvas(root, {
      scale: orientation === 'landscape' ? 1.75 : 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: hostWidth,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const usableWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * usableWidth) / canvas.width

    let heightLeft = imgHeight
    let position = margin

    pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft)
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', margin, position, usableWidth, imgHeight)
      heightLeft -= pageHeight - margin * 2
    }

    const safeName = filename.toLowerCase().endsWith('.pdf')
      ? filename
      : `${filename}.pdf`
    pdf.save(safeName)
  } finally {
    host.remove()
  }
}
