/**
 * s-basket-view — تفاصيل سلة ترويجية
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOffersDatasource } from '../data'
import type { PromotionalBasket } from '../domain/offerEntities'
import {
  basketStatusClass,
  basketStatusLabel,
  targetModeLabel,
} from './offerLabels'
import {
  exportBasketPdf,
  printBasket,
} from '../services/basketPdfService'
import { SavePdfNameDialog } from './SavePdfNameDialog'
import './offers.css'

export function OfferDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const datasource = useMemo(() => getOffersDatasource(), [])

  const [basket, setBasket] = useState<PromotionalBasket | null>(null)
  const [boardMeta, setBoardMeta] = useState<{
    reps: { id: string; name: string }[]
    regions: {
      id: string
      name: string
      subRegions: { id: string; name: string }[]
    }[]
  }>({ reps: [], regions: [] })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [savePdfOpen, setSavePdfOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true
    Promise.all([datasource.getById(id), datasource.getBoard()])
      .then(([b, board]) => {
        if (!alive) return
        setBasket(b)
        setBoardMeta({
          reps: board.repOptions,
          regions: board.regionOptions,
        })
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
  }, [datasource, id])

  async function suspend() {
    if (!basket) return
    setBusy(true)
    try {
      await datasource.setStatus(basket.id, 'suspended')
      setBasket(await datasource.getById(basket.id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الإيقاف')
    } finally {
      setBusy(false)
    }
  }

  async function activate() {
    if (!basket) return
    setBusy(true)
    try {
      await datasource.activateBasket(basket.id)
      setBasket(await datasource.getById(basket.id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل التفعيل')
    } finally {
      setBusy(false)
    }
  }

  function resolveTargetNames(b: PromotionalBasket): string {
    if (b.targeting.mode === 'selected_reps') {
      return (
        boardMeta.reps
          .filter((r) => b.targeting.repIds.includes(r.id))
          .map((r) => r.name)
          .join('، ') || '—'
      )
    }
    if (b.targeting.mode === 'regions') {
      const mains = boardMeta.regions
        .filter((r) => b.targeting.mainRegionIds.includes(r.id))
        .map((r) => r.name)
      const subs = boardMeta.regions
        .flatMap((r) => r.subRegions)
        .filter((s) => b.targeting.subRegionIds.includes(s.id))
        .map((s) => s.name)
      const parts = [
        mains.length ? `رئيسية: ${mains.join('، ')}` : '',
        subs.length ? `فرعية: ${subs.join('، ')}` : '',
      ].filter(Boolean)
      return parts.join(' · ') || '—'
    }
    return 'كل المندوبين'
  }

  async function handleExportPdf(fileName: string) {
    if (!basket) return
    setBusy(true)
    setError(null)
    try {
      await exportBasketPdf({
        basket,
        targetNames: resolveTargetNames(basket),
        fileName,
      })
      setSavePdfOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل استخراج PDF')
    } finally {
      setBusy(false)
    }
  }

  function handlePrint() {
    if (!basket) return
    try {
      printBasket({
        basket,
        targetNames: resolveTargetNames(basket),
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشلت الطباعة')
    }
  }

  if (loading) return <p className="offers-status">جاري التحميل...</p>
  if (!basket) {
    return <p className="offers-status error">{error ?? 'السلة غير موجودة'}</p>
  }

  const targetNames = resolveTargetNames(basket)

  return (
    <div className="offers">
      <header className="offers-head">
        <div>
          <h1>{basket.name}</h1>
          <p>{basket.description || '—'}</p>
        </div>
        <div className="offers-head-actions">
          <Link className="offers-ghost" to="/offers">
            القائمة
          </Link>
          <button
            type="button"
            className="offers-ghost"
            disabled={busy}
            onClick={() => navigate(`/offers/${basket.id}/edit`)}
          >
            تعديل
          </button>
          {basket.status === 'active' ? (
            <button type="button" disabled={busy} onClick={suspend}>
              إيقاف
            </button>
          ) : basket.status !== 'archived' ? (
            <button
              type="button"
              className="offers-cta"
              disabled={busy}
              onClick={activate}
            >
              تفعيل
            </button>
          ) : null}
          <button
            type="button"
            className="offers-ghost"
            disabled={busy}
            onClick={() => setSavePdfOpen(true)}
          >
            استخراج PDF
          </button>
          <button type="button" className="offers-ghost" onClick={handlePrint}>
            طباعة النموذج
          </button>
        </div>
      </header>

      {error ? <div className="offers-banner error">{error}</div> : null}

      <section className="offers-summary">
        <article>
          <span>الحالة</span>
          <strong>
            <span className={`badge ${basketStatusClass(basket.status)}`}>
              {basketStatusLabel(basket.status)}
            </span>
          </strong>
        </article>
        <article>
          <span>مرات الاستخدام</span>
          <strong>{basket.usageCount}</strong>
        </article>
        <article>
          <span>طلبيات مرتبطة</span>
          <strong>{basket.linkedOrdersCount}</strong>
        </article>
        <article>
          <span>الاستهداف</span>
          <strong style={{ fontSize: '1rem' }}>
            {targetModeLabel(basket.targeting.mode)}
          </strong>
        </article>
      </section>

      <section className="offers-panel">
        <h3>الفترة والملاحظات</h3>
        <p>
          {basket.startDate} → {basket.endDate}
        </p>
        <p className="offers-hint">
          ملاحظات للمندوب: {basket.notesForRep || '—'}
        </p>
        <p className="offers-hint">المستهدفون: {targetNames || '—'}</p>
        <p className="offers-hint">
          حسم السلة: {basket.basketDiscountPercent}%
        </p>
      </section>

      <section className="offers-panel">
        <h3>أصناف مدفوعة</h3>
        <div className="offers-table-wrap">
          <table>
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
                <th>حسم %</th>
                <th>العرض الأساسي</th>
              </tr>
            </thead>
            <tbody>
              {basket.paidItems.map((i) => (
                <tr key={i.id}>
                  <td>
                    {i.productName}
                    <div className="offers-sub">{i.companyName}</div>
                  </td>
                  <td>{i.quantity}</td>
                  <td>{i.unitPrice.toLocaleString('ar-SY')}</td>
                  <td>
                    {(
                      i.quantity * i.unitPrice *
                      (1 - (i.itemDiscountPercent || 0) / 100)
                    ).toLocaleString('ar-SY')}
                  </td>
                  <td>{i.itemDiscountPercent}%</td>
                  <td>
                    {i.baseOfferLabel
                      ? i.baseOfferPolicy === 'use_base'
                        ? `استخدام (${i.baseOfferLabel})`
                        : `تجاهل (${i.baseOfferLabel})`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="offers-panel">
        <h3>أصناف مجانية</h3>
        {basket.freeItems.length === 0 ? (
          <p className="offers-hint">لا أصناف مجانية</p>
        ) : (
          <div className="offers-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th>كمية مجانية</th>
                  <th>السعر</th>
                </tr>
              </thead>
              <tbody>
                {basket.freeItems.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.productName}
                      <div className="offers-sub">{i.companyName}</div>
                    </td>
                    <td>{i.freeQuantity}</td>
                    <td>0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="offers-note">
        استخراج PDF يطلب اسم الملف ثم ينزّله إلى الجهاز. الطباعة تفتح نموذج
        المفوتر للطباعة.
      </p>

      {savePdfOpen ? (
        <SavePdfNameDialog
          defaultName={basket.name}
          busy={busy}
          onCancel={() => setSavePdfOpen(false)}
          onConfirm={handleExportPdf}
        />
      ) : null}
    </div>
  )
}
