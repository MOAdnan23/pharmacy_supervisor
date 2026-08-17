/**
 * الراتب الثابت والمكافآت — UC-135 → UC-141
 * أزرار إضافة من الأعلى · راتب بدون شروط · مكافأة للمؤهلين أو أي مندوب
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFeedback } from '../../../shared/feedback/FeedbackContext'
import { getCompensationDatasource } from '../data'
import type {
  CompensationBoard,
  RepCompensationRow,
} from '../domain/compensationEntities'
import { BONUS_ELIGIBILITY_THRESHOLD } from '../domain/compensationEntities'
import {
  COMPENSATION_RULES,
  matchesRepRegionSearch,
  money,
  salaryStatusLabel,
  todayIsoDate,
} from '../domain/compensationLabels'
import './compensation.css'

type TabId = 'reps' | 'audit' | 'notices'
type BonusMode = 'eligible' | 'search'

type Dialog = 'salary' | 'bonus' | null

export function CompensationPage() {
  const datasource = useMemo(() => getCompensationDatasource(), [])
  const { success, fail } = useFeedback()
  const [searchParams] = useSearchParams()
  const focusRepId = searchParams.get('repId')

  const [board, setBoard] = useState<CompensationBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('reps')
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [highlightRepId, setHighlightRepId] = useState<string | null>(focusRepId)

  // راتب
  const [salaryRepId, setSalaryRepId] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(todayIsoDate())
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  // مكافأة
  const [bonusMode, setBonusMode] = useState<BonusMode>('eligible')
  const [reason, setReason] = useState('')
  const [selectedRepIds, setSelectedRepIds] = useState<string[]>([])
  const [bonusSearch, setBonusSearch] = useState('')
  const [pickedRepId, setPickedRepId] = useState('')

  async function reload() {
    setBoard(await datasource.getBoard())
  }

  useEffect(() => {
    let alive = true
    datasource
      .getBoard()
      .then((next) => {
        if (alive) setBoard(next)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر التحميل')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource])

  useEffect(() => {
    setHighlightRepId(focusRepId)
  }, [focusRepId])

  const filteredReps = useMemo(() => {
    if (!board) return []
    const rows = board.reps.filter((r) => matchesRepRegionSearch(r, query))
    if (!highlightRepId) return rows
    return [...rows].sort((a, b) => {
      if (a.repId === highlightRepId) return -1
      if (b.repId === highlightRepId) return 1
      return 0
    })
  }, [board, query, highlightRepId])

  const eligibleReps = useMemo(
    () => (board ? board.reps.filter((r) => r.eligibleForBonus) : []),
    [board],
  )

  const searchRepMatches = useMemo(() => {
    if (!board) return []
    return board.reps.filter((r) => matchesRepRegionSearch(r, bonusSearch))
  }, [board, bonusSearch])

  function openSalaryDialog(seed?: RepCompensationRow) {
    setFormError(null)
    const rep = seed ?? board?.reps[0]
    setSalaryRepId(rep?.repId ?? '')
    setAmount(rep?.fixedSalary != null ? String(rep.fixedSalary) : '')
    setStartDate(rep?.salaryStartDate ?? todayIsoDate())
    setEndDate('')
    setNotes('')
    setDialog('salary')
  }

  function openBonusDialog() {
    setFormError(null)
    setAmount('')
    setReason('')
    setBonusSearch('')
    setPickedRepId(board?.reps[0]?.repId ?? '')
    if (eligibleReps.length > 0) {
      setBonusMode('eligible')
      setSelectedRepIds(eligibleReps.map((r) => r.repId))
    } else {
      setBonusMode('search')
      setSelectedRepIds([])
    }
    setDialog('bonus')
  }

  function selectAllEligible() {
    setSelectedRepIds(eligibleReps.map((r) => r.repId))
  }

  function clearEligibleSelection() {
    setSelectedRepIds([])
  }

  async function submitSalary(e: FormEvent) {
    e.preventDefault()
    if (!salaryRepId) {
      setFormError('اختر المندوب')
      return
    }
    setBusy(true)
    setFormError(null)
    setError(null)
    setMessage(null)
    try {
      const ok = await datasource.upsertFixedSalary({
        repId: salaryRepId,
        amount: Number(amount),
        startDate,
        endDate: endDate || undefined,
        notes: notes || undefined,
      })
      setDialog(null)
      await reload()
      setMessage(ok)
      success(ok)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل الحفظ'
      setFormError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  async function submitBonus(e: FormEvent) {
    e.preventDefault()
    const repIds =
      bonusMode === 'eligible'
        ? selectedRepIds
        : pickedRepId
          ? [pickedRepId]
          : []
    if (!repIds.length) {
      setFormError('اختر مندوباً واحداً على الأقل')
      return
    }
    setBusy(true)
    setFormError(null)
    setError(null)
    setMessage(null)
    try {
      const ok = await datasource.awardBonus({
        repIds,
        amount: Number(amount),
        reason,
      })
      setDialog(null)
      await reload()
      setMessage(ok)
      success(ok)
      setTab('notices')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إرسال المكافأة'
      setFormError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  async function suspendSalary(repId: string) {
    setBusy(true)
    setError(null)
    try {
      const ok = await datasource.suspendFixedSalary(repId)
      await reload()
      setMessage(ok)
      success(ok)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل الإيقاف'
      setError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="cmp-status">جاري التحميل…</p>
  if (!board) return <p className="cmp-status error">{error ?? 'لا بيانات'}</p>

  const salaryRep = board.reps.find((r) => r.repId === salaryRepId)

  return (
    <div className="cmp-page">
      <header className="cmp-hero">
        <div>
          <h1>الراتب الثابت والمكافآت</h1>
          <p>
            {COMPENSATION_RULES.invoicerNote} الراتب اختياري بالكامل. المكافأة:
            اختصار للمؤهلين ≥{BONUS_ELIGIBILITY_THRESHOLD}% أو اختيار أي مندوب.
          </p>
        </div>
        <div className="cmp-hero-actions">
          <button
            type="button"
            className="cmp-btn-ghost"
            disabled={busy}
            onClick={() => openSalaryDialog()}
          >
            إضافة راتب ثابت
          </button>
          <button
            type="button"
            className="cmp-btn"
            disabled={busy}
            onClick={openBonusDialog}
          >
            إضافة مكافأة
          </button>
        </div>
      </header>

      {error ? <p className="cmp-status error">{error}</p> : null}
      {message ? <p className="cmp-status ok">{message}</p> : null}

      <div className="cmp-rules">
        <p>{COMPENSATION_RULES.salaryNote}</p>
        <p>{COMPENSATION_RULES.bonusNote}</p>
      </div>

      <div className="cmp-kpis">
        <article className="cmp-kpi">
          <span>المندوبون</span>
          <strong>{board.summary.repsCount}</strong>
        </article>
        <article className="cmp-kpi">
          <span>براتب ثابت</span>
          <strong>{board.summary.withFixedSalary}</strong>
        </article>
        <article className="cmp-kpi highlight">
          <span>مؤهلون ≥{BONUS_ELIGIBILITY_THRESHOLD}%</span>
          <strong>{board.summary.eligibleForBonus}</strong>
        </article>
        <article className="cmp-kpi">
          <span>مكافآت هذا الشهر</span>
          <strong>{board.summary.bonusesThisMonth}</strong>
        </article>
      </div>

      <div className="cmp-toolbar">
        <div className="cmp-tabs">
          {(
            [
              ['reps', 'المندوبون'],
              ['audit', 'السجل'],
              ['notices', 'الإشعارات'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'reps' ? (
          <input
            className="cmp-search"
            placeholder="بحث: مندوب أو رئيسية أو فرعية…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        ) : null}
      </div>

      {tab === 'reps' ? (
        <div className="cmp-table-card">
          <table>
            <thead>
              <tr>
                <th>المندوب</th>
                <th>المنطقة الرئيسية</th>
                <th>المناطق الفرعية</th>
                <th>التقييم</th>
                <th>الراتب الثابت</th>
                <th>آخر مكافأة</th>
                <th>عدد المكافآت</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredReps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="cmp-empty">
                    لا مندوبين مطابقين
                  </td>
                </tr>
              ) : (
                filteredReps.map((row) => (
                  <tr
                    key={row.repId}
                    className={
                      row.repId === highlightRepId ? 'cmp-row-focus' : undefined
                    }
                  >
                    <td>
                      <strong>{row.repName}</strong>
                    </td>
                    <td>
                      <span className="cmp-main-region">
                        {row.mainRegionLabel}
                      </span>
                    </td>
                    <td>
                      {row.subRegionLabels.length ? (
                        <div className="cmp-sub-regions">
                          {row.subRegionLabels.map((sub) => (
                            <span key={sub} className="cmp-sub-chip">
                              {sub}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span
                        className={`cmp-eval ${row.eligibleForBonus ? 'ok' : 'mid'}`}
                      >
                        {row.evaluationPercent}% · {row.evaluationGradeLabel}
                      </span>
                    </td>
                    <td>
                      {row.fixedSalary != null ? money(row.fixedSalary) : '—'}
                    </td>
                    <td>
                      {row.lastBonusAmount != null
                        ? money(row.lastBonusAmount)
                        : '—'}
                    </td>
                    <td>{row.bonusesCount}</td>
                    <td>
                      {row.salaryStatus ? (
                        <span
                          className={`badge ${row.salaryStatus === 'active' ? 'ok' : 'warn'}`}
                        >
                          {salaryStatusLabel(row.salaryStatus)}
                        </span>
                      ) : (
                        <span className="badge mute">بدون راتب</span>
                      )}
                    </td>
                    <td className="cmp-actions">
                      <button
                        type="button"
                        className="cmp-btn-ghost"
                        disabled={busy}
                        onClick={() => openSalaryDialog(row)}
                      >
                        تعديل راتب
                      </button>
                      {row.salaryStatus === 'active' ? (
                        <button
                          type="button"
                          className="cmp-btn-ghost danger"
                          disabled={busy}
                          onClick={() => suspendSalary(row.repId)}
                        >
                          إيقاف
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'audit' ? (
        <div className="cmp-table-card">
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>الإجراء</th>
                <th>المندوب</th>
                <th>القيمة</th>
                <th>السبب / ملاحظات</th>
                <th>المنفّذ</th>
              </tr>
            </thead>
            <tbody>
              {board.auditLog.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cmp-empty">
                    لا عمليات بعد
                  </td>
                </tr>
              ) : (
                board.auditLog.map((row) => (
                  <tr key={row.id}>
                    <td>{row.at.slice(0, 16).replace('T', ' ')}</td>
                    <td>
                      {row.type === 'fixed_salary' ? 'راتب ثابت' : 'مكافأة'}
                    </td>
                    <td>{actionLabel(row.action)}</td>
                    <td>{row.repName}</td>
                    <td>
                      <strong>{money(row.amount)}</strong>
                    </td>
                    <td>{row.reason || row.notes || '—'}</td>
                    <td>{row.actorName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'notices' ? (
        <div className="cmp-notices">
          {board.recentNotices.length === 0 ? (
            <p className="cmp-empty">لا إشعارات بعد</p>
          ) : (
            board.recentNotices.map((n) => (
              <article
                key={n.id}
                className={`cmp-notice ${n.audience === 'rep' ? 'rep' : 'inv'}`}
              >
                <header>
                  <strong>{n.title}</strong>
                  <span>
                    {n.audience === 'rep' ? '→ المندوب' : '→ المفوتر'} ·{' '}
                    {n.repName}
                  </span>
                </header>
                <p>{n.body}</p>
                <small>{n.createdAt.slice(0, 16).replace('T', ' ')}</small>
              </article>
            ))
          )}
        </div>
      ) : null}

      {dialog === 'salary' ? (
        <div className="cmp-modal-backdrop">
          <form className="cmp-modal" onSubmit={submitSalary}>
            <h3>إضافة / تعديل راتب ثابت</h3>
            <p className="cmp-hint">{COMPENSATION_RULES.salaryNote}</p>
            {formError ? <p className="cmp-status error">{formError}</p> : null}
            <label>
              المندوب *
              <select
                value={salaryRepId}
                onChange={(e) => {
                  const id = e.target.value
                  setSalaryRepId(id)
                  const rep = board.reps.find((r) => r.repId === id)
                  if (rep?.fixedSalary != null) {
                    setAmount(String(rep.fixedSalary))
                    setStartDate(rep.salaryStartDate ?? todayIsoDate())
                  }
                }}
                required
              >
                <option value="">اختر المندوب</option>
                {board.reps.map((r) => (
                  <option key={r.repId} value={r.repId}>
                    {r.repName} — {r.mainRegionLabel}
                    {r.subRegionLabels.length
                      ? ` · ${r.subRegionLabels.join('، ')}`
                      : ''}
                    {r.fixedSalary != null
                      ? ` (حالي: ${money(r.fixedSalary)})`
                      : ''}
                  </option>
                ))}
              </select>
            </label>
            {salaryRep ? (
              <p className="cmp-hint">
                التقييم الحالي: {salaryRep.evaluationPercent}% — لا يشترط
                للتثبيت
              </p>
            ) : null}
            <label>
              قيمة الراتب (ل.س) *
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <label>
              تاريخ الاعتماد *
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label>
              تاريخ النهاية (اختياري)
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <label>
              ملاحظات
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="cmp-form-actions">
              <button
                type="button"
                className="cmp-btn-ghost"
                onClick={() => setDialog(null)}
              >
                إلغاء
              </button>
              <button type="submit" className="cmp-btn" disabled={busy}>
                حفظ وإشعار
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {dialog === 'bonus' ? (
        <div className="cmp-modal-backdrop">
          <form className="cmp-modal wide" onSubmit={submitBonus}>
            <h3>إضافة مكافأة</h3>
            <p className="cmp-hint">{COMPENSATION_RULES.bonusNote}</p>
            {formError ? <p className="cmp-status error">{formError}</p> : null}

            <div className="cmp-mode-tabs">
              <button
                type="button"
                className={bonusMode === 'eligible' ? 'active' : ''}
                onClick={() => {
                  setBonusMode('eligible')
                  setSelectedRepIds(eligibleReps.map((r) => r.repId))
                }}
              >
                مؤهلون ≥{BONUS_ELIGIBILITY_THRESHOLD}% ({eligibleReps.length})
              </button>
              <button
                type="button"
                className={bonusMode === 'search' ? 'active' : ''}
                onClick={() => setBonusMode('search')}
              >
                بحث واختيار مندوب
              </button>
            </div>

            {bonusMode === 'eligible' ? (
              <div className="cmp-eligible-block">
                {eligibleReps.length === 0 ? (
                  <p className="cmp-hint">
                    لا يوجد حالياً مندوبون فوق {BONUS_ELIGIBILITY_THRESHOLD}% —
                    استخدم تبويب البحث لاختيار أي مندوب.
                  </p>
                ) : (
                  <>
                    <div className="cmp-eligible-actions">
                      <button
                        type="button"
                        className="cmp-btn-ghost"
                        onClick={selectAllEligible}
                      >
                        تحديد الجميع
                      </button>
                      <button
                        type="button"
                        className="cmp-btn-ghost"
                        onClick={clearEligibleSelection}
                      >
                        إلغاء التحديد
                      </button>
                      <span className="cmp-hint">
                        محدد: {selectedRepIds.length}
                      </span>
                    </div>
                    <div className="cmp-check-list">
                      {eligibleReps.map((r) => (
                        <label key={r.repId} className="cmp-check">
                          <input
                            type="checkbox"
                            checked={selectedRepIds.includes(r.repId)}
                            onChange={(e) => {
                              setSelectedRepIds((prev) =>
                                e.target.checked
                                  ? [...prev, r.repId]
                                  : prev.filter((id) => id !== r.repId),
                              )
                            }}
                          />
                          <span>
                            {r.repName} · {r.evaluationPercent}% (
                            {r.evaluationGradeLabel})
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="cmp-search-pick">
                <label>
                  بحث
                  <input
                    value={bonusSearch}
                    onChange={(e) => setBonusSearch(e.target.value)}
                    placeholder="اسم المندوب أو الرئيسية أو الفرعية…"
                  />
                </label>
                <label>
                  المندوب *
                  <select
                    value={pickedRepId}
                    onChange={(e) => setPickedRepId(e.target.value)}
                    required={bonusMode === 'search'}
                  >
                    <option value="">اختر المندوب</option>
                    {searchRepMatches.map((r) => (
                      <option key={r.repId} value={r.repId}>
                        {r.repName} — {r.mainRegionLabel}
                        {r.subRegionLabels.length
                          ? ` (${r.subRegionLabels.join('، ')})`
                          : ''}{' '}
                        ({r.evaluationPercent}%)
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <label>
              قيمة المكافأة (ل.س) *
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <label>
              السبب *
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="مثال: مكافأة أداء"
              />
            </label>
            <div className="cmp-form-actions">
              <button
                type="button"
                className="cmp-btn-ghost"
                onClick={() => setDialog(null)}
              >
                إلغاء
              </button>
              <button type="submit" className="cmp-btn" disabled={busy}>
                إرسال للمفوتر والمندوب
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function actionLabel(action: string): string {
  switch (action) {
    case 'create':
      return 'إضافة'
    case 'update':
      return 'تعديل'
    case 'suspend':
      return 'إيقاف'
    case 'award':
      return 'منح'
    default:
      return action
  }
}
