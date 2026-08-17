/**
 * UC-84 → UC-96 — إدارة نسب الشركات والأصناف
 * الكتالوج من المفوتر (Mock/API)؛ النسب يحددها المشرف فقط.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getRatesDatasource } from '../data'
import type {
  CompanyCommissionRate,
  PreviewCommissionResult,
  ProductCommissionRate,
  RateStatus,
  RatesBoard,
} from '../domain/rateEntities'
import {
  CATALOG_SOURCE_NOTE,
  RATE_PRIORITY_RULE,
  auditActionLabel,
  rateStatusLabel,
  rateStatusTone,
} from '../domain/rateLabels'
import { todayIsoDate } from '../domain/rateValidation'
import './rates.css'

type TabId = 'companies' | 'products' | 'preview' | 'audit'

type CompanyDialog =
  | { mode: 'create' }
  | { mode: 'edit'; row: CompanyCommissionRate }
  | null

type ProductDialog =
  | { mode: 'create' }
  | { mode: 'edit'; row: ProductCommissionRate }
  | null

function money(n: number): string {
  return `${n.toLocaleString('ar-SY', { maximumFractionDigits: 2 })} ل.س`
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  return iso.slice(0, 16).replace('T', ' ')
}

export function RatesPage() {
  const datasource = useMemo(() => getRatesDatasource(), [])

  const [board, setBoard] = useState<RatesBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('companies')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RateStatus>('all')
  const [companyFilter, setCompanyFilter] = useState('all')

  const [companyDialog, setCompanyDialog] = useState<CompanyDialog>(null)
  const [productDialog, setProductDialog] = useState<ProductDialog>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [companyId, setCompanyId] = useState('')
  const [productId, setProductId] = useState('')
  const [percent, setPercent] = useState('')
  const [startDate, setStartDate] = useState(todayIsoDate())
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  const [previewRepId, setPreviewRepId] = useState('')
  const [previewCompanyId, setPreviewCompanyId] = useState('')
  const [previewProductId, setPreviewProductId] = useState('')
  const [previewAmount, setPreviewAmount] = useState('')
  const [previewResult, setPreviewResult] =
    useState<PreviewCommissionResult | null>(null)

  async function reload() {
    setBoard(await datasource.getBoard())
  }

  useEffect(() => {
    let alive = true
    datasource
      .getBoard()
      .then((next) => {
        if (!alive) return
        setBoard(next)
        if (next.repOptions[0]) setPreviewRepId(next.repOptions[0].id)
        if (next.catalogCompanies[0]) {
          setPreviewCompanyId(next.catalogCompanies[0].id)
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر تحميل النسب')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource])

  const filteredCompanyRates = useMemo(() => {
    if (!board) return []
    const q = query.trim().toLowerCase()
    return board.companyRates.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (companyFilter !== 'all' && r.companyId !== companyFilter) return false
      if (!q) return true
      return (
        r.companyName.toLowerCase().includes(q) ||
        String(r.percent).includes(q)
      )
    })
  }, [board, query, statusFilter, companyFilter])

  const filteredProductRates = useMemo(() => {
    if (!board) return []
    const q = query.trim().toLowerCase()
    return board.productRates.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (companyFilter !== 'all' && r.companyId !== companyFilter) return false
      if (!q) return true
      return (
        r.productName.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q) ||
        String(r.percent).includes(q)
      )
    })
  }, [board, query, statusFilter, companyFilter])

  const productsForCompany = useMemo(() => {
    if (!board || !companyId) return []
    return board.catalogProducts.filter((p) => p.companyId === companyId)
  }, [board, companyId])

  const previewProducts = useMemo(() => {
    if (!board || !previewCompanyId) return []
    return board.catalogProducts.filter((p) => p.companyId === previewCompanyId)
  }, [board, previewCompanyId])

  function openCompanyCreate() {
    setFormError(null)
    setCompanyId(board?.catalogCompanies[0]?.id ?? '')
    setPercent('')
    setStartDate(todayIsoDate())
    setEndDate('')
    setNotes('')
    setCompanyDialog({ mode: 'create' })
  }

  function openCompanyEdit(row: CompanyCommissionRate) {
    setFormError(null)
    setCompanyId(row.companyId)
    setPercent(String(row.percent))
    setStartDate(row.startDate)
    setEndDate(row.endDate ?? '')
    setNotes(row.notes ?? '')
    setCompanyDialog({ mode: 'edit', row })
  }

  function openProductCreate() {
    setFormError(null)
    const firstCompany = board?.catalogCompanies[0]?.id ?? ''
    setCompanyId(firstCompany)
    const firstProduct =
      board?.catalogProducts.find((p) => p.companyId === firstCompany)?.id ?? ''
    setProductId(firstProduct)
    setPercent('')
    setStartDate(todayIsoDate())
    setEndDate('')
    setNotes('')
    setProductDialog({ mode: 'create' })
  }

  function openProductEdit(row: ProductCommissionRate) {
    setFormError(null)
    setCompanyId(row.companyId)
    setProductId(row.productId)
    setPercent(String(row.percent))
    setStartDate(row.startDate)
    setEndDate(row.endDate ?? '')
    setNotes(row.notes ?? '')
    setProductDialog({ mode: 'edit', row })
  }

  async function submitCompany(e: FormEvent) {
    e.preventDefault()
    if (!companyDialog) return
    setBusy(true)
    setFormError(null)
    try {
      await datasource.upsertCompanyRate({
        id: companyDialog.mode === 'edit' ? companyDialog.row.id : undefined,
        companyId,
        percent: Number(percent),
        startDate,
        endDate: endDate || undefined,
        notes: notes || undefined,
      })
      setCompanyDialog(null)
      await reload()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function submitProduct(e: FormEvent) {
    e.preventDefault()
    if (!productDialog) return
    setBusy(true)
    setFormError(null)
    try {
      await datasource.upsertProductRate({
        id: productDialog.mode === 'edit' ? productDialog.row.id : undefined,
        productId,
        percent: Number(percent),
        startDate,
        endDate: endDate || undefined,
        notes: notes || undefined,
      })
      setProductDialog(null)
      await reload()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setBusy(false)
    }
  }

  async function suspendCompany(id: string) {
    setBusy(true)
    setError(null)
    try {
      await datasource.suspendCompanyRate(id)
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الإيقاف')
    } finally {
      setBusy(false)
    }
  }

  async function suspendProduct(id: string) {
    setBusy(true)
    setError(null)
    try {
      await datasource.suspendProductRate(id)
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الإيقاف')
    } finally {
      setBusy(false)
    }
  }

  async function removeProduct(id: string) {
    if (!window.confirm('حذف النسبة الخاصة لهذا الصنف؟')) return
    setBusy(true)
    setError(null)
    try {
      await datasource.deleteProductRate(id)
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الحذف')
    } finally {
      setBusy(false)
    }
  }

  async function runPreview(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setPreviewResult(null)
    try {
      const result = await datasource.previewCommission({
        repId: previewRepId,
        companyId: previewCompanyId,
        productId: previewProductId,
        salesAmount: Number(previewAmount),
      })
      setPreviewResult(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل المعاينة')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="rates-status">جاري التحميل…</p>
  if (!board) {
    return <p className="rates-status error">{error ?? 'لا بيانات'}</p>
  }

  const baseForSelected =
    board.companyRates.find(
      (r) =>
        r.companyId === companyId &&
        r.status === 'active' &&
        r.startDate <= todayIsoDate() &&
        (!r.endDate || r.endDate >= todayIsoDate()),
    )?.percent ?? null

  return (
    <div className="rates-page">
      <header className="rates-hero">
        <div>
          <h1>نسب الشركات والأصناف</h1>
          <p>
            تحديد نسب العمولة فقط. {CATALOG_SOURCE_NOTE} {RATE_PRIORITY_RULE}
          </p>
        </div>
      </header>

      {error ? <p className="rates-status error">{error}</p> : null}

      <div className="rates-kpis">
        <article className="rates-kpi">
          <span>شركات الكتالوج</span>
          <strong>{board.summary.companiesCount}</strong>
        </article>
        <article className="rates-kpi">
          <span>نسب شركات فعّالة</span>
          <strong>{board.summary.activeCompanyRates}</strong>
        </article>
        <article className="rates-kpi">
          <span>أصناف بنسبة خاصة</span>
          <strong>{board.summary.specialProductRates}</strong>
        </article>
        <article className="rates-kpi">
          <span>آخر تعديل</span>
          <strong className="rates-kpi-sm">
            {formatWhen(board.summary.lastUpdatedAt)}
          </strong>
        </article>
      </div>

      <div className="rates-toolbar">
        <div className="rates-tabs">
          <button
            type="button"
            className={tab === 'companies' ? 'active' : ''}
            onClick={() => setTab('companies')}
          >
            نسب الشركات
          </button>
          <button
            type="button"
            className={tab === 'products' ? 'active' : ''}
            onClick={() => setTab('products')}
          >
            نسب الأصناف الخاصة
          </button>
          <button
            type="button"
            className={tab === 'preview' ? 'active' : ''}
            onClick={() => setTab('preview')}
          >
            معاينة الاحتساب
          </button>
          <button
            type="button"
            className={tab === 'audit' ? 'active' : ''}
            onClick={() => setTab('audit')}
          >
            سجل التعديلات
          </button>
        </div>

        {tab === 'companies' || tab === 'products' ? (
          <div className="rates-filters">
            <input
              placeholder="بحث…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="all">كل الشركات</option>
              {board.catalogCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | RateStatus)
              }
            >
              <option value="all">كل الحالات</option>
              <option value="active">فعّالة</option>
              <option value="suspended">موقوفة</option>
              <option value="expired">منتهية</option>
            </select>
            {tab === 'companies' ? (
              <button
                type="button"
                className="rates-btn"
                onClick={openCompanyCreate}
                disabled={busy}
              >
                إضافة نسبة شركة
              </button>
            ) : (
              <button
                type="button"
                className="rates-btn"
                onClick={openProductCreate}
                disabled={busy}
              >
                إضافة نسبة صنف
              </button>
            )}
          </div>
        ) : null}
      </div>

      {tab === 'companies' ? (
        <div className="rates-table-card">
          <table>
            <thead>
              <tr>
                <th>الشركة</th>
                <th>النسبة %</th>
                <th>البداية</th>
                <th>النهاية</th>
                <th>الحالة</th>
                <th>آخر تعديل</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanyRates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="rates-empty">
                    لا نسب مطابقة
                  </td>
                </tr>
              ) : (
                filteredCompanyRates.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.companyName}</strong>
                    </td>
                    <td>{row.percent}%</td>
                    <td>{row.startDate}</td>
                    <td>{row.endDate ?? '—'}</td>
                    <td>
                      <span className={`badge ${rateStatusTone(row.status)}`}>
                        {rateStatusLabel(row.status)}
                      </span>
                    </td>
                    <td>{formatWhen(row.updatedAt)}</td>
                    <td className="rates-actions">
                      <button
                        type="button"
                        className="rates-btn-ghost"
                        onClick={() => openCompanyEdit(row)}
                        disabled={busy}
                      >
                        تعديل
                      </button>
                      {row.status === 'active' ? (
                        <button
                          type="button"
                          className="rates-btn-ghost"
                          onClick={() => suspendCompany(row.id)}
                          disabled={busy}
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

      {tab === 'products' ? (
        <div className="rates-table-card">
          <table>
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الشركة</th>
                <th>نسبة خاصة %</th>
                <th>نسبة الشركة</th>
                <th>البداية</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductRates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="rates-empty">
                    لا نسب خاصة مطابقة
                  </td>
                </tr>
              ) : (
                filteredProductRates.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.productName}</strong>
                    </td>
                    <td>{row.companyName}</td>
                    <td>{row.percent}%</td>
                    <td>{row.companyBasePercent}%</td>
                    <td>{row.startDate}</td>
                    <td>
                      <span className={`badge ${rateStatusTone(row.status)}`}>
                        {rateStatusLabel(row.status)}
                      </span>
                    </td>
                    <td className="rates-actions">
                      <button
                        type="button"
                        className="rates-btn-ghost"
                        onClick={() => openProductEdit(row)}
                        disabled={busy}
                      >
                        تعديل
                      </button>
                      {row.status === 'active' ? (
                        <button
                          type="button"
                          className="rates-btn-ghost"
                          onClick={() => suspendProduct(row.id)}
                          disabled={busy}
                        >
                          إيقاف
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rates-btn-ghost danger"
                        onClick={() => removeProduct(row.id)}
                        disabled={busy}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'preview' ? (
        <section className="rates-preview">
          <p className="rates-note">
            أداة تقديرية فقط — لا تنشئ كشف راتب. الصرف من صلاحيات المفوتر.
          </p>
          <form className="rates-form-grid" onSubmit={runPreview}>
            <label>
              المندوب
              <select
                value={previewRepId}
                onChange={(e) => setPreviewRepId(e.target.value)}
              >
                {board.repOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              الشركة
              <select
                value={previewCompanyId}
                onChange={(e) => {
                  setPreviewCompanyId(e.target.value)
                  setPreviewProductId('')
                  setPreviewResult(null)
                }}
              >
                {board.catalogCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              الصنف
              <select
                value={previewProductId}
                onChange={(e) => {
                  setPreviewProductId(e.target.value)
                  setPreviewResult(null)
                }}
                required
              >
                <option value="">اختر صنفاً</option>
                {previewProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              قيمة المبيعات
              <input
                type="number"
                min={0}
                step="1000"
                value={previewAmount}
                onChange={(e) => setPreviewAmount(e.target.value)}
                required
              />
            </label>
            <div className="rates-form-actions">
              <button type="submit" className="rates-btn" disabled={busy}>
                احتساب تقديري
              </button>
            </div>
          </form>

          {previewResult ? (
            <div className="rates-preview-result">
              <div>
                <span>المصدر</span>
                <strong>{previewResult.sourceLabel}</strong>
              </div>
              <div>
                <span>النسبة المعتمدة</span>
                <strong>{previewResult.appliedPercent}%</strong>
              </div>
              <div>
                <span>عمولة تقديرية</span>
                <strong>{money(previewResult.estimatedCommission)}</strong>
              </div>
              <div>
                <span>نسبة الشركة</span>
                <strong>
                  {previewResult.companyBasePercent != null
                    ? `${previewResult.companyBasePercent}%`
                    : '—'}
                </strong>
              </div>
              <div>
                <span>نسبة الصنف الخاصة</span>
                <strong>
                  {previewResult.productSpecialPercent != null
                    ? `${previewResult.productSpecialPercent}%`
                    : '—'}
                </strong>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'audit' ? (
        <div className="rates-table-card">
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>المستخدم</th>
                <th>الإجراء</th>
                <th>الشركة</th>
                <th>الصنف</th>
                <th>السابقة</th>
                <th>الجديدة</th>
                <th>ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {board.auditLog.length === 0 ? (
                <tr>
                  <td colSpan={8} className="rates-empty">
                    لا تعديلات بعد
                  </td>
                </tr>
              ) : (
                board.auditLog.map((row) => (
                  <tr key={row.id}>
                    <td>{formatWhen(row.at)}</td>
                    <td>{row.userName}</td>
                    <td>{auditActionLabel(row.action)}</td>
                    <td>{row.companyName}</td>
                    <td>{row.productName ?? '—'}</td>
                    <td>
                      {row.previousPercent != null
                        ? `${row.previousPercent}%`
                        : '—'}
                    </td>
                    <td>
                      {row.newPercent != null ? `${row.newPercent}%` : '—'}
                    </td>
                    <td>{row.note ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {companyDialog ? (
        <div className="rates-modal-backdrop">
          <form className="rates-modal" onSubmit={submitCompany}>
            <h3>
              {companyDialog.mode === 'create'
                ? 'إضافة نسبة شركة'
                : 'تعديل نسبة شركة'}
            </h3>
            <p className="rates-note">{CATALOG_SOURCE_NOTE}</p>
            {formError ? (
              <p className="rates-status error">{formError}</p>
            ) : null}
            <label>
              الشركة *
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={companyDialog.mode === 'edit'}
                required
              >
                {board.catalogCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              النسبة % *
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                required
              />
            </label>
            <label>
              تاريخ البداية *
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
            <div className="rates-form-actions">
              <button
                type="button"
                className="rates-btn-ghost"
                onClick={() => setCompanyDialog(null)}
              >
                إلغاء
              </button>
              <button type="submit" className="rates-btn" disabled={busy}>
                حفظ
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {productDialog ? (
        <div className="rates-modal-backdrop">
          <form className="rates-modal" onSubmit={submitProduct}>
            <h3>
              {productDialog.mode === 'create'
                ? 'إضافة نسبة صنف خاصة'
                : 'تعديل نسبة صنف'}
            </h3>
            <p className="rates-note">{CATALOG_SOURCE_NOTE}</p>
            {formError ? (
              <p className="rates-status error">{formError}</p>
            ) : null}
            <label>
              الشركة *
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value)
                  setProductId('')
                }}
                disabled={productDialog.mode === 'edit'}
                required
              >
                {board.catalogCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              الصنف *
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={productDialog.mode === 'edit'}
                required
              >
                <option value="">اختر صنفاً</option>
                {productsForCompany.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="rates-note">
              نسبة الشركة الأساسية الحالية:{' '}
              {baseForSelected != null ? `${baseForSelected}%` : 'غير محددة'}
            </p>
            <label>
              النسبة الخاصة % *
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                required
              />
            </label>
            <label>
              تاريخ البداية *
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
            <div className="rates-form-actions">
              <button
                type="button"
                className="rates-btn-ghost"
                onClick={() => setProductDialog(null)}
              >
                إلغاء
              </button>
              <button type="submit" className="rates-btn" disabled={busy}>
                حفظ
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
