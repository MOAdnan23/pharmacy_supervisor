/**
 * UC-101→104 — إنشاء / تعديل خطة عمل + تكليف مندوبين
 * يدعم أهدافاً باختيار شركات/صيدليات/أصناف + منطقة اختيارية
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFeedback } from '../../../shared/feedback/FeedbackContext'
import { getPlansDatasource } from '../data'
import type {
  GoalType,
  PlanCatalogOption,
  PlansBoard,
} from '../domain/planEntities'
import {
  defaultGoalUnit,
  goalTypeHint,
  goalTypeLabel,
  requirePlanName,
  validatePlanDates,
} from '../domain/planLabels'
import './plans.css'

type GoalForm = {
  type: GoalType
  targetValue: string
  note: string
  selectedIds: string[]
  selectedLabels: string[]
  pickerOpen: boolean
  search: string
}

const GOAL_TYPES: GoalType[] = [
  'visits',
  'pharmacies',
  'sales',
  'collections',
  'companies',
  'specific_pharmacies',
  'specific_products',
]

function needsPicker(type: GoalType): boolean {
  return (
    type === 'companies' ||
    type === 'specific_pharmacies' ||
    type === 'specific_products'
  )
}

function emptyGoal(type: GoalType = 'visits'): GoalForm {
  return {
    type,
    targetValue: '',
    note: '',
    selectedIds: [],
    selectedLabels: [],
    pickerOpen: false,
    search: '',
  }
}

export function PlanWizardPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const datasource = useMemo(() => getPlansDatasource(), [])
  const { success, fail } = useFeedback()

  const [board, setBoard] = useState<PlansBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromRep, setFromRep] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [mainRegionId, setMainRegionId] = useState('')
  const [subRegionId, setSubRegionId] = useState('')
  const [repIds, setRepIds] = useState<string[]>([])
  const [goals, setGoals] = useState<GoalForm[]>([emptyGoal()])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const next = await datasource.getBoard()
        if (!alive) return
        setBoard(next)
        if (id) {
          const plan = await datasource.getById(id)
          if (!alive) return
          setName(plan.name)
          setDescription(plan.description)
          setStartDate(plan.startDate)
          setEndDate(plan.endDate)
          setMainRegionId(plan.mainRegionId ?? '')
          setSubRegionId(plan.subRegionId ?? '')
          setRepIds([...plan.repIds])
          if (plan.source === 'rep') {
            setFromRep(plan.submittedByRepName ?? 'مندوب')
          }
          setGoals(
            plan.goals.map((g) => ({
              type: g.type,
              targetValue: String(g.targetValue),
              note: g.note ?? '',
              selectedIds: g.selectedIds ? [...g.selectedIds] : [],
              selectedLabels: g.selectedLabels ? [...g.selectedLabels] : [],
              pickerOpen: false,
              search: '',
            })),
          )
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

  const subOptions = useMemo(() => {
    if (!board || !mainRegionId) return []
    return board.regionTree.find((r) => r.mainId === mainRegionId)?.subs ?? []
  }, [board, mainRegionId])

  const availableReps = useMemo(() => {
    if (!board) return []
    if (!mainRegionId) return board.repOptions
    return board.repOptions.filter((r) =>
      r.mainRegionIds.includes(mainRegionId),
    )
  }, [board, mainRegionId])

  function pharmacyPool(): PlanCatalogOption[] {
    if (!board || !repIds.length) return []
    const map = new Map<string, PlanCatalogOption>()
    for (const rid of repIds) {
      for (const p of board.pharmacyOptionsByRep[rid] ?? []) {
        map.set(p.id, p)
      }
    }
    return [...map.values()]
  }

  function optionsForGoal(goal: GoalForm): PlanCatalogOption[] {
    if (!board) return []
    if (goal.type === 'companies') return board.companyOptions
    if (goal.type === 'specific_products') return board.productOptions
    if (goal.type === 'specific_pharmacies') return pharmacyPool()
    return []
  }

  function toggleRep(repId: string) {
    setRepIds((list) =>
      list.includes(repId)
        ? list.filter((x) => x !== repId)
        : [...list, repId],
    )
  }

  function updateGoal(idx: number, patch: Partial<GoalForm>) {
    setGoals((list) =>
      list.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    )
  }

  function toggleSelect(idx: number, opt: PlanCatalogOption) {
    setGoals((list) =>
      list.map((row, i) => {
        if (i !== idx) return row
        const on = row.selectedIds.includes(opt.id)
        return {
          ...row,
          selectedIds: on
            ? row.selectedIds.filter((x) => x !== opt.id)
            : [...row.selectedIds, opt.id],
          selectedLabels: on
            ? row.selectedLabels.filter((x) => x !== opt.name)
            : [...row.selectedLabels, opt.name],
        }
      }),
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      requirePlanName(name)
      validatePlanDates(startDate, endDate)
      if (!repIds.length) throw new Error('حدد مندوباً واحداً على الأقل')
      if (!goals.length) throw new Error('أضف هدفاً واحداً على الأقل')

      const mainName =
        board?.regionTree.find((r) => r.mainId === mainRegionId)?.mainName ?? ''
      const subName =
        subOptions.find((s) => s.id === subRegionId)?.name ?? ''
      const regionLabel = mainRegionId
        ? subName
          ? `${mainName} — ${subName}`
          : mainName
        : ''

      const mappedGoals = goals.map((g, i) => {
        const targetValue = Number(g.targetValue)
        if (!(targetValue > 0)) {
          throw new Error(`هدف رقم ${i + 1}: القيمة يجب أن تكون أكبر من صفر`)
        }
        if (needsPicker(g.type) && !g.selectedIds.length) {
          throw new Error(`هدف رقم ${i + 1}: اختر عنصراً واحداً على الأقل`)
        }
        return {
          type: g.type,
          label: name.trim(),
          targetValue,
          unit: defaultGoalUnit(g.type),
          note: g.note.trim() || undefined,
          selectedIds: needsPicker(g.type) ? g.selectedIds : undefined,
          selectedLabels: needsPicker(g.type) ? g.selectedLabels : undefined,
        }
      })

      const saved = await datasource.upsertPlan({
        id,
        name,
        description,
        startDate,
        endDate,
        regionLabel,
        mainRegionId: mainRegionId || null,
        subRegionId: subRegionId || null,
        repIds,
        goals: mappedGoals,
        status: 'in_progress',
      })
      success('تم حفظ الخطة — ستظهر للمندوب والمفوتر حسب التكليف')
      navigate(`/plans/${saved.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل الحفظ'
      setError(msg)
      fail(msg)
    } finally {
      setBusy(false)
    }
  }

  if (loading || !board) {
    return <p className="plans-status">{error ?? 'جاري التحميل...'}</p>
  }

  return (
    <div className="plans">
      <header className="plans-hero">
        <div>
          <h1>
            {isEdit
              ? fromRep
                ? 'مراجعة خطة مقترحة من المندوب'
                : 'تعديل خطة عمل'
              : 'إنشاء خطة عمل'}
          </h1>
          <p>
            الأهداف تُرسل للباكند وتظهر عند المندوب المكلّف. المنطقة اختيارية.
          </p>
        </div>
        <Link className="plans-btn-ghost" to="/plans">
          رجوع
        </Link>
      </header>

      {fromRep ? (
        <div className="plans-banner ok">
          واردة من المندوب: <strong>{fromRep}</strong> — عدّل ثم احفظ لاعتمادها
          وإرسالها.
        </div>
      ) : null}
      {error ? <div className="plans-banner">{error}</div> : null}

      <form className="plans-panel plans-form" onSubmit={onSubmit}>
        <h3>بيانات الخطة</h3>
        <div className="plans-form-grid">
          <label className="full">
            اسم الخطة *
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
          <label>
            المنطقة الرئيسية (اختياري)
            <select
              value={mainRegionId}
              onChange={(e) => {
                setMainRegionId(e.target.value)
                setSubRegionId('')
              }}
            >
              <option value="">بدون تقييد منطقة</option>
              {board.regionTree.map((r) => (
                <option key={r.mainId} value={r.mainId}>
                  {r.mainName}
                </option>
              ))}
            </select>
          </label>
          <label>
            المنطقة الفرعية (اختياري)
            <select
              value={subRegionId}
              disabled={!mainRegionId}
              onChange={(e) => setSubRegionId(e.target.value)}
            >
              <option value="">
                {mainRegionId ? 'كل الفرعية / بدون تحديد' : '— اختر رئيسية أولاً —'}
              </option>
              {subOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            الوصف
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>

        <h3 style={{ marginTop: 18 }}>الأهداف</h3>
        {goals.map((goal, idx) => {
          const opts = optionsForGoal(goal)
          const q = goal.search.trim().toLowerCase()
          const filtered = q
            ? opts.filter(
                (o) =>
                  o.name.toLowerCase().includes(q) ||
                  (o.meta?.toLowerCase().includes(q) ?? false),
              )
            : opts
          return (
            <div className="plans-goal-card" key={idx}>
              <div className="plans-goal-name-slot" title="اسم الخطة">
                <span className="plans-goal-name-ghost">
                  {name.trim() || 'اسم الخطة يظهر هنا'}
                </span>
              </div>
              <div className="plans-goal-head">
                <strong>
                  هدف {idx + 1} — {goalTypeLabel(goal.type)}
                </strong>
                {goals.length > 1 ? (
                  <button
                    type="button"
                    className="plans-btn-ghost"
                    onClick={() =>
                      setGoals((list) => list.filter((_, i) => i !== idx))
                    }
                  >
                    حذف
                  </button>
                ) : null}
              </div>
              <div className="plans-form-grid">
                <label>
                  النوع
                  <select
                    value={goal.type}
                    onChange={(e) => {
                      const type = e.target.value as GoalType
                      updateGoal(idx, {
                        type,
                        selectedIds: [],
                        selectedLabels: [],
                        pickerOpen: false,
                        search: '',
                      })
                    }}
                  >
                    {GOAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {goalTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                  <p className="plans-goal-hint">{goalTypeHint(goal.type)}</p>
                </label>
                <label>
                  القيمة المطلوبة *
                  {needsPicker(goal.type) ? (
                    <button
                      type="button"
                      className="plans-value-trigger"
                      onClick={() =>
                        updateGoal(idx, { pickerOpen: !goal.pickerOpen })
                      }
                    >
                      {goal.selectedIds.length
                        ? `محدد: ${goal.selectedIds.length} · القيمة ${goal.targetValue || '—'}`
                        : 'اختر العناصر ثم أدخل القيمة'}
                    </button>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={goal.targetValue}
                      onChange={(e) =>
                        updateGoal(idx, { targetValue: e.target.value })
                      }
                    />
                  )}
                </label>
                {needsPicker(goal.type) && goal.pickerOpen ? (
                  <div className="plans-picker full">
                    <input
                      type="search"
                      placeholder="بحث..."
                      value={goal.search}
                      onChange={(e) =>
                        updateGoal(idx, { search: e.target.value })
                      }
                    />
                    {goal.type === 'specific_pharmacies' && !repIds.length ? (
                      <p className="plans-goal-hint">
                        اختر المندوب أولاً لعرض صيدلياته
                      </p>
                    ) : null}
                    <div className="plans-picker-list">
                      {filtered.map((o) => (
                        <label key={o.id} className="plans-check">
                          <input
                            type="checkbox"
                            checked={goal.selectedIds.includes(o.id)}
                            onChange={() => toggleSelect(idx, o)}
                          />
                          {o.name}
                          {o.meta ? (
                            <span className="plans-sub">{o.meta}</span>
                          ) : null}
                        </label>
                      ))}
                      {!filtered.length ? (
                        <p className="plans-goal-hint">لا نتائج</p>
                      ) : null}
                    </div>
                    <label>
                      القيمة الرقمية المطلوبة *
                      <input
                        type="number"
                        min={1}
                        value={goal.targetValue}
                        onChange={(e) =>
                          updateGoal(idx, { targetValue: e.target.value })
                        }
                      />
                    </label>
                    {goal.selectedLabels.length ? (
                      <p className="plans-selected-chips">
                        {goal.selectedLabels.join(' · ')}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <label className="full">
                  ملاحظة الهدف
                  <input
                    value={goal.note}
                    onChange={(e) => updateGoal(idx, { note: e.target.value })}
                  />
                </label>
              </div>
            </div>
          )
        })}
        <button
          type="button"
          className="plans-btn-ghost"
          onClick={() => setGoals((list) => [...list, emptyGoal()])}
        >
          إضافة هدف
        </button>

        <h3 style={{ marginTop: 18 }}>تكليف المندوبين *</h3>
        <div className="plans-checks">
          {availableReps.map((r) => (
            <label key={r.id} className="plans-check">
              <input
                type="checkbox"
                checked={repIds.includes(r.id)}
                onChange={() => toggleRep(r.id)}
              />
              {r.name}
              <span className="plans-sub">
                {r.region} · {r.pharmacyCount} صيدلية
              </span>
            </label>
          ))}
        </div>

        <div className="plans-footer-actions">
          <button
            type="button"
            className="plans-btn-ghost"
            disabled={busy}
            onClick={() => navigate('/plans')}
          >
            إلغاء
          </button>
          <button type="submit" className="plans-btn" disabled={busy}>
            {busy ? 'جاري الحفظ...' : 'حفظ وإرسال للمندوب'}
          </button>
        </div>
      </form>
    </div>
  )
}
