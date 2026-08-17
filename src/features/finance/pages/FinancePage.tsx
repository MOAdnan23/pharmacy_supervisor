/**
 * المالية وذمم الصيدليات — مطابقة لوحدة المفوتر
 * تبويبات: المؤشرات | الصيدليات | المندوبون | الحركات
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getFinanceDatasource } from '../data'
import type {
  FinanceBoard,
  FinanceFilter,
  FinanceKpiKind,
  FinancialAdjustmentType,
  FinancialMovement,
  FinancialMovementType,
  PharmacyFinanceRow,
} from '../domain/financeEntities'
import {
  FINANCE_RULE_BANNER,
  FINANCE_SUBTITLE,
  adjustmentTypeLabel,
  defaultFinanceFilter,
  isDebtor,
  kpiCatalog,
  money,
  movementTypeLabel,
} from '../domain/financeLabels'
import {
  exportPharmacyStatementPdf,
  exportRegionStatementPdf,
} from '../services/financePdfService'
import './finance.css'

type TabId = 'overview' | 'pharmacies' | 'reps' | 'movements'

type KpiFocus = {
  kind: FinanceKpiKind
  title: string
  targetTab: TabId
}

const TAB_BY_INDEX: TabId[] = ['overview', 'pharmacies', 'reps', 'movements']

function movementMatchesKpi(
  m: FinancialMovement,
  kind: FinanceKpiKind,
): boolean {
  const map: Partial<Record<FinanceKpiKind, FinancialMovementType[]>> = {
    sales: ['invoice'],
    collections: ['collection'],
    returns: ['return_voucher'],
    invoiceCount: ['invoice'],
    collectionCount: ['collection'],
    returnCount: ['return_voucher'],
    avgCollection: ['collection'],
  }
  const types = map[kind]
  if (!types) return true
  return types.includes(m.type)
}

function pharmacyMatchesKpi(
  row: PharmacyFinanceRow,
  kind: FinanceKpiKind,
): boolean {
  if (kind === 'debts' || kind === 'debtors') return isDebtor(row.currentBalance)
  if (kind === 'settled') return !isDebtor(row.currentBalance)
  return true
}

export function FinancePage() {
  const datasource = useMemo(() => getFinanceDatasource(), [])
  const [searchParams] = useSearchParams()

  const [board, setBoard] = useState<FinanceBoard | null>(null)
  const [filter, setFilter] = useState<FinanceFilter>(() => {
    const base = defaultFinanceFilter()
    // نطاق أوضح للعرض التجريبي مع بيانات آب
    return { ...base, from: '2026-08-01', to: base.to }
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [kpiFocus, setKpiFocus] = useState<KpiFocus | null>(null)

  const [statement, setStatement] = useState<PharmacyFinanceRow | null>(null)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjPharmacyId, setAdjPharmacyId] = useState('')
  const [adjType, setAdjType] = useState<FinancialAdjustmentType>('debit')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReason, setAdjReason] = useState('')
  const [adjError, setAdjError] = useState<string | null>(null)

  async function reload(nextFilter = filter) {
    const next = await datasource.getBoard(nextFilter)
    setBoard(next)
    setFilter(next.filter)
  }

  useEffect(() => {
    let alive = true
    const initial: FinanceFilter = {
      ...defaultFinanceFilter(),
      from: '2026-08-01',
      pharmacyId: searchParams.get('pharmacyId'),
      repId: searchParams.get('repId'),
    }
    datasource
      .getBoard(initial)
      .then((next) => {
        if (!alive) return
        setBoard(next)
        setFilter(next.filter)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر تحميل المالية')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource, searchParams])

  async function applyFilter(patch: Partial<FinanceFilter>) {
    const next: FinanceFilter = { ...filter, ...patch }
    if (patch.mainRegionId !== undefined && patch.mainRegionId !== filter.mainRegionId) {
      next.subRegionId = null
      next.pharmacyId = null
    }
    setBusy(true)
    setError(null)
    try {
      await reload(next)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الفلاتر')
    } finally {
      setBusy(false)
    }
  }

  function openKpi(kind: FinanceKpiKind, title: string, targetTab: 0 | 1 | 2 | 3) {
    const tabId = TAB_BY_INDEX[targetTab]
    setKpiFocus({ kind, title, targetTab: tabId })
    setTab(tabId)
  }

  const filteredPharmacies = useMemo(() => {
    if (!board) return []
    let rows = board.dashboard.pharmacies
    if (kpiFocus && kpiFocus.targetTab === 'pharmacies') {
      rows = rows.filter((r) => pharmacyMatchesKpi(r, kpiFocus.kind))
    }
    return rows
  }, [board, kpiFocus])

  const filteredMovements = useMemo(() => {
    if (!board) return []
    let rows = board.dashboard.movements
    if (kpiFocus && kpiFocus.targetTab === 'movements') {
      rows = rows.filter((m) => movementMatchesKpi(m, kpiFocus.kind))
    }
    return rows
  }, [board, kpiFocus])

  const statementMoves = useMemo(() => {
    if (!board || !statement) return []
    return board.dashboard.movements.filter(
      (m) => m.pharmacyId === statement.pharmacyId,
    )
  }, [board, statement])

  const subRegions = useMemo(() => {
    if (!board || !filter.mainRegionId) return []
    return (
      board.regions.find((r) => r.id === filter.mainRegionId)?.subRegions ?? []
    )
  }, [board, filter.mainRegionId])

  const pharmacyOptions = useMemo(() => {
    if (!board) return []
    return board.pharmacies.filter((p) => {
      if (filter.mainRegionId && p.mainRegionId !== filter.mainRegionId)
        return false
      if (filter.subRegionId && p.subRegionId !== filter.subRegionId) return false
      return true
    })
  }, [board, filter.mainRegionId, filter.subRegionId])

  const selectedRepName = board?.reps.find((r) => r.id === filter.repId)?.name
  const regionLabel =
    board?.regions.find((r) => r.id === filter.mainRegionId)?.name ?? 'كل المناطق'

  async function onExportRegion() {
    if (!board) return
    setBusy(true)
    try {
      await exportRegionStatementPdf({
        dashboard: board.dashboard,
        filter,
        regionLabel,
        repName: selectedRepName,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل تصدير PDF')
    } finally {
      setBusy(false)
    }
  }

  async function onExportPharmacy(print = false) {
    if (!statement) return
    setBusy(true)
    try {
      await exportPharmacyStatementPdf({
        pharmacy: statement,
        movements: statementMoves,
        filter,
        repName: selectedRepName,
        print,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل تصدير كشف الصيدلية')
    } finally {
      setBusy(false)
    }
  }

  async function submitAdjustment(e: FormEvent) {
    e.preventDefault()
    setAdjError(null)
    setBusy(true)
    try {
      await datasource.createAdjustment({
        pharmacyId: adjPharmacyId,
        type: adjType,
        amount: Number(adjAmount),
        reason: adjReason,
      })
      setShowAdjust(false)
      setMessage(
        'تم الاعتماد — سُجّل عند المندوب والمفوتر مع رصيد الصيدلية وموقعها',
      )
      await reload(filter)
    } catch (err: unknown) {
      setAdjError(err instanceof Error ? err.message : 'فشل التعديل')
    } finally {
      setBusy(false)
    }
  }

  const adjPharmacy = board?.pharmacies.find((p) => p.id === adjPharmacyId)
  const adjPreviewBefore = adjPharmacy?.currentBalance ?? 0
  const adjAmt = Number(adjAmount) || 0
  const adjPreviewAfter =
    adjType === 'debit' ? adjPreviewBefore + adjAmt : adjPreviewBefore - adjAmt

  if (loading) {
    return <p className="fin-status">جاري تجميع البيانات المالية...</p>
  }
  if (!board) {
    return <p className="fin-status error">{error ?? 'لا بيانات'}</p>
  }

  const kpis = kpiCatalog(board.dashboard.summary)

  return (
    <div className="fin-page">
      <header className="fin-hero">
        <div>
          <h1>المالية وذمم الصيدليات</h1>
          <p>{FINANCE_SUBTITLE}</p>
        </div>
        <div className="fin-hero-actions">
          <button
            type="button"
            className="fin-btn-ghost"
            disabled={busy}
            onClick={() => {
              setAdjError(null)
              setAdjPharmacyId(board.pharmacies[0]?.id ?? '')
              setAdjType('debit')
              setAdjAmount('')
              setAdjReason('')
              setShowAdjust(true)
            }}
          >
            تعديل مالي
          </button>
          <button
            type="button"
            className="fin-btn"
            disabled={busy}
            onClick={onExportRegion}
          >
            {filter.repId
              ? 'كشف المنطقة للمندوب PDF'
              : 'كشف المنطقة PDF'}
          </button>
        </div>
      </header>

      {error ? <p className="fin-status error">{error}</p> : null}
      {message ? <p className="fin-status ok">{message}</p> : null}

      <div className="fin-filters">
        <label>
          المنطقة العامة
          <select
            value={filter.mainRegionId ?? ''}
            onChange={(e) =>
              applyFilter({
                mainRegionId: e.target.value || null,
              })
            }
          >
            <option value="">الكل</option>
            {board.regions.map((r) => (
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
            disabled={!filter.mainRegionId}
            onChange={(e) =>
              applyFilter({ subRegionId: e.target.value || null })
            }
          >
            <option value="">الكل</option>
            {subRegions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          المندوب
          <select
            value={filter.repId ?? ''}
            onChange={(e) => applyFilter({ repId: e.target.value || null })}
          >
            <option value="">الكل</option>
            {board.reps.map((r) => (
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
              applyFilter({ pharmacyId: e.target.value || null })
            }
          >
            <option value="">الكل</option>
            {pharmacyOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
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
        <button
          type="button"
          className="fin-btn-ghost"
          title="تحديث"
          disabled={busy}
          onClick={() => applyFilter({})}
        >
          تحديث
        </button>
      </div>

      <div className="fin-tabs">
        {(
          [
            ['overview', 'المؤشرات'],
            ['pharmacies', 'الصيدليات'],
            ['reps', 'المندوبون'],
            ['movements', 'الحركات'],
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

      {tab === 'overview' ? (
        <section className="fin-overview">
          <p className="fin-banner">{FINANCE_RULE_BANNER}</p>
          <p className="fin-hint">
            اضغط على أي مؤشر لعرض تفاصيله في تبويب الحركات أو الصيدليات مع توضيح
            واضح للمصدر.
          </p>
          <div className="fin-kpis">
            {kpis.map((k) => (
              <button
                key={k.kind}
                type="button"
                className={`fin-kpi ${kpiFocus?.kind === k.kind ? 'selected' : ''}`}
                onClick={() => openKpi(k.kind, k.title, k.targetTab)}
              >
                <span>{k.title}</span>
                <strong>{k.value}</strong>
                <small>{kpiFocus?.kind === k.kind ? 'محدد' : 'تفاصيل'}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {tab === 'pharmacies' ? (
        <section>
          {kpiFocus?.targetTab === 'pharmacies' ? (
            <div className="fin-focus-bar">
              <span>
                المؤشر المحدد: {kpiFocus.title} · {filteredPharmacies.length}{' '}
                صيدلية
              </span>
              <button type="button" onClick={() => setKpiFocus(null)}>
                إظهار الكل
              </button>
            </div>
          ) : null}
          <div className="fin-table-card">
            <table>
              <thead>
                <tr>
                  <th>الصيدلية</th>
                  <th>المنطقة</th>
                  <th>المبيعات</th>
                  <th>التحصيلات</th>
                  <th>المرتجعات</th>
                  <th>{filter.repId ? 'رصيد التعامل' : 'الذمة الحالية'}</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredPharmacies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="fin-empty">
                      لا توجد صيدليات مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredPharmacies.map((row) => (
                    <tr key={row.pharmacyId}>
                      <td>
                        <strong>{row.pharmacyName}</strong>
                      </td>
                      <td>{row.regionLabel}</td>
                      <td>{money(row.sales)}</td>
                      <td>{money(row.collections)}</td>
                      <td>{money(row.returns)}</td>
                      <td>
                        <strong>{money(row.currentBalance)}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${isDebtor(row.currentBalance) ? 'warn' : 'ok'}`}
                        >
                          {isDebtor(row.currentBalance) ? 'مدينة' : 'مسددة'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="fin-btn-ghost"
                          onClick={() => setStatement(row)}
                        >
                          {filter.repId
                            ? 'كشف تعامل المندوب'
                            : 'كشف الحساب'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'reps' ? (
        <div className="fin-table-card">
          <table>
            <thead>
              <tr>
                <th>المندوب</th>
                <th>الصيدليات</th>
                <th>المبيعات</th>
                <th>التحصيلات</th>
                <th>المرتجعات</th>
                <th>ذمم صيدلياته</th>
              </tr>
            </thead>
            <tbody>
              {board.dashboard.reps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="fin-empty">
                    لا توجد بيانات مندوبين ضمن الفترة
                  </td>
                </tr>
              ) : (
                board.dashboard.reps.map((row) => (
                  <tr key={row.repId}>
                    <td>
                      <strong>{row.repName}</strong>
                    </td>
                    <td>{row.pharmacyCount}</td>
                    <td>{money(row.sales)}</td>
                    <td>{money(row.collections)}</td>
                    <td>{money(row.returns)}</td>
                    <td>{money(row.debts)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'movements' ? (
        <section>
          {kpiFocus?.targetTab === 'movements' ? (
            <div className="fin-focus-bar">
              <span>
                المؤشر المحدد: {kpiFocus.title} · {filteredMovements.length} حركة
              </span>
              <button type="button" onClick={() => setKpiFocus(null)}>
                إظهار الكل
              </button>
            </div>
          ) : null}
          <div className="fin-table-card">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الصيدلية</th>
                  <th>الحركة</th>
                  <th>رقم العملية</th>
                  <th>مدين</th>
                  <th>دائن</th>
                  <th>الرصيد</th>
                  <th>المندوب</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="fin-empty">
                      لا توجد حركات ضمن الفترة المحددة
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.id}>
                      <td>{m.date}</td>
                      <td>{m.pharmacyName}</td>
                      <td>{movementTypeLabel(m.type)}</td>
                      <td>{m.referenceNumber}</td>
                      <td>{m.debit ? money(m.debit) : '—'}</td>
                      <td>{m.credit ? money(m.credit) : '—'}</td>
                      <td>
                        <strong>{money(m.balanceAfter)}</strong>
                      </td>
                      <td>{m.repName ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {statement ? (
        <div className="fin-modal-backdrop">
          <div className="fin-modal wide">
            <h3>
              {selectedRepName
                ? `كشف حساب ${statement.pharmacyName} — للمندوب ${selectedRepName}`
                : `كشف حساب ${statement.pharmacyName}`}
            </h3>
            <p className="fin-hint">
              {statement.regionLabel} — {statement.address}
            </p>
            {selectedRepName ? (
              <p className="fin-hint">
                ملخص تعامل المندوب {selectedRepName} (وليس ذمة الصيدلية الكاملة)
              </p>
            ) : null}
            <div className="fin-mini-metrics">
              <span>المبيعات: {money(statement.sales)}</span>
              <span>التحصيلات: {money(statement.collections)}</span>
              <span>المرتجعات: {money(statement.returns)}</span>
              <span>
                {selectedRepName ? 'رصيد التعامل' : 'الرصيد الحالي'}:{' '}
                {money(statement.currentBalance)}
              </span>
            </div>
            <div className="fin-table-card tight">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الحركة</th>
                    <th>رقم العملية</th>
                    <th>مدين</th>
                    <th>دائن</th>
                    <th>الرصيد</th>
                    <th>المندوب</th>
                  </tr>
                </thead>
                <tbody>
                  {statementMoves.map((m) => (
                    <tr key={m.id}>
                      <td>{m.date}</td>
                      <td>{movementTypeLabel(m.type)}</td>
                      <td>{m.referenceNumber}</td>
                      <td>{m.debit ? money(m.debit) : '—'}</td>
                      <td>{m.credit ? money(m.credit) : '—'}</td>
                      <td>{money(m.balanceAfter)}</td>
                      <td>{m.repName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="fin-form-actions">
              <button
                type="button"
                className="fin-btn-ghost"
                onClick={() => setStatement(null)}
              >
                إغلاق
              </button>
              <button
                type="button"
                className="fin-btn-ghost"
                disabled={busy}
                onClick={() => onExportPharmacy(true)}
              >
                طباعة
              </button>
              <button
                type="button"
                className="fin-btn"
                disabled={busy}
                onClick={() => onExportPharmacy(false)}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAdjust ? (
        <div className="fin-modal-backdrop">
          <form className="fin-modal" onSubmit={submitAdjustment}>
            <h3>تعديل مالي مباشر</h3>
            <p className="fin-banner">
              المشرف يدخل أي مبلغ يريده. عند الاعتماد يُسجَّل عند المندوب
              والمفوتر مع رصيد الصيدلية وموقعها.
            </p>
            {adjError ? <p className="fin-status error">{adjError}</p> : null}
            <label>
              الصيدلية *
              <select
                value={adjPharmacyId}
                onChange={(e) => setAdjPharmacyId(e.target.value)}
                required
              >
                {board.pharmacies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — رصيد {money(p.currentBalance)}
                  </option>
                ))}
              </select>
            </label>
            {adjPharmacy ? (
              <div className="fin-adj-pharmacy-card">
                <p>
                  <strong>رصيد الصيدلية الحالي:</strong>{' '}
                  {money(adjPharmacy.currentBalance)}
                </p>
                <p>
                  <strong>أين معلومات الصيدلية:</strong>{' '}
                  {board.regions.find((r) => r.id === adjPharmacy.mainRegionId)
                    ?.name ?? '—'}{' '}
                  —{' '}
                  {board.regions
                    .find((r) => r.id === adjPharmacy.mainRegionId)
                    ?.subRegions.find((s) => s.id === adjPharmacy.subRegionId)
                    ?.name ?? '—'}{' '}
                  · {adjPharmacy.address}
                </p>
                <p>
                  <strong>المناديب المرتبطون:</strong>{' '}
                  {adjPharmacy.repNames.join('، ') || '—'}
                </p>
              </div>
            ) : null}
            <div className="fin-seg">
              {(['debit', 'credit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={adjType === t ? 'active' : ''}
                  onClick={() => setAdjType(t)}
                >
                  {adjustmentTypeLabel(t)}
                </button>
              ))}
            </div>
            <label>
              المبلغ * (ل.س) — أي رقم يحدده المشرف
              <input
                type="number"
                step="any"
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
                required
                placeholder="مثال: 50000 أو 1250.5"
              />
            </label>
            <label>
              سبب التعديل *
              <textarea
                rows={2}
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                required
                placeholder="السبب إلزامي ويظهر للمندوب والمفوتر"
              />
            </label>
            <div className="fin-mini-metrics">
              <span>الرصيد قبل: {money(adjPreviewBefore)}</span>
              <span>المبلغ: {money(adjAmt)}</span>
              <span>الرصيد بعد: {money(adjPreviewAfter)}</span>
            </div>
            <div className="fin-form-actions">
              <button
                type="button"
                className="fin-btn-ghost"
                onClick={() => setShowAdjust(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="fin-btn" disabled={busy}>
                اعتماد وإشعار المندوب/المفوتر
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
