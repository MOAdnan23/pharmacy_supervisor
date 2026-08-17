/**
 * تقييم أداء المندوب — محسوب من فواتير البيع
 * فلترة: منطقة رئيسية → فرعية ↔ مندوب + تفاصيل صيدليات التارغت
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getEvaluationDatasource } from '../data'
import type {
  CompanyTargetRow,
  EvaluationBoard,
  EvaluationFilter,
  EvaluationGrade,
  ScoreBreakdown,
} from '../domain/evaluationEntities'
import {
  GRADE_SCALE,
  defaultEvalDates,
  gradeFromPercent,
  gradeLabel,
  gradeTone,
  money,
} from '../domain/evaluationLabels'
import {
  exportEvaluationPdf,
  printEvaluationReport,
} from '../services/evaluationPdfService'
import './evaluation.css'

type DetailTab = 'summary' | 'target' | 'coverage' | 'repeated' | 'once'

export function EvaluationPage() {
  const datasource = useMemo(() => getEvaluationDatasource(), [])
  const [searchParams] = useSearchParams()
  const dates = defaultEvalDates()
  const initialRepId = searchParams.get('repId') || 'r1'

  const [board, setBoard] = useState<EvaluationBoard | null>(null)
  const [filter, setFilter] = useState<EvaluationFilter>({
    repId: initialRepId,
    from: dates.from,
    to: dates.to,
    mainRegionId: null,
    subRegionId: null,
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailTab>('summary')
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [pdfName, setPdfName] = useState('')

  const [reviewGrade, setReviewGrade] = useState<EvaluationGrade>('good')
  const [reviewNote, setReviewNote] = useState('')

  async function reload(next = filter) {
    const data = await datasource.getBoard(next)
    setBoard(data)
    setFilter(data.filter)
    if (data.card) {
      setReviewGrade(data.card.supervisorReview?.grade ?? data.card.autoGrade)
      setReviewNote(data.card.supervisorReview?.note ?? '')
    }
  }

  useEffect(() => {
    let alive = true
    const start: EvaluationFilter = {
      repId: '',
      from: dates.from,
      to: dates.to,
      mainRegionId: null,
      subRegionId: null,
    }
    // رابط عميق بمندوب: افتح منطقته الرئيسية تلقائياً
    const deepRep = searchParams.get('repId')
    if (deepRep) {
      const known = (
        [
          { id: 'r1', main: 'mr1' },
          { id: 'r2', main: 'mr2' },
          { id: 'r3', main: 'mr1' },
        ] as const
      ).find((x) => x.id === deepRep)
      if (known) {
        start.mainRegionId = known.main
        start.repId = known.id
      }
    }
    datasource
      .getBoard(start)
      .then((data) => {
        if (!alive) return
        setBoard(data)
        setFilter(data.filter)
        if (data.card) {
          setReviewGrade(
            data.card.supervisorReview?.grade ?? data.card.autoGrade,
          )
          setReviewNote(data.card.supervisorReview?.note ?? '')
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر تحميل التقييم')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasource, searchParams])

  async function applyFilter(patch: Partial<EvaluationFilter>) {
    const next = { ...filter, ...patch }
    setBusy(true)
    setError(null)
    setMessage(null)
    setExpandedCompany(null)
    try {
      await reload(next)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل التحديث')
    } finally {
      setBusy(false)
    }
  }

  async function sendReview(e: FormEvent) {
    e.preventDefault()
    if (!board?.card) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await datasource.sendSupervisorReview({
        repId: filter.repId,
        from: filter.from,
        to: filter.to,
        mainRegionId: filter.mainRegionId,
        subRegionId: filter.subRegionId,
        grade: reviewGrade,
        note: reviewNote,
      })
      await reload(filter)
      setMessage('تم إرسال تقييم المشرف إلى المندوب')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل إرسال التقييم')
    } finally {
      setBusy(false)
    }
  }

  async function onSavePdf(e: FormEvent) {
    e.preventDefault()
    if (!board?.card) return
    setBusy(true)
    setError(null)
    try {
      await exportEvaluationPdf(board.card, pdfName)
      setPdfDialogOpen(false)
      setMessage('تم حفظ تقرير PDF')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل تصدير PDF')
    } finally {
      setBusy(false)
    }
  }

  function onPrint() {
    if (!board?.card) return
    try {
      printEvaluationReport(board.card)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الطباعة')
    }
  }

  if (loading) {
    return <p className="eval-status">جاري احتساب التقييم من فواتير البيع…</p>
  }
  if (!board) {
    return <p className="eval-status error">{error ?? 'لا بيانات'}</p>
  }

  const card = board.card

  return (
    <div className="eval-page">
      <header className="eval-hero">
        <div>
          <h1>تقييم أداء المندوب</h1>
          <p>
            احتساب تلقائي من فواتير البيع. اختر منطقة رئيسية ثم فرعية (أو الكل)
            والمندوب — الخيارات مرتبطة ببعضها.
          </p>
        </div>
        <div className="eval-hero-actions">
          <button
            type="button"
            className="eval-btn-ghost"
            disabled={busy || !card}
            onClick={onPrint}
          >
            طباعة التقرير
          </button>
          <button
            type="button"
            className="eval-btn"
            disabled={busy || !card}
            onClick={() => {
              setPdfName(card ? `تقييم-${card.repName}` : 'تقييم-مندوب')
              setPdfDialogOpen(true)
            }}
          >
            حفظ PDF
          </button>
        </div>
      </header>

      {error ? <p className="eval-status error">{error}</p> : null}
      {message ? <p className="eval-status ok">{message}</p> : null}

      <div className="eval-filters">
        <label>
          المنطقة الرئيسية
          <select
            value={filter.mainRegionId ?? ''}
            onChange={(e) =>
              applyFilter({
                mainRegionId: e.target.value || null,
                subRegionId: null,
                repId: '',
              })
            }
          >
            <option value="">كل المناطق</option>
            {board.mainRegionOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          المنطقة الفرعية
          <select
            value={filter.subRegionId ?? ''}
            disabled={!filter.mainRegionId && board.subRegionOptions.length === 0}
            onChange={(e) =>
              applyFilter({
                subRegionId: e.target.value || null,
                repId: '',
              })
            }
          >
            <option value="">
              {filter.mainRegionId ? 'كل الفرعية' : '— اختر رئيسية أولاً أو مندوب —'}
            </option>
            {board.subRegionOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          المندوب
          <select
            value={filter.repId}
            disabled={!filter.mainRegionId}
            onChange={(e) => applyFilter({ repId: e.target.value })}
          >
            {!filter.mainRegionId ? (
              <option value="">— اختر المنطقة الرئيسية أولاً —</option>
            ) : null}
            {board.repOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          من تاريخ
          <input
            type="date"
            value={filter.from}
            onChange={(e) => applyFilter({ from: e.target.value })}
          />
        </label>
        <label>
          إلى تاريخ
          <input
            type="date"
            value={filter.to}
            onChange={(e) => applyFilter({ to: e.target.value })}
          />
        </label>
      </div>

      <p className="eval-hint">
        اختر المنطقة الرئيسية (ثم الفرعية إن أردت) — يُعرض تقييم أول مندوب في
        النطاق فوراً، ويمكنك تغيير المندوب. التغطية والمكررة على صيدليات مناطقه
        فقط.
      </p>

      <section className="eval-scale">
        <h3>سلم التقدير</h3>
        <div className="eval-scale-grid">
          {GRADE_SCALE.map((row) => (
            <article
              key={row.grade}
              className={`eval-scale-item tone-${gradeTone(row.grade)} ${
                card?.autoGrade === row.grade ? 'current' : ''
              }`}
            >
              <strong>{row.label}</strong>
              <span>{row.range}</span>
            </article>
          ))}
        </div>
      </section>

      {!card ? (
        <p className="eval-status">لا بيانات تقييم لهذا المندوب ضمن الفلاتر</p>
      ) : (
        <>
          <section className="eval-score-card">
            <div>
              <span>المندوب</span>
              <strong>{card.repName}</strong>
              <small>
                {card.regionLabel} · {card.from} → {card.to} ·{' '}
                {card.salesInvoiceCount} فاتورة بيع
              </small>
            </div>
            <div className="eval-score-main">
              <span>النتيجة التلقائية</span>
              <strong className="big">{card.totalPoints.toFixed(1)}</strong>
              <small>من 100</small>
            </div>
            <div
              className={`eval-grade-badge tone-${gradeTone(card.autoGrade)}`}
            >
              <span>التقدير</span>
              <strong>{gradeLabel(card.autoGrade)}</strong>
            </div>
          </section>

          <div className="eval-pillars">
            <Pillar
              title="التارغت"
              points={card.breakdown.target.points}
              max={35}
              active={detail === 'target'}
              onClick={() => setDetail('target')}
            />
            <Pillar
              title="التغطية"
              points={card.breakdown.coverage.points}
              max={35}
              active={detail === 'coverage'}
              onClick={() => setDetail('coverage')}
            />
            <Pillar
              title="المكررة ≥2"
              points={card.breakdown.repeated.points}
              max={20}
              active={detail === 'repeated'}
              onClick={() => setDetail('repeated')}
            />
            <Pillar
              title="مرة واحدة"
              points={card.breakdown.once.points}
              max={10}
              active={detail === 'once'}
              onClick={() => setDetail('once')}
            />
            <Pillar
              title="الملخص"
              points={card.totalPoints}
              max={100}
              active={detail === 'summary'}
              onClick={() => setDetail('summary')}
            />
          </div>

          <DetailPanel
            tab={detail}
            breakdown={card.breakdown}
            expandedCompany={expandedCompany}
            onToggleCompany={(id) =>
              setExpandedCompany((prev) => (prev === id ? null : id))
            }
          />

          <section className="eval-review">
            <h3>تقييم المشرف (يُرسل للمندوب)</h3>
            {card.supervisorReview?.deliveredToRep ? (
              <p className="eval-status ok">
                آخر إرسال: {gradeLabel(card.supervisorReview.grade)} —{' '}
                {card.supervisorReview.sentAt.slice(0, 16).replace('T', ' ')}
              </p>
            ) : (
              <p className="eval-hint">
                التقدير الافتراضي من النسبة:{' '}
                {gradeLabel(gradeFromPercent(card.totalPercent))} — يمكنك تعديله
                قبل الإرسال.
              </p>
            )}
            <form className="eval-review-form" onSubmit={sendReview}>
              <label>
                تقدير المشرف
                <select
                  value={reviewGrade}
                  onChange={(e) =>
                    setReviewGrade(e.target.value as EvaluationGrade)
                  }
                >
                  {GRADE_SCALE.map((g) => (
                    <option key={g.grade} value={g.grade}>
                      {g.label} ({g.range})
                    </option>
                  ))}
                </select>
              </label>
              <label className="full">
                ملاحظة للمندوب *
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="اكتب ملاحظاتك التي ستصل للمندوب…"
                  required
                />
              </label>
              <div className="eval-form-actions">
                <button type="submit" className="eval-btn" disabled={busy}>
                  إرسال التقييم للمندوب
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      {pdfDialogOpen ? (
        <div className="eval-modal-backdrop">
          <form className="eval-modal" onSubmit={onSavePdf}>
            <h3>حفظ تقرير PDF</h3>
            <p className="eval-hint">اختر اسم الملف الذي سيُحفظ على الجهاز.</p>
            <label>
              اسم الملف
              <input
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                autoFocus
                required
                placeholder="مثال: تقييم-ياسين-آب"
              />
            </label>
            <p className="eval-hint">يُضاف امتداد .pdf تلقائياً إن لم تكتبه.</p>
            <div className="eval-form-actions">
              <button
                type="button"
                className="eval-btn-ghost"
                disabled={busy}
                onClick={() => setPdfDialogOpen(false)}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="eval-btn"
                disabled={busy || !pdfName.trim()}
              >
                {busy ? 'جاري الحفظ...' : 'حفظ PDF'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function Pillar(props: {
  title: string
  points: number
  max: number
  active: boolean
  onClick: () => void
}) {
  const pct = props.max <= 0 ? 0 : Math.round((props.points / props.max) * 100)
  return (
    <button
      type="button"
      className={`eval-pillar ${props.active ? 'active' : ''}`}
      onClick={props.onClick}
    >
      <span>{props.title}</span>
      <strong>
        {props.points.toFixed(1)} / {props.max}
      </strong>
      <div className="eval-bar">
        <i style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </button>
  )
}

function DetailPanel({
  tab,
  breakdown,
  expandedCompany,
  onToggleCompany,
}: {
  tab: DetailTab
  breakdown: ScoreBreakdown
  expandedCompany: string | null
  onToggleCompany: (companyId: string) => void
}) {
  if (tab === 'summary') {
    return (
      <div className="eval-detail">
        <h3>ملخص البنود</h3>
        <div className="eval-table-card">
          <table>
            <thead>
              <tr>
                <th>البند</th>
                <th>النقاط</th>
                <th>الحد الأقصى</th>
                <th>النسبة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>التارغت (من فواتير البيع)</td>
                <td>{breakdown.target.points.toFixed(1)}</td>
                <td>35</td>
                <td>{breakdown.target.percent.toFixed(1)}%</td>
              </tr>
              <tr>
                <td>التغطية</td>
                <td>{breakdown.coverage.points.toFixed(1)}</td>
                <td>35</td>
                <td>{breakdown.coverage.percent.toFixed(1)}%</td>
              </tr>
              <tr>
                <td>صيدليات مكررة (≥ مرتين)</td>
                <td>{breakdown.repeated.points.toFixed(1)}</td>
                <td>20</td>
                <td>{breakdown.repeated.percent.toFixed(1)}%</td>
              </tr>
              <tr>
                <td>صيدليات مرة واحدة</td>
                <td>{breakdown.once.points.toFixed(1)}</td>
                <td>10</td>
                <td>{breakdown.once.percent.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (tab === 'target') {
    return (
      <div className="eval-detail">
        <h3>تفاصيل التارغت</h3>
        <p className="eval-hint">
          المحقق = مبيعات الفواتير − المرتجعات · التفاصيل = صيدليات اشترت من
          الشركة وقيمة كل فاتورة (مع رقمها وتاريخها)
        </p>
        <div className="eval-table-card">
          <table>
            <thead>
              <tr>
                <th>الشركة</th>
                <th>التارغت</th>
                <th>المحقق</th>
                <th>نسبة التحقيق</th>
                <th>النقاط</th>
                <th>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.target.companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="eval-empty">
                    لا تارغت
                  </td>
                </tr>
              ) : (
                breakdown.target.companies.map((c) => (
                  <CompanyTargetRows
                    key={c.companyId}
                    company={c}
                    expanded={expandedCompany === c.companyId}
                    onToggle={() => onToggleCompany(c.companyId)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const block =
    tab === 'coverage'
      ? breakdown.coverage
      : tab === 'repeated'
        ? breakdown.repeated
        : breakdown.once

  const title =
    tab === 'coverage'
      ? `التغطية — ${breakdown.coverage.soldPharmacies} / ${breakdown.coverage.totalPharmacies}`
      : tab === 'repeated'
        ? `صيدليات مكررة — ${breakdown.repeated.count}`
        : `صيدليات مرة واحدة — ${breakdown.once.count}`

  return (
    <div className="eval-detail">
      <h3>{title}</h3>
      <div className="eval-table-card">
        <table>
          <thead>
            <tr>
              <th>الصيدلية</th>
              <th>المنطقة</th>
              <th>عدد الفواتير</th>
              <th>قيمة المبيعات</th>
            </tr>
          </thead>
          <tbody>
            {block.pharmacies.length === 0 ? (
              <tr>
                <td colSpan={4} className="eval-empty">
                  لا صيدليات
                </td>
              </tr>
            ) : (
              block.pharmacies.map((p) => (
                <tr key={p.pharmacyId}>
                  <td>
                    <strong>{p.pharmacyName}</strong>
                  </td>
                  <td>{p.regionLabel}</td>
                  <td>{p.invoiceCount}</td>
                  <td>{money(p.salesAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CompanyTargetRows({
  company,
  expanded,
  onToggle,
}: {
  company: CompanyTargetRow
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr>
        <td>
          <strong>{company.companyName}</strong>
        </td>
        <td>{money(company.targetAmount)}</td>
        <td>{money(company.achievedAmount)}</td>
        <td>{company.achievementPercent.toFixed(1)}%</td>
        <td>
          {company.points.toFixed(1)} / {company.maxPoints.toFixed(1)}
        </td>
        <td>
          <button type="button" className="eval-link-btn" onClick={onToggle}>
            {expanded
              ? 'إخفاء'
              : `فواتير (${company.invoices.length})`}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="eval-nested-row">
          <td colSpan={6}>
            {company.invoices.length === 0 ? (
              <p className="eval-hint">لا فواتير بيع لهذه الشركة</p>
            ) : (
              <table className="eval-nested-table">
                <thead>
                  <tr>
                    <th>الصيدلية</th>
                    <th>المنطقة</th>
                    <th>رقم الفاتورة</th>
                    <th>تاريخ الفاتورة</th>
                    <th>قيمة المبيعات</th>
                  </tr>
                </thead>
                <tbody>
                  {company.invoices.map((inv) => (
                    <tr key={inv.invoiceId}>
                      <td>{inv.pharmacyName}</td>
                      <td>{inv.regionLabel}</td>
                      <td>
                        <strong>{inv.invoiceNumber}</strong>
                      </td>
                      <td>{inv.date}</td>
                      <td>{money(inv.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      ) : null}
    </>
  )
}
