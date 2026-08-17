/**
 * مركز التقارير — اختيار النوع، فلاتر، عرض، PDF عرضي، طباعة
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useFeedback } from '../../../shared/feedback/FeedbackContext'
import { getReportsDatasource } from '../data'
import type {
  ReportFilter,
  ReportResult,
  ReportTypeId,
  ReportsBoard,
} from '../domain/reportEntities'
import { defaultReportFilter } from '../domain/reportLabels'
import { exportReportPdf, printReport } from '../services/reportsPdfService'
import './reports.css'

export function ReportsPage() {
  const datasource = useMemo(() => getReportsDatasource(), [])
  const { success, fail } = useFeedback()

  const [board, setBoard] = useState<ReportsBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [typeId, setTypeId] = useState<ReportTypeId>('sales')
  const [filter, setFilter] = useState<ReportFilter>(defaultReportFilter())
  const [result, setResult] = useState<ReportResult | null>(null)

  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfName, setPdfName] = useState('')

  useEffect(() => {
    let alive = true
    datasource
      .getBoard()
      .then((next) => {
        if (!alive) return
        setBoard(next)
        setFilter(next.filter)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر تحميل التقارير')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource])

  const groupedTypes = useMemo(() => {
    if (!board) {
      return [] as Array<{
        group: string
        items: ReportsBoard['reportTypes']
      }>
    }
    const map = new Map<string, ReportsBoard['reportTypes']>()
    for (const t of board.reportTypes) {
      const list = map.get(t.group) ?? []
      list.push(t)
      map.set(t.group, list)
    }
    return [...map.entries()].map(([group, items]) => ({ group, items }))
  }, [board])

  async function run() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const next = await datasource.runReport({ typeId, filter })
      setResult(next)
      setMessage(`تم تجهيز التقرير · ${next.rows.length} صف`)
      success(`تم تجهيز التقرير بنجاح · ${next.rows.length} صف`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تشغيل التقرير'
      setError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  function openPdfDialog() {
    if (!result) return
    setPdfName(`${result.title}-${result.generatedAt.slice(0, 10)}`)
    setPdfOpen(true)
  }

  async function onSavePdf(e: FormEvent) {
    e.preventDefault()
    if (!result) return
    setBusy(true)
    setError(null)
    try {
      await exportReportPdf(result, pdfName)
      setPdfOpen(false)
      setMessage('تم حفظ ملف PDF')
      success('تم حفظ ملف PDF بنجاح')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حفظ PDF'
      setError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  function onPrint() {
    if (!result) return
    try {
      printReport(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل فتح الطباعة')
    }
  }

  if (loading) return <p className="rpt-status">جاري تحميل مركز التقارير…</p>
  if (!board) return <p className="rpt-status error">{error ?? 'لا بيانات'}</p>

  return (
    <div className="rpt-page">
      <header className="rpt-hero">
        <div>
          <h1>مركز التقارير</h1>
          <p>
            اختر نوع التقرير وحدد الفلاتر ثم اعرض النتائج. يمكن الحفظ PDF بالعرض
            أو الطباعة.
          </p>
        </div>
        <div className="rpt-hero-actions">
          <button
            type="button"
            className="rpt-btn-ghost"
            disabled={busy || !result}
            onClick={onPrint}
          >
            طباعة
          </button>
          <button
            type="button"
            className="rpt-btn"
            disabled={busy || !result}
            onClick={openPdfDialog}
          >
            حفظ PDF
          </button>
        </div>
      </header>

      {error ? <p className="rpt-status error">{error}</p> : null}
      {message ? <p className="rpt-status ok">{message}</p> : null}

      <div className="rpt-layout">
        <aside className="rpt-types">
          <h3>أنواع التقارير</h3>
          {groupedTypes.map((g) => (
            <div key={g.group} className="rpt-type-group">
              <p>{g.group}</p>
              {g.items.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={typeId === t.id ? 'active' : ''}
                  onClick={() => {
                    setTypeId(t.id)
                    setResult(null)
                    setMessage(null)
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className="rpt-main">
          <div className="rpt-filters">
            <label>
              من تاريخ
              <input
                type="date"
                value={filter.from}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, from: e.target.value }))
                }
              />
            </label>
            <label>
              إلى تاريخ
              <input
                type="date"
                value={filter.to}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, to: e.target.value }))
                }
              />
            </label>
            <label>
              المنطقة
              <select
                value={filter.mainRegionId ?? ''}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    mainRegionId: e.target.value || null,
                  }))
                }
              >
                <option value="">الكل</option>
                {board.regionOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              المندوب
              <select
                value={filter.repId ?? ''}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, repId: e.target.value || null }))
                }
              >
                <option value="">الكل</option>
                {board.repOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              الصيدلية
              <select
                value={filter.pharmacyId ?? ''}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    pharmacyId: e.target.value || null,
                  }))
                }
              >
                <option value="">الكل</option>
                {board.pharmacyOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              الشركة
              <select
                value={filter.companyId ?? ''}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    companyId: e.target.value || null,
                  }))
                }
              >
                <option value="">الكل</option>
                {board.companyOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rpt-btn"
              disabled={busy}
              onClick={() => void run()}
            >
              {busy ? 'جاري التجهيز…' : 'عرض التقرير'}
            </button>
          </div>

          {result ? (
            <div className="rpt-result">
              <div className="rpt-result-head">
                <div>
                  <h2>{result.title}</h2>
                  <p>{result.subtitle}</p>
                </div>
                {result.totals ? (
                  <div className="rpt-totals">
                    {Object.entries(result.totals).map(([k, v]) => (
                      <div key={k}>
                        <span>{k}</span>
                        <strong>{String(v)}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rpt-table-card">
                <table>
                  <thead>
                    <tr>
                      {result.columns.map((c) => (
                        <th key={c.key}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={result.columns.length}
                          className="rpt-empty"
                        >
                          لا صفوف ضمن الفلاتر الحالية
                        </td>
                      </tr>
                    ) : (
                      result.rows.map((row, idx) => (
                        <tr key={idx}>
                          {result.columns.map((c) => (
                            <td key={c.key}>{String(row[c.key] ?? '—')}</td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rpt-placeholder">
              اختر نوع التقرير والفلاتر ثم اضغط «عرض التقرير»
            </div>
          )}
        </section>
      </div>

      {pdfOpen && result ? (
        <div className="rpt-modal-backdrop">
          <form className="rpt-modal" onSubmit={onSavePdf}>
            <h3>حفظ التقرير PDF</h3>
            <p className="rpt-hint">الاتجاه عرضي ليتناسب مع الجدول.</p>
            <label>
              اسم الملف
              <input
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                autoFocus
                required
              />
            </label>
            <div className="rpt-form-actions">
              <button
                type="button"
                className="rpt-btn-ghost"
                onClick={() => setPdfOpen(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="rpt-btn" disabled={busy}>
                {busy ? 'جاري الحفظ…' : 'حفظ'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
