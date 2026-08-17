/**
 * UC-101→104 — إنشاء / تعديل خطة عمل + تكليف مندوبين
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPlansDatasource } from '../data'
import type { GoalType, PlansBoard } from '../domain/planEntities'
import {
  goalTypeHint,
  goalTypeLabel,
  requirePlanName,
  validatePlanDates,
} from '../domain/planLabels'
import './plans.css'

type GoalForm = {
  type: GoalType
  label: string
  targetValue: string
  unit: string
  note: string
}

const GOAL_TYPES: GoalType[] = [
  'visits',
  'pharmacies',
  'sales',
  'collections',
  'companies',
  'specific_pharmacies',
]

function defaultUnit(type: GoalType): string {
  if (type === 'sales' || type === 'collections') return 'ل.س'
  if (type === 'visits') return 'زيارة'
  if (type === 'pharmacies' || type === 'specific_pharmacies') return 'صيدلية'
  return 'هدف'
}

function emptyGoal(type: GoalType = 'visits'): GoalForm {
  return {
    type,
    label: goalTypeLabel(type),
    targetValue: '',
    unit: defaultUnit(type),
    note: '',
  }
}

export function PlanWizardPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const datasource = useMemo(() => getPlansDatasource(), [])

  const [board, setBoard] = useState<PlansBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [regionLabel, setRegionLabel] = useState('')
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
          setRegionLabel(plan.regionLabel)
          setRepIds([...plan.repIds])
          setGoals(
            plan.goals.map((g) => ({
              type: g.type,
              label: g.label,
              targetValue: String(g.targetValue),
              unit: g.unit,
              note: g.note ?? '',
            })),
          )
        } else {
          const t = new Date().toISOString().slice(0, 10)
          setStartDate(t)
          setEndDate(t)
          setRegionLabel(next.regionOptions[0] ?? '')
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

  function toggleRep(repId: string) {
    setRepIds((list) =>
      list.includes(repId)
        ? list.filter((x) => x !== repId)
        : [...list, repId],
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      requirePlanName(name)
      validatePlanDates(startDate, endDate)
      if (!regionLabel.trim()) throw new Error('المنطقة مطلوبة')
      if (!repIds.length) throw new Error('حدد مندوباً واحداً على الأقل')
      if (!goals.length) throw new Error('أضف هدفاً واحداً على الأقل')

      const mappedGoals = goals.map((g, i) => {
        const targetValue = Number(g.targetValue)
        if (!g.label.trim()) {
          throw new Error(`هدف رقم ${i + 1}: العنوان مطلوب`)
        }
        if (!(targetValue > 0)) {
          throw new Error(`هدف رقم ${i + 1}: القيمة يجب أن تكون أكبر من صفر`)
        }
        return {
          type: g.type,
          label: g.label.trim(),
          targetValue,
          unit: g.unit.trim() || defaultUnit(g.type),
          note: g.note.trim() || undefined,
        }
      })

      const saved = await datasource.upsertPlan({
        id,
        name,
        description,
        startDate,
        endDate,
        regionLabel,
        repIds,
        goals: mappedGoals,
        status: 'in_progress',
      })
      navigate(`/plans/${saved.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل الحفظ')
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
          <h1>{isEdit ? 'تعديل خطة عمل' : 'إنشاء خطة عمل'}</h1>
          <p>حدد البيانات والأهداف ثم كلّف مندوباً أو مجموعة مندوبين.</p>
        </div>
        <Link className="plans-btn-ghost" to="/plans">
          رجوع
        </Link>
      </header>

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
            المنطقة *
            <select
              value={regionLabel}
              onChange={(e) => setRegionLabel(e.target.value)}
            >
              {board.regionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
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
        {goals.map((goal, idx) => (
          <div className="plans-goal-card" key={idx}>
            <div className="plans-goal-head">
              <strong>هدف {idx + 1}</strong>
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
                    setGoals((list) =>
                      list.map((row, i) =>
                        i === idx
                          ? {
                              ...row,
                              type,
                              label: goalTypeLabel(type),
                              unit: defaultUnit(type),
                            }
                          : row,
                      ),
                    )
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
                العنوان *
                <input
                  value={goal.label}
                  onChange={(e) =>
                    setGoals((list) =>
                      list.map((row, i) =>
                        i === idx ? { ...row, label: e.target.value } : row,
                      ),
                    )
                  }
                />
              </label>
              <label>
                القيمة المطلوبة *
                <input
                  type="number"
                  min={1}
                  value={goal.targetValue}
                  onChange={(e) =>
                    setGoals((list) =>
                      list.map((row, i) =>
                        i === idx
                          ? { ...row, targetValue: e.target.value }
                          : row,
                      ),
                    )
                  }
                />
              </label>
              <label>
                الوحدة
                <input
                  value={goal.unit}
                  onChange={(e) =>
                    setGoals((list) =>
                      list.map((row, i) =>
                        i === idx ? { ...row, unit: e.target.value } : row,
                      ),
                    )
                  }
                />
              </label>
              <label className="full">
                ملاحظة الهدف
                <input
                  value={goal.note}
                  onChange={(e) =>
                    setGoals((list) =>
                      list.map((row, i) =>
                        i === idx ? { ...row, note: e.target.value } : row,
                      ),
                    )
                  }
                />
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="plans-btn-ghost"
          onClick={() => setGoals((list) => [...list, emptyGoal()])}
        >
          إضافة هدف
        </button>

        <h3 style={{ marginTop: 18 }}>تكليف المندوبين *</h3>
        <div className="plans-checks">
          {board.repOptions.map((r) => (
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
            {busy ? 'جاري الحفظ...' : 'حفظ الخطة'}
          </button>
        </div>
      </form>
    </div>
  )
}
