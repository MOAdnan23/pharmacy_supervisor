/**
 * UC-33 / s-offers-archive — أرشيف العروض والسلال
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getOffersDatasource } from '../data'
import type { OffersBoard, PromotionalBasket } from '../domain/offerEntities'
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

export function OffersArchivePage() {
  const navigate = useNavigate()
  const datasource = useMemo(() => getOffersDatasource(), [])

  const [board, setBoard] = useState<OffersBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [pdfTarget, setPdfTarget] = useState<PromotionalBasket | null>(null)

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

  const archived = useMemo(() => {
    if (!board) return []
    const q = query.trim().toLowerCase()
    return board.baskets
      .filter((b) => b.status === 'archived' || b.status === 'expired')
      .filter((b) => {
        if (!q) return true
        return (
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
        )
      })
  }, [board, query])

  async function duplicate(b: PromotionalBasket) {
    setBusy(true)
    setError(null)
    try {
      const copy = await datasource.duplicateBasket(b.id)
      navigate(`/offers/${copy.id}/edit`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل النسخ')
    } finally {
      setBusy(false)
    }
  }

  function targetLabel(b: PromotionalBasket): string {
    if (!board) return targetModeLabel(b.targeting.mode)
    if (b.targeting.mode === 'all_reps') return 'كل المندوبين'
    if (b.targeting.mode === 'selected_reps') {
      return (
        board.repOptions
          .filter((r) => b.targeting.repIds.includes(r.id))
          .map((r) => r.name)
          .join('، ') || '—'
      )
    }
    const mains = board.regionOptions
      .filter((r) => b.targeting.mainRegionIds.includes(r.id))
      .map((r) => r.name)
    const subs = board.regionOptions
      .flatMap((r) => r.subRegions)
      .filter((s) => b.targeting.subRegionIds.includes(s.id))
      .map((s) => s.name)
    return [mains.join('، '), subs.join('، ')].filter(Boolean).join(' / ') || '—'
  }

  if (loading) return <p className="offers-status">جاري تحميل الأرشيف...</p>
  if (!board) {
    return <p className="offers-status error">{error ?? 'لا بيانات'}</p>
  }

  return (
    <div className="offers">
      <header className="offers-head">
        <div>
          <h1>أرشيف العروض والسلال</h1>
          <p>المنتهية والمؤرشفة · يمكن إنشاء نسخة جديدة منها</p>
        </div>
        <Link className="offers-ghost" to="/offers">
          رجوع للقائمة
        </Link>
      </header>

      {error ? <div className="offers-banner error">{error}</div> : null}

      <div className="offers-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث في الأرشيف..."
        />
        <button type="button" className="offers-ghost" onClick={() => reload()}>
          تحديث
        </button>
      </div>

      <div className="offers-table-wrap">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>التواريخ</th>
              <th>الحسومات</th>
              <th>الاستهداف</th>
              <th>الحالة</th>
              <th>الاستخدام</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {archived.length === 0 ? (
              <tr>
                <td colSpan={7} className="offers-empty">
                  الأرشيف فارغ
                </td>
              </tr>
            ) : (
              archived.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.name}</strong>
                    <div className="offers-sub">
                      {b.paidItems.length} مدفوع · {b.freeItems.length} مجاني
                    </div>
                  </td>
                  <td>
                    {b.startDate} → {b.endDate}
                  </td>
                  <td>
                    حسم السلة {b.basketDiscountPercent}%
                  </td>
                  <td>{targetModeLabel(b.targeting.mode)}</td>
                  <td>
                    <span className={`badge ${basketStatusClass(b.status)}`}>
                      {basketStatusLabel(b.status)}
                    </span>
                  </td>
                  <td>
                    {b.usageCount} / {b.linkedOrdersCount}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        onClick={() => navigate(`/offers/${b.id}`)}
                      >
                        تفاصيل
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPdfTarget(b)}
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          printBasket({
                            basket: b,
                            targetNames: targetLabel(b),
                          })
                        }
                      >
                        طباعة
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => duplicate(b)}
                      >
                        نسخة جديدة
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pdfTarget ? (
        <SavePdfNameDialog
          defaultName={pdfTarget.name}
          busy={busy}
          onCancel={() => setPdfTarget(null)}
          onConfirm={async (fileName) => {
            setBusy(true)
            setError(null)
            try {
              await exportBasketPdf({
                basket: pdfTarget,
                targetNames: targetLabel(pdfTarget),
                fileName,
              })
              setPdfTarget(null)
            } catch (err: unknown) {
              setError(
                err instanceof Error ? err.message : 'فشل استخراج PDF',
              )
            } finally {
              setBusy(false)
            }
          }}
        />
      ) : null}
    </div>
  )
}
