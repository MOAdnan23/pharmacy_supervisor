/**
 * المستودع — UC-114 → UC-123
 * قراءة فقط من جرد المفوتر + ملاحظات + PDF عرضي + طباعة
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFeedback } from '../../../shared/feedback/FeedbackContext'
import { getWarehouseDatasource } from '../data'
import type {
  ExpiryStatus,
  ItemNoteType,
  StockAvailability,
  WarehouseBoard,
  WarehouseItem,
} from '../domain/warehouseEntities'
import {
  WAREHOUSE_RULES,
  availabilityLabel,
  dosageFormLabel,
  expiryLabel,
  formatIsoDate,
  formatIsoDateTime,
  itemDisplayName,
  matchesWarehouseSearch,
  money,
  noteTypeLabel,
} from '../domain/warehouseLabels'
import {
  exportWarehousePdf,
  printWarehouseReport,
} from '../services/warehousePdfService'
import './warehouse.css'

type TabId =
  | 'stock'
  | 'low'
  | 'expiry'
  | 'companies'
  | 'external'
  | 'movements'
  | 'notes'

type StockFilter = 'all' | StockAvailability
type ExpiryFilter = 'all' | ExpiryStatus

export function WarehousePage() {
  const datasource = useMemo(() => getWarehouseDatasource(), [])
  const { success, fail } = useFeedback()
  const [searchParams] = useSearchParams()

  const [board, setBoard] = useState<WarehouseBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const initialTab = (searchParams.get('tab') as TabId | null) ?? 'stock'
  const [tab, setTab] = useState<TabId>(
    ['stock', 'low', 'expiry', 'companies', 'external', 'movements', 'notes'].includes(
      initialTab,
    )
      ? initialTab
      : 'stock',
  )
  const [query, setQuery] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all')

  const [detailItem, setDetailItem] = useState<WarehouseItem | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteType, setNoteType] = useState<ItemNoteType>('follow_up')
  const [noteText, setNoteText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfName, setPdfName] = useState('')

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
        const itemId = searchParams.get('item')
        if (itemId) {
          const found = next.items.find((i) => i.id === itemId)
          if (found) setDetailItem(found)
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر تحميل المستودع')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource, searchParams])

  const filteredItems = useMemo(() => {
    if (!board) return []
    return board.items.filter((item) => {
      if (companyFilter !== 'all' && item.companyId !== companyFilter) {
        return false
      }
      if (stockFilter !== 'all' && item.availability !== stockFilter) {
        return false
      }
      if (expiryFilter !== 'all' && item.expiryStatus !== expiryFilter) {
        return false
      }
      if (!matchesWarehouseSearch(item, query)) return false
      if (tab === 'low') {
        return (
          item.availability === 'low_stock' ||
          item.availability === 'out_of_stock'
        )
      }
      if (tab === 'expiry') {
        return item.expiryStatus !== 'valid'
      }
      return true
    })
  }, [board, companyFilter, stockFilter, expiryFilter, query, tab])

  const filterLabel = useMemo(() => {
    const parts: string[] = []
    if (tab === 'low') parts.push('قابلة للنفاد')
    else if (tab === 'expiry') parts.push('تواريخ صلاحية حرجة')
    else parts.push('الجرد الكامل / المصفّى')
    if (companyFilter !== 'all' && board) {
      const c = board.companies.find((x) => x.id === companyFilter)
      if (c) parts.push(`شركة: ${c.name}`)
    }
    if (query.trim()) parts.push(`بحث: ${query.trim()}`)
    return parts.join(' · ')
  }, [tab, companyFilter, query, board])

  function openDetail(item: WarehouseItem) {
    setDetailItem(item)
    setFormError(null)
  }

  function openNoteFor(item: WarehouseItem) {
    setDetailItem(item)
    setNoteType('follow_up')
    setNoteText('')
    setFormError(null)
    setNoteOpen(true)
  }

  async function submitNote(e: FormEvent) {
    e.preventDefault()
    if (!detailItem) return
    setBusy(true)
    setFormError(null)
    setError(null)
    setMessage(null)
    try {
      const ok = await datasource.addItemNote({
        itemId: detailItem.id,
        type: noteType,
        text: noteText,
      })
      setNoteOpen(false)
      await reload()
      setMessage(ok)
      success(ok)
      setTab('notes')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حفظ الملاحظة'
      setFormError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  function openPdfDialog() {
    const stamp = new Date().toISOString().slice(0, 10)
    setPdfName(`جرد-المستودع-${stamp}`)
    setPdfOpen(true)
  }

  async function onSavePdf(e: FormEvent) {
    e.preventDefault()
    if (!board) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await exportWarehousePdf({
        items: filteredItems,
        summary: board.summary,
        filterLabel,
        fileName: pdfName,
      })
      setPdfOpen(false)
      setMessage('تم حفظ ملف PDF بالعرض')
      success('تم حفظ ملف PDF بنجاح')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تصدير PDF'
      setError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  function onPrint() {
    if (!board) return
    try {
      printWarehouseReport({
        items: filteredItems,
        summary: board.summary,
        filterLabel,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل فتح الطباعة')
    }
  }

  function jumpFromKpi(kind: TabId | 'stock-low' | 'stock-out' | 'expiry-near') {
    setQuery('')
    setCompanyFilter('all')
    if (kind === 'stock-low') {
      setTab('stock')
      setStockFilter('low_stock')
      setExpiryFilter('all')
      return
    }
    if (kind === 'stock-out') {
      setTab('stock')
      setStockFilter('out_of_stock')
      setExpiryFilter('all')
      return
    }
    if (kind === 'expiry-near') {
      setTab('expiry')
      setStockFilter('all')
      setExpiryFilter('all')
      return
    }
    setTab(kind)
    setStockFilter('all')
    setExpiryFilter('all')
  }

  if (loading) return <p className="wh-status">جاري تحميل جرد المستودع…</p>
  if (!board) return <p className="wh-status error">{error ?? 'لا بيانات'}</p>

  const detailNotes = detailItem
    ? board.notes.filter((n) => n.itemId === detailItem.id)
    : []
  const detailMoves = detailItem
    ? board.movements.filter((m) => m.productId === detailItem.id)
    : []

  return (
    <div className="wh-page">
      <header className="wh-hero">
        <div>
          <p className="wh-eyebrow">قراءة فقط · مصدر البيانات: المفوتر</p>
          <h1>إدارة المستودع</h1>
          <p>{WAREHOUSE_RULES.sourceNote}</p>
        </div>
        <div className="wh-hero-actions">
          <button
            type="button"
            className="wh-btn-ghost"
            disabled={busy}
            onClick={onPrint}
          >
            طباعة
          </button>
          <button
            type="button"
            className="wh-btn"
            disabled={busy || filteredItems.length === 0}
            onClick={openPdfDialog}
          >
            حفظ PDF (عرضي)
          </button>
        </div>
      </header>

      {error ? <p className="wh-status error">{error}</p> : null}
      {message ? <p className="wh-status ok">{message}</p> : null}

      <div className="wh-rules">
        <p>{WAREHOUSE_RULES.pdfNote}</p>
      </div>

      <div className="wh-kpis">
        <button
          type="button"
          className="wh-kpi"
          onClick={() => jumpFromKpi('companies')}
        >
          <span>الشركات</span>
          <strong>{board.summary.companyCount}</strong>
        </button>
        <button
          type="button"
          className="wh-kpi"
          onClick={() => jumpFromKpi('stock')}
        >
          <span>الأصناف</span>
          <strong>{board.summary.itemCount}</strong>
        </button>
        <button
          type="button"
          className="wh-kpi warn"
          onClick={() => jumpFromKpi('stock-low')}
        >
          <span>منخفضة</span>
          <strong>{board.summary.lowStockCount}</strong>
        </button>
        <button
          type="button"
          className="wh-kpi danger"
          onClick={() => jumpFromKpi('stock-out')}
        >
          <span>نافدة</span>
          <strong>{board.summary.outOfStockCount}</strong>
        </button>
        <button
          type="button"
          className="wh-kpi accent"
          onClick={() => jumpFromKpi('expiry-near')}
        >
          <span>قرب انتهاء</span>
          <strong>{board.summary.nearExpiryCount}</strong>
        </button>
        <button
          type="button"
          className="wh-kpi danger"
          onClick={() => jumpFromKpi('expiry')}
        >
          <span>منتهية</span>
          <strong>{board.summary.expiredCount}</strong>
        </button>
      </div>
      <p className="wh-updated">
        آخر تحديث للجرد:{' '}
        <strong>{formatIsoDateTime(board.summary.lastUpdatedAt)}</strong>
      </p>

      <div className="wh-toolbar">
        <div className="wh-tabs">
          {(
            [
              ['stock', 'الجرد'],
              ['low', 'قابلة للنفاد'],
              ['expiry', 'الصلاحية'],
              ['companies', 'الشركات'],
              ['external', 'جرد مرفوع'],
              ['movements', 'الحركات'],
              ['notes', 'الملاحظات'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'active' : ''}
              onClick={() => {
                setTab(id)
                if (id === 'stock') {
                  setStockFilter('all')
                  setExpiryFilter('all')
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'stock' || tab === 'low' || tab === 'expiry' ? (
        <>
          <div className="wh-filters">
            <input
              className="wh-search"
              placeholder="بحث: صنف، شركة، مادة علمية…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="all">كل الشركات</option>
              {board.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {tab === 'stock' ? (
              <>
                <select
                  value={stockFilter}
                  onChange={(e) =>
                    setStockFilter(e.target.value as StockFilter)
                  }
                >
                  <option value="all">كل حالات المخزون</option>
                  <option value="available">متوفر</option>
                  <option value="low_stock">منخفض</option>
                  <option value="out_of_stock">نافد</option>
                </select>
                <select
                  value={expiryFilter}
                  onChange={(e) =>
                    setExpiryFilter(e.target.value as ExpiryFilter)
                  }
                >
                  <option value="all">كل حالات الصلاحية</option>
                  <option value="valid">صالح</option>
                  <option value="near_expiry">قريب الانتهاء</option>
                  <option value="expired">منتهٍ</option>
                </select>
              </>
            ) : null}
            <span className="wh-count">{filteredItems.length} صنف</span>
          </div>

          <div className="wh-table-card">
            <table>
              <thead>
                <tr>
                  <th>الشركة</th>
                  <th>الصنف</th>
                  <th>العيار</th>
                  <th>النوع</th>
                  <th>المادة العلمية</th>
                  <th>الكمية</th>
                  <th>سعر النت</th>
                  <th>سعر المبيع</th>
                  <th>الإنتاج</th>
                  <th>الانتهاء</th>
                  <th>المخزون</th>
                  <th>الصلاحية</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="wh-empty">
                      لا أصناف مطابقة للفلاتر
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.companyName}</td>
                      <td>
                        <strong>{item.name}</strong>
                        {item.promotionLabel ? (
                          <span className="wh-promo">{item.promotionLabel}</span>
                        ) : null}
                      </td>
                      <td>{item.strength ?? '—'}</td>
                      <td>{dosageFormLabel(item.dosageForm)}</td>
                      <td>{item.scientificName ?? '—'}</td>
                      <td>
                        <strong>{item.quantity}</strong>
                      </td>
                      <td>{money(item.netPrice)}</td>
                      <td>{money(item.sellingPrice)}</td>
                      <td>
                        {item.productionDate
                          ? formatIsoDate(item.productionDate)
                          : '—'}
                      </td>
                      <td>{formatIsoDate(item.expiryDate)}</td>
                      <td>
                        <span
                          className={`wh-badge ${stockTone(item.availability)}`}
                        >
                          {availabilityLabel(item.availability)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`wh-badge ${expiryTone(item.expiryStatus)}`}
                        >
                          {expiryLabel(item.expiryStatus)}
                          {item.expiryStatus !== 'expired'
                            ? ` · ${item.daysToExpiry}ي`
                            : ''}
                        </span>
                      </td>
                      <td className="wh-actions">
                        <button
                          type="button"
                          className="wh-btn-ghost"
                          onClick={() => openDetail(item)}
                        >
                          تفاصيل
                        </button>
                        <button
                          type="button"
                          className="wh-btn-ghost accent"
                          onClick={() => openNoteFor(item)}
                        >
                          ملاحظة
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === 'companies' ? (
        <div className="wh-table-card">
          <table>
            <thead>
              <tr>
                <th>الشركة</th>
                <th>الموقع</th>
                <th>الأصناف</th>
                <th>متوفرة</th>
                <th>منخفضة/نافدة</th>
                <th>صلاحية حرجة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {board.companies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>{c.location ?? '—'}</td>
                  <td>{c.itemCount}</td>
                  <td>{c.availableCount}</td>
                  <td>{c.lowStockCount}</td>
                  <td>{c.nearExpiryCount}</td>
                  <td>
                    <button
                      type="button"
                      className="wh-btn-ghost"
                      onClick={() => {
                        setCompanyFilter(c.id)
                        setTab('stock')
                        setStockFilter('all')
                        setExpiryFilter('all')
                      }}
                    >
                      عرض الأصناف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'external' ? (
        <div className="wh-files">
          {board.externalFiles.length === 0 ? (
            <p className="wh-empty">لا ملفات جرد مرفوعة من المفوتر</p>
          ) : (
            board.externalFiles.map((f) => (
              <article key={f.id} className="wh-file">
                <div>
                  <strong>{f.fileName}</strong>
                  <p>
                    رفعه {f.uploadedBy} · {formatIsoDateTime(f.uploadedAt)}
                  </p>
                  {f.notes ? <small>{f.notes}</small> : null}
                </div>
                <button
                  type="button"
                  className="wh-btn-ghost"
                  onClick={() =>
                    setMessage(
                      `معاينة/تحميل «${f.fileName}» ستكون متاحة عند ربط الملفات من الخادم`,
                    )
                  }
                >
                  معاينة / تحميل
                </button>
              </article>
            ))
          )}
        </div>
      ) : null}

      {tab === 'movements' ? (
        <div className="wh-table-card">
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الصنف</th>
                <th>النوع</th>
                <th>التغيير</th>
                <th>المنفّذ</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {board.movements.map((m) => (
                <tr key={m.id}>
                  <td>{formatIsoDateTime(m.createdAt)}</td>
                  <td>{m.productName}</td>
                  <td>{m.type}</td>
                  <td className={m.quantityDelta < 0 ? 'neg' : 'pos'}>
                    {m.quantityDelta > 0 ? '+' : ''}
                    {m.quantityDelta}
                  </td>
                  <td>{m.createdBy}</td>
                  <td>{m.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'notes' ? (
        <div className="wh-notes">
          {board.notes.length === 0 ? (
            <p className="wh-empty">لا ملاحظات رقابية بعد</p>
          ) : (
            board.notes.map((n) => (
              <article key={n.id} className="wh-note">
                <header>
                  <strong>
                    {n.itemName} · {n.companyName}
                  </strong>
                  <span className="wh-badge mute">{noteTypeLabel(n.type)}</span>
                </header>
                <p>{n.text}</p>
                <small>
                  {n.createdBy} · {formatIsoDateTime(n.createdAt)}
                </small>
              </article>
            ))
          )}
        </div>
      ) : null}

      {detailItem && !noteOpen ? (
        <div className="wh-modal-backdrop" onClick={() => setDetailItem(null)}>
          <div
            className="wh-modal wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3>تفاصيل الصنف — {itemDisplayName(detailItem)}</h3>
            <p className="wh-hint">عرض فقط — لا يمكن تعديل بيانات الجرد من هنا</p>
            <div className="wh-detail-grid">
              <div>
                <span>الشركة</span>
                <strong>{detailItem.companyName}</strong>
              </div>
              <div>
                <span>المادة العلمية</span>
                <strong>{detailItem.scientificName ?? '—'}</strong>
              </div>
              <div>
                <span>الكمية</span>
                <strong>{detailItem.quantity}</strong>
              </div>
              <div>
                <span>حد التنبيه</span>
                <strong>{detailItem.alertThreshold}</strong>
              </div>
              <div>
                <span>سعر النت</span>
                <strong>{money(detailItem.netPrice)}</strong>
              </div>
              <div>
                <span>سعر المبيع</span>
                <strong>{money(detailItem.sellingPrice)}</strong>
              </div>
              <div>
                <span>الانتهاء</span>
                <strong>{formatIsoDate(detailItem.expiryDate)}</strong>
              </div>
              <div>
                <span>الظهور للمندوب</span>
                <strong>{detailItem.visibleToRep ? 'نعم' : 'لا'}</strong>
              </div>
            </div>

            <h4>الحركات المرتبطة</h4>
            {detailMoves.length === 0 ? (
              <p className="wh-hint">لا حركات مسجّلة لهذا الصنف</p>
            ) : (
              <ul className="wh-mini-list">
                {detailMoves.map((m) => (
                  <li key={m.id}>
                    {formatIsoDateTime(m.createdAt)} — {m.type} (
                    {m.quantityDelta > 0 ? '+' : ''}
                    {m.quantityDelta}) · {m.createdBy}
                  </li>
                ))}
              </ul>
            )}

            <h4>ملاحظات المشرف</h4>
            {detailNotes.length === 0 ? (
              <p className="wh-hint">لا ملاحظات بعد</p>
            ) : (
              <ul className="wh-mini-list">
                {detailNotes.map((n) => (
                  <li key={n.id}>
                    [{noteTypeLabel(n.type)}] {n.text}
                  </li>
                ))}
              </ul>
            )}

            <div className="wh-form-actions">
              <button
                type="button"
                className="wh-btn-ghost"
                onClick={() => setDetailItem(null)}
              >
                إغلاق
              </button>
              <button
                type="button"
                className="wh-btn"
                onClick={() => {
                  setNoteText('')
                  setNoteType('follow_up')
                  setNoteOpen(true)
                }}
              >
                إضافة ملاحظة
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {noteOpen && detailItem ? (
        <div className="wh-modal-backdrop">
          <form className="wh-modal" onSubmit={submitNote}>
            <h3>ملاحظة رقابية — {itemDisplayName(detailItem)}</h3>
            <p className="wh-hint">
              تُحفظ باسم المشرف والتاريخ دون تغيير كمية الصنف أو بياناته.
            </p>
            {formError ? <p className="wh-status error">{formError}</p> : null}
            <label>
              نوع الملاحظة
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as ItemNoteType)}
              >
                <option value="follow_up">متابعة</option>
                <option value="alert">تنبيه</option>
                <option value="admin">إدارية</option>
              </select>
            </label>
            <label>
              النص *
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                required
                placeholder="مثال: متابعة توريد قريب…"
              />
            </label>
            <div className="wh-form-actions">
              <button
                type="button"
                className="wh-btn-ghost"
                onClick={() => setNoteOpen(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="wh-btn" disabled={busy}>
                حفظ الملاحظة
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {pdfOpen ? (
        <div className="wh-modal-backdrop">
          <form className="wh-modal" onSubmit={onSavePdf}>
            <h3>حفظ جرد PDF (عرضي)</h3>
            <p className="wh-hint">
              سيُصدَّر الجدول الحالي ({filteredItems.length} صنف) باتجاه عرضي
              (Landscape). اختر اسم الملف.
            </p>
            <label>
              اسم الملف
              <input
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                autoFocus
                required
                placeholder="مثال: جرد-آب-2026"
              />
            </label>
            <p className="wh-hint">يُضاف امتداد .pdf تلقائياً إن لم تكتبه.</p>
            <div className="wh-form-actions">
              <button
                type="button"
                className="wh-btn-ghost"
                disabled={busy}
                onClick={() => setPdfOpen(false)}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="wh-btn"
                disabled={busy || !pdfName.trim()}
              >
                {busy ? 'جاري الحفظ…' : 'حفظ PDF'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function stockTone(v: StockAvailability): string {
  if (v === 'available') return 'ok'
  if (v === 'low_stock') return 'warn'
  return 'danger'
}

function expiryTone(v: ExpiryStatus): string {
  if (v === 'valid') return 'ok'
  if (v === 'near_expiry') return 'warn'
  return 'danger'
}
