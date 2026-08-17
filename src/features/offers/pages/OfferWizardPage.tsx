/**
 * إنشاء/تعديل سلة — تدفق Screen Flow:
 * s-create-basket → paid → free → discounts/target → activate (UC-21→27)
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOffersDatasource } from '../data'
import type {
  BaseOfferPolicy,
  CatalogProduct,
  FreeBasketItem,
  OffersBoard,
  PaidBasketItem,
  TargetMode,
} from '../domain/offerEntities'
import { paidLineTotal } from '../domain/offerEntities'
import {
  validateBasketDraft,
  validateBasketForActivate,
  validateFreeItems,
  validatePaidItems,
  validateTargeting,
} from '../domain/basketValidation'
import './offers.css'

type Step = 0 | 1 | 2 | 3 | 4

type PaidForm = Omit<PaidBasketItem, 'id'>
type FreeForm = Omit<FreeBasketItem, 'id'>

const STEPS = [
  { id: 0 as Step, label: 'أساسيات' },
  { id: 1 as Step, label: 'أصناف مدفوعة' },
  { id: 2 as Step, label: 'أصناف مجانية' },
  { id: 3 as Step, label: 'حسومات واستهداف' },
  { id: 4 as Step, label: 'تفعيل' },
]

function formatMoney(n: number): string {
  return new Intl.NumberFormat('ar-SY').format(Math.round(n))
}

function emptyPaid(product?: CatalogProduct): PaidForm {
  return {
    productId: product?.id ?? '',
    productName: product?.name ?? '',
    companyName: product?.companyName ?? '',
    quantity: 1,
    unitPrice: product?.unitPrice ?? 0,
    itemDiscountPercent: 0,
    baseOfferPolicy: 'ignore_base',
    baseOfferLabel: product?.baseOfferLabel,
  }
}

function emptyFree(product?: CatalogProduct): FreeForm {
  return {
    productId: product?.id ?? '',
    productName: product?.name ?? '',
    companyName: product?.companyName ?? '',
    freeQuantity: 1,
  }
}

export function OfferWizardPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const datasource = useMemo(() => getOffersDatasource(), [])

  const [board, setBoard] = useState<OffersBoard | null>(null)
  const [step, setStep] = useState<Step>(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | undefined>(id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [notesForRep, setNotesForRep] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paidItems, setPaidItems] = useState<PaidForm[]>([])
  const [freeItems, setFreeItems] = useState<FreeForm[]>([])
  const [basketDiscountPercent, setBasketDiscountPercent] = useState(0)
  const [targetMode, setTargetMode] = useState<TargetMode>('all_reps')
  const [repIds, setRepIds] = useState<string[]>([])
  const [mainRegionIds, setMainRegionIds] = useState<string[]>([])
  const [subRegionIds, setSubRegionIds] = useState<string[]>([])

  const [pickCompany, setPickCompany] = useState('')
  const [pickProductId, setPickProductId] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const next = await datasource.getBoard()
        if (!alive) return
        setBoard(next)
        if (id) {
          const basket = await datasource.getById(id)
          if (!alive) return
          setSavedId(basket.id)
          setName(basket.name)
          setDescription(basket.description)
          setNotesForRep(basket.notesForRep)
          setStartDate(basket.startDate)
          setEndDate(basket.endDate)
          setPaidItems(
            basket.paidItems.map(({ id: _i, ...rest }) => rest),
          )
          setFreeItems(
            basket.freeItems.map(({ id: _i, ...rest }) => rest),
          )
          setBasketDiscountPercent(basket.basketDiscountPercent)
          setTargetMode(basket.targeting.mode)
          setRepIds([...basket.targeting.repIds])
          setMainRegionIds([...basket.targeting.mainRegionIds])
          setSubRegionIds([...basket.targeting.subRegionIds])
        } else {
          const t = new Date().toISOString().slice(0, 10)
          setStartDate(t)
          setEndDate(t)
        }
      } catch (err: unknown) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر التحميل')
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [datasource, id])

  const companies = useMemo(() => {
    if (!board) return []
    return [...new Set(board.catalog.map((p) => p.companyName))]
  }, [board])

  const productsOfCompany = useMemo(() => {
    if (!board || !pickCompany) return []
    return board.catalog.filter((p) => p.companyName === pickCompany)
  }, [board, pickCompany])

  const selectedMains = useMemo(() => {
    if (!board) return []
    return board.regionOptions.filter((r) => mainRegionIds.includes(r.id))
  }, [board, mainRegionIds])

  const paidSubtotal = useMemo(
    () => paidItems.reduce((s, i) => s + paidLineTotal(i), 0),
    [paidItems],
  )

  const basketTotalAfterDiscount = useMemo(() => {
    const d = (paidSubtotal * (basketDiscountPercent || 0)) / 100
    return Math.max(0, paidSubtotal - d)
  }, [paidSubtotal, basketDiscountPercent])

  function addPaidFromPick() {
    if (!board || !pickProductId) return
    const product = board.catalog.find((p) => p.id === pickProductId)
    if (!product) return
    if (paidItems.some((p) => p.productId === product.id)) {
      setError('الصنف مضاف مسبقاً في المدفوعات')
      return
    }
    setError(null)
    setPaidItems((list) => [...list, emptyPaid(product)])
    setPickProductId('')
  }

  function addFreeFromPick() {
    if (!board || !pickProductId) return
    const product = board.catalog.find((p) => p.id === pickProductId)
    if (!product) return
    setError(null)
    setFreeItems((list) => [...list, emptyFree(product)])
    setPickProductId('')
  }

  function toggleId(
    list: string[],
    value: string,
    setter: (v: string[]) => void,
  ) {
    setter(
      list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value],
    )
  }

  async function saveDraft(): Promise<string> {
    validateBasketDraft({
      id: savedId,
      name,
      description,
      notesForRep,
      startDate,
      endDate,
      status: 'draft',
      paidItems,
      freeItems,
      basketDiscountPercent,
      targeting: {
        mode: targetMode,
        repIds,
        mainRegionIds,
        subRegionIds,
      },
    })
    const basket = await datasource.upsertBasket({
      id: savedId,
      name,
      description,
      notesForRep,
      startDate,
      endDate,
      status: 'draft',
      paidItems,
      freeItems,
      basketDiscountPercent,
      targeting: {
        mode: targetMode,
        repIds,
        mainRegionIds,
        subRegionIds,
      },
    })
    setSavedId(basket.id)
    return basket.id
  }

  async function goNext() {
    setBusy(true)
    setError(null)
    try {
      if (step === 0) {
        if (!name.trim()) {
          throw new Error('اسم السلة مطلوب ولا يمكن أن يكون فارغاً')
        }
        if (!startDate.trim() || !endDate.trim()) {
          throw new Error('تواريخ البداية والنهاية مطلوبة ولا يمكن تركها فارغة')
        }
        if (endDate < startDate) {
          throw new Error('تاريخ النهاية يجب أن يكون بعد البداية أو يساويه')
        }
        await saveDraft()
        setStep(1)
      } else if (step === 1) {
        validatePaidItems(paidItems)
        await saveDraft()
        setStep(2)
      } else if (step === 2) {
        validateFreeItems(freeItems)
        await saveDraft()
        setStep(3)
      } else if (step === 3) {
        validateTargeting({
          mode: targetMode,
          repIds,
          mainRegionIds,
          subRegionIds,
        })
        if (
          basketDiscountPercent < 0 ||
          basketDiscountPercent > 100 ||
          Number.isNaN(basketDiscountPercent)
        ) {
          throw new Error('حسم السلة يجب أن يكون بين 0 و 100')
        }
        await saveDraft()
        setStep(4)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'تعذّر المتابعة')
    } finally {
      setBusy(false)
    }
  }

  async function activate(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      validateBasketForActivate({
        name,
        startDate,
        endDate,
        paidItems,
        freeItems,
        basketDiscountPercent,
        targeting: {
          mode: targetMode,
          repIds,
          mainRegionIds,
          subRegionIds,
        },
      })
      const basketId = await saveDraft()
      await datasource.activateBasket(basketId)
      navigate(`/offers/${basketId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل التفعيل')
    } finally {
      setBusy(false)
    }
  }

  async function saveOnly() {
    setBusy(true)
    setError(null)
    try {
      const basketId = await saveDraft()
      navigate(`/offers/${basketId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الحفظ')
    } finally {
      setBusy(false)
    }
  }

  if (loading || !board) {
    return (
      <p className="offers-status">
        {error ?? 'جاري تحميل معالج السلة...'}
      </p>
    )
  }

  return (
    <div className="offers">
      <header className="offers-head">
        <div>
          <h1>{isEdit ? 'تعديل سلة ترويجية' : 'إنشاء سلة ترويجية'}</h1>
          <p>وفق Screen Flow: أساسيات → مدفوعة → مجانية → حسومات/استهداف → تفعيل</p>
        </div>
        <Link className="offers-ghost" to="/offers">
          رجوع للقائمة
        </Link>
      </header>

      <ol className="offers-steps">
        {STEPS.map((s) => (
          <li key={s.id} className={step === s.id ? 'active' : step > s.id ? 'done' : ''}>
            <span>{s.label}</span>
          </li>
        ))}
      </ol>

      {error ? <div className="offers-banner error">{error}</div> : null}

      {step === 0 ? (
        <section className="offers-panel">
          <h3>بيانات السلة</h3>
          <div className="offers-form-grid">
            <label>
              الاسم *
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              تاريخ البداية *
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              تاريخ النهاية *
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <label className="full">
              الوصف
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </label>
            <label className="full">
              ملاحظات للمندوب
              <textarea
                value={notesForRep}
                onChange={(e) => setNotesForRep(e.target.value)}
                rows={2}
              />
            </label>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="offers-panel">
          <h3>أصناف مدفوعة</h3>
          <p className="offers-hint">
            عند وجود عرض أساسي للصنف اختر: استخدامه تلقائياً أو تجاهله واعتماد
            كمية السلة فقط.
          </p>
          <div className="offers-pick-row">
            <select
              value={pickCompany}
              onChange={(e) => {
                setPickCompany(e.target.value)
                setPickProductId('')
              }}
            >
              <option value="">اختر شركة</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={pickProductId}
              onChange={(e) => setPickProductId(e.target.value)}
              disabled={!pickCompany}
            >
              <option value="">اختر صنفاً</option>
              {productsOfCompany.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatMoney(p.unitPrice)}
                  {p.baseOfferLabel ? ` (${p.baseOfferLabel})` : ''}
                </option>
              ))}
            </select>
            <button type="button" onClick={addPaidFromPick} disabled={!pickProductId}>
              إضافة
            </button>
          </div>

          <div className="offers-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th>الكمية</th>
                  <th>سعر الوحدة</th>
                  <th>الإجمالي</th>
                  <th>حسم صنف %</th>
                  <th>العرض الأساسي</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paidItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="offers-empty">
                      لم تُضف أصناف مدفوعة بعد
                    </td>
                  </tr>
                ) : (
                  paidItems.map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`}>
                      <td>
                        <strong>{item.productName}</strong>
                        <div className="offers-sub">{item.companyName}</div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const quantity = Number(e.target.value) || 1
                            setPaidItems((list) =>
                              list.map((row, i) =>
                                i === idx ? { ...row, quantity } : row,
                              ),
                            )
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => {
                            const unitPrice = Number(e.target.value) || 0
                            setPaidItems((list) =>
                              list.map((row, i) =>
                                i === idx ? { ...row, unitPrice } : row,
                              ),
                            )
                          }}
                        />
                      </td>
                      <td>
                        <strong>{formatMoney(paidLineTotal(item))}</strong>
                        <div className="offers-sub">
                          {item.quantity} × {formatMoney(item.unitPrice)}
                          {item.itemDiscountPercent > 0
                            ? ` (−${item.itemDiscountPercent}%)`
                            : ''}
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.itemDiscountPercent}
                          onChange={(e) => {
                            const itemDiscountPercent =
                              Number(e.target.value) || 0
                            setPaidItems((list) =>
                              list.map((row, i) =>
                                i === idx
                                  ? { ...row, itemDiscountPercent }
                                  : row,
                              ),
                            )
                          }}
                        />
                      </td>
                      <td>
                        {item.baseOfferLabel ? (
                          <select
                            value={item.baseOfferPolicy}
                            onChange={(e) => {
                              const baseOfferPolicy = e.target
                                .value as BaseOfferPolicy
                              setPaidItems((list) =>
                                list.map((row, i) =>
                                  i === idx
                                    ? { ...row, baseOfferPolicy }
                                    : row,
                                ),
                              )
                            }}
                          >
                            <option value="use_base">
                              استخدام ({item.baseOfferLabel})
                            </option>
                            <option value="ignore_base">تجاهل العرض الأساسي</option>
                          </select>
                        ) : (
                          <span className="offers-sub">لا يوجد</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            setPaidItems((list) =>
                              list.filter((_, i) => i !== idx),
                            )
                          }
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
          {paidItems.length > 0 ? (
            <p className="offers-hint">
              مجموع الأصناف المدفوعة بعد حسم الأصناف:{' '}
              <strong>{formatMoney(paidSubtotal)}</strong>
            </p>
          ) : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="offers-panel">
          <h3>أصناف مجانية</h3>
          <p className="offers-hint">تظهر بسعر 0 داخل الطلبية عند إضافة السلة.</p>
          <div className="offers-pick-row">
            <select
              value={pickCompany}
              onChange={(e) => {
                setPickCompany(e.target.value)
                setPickProductId('')
              }}
            >
              <option value="">اختر شركة</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={pickProductId}
              onChange={(e) => setPickProductId(e.target.value)}
              disabled={!pickCompany}
            >
              <option value="">اختر صنفاً مجانياً</option>
              {productsOfCompany.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={addFreeFromPick} disabled={!pickProductId}>
              إضافة
            </button>
          </div>

          <div className="offers-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الصنف المجاني</th>
                  <th>الكمية المجانية</th>
                  <th>السعر</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {freeItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="offers-empty">
                      لا أصناف مجانية (اختياري)
                    </td>
                  </tr>
                ) : (
                  freeItems.map((item, idx) => (
                    <tr key={`${item.productId}-free-${idx}`}>
                      <td>
                        <strong>{item.productName}</strong>
                        <div className="offers-sub">{item.companyName}</div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          value={item.freeQuantity}
                          onChange={(e) => {
                            const freeQuantity = Number(e.target.value) || 1
                            setFreeItems((list) =>
                              list.map((row, i) =>
                                i === idx ? { ...row, freeQuantity } : row,
                              ),
                            )
                          }}
                        />
                      </td>
                      <td>0</td>
                      <td>
                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            setFreeItems((list) =>
                              list.filter((_, i) => i !== idx),
                            )
                          }
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
        </section>
      ) : null}

      {step === 3 ? (
        <section className="offers-panel">
          <h3>حسم السلة والاستهداف</h3>
          <p className="offers-hint">
            حسم واحد على السلة فقط — لأن السلة عند التطبيق تصبح الفاتورة؛ لا حسم
            فاتورة منفصل.
          </p>
          <div className="offers-form-grid">
            <label>
              حسم السلة %
              <input
                type="number"
                min={0}
                max={100}
                value={basketDiscountPercent}
                onChange={(e) =>
                  setBasketDiscountPercent(Number(e.target.value) || 0)
                }
              />
            </label>
            <label>
              إجمالي السلة بعد الحسم
              <input
                readOnly
                value={formatMoney(basketTotalAfterDiscount)}
              />
            </label>
            <label className="full">
              الاستهداف
              <select
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value as TargetMode)}
              >
                <option value="all_reps">جميع المندوبين</option>
                <option value="selected_reps">مندوبون محددون</option>
                <option value="regions">مناطق محددة</option>
              </select>
            </label>
          </div>

          {targetMode === 'selected_reps' ? (
            <div className="offers-checks">
              {board.repOptions.map((r) => (
                <label key={r.id} className="offers-check">
                  <input
                    type="checkbox"
                    checked={repIds.includes(r.id)}
                    onChange={() => toggleId(repIds, r.id, setRepIds)}
                  />
                  {r.name}
                </label>
              ))}
            </div>
          ) : null}

          {targetMode === 'regions' ? (
            <div className="offers-region-target">
              <p className="offers-hint">
                اختر المنطقة الرئيسية ثم الفرعية التابعة لها.
              </p>
              <div className="offers-checks">
                {board.regionOptions.map((r) => (
                  <label key={r.id} className="offers-check">
                    <input
                      type="checkbox"
                      checked={mainRegionIds.includes(r.id)}
                      onChange={() => {
                        const next = mainRegionIds.includes(r.id)
                          ? mainRegionIds.filter((x) => x !== r.id)
                          : [...mainRegionIds, r.id]
                        setMainRegionIds(next)
                        const allowedSubs = board.regionOptions
                          .filter((m) => next.includes(m.id))
                          .flatMap((m) => m.subRegions.map((s) => s.id))
                        setSubRegionIds((subs) =>
                          subs.filter((id) => allowedSubs.includes(id)),
                        )
                      }}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
              {selectedMains.length > 0 ? (
                <div className="offers-subregions">
                  {selectedMains.map((main) => (
                    <div key={main.id} className="offers-subregion-block">
                      <strong>فرعيات — {main.name}</strong>
                      <div className="offers-checks">
                        {main.subRegions.map((s) => (
                          <label key={s.id} className="offers-check">
                            <input
                              type="checkbox"
                              checked={subRegionIds.includes(s.id)}
                              onChange={() =>
                                toggleId(subRegionIds, s.id, setSubRegionIds)
                              }
                            />
                            {s.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 4 ? (
        <form className="offers-panel" onSubmit={activate}>
          <h3>تفعيل وإرسال للمندوبين</h3>
          <ul className="offers-review">
            <li>
              <strong>الاسم:</strong> {name}
            </li>
            <li>
              <strong>الفترة:</strong> {startDate} → {endDate}
            </li>
            <li>
              <strong>مدفوعة:</strong> {paidItems.length} ·{' '}
              <strong>مجانية:</strong> {freeItems.length}
            </li>
            <li>
              <strong>مجموع الأصناف:</strong> {formatMoney(paidSubtotal)} ·{' '}
              <strong>بعد حسم السلة ({basketDiscountPercent}%):</strong>{' '}
              {formatMoney(basketTotalAfterDiscount)}
            </li>
            <li>
              <strong>الاستهداف:</strong>{' '}
              {targetMode === 'all_reps'
                ? 'كل المندوبين'
                : targetMode === 'selected_reps'
                  ? `${repIds.length} مندوب`
                  : `${mainRegionIds.length} رئيسية / ${subRegionIds.length} فرعية`}
            </li>
          </ul>
          <p className="offers-hint">
            بعد التفعيل تظهر السلة في تطبيق المندوبين المستهدفين فقط ويمكن
            إضافتها للطلبية.
          </p>
          <div className="offers-wizard-actions">
            <button
              type="button"
              className="offers-ghost"
              disabled={busy}
              onClick={() => setStep(3)}
            >
              رجوع
            </button>
            <button
              type="button"
              className="offers-ghost"
              disabled={busy}
              onClick={saveOnly}
            >
              حفظ كمسودة فقط
            </button>
            <button type="submit" className="offers-cta" disabled={busy}>
              {busy ? 'جاري التفعيل...' : 'تفعيل وإرسال'}
            </button>
          </div>
        </form>
      ) : null}

      {step < 4 ? (
        <div className="offers-wizard-actions">
          {step > 0 ? (
            <button
              type="button"
              className="offers-ghost"
              disabled={busy}
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              السابق
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="offers-cta"
            disabled={busy}
            onClick={goNext}
          >
            {busy ? '...' : 'التالي وحفظ'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
