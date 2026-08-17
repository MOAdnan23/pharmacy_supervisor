/**
 * UC-20 — قائمة العروض والسلال (s-offers-list)
 * Screen Flow: إنشاء | تفاصيل | إيقاف | أرشيف
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getOffersDatasource } from '../data'
import type {
  BasketStatus,
  OffersBoard,
  PromotionalBasket,
} from '../domain/offerEntities'
import {
  basketStatusClass,
  basketStatusLabel,
  targetModeLabel,
} from './offerLabels'
import './offers.css'

type StatusFilter = 'all' | BasketStatus

export function OffersListPage() {
  const navigate = useNavigate()
  const datasource = useMemo(() => getOffersDatasource(), [])

  const [board, setBoard] = useState<OffersBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  async function reload() {
    const next = await datasource.getBoard()
    setBoard(next)
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
          setError(err instanceof Error ? err.message : 'تعذّر تحميل العروض')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource])

  const liveList = useMemo(() => {
    if (!board) return []
    return board.baskets.filter((b) => b.status !== 'archived')
  }, [board])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return liveList.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (!q) return true
      const companies = [
        ...b.paidItems.map((i) => i.companyName),
        ...b.freeItems.map((i) => i.companyName),
      ].join(' ')
      return (
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        companies.toLowerCase().includes(q)
      )
    })
  }, [liveList, query, statusFilter])

  async function suspend(b: PromotionalBasket) {
    setBusy(true)
    setError(null)
    try {
      await datasource.setStatus(b.id, 'suspended')
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الإيقاف')
    } finally {
      setBusy(false)
    }
  }

  async function resume(b: PromotionalBasket) {
    setBusy(true)
    setError(null)
    try {
      await datasource.activateBasket(b.id)
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل التفعيل')
    } finally {
      setBusy(false)
    }
  }

  async function archive(b: PromotionalBasket) {
    setBusy(true)
    setError(null)
    try {
      await datasource.setStatus(b.id, 'archived')
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الأرشفة')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="offers-status">جاري تحميل العروض...</p>
  if (!board) {
    return <p className="offers-status error">{error ?? 'لا توجد بيانات'}</p>
  }

  const { summary } = board

  return (
    <div className="offers">
      <header className="offers-head">
        <div>
          <h1>العروض والسلال الترويجية</h1>
          <p>
            السلال ينشئها المشرف وتظهر للمندوبين المستهدفين عند إنشاء الطلبية
          </p>
        </div>
        <div className="offers-head-actions">
          <Link className="offers-ghost" to="/offers/archive">
            الأرشيف
          </Link>
          <button
            type="button"
            className="offers-cta"
            onClick={() => navigate('/offers/new')}
          >
            إنشاء سلة جديدة
          </button>
        </div>
      </header>

      {error ? <div className="offers-banner error">{error}</div> : null}

      <section className="offers-summary">
        <article>
          <span>فعّالة</span>
          <strong>{summary.active}</strong>
        </article>
        <article>
          <span>موقوفة</span>
          <strong>{summary.suspended}</strong>
        </article>
        <article>
          <span>منتهية</span>
          <strong>{summary.expired}</strong>
        </article>
        <article>
          <span>سلال فعّالة</span>
          <strong>{summary.activeBaskets}</strong>
        </article>
        <article>
          <span>مرسلة للمندوبين</span>
          <strong>{summary.sentToReps}</strong>
        </article>
      </section>

      <div className="offers-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="فلتر: الاسم / الشركة..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">كل الحالات</option>
          <option value="draft">مسودة</option>
          <option value="active">فعّالة</option>
          <option value="suspended">موقوفة</option>
          <option value="expired">منتهية</option>
        </select>
      </div>

      <div className="offers-table-wrap">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الفترة</th>
              <th>الأصناف</th>
              <th>الاستهداف</th>
              <th>الحالة</th>
              <th>الاستخدام</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="offers-empty">
                  لا توجد سلال مطابقة
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.name}</strong>
                    <div className="offers-sub">{b.description || '—'}</div>
                  </td>
                  <td>
                    {b.startDate} → {b.endDate}
                  </td>
                  <td>
                    {b.paidItems.length} مدفوع · {b.freeItems.length} مجاني
                  </td>
                  <td>{targetModeLabel(b.targeting.mode)}</td>
                  <td>
                    <span
                      className={`badge ${basketStatusClass(b.status)}`}
                    >
                      {basketStatusLabel(b.status)}
                    </span>
                  </td>
                  <td>
                    {b.usageCount} / {b.linkedOrdersCount} طلبيات
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => navigate(`/offers/${b.id}`)}
                      >
                        تفاصيل
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => navigate(`/offers/${b.id}/edit`)}
                      >
                        تعديل
                      </button>
                      {b.status === 'active' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => suspend(b)}
                        >
                          إيقاف
                        </button>
                      ) : null}
                      {b.status === 'draft' || b.status === 'suspended' ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => resume(b)}
                        >
                          تفعيل
                        </button>
                      ) : null}
                      {b.status !== 'archived' ? (
                        <button
                          type="button"
                          className="danger"
                          disabled={busy}
                          onClick={() => archive(b)}
                        >
                          أرشفة
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
